# Aplikacje Mobilne w Medycynie - Od Pomysłu do Wprowadzenia na Rynek

*Mobile Apps in Medicine - From Idea to Market*

Course website for the Digital Health Engineering Studio (AGH University of Krakow): an interactive guide to building software with coding agents. Part 1 (AI SDLC) follows one feature of the Mood Tracker from a sketch to a merged pull request; Part 2 (product development with agents) covers the business side, from a client's brief to user stories and a recommendation.

**Live site:** <https://mdaniolagh.github.io/mhealth2/> (English) · <https://mdaniolagh.github.io/mhealth2/pl/> (Polski)

Built with [Astro Starlight](https://starlight.astro.build). Ported from the *Agentic SDLC* guide of the Multiplatform Mobile Software Engineering course and adapted to this course (GitHub Copilot, the Mood Tracker handover, workshops W2–W6).

## Run locally

Needs Node.js 22 or newer.

```bash
npm install
npm run dev        # http://localhost:4321/mhealth2/
npm run build      # static site in dist/
npm run preview    # serve dist/ as GitHub Pages will
```

Every push to `main` builds and deploys the site (`.github/workflows/deploy.yml`).

## Where things are

| Path | What |
|---|---|
| `src/content/docs/` | the pages (MDX); the sidebar is in `astro.config.mjs` |
| `src/components/` | AI SDLC widgets: `PipelineMap`, `HarnessLab`, `Race`, `ContextLab`, `GateLab`, `AuditWalk`; product widgets: `DiscoveryMap`, `Sorter`, `MultiCheck`, `OptionsBoard`, `Estimator`; teaching components: `Quiz` (with per-option feedback), `Predict`, `Checklist`, `StageFacts`, `StageStrip` |
| `src/scripts/sdlc.js` | behaviour of the map and the labs (plain DOM code) |
| `src/styles/` | `theme.css` (site colours), `sdlc.css` (design tokens and the AI SDLC widgets), `learn.css` (teaching components), `biz.css` (product widgets). All colours come from the tokens at the top of `sdlc.css`, with a light and a dark value. |

Links inside components go through `link()` in `src/lib/url.ts`, so they keep the `/mhealth2/` base path.

## Adding a quiz or a prediction to a page

```mdx
import Quiz from '../../../components/Quiz.astro';
import Predict from '../../../components/Predict.astro';

<Predict id="unique-on-this-page" question="What do you expect, and why?">
Our answer, shown after the student writes theirs.
</Predict>

<Quiz
	question="Question?"
	options={['Plausible but wrong', 'Right', 'Plausible but wrong']}
	answer={1}
	why={['Why A is wrong', '', 'Why C is wrong']}
	explain="Why the right answer is right."
/>
```

Predictions and checklist ticks are kept only in the student's browser (`localStorage`); nothing is sent anywhere.

Keep quiz options about the same length, and spread the correct answers over A–D.

## Two languages

English pages live in `src/content/docs/`, Polish pages in `src/content/docs/pl/` with the same file names; the sidebar labels have a `translations.pl` entry in `astro.config.mjs`. The big widgets have Polish copies in `src/components/pl/` (the text the scripts write comes from their `data-i18n` attribute). Generic components take their interface text from `src/i18n/ui.ts`. When you change an English page, change its Polish twin too. `TRANSLATION_GUIDE.md` lists the terms that stay in English.

## Teaching patterns used on every page

`Tldr` (three points and the reading time) at the top, `Scene` (a short chat with the cast: Anna the coordinator, Tomek from support, you, Copilot) where the example needs a face, `Predict` before reveals, `Quiz` with feedback per option, `AtWork` (how it shows up in a job), a "Do this in your project" tip, and `Done` at the bottom, which feeds the progress tracker on the home page.
