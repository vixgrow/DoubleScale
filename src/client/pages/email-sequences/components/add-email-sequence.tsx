import React, { useState } from 'react';
import { __ } from '@wordpress/i18n';
import EmailSequenceModal from './email-sequence-modal';
import AISequenceGenerator from './ai-sequence-generator';
import apiFetch from '@wordpress/api-fetch';
import { useDispatch } from '@wordpress/data';
import { EMAIL_SEQUENCE_TYPE, END_POINT } from '../constants';
import { EmailSequenceData } from '../types';
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
} from '@/components/ui/dialog';
import { EnvelopeIcon } from '@/components';
import { Sparkles } from 'lucide-react';
import ConfigApi from '@doublescale/config';

interface AddEmailSequenceProps {
	onSuccess?: () => void;
	isAdding: boolean;
	setIsAdding: (isAdding: boolean) => void;
	handleNavigate?: (href: string) => void;
}

interface EmailSequence {
	id: number;
	name: string;
	description: string;
	settings: object;
	status: string;
}

const AddEmailSequence: React.FC<AddEmailSequenceProps> = ({
	onSuccess,
	isAdding,
	setIsAdding,
	handleNavigate,
}) => {
	const [loading, setLoading] = useState(false);
	const [showSelection, setShowSelection] = useState(false);
	const [showManualModal, setShowManualModal] = useState(false);
	const [showAiGenerator, setShowAiGenerator] = useState(false);
	const { createNotice } = useDispatch('doublescale/core');
	const aiConfigured = ConfigApi.isAiConfigured();

	// When parent sets isAdding to true, show the selection dialog
	React.useEffect(() => {
		if (isAdding) {
			setShowSelection(true);
		}
	}, [isAdding]);

	const handleCloseSelection = () => {
		setShowSelection(false);
		setIsAdding(false);
	};

	const handleSelectManual = () => {
		setShowSelection(false);
		setShowManualModal(true);
	};

	const handleSelectAi = () => {
		setShowSelection(false);
		setShowAiGenerator(true);
	};

	const handleManualClose = (open: boolean) => {
		setShowManualModal(open);
		if (!open) {
			setIsAdding(false);
		}
	};

	const handleAiClose = (visible: boolean) => {
		setShowAiGenerator(visible);
		if (!visible) {
			setIsAdding(false);
		}
	};

	const handleSubmit = async (data: EmailSequenceData) => {
		setLoading(true);
		try {
			const settings: any = {};
			if (data.setCustomFromNameAndEmail) {
				settings.from_name = data.fromName;
				settings.from_email = data.fromEmail;
				settings.reply_to_name = data.replyToName;
				settings.reply_to_email = data.replyToEmail;
			}

			const response = (await apiFetch({
				path: END_POINT,
				method: 'POST',
				data: {
					name: data.name,
					settings: settings,
					description: __('New email sequence', 'doublescale'),
					type: EMAIL_SEQUENCE_TYPE,
					status: 'draft',
				},
			})) as EmailSequence;

			setShowManualModal(false);
			setIsAdding(false);
			createNotice({
				type: 'success',
				message: __('Email sequence created successfully', 'doublescale'),
			});

			if (onSuccess) {
				onSuccess();
				if (handleNavigate) {
					handleNavigate(`email-sequences/${response.id}`);
				}
			}
		} catch (error: any) {
			createNotice({
				type: 'error',
				message:
					error.message ||
					__('Failed to create email sequence', 'doublescale'),
			});
		} finally {
			setLoading(false);
		}
	};

	const selectionOptions = [
		{
			label: __('Create Manually', 'doublescale'),
			description: __(
				'Set up your email sequence step by step with full control over each email.',
				'doublescale'
			),
			type: 'manual',
			icon: <EnvelopeIcon />,
			onClick: handleSelectManual,
		},
		{
			label: __('Generate with AI', 'doublescale'),
			description: __(
				'Describe your sequence and AI will generate all emails with professional templates.',
				'doublescale'
			),
			type: 'ai',
			icon: <Sparkles className="w-5 h-5" />,
			onClick: handleSelectAi,
			beta: true,
			disabled: !aiConfigured,
		},
	];

	return (
		<>
			{/* Selection Dialog */}
			<Dialog open={showSelection} onOpenChange={handleCloseSelection}>
				<DialogContent className="max-w-[640px] w-full mx-auto">
					<DialogHeader className="text-center sm:text-center">
						<DialogTitle className="text-2xl font-bold mb-1">
							{__('Create Email Sequence', 'doublescale')}
						</DialogTitle>
						<DialogDescription className="text-foreground">
							{__('Choose how you\'d like to create your email sequence', 'doublescale')}
						</DialogDescription>
					</DialogHeader>
					<div className="flex gap-4">
						{selectionOptions.map((option) => (
							<div
								className={`flex flex-1 flex-col justify-between items-center py-6 px-4 border border-gray-200 rounded-lg ${
									option.disabled
										? 'opacity-50 cursor-not-allowed'
										: 'cursor-pointer hover:bg-secondary-background hover:border-primary hover:transition-all hover:duration-300'
								}`}
								key={option.type}
								onClick={option.disabled ? undefined : option.onClick}
							>
								<div className="bg-gradient-to-r from-[#1E3A8A] to-[#3B82F6] text-primary-foreground p-3 rounded-xl">
									{option.icon}
								</div>
								<div className="flex items-center gap-2 w-full justify-center">
									<p className="font-semibold text-foreground text-sm my-2">
										{option.label}
									</p>
									{option.beta && (
										<span className="text-xs text-primary bg-secondary-background rounded-full px-2 py-1 font-semibold">
											{__('Beta', 'doublescale')}
										</span>
									)}
								</div>
								<p className="text-foreground text-sm text-center">
									{option.description}
								</p>
								{option.disabled && (
									<p className="text-xs text-muted-foreground mt-2 text-center">
										{__('Configure AI in Settings > AI', 'doublescale')}
									</p>
								)}
							</div>
						))}
					</div>
				</DialogContent>
			</Dialog>

			{/* Manual Create Modal */}
			<EmailSequenceModal
				open={showManualModal}
				onOpenChange={handleManualClose}
				onSubmit={handleSubmit}
				title={__('Create Email Sequence', 'doublescale')}
				isLoading={loading}
			/>

			{/* AI Generator */}
			<AISequenceGenerator
				visible={showAiGenerator}
				setVisible={handleAiClose}
				onSuccess={onSuccess ?? (() => {})}
				handleNavigate={handleNavigate}
			/>
		</>
	);
};

export default AddEmailSequence;
