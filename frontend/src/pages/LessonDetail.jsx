import { useEffect, useRef, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { Check, CheckCircle2, ChevronLeft, ChevronRight, Plus } from "lucide-react";
import api, { errMsg } from "../api";
import Quiz from "../components/Quiz";
import Recorder from "../components/Recorder";
import { Button, Card, ErrorBox, ProgressBar, Rich, Spinner, SpeakButton } from "../components/ui";

const STEPS = [["overview", "Overview"], ["vocabulary", "Words"], ["grammar", "Grammar"], ["examples", "Sentences"], ["dialogue", "Dialogue"],
  ["reading", "Reading"], ["listening", "Listening"], ["speaking", "Speaking"], ["writing", "Writing"], ["quiz", "Quiz"]];
const strip = (s) => s.replace(/[^\p{L}\p{N}\s]/gu, "").replace(/\s+/g, " ").trim();
const norm = (s) => strip(s).toLowerCase();
// German nouns are capitalised, so a right answer with wrong capitals is "almost".
const grade = (a, b) => (strip(a) === strip(b) ? "ok" : norm(a) === norm(b) ? "case" : "no");
const Verdict = ({ g, answer }) => (
  <div className="text-sm">
    <span className={g === "ok" ? "text-ok" : g === "case" ? "text-gold" : "text-bad"}>{g === "ok" ? "Correct! " : g === "case" ? "Almost! Check the capital letters: " : "Not exactly. Answer: "}</span>
    {g !== "ok" && <strong>{answer}</strong>}
  </div>
);

function SaveWord({ v, level }) {
  const [s, setS] = useState(0);
  const save = async () => {
    try { await api.post("/vocabulary", { german: v.german, english: v.english, pronunciation: v.pronunciation || "", category: v.category || "", level, source: "lesson" }); setS(1); }
    catch (e) { setS(e.response?.status === 409 ? 1 : 2); }
  };
  return <button aria-label="Save word" title={s === 2 ? "Could not save" : "Save to vocabulary"} onClick={save} className="rounded-lg p-1.5 text-brand hover:bg-brandsoft">{s === 1 ? <Check size={16} /> : <Plus size={16} />}</button>;
}

function SentenceTable({ rows, speakers = false }) {
  return (
    <Card className="overflow-x-auto p-0">
      <table className="w-full text-sm">
        <thead className="border-b border-line text-left text-muted"><tr><th className="p-3">German</th><th>English</th><th>Say it</th></tr></thead>
        <tbody>{rows.map((r, i) => (
          <tr key={i} className="border-b border-line align-top last:border-0">
            <td className="p-3 font-semibold">{speakers && <span className="mr-1 text-brand">{r.speaker}:</span>}<span className="mr-1">{r.german}</span><SpeakButton text={r.german} /></td>
            <td className="py-3 pr-2">{r.english}</td><td className="py-3 pr-3 text-muted">{r.pronunciation}</td>
          </tr>))}</tbody>
      </table>
    </Card>
  );
}

/** One exercise at a time with a counter, so long lists stay easy on a phone. */
function Carousel({ items, render }) {
  const [i, setI] = useState(0);
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-3 text-sm text-muted"><span>{i + 1} / {items.length}</span><ProgressBar className="flex-1" value={((i + 1) / items.length) * 100} /></div>
      <div key={i}>{render(items[i], i)}</div>
      <div className="flex justify-between"><Button variant="ghost" disabled={i === 0} onClick={() => setI(i - 1)}>Previous</Button><Button disabled={i === items.length - 1} onClick={() => setI(i + 1)}>Next</Button></div>
    </div>
  );
}

function ListenItem({ it }) {
  const [val, setVal] = useState("");
  const [g, setG] = useState(null);
  return (
    <Card className="space-y-3">
      <div className="flex items-center gap-3"><SpeakButton text={it.german} className="!p-3" /><span className="text-muted">Press play, then type what you hear.</span></div>
      <input className="input" placeholder="Type the German sentence" value={val} onChange={(e) => setVal(e.target.value)} aria-label="What did you hear?" />
      <Button variant="ghost" disabled={!val.trim()} onClick={() => setG(grade(val, it.german))}>Check</Button>
      {g && <><Verdict g={g} answer={it.german} /><div className="text-sm text-muted">{it.german} · {it.english}</div></>}
    </Card>
  );
}

