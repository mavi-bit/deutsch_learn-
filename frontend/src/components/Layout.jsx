import { useState } from "react";
import { NavLink, Outlet } from "react-router-dom";
import { BarChart3, BookOpen, GraduationCap, Headphones, Languages, LayoutDashboard, LogOut, Menu, MessageCircle, Mic, Moon, Settings, Sun, X } from "lucide-react";
import { useAuth } from "../context/AuthContext";

const NAV = [
  ["/", "Dashboard", LayoutDashboard], ["/lessons", "Lessons", BookOpen], ["/chat", "AI Tutor", MessageCircle], ["/live", "Live Teacher", Headphones],
  ["/speaking", "Speaking", Mic], ["/vocabulary", "Vocabulary", Languages], ["/grammar", "Grammar", GraduationCap],
  ["/progress", "Progress", BarChart3], ["/settings", "Settings", Settings],
];

export default function Layout() {
  const { user, logout, saveSettings } = useAuth();
  const [open, setOpen] = useState(false);
  const dark = user.settings.theme === "dark";

  const nav = (
    <nav className="flex flex-1 flex-col gap-1">
      {NAV.map(([to, label, Icon]) => (
        <NavLink key={to} to={to} end={to === "/"} onClick={() => setOpen(false)}
          className={({ isActive }) => `flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition ${isActive ? "bg-brand text-white" : "text-muted hover:bg-brandsoft hover:text-ink"}`}>
          <Icon size={18} /> {label}
        </NavLink>
      ))}
    </nav>
  );
  const footer = (
    <div className="mt-4 space-y-2 border-t border-line pt-4">
      <div className="px-3 text-sm"><div className="font-semibold">{user.name}</div><div className="text-muted">Level {user.settings.level}</div></div>
      <button onClick={() => saveSettings({ theme: dark ? "light" : "dark" })} className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-muted hover:bg-brandsoft">
        {dark ? <Sun size={18} /> : <Moon size={18} />} {dark ? "Light mode" : "Dark mode"}
      </button>
      <button onClick={logout} className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-muted hover:bg-brandsoft"><LogOut size={18} /> Log out</button>
    </div>
  );
  const brand = <div className="mb-6 px-3 font-display text-2xl font-extrabold">Lern<span className="text-gold">werk</span></div>;

  return (
    <div className="min-h-screen md:flex">
      <aside className="sticky top-0 hidden h-screen w-60 shrink-0 flex-col border-r border-line bg-card p-4 md:flex">{brand}{nav}{footer}</aside>
      <header className="sticky top-0 z-20 flex items-center justify-between border-b border-line bg-card px-4 py-3 md:hidden">
        <div className="font-display text-xl font-extrabold">Lern<span className="text-gold">werk</span></div>
        <button aria-label="Menu" onClick={() => setOpen(true)}><Menu /></button>
      </header>
      {open && (
        <div className="fixed inset-0 z-30 md:hidden">
          <div className="absolute inset-0 bg-black/50" onClick={() => setOpen(false)} />
          <aside className="absolute left-0 top-0 flex h-full w-64 flex-col bg-card p-4">
            <button aria-label="Close menu" className="mb-2 self-end" onClick={() => setOpen(false)}><X /></button>{brand}{nav}{footer}
          </aside>
        </div>
      )}
      <main className="min-w-0 flex-1"><Outlet /></main>
    </div>
  );
}
