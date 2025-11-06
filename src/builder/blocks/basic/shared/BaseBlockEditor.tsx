/**
 * Base Block Editor Component
 *
 * Provides a consistent wrapper for all block editors with:
 * - Standard layout and spacing
 * - Error boundary
 * - Loading states
 * - Accessibility features
 */

import React from 'react';

interface BaseBlockEditorProps<T> {
	props: T;
	onChange: (updates: Partial<T>) => void;
	children: (
		props: T,
		onChange: (updates: Partial<T>) => void
	) => React.ReactNode;
	className?: string;
	isLoading?: boolean;
}

/**
 * Base Block Editor component that wraps all block editors
 *
 * @example
 * export const ImageBlockEditor = ({ props, onChange }) => (
 *   <BaseBlockEditor props={props} onChange={onChange}>
 *     {(props, onChange) => (
 *       <>
 *         <ImageUploadControl ... />
 *         <AlignmentControl ... />
 *       </>
 *     )}
 *   </BaseBlockEditor>
 * );
 */
export function BaseBlockEditor<T>({
	props,
	onChange,
	children,
	className = '',
	isLoading = false,
}: BaseBlockEditorProps<T>) {
	if (isLoading) {
		return (
			<div className="grid gap-5 p-4">
				<div className="animate-pulse space-y-4">
					<div className="h-10 bg-gray-200 rounded"></div>
					<div className="h-10 bg-gray-200 rounded"></div>
					<div className="h-10 bg-gray-200 rounded"></div>
				</div>
			</div>
		);
	}

	return (
		<div
			className={`grid gap-5 ${className}`}
			role="form"
			aria-label="Block editor"
		>
			{children(props, onChange)}
		</div>
	);
}

/**
 * Error boundary for block editors
 */
interface ErrorBoundaryState {
	hasError: boolean;
	error?: Error;
}

export class BlockEditorErrorBoundary extends React.Component<
	{ children: React.ReactNode; fallback?: React.ReactNode },
	ErrorBoundaryState
> {
	constructor(props: {
		children: React.ReactNode;
		fallback?: React.ReactNode;
	}) {
		super(props);
		this.state = { hasError: false };
	}

	static getDerivedStateFromError(error: Error): ErrorBoundaryState {
		return { hasError: true, error };
	}

	componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
		console.error('Block Editor Error:', error, errorInfo);
	}

	render() {
		if (this.state.hasError) {
			if (this.props.fallback) {
				return this.props.fallback;
			}

			return (
				<div className="p-4 border border-red-300 bg-red-50 rounded-lg">
					<h3 className="text-red-800 font-semibold mb-2">
						Something went wrong
					</h3>
					<p className="text-red-700 text-sm">
						{this.state.error?.message ||
							'An error occurred while rendering the block editor.'}
					</p>
				</div>
			);
		}

		return this.props.children;
	}
}
