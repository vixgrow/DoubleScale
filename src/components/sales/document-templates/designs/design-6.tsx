import React from '@wordpress/element';
import { PropovoiceLayout } from './propovoice-layout';
import type { DocumentDesignProps } from './types';

const Design6: React.FC<DocumentDesignProps> = (props) => (
	<PropovoiceLayout {...props} designId={6} variant="boxed" />
);
export default Design6;
