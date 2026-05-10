/**
 * QuillSMTP Dependencies.
 */
import ConfigAPI from '@doublescale/config';

/**
 * Internal Dependencies.
 */
import { setupStore } from './actions';

export const getConnections = () => {
	const initialPayload = ConfigAPI.getInitialPayload();

	return setupStore(initialPayload);
};
