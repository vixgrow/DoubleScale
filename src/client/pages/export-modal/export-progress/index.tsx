/**
 * wordpress dependencies
 */
import { __ } from '@wordpress/i18n';
/**
 * internal dependencies
 */
import { Progress } from '@/components/ui/progress';
import { LoadingSpinner } from '@doublescale/components';
import { Card, CardContent } from '@/components/ui/card';
import { useExportContext } from '../contexts';
//@ts-ignore
import csvIcon from '@doublescale/assets/images/csv/icon.png';

const ExportProgress: React.FC = () => {
	const { total, offset } = useExportContext();

	return (
		<Card className="shadow-none rounded-2xl border-2 border-dashed">
			<CardContent className="lg:px-20 lg:py-7 p-4">
				<div className="flex flex-col gap-[10px] items-center justify-center">
					<img src={csvIcon} alt="Default" className="w-16 h-16" />
					<div className="lg:text-2xl text-xl font-normal text-[#09090B]">
						{__('Exporting Contacts...', 'doublescale')}
					</div>
					<div className="flex justify-center gap-2 items-center lg:text-lg text-base text-[#71717A]">
						<div className="flex justify-center">
							<LoadingSpinner size={24} />
						</div>
						<span>{__('In Progress', 'doublescale')}</span>
					</div>
					<div className="text-center text-sm text-[#71717A]">
						{__(
							'you will be redirecting to contacts list after importing data .',
							'doublescale'
						)}
					</div>
					<Progress
						value={
							total > 0 ? Math.round((offset / total) * 100) : 0
						}
						className="h-2 w-full mt-2"
					/>
				</div>
			</CardContent>
		</Card>
	);
};

export default ExportProgress;
