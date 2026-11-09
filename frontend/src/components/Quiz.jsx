import { useEffect, useState } from "react";
import { CheckCircle2, XCircle } from "lucide-react";
import api, { errMsg } from "../api";
import { Button, Card, ErrorBox, Spinner } from "./ui";

export default function Quiz({ lessonId, onDone }) {
  const [quiz, setQuiz] = useState(null);
  const [answers, setAnswers] = useState({});
  const [res, setRes] = useState(null);
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);

  const load = () => { setRes(null); setAnswers({}); api.get(`/quizzes/${lessonId}`).then((r) => setQuiz(r.data)).catch((e) => setErr(errMsg(e))); };
  useEffect(load, [lessonId]);

  const submit = async () => {
    setBusy(true); setErr("");
    try { const r = await api.post(`/quizzes/${quiz.quiz_id}/submit`, { answers }); setRes(r.data); onDone?.(r.data); }
    catch (e) { setErr(errMsg(e)); } finally { setBusy(false); }
  };

  if (err && !quiz) return <ErrorBox error={err} />;
  if (!quiz) return <Spinner label="Preparing quiz…" />;

  if (res) return (
    <div className="space-y-4">
      <Card className={res.passed ? "border-ok" : "border-bad"}>
        <div className="font-display text-4xl font-extrabold">{res.score}/{res.total} <span className="text-lg text-muted">({res.percent}%)</span></div>
        <p className="mt-1 text-muted">{res.passed ? "Passed. This lesson is marked complete." : "Not quite 70% yet. Review the explanations and try again."}</p>
      </Card>
      {res.results.map((r) => (
        <Card key={r.id} className="p-4">
          <div className="flex items-start gap-2">{r.correct ? <CheckCircle2 className="mt-0.5 shrink-0 text-ok" size={18} /> : <XCircle className="mt-0.5 shrink-0 text-bad" size={18} />}
            <div className="text-sm"><div className="font-semibold">{r.prompt}</div>
              {!r.correct && <div className="text-bad">Your answer: {r.your_answer || "(blank)"}</div>}
              <div>Correct answer: <strong>{r.correct_answer}</strong></div><div className="text-muted">{r.explanation}</div></div></div>
        </Card>
      ))}
      <Button variant="ghost" onClick={load}>Retake quiz</Button>
    </div>
  );

  const complete = quiz.questions.every((q) => (answers[q.id] || "").trim());
  return (
    <div className="space-y-4">
      {quiz.is_assessment && <Card className="bg-brandsoft">This is a revision test covering recent topics.</Card>}
      {quiz.questions.map((q, i) => (
        <Card key={q.id} className="p-4">
          <div className="mb-3 font-semibold">{i + 1}. {q.prompt}</div>
          {q.kind === "mcq" ? (
            <div className="grid gap-2 sm:grid-cols-2">
              {q.options.map((o) => <label key={o} className={`flex cursor-pointer items-center gap-2 rounded-xl border px-3 py-2 text-sm ${answers[q.id] === o ? "border-brand bg-brandsoft" : "border-line"}`}>
                <input type="radio" name={`q${q.id}`} checked={answers[q.id] === o} onChange={() => setAnswers({ ...answers, [q.id]: o })} />{o}</label>)}
            </div>
          ) : <input className="input" placeholder="Type your German answer" value={answers[q.id] || ""} onChange={(e) => setAnswers({ ...answers, [q.id]: e.target.value })} aria-label={q.prompt} />}
        </Card>
      ))}
      <ErrorBox error={err} />
      <Button onClick={submit} disabled={!complete || busy}>{busy ? "Checking…" : "Submit quiz"}</Button>
    </div>
  );
}
