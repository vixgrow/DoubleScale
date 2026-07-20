import React from '@wordpress/element';
import { DoubleScaleLayout } from './doublescale-layout';
import type { DocumentDesignProps } from './types';

const Design3: React.FC<DocumentDesignProps> = (props) => (
	<DoubleScaleLayout {...props} designId={3} />
);
export default Design3;
