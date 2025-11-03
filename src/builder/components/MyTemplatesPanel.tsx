import { __ } from '@wordpress/i18n';
import { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { MyTemplatesIcon } from '@/components/icons';
import { getUserTemplates, renderTemplate } from '../api/templates';
import { useDispatch } from '@wordpress/data';
import { STORE_KEY } from '../../stores/email-builder/constants';
import type { EmailTemplate } from '@quillcrm/client';
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
} from '@/components/ui/dialog';

interface MyTemplatesPanelProps {
	isOpen: boolean;
	onClose: () => void;
	refreshKey?: number;
}

interface TemplateCardProps {
	template: EmailTemplate;
	onUseTemplate: (template: EmailTemplate) => void;
	onPreview: (template: EmailTemplate) => void;
}

const TemplateCard = ({
	template,
	onUseTemplate,
	onPreview,
}: TemplateCardProps) => {
	return (
		<div className="bg-white border border-gray-200 rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-shadow">
			{/* Template Preview */}
			<div className="relative group">
				{template.thumbnail ? (
					<img
						src={template.thumbnail}
						alt={template.name}
						className="w-full h-64 object-cover"
					/>
				) : (
					<div className="w-full h-64 bg-gray-100 flex items-center justify-center">
						<div className="text-gray-400">
							<MyTemplatesIcon width={48} height={48} />
						</div>
					</div>
				)}

				{/* Overlay buttons */}
				<div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-50 transition-all duration-300 flex items-center justify-center opacity-0 group-hover:opacity-100">
					<div className="flex flex-col gap-3">
						<Button
							onClick={() => onUseTemplate(template)}
							className="bg-blue-500 hover:bg-blue-600 text-white px-8 py-2 rounded-full font-medium text-sm shadow-lg"
						>
							{__('Use template', 'quillcrm')}
						</Button>
						<Button
							onClick={() => onPreview(template)}
							variant="outline"
							className="bg-white text-gray-900 px-8 py-2 rounded-full font-medium text-sm border-2 border-white hover:bg-gray-50"
						>
							{__('Preview', 'quillcrm')}
						</Button>
					</div>
				</div>
			</div>

			{/* Template Info */}
			<div className="p-3 text-center">
				<h3 className="font-medium text-gray-900 text-sm">
					{template.name}
				</h3>
			</div>
		</div>
	);
};

const MyTemplatesContent = ({ refreshKey }: { refreshKey?: number }) => {
	const [templates, setTemplates] = useState<EmailTemplate[]>([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);
	const [previewTemplate, setPreviewTemplate] =
		useState<EmailTemplate | null>(null);
	const [previewHtml, setPreviewHtml] = useState<string>('');
	const [loadingPreview, setLoadingPreview] = useState(false);
	const dispatch = useDispatch();

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
				err instanceof Error ? err.message : 'Failed to load templates'
			);
			setTemplates([]); // Set empty array on error
		} finally {
			setLoading(false);
		}
	};

	useEffect(() => {
		fetchTemplates();
	}, [refreshKey]);

	const handleUseTemplate = (template: EmailTemplate) => {
		try {
			console.log('Loading template:', template);

			// Parse the template body to get builder data
			if (template.body && typeof template.body === 'string') {
				const bodyData = JSON.parse(template.body);
				console.log('Parsed body data:', bodyData);

				if (bodyData.type === 'builder' && bodyData.value) {
					// Load the template data into the builder
					const { sections, globalSettings, buttonSettings } =
						bodyData.value;

					console.log('Template data:', {
						sections,
						globalSettings,
						buttonSettings,
					});

					// Clear existing content first
					dispatch(STORE_KEY).resetBuilder();

					// Update the builder state
					if (sections && sections.length > 0) {
						dispatch(STORE_KEY).setBuilderState(sections);
					}

					if (globalSettings) {
						dispatch(STORE_KEY).updateGlobalSettings(
							globalSettings
						);
					}

					if (buttonSettings) {
						dispatch(STORE_KEY).setButtonSettings(buttonSettings);
					}
				} else {
					console.warn('Invalid template body structure:', bodyData);
				}
			} else {
				console.warn(
					'Template body is not a string or is empty:',
					template.body
				);
			}
		} catch (error) {
			console.error('Error loading template:', error);
		}
	};

	const handlePreview = async (template: EmailTemplate) => {
		if (!template.id) {
			console.error('Template ID is missing');
			return;
		}

		setPreviewTemplate(template);
		setLoadingPreview(true);
		setPreviewHtml('');

		try {
			const html = await renderTemplate(template.id);
			setPreviewHtml(html);
		} catch (error) {
			console.error('Error rendering template:', error);
			setPreviewHtml(
				'<p style="color: red; padding: 20px; text-align: center;">Failed to load preview</p>'
			);
		} finally {
			setLoadingPreview(false);
		}
	};

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
		<>
			<div className="grid grid-cols-1 gap-4 p-4 max-w-md mx-auto">
				{templates.map((template) => (
					<TemplateCard
						key={template.id}
						template={template}
						onUseTemplate={handleUseTemplate}
						onPreview={handlePreview}
					/>
				))}
			</div>

			{/* Preview Dialog */}
			<Dialog
				open={!!previewTemplate}
				onOpenChange={() => setPreviewTemplate(null)}
			>
				<DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
					<DialogHeader>
						<DialogTitle className="text-center">
							{__('Preview template', 'quillcrm')}
						</DialogTitle>
					</DialogHeader>
					<div className="flex-1 overflow-auto mt-4">
						{loadingPreview ? (
							<div className="flex flex-col items-center justify-center h-full min-h-[400px]">
								<div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
								<p className="text-gray-500 text-center mt-4">
									{__('Loading preview...', 'quillcrm')}
								</p>
							</div>
						) : previewHtml ? (
							<iframe
								srcDoc={previewHtml}
								className="w-full min-h-[600px] border-0"
								title={__('Template Preview', 'quillcrm')}
								sandbox="allow-same-origin"
								style={{ backgroundColor: '#fff' }}
							/>
						) : (
							<div className="flex flex-col items-center justify-center p-12 bg-gray-50 rounded-lg min-h-[400px]">
								<div className="text-gray-300 mb-4">
									<MyTemplatesIcon width={64} height={64} />
								</div>
								<p className="text-gray-500 text-center">
									{__('No preview available', 'quillcrm')}
								</p>
							</div>
						)}
					</div>
				</DialogContent>
			</Dialog>
		</>
	);
};

const MyTemplatesPanel = ({
	isOpen,
	onClose,
	refreshKey,
}: MyTemplatesPanelProps) => {
	if (!isOpen) return null;

	return (
		<div className="absolute top-0 left-0 w-full h-full bg-white z-30">
			<div className="flex flex-col h-full">
				<div className="flex items-center justify-between p-6 border-b border-gray-200 mx-2">
					<h2 className="text-lg font-semibold text-gray-900">
						{__('My Templates', 'quillcrm')}
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
					<MyTemplatesContent refreshKey={refreshKey} />
				</div>
			</div>
		</div>
	);
};

export default MyTemplatesPanel;
