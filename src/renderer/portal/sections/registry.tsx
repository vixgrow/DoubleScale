/**
 * Static slug → React component registry. PHP (the bootstrap endpoint) decides
 * which sections are *visible*; this maps a visible slug to its lazy-loaded
 * view. A section the bootstrap reports but that has no entry here (e.g. a
 * future Documents view shipped separately) is simply skipped — the renderer
 * stays self-contained with no cross-bundle React.
 */

import { lazy } from '@wordpress/element';
import type { ComponentType } from 'react';

const Tickets = lazy(() => import('./tickets'));
const Bookings = lazy(() => import('./bookings'));
const Documents = lazy(() => import('./documents'));

export const SECTION_REGISTRY: Record<string, ComponentType> = {
	tickets: Tickets,
	bookings: Bookings,
	documents: Documents,
};

export const hasSection = (slug: string): boolean =>
	Object.prototype.hasOwnProperty.call(SECTION_REGISTRY, slug);
