/**
 * wordpress dependencies
 */
import { __ } from '@wordpress/i18n';

/**
 * external dependencies
 */
import React, { useState, useEffect } from 'react';

/**
 * internal dependencies
 */
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
	DialogFooter,
} from '@/components/ui/dialog';

interface LinkDialogProps {
	isOpen: boolean;
	onClose: () => void;
	onConfirm: (linkData: LinkData) => void;
	initialUrl?: string;
}

export interface LinkData {
	url: string;
}

export const LinkDialog: React.FC<LinkDialogProps> = ({
	isOpen,
	onClose,
	onConfirm,
	initialUrl = '',
}) => {
	const [url, setUrl] = useState(initialUrl);

	// Update state when dialog opens or initial values change (for editing existing links)
	useEffect(() => {
		if (isOpen) {
			setUrl(initialUrl);
		}
	}, [isOpen, initialUrl]);

	const handleConfirm = () => {
		if (!url.trim()) {
			return;
		}

		let finalUrl = url.trim();
		// Don't add protocol for merge tags (e.g. {{contact:unsubscribe_link}})
		const isMergeTag = finalUrl.startsWith('{{') && finalUrl.endsWith('}}');
		if (!isMergeTag && !finalUrl.match(/^https?:\/\//)) {
			finalUrl = `https://${finalUrl}`;
		}

		onConfirm({
			url: finalUrl,
		});

		onClose();
	};

	const handleCancel = () => {
		// Reset to initial values
		setUrl(initialUrl);
		onClose();
	};

	return (
		<Dialog open={isOpen} onOpenChange={onClose}>
			<DialogContent className="sm:max-w-md">
				<DialogHeader>
					<DialogTitle>
						{initialUrl
							? __('Edit Link', 'doublescale')
							: __('Add Link', 'doublescale')}
					</DialogTitle>
				</DialogHeader>

				<div className="space-y-4">
					{/* URL Input */}
					<div className="space-y-2">
						<Label htmlFor="link-url">
							{__('URL', 'doublescale')}{' '}
							<span className="text-red-500">*</span>
						</Label>
						<Input
							id="link-url"
							type="text"
							placeholder="https://example.com or {{contact:unsubscribe_link}}"
							value={url}
							onChange={(e) => setUrl(e.target.value)}
							autoFocus
						/>
					</div>
				</div>

				<DialogFooter>
					<Button variant="outline" onClick={handleCancel}>
						{__('Cancel', 'doublescale')}
					</Button>
					<Button onClick={handleConfirm} disabled={!url.trim()}>
						{initialUrl
							? __('Update Link', 'doublescale')
							: __('Add Link', 'doublescale')}
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
};
