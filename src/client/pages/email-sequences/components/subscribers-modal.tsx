import React, { useState, useEffect } from 'react';
import { __ } from '@wordpress/i18n';
import apiFetch from '@wordpress/api-fetch';
import { useDispatch } from '@wordpress/data';

// Import shadcn UI components
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@radix-ui/react-avatar';
import { Loader2, Mail, Phone, User, Calendar, Tag, List, Trash2 } from 'lucide-react';

// Import types
import { Contact } from '@doublescale/client';
import { END_POINT } from '../constants';

interface SubscribersModalProps {
	isOpen: boolean;
	onClose: () => void;
	sequenceId: number;
	sequenceName: string;
}

const SubscribersModal: React.FC<SubscribersModalProps> = ({
	isOpen,
	onClose,
	sequenceId,
	sequenceName,
}) => {
	const [subscribers, setSubscribers] = useState<Contact[]>([]);
	const [loading, setLoading] = useState(false);
	const [removingId, setRemovingId] = useState<number | null>(null);
	const { createNotice } = useDispatch('doublescale/core');

	useEffect(() => {
		if (isOpen && sequenceId) {
			fetchSubscribers();
		}
	}, [isOpen, sequenceId]);

	const fetchSubscribers = async () => {
		setLoading(true);
		try {
			const response = await apiFetch({
				path: `${END_POINT}/${sequenceId}/subscribers`,
				method: 'GET',
			});

			setSubscribers(response as Contact[]);
		} catch (error: any) {
			createNotice({
				type: 'error',
				message:
					error.message ||
					__('Failed to fetch subscribers', 'doublescale'),
			});
		} finally {
			setLoading(false);
		}
	};

	const removeSubscriber = async (contactId: number) => {
		setRemovingId(contactId);
		try {
			await apiFetch({
				path: `${END_POINT}/${sequenceId}/subscribers/${contactId}`,
				method: 'DELETE',
			});

			setSubscribers((prev) =>
				prev.filter((s) => s.id !== contactId)
			);
			createNotice({
				type: 'success',
				message: __('Subscriber removed successfully', 'doublescale'),
			});
		} catch (error: any) {
			createNotice({
				type: 'error',
				message:
					error.message ||
					__('Failed to remove subscriber', 'doublescale'),
			});
		} finally {
			setRemovingId(null);
		}
	};

	const getInitials = (firstName: string, lastName: string) => {
		return `${firstName?.charAt(0) || ''}${lastName?.charAt(0) || ''}`.toUpperCase();
	};

	const formatDate = (dateString: string) => {
		return new Date(dateString).toLocaleDateString();
	};

	return (
		<Dialog open={isOpen} onOpenChange={onClose}>
			<DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
				<DialogHeader className="flex-shrink-0">
					<DialogTitle className="flex items-center gap-2">
						<User className="h-5 w-5" />
						{__('Subscribers for', 'doublescale')} "{sequenceName}"
						<Badge variant="secondary" className="ml-2">
							{subscribers.length} {__('subscribers', 'doublescale')}
						</Badge>
					</DialogTitle>
				</DialogHeader>

				<div className="flex-1 overflow-y-auto">
					{loading ? (
						<div className="flex items-center justify-center py-8">
							<Loader2 className="h-8 w-8 animate-spin" />
							<span className="ml-2">
								{__('Loading subscribers...', 'doublescale')}
							</span>
						</div>
					) : subscribers.length === 0 ? (
						<div className="text-center py-8 text-gray-500">
							<User className="h-12 w-12 mx-auto mb-4 opacity-50" />
							<p>
								{__(
									'No subscribers found for this sequence.',
									'doublescale'
								)}
							</p>
						</div>
					) : (
						<div className="space-y-4">
							{subscribers.map((subscriber) => (
								<div
									key={subscriber.id}
									className="border rounded-lg p-4 hover:bg-gray-50 transition-colors"
								>
									<div className="flex items-start gap-4">
										<Avatar className="h-12 w-12">
											<AvatarFallback className="bg-blue-100 text-blue-600">
												{getInitials(
													subscriber.first_name,
													subscriber.last_name
												)}
											</AvatarFallback>
										</Avatar>

										<div className="flex-1 min-w-0">
											<div className="flex items-center gap-2 mb-2">
												<h3 className="font-semibold text-gray-900">
													{subscriber.first_name}{' '}
													{subscriber.last_name}
												</h3>
												<Badge
													variant={
														subscriber.status ===
														'active'
															? 'default'
															: 'secondary'
													}
													className="text-xs"
												>
													{subscriber.status}
												</Badge>
											</div>

											<div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm text-gray-600">
												<div className="flex items-center gap-2">
													<Mail className="h-4 w-4" />
													<span className="truncate">
														{subscriber.email}
													</span>
												</div>

												{subscriber.phone && (
													<div className="flex items-center gap-2">
														<Phone className="h-4 w-4" />
														<span>
															{subscriber.phone}
														</span>
													</div>
												)}

												<div className="flex items-center gap-2">
													<Calendar className="h-4 w-4" />
													<span>
														{__(
															'Joined',
															'doublescale'
														)}{' '}
														{formatDate(
															subscriber.created_at
														)}
													</span>
												</div>
											</div>
										</div>

										<Button
											variant="ghost"
											size="sm"
											className="text-red-500 hover:text-red-700 hover:bg-red-50 flex-shrink-0"
											onClick={() =>
												removeSubscriber(
													subscriber.id
												)
											}
											disabled={
												removingId === subscriber.id
											}
										>
											{removingId === subscriber.id ? (
												<Loader2 className="h-4 w-4 animate-spin" />
											) : (
												<Trash2 className="h-4 w-4" />
											)}
										</Button>
									</div>
								</div>
							))}
						</div>
					)}
				</div>

				{/* Footer */}
				<div className="flex-shrink-0 flex justify-end pt-4 border-t border-gray-100">
					<Button
						variant="outline"
						onClick={onClose}
						className="px-6 py-2"
					>
						{__('Close', 'doublescale')}
					</Button>
				</div>
			</DialogContent>
		</Dialog>
	);
};

export default SubscribersModal;
