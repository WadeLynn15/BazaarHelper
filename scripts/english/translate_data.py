"""English-build data pass for BazaarHelper resources.

Run from the repo root (idempotent):
    python3 scripts/english/translate_data.py src-tauri/resources

What it does
1. items_db.json / skills_db.json
   The official English text ("en" fields) has export bugs that the Chinese
   text does not: durations in milliseconds ("Slow for 2000 second(s)"),
   "(s)" plural placeholders and missing numbers ("Gain  Rage").
   Each English line is cleaned up, and missing numbers are filled in from
   the matching Chinese line. Chinese fields are left untouched.
2. monsters_db.json
   Monster skills/items only have Chinese per-tier descriptions, and their
   numbers are monster-specific (they differ from the player item versions).
   Each line is translated with the pattern table in monster_text_en.json
   (numbers masked as '#', then the monster's own numbers put back).
   The Chinese original is kept in `description_zh` / `extra_description_zh`
   (the app parses it for stat badges). `name_en` is added from the item/skill
   db by id; `name` stays Chinese because the app uses it as a lookup key.
3. event_detail.json / event_encounters.json
   Fixes missing spaces in English choice text ("Gain4Gold." -> "Gain 4 Gold."),
   translates the few choice descriptions that are Chinese in the English field,
   and adds `name_en` (official English title) to events.
"""
import collections
import json
import os
import re
import sys

ORDER = ['bronze', 'silver', 'gold', 'diamond', 'legendary']
NUMTOK = r'[+\-]?\d+(?:\.\d+)?%?'
GROUP = re.compile(rf'({NUMTOK})((?:/{NUMTOK})+)')
TOKEN = re.compile(rf'{NUMTOK}(?:/{NUMTOK})*')
NUM = re.compile(r'\d+(?:\.\d+)?')
DURATION = re.compile(r'(\d+(?:\.\d+)?(?:/\d+(?:\.\d+)?)*)(\s*)(second\(s\)|seconds?\b)')


def fmt_num(v):
    v = round(v, 3)
    return str(int(v)) if v == int(v) else ('%g' % v)


def fix_durations(line):
    def rep(m):
        vals = [float(x) for x in m.group(1).split('/')]
        if all(v >= 100 for v in vals):  # milliseconds -> seconds
            vals = [v / 1000 for v in vals]
            return '/'.join(fmt_num(v) for v in vals) + m.group(2) + m.group(3)
        return m.group(0)
    return DURATION.sub(rep, line)


def fix_plurals(line):
    # "1 item(s)" / "an item(s)" -> singular ; "3 item(s)" -> plural ; slash groups keep "(s)"
    def rep(m):
        num, word = m.group(1), m.group(2)
        if '/' in num:
            return m.group(0)
        single = num.lower() in ('1', 'a', 'an', 'one')
        if single:
            return f'{num} {word}'
        plural = word + ('es' if word.endswith(('s', 'x', 'ch', 'sh')) else 's')
        return f'{num} {plural}'
    line = re.sub(r'\b(\d+(?:\.\d+)?(?:/\d+(?:\.\d+)?)*|an?|one)\s+(\w+)\(s\)', rep, line, flags=re.I)
    return line


def fill_missing_numbers(en, cn):
    """Insert numbers that exist in the Chinese line but are missing from the English one,
    at positions where the English text has a double space."""
    if '  ' not in en or not cn:
        return en
    en_tokens = TOKEN.findall(en)
    cn_tokens = TOKEN.findall(cn)
    # Chinese durations are already in seconds; English may be in ms. Compare loosely.
    missing = [t for t in cn_tokens if t not in en_tokens]
    slots = len(re.findall(r'(?<=\S)  (?=\S)', en))
    if missing and slots == len(missing):
        it = iter(missing)
        en = re.sub(r'(?<=\S)  (?=\S)', lambda m: f' {next(it)} ', en)
    return en


def clean_en(en, cn=''):
    if not en:
        return en
    out = fix_durations(en)
    out = fill_missing_numbers(out, cn)
    out = fix_plurals(out)
    out = re.sub(r'(?<=\S) {2,}(?=\S)', ' ', out)
    return out


