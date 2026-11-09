import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Bookmark, CheckCircle2, Circle, PlayCircle, Search } from "lucide-react";
import api, { errMsg } from "../api";
import { useAuth } from "../context/AuthContext";
import { Card, ErrorBox, Page, Spinner } from "../components/ui";

const LEVELS = ["A1", "A2", "B1", "B2", "C1", "C2"];
const ICON = { completed: <CheckCircle2 className="text-ok" size={20} />, in_progress: <PlayCircle className="text-gold" size={20} />, not_started: <Circle className="text-muted" size={20} /> };

export default function Lessons() {
  const { user } = useAuth();
  const [level, setLevel] = useState(user.settings.level);
  const [q, setQ] = useState("");
  const [filter, setFilter] = useState("all");
  const [list, setList] = useState(null);
  const [err, setErr] = useState("");

  useEffect(() => {
    setList(null);
    const t = setTimeout(() => {
      api.get("/lessons", { params: { level, q: q || undefined } }).then((r) => setList(r.data)).catch((e) => setErr(errMsg(e)));
    }, 200);
    return () => clearTimeout(t);
  }, [level, q]);

  const toggle = async (l) => {
    const r = await api.post(`/progress/lessons/${l.id}`, { bookmarked: !l.bookmarked });
    setList((cur) => cur.map((x) => (x.id === l.id ? { ...x, bookmarked: r.data.bookmarked } : x)));
  };

  const shown = (list || []).filter((l) => filter === "all" || (filter === "bookmarked" ? l.bookmarked : l.status === filter));
  const groups = shown.reduce((a, l) => ((a[l.module_title] ||= []).push(l), a), {});

  return (
    <Page title="Lessons" subtitle="Open any day you like. Finished lessons stay available, and nothing is locked.">
      <div className="mb-3 flex flex-wrap gap-2">
        {LEVELS.map((l) => <button key={l} onClick={() => setLevel(l)} className={`rounded-full px-4 py-1.5 text-sm font-semibold ${level === l ? "bg-brand text-white" : "border border-line hover:bg-brandsoft"}`}>{l}</button>)}
      </div>
      <div className="mb-6 flex flex-wrap gap-2">
        <div className="relative min-w-48 flex-1"><Search size={16} className="absolute left-3 top-3 text-muted" /><input className="input pl-9" placeholder="Search lessons" value={q} onChange={(e) => setQ(e.target.value)} aria-label="Search lessons" /></div>
        <select className="input w-auto" value={filter} onChange={(e) => setFilter(e.target.value)} aria-label="Filter">
          <option value="all">All</option><option value="not_started">Not started</option><option value="in_progress">In progress</option><option value="completed">Completed</option><option value="bookmarked">Bookmarked</option>
        </select>
      </div>
      <ErrorBox error={err} />
      {!list && !err && <Spinner />}
      {list && shown.length === 0 && <p className="text-muted">No lessons match. Clear the search or filter.</p>}
      {Object.entries(groups).map(([mod, ls]) => (
        <section key={mod} className="mb-8">
          <h2 className="mb-3 text-lg font-bold">{mod}</h2>
          <div className="grid gap-3 sm:grid-cols-2">
            {ls.map((l) => (
              <Card key={l.id} className="flex items-center gap-3 p-4 transition hover:border-brand">
                <Link to={`/lessons/${l.id}`} className="flex min-w-0 flex-1 items-center gap-3">
                  {ICON[l.status]}
                  <div className="min-w-0"><div className="text-xs text-muted">Day {l.number}{l.is_assessment ? " · Test" : ""}{l.status === "in_progress" ? " · Resume" : ""}</div><div className="truncate font-semibold">{l.title}</div></div>
                </Link>
                <button aria-label={l.bookmarked ? "Remove bookmark" : "Bookmark"} onClick={() => toggle(l)}><Bookmark size={18} className={l.bookmarked ? "fill-gold text-gold" : "text-muted"} /></button>
              </Card>
            ))}
          </div>
        </section>
      ))}
    </Page>
  );
}
