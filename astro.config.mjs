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
			title: 'AI SDLC: From Idea to Merge',
			description:
				'How to build software with coding agents: one feature of the Mood Tracker, from a sketch to a merged pull request.',
			logo: { src: './src/assets/logo.svg', alt: '' },
			favicon: '/favicon.svg',
			social: [
				{ icon: 'github', label: 'GitHub', href: 'https://github.com/MDaniolAGH/mhealth2' },
			],
			editLink: { baseUrl: 'https://github.com/MDaniolAGH/mhealth2/edit/main/' },
			lastUpdated: true,
			customCss: ['./src/styles/theme.css', './src/styles/sdlc.css', './src/styles/learn.css'],
			sidebar: [
				{ label: 'Start here', link: '/' },
				{
					label: 'AI SDLC',
					items: [
						{ label: 'The pipeline at a glance', slug: 'ai-sdlc/overview' },
						{ label: '1. From a prompt to an agent', slug: 'ai-sdlc/agents' },
						{ label: '2. Context', slug: 'ai-sdlc/context' },
						{ label: '3. Project knowledge', slug: 'ai-sdlc/knowledge' },
						{ label: '4. AGENTS.md', slug: 'ai-sdlc/agents-md' },
						{
							label: '5. Stage by stage',
							items: [
								{ label: 'Stages 1–4: idea to plan', slug: 'ai-sdlc/idea-to-plan' },
								{ label: 'Stages 5–6: code and the gate', slug: 'ai-sdlc/code-and-gate' },
								{ label: 'Stages 7–10: tests to merge', slug: 'ai-sdlc/tests-to-merge' },
							],
						},
						{ label: '6. Auditability', slug: 'ai-sdlc/auditability' },
						{ label: '7. Templates', slug: 'ai-sdlc/templates' },
						{ label: 'Sources', slug: 'ai-sdlc/sources' },
					],
				},
			],
		}),
	],
});
