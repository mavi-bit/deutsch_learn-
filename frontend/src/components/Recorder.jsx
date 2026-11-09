import { useRef, useState } from "react";
import { Loader2, Mic, Square } from "lucide-react";
import api, { errMsg } from "../api";
import { ErrorBox } from "./ui";

/** Records from the microphone, sends the audio to /api/speech/transcribe, and returns the German transcript. */
export default function Recorder({ onResult }) {
  const [rec, setRec] = useState(false);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const mr = useRef(null);
  const chunks = useRef([]);

  const start = async () => {
    setErr("");
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const m = new MediaRecorder(stream);
      chunks.current = [];
      m.ondataavailable = (e) => chunks.current.push(e.data);
      m.onstop = async () => {
        stream.getTracks().forEach((t) => t.stop());
        setBusy(true);
        try {
          const fd = new FormData();
          fd.append("file", new Blob(chunks.current, { type: m.mimeType || "audio/webm" }), "speech.webm");
          const r = await api.post("/speech/transcribe", fd);
          onResult(r.data.text);
        } catch (e) { setErr(errMsg(e)); } finally { setBusy(false); }
      };
      m.start();
      mr.current = m;
      setRec(true);
    } catch { setErr("Microphone not available. Allow access in your browser or type your answer instead."); }
  };
  const stop = () => { mr.current?.stop(); setRec(false); };

  return (
    <div className="space-y-2">
      <button onClick={rec ? stop : start} disabled={busy}
        className={`inline-flex items-center gap-2 rounded-full px-5 py-3 text-sm font-semibold text-white transition ${rec ? "bg-bad animate-pulse" : "bg-brand"} disabled:opacity-60`}>
        {busy ? <Loader2 size={18} className="animate-spin" /> : rec ? <Square size={18} /> : <Mic size={18} />}
        {busy ? "Transcribing…" : rec ? "Stop recording" : "Record"}
      </button>
      <ErrorBox error={err} />
    </div>
  );
}
