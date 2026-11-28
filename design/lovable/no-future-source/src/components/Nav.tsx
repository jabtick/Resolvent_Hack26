import { Link } from "@tanstack/react-router";
import { Menu, Home, User, Settings, LogIn, Bookmark, Bell, HelpCircle, Palette, CalendarDays, Plus, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAccount } from "@/components/AccountProvider";
import { supabase } from "@/integrations/supabase/client";
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from "@/components/ui/sheet";
import { THEMES, useTheme } from "@/lib/theme";
import { useState } from "react";

export function Nav() {
  const { user, role } = useAccount();
  const [theme, setTheme] = useTheme();
  const [open, setOpen] = useState(false);
  const item = "jitter flex items-center gap-3 border-[3px] border-ink bg-card px-4 py-3 font-heavy text-2xl [&.active]:bg-primary [&.active]:text-primary-foreground";
  return (
    <header className="sticky top-0 z-30 border-b-[3px] border-ink bg-background">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
        <Link to="/" className="font-display text-3xl text-primary md:text-4xl">NO FUTURE?</Link>
        <div className="flex items-center gap-3">
          <Button asChild variant="secondary" size="icon" title="Calendar"><Link to="/calendar" aria-label="Calendar"><CalendarDays /></Link></Button>
          <Link to="/join" className="zine-pink jitter hidden bg-ink px-4 py-1 font-heavy text-xl text-paper sm:block">{user ? 'ACCOUNT' : 'JOIN'}</Link>
          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger aria-label="Open menu" className="zine jitter grid h-11 w-11 place-items-center bg-secondary text-secondary-foreground"><Menu /></SheetTrigger>
            <SheetContent className="w-80 overflow-y-auto border-l-[3px] border-ink bg-background p-5">
              <SheetTitle className="mb-6 font-display text-4xl text-primary">MENU</SheetTitle>
              <nav className="space-y-3" onClick={() => setOpen(false)}>
                <Link to="/" className={item} activeOptions={{ exact: true }}><Home />Feed</Link>
                <Link to="/profile" className={item}><User />Profile</Link>
                <Link to="/calendar" className={item}><CalendarDays />Calendar</Link>
                {role === 'organiser' && <Link to="/calendar" className={item}><Plus />Organiser events</Link>}
                <Link to="/saved" className={item}><Bookmark />Saved</Link>
                <Link to="/settings" className={item}><Settings />Settings</Link>
                <Link to="/join" className={item}><LogIn />{user ? 'Account' : 'Sign up / Log in'}</Link>
                {user && <Button variant="outline" className="w-full justify-start font-heavy text-2xl" onClick={() => void supabase.auth.signOut()}><LogOut />Log out</Button>}
              </nav>
              <div className="mt-8">
                <p className="mb-2 flex items-center gap-2 font-hand text-xl"><Palette className="h-5 w-5" />pick your vibe</p>
                <div className="grid grid-cols-3 gap-2">
                  {THEMES.map((t) => (
                    <button key={t.id} onClick={() => setTheme(t.id)} className={`border-[3px] border-ink py-2 font-heavy text-lg ${theme === t.id ? "bg-primary text-primary-foreground" : "bg-card"}`}>{t.label}</button>
                  ))}
                </div>
              </div>
              <div className="mt-8 space-y-2 text-sm">
                <p className="flex items-center gap-2"><Bell className="h-4 w-4" />3 new opportunities today</p>
                <p className="flex items-center gap-2"><HelpCircle className="h-4 w-4" />Help & how it works</p>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}
