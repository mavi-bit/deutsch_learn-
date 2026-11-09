"""Hand-written content for A1 Days 1-3 (content format v2). Every word used in a sentence is in that day's vocabulary."""


def _build(objectives, vocab, gtitle, gtext, examples, practical, dialogue, rtitle, reading, questions):
    sent = lambda rows: [{"german": g, "english": e, "pronunciation": p} for g, e, p in rows]
    return {
        "v": 2,
        "objectives": objectives,
        "vocabulary": [{"german": g, "english": e, "pronunciation": p, "category": ""} for g, e, p in vocab],
        "grammar": {"title": gtitle, "explanation": gtext},
        "examples": sent(examples),
        "practical": practical,
        "dialogue": [{"speaker": s, "german": g, "english": e, "pronunciation": p} for s, g, e, p in dialogue],
        "reading": {"title": rtitle, "sentences": sent(reading), "glossary": [],
                    "questions": [{"question": q, "answer": a} for q, a in questions]},
    }


DAY1 = _build(
    ["Pronounce the special German letters ä, ö, ü and ß", "Say the key sounds: ch, sch, ei, ie, z, v, w",
     "Read and say 10 simple sentences using the words below"],
    [("der Apfel", "the apple", "AHP-fel"), ("das Buch", "the book", "BOOKH"), ("das Haus", "the house", "HOWSS"),
     ("die Schule", "the school", "SHOO-leh"), ("die Straße", "the street", "SHTRAH-seh"), ("das Wasser", "the water", "VAH-ser"),
     ("das Mädchen", "the girl", "MEHD-khen"), ("die Zeit", "the time", "TSITE"), ("der Vogel", "the bird", "FOH-gel"),
     ("das Auto", "the car", "OW-toh"), ("kalt", "cold", "KAHLT"), ("groß", "big / tall", "GROHSS"), ("klein", "small", "KLINE"),
     ("ist", "is", "IST"), ("sind", "are", "ZINT"), ("ein / eine", "a / an", "INE / I-neh"), ("lesen", "to read", "LAY-zen"),
     ("und", "and", "OONT"), ("hier", "here", "HEER")],
    "Sounds that differ from English",
    "German is mostly phonetic: you say what you see.\n\n"
    "• ä is like the 'e' in 'bed'. ö is like 'e' in 'her' with rounded lips. ü is 'ee' with rounded lips.\n"
    "• ß is a sharp 'ss' (Straße).\n"
    "• ch after a, o, u is a throaty 'kh' (Buch). After i or e it is a soft hiss (ich).\n"
    "• sch = 'sh' (Schule). At the start of a word, st = 'sht' and sp = 'shp'.\n"
    "• ei = 'eye' (Zeit). ie = long 'ee' (hier).\n"
    "• z = 'ts' (Zeit); v = 'f' (Vogel); w = 'v' (Wasser).\n"
    "• All nouns are written with a capital letter, and each noun has a gender: der, die or das. Learn the word together with its article.",
    [("Das ist ein Apfel.", "That is an apple.", "dahss ist ine AHP-fel"),
     ("Das Wasser ist kalt.", "The water is cold.", "dahss VAH-ser ist KAHLT"),
     ("Das Haus ist groß.", "The house is big.", "dahss HOWSS ist GROHSS"),
     ("Die Schule ist klein.", "The school is small.", "dee SHOO-leh ist KLINE"),
     ("Das Auto ist hier.", "The car is here.", "dahss OW-toh ist HEER"),
     ("Ich lese ein Buch.", "I read a book.", "ikh LAY-zeh ine BOOKH"),
     ("Der Vogel ist klein.", "The bird is small.", "dair FOH-gel ist KLINE"),
     ("Die Straße ist groß.", "The street is big.", "dee SHTRAH-seh ist GROHSS"),
     ("Das Mädchen ist hier.", "The girl is here.", "dahss MEHD-khen ist HEER"),
     ("Der Apfel und das Buch sind hier.", "The apple and the book are here.", "dair AHP-fel oont dahss BOOKH zint HEER")],
    ["Read street signs or product labels and sound them out.", "Say the 10 sentences aloud twice, slowly.",
     "Find three German words you already know (Hotel, Kindergarten, Rucksack)."],
    [("A", "Hier ist ein Auto.", "Here is a car.", "heer ist ine OW-toh"), ("B", "Das Auto ist klein.", "The car is small.", "dahss OW-toh ist KLINE"),
     ("A", "Und das Haus?", "And the house?", "oont dahss HOWSS"), ("B", "Das Haus ist groß.", "The house is big.", "dahss HOWSS ist GROHSS"),
     ("A", "Das Wasser ist kalt.", "The water is cold.", "dahss VAH-ser ist KAHLT"),
     ("B", "Und der Apfel ist hier.", "And the apple is here.", "oont dair AHP-fel ist HEER")],
    "At the house",
    [("Das ist ein Haus.", "That is a house.", "dahss ist ine HOWSS"), ("Das Haus ist groß.", "The house is big.", "dahss HOWSS ist GROHSS"),
     ("Hier ist ein Auto.", "Here is a car.", "heer ist ine OW-toh"), ("Das Auto ist klein.", "The car is small.", "dahss OW-toh ist KLINE"),
     ("Ich lese ein Buch.", "I read a book.", "ikh LAY-zeh ine BOOKH"), ("Das Wasser ist kalt.", "The water is cold.", "dahss VAH-ser ist KAHLT")],
    [("Is the house big or small?", "Big (groß)."), ("What is cold?", "The water (das Wasser)."), ("What do I read?", "A book (ein Buch).")],
)

