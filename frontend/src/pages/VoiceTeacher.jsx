import { useEffect, useRef, useState } from "react";
import { Mic, Send, Square } from "lucide-react";
import api, { errMsg } from "../api";
import Recorder from "../components/Recorder";
import { Button, Card, ErrorBox, Page, ProgressBar, Spinner } from "../components/ui";

const SR = typeof window !== "undefined" ? window.SpeechRecognition || window.webkitSpeechRecognition : null;
const MODES = [
  ["teacher", "Free conversation", "Chat about anything. Lena corrects you gently."],
  ["fluency", "Fluency coach", "Longer answers, better phrases, less hesitation."],
  ["interview", "Interview", "A mock German interview with a score at the end."],
];
const INTERVIEWS = ["a job interview (Vorstellungsgespräch)", "a university admission interview", "a visa interview at the embassy", "the Goethe speaking exam (Sprechen)"];
const LABEL = { idle: "Paused", listening: "Listening… speak German", thinking: "Lena is thinking…", speaking: "Lena is speaking… tap to interrupt" };

// A reply looks like: "German sentence(s)\nEN: translation or tip". Only the German part is spoken.
const splitReply = (t) => {
  const i = t.search(/\n?\s*EN:/);
  return i < 0 ? [t.trim(), ""] : [t.slice(0, i).trim(), t.slice(i).replace(/^\s*EN:\s*/, "").trim()];
};
const germanVoice = () => { const v = window.speechSynthesis.getVoices(); return v.find((x) => x.lang === "de-DE") || v.find((x) => x.lang?.startsWith("de")); };

function Scorecard({ s }) {
  const bars = [["Fluency", s.fluency], ["Grammar", s.grammar], ["Vocabulary", s.vocabulary], ["Content", s.content]];
  return (
    <div className="space-y-4">
      <Card className="flex items-center gap-5">
        <div className="font-display text-6xl font-extrabold text-brand">{s.overall}<span className="text-xl text-muted">/100</span></div>
        <p className="text-sm">{s.verdict}</p>
      </Card>
      <Card className="space-y-3">{bars.map(([l, v]) => <div key={l}><div className="mb-1 flex justify-between text-sm"><span>{l}</span><span className="font-semibold">{v}/10</span></div><ProgressBar value={(v || 0) * 10} /></div>)}</Card>
      <div className="grid gap-4 md:grid-cols-2">
        <Card><h3 className="mb-2 font-bold">Strengths</h3><ul className="list-disc space-y-1 pl-5 text-sm">{(s.strengths || []).map((x, i) => <li key={i}>{x}</li>)}</ul></Card>
        <Card><h3 className="mb-2 font-bold">Next steps</h3><ul className="list-disc space-y-1 pl-5 text-sm">{(s.tips || []).map((x, i) => <li key={i}>{x}</li>)}</ul></Card>
      </div>
      {s.mistakes?.length > 0 && <Card><h3 className="mb-2 font-bold">Corrections</h3>{s.mistakes.map((m, i) => <div key={i} className="border-t border-line py-2 text-sm first:border-0"><span className="text-bad line-through">{m.said}</span> → <strong className="text-ok">{m.better}</strong><div className="text-muted">{m.why}</div></div>)}</Card>}
      <p className="text-xs text-muted">Scores are an AI estimate from the speech transcript (grammar, words, fluency of content). Pronunciation is not measured.</p>
    </div>
  );
}

