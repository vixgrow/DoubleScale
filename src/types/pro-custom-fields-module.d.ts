/**
 * Webpack resolves `@doublescale-pro/pages/custom-fields` to the Pro plugin
 * admin page. This shim keeps free `tsc` from pulling Pro sources outside
 * {@see import("../tsconfig.json")} `rootDir`.
 */
declare module '@doublescale-pro/pages/custom-fields' {
	import type { FC } from 'react';
	const CustomFields: FC;
	export default CustomFields;
}
