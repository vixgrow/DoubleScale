/**
 * wordpress dependencies
 */
import { __ } from '@wordpress/i18n';
/**
 * external dependencies
 */
import { Plus } from 'lucide-react';

interface SectionInsertButtonProps {
	/** Open the add-section flow inserting at this gap (between two sections). */
	onInsert: () => void;
}

/**
 * A small "+" affordance revealed on hover in the gap BETWEEN two sections, so a
 * new section can be inserted at that position. The after-last "Add New Section"
 * button stays as-is — this only fills the in-between gaps.
 *
 * The wrapper uses negative vertical margins so it adds no layout space; it just
 * provides a hover band straddling the boundary between the two sections.
 */
export const SectionInsertButton = ({ onInsert }: SectionInsertButtonProps) => {
	return (
		<div className="group relative z-10 -my-2 h-4 w-full">
			{/* Connecting line, revealed on hover */}
			<div className="pointer-events-none absolute inset-x-10 top-1/2 h-px -translate-y-1/2 bg-primary opacity-0 transition-opacity group-hover:opacity-100" />
			<button
				type="button"
				onClick={onInsert}
				aria-label={__('Add section here', 'doublescale')}
				title={__('Add section here', 'doublescale')}
				className="absolute left-1/2 top-1/2 z-10 flex h-6 w-6 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-primary text-white opacity-0 shadow transition-opacity hover:bg-primary/90 group-hover:opacity-100"
			>
				<Plus className="h-4 w-4" />
			</button>
		</div>
	);
};

export default SectionInsertButton;
