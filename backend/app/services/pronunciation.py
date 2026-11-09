"""Turns IPA symbols into simple English-style respelling ("ɪç bɪn ˈmyːdə" -> "ikh bin MUEDEH").
Used as a safety net because some AI models ignore the instruction and write IPA."""
import re

IPA_CHARS = set("ːɪʁəʏɛʊŋɔʃçˈˌɐœøɑʔɡʀ\u032f\u0361\u0329\u0325\u0303")

# Longest keys win (single pass, so replaced text is never converted twice).
MAP = {
    "iːɐ": "eer", "eːɐ": "air", "ɛːɐ": "air", "aːɐ": "ar", "oːɐ": "or", "uːɐ": "oor", "yːɐ": "uer", "øːɐ": "oer",
    "aɪ": "igh", "aʊ": "ow", "ɔʏ": "oy", "ɔɪ": "oy", "tʃ": "ch",
    "aː": "ah", "eː": "ay", "ɛː": "eh", "iː": "ee", "oː": "oh", "øː": "oe", "uː": "oo", "yː": "ue",
    "ɐ": "uh", "ə": "eh", "ʁ": "r", "ʀ": "r", "ç": "kh", "x": "kh", "ʃ": "sh", "ŋ": "ng", "ʏ": "ue", "œ": "oe", "ø": "oe",
    "ɪ": "i", "ʊ": "u", "ɛ": "e", "ɔ": "o", "ɑ": "ah", "a": "ah", "j": "y", "ɡ": "g", "ʔ": "",
    "/": "", "[": "", "]": "", "ː": "",
}
_PATTERN = re.compile("|".join(re.escape(k) for k in sorted(MAP, key=len, reverse=True)))


def has_ipa(text: str) -> bool:
    return bool(IPA_CHARS & set(text or ""))


def to_respelling(text: str) -> str:
    if not has_ipa(text):
        return text
    s = text.replace(":", "ː")
    s = re.sub("[\u0300-\u036f]", "", s)  # tie bars and diacritics
    s = _PATTERN.sub(lambda m: MAP[m.group(0)], s)
    out, upper = [], False
    for ch in s:  # stress mark -> CAPITALS for that syllable
        if ch == "ˈ":
            upper = True
        elif ch == "ˌ":
            continue
        elif ch in " .":
            upper = False
            out.append("-" if ch == "." else ch)
        else:
            out.append(ch.upper() if upper else ch)
    return re.sub(r"\s+", " ", "".join(out)).strip()


def fix_content(content: dict) -> bool:
    """Converts IPA pronunciations inside lesson content in place. Returns True if anything changed."""
    changed = False
    for key in ("vocabulary", "examples"):
        for item in content.get(key, []):
            if isinstance(item, dict) and has_ipa(str(item.get("pronunciation", ""))):
                item["pronunciation"] = to_respelling(item["pronunciation"])
                changed = True
    return changed
