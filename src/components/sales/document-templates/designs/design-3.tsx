import React from '@wordpress/element';
import { PropovoiceLayout } from './propovoice-layout';
import type { DocumentDesignProps } from './types';

const Design3: React.FC<DocumentDesignProps> = (props) => (
	<PropovoiceLayout {...props} designId={3} variant="corners" />
);
export default Design3;
