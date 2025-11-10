/**
 * QuillCRM dependencies
 */
import {
	getAdminPages,
	HistoryRouter,
	Route,
	getHistory,
	Routes,
} from '@quillcrm/navigation';

/**
 * WordPress Dependencies
 */
import { SlotFillProvider } from '@wordpress/components';
import { useEffect, useMemo, useState } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { useSelect, useDispatch } from '@wordpress/data';

/**
 * External dependencies
 */
import { size, map } from 'lodash';

import { notification } from 'antd';
import { ChevronLeft } from 'lucide-react';

/**
 * Internal dependencies
 */
import { NavBar } from '@quillcrm/components';
import { Controller } from './controller';
import ProtectedRoute from './protected-route';
import './style.scss';
import { MergeTagsModal } from '@quillcrm/components';
import {
	SidebarProvider,
	SidebarTrigger,
} from '@quillcrm/components/ui/sidebar';

const Notices: React.FC = () => {
	const { notices } = useSelect((select) => ({
		notices: select('quillcrm/core').getNotices(),
	}));
	const { deleteNotice } = useDispatch('quillcrm/core');
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
			mergeTagsVisible: select('quillcrm/core').getMergeTagsVisible(),
			mergeTagCallback: select('quillcrm/core').getMergeTagCallback(),
			formContext: select('quillcrm/core').getFormContext(),
		})
	);
	const { setMergeTagsVisible, setMergeTagCallback } =
		useDispatch('quillcrm/core');
	const [wpDashboardUrl, setWpDashboardUrl] = useState('/wp-admin');
	const [currentUser, setCurrentUser] = useState<any>(null);

	const handleCloseMergeTags = () => {
		setMergeTagsVisible(false);
		// Clear the callback when closing
		setMergeTagCallback(null);
	};

	useEffect(() => {
		if (typeof window === 'undefined') {
			return;
		}

		const qcData = (window as any)?.qcData ?? {};

		const dashboardUrl =
			qcData?.dashboardUrl ||
			qcData?.dashboard_url ||
			qcData?.adminUrl ||
			qcData?.admin_url ||
			qcData?.wpAdminUrl ||
			qcData?.wp_admin_url ||
			'/wp-admin';
		setWpDashboardUrl(dashboardUrl);

		const user =
			qcData?.currentUser || qcData?.current_user || qcData?.user || null;
		setCurrentUser(user);
	}, []);

	const userDisplayName = useMemo(() => {
		if (!currentUser) {
			return 'Sara Omar';
		}

		return (
			currentUser?.name ||
			currentUser?.display_name ||
			currentUser?.user_nicename ||
			currentUser?.nickname ||
			'Sara Omar'
		);
	}, [currentUser]);

	const userAvatar = useMemo(() => {
		if (!currentUser) {
			return '';
		}

		return (
			currentUser?.avatar ||
			currentUser?.avatar_url ||
			currentUser?.avatarUrls?.['96'] ||
			currentUser?.avatar_urls?.['96'] ||
			currentUser?.avatarUrls?.['48'] ||
			currentUser?.avatar_urls?.['48'] ||
			''
		);
	}, [currentUser]);

	const userInitials = useMemo(() => {
		return userDisplayName
			.split(' ')
			.filter(Boolean)
			.map((part: string) => part.charAt(0)?.toUpperCase())
			.slice(0, 2)
			.join('');
	}, [userDisplayName]);

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
				<div className="qcrm-layout__main">
					<NavBar />
					<div className="qcrm-layout__workspace p-6">
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
