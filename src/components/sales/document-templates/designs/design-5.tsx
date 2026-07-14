import React from '@wordpress/element';
import { PropovoiceLayout } from './propovoice-layout';
import type { DocumentDesignProps } from './types';

const Design5: React.FC<DocumentDesignProps> = (props) => (
	<PropovoiceLayout {...props} designId={5} variant="minimal" />
);
export default Design5;
