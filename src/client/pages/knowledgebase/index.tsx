/**
 * Knowledge Base admin page registration.
 *
 * Mirrors `pages/support/index.tsx`: a primary Articles route plus hidden
 * editor / groups / settings routes, all gated by
 * `requiresModule: 'knowledgebase'` (so they vanish when the module is toggled
 * off) and `requiredCapability: ['doublescale_manage_knowledgebase']`.
 */

import React, { lazy, Suspense, useEffect } from '@wordpress/element';
import { __ } from '@wordpress/i18n';

import { registerAdminPage } from '@doublescale/navigation';

const ArticlesList = lazy(() => import('./articles-list'));
const ArticleEditor = lazy(() => import('./article-editor'));
const Groups = lazy(() => import('./groups'));
const Settings = lazy(() => import('./settings'));

const BookIcon = ({ width = 24, height = 24 }: { width?: number; height?: number }) => (
	<svg width={width} height={height} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
		<path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
		<path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
	</svg>
);

const Skeleton = () => (
	<div className="p-6">
		<div className="h-8 w-64 animate-pulse rounded bg-gray-200" />
	</div>
);

const wrap = (Page: React.ComponentType): (() => JSX.Element) => {
	return () => {
		useEffect(() => {
			window.document.documentElement.scrollTop = 0;
		}, []);
		return (
			<Suspense fallback={<Skeleton />}>
				<div className="doublescale-knowledgebase-page">
					<Page />
				</div>
			</Suspense>
		);
	};
};

const CAPABILITY = ['doublescale_manage_knowledgebase'];

registerAdminPage('knowledgebase', {
	path: 'knowledgebase',
	component: wrap(ArticlesList),
	label: __('Knowledge Base', 'doublescale'),
	icon: <BookIcon width={24} height={24} />,
	requiredCapability: CAPABILITY,
	requiresModule: 'knowledgebase',
});

registerAdminPage('knowledgebase-article', {
	path: 'knowledgebase/article/:id',
	component: wrap(ArticleEditor),
	label: __('Article', 'doublescale'),
	hidden: true,
	icon: <BookIcon width={24} height={24} />,
	requiredCapability: CAPABILITY,
	requiresModule: 'knowledgebase',
});

// Same articles list, pre-filtered to one group. Reached from the article-count
// link on the Groups page; this is also the surface where article drag-reorder
// is enabled (ordering is only meaningful within a single group).
registerAdminPage('knowledgebase-group', {
	path: 'knowledgebase/group/:groupId',
	component: wrap(ArticlesList),
	label: __('Knowledge Base', 'doublescale'),
	hidden: true,
	icon: <BookIcon width={24} height={24} />,
	requiredCapability: CAPABILITY,
	requiresModule: 'knowledgebase',
});

registerAdminPage('knowledgebase-groups', {
	path: 'knowledgebase/groups',
	component: wrap(Groups),
	label: __('Groups', 'doublescale'),
	hidden: true,
	icon: <BookIcon width={24} height={24} />,
	requiredCapability: CAPABILITY,
	requiresModule: 'knowledgebase',
});

registerAdminPage('knowledgebase-settings', {
	path: 'knowledgebase/settings',
	component: wrap(Settings),
	label: __('Settings', 'doublescale'),
	hidden: true,
	icon: <BookIcon width={24} height={24} />,
	requiredCapability: CAPABILITY,
	requiresModule: 'knowledgebase',
});
