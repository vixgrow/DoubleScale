import React from '@wordpress/element';
import { DoubleScaleLayout } from './doublescale-layout';
import type { DocumentDesignProps } from './types';

const Design8: React.FC<DocumentDesignProps> = (props) => (
	<DoubleScaleLayout {...props} designId={8} />
);
export default Design8;
