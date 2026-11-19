// @ts-check
import { defineConfig } from 'astro/config';
import starlight from '@astrojs/starlight';

// Published as a GitHub Pages project site: https://mdaniolagh.github.io/mhealth2/
export default defineConfig({
	site: 'https://mdaniolagh.github.io',
	base: '/mhealth2',
	trailingSlash: 'always',
	// Keep line breaks inside the widgets' code snippets.
	compressHTML: false,
	integrations: [
		starlight({
			title: {
				en: 'Mobile Apps in Medicine - From Idea to Market',
				pl: 'Aplikacje Mobilne w Medycynie - Od Pomysłu do Wprowadzenia na Rynek',
			},
			components: { SiteTitle: './src/components/SiteTitle.astro' },
			defaultLocale: 'root',
			locales: {
				root: { label: 'English', lang: 'en' },
				pl: { label: 'Polski', lang: 'pl' },
			},
			description:
				'Mobile apps in medicine, from idea to market: discover what to build, build it with coding agents, and launch it safely.',
			logo: { src: './src/assets/logo.svg', alt: '' },
			favicon: '/favicon.svg',
			social: [
				{ icon: 'github', label: 'GitHub', href: 'https://github.com/MDaniolAGH/mhealth2' },
			],
			editLink: { baseUrl: 'https://github.com/MDaniolAGH/mhealth2/edit/main/' },
			lastUpdated: true,
			customCss: ['./src/styles/theme.css', './src/styles/sdlc.css', './src/styles/learn.css', './src/styles/biz.css'],
			sidebar: [
				{ label: 'Start here', translations: { pl: 'Zacznij tutaj' }, link: '/' },
				{
					label: 'Part 1 · Discover', translations: { pl: 'Część 1 · Odkryj' },
					items: [
						{ label: 'From brief to decision: the map', translations: { pl: 'Od briefu do decyzji: mapa' }, slug: 'product/overview' },
						{ label: '1. Decision, facts, people', translations: { pl: '1. Decyzja, fakty, ludzie' }, slug: 'product/decision-and-facts' },
						{ label: '2. Intended purpose', translations: { pl: '2. Intended purpose' }, slug: 'product/purpose' },
						{ label: '3. Questions and observations', translations: { pl: '3. Pytania i obserwacje' }, slug: 'product/questions-and-observation' },
						{ label: '4. User stories', translations: { pl: '4. User stories' }, slug: 'product/user-stories' },
						{ label: '5. Testable, ranked, split', translations: { pl: '5. Testowalne, z priorytetem, podzielone' }, slug: 'product/testable-stories' },
						{ label: '6. Options and recommendation', translations: { pl: '6. Opcje i rekomendacja' }, slug: 'product/options-and-recommendation' },
					],
				},
				{
					label: 'Part 2 · Build', translations: { pl: 'Część 2 · Zbuduj' },
					items: [
						{ label: 'The pipeline at a glance', translations: { pl: 'Pipeline w pigułce' }, slug: 'ai-sdlc/overview' },
						{ label: '1. From a prompt to an agent', translations: { pl: '1. Od promptu do agenta' }, slug: 'ai-sdlc/agents' },
						{ label: '2. Context', translations: { pl: '2. Kontekst' }, slug: 'ai-sdlc/context' },
						{ label: '3. Project knowledge', translations: { pl: '3. Wiedza o projekcie' }, slug: 'ai-sdlc/knowledge' },
						{ label: '4. AGENTS.md', translations: { pl: '4. AGENTS.md' }, slug: 'ai-sdlc/agents-md' },
						{
							label: '5. Stage by stage', translations: { pl: '5. Etap po etapie' },
							items: [
								{ label: 'Stages 1–4: idea to plan', translations: { pl: 'Etapy 1–4: od pomysłu do planu' }, slug: 'ai-sdlc/idea-to-plan' },
								{ label: 'Stages 5–6: code and the gate', translations: { pl: 'Etapy 5–6: kod i quality gate' }, slug: 'ai-sdlc/code-and-gate' },
								{ label: 'Stages 7–10: tests to merge', translations: { pl: 'Etapy 7–10: od testów do merge' }, slug: 'ai-sdlc/tests-to-merge' },
							],
						},
						{ label: '6. Auditability', translations: { pl: '6. Audytowalność' }, slug: 'ai-sdlc/auditability' },
						{ label: '7. Templates', translations: { pl: '7. Szablony' }, slug: 'ai-sdlc/templates' },
					],
				},
				{
					label: 'Part 3 · Launch', translations: { pl: 'Część 3 · Wprowadź na rynek' },
					items: [
						{ label: 'The route to market: the map', translations: { pl: 'Droga na rynek: mapa' }, slug: 'launch/overview' },
						{ label: '1. Medical device or not?', translations: { pl: '1. Wyrób medyczny czy nie?' }, slug: 'launch/device-or-not' },
						{ label: '2. Data, risk and security', translations: { pl: '2. Dane, ryzyko i bezpieczeństwo' }, slug: 'launch/privacy-and-security' },
						{ label: '3. Release', translations: { pl: '3. Release' }, slug: 'launch/release' },
						{ label: '4. Business case and pilot', translations: { pl: '4. Business case i pilotaż' }, slug: 'launch/business-case' },
						{ label: '5. After launch', translations: { pl: '5. Po wprowadzeniu' }, slug: 'launch/after-launch' },
					],
				},
				{ label: 'Extra: how LLMs work', translations: { pl: 'Dodatek: jak działają LLM-y' }, slug: 'extra/how-llms-work' },
				{ label: 'Glossary', translations: { pl: 'Słowniczek' }, slug: 'glossary' },
				{ label: 'Sources', translations: { pl: 'Źródła' }, slug: 'ai-sdlc/sources' },
			],
		}),
	],
});
