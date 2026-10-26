# English build notes

This branch (`english`) is an English translation of BazaarHelper (集市小抄) v1.6.4.

## What was changed
- **Interface**: every visible label, button, tooltip, toast and dialog in the
  React frontend (`src/`) was translated. Code that is never loaded
  (e.g. `OverlayApp.tsx`, `MainContentSection.tsx`) was left alone.
- **Game data display**: items, skills, tags, enchantments, quests, events and
  monsters show their English names/text instead of Chinese.
- **Backend messages** (`src-tauri/src/`): tray menu, status messages shown in the
  island bar, and errors shown in the UI. The island bar parses some of these
  messages, so frontend (`AppV2.tsx`, `useYoloScan.ts`) and backend
  (`platforms/monitor.rs`, `data_management/log_monitor.rs`) use the same English text.
  Chinese strings that are lookup keys into the data (monster names, trap names,
  size words) were intentionally kept.
- **Data files** (`src-tauri/resources/`): processed by `translate_data.py` (see its
  docstring). It fixes bugs in the official English text (millisecond durations,
  "(s)" plurals, missing spaces), translates monster per-tier text with the
  pattern table `monster_text_en.json`, and adds English names. The original
  Chinese stays in the files (`*_zh` fields) because the app still parses it for
  stat badges.
- Installer language is English only.

## Re-applying to a newer upstream version
1. Merge or rebase onto the new upstream release.
2. Run `python3 scripts/english/translate_data.py src-tauri/resources`
   (any new monster text pattern it cannot translate is counted as
   `untranslated_lines`; add it to `monster_text_en.json`).
3. Search the frontend for remaining Chinese UI text and translate it.
4. Push to the `english` branch; `.github/workflows/english-build.yml` builds the
   Windows installer and attaches it to the workflow run.

Note: the app's built-in updater still points at the official (Chinese) releases.
Installing an update from inside the app replaces this English build.
