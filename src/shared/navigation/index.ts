export {
	BrowserRouter, unstable_HistoryRouter as HistoryRouter, matchPath, Navigate, Route, Routes, useLocation, useMatch, useNavigate, useParams
} from 'react-router-dom';
export * from './api';
export { getHistory } from './history';
export { NavLink, setForceReload } from './nav-link';

export const getToLink = (
	routeTemplate: string,
	queryParams?: Record<string, string | number | undefined>
) => {
	const pathname = document.location.pathname;
	const basename = pathname.substring(0, pathname.lastIndexOf('/'));
	const menuSlug =
		(window as unknown as { doublescaleConfig?: { menuSlug?: string } })
			.doublescaleConfig?.menuSlug || 'doublescale';
	let to = `${basename}/admin.php?page=${menuSlug}`;

	// Replace dynamic segments in the route template with the actual values from `params`.
	const route = routeTemplate.replace(/:([^/]+)/g, (_, key) => {
		const value = key;
		return value;
	});

	to += `&path=${route}`;

	if (queryParams) {
		for (const [key, value] of Object.entries(queryParams)) {
			if (value !== undefined && value !== null && value !== '') {
				to += `&${encodeURIComponent(key)}=${encodeURIComponent(String(value))}`;
			}
		}
	}

	return to;
};