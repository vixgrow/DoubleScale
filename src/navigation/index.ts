export {
	BrowserRouter, unstable_HistoryRouter as HistoryRouter, matchPath, Route, Routes, useLocation, useMatch, useNavigate, useParams
} from 'react-router-dom';
export * from './api';
export { getHistory } from './history';
export { NavLink, setForceReload } from './nav-link';

export const getToLink = (routeTemplate: string) => {
	const pathname = document.location.pathname;
	const basename = pathname.substring(0, pathname.lastIndexOf('/'));
	let to = `${basename}/admin.php?page=quillcrm`;

	// Replace dynamic segments in the route template with the actual values from `params`.
	const route = routeTemplate.replace(/:([^/]+)/g, (_, key) => {
		const value = key;
		return value;
	});

	to += `&path=${route}`;

	return to;
};