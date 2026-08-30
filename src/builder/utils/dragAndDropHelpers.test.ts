import { describe, expect, it } from 'vitest';
import type { EmailSection } from '../../stores/email-builder/types';
import { resolveColumnInsertTarget } from './dragAndDropHelpers';

const sections: EmailSection[] = [
	{
		id: 'section-1',
		columns: [
			{
				id: 'column-1',
				width: 100,
				blocks: [
					{ id: 'block-a', type: 'text', props: {} },
					{ id: 'block-b', type: 'text', props: {} },
				],
			},
		],
	},
];

describe('resolveColumnInsertTarget', () => {
	it('appends when dropping on a column', () => {
		expect(
			resolveColumnInsertTarget(
				{ type: 'column', sectionId: 'section-1', columnId: 'column-1' },
				'column-column-1',
				undefined,
				undefined,
				sections
			)
		).toEqual({
			sectionId: 'section-1',
			columnId: 'column-1',
		});
	});

	it('inserts before a block when the pointer is in the top half', () => {
		expect(
			resolveColumnInsertTarget(
				{ type: 'block', sectionId: 'section-1', columnId: 'column-1' },
				'block-b',
				{ top: 100, height: 40 },
				110,
				sections
			)
		).toEqual({
			sectionId: 'section-1',
			columnId: 'column-1',
			index: 1,
		});
	});

	it('inserts after a block when the pointer is in the bottom half', () => {
		expect(
			resolveColumnInsertTarget(
				{ type: 'block', sectionId: 'section-1', columnId: 'column-1' },
				'block-b',
				{ top: 100, height: 40 },
				130,
				sections
			)
		).toEqual({
			sectionId: 'section-1',
			columnId: 'column-1',
			index: 2,
		});
	});

	it('returns null for non-column drop targets', () => {
		expect(
			resolveColumnInsertTarget(
				{ type: 'section-drop-zone', sectionId: 'section-1' },
				'drop-zone-before-section-1',
				undefined,
				undefined,
				sections
			)
		).toBeNull();
	});
});
