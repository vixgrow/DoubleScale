import React from 'react';
import Header from './components/Header';
import Sidebar from './components/Sidebar';
import Canvas from './components/Canvas';
// import BlockEditor from './BlockEditor';
// import { useBuilderStore } from '../store/useBuilderStore';

const Builder: React.FC = () => {
	// const selectedBlock = useBuilderStore((state) => state.selectedBlock);

	return (
		<div className="flex flex-col  absolute top-0 left-0 right-0 bottom-0 z-50 bg-primary-foreground">
			<Header />
			<div
				className="flex flex-1 pt-1"
				style={{ backgroundColor: '#e6eff7' }}
			>
				<Sidebar />
				<Canvas />
				{/*	{selectedBlock && <BlockEditor />} */}
			</div>
		</div>
	);
};

export default Builder;
