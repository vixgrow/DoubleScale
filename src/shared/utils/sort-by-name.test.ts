import { describe, expect, it } from 'vitest';

import { sortByName, sortNames } from './sort-by-name';

describe('sortByName', () => {
	it('orders by name alphabetically, ignoring attach order', () => {
		expect(
			sortByName([
				{ id: 3, name: 'Zebra' },
				{ id: 1, name: 'Mango' },
				{ id: 2, name: 'Alpha' },
			]).map((item) => item.name)
		).toEqual(['Alpha', 'Mango', 'Zebra']);
	});

	it('is case-insensitive', () => {
		expect(
			sortByName([{ name: 'zebra' }, { name: 'Apple' }]).map(
				(item) => item.name
			)
		).toEqual(['Apple', 'zebra']);
	});

	it('does not mutate the original array', () => {
		const original = [{ name: 'B' }, { name: 'A' }];
		sortByName(original);
		expect(original.map((item) => item.name)).toEqual(['B', 'A']);
	});
});

describe('sortNames', () => {
	it('orders selected filter labels A–Z before truncation', () => {
		expect(sortNames(['Zebra', 'Alpha', 'Mango'])).toEqual([
			'Alpha',
			'Mango',
			'Zebra',
		]);
	});
});
