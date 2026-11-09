"""Course outline for A1-C2. Lessons 1-3 of A1 ship with hand-written content (static_content.py);
every other lesson is generated once by the LLM from its title and cached in the database."""

COURSES = {
    "A1": ("A1 – Beginner", "Survive and introduce yourself in everyday situations."),
    "A2": ("A2 – Elementary", "Talk about the past, plans and daily life."),
    "B1": ("B1 – Intermediate", "Handle work, travel and opinions with complex sentences."),
    "B2": ("B2 – Upper intermediate", "Discuss abstract topics fluently and precisely."),
    "C1": ("C1 – Advanced", "Use nuanced, professional and academic German."),
    "C2": ("C2 – Proficient", "Near-native command of style and register."),
}

CURRICULUM = {
    "A1": [
        ("First Steps", ["German Alphabet and Pronunciation", "Greetings and Introductions", "Numbers and Counting",
                         "Personal Pronouns", "Basic Verbs: sein and haben", "Family and Relationships", "Weekly Revision and Test"]),
        ("Everyday Basics", ["Articles: der, die, das", "Common German Nouns", "Building Simple Sentences", "Days and Months",
                             "Time and Dates", "Common Questions (W-Fragen)", "Revision and Assessment"]),
        ("Daily Life", ["Food and Drink", "Ordering at a Café", "Colors and Adjectives", "Regular Verbs in the Present Tense",
                        "Negation: nicht and kein", "Shopping and Prices", "Revision and Assessment"]),
        ("Around Town", ["Places in the City", "Asking for Directions", "Public Transport", "The Accusative Case (Intro)",
                         "Possessive Articles", "Daily Routine", "Weather and Seasons", "Final A1 Assessment"]),
    ],
    "A2": [
        ("Past and Future", ["The Perfekt Tense", "Irregular Past Participles", "Präteritum of sein, haben and Modals",
                             "Talking About the Future with werden", "Revision and Assessment"]),
        ("Cases and Structure", ["The Dative Case", "Dative Prepositions", "Two-Way Prepositions", "Separable Verbs",
                                 "Modal Verbs in Depth", "Revision and Assessment"]),
        ("Real-Life German", ["Comparatives and Superlatives", "Reflexive Verbs", "Health and the Doctor", "Housing and Moving",
                              "Work and Professions", "Travel and Hotels", "Final A2 Assessment"]),
    ],
    "B1": [
        ("Complex Sentences", ["Subordinate Clauses with weil and dass", "Conjunctions: obwohl, wenn, als", "Relative Clauses",
                               "Indirect Questions", "Infinitive with zu", "Revision and Assessment"]),
        ("Expression", ["Adjective Declension", "The Passive Voice (Present)", "Konjunktiv II for Wishes and Politeness",
                        "Expressing Opinions", "Reading News Headlines", "Revision and Assessment"]),
        ("Practical German", ["Formal Emails and Letters", "Job Interviews", "Bureaucracy and Appointments",
                              "Media and Technology", "Final B1 Assessment"]),
    ],
    "B2": [
        ("Advanced Grammar", ["Passive with Modal Verbs", "Konjunktiv I and Reported Speech", "Participial Constructions",
                              "Nominalization", "Revision and Assessment"]),
        ("Fluent Communication", ["Discussion and Debate", "Connectors and Discourse Markers", "Formal Presentations",
                                  "Idioms and Colloquial Speech", "Society and Environment", "Final B2 Assessment"]),
    ],
    "C1": [
        ("Nuance and Style", ["Advanced Passive Alternatives", "Nominal Style in Academic German", "Modal Particles",
                              "Register and Tone", "Revision and Assessment"]),
        ("Academic and Professional", ["Writing Argumentative Essays", "Understanding Literary Texts",
                                       "Specialist Vocabulary: Law and Economy", "Final C1 Assessment"]),
    ],
    "C2": [
        ("Mastery", ["Stylistic Variation and Rhetoric", "Dialects and Regional Variation", "Advanced Idioms and Proverbs",
                     "Translation and Interpreting Skills", "Final C2 Assessment"]),
    ],
}
