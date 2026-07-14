import React from '@wordpress/element';
import { PropovoiceLayout } from './propovoice-layout';
import type { DocumentDesignProps } from './types';

const Design2: React.FC<DocumentDesignProps> = (props) => (
	<PropovoiceLayout {...props} designId={2} variant="corners" />
);
export default Design2;
