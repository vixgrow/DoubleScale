import React from '@wordpress/element';
import { PropovoiceLayout } from './propovoice-layout';
import type { DocumentDesignProps } from './types';

const Design4: React.FC<DocumentDesignProps> = (props) => (
	<PropovoiceLayout {...props} designId={4} variant="wave-full" />
);
export default Design4;
