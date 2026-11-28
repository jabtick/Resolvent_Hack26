import { Link } from "@tanstack/react-router";
import {
  Award,
  Bookmark,
  CalendarDays,
  Home,
  LogIn,
  LogOut,
  Menu,
  Palette,
  Settings,
  User,
} from "lucide-react";
import { useState } from "react";

import { useAccount } from "@/components/AccountProvider";
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { THEMES, useTheme } from "@/lib/theme";

const BRAND = "NO FUTURE?";

export function Nav() {
  const { status, signOut } = useAccount();
  const signedIn = status === "signedIn";
  const [theme, setTheme] = useTheme();
  const [open, setOpen] = useState(false);
  const item =
    "jitter flex items-center gap-3 border-[3px] border-ink bg-card px-4 py-3 font-heavy text-2xl transition-colors hover:bg-accent [&.active]:bg-primary [&.active]:text-primary-foreground";
  return (
    <header className="sticky top-0 z-30 border-b-[3px] border-ink bg-background/95 backdrop-blur-sm">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
        <Link to="/" className="font-display text-3xl text-primary md:text-4xl">
          {BRAND}
        </Link>
        <div className="flex items-center gap-3">
          <Link
            to="/calendar"
            aria-label="Календар"
            title="Календар"
            className="zine jitter grid h-11 w-11 place-items-center bg-secondary text-secondary-foreground"
          >
            <CalendarDays />
          </Link>
          <Link
            to={signedIn ? "/profile" : "/join"}
            className="zine-pink jitter hidden bg-ink px-4 py-1 font-heavy text-xl text-paper sm:block"
          >
            {signedIn ? "ПРОФИЛ" : "ВХОД"}
          </Link>
          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger
              aria-label="Меню"
              className="zine jitter grid h-11 w-11 place-items-center bg-secondary text-secondary-foreground"
            >
              <Menu />
            </SheetTrigger>
            <SheetContent className="w-80 overflow-y-auto border-l-[3px] border-ink bg-background p-5">
              <SheetTitle className="mb-6 font-display text-4xl text-primary">МЕНЮ</SheetTitle>
              <nav className="space-y-3" onClick={() => setOpen(false)}>
                <Link to="/" className={item} activeOptions={{ exact: true }}>
                  <Home />
                  Фийд
                </Link>
                <Link to="/calendar" className={item}>
                  <CalendarDays />
                  Календар
                </Link>
                {signedIn && (
                  <>
                    <Link to="/profile" className={item}>
                      <User />
                      Профил
                    </Link>
                    <Link to="/achievements" className={item}>
                      <Award />
                      Значки
                    </Link>
                    <Link to="/saved" className={item}>
                      <Bookmark />
                      Запазени
                    </Link>
                    <Link to="/settings" className={item}>
                      <Settings />
                      Настройки
                    </Link>
                    <button
                      type="button"
                      className={`${item} w-full`}
                      onClick={() => void signOut()}
                    >
                      <LogOut />
                      Изход
                    </button>
                  </>
                )}
                {!signedIn && (
                  <Link to="/join" className={item}>
                    <LogIn />
                    Вход / Регистрация
                  </Link>
                )}
              </nav>
              <div className="mt-8">
                <p className="mb-2 flex items-center gap-2 font-hand text-2xl">
                  <Palette className="h-5 w-5" />
                  избери визия
                </p>
                <div className="grid grid-cols-3 gap-2">
                  {THEMES.map((t) => (
                    <button
                      key={t.id}
                      onClick={() => setTheme(t.id)}
                      className={`border-[3px] border-ink py-2 font-heavy text-lg transition-colors ${theme === t.id ? "bg-primary text-primary-foreground" : "bg-card hover:bg-accent"}`}
                    >
                      {t.label}
                    </button>
                  ))}
                </div>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}
