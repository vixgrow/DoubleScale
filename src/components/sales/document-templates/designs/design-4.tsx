import React from '@wordpress/element';
import { DoubleScaleLayout } from './doublescale-layout';
import type { DocumentDesignProps } from './types';

const Design4: React.FC<DocumentDesignProps> = (props) => (
	<DoubleScaleLayout {...props} designId={4} />
);
export default Design4;