def clean_db(entries):
    changed = 0
    for it in entries:
        for key in ('skills', 'skills_passive', 'descriptions'):
            for s in it.get(key) or []:
                if isinstance(s, dict) and s.get('en'):
                    new = clean_en(s['en'], s.get('cn', ''))
                    if new != s['en']:
                        s['en'] = new
                        changed += 1
        if it.get('description_en'):
            new = clean_en(it['description_en'], it.get('description_cn', ''))
            if new != it['description_en']:
                it['description_en'] = new
                changed += 1
        quests = it.get('quests')
        for q in (quests if isinstance(quests, list) else [quests] if isinstance(quests, dict) else []):
            for k_en, k_cn in (('en_target', 'cn_target'), ('en_reward', 'cn_reward')):
                if q.get(k_en):
                    new = clean_en(q[k_en], q.get(k_cn, ''))
                    if new != q[k_en]:
                        q[k_en] = new
                        changed += 1
        for ench in (it.get('enchantments') or {}).values():
            if isinstance(ench, dict) and ench.get('effect_en'):
                new = clean_en(ench['effect_en'], ench.get('effect_cn', ''))
                if new != ench['effect_en']:
                    ench['effect_en'] = new
                    changed += 1
    return changed


def en_lines(entry):
    out = []
    for key in ('skills', 'skills_passive', 'descriptions'):
        for s in entry.get(key) or []:
            if isinstance(s, dict) and (s.get('en') or '').strip():
                out.append(s['en'].strip())
    if not out and (entry.get('description_en') or '').strip():
        out.append(entry['description_en'].strip())
    return out


def tier_list(entry):
    av = [t.strip().lower() for t in (entry.get('available_tiers') or '').split('/') if t.strip()]
    if not av:
        st = (entry.get('starting_tier') or 'Bronze').split(' / ')[0].strip().lower()
        av = ORDER[ORDER.index(st):4] if st in ORDER else ORDER[:4]
    return av


def collapse(line, tier, avail):
    def rep(m):
        vals = [m.group(1)] + m.group(2).split('/')[1:]
        if len(vals) == len(avail) and tier in avail:
            idx = avail.index(tier)
        elif tier in ORDER and avail and avail[0] in ORDER:
            idx = ORDER.index(tier) - ORDER.index(avail[0])
        else:
            idx = 0
        return vals[max(0, min(idx, len(vals) - 1))]
    return GROUP.sub(rep, line)


HAN = re.compile(r'[\u3400-\u9fff\uff00-\uffef\u3000-\u303f]')


def norm_zh(line):
    line = re.sub(r'\s+', ' ', line.strip())
    line = re.sub(r'(?<=[^\x00-\x7f]) | (?=[^\x00-\x7f])', '', line)
    line = re.sub(r'(?<=\d) (?=[^\x00-\x7f])|(?<=[^\x00-\x7f]) (?=\d)', '', line)
    return line


def translate_zh_line(line, table, st):
    """Translate one Chinese monster description line using the pattern table
    (numbers masked as '#'). The monster's own numbers are put back in order."""
    if not HAN.search(line):
        return line
    n = norm_zh(line)
    key = NUM.sub('#', n)
    en = table.get(key)
    if en is None:
        st['untranslated_lines'] += 1
        return line
    nums = iter(NUM.findall(n))
    out = re.sub('#', lambda m: next(nums), en)
    st['translated_lines'] += 1
    return fix_plurals(out)


# Day-9 monsters whose `name` field is Chinese in the source data (official English names)
MONSTER_NAMES = {
    '恐怖弗尔姆': 'Terrorform',
    '流浪岛屿': 'Roaming Isle',
    '绿洲守护神': 'Oasis Guardian',
    '武器平台': 'Weapons Platform',
    '耶丹': 'Yerdan',
}

# Monster skills/items with no id and no exact Chinese-name match in the dbs
EXTRA_NAMES = {
    '毒死蛟': 'Venomous Wyrm',
    '码头绕索': 'Dock Lines',
    '上股工具': 'Tooled Up',
    '刮削利爪': 'Scraping Claws',
    '机械红焰蛮': 'Mech Flame Brute',
    '寒冰爆发': 'Frost Burst',
    '通入虚空': 'Into the Void',
    '失落神祗': 'Lost Idol',
}