export default function VoiceTeacher() {
  const [mode, setMode] = useState("teacher");
  const [topic, setTopic] = useState("");
  const [turns, setTurns] = useState([]);
  const [status, setStatus] = useState("idle");
  const [live, setLive] = useState(false);
  const [interim, setInterim] = useState("");
  const [typed, setTyped] = useState("");
  const [err, setErr] = useState("");
  const [summary, setSummary] = useState(null);
  const [scoring, setScoring] = useState(false);
  const liveRef = useRef(false), listeningRef = useRef(false), cidRef = useRef(null), recRef = useRef(null), abortRef = useRef(null);
  const pending = useRef(0), streamDone = useRef(true), endRef = useRef(null);
  const modeRef = useRef(mode), topicRef = useRef(topic);
  modeRef.current = mode; topicRef.current = topic;

  useEffect(() => { endRef.current?.scrollIntoView({ behavior: "smooth" }); }, [turns, interim]);
  useEffect(() => () => { liveRef.current = false; try { recRef.current?.abort(); } catch { /* */ } abortRef.current?.abort(); window.speechSynthesis?.cancel(); }, []);

  const stopAll = () => {
    liveRef.current = false; setLive(false);
    try { recRef.current?.abort(); } catch { /* */ }
    abortRef.current?.abort(); window.speechSynthesis.cancel();
    pending.current = 0; streamDone.current = true; listeningRef.current = false;
    setStatus("idle"); setInterim("");
  };

  const startListening = () => {
    if (!SR || listeningRef.current || !liveRef.current || !streamDone.current || pending.current > 0) return;
    const r = new SR();
    r.lang = "de-DE"; r.interimResults = true; r.continuous = false;
    let finalText = "";
    r.onresult = (e) => {
      let t = "";
      for (let i = 0; i < e.results.length; i++) t += e.results[i][0].transcript;
      setInterim(t);
      if (e.results[e.results.length - 1].isFinal) finalText = t;
    };
    r.onerror = (e) => {
      if (e.error === "not-allowed" || e.error === "service-not-allowed") { setErr("Microphone or speech recognition is blocked. Allow it in your browser, then press Start again."); stopAll(); }
    };
    r.onend = () => {
      listeningRef.current = false; setInterim("");
      if (!liveRef.current) return;
      if (finalText.trim()) send(finalText.trim()); else setTimeout(startListening, 300);
    };
    recRef.current = r; listeningRef.current = true; setStatus("listening");
    try { r.start(); } catch { listeningRef.current = false; }
  };

  const afterSpeech = () => {
    if (!streamDone.current || pending.current > 0) return;
    if (liveRef.current) startListening(); else setStatus("idle");
  };

  const speakText = (text) => {
    const u = new SpeechSynthesisUtterance(text);
    u.lang = "de-DE"; u.rate = 0.95;
    const v = germanVoice(); if (v) u.voice = v;
    pending.current++;
    u.onend = u.onerror = () => { pending.current = Math.max(0, pending.current - 1); afterSpeech(); };
    window.speechSynthesis.speak(u);
    setStatus("speaking");
  };

  const send = async (text, start = false) => {
    setErr(""); setStatus("thinking"); streamDone.current = false;
    try { recRef.current?.abort(); } catch { /* */ }
    if (!start) setTurns((t) => [...t, { role: "user", de: text }]);
    setTurns((t) => [...t, { role: "assistant", de: "", en: "" }]);
    const ctrl = new AbortController(); abortRef.current = ctrl;
    let full = "", spoken = 0;
    const speakReady = (final) => {
      const [de] = splitReply(full);
      const rest = de.slice(spoken);
      const re = /[^.!?]*[.!?]+(\s+|$)/g;
      let m, last = 0;
      while ((m = re.exec(rest))) { const s = m[0].trim(); if (s) speakText(s); last = re.lastIndex; }
      spoken += last;
      if (final) { const tail = de.slice(spoken).trim(); if (tail) speakText(tail); spoken = de.length; }
    };
    try {
      const res = await fetch((import.meta.env.VITE_API_URL || "/api") + "/voice/stream", {
        method: "POST", signal: ctrl.signal,
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${localStorage.getItem("token")}` },
        body: JSON.stringify({ text: text || "", mode: modeRef.current, topic: topicRef.current, conversation_id: cidRef.current, start }),
      });
      if (!res.ok) {
        let d = "Something went wrong.";
        try { d = (await res.json()).detail || d; } catch { /* */ }
        throw new Error(typeof d === "string" ? d : "Please check your input.");
      }
      const reader = res.body.getReader(), dec = new TextDecoder();
      let buf = "";
      for (;;) {
        const { value, done } = await reader.read();
        if (done) break;
        buf += dec.decode(value, { stream: true });
        const parts = buf.split("\n\n"); buf = parts.pop();
        for (const p of parts) {
          if (!p.startsWith("data:")) continue;
          const j = JSON.parse(p.slice(5));
          if (j.conversation_id) cidRef.current = j.conversation_id;
          if (j.error) throw new Error(j.error);
          if (j.t) {
            full += j.t;
            const [de, en] = splitReply(full);
            setTurns((t) => { const c = [...t]; c[c.length - 1] = { role: "assistant", de, en }; return c; });
            speakReady(false);
          }
        }
      }
      speakReady(true);
    } catch (e) {
      if (e.name !== "AbortError") { setErr(e.message || "Connection problem."); stopAll(); }
      return;
    }
    streamDone.current = true;
    afterSpeech();
  };

  const start = () => {
    setErr(""); setSummary(null); setTurns([]); cidRef.current = null;
    liveRef.current = true; setLive(true);
    window.speechSynthesis.cancel();
    send("", true);
  };
  const interrupt = () => {
    abortRef.current?.abort(); window.speechSynthesis.cancel();
    pending.current = 0; streamDone.current = true; liveRef.current = true; setLive(true);
    startListening();
  };
  const submitTyped = (e) => { e.preventDefault(); const t = typed.trim(); if (!t) return; setTyped(""); liveRef.current = true; setLive(true); window.speechSynthesis.cancel(); send(t); };
  const finish = async () => {
    stopAll();
    if (!cidRef.current) return;
    setScoring(true);
    try { setSummary((await api.post("/voice/summary", { conversation_id: cidRef.current, mode: modeRef.current })).data); }
    catch (e) { setErr(errMsg(e)); } finally { setScoring(false); }
  };

  const session = turns.length > 0 || live;
  const orb = { idle: "bg-muted/40", listening: "bg-bad animate-pulse", thinking: "bg-gold animate-pulse", speaking: "bg-brand animate-pulse" }[status];

  return (
    <Page title="Live Teacher" subtitle="Talk with Lena out loud. She answers right away, keeps the conversation going, and can run a mock interview.">
      <ErrorBox error={err} />
      {!SR && <Card className="mb-4 border-gold text-sm">Your browser has no built-in speech recognition (Chrome on Android or desktop works best). You can type, or use the Record button below, and Lena will still answer out loud.</Card>}

      {!session && !summary && (
        <div className="space-y-5">
          <div className="grid gap-3 md:grid-cols-3">
            {MODES.map(([k, t, d]) => (
              <button key={k} onClick={() => setMode(k)} className={`rounded-2xl border p-4 text-left transition ${mode === k ? "border-brand bg-brandsoft" : "border-line bg-card hover:bg-brandsoft"}`}>
                <div className="font-display text-lg font-bold">{t}</div><div className="mt-1 text-sm text-muted">{d}</div>
              </button>
            ))}
          </div>
          <Card className="space-y-3">
            <label className="text-sm font-semibold" htmlFor="topic">{mode === "interview" ? "Interview type" : "Topic (optional)"}</label>
            <input id="topic" className="input" value={topic} onChange={(e) => setTopic(e.target.value)} placeholder={mode === "interview" ? "a job interview (Vorstellungsgespräch)" : "e.g. hobbies, food, my family"} maxLength={120} />
            {mode === "interview" && <div className="flex flex-wrap gap-2">{INTERVIEWS.map((i) => <button key={i} onClick={() => setTopic(i)} className="rounded-full border border-line px-3 py-1 text-xs hover:bg-brandsoft">{i}</button>)}</div>}
            <Button onClick={start}><Mic size={16} /> Start conversation</Button>
            <p className="text-xs text-muted">Use headphones to stop the microphone hearing Lena. Chrome’s speech recognition sends your audio to Google to turn it into text.</p>
          </Card>
        </div>
      )}

      {session && (
        <div className="space-y-4">
          <div className="flex items-center gap-3"><div className={`h-4 w-4 rounded-full ${orb}`} /><span className="text-sm font-semibold">{LABEL[status]}</span></div>
          <Card className="max-h-[48vh] space-y-3 overflow-y-auto">
            {turns.map((t, i) => t.role === "user" ? (
              <div key={i} className="flex justify-end"><div className="max-w-[85%] rounded-2xl bg-brand px-4 py-2 text-sm text-white">{t.de}</div></div>
            ) : (
              <div key={i} className="max-w-[90%] rounded-2xl border border-line px-4 py-2">
                {t.de ? <div className="font-semibold">{t.de}</div> : <Spinner label="" />}
                {t.en && <div className="mt-1 text-sm text-muted">{t.en}</div>}
              </div>
            ))}
            {interim && <div className="flex justify-end"><div className="max-w-[85%] rounded-2xl border border-dashed border-brand px-4 py-2 text-sm text-muted">{interim}…</div></div>}
            <div ref={endRef} />
          </Card>
          <div className="flex flex-wrap gap-2">
            <Button onClick={interrupt} disabled={!SR}><Mic size={16} /> Tap to speak</Button>
            <Button variant="ghost" onClick={stopAll}><Square size={16} /> Pause</Button>
            <Button variant="gold" onClick={finish} disabled={scoring || !turns.some((t) => t.role === "user")}>{scoring ? "Scoring…" : "End and get feedback"}</Button>
          </div>
          {!SR && <Recorder onResult={(t) => send(t)} />}
          <form onSubmit={submitTyped} className="flex gap-2">
            <input className="input" value={typed} onChange={(e) => setTyped(e.target.value)} placeholder="Or type your answer in German" aria-label="Type your answer" />
            <Button disabled={!typed.trim()} aria-label="Send"><Send size={16} /></Button>
          </form>
        </div>
      )}

      {scoring && <Spinner label="Preparing your feedback…" />}
      {summary && (
        <div className="space-y-4">
          <Scorecard s={summary} />
          <Button onClick={() => { setSummary(null); setTurns([]); cidRef.current = null; }}>Start a new session</Button>
        </div>
      )}
    </Page>
  );
}
