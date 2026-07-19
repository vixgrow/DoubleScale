import React from '@wordpress/element';
import { DoubleScaleLayout } from './doublescale-layout';
import type { DocumentDesignProps } from './types';

const Design2: React.FC<DocumentDesignProps> = (props) => (
	<DoubleScaleLayout {...props} designId={2} />
);
export default Design2;
