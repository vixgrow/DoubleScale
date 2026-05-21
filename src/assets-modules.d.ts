/**
 * Webpack resolves `@doublescale/assets/*` to `assets/*`; TS still needs types for non-code imports.
 */
declare module '@doublescale/assets/*' {
	const src: string;
	export default src;
}

declare module '*.png' {
	const src: string;
	export default src;
}

declare module '*.jpg' {
	const src: string;
	export default src;
}

declare module '*.jpeg' {
	const src: string;
	export default src;
}

declare module '*.gif' {
	const src: string;
	export default src;
}

declare module '*.webp' {
	const src: string;
	export default src;
}

declare module '*.svg' {
	const src: string;
	export default src;
}
