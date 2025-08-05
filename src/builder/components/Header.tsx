import React from 'react';
import { __ } from '@wordpress/i18n';
import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { PreviewIcon, RedoIcon, UndoIcon } from '@/components/icons';
import BreadcrumbComponent from '@/components/breadcrumb';

const Header: React.FC = () => {
	return (
		<div className="flex items-center justify-between p-4 bg-primary-foreground border-b border-input">
			<div className="flex items-center align-center gap-2">
				<X className="h-5 w-5 text-primary" />
				<BreadcrumbComponent
					items={[
						{ label: __('Create Campaign', 'quillcrm') },
						{ label: __('Standard Campaign', 'quillcrm') },
						{ label: __('Email Template', 'quillcrm') },
					]}
				/>
			</div>
			<div className="flex items-center gap-2">
				<Button variant="outline" className="px-3">
					<UndoIcon />
				</Button>
				<Button variant="outline" className="px-3">
					<RedoIcon />
				</Button>
				<Button
					variant="outline"
					className="px-3 text-muted-foreground"
				>
					<PreviewIcon />
					{__('Preview & test', 'quillcrm')}
				</Button>
				<Button variant="default" className="px-3">
					{__('Save & Continue', 'quillcrm')}
				</Button>
			</div>
		</div>
	);
};

export default Header;
