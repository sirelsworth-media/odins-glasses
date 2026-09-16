import { useEffect, useState } from "react";
type Theme = "classic" | "aurora" | "nocturne";
declare global { interface Window { odinsGlassesAppearance?: { load: () => Promise<Theme>; save: (theme: Theme) => Promise<void> } } }
export default function ThemeSwitch({ lang }: { lang: "de" | "en" }) {
  const [theme, setTheme] = useState<Theme>(() => {
    try { const saved = localStorage.getItem("odins-glasses-theme"); return saved === "classic" || saved === "nocturne" ? saved : "aurora"; } catch { return "aurora"; }
  });
  const [ready, setReady] = useState(!window.odinsGlassesAppearance);
  useEffect(() => {
    let active = true;
    window.odinsGlassesAppearance?.load().then(value => { if (active) { setTheme(value === "classic" || value === "nocturne" ? value : "aurora"); setReady(true); } }).catch(() => { if (active) setReady(true); });
    return () => { active = false; };
  }, []);
  useEffect(() => { document.documentElement.dataset.theme = theme; }, [theme]);
  function choose(value: Theme) {
    setTheme(value);
    try { localStorage.setItem("odins-glasses-theme", value); } catch { /* Storage is optional in preview mode. */ }
    void window.odinsGlassesAppearance?.save(value).catch(() => {});
  }
  return <div className="themeSwitch" role="group" aria-label={lang === "de" ? "Design auswählen" : "Choose design"}>
    {(["classic", "aurora", "nocturne"] as const).map(value => <button type="button" key={value} disabled={!ready} aria-pressed={theme === value} onClick={() => choose(value)}><span className={`themeSwatch ${value}`} />{value === "classic" ? "Classic" : value === "aurora" ? "Aurora" : "Nocturne"}</button>)}
  </div>;
}
