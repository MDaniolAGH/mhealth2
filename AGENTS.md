# AGENTS.md

Course website (Astro Starlight), published at https://mdaniolagh.github.io/mhealth2/. Readers are students; content is in English.

## Commands

```bash
npm install
npm run build      # must complete without errors before any change is done
npm run preview    # check pages at http://localhost:4321/mhealth2/
```

## Rules

- Links in components use `link()` from `src/lib/url.ts`; never hard-code `/mhealth2/`.
- Interactive widgets are wrapped in `not-content` so Starlight's Markdown styles do not apply.
- Colours come from the variables in `src/styles/theme.css` and `src/styles/sdlc.css`; every colour needs a light and a dark value.
- Check every visual change in both light and dark mode and at phone width (390 px).
- The worked example (About screen, fictional rehabilitation clinic) must not touch the areas reserved for the client briefs C01–C07.
- Never add real personal or health data, or claims about the Mood Tracker code that were not checked in the code.
- Do not commit or push unless asked.
