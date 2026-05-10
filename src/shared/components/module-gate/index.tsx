/**
 * External dependencies
 */
import type { ComponentType, ReactNode } from 'react';

/**
 * Internal dependencies
 */
import { useModuleEnabled } from '../../hooks/use-module-enabled';

type IfModuleEnabledProps = {
	slug: string;
	children: ReactNode;
	fallback?: ReactNode;
};

/**
 * Renders children only when the given module is enabled in admin config.
 */
export function IfModuleEnabled({
	slug,
	children,
	fallback = null,
}: IfModuleEnabledProps) {
	const enabled = useModuleEnabled(slug);
	if (!enabled) {
		return <>{fallback}</>;
	}
	return <>{children}</>;
}

/**
 * Class-friendly wrapper: renders `Component` only when `slug` is enabled.
 */
export function withModuleEnabled<P extends object>(
	slug: string,
	Component: ComponentType<P>,
	fallback: ReactNode = null
) {
	function ModuleGatedComponent(props: P) {
		return (
			<IfModuleEnabled slug={slug} fallback={fallback}>
				<Component {...props} />
			</IfModuleEnabled>
		);
	}
	const name = Component.displayName || Component.name || 'Component';
	ModuleGatedComponent.displayName = `withModuleEnabled(${slug})(${name})`;
	return ModuleGatedComponent;
}
