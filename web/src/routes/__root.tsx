import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  createRootRouteWithContext,
  HeadContent,
  Link,
  Outlet,
  Scripts,
  useLocation,
  useNavigate,
  useRouter,
  type ErrorComponentProps,
} from "@tanstack/react-router";
import { useEffect, type ReactNode } from "react";

import { AccountProvider, useAccount } from "@/components/AccountProvider";
import { Nav } from "@/components/Nav";
import { Toaster } from "@/components/ui/sonner";
import { authRedirect } from "@/lib/redirect";

import appCss from "../styles.css?url";

export const BRAND = "NO FUTURE?";

function NotFoundComponent() {
  return (
    <div className="min-h-screen">
      <Nav />
      <main className="mx-auto max-w-xl px-4 py-20 text-center">
        <p className="font-display text-8xl text-primary">404</p>
        <h1 className="mt-4 font-heavy text-5xl">ТУК НЯМА НИЩО</h1>
        <p className="mt-2 font-hand text-2xl">страницата я няма или е преместена</p>
        <Link
          to="/"
          className="zine-pink jitter mt-8 inline-block bg-ink px-6 py-3 font-heavy text-2xl text-paper"
        >
          КЪМ ФИЙДА
        </Link>
      </main>
    </div>
  );
}

function ErrorComponent({ error, reset }: ErrorComponentProps) {
  console.error(error);
  const router = useRouter();
  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <div className="zine max-w-md bg-card p-8 text-center">
        <h1 className="font-heavy text-4xl">СТРАНИЦАТА НЕ СЕ ЗАРЕДИ</h1>
        <p className="mt-2 text-sm text-muted-foreground">Нещо се обърка при нас. Опитай пак.</p>
        <div className="mt-6 flex flex-wrap justify-center gap-3">
          <button
            onClick={() => {
              void router.invalidate();
              reset();
            }}
            className="zine-pink jitter bg-ink px-4 py-2 font-heavy text-xl text-paper"
          >
            ПАК
          </button>
          <a href="/" className="jitter border-[3px] border-ink px-4 py-2 font-heavy text-xl">
            КЪМ ФИЙДА
          </a>
        </div>
      </div>
    </div>
  );
}

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  head: () => ({
    // Each content route sets its own title/description. Never add og:image here:
    // every page without its own would inherit it.
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: `${BRAND} — възможности за ученици и студенти` },
      {
        name: "description",
        content: "Състезания, стипендии, стажове и постижения, доказани от организаторите.",
      },
      { property: "og:site_name", content: BRAND },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
    links: [
      { rel: "stylesheet", href: appCss },
      { rel: "icon", href: "/favicon.ico", type: "image/x-icon" },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

function RootShell({ children }: { children: ReactNode }) {
  return (
    <html lang="bg">
      <head>
        <HeadContent />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

/** Sends people where their account state allows (see lib/redirect.ts). */
function AuthGate() {
  const { status } = useAccount();
  const { pathname } = useLocation();
  const navigate = useNavigate();
  useEffect(() => {
    if (status === "loading") return;
    const to = authRedirect(status, pathname);
    if (to && to !== pathname) void navigate({ to, replace: true });
  }, [status, pathname, navigate]);
  return null;
}

function RootComponent() {
  const { queryClient } = Route.useRouteContext();
  return (
    <QueryClientProvider client={queryClient}>
      <AccountProvider>
        <AuthGate />
        <Outlet />
      </AccountProvider>
      <Toaster />
    </QueryClientProvider>
  );
}