DAY2 = _build(
    ["Greet people at different times of day", "Introduce yourself and ask someone's name",
     "Say how you are and where you come from"],
    [("Hallo", "Hello", "HAH-loh"), ("Guten Morgen", "Good morning", "GOO-ten MOR-gen"), ("Guten Tag", "Good day / Hello", "GOO-ten TAHK"),
     ("Guten Abend", "Good evening", "GOO-ten AH-bent"), ("Gute Nacht", "Good night", "GOO-teh NAKHT"), ("Tschüss", "Bye", "CHUESS"),
     ("Auf Wiedersehen", "Goodbye (formal)", "owf VEE-der-zay-en"), ("Bitte", "Please / You're welcome", "BIT-teh"),
     ("Danke", "Thank you", "DAHN-keh"), ("ja", "yes", "YAH"), ("nein", "no", "NINE"), ("heißen", "to be called", "HY-sen"),
     ("kommen", "to come", "KOM-men"), ("aus", "from", "OWSS"), ("gut", "good / well", "GOOT"), ("wie", "how", "VEE"),
     ("du / dir", "you (informal)", "DOO / DEER"), ("Sie", "you (formal)", "ZEE"), ("mir", "to me", "MEER"),
     ("Wie geht es dir?", "How are you?", "vee gayt ess DEER"), ("Mir geht es gut.", "I am doing well.", "meer gayt ess GOOT"),
     ("Deutschland", "Germany", "DOYTCH-lahnt")],
    "Introducing yourself: Ich heiße… / Ich komme aus…",
    "To say your name: 'Ich heiße Anna' (literally: I am called Anna).\n"
    "To say where you are from: 'Ich komme aus Deutschland'.\n"
    "To ask someone's name: 'Wie heißt du?' (informal) or 'Wie heißen Sie?' (formal).\n\n"
    "du vs Sie: use 'du' with friends, family and children. Use 'Sie' (always capital S) with strangers, older people and at work. When unsure, use Sie.\n\n"
    "Verbs change their ending with the subject: ich heiße, du heißt, Sie heißen. ich komme, du kommst, Sie kommen.",
    [("Guten Morgen!", "Good morning!", "GOO-ten MOR-gen"), ("Wie geht es dir?", "How are you?", "vee gayt ess DEER"),
     ("Mir geht es gut, danke.", "I am doing well, thanks.", "meer gayt ess GOOT, DAHN-keh"),
     ("Ich heiße Anna.", "My name is Anna.", "ikh HY-seh AH-nah"), ("Wie heißt du?", "What is your name?", "vee HYST doo"),
     ("Ich komme aus Deutschland.", "I come from Germany.", "ikh KOM-meh owss DOYTCH-lahnt"),
     ("Wie heißen Sie?", "What is your name? (formal)", "vee HY-sen zee"), ("Auf Wiedersehen!", "Goodbye!", "owf VEE-der-zay-en"),
     ("Danke! Bitte!", "Thanks! You're welcome!", "DAHN-keh! BIT-teh"), ("Und du?", "And you?", "oont DOO")],
    ["Greet three people today with the right time-of-day greeting.", "Practise introducing yourself in under 10 seconds.",
     "Decide: would you use du or Sie with a bank clerk? (Sie)"],
    [("A", "Hallo! Ich heiße Anna.", "Hello! My name is Anna.", "HAH-loh! ikh HY-seh AH-nah"),
     ("B", "Hallo Anna! Ich heiße Tom.", "Hello Anna! My name is Tom.", "HAH-loh AH-nah! ikh HY-seh TOM"),
     ("A", "Wie geht es dir?", "How are you?", "vee gayt ess DEER"),
     ("B", "Mir geht es gut, danke. Und dir?", "I am well, thanks. And you?", "meer gayt ess GOOT, DAHN-keh. oont DEER"),
     ("A", "Gut, danke! Ich komme aus Deutschland.", "Good, thanks! I come from Germany.", "GOOT, DAHN-keh! ikh KOM-meh owss DOYTCH-lahnt"),
     ("B", "Tschüss, Anna!", "Bye, Anna!", "CHUESS, AH-nah")],
    "Anna says hello",
    [("Guten Morgen! Ich heiße Anna.", "Good morning! My name is Anna.", "GOO-ten MOR-gen! ikh HY-seh AH-nah"),
     ("Ich komme aus Deutschland.", "I come from Germany.", "ikh KOM-meh owss DOYTCH-lahnt"),
     ("Wie geht es dir?", "How are you?", "vee gayt ess DEER"), ("Mir geht es gut, danke.", "I am doing well, thanks.", "meer gayt ess GOOT, DAHN-keh"),
     ("Und du?", "And you?", "oont DOO"), ("Tschüss!", "Bye!", "CHUESS")],
    [("What is her name?", "Anna."), ("Where does she come from?", "Germany (Deutschland)."), ("How is she?", "Well (gut).")],
)

