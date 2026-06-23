/**
 * Support ticket detail route — renders the full-screen ticket dialog.
 */

import type { FC } from 'react';
import { useNavigate, getToLink, useParams } from '@doublescale/navigation';
import { TicketDetailModal } from '../inbox/ticket-detail-modal';

const SupportTicketDetail: FC = () => {
	const navigate = useNavigate();
	const params = useParams<{ id: string }>();
	const ticketId = params.id ? Number(params.id) : null;

	return (
		<TicketDetailModal
			ticketId={ticketId}
			visible={!!ticketId}
			onClose={() => navigate(getToLink('support'))}
			navigate={navigate}
		/>
	);
};

export default SupportTicketDetail;
