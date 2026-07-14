import React from '@wordpress/element';
import { PropovoiceLayout } from './propovoice-layout';
import type { DocumentDesignProps } from './types';

const Design7: React.FC<DocumentDesignProps> = (props) => (
	<PropovoiceLayout {...props} designId={7} variant="bar" />
);
export default Design7;
