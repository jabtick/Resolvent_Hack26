// Account state for the whole site: who is signed in, how far sign-up got,
// and the actions that move it on. Pages call these, never Supabase directly.
import { useQueryClient } from "@tanstack/react-query";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

import { supabase } from "@/integrations/supabase/client";
import { api } from "@/lib/api";
import type { AccountStatus, AccountType, NewProfile } from "@/lib/auth";

type Status = AccountStatus | "loading";

type Account = {
  status: Status;
  /** Email waiting for its code (sign-up started, not confirmed). */
  pendingEmail: string | null;
  /** The side picked on /join before the account exists. */
  side: AccountType | null;
  setSide: (s: AccountType | null) => void;
  signUp: (email: string, password: string) => Promise<void>;
  resendCode: () => Promise<void>;
  confirmCode: (code: string) => Promise<void>;
  signIn: (email: string, password: string) => Promise<void>;
  createProfile: (p: NewProfile) => Promise<void>;
  sendPasswordReset: (email: string) => Promise<void>;
  resetPassword: (email: string, code: string, password: string) => Promise<void>;
  startOver: () => Promise<void>;
  signOut: () => Promise<void>;
  deleteAccount: () => Promise<void>;
};

const AccountContext = createContext<Account | null>(null);

// Survive a reload in the middle of sign-up (storage may be blocked).
function load(key: string): string | null {
  try {
    return sessionStorage.getItem(key);
  } catch {
    return null;
  }
}
function save(key: string, value: string | null) {
  try {
    if (value == null) sessionStorage.removeItem(key);
    else sessionStorage.setItem(key, value);
  } catch {
    /* private mode: keep it in memory only */
  }
}

export function AccountProvider({ children }: { children: ReactNode }) {
  const cache = useQueryClient();
  const [status, setStatus] = useState<Status>("loading");
  const [pendingEmail, setPendingEmailState] = useState<string | null>(null);
  const [side, setSideState] = useState<AccountType | null>(null);

  const setPendingEmail = useCallback((e: string | null) => {
    setPendingEmailState(e);
    save("nf.pendingEmail", e);
  }, []);
  const setSide = useCallback((s: AccountType | null) => {
    setSideState(s);
    save("nf.side", s);
  }, []);

  useEffect(() => {
    let active = true;
    const email = load("nf.pendingEmail");
    setSideState(load("nf.side") as AccountType | null);
    void api.auth.restore().then((s) => {
      if (!active) return;
      if (s === "signedOut" && email) {
        setPendingEmailState(email);
        setStatus("awaitingCode");
      } else {
        setStatus(s);
      }
    });
    // Another tab signed out, or the session expired.
    const { data } = supabase.auth.onAuthStateChange((event) => {
      if (event === "SIGNED_OUT" && active) {
        setStatus("signedOut");
        cache.clear();
      }
    });
    return () => {
      active = false;
      data.subscription.unsubscribe();
    };
  }, [cache]);

  const account = useMemo<Account>(() => {
    const finishSignUp = (s: AccountStatus) => {
      if (s !== "awaitingCode") setPendingEmail(null);
      setStatus(s);
      void cache.invalidateQueries();
    };
    return {
      status,
      pendingEmail,
      side,
      setSide,
      async signUp(email, password) {
        await api.auth.signUp(email, password);
        setPendingEmail(email.trim().toLowerCase());
        setStatus("awaitingCode");
      },
      async resendCode() {
        if (pendingEmail) await api.auth.resendCode(pendingEmail);
      },
      async confirmCode(code) {
        finishSignUp(await api.auth.confirmCode(pendingEmail ?? "", code));
      },
      async signIn(email, password) {
        const s = await api.auth.signIn(email, password);
        if (s === "awaitingCode") setPendingEmail(email.trim().toLowerCase());
        finishSignUp(s);
      },
      async createProfile(p) {
        await api.auth.createProfile(p);
        setSide(null);
        setStatus("signedIn");
        void cache.invalidateQueries();
      },
      sendPasswordReset: (email) => api.auth.sendPasswordReset(email),
      async resetPassword(email, code, password) {
        finishSignUp(await api.auth.resetPassword(email, code, password));
      },
      async startOver() {
        setPendingEmail(null);
        await api.auth.signOut();
        setStatus("signedOut");
      },
      async signOut() {
        await api.auth.signOut();
        setStatus("signedOut");
        cache.clear();
      },
      async deleteAccount() {
        await api.auth.deleteAccount();
        setStatus("signedOut");
        cache.clear();
      },
    };
  }, [status, pendingEmail, side, setSide, setPendingEmail, cache]);

  return <AccountContext.Provider value={account}>{children}</AccountContext.Provider>;
}

export function useAccount(): Account {
  const a = useContext(AccountContext);
  if (!a) throw new Error("useAccount outside AccountProvider");
  return a;
}
