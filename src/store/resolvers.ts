/**
 * QuillSMTP Dependencies.
 */
import ConfigAPI from '@quillcrm/config';

/**
 * Internal Dependencies.
 */
import { setupStore } from './actions';

export const getConnections = () => {
	const initialPayload = ConfigAPI.getInitialPayload();

	return setupStore(initialPayload);
};