DAY3 = _build(
    ["Count from 0 to 12, then 15 and 20", "Say your age, prices and the time with numbers", "Use the numbers in 10 real sentences"],
    [("null", "zero", "NOOL"), ("eins", "one", "INES"), ("zwei", "two", "TSVY"), ("drei", "three", "DRY"), ("vier", "four", "FEER"),
     ("fünf", "five", "FUENF"), ("sechs", "six", "ZEKS"), ("sieben", "seven", "ZEE-ben"), ("acht", "eight", "AKHT"),
     ("neun", "nine", "NOYN"), ("zehn", "ten", "TSAYN"), ("elf", "eleven", "ELF"), ("zwölf", "twelve", "TSVOELF"),
     ("fünfzehn", "fifteen", "FUENF-tsayn"), ("zwanzig", "twenty", "TSVAHN-tsikh"), ("das Jahr / die Jahre", "the year / years", "YAHR / YAH-reh"),
     ("alt", "old", "AHLT"), ("der Euro", "the euro", "OY-roh"), ("die Uhr", "the clock / o'clock", "OOR"),
     ("kosten", "to cost", "KOS-ten"), ("der Bruder / die Brüder", "the brother / brothers", "BROO-der / BRUE-der"),
     ("das Buch / die Bücher", "the book / books", "BOOKH / BUE-kher"), ("die Person / die Personen", "the person / people", "per-ZOHN / per-ZOH-nen"),
     ("haben", "to have", "HAH-ben"), ("wie viel", "how much", "vee FEEL")],
    "Number patterns and the verb haben",
    "11 = elf and 12 = zwölf are irregular. From 13 to 19 add -zehn to the unit: dreizehn, vierzehn, fünfzehn. Note sechzehn and siebzehn lose letters.\n\n"
    "Above 20, German says the unit first: 21 = einundzwanzig (one-and-twenty). Numbers are written as one word.\n\n"
    "Age: 'Ich bin zwanzig Jahre alt.' Price: 'Das kostet zehn Euro.' Time: 'Es ist acht Uhr.'\n\n"
    "haben (to have): ich habe, du hast, er/sie/es hat, wir haben, ihr habt, sie/Sie haben.",
    [("Ich bin zwanzig Jahre alt.", "I am twenty years old.", "ikh bin TSVAHN-tsikh YAH-reh ahlt"),
     ("Ich habe zwei Brüder.", "I have two brothers.", "ikh HAH-beh tsvy BRUE-der"),
     ("Das kostet zehn Euro.", "That costs ten euros.", "dahss KOS-tet tsayn OY-roh"), ("Es ist acht Uhr.", "It is eight o'clock.", "ess ist AKHT OOR"),
     ("Wir sind drei Personen.", "There are three of us.", "veer zint dry per-ZOH-nen"),
     ("Ich habe fünf Bücher.", "I have five books.", "ikh HAH-beh fuenf BUE-kher"),
     ("Sie ist fünfzehn Jahre alt.", "She is fifteen years old.", "zee ist FUENF-tsayn YAH-reh ahlt"),
     ("Das Buch kostet zwölf Euro.", "The book costs twelve euros.", "dahss BOOKH KOS-tet tsvoelf OY-roh"),
     ("Es ist sieben Uhr.", "It is seven o'clock.", "ess ist ZEE-ben OOR"), ("Wir haben vier Euro.", "We have four euros.", "veer HAH-ben feer OY-roh")],
    ["Count the steps you take today in German.", "Say your phone number aloud in German.", "Practise: 3, 7, 12, 15, 20."],
    [("A", "Wie viel kostet das Buch?", "How much does the book cost?", "vee FEEL KOS-tet dahss BOOKH"),
     ("B", "Das Buch kostet zehn Euro.", "The book costs ten euros.", "dahss BOOKH KOS-tet tsayn OY-roh"),
     ("A", "Ich habe zwölf Euro.", "I have twelve euros.", "ikh HAH-beh tsvoelf OY-roh"),
     ("B", "Gut! Es ist acht Uhr.", "Good! It is eight o'clock.", "GOOT! ess ist AKHT OOR"),
     ("A", "Wir sind drei Personen.", "There are three of us.", "veer zint dry per-ZOH-nen"),
     ("B", "Ich habe fünf Bücher.", "I have five books.", "ikh HAH-beh fuenf BUE-kher")],
    "Anna and her books",
    [("Anna ist zwanzig Jahre alt.", "Anna is twenty years old.", "AH-nah ist TSVAHN-tsikh YAH-reh ahlt"),
     ("Sie hat fünf Bücher.", "She has five books.", "zee haht fuenf BUE-kher"),
     ("Das Buch kostet zehn Euro.", "The book costs ten euros.", "dahss BOOKH KOS-tet tsayn OY-roh"),
     ("Anna hat zwei Brüder.", "Anna has two brothers.", "AH-nah haht tsvy BRUE-der"),
     ("Es ist acht Uhr.", "It is eight o'clock.", "ess ist AKHT OOR"), ("Wir sind drei Personen.", "There are three of us.", "veer zint dry per-ZOH-nen")],
    [("How old is Anna?", "Twenty (zwanzig)."), ("How many books does she have?", "Five (fünf)."), ("How much does the book cost?", "Ten euros (zehn Euro).")],
)

STATIC = {("A1", 1): DAY1, ("A1", 2): DAY2, ("A1", 3): DAY3}
