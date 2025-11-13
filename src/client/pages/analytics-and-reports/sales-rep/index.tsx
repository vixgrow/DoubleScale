import { useState, useEffect } from 'react';
import apiFetch from '@wordpress/api-fetch';
import { __ } from '@wordpress/i18n';

// Import the sales rep card component
import SalesRepCard, { SalesRepCardProps } from '../components/card-sales-rep';
import SalesRepModal from '../components/modal-sales-rep';
import { Skeleton } from '@/components/ui/skeleton';
import { PageHeader } from '@quillcrm/components';

const SalesRep = () => {
	const [loadingUsers, setLoadingUsers] = useState(false);
	const [salesRep, setSalesRep] = useState<SalesRepCardProps[]>([]);
	const [isModalOpen, setIsModalOpen] = useState(false);
	const [selectedOwnerId, setSelectedOwnerId] = useState<number | null>(null);

	const handleCardClick = (ownerId: number) => {
		setSelectedOwnerId(ownerId);
		setIsModalOpen(true);
	};

	const handleCloseModal = () => {
		setIsModalOpen(false);
		setSelectedOwnerId(null);
	};

	useEffect(() => {
		const fetchUsers = async () => {
			setLoadingUsers(true);
			try {
				const response = (await apiFetch({
					path: '/qc/v1/reports/all-sales-rep',
				})) as SalesRepCardProps[];

				setSalesRep(response);
			} catch (error) {
				console.error('Failed to fetch users:', error);
			} finally {
				setLoadingUsers(false);
			}
		};

		fetchUsers();
	}, []);

	if (loadingUsers) {
		return <Skeleton className="h-40 w-full" />;
	}

	return (
		<>
			<PageHeader
				title={__('Sales Representatives Analytics', 'quillcrm')}
				subtitle={__('Sales Representatives Analytics', 'quillcrm')}
				actions={[]}
			/>
			<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
				{Object.entries(salesRep).map(([key, rep]) => (
					<SalesRepCard
						key={rep.id}
						rep={rep}
						onClick={() => handleCardClick(rep.id)}
					/>
				))}
			</div>

			{/* Modal */}
			<SalesRepModal
				isOpen={isModalOpen}
				onClose={handleCloseModal}
				ownerId={selectedOwnerId}
			/>
		</>
	);
};

export default SalesRep;
