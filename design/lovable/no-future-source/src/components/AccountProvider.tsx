import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import type { User } from '@supabase/supabase-js';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { AccountRole } from '@/lib/events';

const AccountContext = createContext<{ user: User | null; loading: boolean; role: AccountRole | null }>({ user: null, loading: true, role: null });
export function AccountProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const cache = useQueryClient();
  useEffect(() => {
    let active = true;
    const sync = async () => {
      const { data } = await supabase.auth.getUser();
      if (active) { setUser(data.user); setLoading(false); }
    };
    void sync();
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'SIGNED_IN' || event === 'SIGNED_OUT' || event === 'USER_UPDATED') {
        if (event === 'SIGNED_OUT') { setUser(null); cache.clear(); }
        else { void sync(); void cache.invalidateQueries(); }
      }
    });
    return () => { active = false; subscription.unsubscribe(); };
  }, [cache]);
  const { data: role } = useQuery({ queryKey: ['role', user?.id], enabled: Boolean(user), queryFn: async () => {
    const { data, error } = await supabase.from('user_roles').select('role').eq('user_id', user?.id ?? '').maybeSingle();
    if (error) throw error;
    return data?.role ?? null;
  }});
  return <AccountContext.Provider value={{ user, loading, role: role ?? null }}>{children}</AccountContext.Provider>;
}
export function useAccount() { return useContext(AccountContext); }