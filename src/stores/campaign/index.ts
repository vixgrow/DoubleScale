import { createReduxStore, register } from '@wordpress/data';
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
