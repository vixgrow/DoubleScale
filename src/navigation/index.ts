export * from './api';
export {
	Routes,
	Route,
	matchPath,
	BrowserRouter,
	useParams,
	unstable_HistoryRouter as HistoryRouter,
	useNavigate,
	useMatch,
} from 'react-router-dom';
export { NavLink, setForceReload } from './nav-link';
export { getHistory } from './history';

export const getToLink = (to: string) => {
	const pathname = document.location.pathname;
	const basename = pathname.substring(0, pathname.lastIndexOf('/'));
	const [path, id, tab, subtab] = to.split('/');

	to = `${basename}/admin.php?page=quillcrm&path=${path}`;

	if (id) {
		to += `&id=${id}`;
	}

	if (tab) {
		to += `&tab=${tab}`;
	}

	if (subtab) {
		to += `&subtab=${subtab}`;
	}

	return to;
};
