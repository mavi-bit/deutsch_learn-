import { useState } from "react";
import { AlertCircle, Loader2, Volume2 } from "lucide-react";
import { speak } from "../audio";

export const Card = ({ className = "", ...p }) => <div className={`rounded-2xl border border-line bg-card p-5 ${className}`} {...p} />;

export function Button({ variant = "primary", className = "", ...p }) {
  const v = {
    primary: "bg-brand text-white hover:opacity-90",
    gold: "bg-gold text-[#1b1400] hover:opacity-90",
    ghost: "border border-line hover:bg-brandsoft",
    danger: "border border-bad text-bad hover:bg-bad/10",
  }[variant];
  return <button {...p} className={`inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition disabled:opacity-50 ${v} ${className}`} />;
}

export const ProgressBar = ({ value, className = "" }) => (
  <div className={`h-2.5 overflow-hidden rounded-full bg-brandsoft ${className}`} role="progressbar" aria-valuenow={value} aria-valuemin={0} aria-valuemax={100}>
    <div className="h-full rounded-full bg-brand transition-all" style={{ width: `${Math.min(100, value)}%` }} />
  </div>
);

export const Spinner = ({ label = "Loading…" }) => (
  <div className="flex items-center justify-center gap-2 py-16 text-muted"><Loader2 className="animate-spin" size={18} /> {label}</div>
);

export const ErrorBox = ({ error }) => error ? (
  <div role="alert" className="flex items-start gap-2 rounded-xl border border-bad/40 bg-bad/10 p-3 text-sm text-bad"><AlertCircle size={16} className="mt-0.5 shrink-0" />{error}</div>
) : null;

export function Page({ title, subtitle, actions, children }) {
  return (
    <div className="mx-auto max-w-5xl px-4 py-6 md:px-8 md:py-10">
      <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-3xl font-extrabold md:text-4xl">{title}</h1>
          {subtitle && <p className="mt-1 max-w-xl text-muted">{subtitle}</p>}
        </div>
        {actions}
      </div>
      {children}
    </div>
  );
}

export function SpeakButton({ text, className = "" }) {
  const [busy, setBusy] = useState(false);
  return (
    <button aria-label={`Listen: ${text}`} title="Listen" disabled={busy} className={`rounded-lg p-1.5 text-brand hover:bg-brandsoft ${className}`}
      onClick={async () => { setBusy(true); try { await speak(text); } catch { /* no audio available */ } finally { setBusy(false); } }}>
      {busy ? <Loader2 size={16} className="animate-spin" /> : <Volume2 size={16} />}
    </button>
  );
}

/** Renders **bold** and keeps line breaks. */
export function Rich({ text }) {
  return <div className="whitespace-pre-wrap leading-relaxed">{text.split(/(\*\*[^*]+\*\*)/g).map((s, i) => s.startsWith("**") ? <strong key={i}>{s.slice(2, -2)}</strong> : s)}</div>;
}

export const fmtTime = (s) => (s >= 3600 ? `${Math.floor(s / 3600)}h ${Math.round((s % 3600) / 60)}m` : `${Math.round(s / 60)} min`);
