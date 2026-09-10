/**
 * external dependencies
 */
import { describe, expect, it } from 'vitest';
/**
 * internal dependencies
 */
import {
	buildBulkTarget,
	getEffectiveSelectionCount,
} from './select-all-matching';

const emptyDateRange = { from: undefined, to: undefined };

describe( 'getEffectiveSelectionCount', () => {
	it( 'counts the checked rows when select-all-matching is off', () => {
		expect(
			getEffectiveSelectionCount( {
				selectAllMatching: false,
				selectedRowKeys: [ '1', '2', '3' ],
				total: 5243,
			} )
		).toBe( 3 );
	} );

	it( 'counts every matching contact when select-all-matching is on', () => {
		expect(
			getEffectiveSelectionCount( {
				selectAllMatching: true,
				selectedRowKeys: [ '1', '2', '3' ],
				total: 5243,
			} )
		).toBe( 5243 );
	} );

	it( 'reports zero rather than NaN when the total is unknown', () => {
		expect(
			getEffectiveSelectionCount( {
				selectAllMatching: true,
				selectedRowKeys: [],
				total: undefined as unknown as number,
			} )
		).toBe( 0 );
	} );
} );

describe( 'buildBulkTarget', () => {
	it( 'sends the explicit row ids when select-all-matching is off', () => {
		const target = buildBulkTarget( {
			selectAllMatching: false,
			selectedRowKeys: [ '7', '9' ],
			filters: [],
			keywords: '',
			dateRange: emptyDateRange,
		} );

		expect( target.mode ).toBe( 'ids' );
		expect( target.ids ).toEqual( [ 7, 9 ] );
		// A filter must never ride along on the ids path — the backend
		// refuses a request carrying both.
		expect( target.filters ).toBeUndefined();
	} );

	it( 'sends the filter criteria when select-all-matching is on', () => {
		const filters = [ { rule: 'tag', selectedGroup: 'segments' } ];
		const target = buildBulkTarget( {
			selectAllMatching: true,
			selectedRowKeys: [ '7' ],
			filters: filters as never,
			keywords: 'acme',
			dateRange: { from: '2025-01-01', to: '2025-06-30' },
		} );

		expect( target.mode ).toBe( 'filter' );
		expect( target.ids ).toBeUndefined();
		expect( target.keywords ).toBe( 'acme' );
		expect( target.from ).toBe( '2025-01-01' );
		expect( target.to ).toBe( '2025-06-30' );
		expect( target.filters ).toEqual( filters );
	} );

	it( 'does not set confirm_all while any filter narrows the set', () => {
		expect(
			buildBulkTarget( {
				selectAllMatching: true,
				selectedRowKeys: [],
				filters: [],
				keywords: 'acme',
				dateRange: emptyDateRange,
			} ).confirm_all
		).toBe( false );

		expect(
			buildBulkTarget( {
				selectAllMatching: true,
				selectedRowKeys: [],
				filters: [ { rule: 'tag' } ] as never,
				keywords: '',
				dateRange: emptyDateRange,
			} ).confirm_all
		).toBe( false );

		expect(
			buildBulkTarget( {
				selectAllMatching: true,
				selectedRowKeys: [],
				filters: [],
				keywords: '',
				dateRange: { from: '2025-01-01', to: undefined },
			} ).confirm_all
		).toBe( false );
	} );

	it( 'sets confirm_all only for an unfiltered whole-database selection', () => {
		const target = buildBulkTarget( {
			selectAllMatching: true,
			selectedRowKeys: [],
			filters: [],
			keywords: '   ',
			dateRange: emptyDateRange,
		} );

		expect( target.mode ).toBe( 'filter' );
		expect( target.confirm_all ).toBe( true );
	} );

	it( 'never sets confirm_all on the ids path', () => {
		expect(
			buildBulkTarget( {
				selectAllMatching: false,
				selectedRowKeys: [ '7' ],
				filters: [],
				keywords: '',
				dateRange: emptyDateRange,
			} ).confirm_all
		).toBe( false );
	} );
} );
