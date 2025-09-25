/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { useState, useEffect } from '@wordpress/element';
import apiFetch from '@wordpress/api-fetch';
import { addQueryArgs } from '@wordpress/url';

/**
 * Internal dependencies
 */
import { Input } from '@/components/ui/input';
import type {
	Contact,
	ContactsResponse,
	Filter as FilterType,
} from '@quillcrm/client';
import { SearchIcon } from 'lucide-react';

interface ContactListProps {
	filters?: FilterType[];
	total?: number;
	loading?: boolean;
	searchPlaceholder?: string;
	maxHeight?: number;
}

// Helper function to generate contact initials
const getContactInitials = (firstName: string, lastName: string): string => {
	const first = firstName?.charAt(0)?.toUpperCase() || '';
	const last = lastName?.charAt(0)?.toUpperCase() || '';
	return first + last || '?';
};

// Helper function to generate background color based on name
const getAvatarColor = (name: string): string => {
	const colors = [
		'bg-blue-500',
		'bg-green-500',
		'bg-purple-500',
		'bg-pink-500',
		'bg-indigo-500',
		'bg-red-500',
		'bg-yellow-500',
		'bg-teal-500',
	];

	const hash = name.split('').reduce((acc, char) => {
		return acc + char.charCodeAt(0);
	}, 0);

	return colors[hash % colors.length];
};

const ContactList: React.FC<ContactListProps> = ({
	filters = [],
	total = 0,
	loading = false,
	searchPlaceholder = __('Search Recipients', 'quillcrm'),
	maxHeight = 0,
}) => {
	const [contacts, setContacts] = useState<Contact[]>([]);
	const [searchTerm, setSearchTerm] = useState('');
	const [isLoading, setIsLoading] = useState(false);

	const fetchContacts = async (search = '') => {
		setIsLoading(true);
		try {
			const response = (await apiFetch({
				path: addQueryArgs('/qc/v1/contacts', {
					per_page: 50,
					page: 1,
					filters: filters,
					subscribed: true,
					keywords: search,
				}),
				method: 'GET',
				parse: true,
			})) as ContactsResponse;

			if (response.data) {
				setContacts(response.data);
			}
		} catch (error) {
			console.error('Failed to fetch contacts:', error);
		} finally {
			setIsLoading(false);
		}
	};

	useEffect(() => {
		fetchContacts(searchTerm);
	}, [filters, searchTerm]);

	// Debounce search
	useEffect(() => {
		const timeoutId = setTimeout(() => {
			fetchContacts(searchTerm);
		}, 300);

		return () => clearTimeout(timeoutId);
	}, [searchTerm]);

	return (
		<div
			className="w-[45%] bg-white rounded-lg border border-gray-200 p-6 flex flex-col"
			style={{
				height: maxHeight > 0 ? `${maxHeight}px` : 'auto',
				maxHeight: maxHeight > 0 ? `${maxHeight}px` : 'none',
			}}
		>
			{/* Header */}
			<div className="flex items-center justify-between gap-4 flex-shrink-0">
				<div className="w-1/2">
					<div className="flex items-center gap-2 mb-1">
						<h3 className="text-lg font-semibold text-gray-900">
							{__('Recipients', 'quillcrm')}
						</h3>
						<span className="text-lg font-semibold text-blue-600 px-5 py-1 bg-blue-50 rounded-full">
							{total.toLocaleString()}
						</span>
					</div>
					<p className="text-sm text-gray-500">
						{__(
							'Recipients Total Contacts based on filters',
							'quillcrm'
						)}
					</p>
				</div>

				{/* Search */}
				<div className="w-1/2 flex items-center gap-2 bg-gray-100 p-3 rounded-lg">
					<SearchIcon className="text-gray-400" />
					<Input
						type="text"
						placeholder={searchPlaceholder}
						value={searchTerm}
						onChange={(e) => setSearchTerm(e.target.value)}
						style={{
							border: 'none',
							outline: 'none',
							boxShadow: 'none',
							backgroundColor: 'transparent',
						}}
					/>
				</div>
			</div>

			{/* Contacts List - make it fill remaining space but scroll content */}
			<div className="space-y-3 overflow-y-auto flex-1 min-h-0 mt-3">
				{isLoading || loading ? (
					<div className="flex items-center justify-center py-8">
						<div className="text-gray-500">
							{__('Loading contacts...', 'quillcrm')}
						</div>
					</div>
				) : contacts.length === 0 ? (
					<div className="flex items-center justify-center py-8">
						<div className="text-gray-500">
							{__('No contacts found', 'quillcrm')}
						</div>
					</div>
				) : (
					contacts.map((contact) => {
						const fullName =
							`${contact.first_name} ${contact.last_name}`.trim();
						const initials = getContactInitials(
							contact.first_name,
							contact.last_name
						);
						const avatarColor = getAvatarColor(
							fullName || contact.email
						);

						return (
							<div
								key={contact.id}
								className="flex items-center gap-3 p-2 hover:bg-gray-50 rounded-lg cursor-pointer"
							>
								{/* Avatar */}
								<div
									className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-medium text-sm ${avatarColor}`}
								>
									{initials}
								</div>

								{/* Contact Info */}
								<div className="flex-1 min-w-0">
									<div className="font-medium text-gray-900 truncate">
										{fullName || __('No Name', 'quillcrm')}
									</div>
									<div className="text-sm text-gray-500 truncate">
										{__('Email:', 'quillcrm')}{' '}
										{contact.email}
									</div>
								</div>
							</div>
						);
					})
				)}
			</div>
		</div>
	);
};

export default ContactList;
