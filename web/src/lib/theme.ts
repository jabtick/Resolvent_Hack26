import { useEffect, useState } from "react";
export type Theme = "zine" | "dark" | "acid";
export const THEMES: { id: Theme; label: string }[] = [
  { id: "zine", label: "Светла" },
  { id: "dark", label: "Тъмна" },
  { id: "acid", label: "Цветна" },
];
export function applyTheme(t: Theme) {
  const el = document.documentElement;
  el.classList.remove("dark", "acid");
  if (t !== "zine") el.classList.add(t);
  localStorage.setItem("theme", t);
}
export function useTheme() {
  const [theme, setTheme] = useState<Theme>("zine");
  useEffect(() => {
    const t = (localStorage.getItem("theme") as Theme) || "zine";
    setTheme(t);
    applyTheme(t);
  }, []);
  return [
    theme,
    (t: Theme) => {
      setTheme(t);
      applyTheme(t);
    },
  ] as const;
}
