import { registerCoreBlocks } from '@wordpress/block-library';
import Editor from './editor';

import './styles.scss';

const TemplateBuilder = () => {
	const settings = window.getdaveSbeSettings || {};
	registerCoreBlocks();

	return (
		<Editor />
	)
}


export default TemplateBuilder;