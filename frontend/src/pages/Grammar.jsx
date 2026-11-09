import { useState } from "react";
import { ChevronDown, Sparkles } from "lucide-react";
import api, { errMsg } from "../api";
import { Button, Card, ErrorBox, Page, Rich, SpeakButton } from "../components/ui";

const TOPICS = [
  ["Articles", "Every noun has a gender: der (masculine), die (feminine), das (neuter). Learn each noun with its article. Plural is always die. Indefinite articles: ein / eine / ein.", [["Der Mann liest ein Buch.", "The man reads a book."], ["Die Frau hat eine Katze.", "The woman has a cat."]]],
  ["Nouns", "All nouns are capitalised. Plurals are formed in several ways (-e, -er, -en, -s, umlaut), so learn the plural with the noun.", [["das Kind, die Kinder", "the child, the children"], ["der Tisch, die Tische", "the table, the tables"]]],
  ["Pronouns", "ich, du, er/sie/es, wir, ihr, sie/Sie. Use du with friends and family, Sie in formal situations.", [["Wir kommen aus Spanien.", "We come from Spain."], ["Sie sind sehr freundlich.", "You (formal) are very friendly."]]],
  ["Verbs & conjugation", "Verbs take endings: -e, -st, -t, -en, -t, -en. The verb is the second element in a statement. Irregular verbs like sein and haben must be memorised.", [["Ich lerne Deutsch.", "I am learning German."], ["Du hast Zeit.", "You have time."]]],
  ["Sentence structure", "Main clause: the conjugated verb is in position 2. Questions without a question word: verb first. Time-Manner-Place is the usual order for details.", [["Heute gehe ich ins Kino.", "Today I go to the cinema."], ["Kommst du morgen?", "Are you coming tomorrow?"]]],
  ["Cases", "Nominativ = subject, Akkusativ = direct object, Dativ = indirect object, Genitiv = possession. The article changes: der → den (Akk.) → dem (Dat.) → des (Gen.).", [["Ich sehe den Hund.", "I see the dog. (Akkusativ)"], ["Ich gebe dem Hund Wasser.", "I give the dog water. (Dativ)"]]],
  ["Adjectives", "Before a noun, adjectives take an ending that depends on gender, case and article. After sein they stay unchanged.", [["Das ist ein großes Haus.", "That is a big house."], ["Das Haus ist groß.", "The house is big."]]],
  ["Prepositions", "Some always take Akkusativ (für, durch, ohne), some always Dativ (mit, nach, bei, von, zu, aus, seit). Two-way prepositions (in, an, auf…) take Akkusativ for movement and Dativ for location.", [["Ich gehe in die Schule.", "I go into the school. (movement)"], ["Ich bin in der Schule.", "I am in the school. (location)"]]],
  ["Tenses", "Spoken past: Perfekt = haben/sein + past participle. Future: werden + infinitive, or present + time word. Written past: Präteritum.", [["Ich habe Pizza gegessen.", "I ate pizza."], ["Ich werde morgen arbeiten.", "I will work tomorrow."]]],
  ["Modal verbs", "dürfen, können, mögen, müssen, sollen, wollen. The modal is conjugated in position 2 and the main verb goes to the end as an infinitive.", [["Ich muss heute arbeiten.", "I have to work today."], ["Kannst du mir helfen?", "Can you help me?"]]],
  ["Separable verbs", "Prefix verbs like aufstehen split in main clauses: the prefix goes to the end.", [["Ich stehe um sieben Uhr auf.", "I get up at seven."], ["Der Zug kommt um acht an.", "The train arrives at eight."]]],
  ["Subordinate clauses", "After weil, dass, wenn, obwohl the conjugated verb goes to the end of the clause.", [["Ich bleibe zu Hause, weil ich krank bin.", "I stay home because I am sick."], ["Er sagt, dass er müde ist.", "He says that he is tired."]]],
];

export default function Grammar() {
  const [open, setOpen] = useState(0);
  const [deep, setDeep] = useState({});
  const [busy, setBusy] = useState("");
  const [err, setErr] = useState("");
  const more = async (t) => {
    setBusy(t); setErr("");
    try { const r = await api.post("/ai/explain", { topic: `German grammar: ${t}` }); setDeep({ ...deep, [t]: r.data.explanation }); } catch (e) { setErr(errMsg(e)); } finally { setBusy(""); }
  };
  return (
    <Page title="Grammar" subtitle="Short rules in plain English with German examples. Ask the tutor to go deeper at your own level.">
      <ErrorBox error={err} />
      <div className="space-y-3">
        {TOPICS.map(([t, rule, ex], i) => (
          <Card key={t} className="p-0">
            <button className="flex w-full items-center justify-between p-4 text-left font-display text-lg font-bold" onClick={() => setOpen(open === i ? -1 : i)} aria-expanded={open === i}>{t}<ChevronDown className={`transition ${open === i ? "rotate-180" : ""}`} size={18} /></button>
            {open === i && (
              <div className="space-y-3 border-t border-line p-4">
                <p>{rule}</p>
                {ex.map(([de, en]) => <div key={de} className="flex items-center gap-2 rounded-xl bg-brandsoft px-3 py-2 text-sm"><SpeakButton text={de} /><strong>{de}</strong><span className="text-muted">{en}</span></div>)}
                {deep[t] ? <div className="rounded-xl border border-line p-3 text-sm"><Rich text={deep[t]} /></div>
                  : <Button variant="ghost" disabled={busy === t} onClick={() => more(t)}><Sparkles size={16} /> {busy === t ? "Asking tutor…" : "Explain more with AI"}</Button>}
              </div>
            )}
          </Card>
        ))}
      </div>
    </Page>
  );
}
