/** Prefix a site path ("ai-sdlc/overview/#knowledge") with the base path ("/mhealth2/"),
 *  and with "pl/" on Polish pages. */
export function link(path: string, lang: 'en' | 'pl' = 'en'): string {
	const base = import.meta.env.BASE_URL.replace(/\/$/, '');
	const prefix = lang === 'pl' ? '/pl' : '';
	return `${base}${prefix}/${path.replace(/^\//, '')}`;
}
