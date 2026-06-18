/**
 * No-op stub when DoubleScale Pro is not present in the build tree.
 */

import CreditNotesPortalProGate from './credit-note-pro-gate';

const PortalCreditNoteDetailStub = (_props: { hash: string }) => (
	<CreditNotesPortalProGate />
);

export default PortalCreditNoteDetailStub;
