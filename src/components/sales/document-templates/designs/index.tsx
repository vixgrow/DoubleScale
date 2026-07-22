/**
 * Document design registry and renderer.
 */

import React from '@wordpress/element';

import { normalizeTemplateId } from '../registry';
import Design1 from './design-1';
import Design2 from './design-2';
import Design3 from './design-3';
import Design4 from './design-4';
import Design5 from './design-5';
import Design6 from './design-6';
import Design7 from './design-7';
import Design8 from './design-8';
import type { DocumentDesignProps } from './types';

import './designs.scss';

const DESIGNS: Record<number, React.FC<DocumentDesignProps>> = {
	1: Design1,
	2: Design2,
	3: Design3,
	4: Design4,
	5: Design5,
	6: Design6,
	7: Design7,
	8: Design8,
};

export type { DocumentDesignProps };

export const DocumentDesign: React.FC<DocumentDesignProps> = (props) => {
	const id = normalizeTemplateId(props.template);
	const Design = DESIGNS[id] || Design1;
	return <Design {...props} template={id} />;
};
