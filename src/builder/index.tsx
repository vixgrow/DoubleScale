import React from 'react';
import { useDispatch, useSelect } from '@wordpress/data';
import Header from './components/Header';
import Sidebar from './components/Sidebar';
import Canvas from './components/Canvas';
import BlockEditor from './components/BlockEditor';
import { STORE_KEY } from '../stores/email-builder/constants';

const Builder: React.FC = () => {
	const selectedBlockId = useSelect(
		(select) => select(STORE_KEY).getSelectedBlockId(),
		[]
	);

	return (
		<div className="flex flex-col  absolute top-0 left-0 right-0 bottom-0 z-50 bg-primary-foreground">
			<Header />
			<div
				className="flex flex-1 pt-1"
				style={{ backgroundColor: '#e6eff7' }}
			>
				<Sidebar />
				<Canvas />
				{selectedBlockId && <BlockEditor />}
			</div>
		</div>
	);
};

export default Builder;
