import { useEffect, useState } from "react";
import { RotateCcw, Search, Sparkles, Trash2 } from "lucide-react";
import api, { errMsg } from "../api";
import { Button, Card, ErrorBox, Page, SpeakButton, Spinner } from "../components/ui";
import { useAuth } from "../context/AuthContext";

const EMPTY = { german: "", english: "", pronunciation: "", example: "", category: "", level: "A1" };

function Flashcards({ words }) {
  const [deck, setDeck] = useState(() => [...words].sort(() => Math.random() - 0.5));
  const [i, setI] = useState(0);
  const [flip, setFlip] = useState(false);
  const [score, setScore] = useState({ known: 0, again: 0 });
  if (words.length === 0) return <p className="text-muted">Save some words first, then practise them here.</p>;
  if (i >= deck.length) return (
    <Card className="text-center"><div className="font-display text-3xl font-bold">Session done</div><p className="my-2 text-muted">{score.known} known · {score.again} to review</p>
      <Button onClick={() => { setDeck([...words].sort(() => Math.random() - 0.5)); setI(0); setScore({ known: 0, again: 0 }); setFlip(false); }}><RotateCcw size={16} /> Practise again</Button></Card>
  );
  const w = deck[i];
  const next = (k) => { setScore({ ...score, [k]: score[k] + 1 }); setI(i + 1); setFlip(false); };
  return (
    <div className="mx-auto max-w-md space-y-4">
      <div className="text-center text-sm text-muted">{i + 1} / {deck.length}</div>
      <button onClick={() => setFlip(!flip)} className="flex min-h-56 w-full flex-col items-center justify-center rounded-2xl border border-line bg-card p-6 text-center" aria-label="Flip card">
        {!flip ? <><div className="font-display text-4xl font-extrabold">{w.german}</div><div className="mt-2 text-sm text-muted">{w.pronunciation}</div></>
          : <><div className="font-display text-3xl font-bold">{w.english}</div>{w.example && <div className="mt-3 text-sm text-muted">{w.example}</div>}</>}
      </button>
      <div className="flex justify-center"><SpeakButton text={w.german} /></div>
      <div className="flex gap-2"><Button variant="danger" className="flex-1" onClick={() => next("again")}>Review again</Button><Button className="flex-1" onClick={() => next("known")}>I knew it</Button></div>
    </div>
  );
}

export default function Vocabulary() {
  const { user } = useAuth();
  const [words, setWords] = useState(null);
  const [q, setQ] = useState("");
  const [level, setLevel] = useState("");
  const [tab, setTab] = useState("list");
  const [form, setForm] = useState({ ...EMPTY, level: user.settings.level });
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);

  const load = () => api.get("/vocabulary", { params: { q: q || undefined, level: level || undefined } }).then((r) => setWords(r.data)).catch((e) => setErr(errMsg(e)));
  useEffect(() => { const t = setTimeout(load, 200); return () => clearTimeout(t); }, [q, level]);

  const autofill = async () => {
    setErr(""); setBusy(true);
    try { const d = (await api.post("/ai/define-word", { word: form.german })).data; setForm({ ...form, german: d.german || form.german, english: d.english || "", pronunciation: d.pronunciation || "", example: d.example || "", category: d.category || "", level: /^[ABC][12]$/.test(d.level) ? d.level : form.level }); }
    catch (e) { setErr(errMsg(e)); } finally { setBusy(false); }
  };
  const add = async (e) => {
    e.preventDefault(); setErr("");
    try { await api.post("/vocabulary", { ...form, source: "manual" }); setForm({ ...EMPTY, level: form.level }); load(); } catch (x) { setErr(errMsg(x)); }
  };
  const remove = async (id) => { await api.delete(`/vocabulary/${id}`); setWords((w) => w.filter((x) => x.id !== id)); };

  return (
    <Page title="Vocabulary" subtitle="Words you saved from lessons and chats, plus any you add yourself.">
      <div className="mb-5 flex gap-2">{[["list", "My words"], ["cards", "Flashcards"]].map(([k, l]) => <button key={k} onClick={() => setTab(k)} className={`rounded-full px-4 py-1.5 text-sm font-semibold ${tab === k ? "bg-brand text-white" : "border border-line hover:bg-brandsoft"}`}>{l}</button>)}</div>
      <ErrorBox error={err} />
      {!words && !err && <Spinner />}
      {words && tab === "cards" && <Flashcards words={words} />}
      {words && tab === "list" && (
        <div className="space-y-5">
          <Card>
            <form onSubmit={add} className="grid gap-2 sm:grid-cols-2">
              <div className="flex gap-2 sm:col-span-2"><input className="input" placeholder="German word (e.g. Apfel)" value={form.german} onChange={(e) => setForm({ ...form, german: e.target.value })} required aria-label="German word" />
                <Button type="button" variant="ghost" disabled={!form.german || busy} onClick={autofill}><Sparkles size={16} /> {busy ? "…" : "Fill with AI"}</Button></div>
              <input className="input" placeholder="English meaning" value={form.english} onChange={(e) => setForm({ ...form, english: e.target.value })} required aria-label="English meaning" />
              <input className="input" placeholder="Pronunciation" value={form.pronunciation} onChange={(e) => setForm({ ...form, pronunciation: e.target.value })} aria-label="Pronunciation" />
              <input className="input sm:col-span-2" placeholder="Example sentence" value={form.example} onChange={(e) => setForm({ ...form, example: e.target.value })} aria-label="Example" />
              <input className="input" placeholder="Category (food, travel…)" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} aria-label="Category" />
              <div className="flex gap-2"><select className="input" value={form.level} onChange={(e) => setForm({ ...form, level: e.target.value })} aria-label="Level">{["A1", "A2", "B1", "B2", "C1", "C2"].map((l) => <option key={l}>{l}</option>)}</select><Button>Save word</Button></div>
            </form>
          </Card>
          <div className="flex gap-2">
            <div className="relative flex-1"><Search size={16} className="absolute left-3 top-3 text-muted" /><input className="input pl-9" placeholder="Search words" value={q} onChange={(e) => setQ(e.target.value)} aria-label="Search words" /></div>
            <select className="input w-auto" value={level} onChange={(e) => setLevel(e.target.value)} aria-label="Filter by level"><option value="">All levels</option>{["A1", "A2", "B1", "B2", "C1", "C2"].map((l) => <option key={l}>{l}</option>)}</select>
          </div>
          {words.length === 0 ? <p className="text-muted">No words yet. Save words from a lesson with the + button, or add one above.</p> : (
            <Card className="divide-y divide-line p-0">
              {words.map((w) => (
                <div key={w.id} className="flex items-center gap-3 p-3">
                  <SpeakButton text={w.german} />
                  <div className="min-w-0 flex-1"><div><strong>{w.german}</strong> <span className="text-muted">— {w.english}</span></div><div className="truncate text-sm text-muted">{[w.pronunciation, w.example, w.category].filter(Boolean).join(" · ")}</div></div>
                  <span className="rounded-full bg-brandsoft px-2 py-0.5 text-xs font-semibold">{w.level}</span>
                  <button aria-label={`Remove ${w.german}`} className="p-1.5 text-muted hover:text-bad" onClick={() => remove(w.id)}><Trash2 size={16} /></button>
                </div>
              ))}
            </Card>
          )}
        </div>
      )}
    </Page>
  );
}
