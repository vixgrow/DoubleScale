/**
 * DoubleScale dependencies
 */
import {
	getAdminPages,
	HistoryRouter,
	Route,
	getHistory,
	Routes,
} from '@doublescale/navigation';

/**
 * WordPress Dependencies
 */
import { SlotFillProvider } from '@wordpress/components';
import { useEffect } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { useSelect, useDispatch } from '@wordpress/data';

/**
 * External dependencies
 */
import { size, map } from 'lodash';

import { notification } from 'antd';

/**
 * Internal dependencies
 */
import { NavBar } from '@doublescale/components';
import { Controller } from './controller';
import ProtectedRoute from './protected-route';
import './style.scss';
import { MergeTagsModal } from '@doublescale/components';
import { SidebarProvider } from '@doublescale/components/ui/sidebar';

const Notices: React.FC = () => {
	const { notices } = useSelect((select) => ({
		notices: select('doublescale/core').getNotices(),
	}));
	const { deleteNotice } = useDispatch('doublescale/core');
	const [api, contextHolder] = notification.useNotification();

	useEffect(() => {
		if (!size(notices)) {
			return;
		}

		map(notices, (notice, id) => {
			const { message, type, duration, placement } = notice;
			api[type]({
				message: message,
				duration: duration || 3,
				onClose: () => deleteNotice(id),
				placement: placement || 'bottomRight',
			});
		});
	}, [notices]);

	return contextHolder;
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
						<ProtectedRoute page={props.page}>
							<Controller {...props} />
						</ProtectedRoute>
					</div>
				</div>
			</SidebarProvider>
		</SlotFillProvider>
	);
};

const _PageLayout = () => {
	return (
		<>
			{/* @ts-ignore */}
			<HistoryRouter history={getHistory()}>
				<Routes>
					{Object.values(getAdminPages()).map((page) => {
						return (
							<Route
								key={page.path}
								path={page.path}
								element={<Layout page={page} />}
							/>
						);
					})}
				</Routes>
			</HistoryRouter>
		</>
	);
};

export default _PageLayout;
