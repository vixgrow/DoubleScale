import React from '@wordpress/element';
import { DoubleScaleLayout } from './doublescale-layout';
import type { DocumentDesignProps } from './types';

const Design5: React.FC<DocumentDesignProps> = (props) => (
	<DoubleScaleLayout {...props} designId={5} />
);
export default Design5;
