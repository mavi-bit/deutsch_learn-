import { useState } from "react";
import { useAuth } from "../context/AuthContext";
import { errMsg } from "../api";
import { Button, ErrorBox } from "../components/ui";

export default function Login() {
  const { login, register } = useAuth();
  const [mode, setMode] = useState("login");
  const [f, setF] = useState({ email: "", name: "", password: "" });
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });

  const submit = async (e) => {
    e.preventDefault();
    setErr(""); setBusy(true);
    try { mode === "login" ? await login(f.email, f.password) : await register(f.email, f.name, f.password); }
    catch (x) { setErr(errMsg(x)); } finally { setBusy(false); }
  };

  return (
    <div className="grid min-h-screen md:grid-cols-2">
      <div className="hidden flex-col justify-between bg-brand p-12 text-white md:flex">
        <div className="font-display text-3xl font-extrabold">Lern<span className="text-gold">werk</span></div>
        <div>
          <p className="font-display text-6xl font-extrabold leading-[1.05]">Guten Morgen.<br />Wie geht’s dir?</p>
          <p className="mt-6 max-w-sm text-lg text-white/80">Daily German lessons from A1 to C2, an AI tutor who corrects you kindly, and progress that is saved wherever you log in.</p>
        </div>
        <div className="text-sm text-white/60">Day 1 starts with the alphabet. Day 100 reads the news.</div>
      </div>
      <div className="flex items-center justify-center p-6">
        <form onSubmit={submit} className="w-full max-w-sm space-y-4">
          <h1 className="text-3xl font-extrabold">{mode === "login" ? "Welcome back" : "Create your account"}</h1>
          {mode === "register" && <input className="input" placeholder="Your name" value={f.name} onChange={set("name")} required aria-label="Name" />}
          <input className="input" type="email" placeholder="Email" value={f.email} onChange={set("email")} required aria-label="Email" />
          <input className="input" type="password" placeholder="Password (8+ characters, letters and numbers)" value={f.password} onChange={set("password")} required aria-label="Password" />
          <ErrorBox error={err} />
          <Button className="w-full" disabled={busy}>{busy ? "Please wait…" : mode === "login" ? "Log in" : "Create account"}</Button>
          <button type="button" className="w-full text-sm text-muted hover:text-ink" onClick={() => { setMode(mode === "login" ? "register" : "login"); setErr(""); }}>
            {mode === "login" ? "New here? Create an account" : "Already have an account? Log in"}
          </button>
        </form>
      </div>
    </div>
  );
}
