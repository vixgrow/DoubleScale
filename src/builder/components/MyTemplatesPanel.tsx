import { __ } from '@wordpress/i18n';
import { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { MyTemplatesIcon } from '@/components/icons';
import { getUserTemplates } from '../api/templates';
import type { EmailTemplate } from '@quillcrm/client';

interface MyTemplatesPanelProps {
	isOpen: boolean;
	onClose: () => void;
}

const MyTemplatesContent = () => {
	const [templates, setTemplates] = useState<EmailTemplate[]>([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);

	useEffect(() => {
		const fetchTemplates = async () => {
			try {
				setLoading(true);
				// Fetch only user-created templates using dedicated endpoint
				const fetchedTemplates = await getUserTemplates();
				// Ensure we have an array
				if (Array.isArray(fetchedTemplates)) {
					setTemplates(fetchedTemplates);
				} else {
					console.warn(
						'Templates response is not an array:',
						fetchedTemplates
					);
					setTemplates([]);
				}
			} catch (err) {
				console.error('Error fetching templates:', err);
				setError(
					err instanceof Error
						? err.message
						: 'Failed to load templates'
				);
				setTemplates([]); // Set empty array on error
			} finally {
				setLoading(false);
			}
		};

		fetchTemplates();
	}, []);

	if (loading) {
		return (
			<div className="flex flex-col items-center justify-center h-full">
				<div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
				<p className="text-gray-500 text-center mt-4">
					{__('Loading templates...', 'quillcrm')}
				</p>
			</div>
		);
	}

	if (error) {
		return (
			<div className="flex flex-col items-center justify-center h-full">
				<p className="text-red-500 text-center">{error}</p>
			</div>
		);
	}

	if (templates.length === 0) {
		return (
			<div className="flex flex-col items-center justify-center h-full">
				<div className="mb-2">
					<div className="flex items-center justify-center mb-4 text-gray">
						<MyTemplatesIcon width={55} height={55} />
					</div>
				</div>
				<p className="text-gray-500 text-center">
					{__('No saved templates til now', 'quillcrm')}
				</p>
			</div>
		);
	}

	return (
		<div className="grid grid-cols-1 gap-4 p-4">
			{templates.map((template) => (
				<div
					key={template.id}
					className="border border-gray-200 rounded-lg p-3 hover:shadow-md transition-shadow cursor-pointer"
				>
					{template.thumbnail ? (
						<img
							src={template.thumbnail}
							alt={template.name}
							className="w-full h-32 object-cover rounded-md mb-3"
						/>
					) : (
						<div className="w-full h-32 bg-gray-100 rounded-md mb-3 flex items-center justify-center">
							<MyTemplatesIcon width={32} height={32} />
						</div>
					)}
					<h3 className="font-medium text-sm text-gray-900 truncate">
						{template.name}
					</h3>
					<p className="text-xs text-gray-500 mt-1">
						{template.created_at
							? new Date(template.created_at).toLocaleDateString()
							: ''}
					</p>
				</div>
			))}
		</div>
	);
};

const MyTemplatesPanel = ({ isOpen, onClose }: MyTemplatesPanelProps) => {
	if (!isOpen) return null;

	return (
		<div className="absolute top-0 left-0 w-full h-full bg-white z-30">
			<div className="flex flex-col h-full">
				<div className="flex items-center justify-between p-6 border-b border-gray-200 mx-2">
					<h2 className="text-lg font-semibold text-gray-900">
						{__('Pre-built Templates', 'quillcrm')}
					</h2>
					<Button
						variant="ghost"
						size="sm"
						onClick={onClose}
						className="h-8 w-8 p-0 hover:bg-gray-100"
					>
						<X className="h-5 w-5" />
					</Button>
				</div>
				<div className="flex-1 overflow-y-auto">
					<MyTemplatesContent />
				</div>
			</div>
		</div>
	);
};

export default MyTemplatesPanel;
