/**
 * Unit tests for saved-block envelope migration and ID regeneration helpers.
 */
import { afterEach, describe, expect, it, vi } from 'vitest';
import type { EmailSection, SavedBlockContent } from '../types/common';
import {
	buildSectionFromSavedBlock,
	migrateSavedBlockContent,
	regenerateSectionIds,
	stripSectionMetaForSave,
	wrapSectionAsSavedBlockContent,
} from './savedBlockUtils';

vi.mock('@doublescale/utils/idGenerator', () => {
	let sectionCounter = 0;
	let columnCounter = 0;
	let blockCounter = 0;

	return {
		generateSectionId: () => `section-new-${++sectionCounter}`,
		generateColumnId: () => `column-new-${++columnCounter}`,
		generateBlockId: () => `block-new-${++blockCounter}`,
	};
});

const sampleSection = (): EmailSection => ({
	id: 'section-orig-1',
	columns: [
		{
			id: 'column-orig-1',
			width: 100,
			blocks: [
				{
					id: 'block-orig-1',
					type: 'text',
					props: { content: 'Hello' },
				},
				{
					id: 'block-orig-2',
					type: 'button',
					props: { label: 'Click' },
				},
			],
		},
		{
			id: 'column-orig-2',
			width: 50,
			blocks: [
				{
					id: 'block-orig-3',
					type: 'image',
					props: { src: 'https://example.test/logo.png' },
				},
			],
		},
	],
	styles: { padding: '20px' },
	meta: {
		savedBlockId: 42,
		savedBlockVersion: 1,
	},
});

describe('wrapSectionAsSavedBlockContent', () => {
	it('wraps a section in a version-1 envelope', () => {
		const section = sampleSection();
		const envelope = wrapSectionAsSavedBlockContent(section);

		expect(envelope.version).toBe(1);
		expect(envelope.section).toBe(section);
	});
});

describe('migrateSavedBlockContent', () => {
	it('returns the section for version 1', () => {
		const content: SavedBlockContent = {
			version: 1,
			section: sampleSection(),
		};

		const section = migrateSavedBlockContent(content);
		expect(section.id).toBe('section-orig-1');
		expect(section.columns).toHaveLength(2);
	});

	it('throws for unsupported versions', () => {
		expect(() =>
			migrateSavedBlockContent({
				version: 99,
				section: sampleSection(),
			})
		).toThrow('Unsupported saved block content version: 99');
	});
});

describe('regenerateSectionIds', () => {
	afterEach(() => {
		vi.clearAllMocks();
	});

	it('assigns fresh IDs to section, columns, and blocks', () => {
		const rebuilt = regenerateSectionIds(sampleSection());

		expect(rebuilt.id).toBe('section-new-1');
		expect(rebuilt.meta).toBeUndefined();
		expect(rebuilt.columns[0].id).toBe('column-new-1');
		expect(rebuilt.columns[1].id).toBe('column-new-2');
		expect(rebuilt.columns[0].blocks[0].id).toBe('block-new-1');
		expect(rebuilt.columns[0].blocks[1].id).toBe('block-new-2');
		expect(rebuilt.columns[1].blocks[0].id).toBe('block-new-3');
	});

	it('preserves block props and section styles', () => {
		const rebuilt = regenerateSectionIds(sampleSection());

		expect(rebuilt.styles).toEqual({ padding: '20px' });
		expect(rebuilt.columns[0].blocks[0].props).toEqual({ content: 'Hello' });
		expect(rebuilt.columns[0].width).toBe(100);
	});
});

describe('buildSectionFromSavedBlock', () => {
	it('migrates content, regenerates IDs, and stamps origin meta', () => {
		const content = wrapSectionAsSavedBlockContent(sampleSection());
		const inserted = buildSectionFromSavedBlock(7, content);

		expect(inserted.id).not.toBe('section-orig-1');
		expect(inserted.columns[0].blocks[0].id).not.toBe('block-orig-1');
		expect(inserted.meta).toEqual({
			savedBlockId: 7,
			savedBlockVersion: 1,
		});
	});
});

describe('stripSectionMetaForSave', () => {
	it('removes origin metadata before persistence', () => {
		const stripped = stripSectionMetaForSave(sampleSection());

		expect(stripped.meta).toBeUndefined();
		expect(stripped.id).toBe('section-orig-1');
		expect(stripped.columns).toHaveLength(2);
	});
});
