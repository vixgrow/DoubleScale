// Asset module declarations for booking components.
// Webpack resolves these via file-loader / asset modules; TS needs an
// ambient declaration so `import meet from '@doublescale/assets/.../meet.png'`
// type-checks as `string`.

declare module '*.png' {
	const content: string;
	export default content;
}

declare module '*.jpeg' {
	const content: string;
	export default content;
}

declare module '*.jpg' {
	const content: string;
	export default content;
}

declare module '*.svg' {
	const content: string;
	export default content;
}
