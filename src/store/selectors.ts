/**
 * Internal Dependencies
 */
import { State } from './reducer';
import { Notices } from './types';

/**
 * Get notices.
 *
 * @param {State} state State.
 *
 * @return {Notices} Notices.
 */
export const getNotices = (state: State): Notices => {
	return state.notices;
};
