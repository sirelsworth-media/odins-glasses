import type { ReactNode } from "react";

// Original, dependency-free line icons with a shared 24px grid.
const shapes: Record<string, ReactNode> = {
  money: <><ellipse cx="12" cy="6" rx="8" ry="3"/><path d="M4 6v12c0 4 16 4 16 0V6M4 12c0 4 16 4 16 0"/></>,
  classes: <><path d="M3 4h7l2 2 2-2h7v16h-7l-2 2-2-2H3ZM12 6v16"/></>,
  hunt: <><circle cx="12" cy="12" r="7"/><circle cx="12" cy="12" r="3"/><path d="M12 2v4m0 12v4M2 12h4m12 0h4"/></>,
  search: <><path d="m6 8-2-5 6 3m8 2 2-5-6 3M5 11c0-4 14-4 14 0v4c0 7-14 7-14 0Z"/><path d="M9 13h.01M15 13h.01m-6 4h6"/></>,
  items: <><path d="m3 7 9-4 9 4v11l-9 4-9-4Zm0 0 9 4 9-4M12 11v11M7 5l10 4"/></>,
  crafting: <><path d="M9 3h6m-5 0v6L4 19q-1 2 2 2h12q3 0 2-2L14 9V3M7 15h10"/><circle cx="11" cy="18" r=".5"/></>,
  fields: <><path d="m3 5 6-2 6 3 6-2v15l-6 2-6-3-6 2Zm6-2v15m6-12v15"/><path d="m5 11 2-1m4 2 2 1m4 0 2-1"/></>,
  specials: <><path d="m12 2 3 7 7 3-7 3-3 7-3-7-7-3 7-3Z"/><path d="m19 2 1 2 2 1"/></>,
  dungeons: <><path d="M3 21V10l4-7h10l4 7v11ZM8 21v-8a4 4 0 0 1 8 0v8M7 3l3 3m7-3-3 3"/></>,
};
export default function NavigationIcon({ name }: { name: string }) {
  return <svg className="navigationIcon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{shapes[name] || shapes.hunt}</svg>;
}
