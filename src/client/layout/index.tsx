/**
 * DoubleScale dependencies
 */
import {
	getAdminPages,
	HistoryRouter,
	Route,
	getHistory,
	Routes,
	Navigate,
	adminPagePassesVisibilityGate,
	getToLink,
} from '@doublescale/navigation';

/**
 * WordPress Dependencies
 */
import { SlotFillProvider, SnackbarList } from '@wordpress/components';
import { useSelect, useDispatch } from '@wordpress/data';
import { useModulesConfigTick } from '@doublescale/hooks/use-module-enabled';

/**
 * External dependencies
 */
import { map } from 'lodash';

/**
 * Internal dependencies
 */
import { NavBar } from '@doublescale/components';
import { Controller, HeaderBar } from './controller';
import { ModulesDialogProvider } from '../pages/settings/modules/modules-dialog';
import '../pages/settings/modules/modules-settings.scss';
import ProtectedRoute from './protected-route';
import './style.scss';
import { MergeTagsModal } from '@doublescale/components';
import { SidebarProvider } from '@doublescale/components/ui/sidebar';
import config from '@doublescale/config';
import { getScopedDefaultLandingPath } from '@doublescale/hooks/use-capabilities';

// `<SnackbarList>` strips the `status` prop at the `<Snackbar>` boundary, so
// success and error notices render identically. Color them via `className`
// instead, matching the local-notice palette used elsewhere (e.g.
// `pages/extensions/index.tsx`).
const noticeClassName = (type: string) => {
	if (type === 'error') {
		return 'bg-red-50 text-red-700 border border-red-200';
	}
	if (type === 'success') {
		return 'bg-emerald-50 text-emerald-700 border border-emerald-200';
	}
	return 'bg-blue-50 text-blue-700 border border-blue-200';
};

const Notices: React.FC = () => {
	const { notices } = useSelect((select) => ({
		notices: select('doublescale/core').getNotices(),
	}));
	const { deleteNotice } = useDispatch('doublescale/core');

	const snackbarNotices = map(notices, (notice, id) => ({
		id: String(id),
		content: notice.message,
		spokenMessage: notice.message,
		className: noticeClassName(notice.type),
	}));

	return (
		<SnackbarList
			className="doublescale-notices fixed bottom-6 right-6 left-auto z-[160000] flex flex-col gap-2 w-auto max-w-md"
			notices={snackbarNotices}
			onRemove={(id: string) => deleteNotice(id)}
		/>
	);
};

export const Layout = (props) => {
	const { mergeTagsVisible, mergeTagCallback, formContext } = useSelect(
		(select) => ({
			mergeTagsVisible: select('doublescale/core').getMergeTagsVisible(),
			mergeTagCallback: select('doublescale/core').getMergeTagCallback(),
			formContext: select('doublescale/core').getFormContext(),
		})
	);
	const { setMergeTagsVisible, setMergeTagCallback } =
		useDispatch('doublescale/core');

	const handleCloseMergeTags = () => {
		setMergeTagsVisible(false);
		// Clear the callback when closing
		setMergeTagCallback(null);
	};

	// Check if this is the get started page - render full page without layout
	if (props.page.path === 'start') {
		return (
			<SlotFillProvider>
				<Notices />
				<MergeTagsModal
					visible={mergeTagsVisible}
					onClose={handleCloseMergeTags}
					onInsertTag={mergeTagCallback || undefined}
					triggerId={formContext?.triggerId}
					formId={formContext?.formId}
					automationId={formContext?.automationId}
				/>
				<div className="w-full min-h-screen bg-background p-6 box-border">
					<ProtectedRoute page={props.page}>
						<props.page.component />
					</ProtectedRoute>
				</div>
			</SlotFillProvider>
		);
	}

	return (
		<SlotFillProvider>
			<ModulesDialogProvider>
				<SidebarProvider>
					<Notices />
					<MergeTagsModal
						visible={mergeTagsVisible}
						onClose={handleCloseMergeTags}
						onInsertTag={mergeTagCallback || undefined}
						triggerId={formContext?.triggerId}
						formId={formContext?.formId}
						automationId={formContext?.automationId}
					/>
					<div className="doublescale-layout__main">
						<NavBar />
						<div className="doublescale-layout__workspace">
							<HeaderBar page={props.page} />
							<ProtectedRoute page={props.page}>
								<Controller {...props} />
							</ProtectedRoute>
						</div>
					</div>
				</SidebarProvider>
			</ModulesDialogProvider>
		</SlotFillProvider>
	);
};

const _PageLayout = () => {
	const modulesTick = useModulesConfigTick();
	const visiblePages = Object.values(getAdminPages()).filter(
		adminPagePassesVisibilityGate
	);
	const scopedLandingPath = getScopedDefaultLandingPath();
	const defaultLandingPath =
		scopedLandingPath === '/' ? '/' : getToLink(scopedLandingPath);

	return (
		<>
			{/* @ts-ignore */}
			<HistoryRouter history={getHistory()}>
				<Routes key={modulesTick}>
					{visiblePages.map((page) => {
						return (
							<Route
								key={page.path}
								path={page.path}
								element={<Layout page={page} />}
							/>
						);
					})}
					<Route path="*" element={<Navigate to={defaultLandingPath} replace />} />
				</Routes>
			</HistoryRouter>
		</>
	);
};

export default _PageLayout;
