/**
 * Internal dependencies
 */
import type { Event } from '@/types/booking';
import { SET_EVENT } from './constants';
import type { EventActionTypes } from './types';

export default (dispatch: React.Dispatch<EventActionTypes>) => {
	return {
		setEvent: (event: Event) => {
			dispatch({
				type: SET_EVENT,
				payload: event,
			});
		}
	};
};
