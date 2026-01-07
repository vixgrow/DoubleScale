/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import apiFetch from '@wordpress/api-fetch';

/**
 * External dependencies
 */
import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Trophy } from 'lucide-react';

/**
 * Internal dependencies
 */
import { useContactContext } from '../../state/context';
import { LeadScoreData } from '@quillcrm/client';

const LeadScoreCard: React.FC = () => {
	const { contact } = useContactContext();
	const [leadScore, setLeadScore] = useState<LeadScoreData | null>(null);
	const [loading, setLoading] = useState(true);

	useEffect(() => {
		if (!contact) {
			return;
		}

		const fetchLeadScore = async () => {
			setLoading(true);
			try {
				const response = (await apiFetch({
					path: `/qc/v1/contacts/${contact.id}/lead-score`,
					method: 'GET',
				})) as LeadScoreData;

				setLeadScore(response);
			} catch (error: any) {
				console.error('Failed to fetch lead score:', error);
				// Set default values on error
				setLeadScore({ points: 0, level: null });
			} finally {
				setLoading(false);
			}
		};

		fetchLeadScore();
	}, [contact]);

	if (!contact) {
		return null;
	}

	if (loading) {
		return (
			<Card className="bg-white shadow-sm">
				<CardHeader className="pb-3">
					<CardTitle className="text-base font-semibold flex items-center gap-2">
						<Trophy className="w-5 h-5 text-[#5570F1]" />
						{__('Lead Score', 'quillcrm')}
					</CardTitle>
				</CardHeader>
				<CardContent>
					<div className="flex items-center justify-center py-4">
						<div className="animate-pulse flex space-x-4">
							<div className="flex-1 space-y-2">
								<div className="h-4 bg-gray-200 rounded w-24"></div>
								<div className="h-3 bg-gray-200 rounded w-32"></div>
							</div>
						</div>
					</div>
				</CardContent>
			</Card>
		);
	}

	if (!leadScore) {
		return null;
	}

	return (
		<Card className="bg-white shadow-sm">
			<CardContent className="py-4">
				{leadScore.level ? (
					<div className="flex items-center gap-2">
						<span
							className="dashicons dashicons-chart-bar text-[#5570F1] flex-shrink-0"
							style={{ fontSize: '20px' }}
						></span>
						<div className="text-sm text-gray-700">
							<span className="font-semibold">
								{leadScore.level.name}
							</span>{' '}
							{__('lead with', 'quillcrm')}{' '}
							<span className="font-semibold">
								{leadScore.points}
							</span>{' '}
							{__('points!', 'quillcrm')}
						</div>
					</div>
				) : (
					<div className="flex items-center gap-2">
						<span
							className="dashicons dashicons-chart-bar text-gray-400 flex-shrink-0"
							style={{ fontSize: '20px' }}
						></span>
						<div className="text-sm text-gray-500">
							{leadScore.points > 0 ? (
								<>
									{__('Lead with', 'quillcrm')}{' '}
									<span className="font-semibold">
										{leadScore.points}
									</span>{' '}
									{__('points!', 'quillcrm')}
								</>
							) : (
								__('No lead score yet', 'quillcrm')
							)}
						</div>
					</div>
				)}
			</CardContent>
		</Card>
	);
};

export default LeadScoreCard;