def english_name_for(zh_name, cn_names, enchants):
    """Find an English name for a Chinese item/skill name, handling an
    enchantment prefix such as '沉重 獠牙' -> 'Heavy Fang'."""
    zh_name = (zh_name or '').strip()
    if zh_name in cn_names:
        return cn_names[zh_name]
    if zh_name in EXTRA_NAMES:
        return EXTRA_NAMES[zh_name]
    if ' ' in zh_name:
        prefix, base = zh_name.split(' ', 1)
        base_en = cn_names.get(base) or EXTRA_NAMES.get(base)
        if base_en and prefix in enchants:
            return f'{enchants[prefix]} {base_en}'
    return None


def translate_monsters(mons, items, skills, table):
    """Monster skills/items carry monster-specific numbers that differ from the
    player versions in items_db, so their Chinese per-tier text is translated
    directly (pattern table) instead of copying the player item's English text."""
    st = collections.Counter()
    cn_names = {}
    enchants = {}
    for entry in list(items.values()) + list(skills.values()):
        if entry.get('name_cn') and entry.get('name_en'):
            cn_names.setdefault(entry['name_cn'].strip(), entry['name_en'].strip())
        for key, ench in (entry.get('enchantments') or {}).items():
            if isinstance(ench, dict) and ench.get('name_cn'):
                enchants[ench['name_cn']] = key
    for mkey, mon in mons.items():
        zh = mon.get('name_zh') or mkey
        if HAN.search(mon.get('name') or '') and zh in MONSTER_NAMES:
            mon['name'] = MONSTER_NAMES[zh]
            st['monster_names_fixed'] += 1
        for kind in ('skills', 'items'):
            for sub in mon.get(kind) or []:
                st['entries'] += 1
                entry = items.get(sub.get('id')) or skills.get(sub.get('id'))
                if entry and (entry.get('name_en') or '').strip():
                    sub['name_en'] = entry['name_en'].strip()
                else:
                    name_en = english_name_for(sub.get('name'), cn_names, enchants)
                    if name_en:
                        sub['name_en'] = name_en
                        st['names_by_chinese_match'] += 1
                    else:
                        st['no_english_name'] += 1
                for info in (sub.get('tiers') or {}).values():
                    if not info:
                        continue
                    for field in ('description', 'extra_description'):
                        zh_field = field + '_zh'
                        zh = info.get(zh_field, info.get(field) or [])
                        info[zh_field] = zh
                        info[field] = [translate_zh_line(l, table, st) for l in zh]
    return st


# Event choices whose English description field is actually Chinese in the source data
EVENT_CHOICE_TEXT = {
    'Candy Mail': 'At the end of each fight, if this has no Ammo, destroy it permanently.',
    'Super Syrup': 'At the end of each fight, if this has no Ammo, destroy it permanently.',
    'Epicurean Chocolate': 'Adjacent items permanently gain 1%»2%»3%»4% Crit Chance. This permanently loses 1 Max Ammo. Ammo: 10',
}


def fix_event_choices(events):
    n = 0
    for ev in events:
        for ch in ev.get('choices') or []:
            desc = ch.get('description')
            if not desc:
                continue
            if HAN.search(desc) and ch.get('name') in EVENT_CHOICE_TEXT:
                new = EVENT_CHOICE_TEXT[ch['name']]
            else:
                new = fix_event_spacing(desc)
            if new != desc:
                ch['description'] = new
                n += 1
    return n