function SpeakItem({ it }) {
  const [said, setSaid] = useState("");
  const [fb, setFb] = useState(null);
  const [err, setErr] = useState("");
  const target = new Set(norm(it.german).split(" "));
  const match = said ? Math.round((100 * norm(said).split(" ").filter((w) => target.has(w)).length) / target.size) : 0;
  const feedback = async () => { setErr(""); try { setFb((await api.post("/ai/speaking-feedback", { transcript: said })).data); } catch (e) { setErr(errMsg(e)); } };
  return (
    <Card className="space-y-3">
      <div className="flex items-start gap-2"><SpeakButton text={it.german} /><div><div className="font-display text-2xl font-bold">{it.german}</div><div className="text-muted">{it.english}</div>
        {it.pronunciation && <div className="mt-1 text-sm">Say it: <strong>{it.pronunciation}</strong></div>}</div></div>
      <Recorder onResult={setSaid} />
      <ErrorBox error={err} />
      {said && <div className="text-sm">You said: <strong>{said}</strong> · word match {match}% <span className="text-muted">(compares words, not pronunciation)</span>
        <Button variant="ghost" className="ml-2 !py-1" onClick={feedback}>Tutor feedback</Button></div>}
      {fb && <div className="rounded-xl bg-brandsoft p-3 text-sm"><strong>Better:</strong> {fb.corrected} <span className="text-muted">({fb.english})</span><div>{fb.explanation}</div></div>}
    </Card>
  );
}

function WriteItem({ it }) {
  const [val, setVal] = useState("");
  const [g, setG] = useState(null);
  const [show, setShow] = useState(false);
  const [tutor, setTutor] = useState(null);
  const [err, setErr] = useState("");
  const ask = async () => { setErr(""); try { setTutor((await api.post("/ai/correct", { text: val })).data); } catch (e) { setErr(errMsg(e)); } };
  return (
    <Card className="space-y-3">
      <div className="text-lg font-semibold">{it.prompt}</div>
      <textarea className="input" rows={2} value={val} onChange={(e) => setVal(e.target.value)} aria-label={it.prompt} />
      <div className="flex flex-wrap gap-2">
        <Button variant="ghost" disabled={!val.trim()} onClick={() => setG(grade(val, it.answer))}>Check</Button>
        <Button variant="ghost" onClick={() => setShow(true)}>Show answer</Button>
        <Button variant="ghost" disabled={!val.trim()} onClick={ask}>Ask tutor</Button>
      </div>
      {g && <Verdict g={g} answer={it.answer} />}
      {show && <div className="text-sm">Answer: <strong>{it.answer}</strong></div>}
      <ErrorBox error={err} />
      {tutor && <div className="rounded-xl bg-brandsoft p-3 text-sm"><strong>{tutor.corrected}</strong> — {tutor.english}<div>{tutor.explanation}</div></div>}
    </Card>
  );
}

function Reading({ r }) {
  const [open, setOpen] = useState({});
  return (
    <div className="space-y-4">
      <h2 className="text-xl font-bold">{r.title}</h2>
      <SentenceTable rows={r.sentences} />
      {r.glossary?.length > 0 && <Card><h3 className="mb-2 font-bold">Extra words in this text</h3>{r.glossary.map((w, i) => <div key={i} className="text-sm"><strong>{w.german}</strong> — {w.english}</div>)}</Card>}
      {r.questions?.length > 0 && <Card className="space-y-3"><h3 className="font-bold">Check your understanding</h3>
        {r.questions.map((q, i) => <div key={i}><div className="text-sm">{i + 1}. {q.question}</div>
          {open[i] ? <div className="text-sm text-ok">{q.answer}</div> : <button className="text-sm text-brand" onClick={() => setOpen({ ...open, [i]: true })}>Show answer</button>}</div>)}</Card>}
    </div>
  );
}

