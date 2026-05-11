/**
 * WordPress dependencies
 */
import { __, sprintf } from '@wordpress/i18n';

/**
 * External dependencies
 */
import { AlertTriangle, ArrowRight } from 'lucide-react';

/**
 * Internal dependencies
 */
import { Card, CardContent } from '@doublescale/components/ui/card';
import { Button } from '@doublescale/components/ui/button';
import type { Addon } from '@doublescale/config';
import { useNavigate, getToLink } from '@doublescale/navigation';

interface AddonCardProps {
	addon: Addon;
	imageUrl: string;
}

export const AddonCard: React.FC<AddonCardProps> = ({ addon, imageUrl }) => {
	const navigate = useNavigate();

	const message = addon.is_installed
		? sprintf(__('Please activate %s plugin', 'doublescale'), addon.label)
		: sprintf(__('%s addon required', 'doublescale'), addon.label);

	return (
		<Card className="shadow-none relative overflow-hidden h-full">
			<CardContent className="p-4 h-full flex flex-col">
				<div className="flex items-center justify-between mb-3">
					<div className="flex items-center gap-4">
						{imageUrl && (
							<div className="w-12 h-12 flex items-center justify-center shrink-0">
								<img
									src={imageUrl}
									alt={addon.label}
									className="max-w-full max-h-full object-contain"
								/>
							</div>
						)}
						<div className="font-semibold text-xl">
							{addon.label}
						</div>
					</div>
				</div>

				<div className="text-base text-gray-500 border-b pb-3 flex-1">
					{addon.description}
				</div>

				<div className="mt-4">
					<div className="flex items-center justify-between">
						<div className="flex items-center gap-2 text-amber-600">
							<AlertTriangle className="w-4 h-4" />
							<span className="text-sm font-medium">
								{message}
							</span>
						</div>
						<Button
							onClick={() => navigate(getToLink('extensions') + `&search=${encodeURIComponent(addon.slug)}`)}
							variant="secondary"
							size="sm"
							className="rounded-lg"
						>
							<ArrowRight className="w-4 h-4" />
							{__('Go to Extensions', 'doublescale')}
						</Button>
					</div>
				</div>
			</CardContent>
		</Card>
	);
};