# Event choice text was scraped from HTML where keywords/tags were separate
# elements, so spaces around them were lost ("YourWeaponsgain", "Shieldand").
EVENT_KEYWORDS = sorted([
    'Burn', 'Poison', 'Shield', 'Heal', 'Regen', 'Haste', 'Slow', 'Freeze', 'Charge',
    'Crit Chance', 'Damage', 'Max Health', 'Health', 'Gold', 'Value', 'XP', 'Ammo',
    'Max Ammo', 'Income', 'Prestige', 'Multicast', 'Lifesteal', 'Flying',
    'Tool', 'Tools', 'Weapon', 'Weapons', 'Friend', 'Friends', 'Food', 'Toy', 'Toys',
    'Drone', 'Drones', 'Apparel', 'Potion', 'Potions', 'Vehicle', 'Vehicles', 'Relic',
    'Relics', 'Aquatic', 'Core', 'Tech', 'Ray', 'Property', 'Properties', 'Dinosaur',
    'Dinosaurs', 'Dragon', 'Dragons', 'Reagent', 'Reagents', 'Loot', 'Heated', 'Chilled',
], key=len, reverse=True)
GLUE_WORDS = r'(?:items?|types?|and|or|from|for|to|in|on|gains?|with|that|this)'


def fix_event_spacing(text):
    # "Gain4Gold." -> "Gain 4 Gold."
    text = re.sub(r'(?<=[a-z])(?=\d)', ' ', text)
    text = re.sub(r'(?<=\d)(?=[A-Z])', ' ', text)
    # "leftmostBurn", "YourWeapons", "MaxAmmo" -> spaced
    text = re.sub(r'(?<=[a-z])(?=[A-Z])', ' ', text)
    # "items+10" -> "items +10" ; "+25%Crit" -> "+25% Crit"
    text = re.sub(r'(?<=[a-z])(?=\+)', ' ', text)
    text = re.sub(r'(?<=%)(?=[A-Za-z])', ' ', text)
    # "+10value", "2on" -> "+10 value", "2 on" (keep ordinals like 2nd/3rd)
    text = re.sub(r'(?<=\d)(?!(?:st|nd|rd|th)\b)(?=[a-z]{2,})', ' ', text)
    # keyword glued to a following word: "Shieldand", "Weaponsgain", "Burnitem"
    kw = '|'.join(re.escape(k) for k in EVENT_KEYWORDS)
    text = re.sub(rf'\b({kw})(?={GLUE_WORDS}\b)', r'\1 ', text)
    return re.sub(r' {2,}', ' ', text)


def load(path):
    with open(path, encoding='utf-8') as f:
        return json.load(f, object_pairs_hook=collections.OrderedDict)


def save(path, data):
    with open(path, 'w', encoding='utf-8', newline='\n') as f:
        json.dump(data, f, ensure_ascii=False, indent=2)


def main():
    res = sys.argv[1]
    items_list = load(os.path.join(res, 'items_db.json'))
    skills_list = load(os.path.join(res, 'skills_db.json'))
    print('items_db lines cleaned:', clean_db(items_list))
    print('skills_db lines cleaned:', clean_db(skills_list))
    save(os.path.join(res, 'items_db.json'), items_list)
    save(os.path.join(res, 'skills_db.json'), skills_list)

    items = {i['id']: i for i in items_list}
    skills = {i['id']: i for i in skills_list}
    mpath = os.path.join(res, 'monsters_db.json')
    mons = load(mpath)
    with open(os.path.join(os.path.dirname(os.path.abspath(__file__)), 'monster_text_en.json'), encoding='utf-8') as f:
        table = json.load(f)
    print('monsters_db:', dict(translate_monsters(mons, items, skills, table)))
    save(mpath, mons)

    epath = os.path.join(res, 'event_detail.json')
    events = load(epath)
    print('event_detail choice descriptions fixed:', fix_event_choices(events))
    save(epath, events)

    # event_encounters.json: add an English title (official localization) and fix choices
    xpath = os.path.join(res, 'event_encounters.json')
    if os.path.exists(xpath):
        enc = load(xpath)
        titled = 0
        for ev in enc:
            if not ev.get('choices'):
                continue
            title = (((ev.get('Localization') or {}).get('Title') or {}).get('Text') or ev.get('InternalName') or '').strip()
            if title and not ev.get('name_en'):
                ev['name_en'] = title
                titled += 1
        print('event_encounters titles added:', titled, '| choice descriptions fixed:', fix_event_choices(enc))
        save(xpath, enc)


if __name__ == '__main__':
    main()