export default function LessonDetail() {
  const { id } = useParams();
  const nav = useNavigate();
  const [lesson, setLesson] = useState(null);
  const [err, setErr] = useState("");
  const [step, setStep] = useState(0);
  const pending = useRef(0);

  useEffect(() => {
    setLesson(null); setErr("");
    api.get(`/lessons/${id}`).then((r) => { setLesson(r.data); setStep(Math.min(r.data.last_position || 0, STEPS.length - 1)); }).catch((e) => setErr(errMsg(e)));
  }, [id]);

  // Track study time; flushed to the backend every minute and when leaving the page.
  useEffect(() => {
    const flush = () => { if (pending.current > 0) { api.post(`/progress/lessons/${id}`, { add_seconds: Math.min(pending.current, 3600) }).catch(() => {}); pending.current = 0; } };
    const t = setInterval(() => { if (!document.hidden) pending.current += 15; if (pending.current >= 60) flush(); }, 15000);
    return () => { clearInterval(t); flush(); };
  }, [id]);

  const go = (i) => { setStep(i); window.scrollTo({ top: 0 }); api.post(`/progress/lessons/${id}`, { last_position: i }).then((r) => setLesson((l) => ({ ...l, status: r.data.status }))).catch(() => {}); };
  const setStatus = async (status) => { const r = await api.post(`/progress/lessons/${id}`, { status }); setLesson((l) => ({ ...l, status: r.data.status })); };

  if (err) return <div className="mx-auto max-w-3xl p-6"><ErrorBox error={err} /><Link to="/lessons" className="mt-4 inline-block text-brand">Back to lessons</Link></div>;
  if (!lesson) return <Spinner label="Preparing your lesson… (a new lesson can take 10–20 seconds the first time)" />;
  const c = lesson.content;
  const key = STEPS[step][0];

  return (
    <div className="mx-auto max-w-3xl px-4 py-6 md:px-8 md:py-10">
      <Link to="/lessons" className="text-sm text-muted hover:text-ink">← All lessons</Link>
      <div className="mt-2 flex items-start justify-between gap-3">
        <div><div className="text-sm text-muted">{lesson.level} · Day {lesson.number} · {lesson.module_title}</div><h1 className="text-3xl font-extrabold md:text-4xl">{lesson.title}</h1></div>
        {lesson.status === "completed" && <span className="flex items-center gap-1 rounded-full bg-ok/15 px-3 py-1 text-sm font-semibold text-ok"><CheckCircle2 size={16} /> Completed</span>}
      </div>
      <div className="my-5 flex gap-1 overflow-x-auto pb-1">
        {STEPS.map(([k, label], i) => <button key={k} onClick={() => go(i)} className={`shrink-0 rounded-full px-3 py-1.5 text-sm font-medium ${i === step ? "bg-brand text-white" : "border border-line text-muted hover:bg-brandsoft"}`}>{label}</button>)}
      </div>

      <div className="min-h-64">
        {key === "overview" && <div className="space-y-4">
          <Card><h2 className="mb-2 text-lg font-bold">By the end you can</h2><ul className="list-disc space-y-1 pl-5">{c.objectives.map((o, i) => <li key={i}>{o}</li>)}</ul></Card>
          <Card><h2 className="mb-2 text-lg font-bold">In this lesson</h2><p className="text-sm">{c.vocabulary.length} words · {c.examples.length} sentences · {c.dialogue.length}-line dialogue · reading text · {c.speaking.length} speaking and {c.writing.length} writing exercises, all using only the words and sentences you learn here.</p></Card>
          <Card><h2 className="mb-2 text-lg font-bold">Try it in real life</h2><ul className="list-disc space-y-1 pl-5">{c.practical.map((o, i) => <li key={i}>{o}</li>)}</ul></Card></div>}
        {key === "vocabulary" && <Card className="overflow-x-auto p-0"><table className="w-full text-sm"><thead className="border-b border-line text-left text-muted"><tr><th className="p-3">German</th><th>English</th><th>Say it</th><th /></tr></thead>
          <tbody>{c.vocabulary.map((v, i) => <tr key={i} className="border-b border-line last:border-0"><td className="p-3 font-semibold"><span className="mr-1">{v.german}</span><SpeakButton text={v.german} /></td><td>{v.english}</td><td className="text-muted">{v.pronunciation}</td><td><SaveWord v={v} level={lesson.level} /></td></tr>)}</tbody></table></Card>}
        {key === "grammar" && <Card><h2 className="mb-3 text-xl font-bold">{c.grammar.title}</h2><Rich text={c.grammar.explanation} /></Card>}
        {key === "examples" && <SentenceTable rows={c.examples} />}
        {key === "dialogue" && <div className="space-y-3"><p className="text-sm text-muted">Read both parts aloud. Then swap roles.</p><SentenceTable rows={c.dialogue} speakers /></div>}
        {key === "reading" && <Reading r={c.reading} />}
        {key === "listening" && <div className="space-y-3"><p className="text-muted">Every sentence you learned in this lesson.</p><Carousel items={c.listening} render={(it) => <ListenItem it={it} />} /></div>}
        {key === "speaking" && <div className="space-y-3"><p className="text-muted">Say every sentence from this lesson. Word match compares what was heard with the sentence; it does not rate your accent.</p><Carousel items={c.speaking} render={(it) => <SpeakItem it={it} />} /></div>}
        {key === "writing" && <div className="space-y-3"><p className="text-muted">Only sentences and words from this lesson. Remember: German nouns start with a capital letter.</p><Carousel items={c.writing} render={(it) => <WriteItem it={it} />} /></div>}
        {key === "quiz" && <Quiz lessonId={lesson.id} onDone={(r) => r.lesson_completed && setLesson((l) => ({ ...l, status: "completed" }))} />}
      </div>

      <div className="mt-8 flex flex-wrap items-center justify-between gap-3 border-t border-line pt-4">
        <Button variant="ghost" disabled={step === 0} onClick={() => go(step - 1)}><ChevronLeft size={16} /> Back</Button>
        <div className="flex gap-2">
          {lesson.status !== "completed" ? <Button variant="gold" onClick={() => setStatus("completed")}>Mark complete</Button> : <Button variant="ghost" onClick={() => setStatus("in_progress")}>Mark as not finished</Button>}
          {step < STEPS.length - 1 ? <Button onClick={() => go(step + 1)}>Next <ChevronRight size={16} /></Button>
            : lesson.next_id && <Button onClick={() => nav(`/lessons/${lesson.next_id}`)}>Next day <ChevronRight size={16} /></Button>}
        </div>
      </div>
    </div>
  );
}
