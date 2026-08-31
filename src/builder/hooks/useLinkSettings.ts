import { useDispatch, useSelect } from '@wordpress/data';
import { STORE_KEY } from '../../stores/email-builder/constants';
import type { LinkSettings } from '../../stores/email-builder/types';
import {
	DEFAULT_LINK_SETTINGS,
	mergeLinkSettings,
} from '../utils/linkSettings';

export const useLinkSettings = () => {
	const dispatch = useDispatch();

	const linkSettings = useSelect((select: any) => {
		try {
			return (
				select(STORE_KEY).getLinkSettings?.() ?? DEFAULT_LINK_SETTINGS
			);
		} catch {
			return DEFAULT_LINK_SETTINGS;
		}
	}, []);

	const updateLinkSettings = (settings: Partial<LinkSettings>) => {
		dispatch(STORE_KEY).updateLinkSettings(settings);
	};

	const getLinkSettings = (): LinkSettings =>
		mergeLinkSettings(linkSettings);

	return {
		linkSettings: getLinkSettings(),
		updateLinkSettings,
		getLinkSettings,
	};
};
