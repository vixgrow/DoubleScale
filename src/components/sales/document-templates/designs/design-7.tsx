import React from '@wordpress/element';
import { DoubleScaleLayout } from './doublescale-layout';
import type { DocumentDesignProps } from './types';

const Design7: React.FC<DocumentDesignProps> = (props) => (
	<DoubleScaleLayout {...props} designId={7} />
);
export default Design7;
