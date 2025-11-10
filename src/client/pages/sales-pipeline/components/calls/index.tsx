
import Activity from '../activity';

export default function Calls({ dealId }: { dealId?: number }) {
  return  <Activity dealId={dealId} activityTypeFilter="call_logged" />;
}
