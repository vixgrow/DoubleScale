/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { useState } from '@wordpress/element';

/**
 * Internal dependencies
 */
import { Button } from '@/components/ui/button';

const MAX_WORDS = 12;
const MAX_CHARS = 80;

const truncateText = (value: string): { preview: string; truncated: boolean } => {
	const words = value.split(/\s+/).filter(Boolean);

	if (words.length > MAX_WORDS) {
		return {
			preview: words.slice(0, MAX_WORDS).join(' '),
			truncated: true,
		};
	}

	if (value.length > MAX_CHARS) {
		return {
			preview: value.slice(0, MAX_CHARS),
			truncated: true,
		};
	}

	return { preview: value, truncated: false };
};

const WrappedTextCell = ({
	value,
	empty = '-',
}: {
	value?: string | null;
	empty?: string;
}) => {
	const [expanded, setExpanded] = useState(false);
	const trimmed = value?.trim() ?? '';

	if (!trimmed) {
		return <span>{empty}</span>;
	}

	const { preview, truncated } = truncateText(trimmed);

	return (
		<span className="block max-w-[16rem] whitespace-normal break-all">
			{expanded || !truncated ? trimmed : preview}
			{truncated ? (
				<Button
					type="button"
					variant="link"
					className="ml-1 inline h-auto p-0 align-baseline text-sm"
					onClick={(event) => {
						event.stopPropagation();
						setExpanded((open) => !open);
					}}
				>
					{expanded
						? __('less', 'doublescale')
						: __('more...', 'doublescale')}
				</Button>
			) : null}
		</span>
	);
};

export default WrappedTextCell;
