/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';

/**
 * External dependencies
 */
import { Star } from 'lucide-react';

/**
 * Internal dependencies
 */
import type { TriggerDocumentation } from '@doublescale/config';
import { cn } from '@/lib/utils';

interface TriggerDocumentationCalloutProps {
	documentation: TriggerDocumentation;
	className?: string;
	compact?: boolean;
}

const TriggerDocumentationCallout: React.FC<TriggerDocumentationCalloutProps> = ({
	documentation,
	className,
	compact = false,
}) => {
	if (!documentation?.title) {
		return null;
	}

	return (
		<div
			className={cn(
				'rounded-xl border border-amber-200 bg-gradient-to-br from-amber-50 to-orange-50/80',
				compact ? 'p-3' : 'p-4',
				className
			)}
		>
			<div className="flex items-start gap-2.5">
				<span className="mt-0.5 inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-amber-100 text-amber-600">
					<Star className="h-4 w-4 fill-amber-400 text-amber-500" aria-hidden />
				</span>
				<div className="min-w-0 flex-1 space-y-2">
					<div>
						<p className="text-sm font-semibold text-amber-950">
							{documentation.title}
						</p>
						{documentation.intro && (
							<p className="mt-1 text-sm leading-6 text-amber-900/90">
								{documentation.intro}
							</p>
						)}
					</div>
					{documentation.steps && documentation.steps.length > 0 && (
						<ol className="list-decimal space-y-1.5 pl-4 text-sm leading-6 text-amber-900/90">
							{documentation.steps.map((step, index) => (
								<li key={index}>{step}</li>
							))}
						</ol>
					)}
					{documentation.tip && (
						<p className="rounded-lg border border-amber-200/80 bg-white/70 px-3 py-2 text-sm leading-6 text-amber-950">
							<span className="font-medium">
								{__('Why this works:', 'doublescale')}{' '}
							</span>
							{documentation.tip}
						</p>
					)}
				</div>
			</div>
		</div>
	);
};

export default TriggerDocumentationCallout;
