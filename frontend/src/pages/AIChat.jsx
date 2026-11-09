import { useEffect, useRef, useState } from "react";
import { BookmarkPlus, Check, Copy, Plus, Send, Trash2, Eraser } from "lucide-react";
import api, { errMsg } from "../api";
import { Button, ErrorBox, Rich, SpeakButton } from "../components/ui";
import { useAuth } from "../context/AuthContext";

const SUGGESTIONS = ["Ich bin müde. Is that correct?", "Explain der, die, das simply", "Quiz me on greetings", "How do I order a coffee in German?"];

function Bubble({ m, level }) {
  const [copied, setCopied] = useState(false);
  const [saved, setSaved] = useState("");
  const mine = m.role === "user";
  const saveWord = async () => {
    const w = window.prompt("Which German word or phrase from this message should be saved?");
    if (!w) return;
    try {
      const d = (await api.post("/ai/define-word", { word: w })).data;
      await api.post("/vocabulary", { german: d.german || w, english: d.english, pronunciation: d.pronunciation || "", example: d.example || "", category: d.category || "", level: /^[ABC][12]$/.test(d.level) ? d.level : level, source: "chat" });
      setSaved(`Saved “${d.german || w}”`);
    } catch (e) { setSaved(e.response?.status === 409 ? "Already saved" : errMsg(e)); }
  };
  return (
    <div className={`flex ${mine ? "justify-end" : "justify-start"}`}>
      <div className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm ${mine ? "bg-brand text-white" : "border border-line bg-card"}`}>
        <Rich text={m.content} />
        {!mine && (
          <div className="mt-2 flex items-center gap-1 text-muted">
            <SpeakButton text={m.content.replace(/\*\*/g, "")} />
            <button aria-label="Copy" className="rounded-lg p-1.5 hover:bg-brandsoft" onClick={() => { navigator.clipboard.writeText(m.content); setCopied(true); setTimeout(() => setCopied(false), 1500); }}>{copied ? <Check size={16} /> : <Copy size={16} />}</button>
            <button aria-label="Save a word" title="Save a word to vocabulary" className="rounded-lg p-1.5 hover:bg-brandsoft" onClick={saveWord}><BookmarkPlus size={16} /></button>
            {saved && <span className="text-xs">{saved}</span>}
          </div>
        )}
      </div>
    </div>
  );
}

export default function AIChat() {
  const { user } = useAuth();
  const [convs, setConvs] = useState([]);
  const [cid, setCid] = useState(null);
  const [msgs, setMsgs] = useState([]);
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const [showList, setShowList] = useState(false);
  const end = useRef(null);

  const loadList = () => api.get("/ai/conversations").then((r) => setConvs(r.data)).catch(() => {});
  useEffect(() => { loadList(); }, []);
  useEffect(() => { end.current?.scrollIntoView({ behavior: "smooth" }); }, [msgs, busy]);

  const open = async (id) => { setErr(""); setShowList(false); try { const r = await api.get(`/ai/conversations/${id}`); setCid(id); setMsgs(r.data.messages); } catch (e) { setErr(errMsg(e)); } };
  const fresh = () => { setCid(null); setMsgs([]); setErr(""); setShowList(false); };

  const send = async (content) => {
    const t = (content ?? text).trim();
    if (!t || busy) return;
    setText(""); setErr(""); setBusy(true);
    setMsgs((m) => [...m, { id: `u${Date.now()}`, role: "user", content: t }]);
    try {
      const r = await api.post("/ai/chat", { message: t, conversation_id: cid });
      setMsgs((m) => [...m, { id: r.data.message_id, role: "assistant", content: r.data.reply }]);
      if (!cid) { setCid(r.data.conversation_id); loadList(); }
    } catch (e) { setErr(errMsg(e)); } finally { setBusy(false); }
  };

  const clear = async () => { if (cid && window.confirm("Clear all messages in this conversation?")) { await api.post(`/ai/conversations/${cid}/clear`); setMsgs([]); } };
  const remove = async (id) => { if (window.confirm("Delete this conversation?")) { await api.delete(`/ai/conversations/${id}`); if (id === cid) fresh(); loadList(); } };

  const list = (
    <div className="space-y-1">
      <Button className="mb-2 w-full" onClick={fresh}><Plus size={16} /> New conversation</Button>
      {convs.length === 0 && <p className="px-2 text-sm text-muted">Your chats are saved here.</p>}
      {convs.map((c) => (
        <div key={c.id} className={`group flex items-center rounded-xl ${c.id === cid ? "bg-brandsoft" : "hover:bg-brandsoft"}`}>
          <button className="min-w-0 flex-1 truncate px-3 py-2 text-left text-sm" onClick={() => open(c.id)}>{c.title}</button>
          <button aria-label="Delete conversation" className="p-2 text-muted hover:text-bad" onClick={() => remove(c.id)}><Trash2 size={14} /></button>
        </div>
      ))}
    </div>
  );

  return (
    <div className="flex h-[calc(100vh-57px)] md:h-screen">
      <aside className="hidden w-64 shrink-0 overflow-y-auto border-r border-line p-3 lg:block">{list}</aside>
      <section className="flex min-w-0 flex-1 flex-col">
        <div className="flex items-center justify-between border-b border-line px-4 py-3">
          <div><h1 className="text-xl font-bold">AI Tutor</h1><p className="text-xs text-muted">Level {user.settings.level} · answers in German and English</p></div>
          <div className="flex gap-2"><Button variant="ghost" className="lg:hidden" onClick={() => setShowList(!showList)}>History</Button>
            <Button variant="ghost" onClick={clear} disabled={!cid || msgs.length === 0}><Eraser size={16} /> Clear</Button></div>
        </div>
        {showList && <div className="border-b border-line p-3 lg:hidden">{list}</div>}
        <div className="flex-1 space-y-4 overflow-y-auto px-4 py-5">
          {msgs.length === 0 && (
            <div className="mx-auto max-w-md pt-10 text-center">
              <p className="font-display text-3xl font-extrabold">Sprich mit mir.</p>
              <p className="mt-2 text-muted">Write in German or English. I will correct you kindly and explain why.</p>
              <div className="mt-5 flex flex-wrap justify-center gap-2">{SUGGESTIONS.map((s) => <button key={s} onClick={() => send(s)} className="rounded-full border border-line px-3 py-1.5 text-sm hover:bg-brandsoft">{s}</button>)}</div>
            </div>
          )}
          {msgs.map((m) => <Bubble key={m.id} m={m} level={user.settings.level} />)}
          {busy && <div className="flex gap-1 px-2" aria-label="Tutor is typing">{[0, 1, 2].map((i) => <span key={i} className="h-2 w-2 animate-bounce rounded-full bg-muted" style={{ animationDelay: `${i * 0.15}s` }} />)}</div>}
          <ErrorBox error={err} />
          <div ref={end} />
        </div>
        <form onSubmit={(e) => { e.preventDefault(); send(); }} className="flex gap-2 border-t border-line p-3">
          <input className="input" placeholder="Schreib etwas… / Type your message" value={text} onChange={(e) => setText(e.target.value)} maxLength={2000} aria-label="Message" />
          <Button disabled={busy || !text.trim()} aria-label="Send"><Send size={16} /></Button>
        </form>
      </section>
    </div>
  );
}
