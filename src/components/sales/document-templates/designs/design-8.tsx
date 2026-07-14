import React from '@wordpress/element';
import { PropovoiceLayout } from './propovoice-layout';
import type { DocumentDesignProps } from './types';

const Design8: React.FC<DocumentDesignProps> = (props) => (
	<PropovoiceLayout {...props} designId={8} variant="sidebar" />
);
export default Design8;
