import React from '@wordpress/element';
import { PropovoiceLayout } from './propovoice-layout';
import type { DocumentDesignProps } from './types';

const Design1: React.FC<DocumentDesignProps> = (props) => (
	<PropovoiceLayout {...props} designId={1} variant="classic" />
);
export default Design1;
