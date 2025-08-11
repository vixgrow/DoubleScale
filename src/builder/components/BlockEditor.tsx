import React from 'react';
import { useDispatch, useSelect } from '@wordpress/data';
import { __ } from '@wordpress/i18n';
import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { STORE_KEY } from '../../stores/email-builder/constants';
import { blocksRegistry } from '../blocks/BlockRegister';

const BlockEditor: React.FC = () => {
	const dispatch = useDispatch();

	const selectedBlock = useSelect(
		(select) => select(STORE_KEY).getSelectedBlock(),
		[]
	);

	if (!selectedBlock) {
		return null;
	}

	const blockDefinition = blocksRegistry[selectedBlock.type];

	if (!blockDefinition || !blockDefinition.Editor) {
		return (
			<div className="w-80 bg-background border-l border-border p-4">
				<div className="flex items-center justify-between mb-4">
					<h3 className="text-lg font-semibold">
						{__('Block Settings', 'quillcrm')}
					</h3>
					<Button
						variant="ghost"
						size="sm"
						onClick={() => dispatch(STORE_KEY).clearSelection()}
					>
						<X className="h-4 w-4" />
					</Button>
				</div>
				<p className="text-muted-foreground">
					{__('No editor available for this block type.', 'quillcrm')}
				</p>
			</div>
		);
	}

	const handlePropsChange = (newProps: Record<string, any>) => {
		dispatch(STORE_KEY).updateBlock(selectedBlock.id, newProps);
	};

	return (
		<div className="w-80 bg-background border-l border-border rounded-l-xl">
			<div className="flex items-center justify-between border-b-2 px-4 pt-5 pb-4">
				<div className="flex items-center gap-2">
					<div className="bg-gradient-to-r from-primary to-secondary p-2 rounded-lg text-white">
						<blockDefinition.icon />
					</div>
					<h3 className="text-base font-semibold text-primary">
						{blockDefinition.name || __('Block', 'quillcrm')}{' '}
						{__('Settings', 'quillcrm')}
					</h3>
				</div>
				<Button
					variant="ghost"
					size="sm"
					onClick={() => dispatch(STORE_KEY).clearSelection()}
				>
					<X className="h-4 w-4" />
				</Button>
			</div>

			<div className="space-y-4 px-4 pb-4">
				<blockDefinition.Editor
					props={selectedBlock.props}
					onChange={handlePropsChange}
				/>
			</div>

			<div className="mt-6 pt-4 px-4 border-t border-border">
				<Button
					variant="destructive"
					size="sm"
					className="w-full"
					onClick={() => {
						dispatch(STORE_KEY).deleteBlock(selectedBlock.id);
						dispatch(STORE_KEY).clearSelection();
					}}
				>
					{__('Delete Block', 'quillcrm')}
				</Button>
			</div>
		</div>
	);
};

export default BlockEditor;
