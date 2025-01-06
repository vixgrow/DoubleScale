import { withCn } from '@udecode/cn';

import { Toolbar } from './toolbar';

export const FixedToolbar = withCn(
  Toolbar,
  'fixed bg-white left-300 top-0 z-50 w-full justify-between overflow-x-auto rounded-t-lg border-b border-b-border p-1'
);
