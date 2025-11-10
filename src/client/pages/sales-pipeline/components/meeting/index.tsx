
import Activity from '../activity';

export default function Meeting({ dealId }: { dealId?: number }) {
  return  <Activity dealId={dealId} activityTypeFilter="meeting_scheduled" />;
}
