import { createReduxStore, register } from '@wordpress/data';
import type { DispatchFromMap, SelectFromMap } from '../types';
import * as actions from './actions';
import { STORE_KEY } from './constants';
import type { State } from './reducer';
import reducer from './reducer';
import * as selectors from './selectors';

const store = createReduxStore<State, typeof actions, typeof selectors>(
	STORE_KEY,
	{
		actions,
		selectors,
		reducer,
	}
);

register(store);

export default store;
export * from './types';

declare module '@wordpress/data' {
	function dispatch(key: typeof STORE_KEY): DispatchFromMap<typeof actions>;
	function select(key: typeof STORE_KEY): SelectFromMap<typeof selectors>;
	function useSelect<R>(
		selector: (customSelect: typeof select) => R,
		deps?: any[]
	): R;
	function useDispatch(
		key: typeof STORE_KEY
	): DispatchFromMap<typeof actions>;
}
