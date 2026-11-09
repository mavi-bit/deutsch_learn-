import { useState } from "react";
import { useAuth } from "../context/AuthContext";
import { errMsg } from "../api";
import { Button, Card, ErrorBox, Page } from "../components/ui";

const LEVELS = [["A1", "Complete beginner"], ["A2", "Elementary"], ["B1", "Intermediate"], ["B2", "Upper intermediate"], ["C1", "Advanced"], ["C2", "Proficient"]];

export default function SettingsPage() {
  const { user, saveSettings, logout } = useAuth();
  const [name, setName] = useState(user.name);
  const [goal, setGoal] = useState(user.settings.daily_goal_minutes);
  const [msg, setMsg] = useState("");
  const [err, setErr] = useState("");
  const save = async (patch, ok = "Saved.") => { setErr(""); setMsg(""); try { await saveSettings(patch); setMsg(ok); } catch (e) { setErr(errMsg(e)); } };

  return (
    <Page title="Settings">
      <div className="max-w-xl space-y-5">
        <ErrorBox error={err} />{msg && <div className="rounded-xl bg-ok/10 p-3 text-sm text-ok" role="status">{msg}</div>}
        <Card className="space-y-3"><h2 className="text-lg font-bold">Profile</h2>
          <input className="input" value={name} onChange={(e) => setName(e.target.value)} aria-label="Name" />
          <div className="text-sm text-muted">{user.email}</div>
          <Button disabled={!name.trim()} onClick={() => save({ name })}>Save name</Button></Card>
        <Card className="space-y-3"><h2 className="text-lg font-bold">German level</h2>
          <p className="text-sm text-muted">Sets the AI tutor’s difficulty and your recommended lessons. You can still open any lesson.</p>
          <div className="grid gap-2 sm:grid-cols-2">{LEVELS.map(([l, d]) => <button key={l} onClick={() => save({ level: l }, `Level set to ${l}.`)} className={`rounded-xl border px-3 py-2 text-left text-sm ${user.settings.level === l ? "border-brand bg-brandsoft" : "border-line hover:bg-brandsoft"}`}><strong>{l}</strong> <span className="text-muted">{d}</span></button>)}</div></Card>
        <Card className="space-y-3"><h2 className="text-lg font-bold">Daily goal</h2>
          <div className="flex items-center gap-3"><input type="range" min="5" max="120" step="5" value={goal} onChange={(e) => setGoal(+e.target.value)} className="flex-1" aria-label="Daily goal minutes" /><span className="w-16 text-sm">{goal} min</span></div>
          <Button onClick={() => save({ daily_goal_minutes: goal })}>Save goal</Button></Card>
        <Card className="space-y-3"><h2 className="text-lg font-bold">Appearance</h2>
          <div className="flex gap-2">{["light", "dark"].map((t) => <Button key={t} variant={user.settings.theme === t ? "primary" : "ghost"} onClick={() => save({ theme: t }, "Theme updated.")}>{t === "light" ? "Light" : "Dark"}</Button>)}</div></Card>
        <Button variant="danger" onClick={logout}>Log out</Button>
      </div>
    </Page>
  );
}
