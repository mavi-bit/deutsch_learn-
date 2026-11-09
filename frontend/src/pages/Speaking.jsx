import { useEffect, useState } from "react";
import api, { errMsg } from "../api";
import Recorder from "../components/Recorder";
import { Button, Card, ErrorBox, Page, SpeakButton, Spinner } from "../components/ui";

export default function Speaking() {
  const [typed, setTyped] = useState("");
  const [fb, setFb] = useState(null);
  const [said, setSaid] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const [history, setHistory] = useState([]);

  const loadHistory = () => api.get("/ai/speaking-sessions").then((r) => setHistory(r.data)).catch(() => {});
  useEffect(() => { loadHistory(); }, []);

  const evaluate = async (t) => {
    setSaid(t); setErr(""); setFb(null); setBusy(true);
    try { setFb((await api.post("/ai/speaking-feedback", { transcript: t })).data); loadHistory(); }
    catch (e) { setErr(errMsg(e)); } finally { setBusy(false); }
  };

  return (
    <Page title="Speaking practice" subtitle="Say a sentence in German. You get a corrected version, its meaning, and a spoken reply.">
      <Card className="space-y-4">
        <Recorder onResult={evaluate} />
        <div className="flex gap-2">
          <input className="input" placeholder="No microphone? Type what you would say" value={typed} onChange={(e) => setTyped(e.target.value)} aria-label="Typed sentence" />
          <Button variant="ghost" disabled={!typed.trim() || busy} onClick={() => evaluate(typed.trim())}>Get feedback</Button>
        </div>
        <p className="text-xs text-muted">Feedback is based on the transcript of your speech (grammar, words, sentence structure). It does not score your pronunciation sound by sound.</p>
      </Card>
      <div className="mt-6 space-y-4">
        <ErrorBox error={err} />
        {busy && <Spinner label="Your tutor is listening…" />}
        {fb && (
          <Card className="space-y-3">
            <div className="text-sm text-muted">You said: “{said}”</div>
            <div className="flex items-center gap-2"><span className="font-display text-2xl font-bold">{fb.corrected}</span><SpeakButton text={fb.corrected} /></div>
            <div className="text-muted">{fb.english}</div>
            <p>{fb.explanation}</p>
            {fb.vocabulary_notes?.length > 0 && <ul className="list-disc pl-5 text-sm">{fb.vocabulary_notes.map((n, i) => <li key={i}>{n}</li>)}</ul>}
            {fb.pronunciation_tip && <p className="rounded-xl bg-brandsoft p-3 text-sm"><strong>Pronunciation tip:</strong> {fb.pronunciation_tip}</p>}
            <div className="rounded-xl border border-line p-3"><div className="mb-1 text-xs text-muted">Tutor reply</div><div className="flex items-center gap-2 font-semibold">{fb.reply_de}<SpeakButton text={fb.reply_de} /></div><div className="text-sm text-muted">{fb.reply_en}</div></div>
          </Card>
        )}
        {history.length > 0 && (
          <div><h2 className="mb-2 text-lg font-bold">Recent sessions</h2>
            <Card className="divide-y divide-line p-0">{history.map((s) => <div key={s.id} className="p-3 text-sm"><div>{s.transcript}</div><div className="text-muted">→ {s.feedback?.corrected}</div></div>)}</Card></div>
        )}
      </div>
    </Page>
  );
}
