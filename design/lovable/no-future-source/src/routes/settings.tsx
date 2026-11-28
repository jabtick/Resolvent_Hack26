import { createFileRoute } from "@tanstack/react-router";
import { Switch } from "@/components/ui/switch";
import { Nav } from "@/components/Nav";
import { THEMES, useTheme } from "@/lib/theme";

export const Route = createFileRoute("/settings")({
  head: () => ({ meta: [
    { title: "Settings — NO FUTURE?" }, { name: "description", content: "Theme, notifications and account settings." },
    { property: "og:title", content: "Settings — NO FUTURE?" }, { property: "og:description", content: "Theme, notifications and account settings." },
    { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary" },
  ] }),
  component: SettingsPage,
});

function SettingsPage() {
  const [theme, setTheme] = useTheme();
  const rows = ["Email me new matches", "Deadline reminders", "Show my profile to organisers", "Weekly zine digest"];
  return (
    <div className="min-h-screen">
      <Nav />
      <main className="mx-auto max-w-2xl space-y-6 px-4 py-8">
        <h1 className="font-heavy text-6xl">SETTINGS</h1>
        <section className="zine bg-card p-5"><h2 className="mb-3 font-heavy text-3xl"><span className="ransom">THEME</span></h2>
          <div className="grid grid-cols-3 gap-3">{THEMES.map((t) => <button key={t.id} onClick={() => setTheme(t.id)} className={`jitter border-[3px] border-ink py-4 font-heavy text-2xl ${theme === t.id ? "bg-primary text-primary-foreground" : "bg-card"}`}>{t.label}</button>)}</div></section>
        <section className="zine bg-card p-5"><h2 className="mb-3 font-heavy text-3xl"><span className="ransom">NOTIFICATIONS</span></h2>
          <div className="divide-y-2 divide-dashed divide-ink">{rows.map((r, i) => <label key={r} className="flex items-center justify-between py-3"><span>{r}</span><Switch defaultChecked={i < 2} /></label>)}</div></section>
        <section className="zine bg-card p-5"><h2 className="mb-3 font-heavy text-3xl"><span className="ransom">ACCOUNT</span></h2>
          <p className="text-sm">Role: <b>Candidate</b></p>
          <button className="mt-4 border-[3px] border-destructive px-4 py-2 font-heavy text-xl text-destructive">DELETE ACCOUNT</button></section>
      </main>
    </div>
  );
}
