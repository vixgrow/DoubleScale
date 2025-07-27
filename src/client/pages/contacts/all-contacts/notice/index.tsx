/**
 * external dependencies
 */
import React from 'react';
/**
 * internal dependencies
 */
import { NoticeBanner } from '@quillcrm/components';
import { useContactsContext } from '../contexts';

export const NoticeSection: React.FC = () => {
	const { notice, closeNotice } = useContactsContext();

	if (!notice) {
		return null;
	}

	return <NoticeBanner notice={notice} closeNotice={closeNotice} />;
};
