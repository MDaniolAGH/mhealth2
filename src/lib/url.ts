/** Prefix a site path ("ai-sdlc/overview/#knowledge") with the base path ("/mhealth2/"). */
export function link(path: string): string {
	const base = import.meta.env.BASE_URL.replace(/\/$/, '');
	return `${base}/${path.replace(/^\//, '')}`;
}
