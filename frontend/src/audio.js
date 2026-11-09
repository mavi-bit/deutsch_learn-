import api from "./api";

let current = null;

/** Plays German speech from the backend TTS; falls back to the browser voice if the server TTS is unavailable. */
export async function speak(text) {
  try {
    const r = await api.post("/speech/synthesize", { text }, { responseType: "blob" });
    if (current) current.pause();
    current = new Audio(URL.createObjectURL(r.data));
    await current.play();
    return "server";
  } catch (e) {
    if ("speechSynthesis" in window) {
      const u = new SpeechSynthesisUtterance(text);
      u.lang = "de-DE";
      window.speechSynthesis.cancel();
      window.speechSynthesis.speak(u);
      return "browser";
    }
    throw e;
  }
}
