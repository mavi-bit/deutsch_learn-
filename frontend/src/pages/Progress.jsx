import { useEffect, useState } from "react";
import { BookOpen, CheckCircle2, Mic, MessageSquare } from "lucide-react";
import api, { errMsg } from "../api";
import { Card, ErrorBox, Page, ProgressBar, Spinner, fmtTime } from "../components/ui";

const ICON = { lesson_completed: <CheckCircle2 size={16} className="text-ok" />, quiz: <BookOpen size={16} className="text-brand" />, speaking: <Mic size={16} className="text-gold" /> };

export default function Progress() {
  const [p, setP] = useState(null);
  const [h, setH] = useState([]);
  const [err, setErr] = useState("");
  useEffect(() => {
    Promise.all([api.get("/progress"), api.get("/progress/history")]).then(([a, b]) => { setP(a.data); setH(b.data); }).catch((e) => setErr(errMsg(e)));
  }, []);
  if (err) return <Page title="Progress"><ErrorBox error={err} /></Page>;
  if (!p) return <Spinner />;
  const max = Math.max(60, ...p.activity.map((a) => a.seconds));
  return (
    <Page title="Progress" subtitle="Everything here is saved in your account, so it follows you across devices.">
      <div className="mb-6 grid grid-cols-2 gap-3 md:grid-cols-4">
        {[["Streak", `${p.streak} days`], ["Total time", fmtTime(p.total_seconds)], ["Words saved", p.vocab_count], ["Speaking sessions", p.speaking_sessions]].map(([l, v]) => <Card key={l}><div className="font-display text-2xl font-bold">{v}</div><div className="text-sm text-muted">{l}</div></Card>)}
      </div>
      <div className="grid gap-6 md:grid-cols-2">
        <Card><h2 className="mb-4 text-lg font-bold">Lessons completed by level</h2>
          <div className="space-y-3">{p.levels.map((l) => <div key={l.level}><div className="mb-1 flex justify-between text-sm"><span className="font-semibold">{l.level}</span><span className="text-muted">{l.completed}/{l.total}</span></div><ProgressBar value={l.total ? (100 * l.completed) / l.total : 0} /></div>)}</div></Card>
        <Card><h2 className="mb-4 text-lg font-bold">Study time, last 14 days</h2>
          <div className="flex h-40 items-end gap-1.5">{p.activity.map((a) => <div key={a.day} className="flex flex-1 flex-col items-center gap-1"><div title={`${Math.round(a.seconds / 60)} min`} className="w-full rounded-t bg-brand" style={{ height: `${Math.max(3, (a.seconds / max) * 100)}%` }} /><span className="text-[10px] text-muted">{a.day.slice(8)}</span></div>)}</div></Card>
        <Card><h2 className="mb-3 text-lg font-bold">Quiz scores</h2>
          {p.recent_quizzes.length === 0 ? <p className="text-muted">No quiz results yet.</p> : p.recent_quizzes.map((q, i) => <div key={i} className="mb-3"><div className="mb-1 flex justify-between text-sm"><span className="truncate pr-2">{q.lesson_title}</span><span className="font-semibold">{q.score}/{q.total}</span></div><ProgressBar value={(100 * q.score) / q.total} /></div>)}</Card>
        <Card><h2 className="mb-3 text-lg font-bold">Learning history</h2>
          {h.length === 0 ? <p className="text-muted">Your activity will show up here.</p> : <ul className="max-h-72 space-y-2 overflow-y-auto">{h.map((x, i) => <li key={i} className="flex items-center gap-2 text-sm">{ICON[x.type]}<span className="min-w-0 flex-1 truncate">{x.title}</span><span className="text-muted">{x.detail}</span></li>)}</ul>}</Card>
      </div>
    </Page>
  );
}
