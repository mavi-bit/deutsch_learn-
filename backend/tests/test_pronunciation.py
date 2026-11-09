from app.services.pronunciation import to_respelling


def test_ipa_becomes_easy_respelling():
    assert to_respelling("ɪç") == "ikh"
    assert to_respelling("viːɐ̯") == "veer"
    assert to_respelling("diː fʁaʊ̯") == "dee frow"
    assert to_respelling("ɪç bɪn ˈmyːdə") == "ikh bin MUEDEH"


def test_easy_respelling_is_left_alone():
    assert to_respelling("ikh bin MUE-deh") == "ikh bin MUE-deh"
