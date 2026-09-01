/**
 * Static slug → React component registry. PHP (the bootstrap endpoint) decides
 * which sections are *visible*; this maps a visible slug to its view.
 *
 * Sections are imported statically (not React.lazy) so the portal ships as a
 * single entry bundle — async chunks otherwise 404 when index.js is cache-busted
 * via asset.php but stale chunk hashes linger in the browser.
 */

import type { ComponentType } from 'react';

import Bookings from './bookings';
import Documents from './documents';
import Projects from './projects';
import Subscriptions from './subscriptions';
import Tickets from './tickets';

export const SECTION_REGISTRY: Record<string, ComponentType> = {
	tickets: Tickets,
	bookings: Bookings,
	documents: Documents,
	// The Memberships add-on contributes a `memberships` section; it reuses this
	// view because the customer-facing shape is the same — a recurring plan with
	// a status, a price, a renewal date, and a cancel action.
	memberships: Subscriptions,
	projects: Projects,
};

export const hasSection = (slug: string): boolean =>
	Object.prototype.hasOwnProperty.call(SECTION_REGISTRY, slug);
