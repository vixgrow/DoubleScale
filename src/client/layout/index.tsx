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
import { useEffect, useState } from '@wordpress/element';
import { useSelect, useDispatch } from '@wordpress/data';
import apiFetch from '@wordpress/api-fetch';

/**
 * External dependencies
 */
import { size, map } from 'lodash';
import { ThreeDots as Loader } from 'react-loader-spinner';
import { css } from '@emotion/css';
import { notification } from 'antd';

/**
 * Internal dependencies
 */
import { NavBar } from '../components';
import { Controller } from './controller';
import ConfigAPI from '@quillcrm/config';
import './style.scss';

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
			const { message, description, type, duration, placement } = notice;
			api[type]({
				message: message,
				duration: duration || 6,
				description: description,
				onClose: () => deleteNotice(id),
				placement: placement || 'bottomRight',
			});
		});
	}, [notices]);

	return contextHolder;
};

export const Layout = (props) => {
	return (
		<SlotFillProvider>
			<div className="qcrm-layout">
				<NavBar />
				<Notices />
				<div className="qcrm-layout__main">
					<Controller {...props} />
				</div>
			</div>
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
