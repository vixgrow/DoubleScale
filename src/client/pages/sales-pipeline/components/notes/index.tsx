import React from 'react'
import Activity from '../activity';

export default function Notes({ dealId }: { dealId?: number }) {
  return  <Activity dealId={dealId} activityTypeFilter="note_added" />;
}
