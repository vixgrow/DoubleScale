/**
 * external dependencies
 */
import React, { useRef, useEffect } from 'react';
/**
 * internal dependencies
 */
import { NoticeBanner } from '@doublescale/components';
import { useContactsContext } from '../contexts';

export const NoticeSection: React.FC = () => {
	const { notice, closeNotice } = useContactsContext();
	const noticeBannerRef = useRef<HTMLDivElement>(null);

	// Scroll to notice banner when notice appears
	useEffect(() => {
		if (notice && noticeBannerRef.current) {
			noticeBannerRef.current.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
		}
	}, [notice]);

	if (!notice) {
		return null;
	}

	return <NoticeBanner ref={noticeBannerRef} notice={notice} closeNotice={closeNotice} />;
};
