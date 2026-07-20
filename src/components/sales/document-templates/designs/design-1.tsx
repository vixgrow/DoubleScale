import React from '@wordpress/element';
import { DoubleScaleLayout } from './doublescale-layout';
import type { DocumentDesignProps } from './types';

const Design1: React.FC<DocumentDesignProps> = (props) => (
	<DoubleScaleLayout {...props} designId={1} />
);
export default Design1;
