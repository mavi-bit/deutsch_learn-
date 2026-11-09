import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { BookOpen, Clock, Flame, Languages } from "lucide-react";
import api, { errMsg } from "../api";
import { useAuth } from "../context/AuthContext";
import { Card, ErrorBox, Page, ProgressBar, Spinner, fmtTime } from "../components/ui";

export default function Dashboard() {
  const { user } = useAuth();
  const [p, setP] = useState(null);
  const [err, setErr] = useState("");
  useEffect(() => { api.get("/progress").then((r) => setP(r.data)).catch((e) => setErr(errMsg(e))); }, []);
  if (err) return <Page title="Dashboard"><ErrorBox error={err} /></Page>;
  if (!p) return <Spinner />;

  const next = p.current || p.recommended;
  const goal = Math.min(100, Math.round((p.today_seconds / 60 / p.daily_goal_minutes) * 100));
  const stats = [[Flame, "Day streak", p.streak], [BookOpen, "Lessons done", `${p.completed}/${p.total}`], [Clock, "Time learned", fmtTime(p.total_seconds)], [Languages, "Saved words", p.vocab_count]];
  const max = Math.max(60, ...p.activity.map((a) => a.seconds));

  return (
    <Page title={`Hallo, ${user.name.split(" ")[0]}`} subtitle={`You are studying ${p.level}. ${p.streak > 0 ? `${p.streak}-day streak, keep it going.` : "Finish one lesson today to start a streak."}`}>
      {next ? (
        <Card className="mb-6 flex flex-col gap-6 border-0 bg-brand text-white md:flex-row md:items-center md:justify-between">
          <div>
            <div className="text-sm text-white/70">{p.current ? "Pick up where you stopped" : "Recommended next lesson"}</div>
            <div className="mt-1 flex items-baseline gap-4">
              <span className="font-display text-7xl font-extrabold leading-none text-gold">{next.number}</span>
              <div><div className="text-sm text-white/70">Day · {next.module_title}</div><div className="font-display text-2xl font-bold">{next.title}</div></div>
            </div>
          </div>
          <Link to={`/lessons/${next.id}`} className="rounded-xl bg-white px-6 py-3 text-center font-semibold text-brand hover:bg-gold hover:text-[#1b1400]">{p.current ? "Resume lesson" : "Continue learning"}</Link>
        </Card>
      ) : <Card className="mb-6">You completed every {p.level} lesson. Change your level in Settings to keep going.</Card>}

      <div className="mb-6 grid grid-cols-2 gap-3 md:grid-cols-4">
        {stats.map(([Icon, label, v]) => (
          <Card key={label}><Icon size={18} className="text-brand" /><div className="mt-2 font-display text-2xl font-bold">{v}</div><div className="text-sm text-muted">{label}</div></Card>
        ))}
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <div className="mb-3 flex justify-between"><h2 className="text-lg font-bold">{p.level} course progress</h2><span className="text-sm text-muted">{p.percent}%</span></div>
          <ProgressBar value={p.percent} />
          <div className="mb-1 mt-5 flex justify-between text-sm text-muted"><span>Today’s goal: {p.daily_goal_minutes} min</span><span>{Math.round(p.today_seconds / 60)} min</span></div>
          <ProgressBar value={goal} />
          <div className="mt-6 flex h-20 items-end gap-1" aria-label="Learning time, last 14 days">
            {p.activity.map((a) => <div key={a.day} title={`${a.day}: ${Math.round(a.seconds / 60)} min`} className="flex-1 rounded-t bg-brand/70" style={{ height: `${Math.max(4, (a.seconds / max) * 100)}%` }} />)}
          </div>
        </Card>
        <Card>
          <h2 className="mb-3 text-lg font-bold">Recent quiz results</h2>
          {p.recent_quizzes.length === 0 && <p className="text-muted">No quizzes yet. Each lesson ends with one.</p>}
          <ul className="divide-y divide-line">
            {p.recent_quizzes.map((q, i) => (
              <li key={i} className="flex items-center justify-between py-2 text-sm"><Link to={`/lessons/${q.lesson_id}`} className="hover:text-brand">{q.lesson_title}</Link>
                <span className={`font-semibold ${q.score / q.total >= 0.7 ? "text-ok" : "text-bad"}`}>{q.score}/{q.total}</span></li>
            ))}
          </ul>
        </Card>
      </div>
    </Page>
  );
}
