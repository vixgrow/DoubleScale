import React from '@wordpress/element';
import { DoubleScaleLayout } from './doublescale-layout';
import type { DocumentDesignProps } from './types';

const Design6: React.FC<DocumentDesignProps> = (props) => (
	<DoubleScaleLayout {...props} designId={6} />
);
export default Design6;
