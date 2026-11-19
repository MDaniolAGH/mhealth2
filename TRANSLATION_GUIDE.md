# Polish translation guide (mhealth2)

The English pages in `src/content/docs/` are the source. Polish pages go to `src/content/docs/pl/` with the **same file names and folders** (`pl/ai-sdlc/agents.mdx`, `pl/product/purpose.mdx`, `pl/index.mdx`, `pl/glossary.mdx`). Polish copies of the big widget components go to `src/components/pl/` with the same file names.

## Audience and tone

- Students of "Aplikacje Mobilne w Medycynie - Od Pomysłu do Wprowadzenia na Rynek" (AGH), Gen Z. Fluent, simple, natural Polish: short sentences, everyday words, no officialese ("urzędowy" style), no calques from English.
- Address the reader in the **informal singular** ("ty"): *Sprawdź*, *Twoja para*, *Zanim zaczniesz*. Pairs are "twoja para".
- Keep the meaning and the structure **exactly**: same headings, same order, same components, same number of bullets/options. Do not add or remove content.
- Polish typography: quotes „…”, en dash – with spaces in sentences, no Oxford comma, decimal comma in prose numbers (6,5) but not in code.

## Do NOT translate (keep in English, inflect naturally in Polish)

agent, agent mode, cloud agent, sub-agent, harness, model, prompt (promptu, prompcie), context window, token (tokeny), tool(s), MCP, skill (skille), hook, sandbox, prompt injection, lethal trifecta, pipeline, quality gate, gate, CI, pull request (pull requesta / PR), commit (commita), branch, merge, worktree, diff, review / code review, test (testy), unit test, widget test, end-to-end, golden test, mutation testing, property-based testing, linter, formatter, analyzer, secret scan, dependency scan, trailer, issue, release, build, debug, backlog, spec, feedback loop, workflow, ADR, SOUP, intended purpose, user story / user stories, acceptance criteria, Given/When/Then, INVEST, MoSCoW (Must, Should, Could, Won't), TL;DR, AI Credits, Copilot, GitHub, Flutter, Mood Tracker, Spec Kit, EARS, MDR, IEC 62304, GDPR (keep "GDPR" or use "RODO" – use **RODO**), FACT / ASSUMPTION / HYPOTHESIS / UNKNOWN labels.

Names stay: Anna, Tomek, Copilot. Stage IDs, file names, paths, commands, code, `inline code`, URLs, anchors (`id="..."`), component names and prop names never change.

## Translate

Stage names (use exactly): Pomysł, Analiza, Wymagania techniczne, Plan, Implementacja, Quality gate, Testy, Dokumentacja, Pull request, Review i merge.
Product map stages: Brief, Decyzja, Fakty i założenia, Intended purpose, Pytania i obserwacje, Spotkanie z klientem, User stories, Kryteria i priorytety, Opcje i estymacje, Rekomendacja.
Lanes/roles: Client → Klient, You → Ty, Agent → Agent, Tools → Narzędzia, Knowledge → Wiedza, Project knowledge → Wiedza o projekcie, Evidence → Dowody, Auditability → Audytowalność, Traceability → Śledzalność, Feedback loops → Pętle zwrotne, Knowledge flows → Przepływy wiedzy, Evidence flows → Przepływy dowodów, Audit trail → Ślad audytowy, Paper trail → Ślad w dokumentach, Walk through → Przejdź krok po kroku.
Other recurring terms: assumption → założenie, decision record → zapis decyzji (ADR), client log → dziennik klienta (`docs/client-log.md`), product card → karta produktu, stakeholder → interesariusz, hard limit → twarde ograniczenie, total cost of ownership → całkowity koszt posiadania (TCO), three-point estimate → estymacja trzypunktowa, kill criterion → kryterium stopu, worked example → przykład, evidence → dowody, synthetic data → dane syntetyczne, synthetic user → syntetyczny użytkownik, "At work" box text is set by the component.

## Code blocks and documents

- Keep **engineering artefacts in English**: code, commands, commit messages, PR descriptions, `AGENTS.md`, `ARCHITECTURE.md`, ADRs, `NOTES.md`, `docs/spec-*.md`, test names, prompts to the agent shown in code blocks may be translated **only if** they are plain-language prompts (translate them: students prompt Copilot in Polish too), app UI strings ("Server: unavailable").
- Translate **business documents** shown in code blocks: `docs/decision.md`, `docs/client-log.md`, `docs/questions.md`, `docs/stories.md` (story text), `docs/recommendation.md`, the product card purpose lines, GOAL-1 text. Keep file names and IDs (GOAL-1, AC-4, S1, ADR-0003) as they are.

## MDX rules (the build breaks otherwise)

- Imports: generic components from `'../../../../components/X.astro'` (one level deeper than English pages; `pl/index.mdx` and `pl/glossary.mdx` use `'../../../components/X.astro'`). Big widgets from the Polish folder: `'../../../../components/pl/PipelineMap.astro'` etc. (PipelineMap, ProductMap, HarnessLab, Race, ContextLab, GateLab, AuditWalk, Subagents).
- Starlight components: `import { Tabs, TabItem } from '@astrojs/starlight/components';` unchanged.
- Inside JSX attribute strings in double quotes (`question="..."`) never use a plain `"`; use „…” or `&quot;`. Inside JS arrays in single quotes (`'...'`) escape `'` as `\'`.
- Keep every `answer={n}` index and every `bin:`/`key:` value unchanged; translate only the visible text (`text`, `why`, `label`, `title`, `intro`, `question`, `options`, `explain`, `items`).
- Relative links (`../knowledge/`, `../../product/purpose/`) stay the same: they resolve inside `/pl/`.

## Widget components (`src/components/pl/`)

Copy the English component, translate the visible text, and:
- import `link` from `'../../lib/url'` and call `link(path, 'pl')`;
- import the script as `import '../../scripts/sdlc.js';`;
- add a `data-i18n` attribute with a JSON string for the texts the script writes (see the keys below) on the widget root element.

Keys (values may contain `{n}`, `{total}`, `{k}`, `{x}`, `{p}`, `{what}` placeholders):
- `.sdlc` root (PipelineMap, ProductMap): `play` "▶ Przejdź krok po kroku", `pause` "❚❚ Pauza", `step` "Krok {n} z {total}", `readSection` "Przeczytaj cały rozdział →", `readKb`, `traced`.
- `.race` root: `step`, `start`, `next`.
- `.ctx-lab` root: `used` "wykorzystane: około {k}", `over`, `belowLean`, `xLean` "≈ {x}× minimum", `relevant` "{p}% istotnych", `nOf` "{n} z {total}", `none`, `stop`, `and`, `notFit`, `missing`, `noise`, `lean`, `segTitle` (see the English fallbacks in `src/scripts/sdlc.js`, function `initCtxLab`).
- `.gate-lab` root: `following`, `passes`, `stopped`, `unreached`.
- `.audit-walk` root: `step`, `complete`, `lost`.
