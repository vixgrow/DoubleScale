
import Activity from '../activity';

export default function Emails({ dealId }: { dealId?: number }) {
  return <Activity dealId={dealId} activityTypeFilter="email_sent" />;
}
