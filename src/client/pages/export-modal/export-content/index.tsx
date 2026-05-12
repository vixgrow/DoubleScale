/**
 * wordpress dependencies
 */
import { __ } from '@wordpress/i18n';
/**
 * internal dependencies
 */
import {
	Card,
	CardHeader,
	CardTitle,
	CardContent,
	CardDescription,
} from '@/components/ui/card';
import { useExportContext } from '../contexts';
import ExportProgress from '../export-progress';
import ExportFields from '../export-fields';
import ExportActions from '../export-actions';
import RulesBuilder from '@/components/rules-builder';
import { LoadingSpinner } from '@doublescale/components';

const ExportContent: React.FC = () => {
	const { loading, isFiltering, totalContact, rules, setRules, rulesGroups } =
		useExportContext();

	return (
		<Card className="my-5 px-4 shadow-none rounded-2xl">
			<CardHeader>
				<CardTitle className="text-2xl font-normal text-[#09090B]">
					{loading
						? __('Exporting Contacts File', 'doublescale')
						: __('Export Contacts', 'doublescale')}
				</CardTitle>
				<CardDescription className="text-[#979797] text-base">
					{loading
						? __(
								'Your file must include a column with either first name, last name and email addresses for each contact. (Maximum file size 12 MB )',
								'doublescale'
							)
						: __(
								'Select Columns that you want to be added on the Table.',
								'doublescale'
							)}
				</CardDescription>
			</CardHeader>
			<CardContent>
				{loading ? (
					<ExportProgress />
				) : (
					<>
						<Card className="shadow-none rounded-2xl border-2 border-dashed">
							<CardContent className="px-20 py-4">
								<div className="flex flex-col gap-[10px]">
									<div className="flex items-center justify-between">
										<div className="font-bold text-[#09090B] text-3xl">
											{__(
												'Select Exporting Filters',
												'doublescale'
											)}
										</div>
										<div className="doublescale-contacts-total flex gap-[10px] text-[#09090B] text-xl font-medium">
											{__(
												'Total Contacts based on filters',
												'doublescale'
											)}
											:{' '}
											{!isFiltering && (
												<div>{totalContact}</div>
											)}
											{isFiltering && (
												<LoadingSpinner size={24} />
											)}
										</div>
									</div>
									<RulesBuilder
										rules={rules}
										onChange={setRules}
										rulesGroups={rulesGroups}
									/>
									<div className="font-bold text-[#09090B] text-3xl">
										{__(
											'Select Exporting Fields',
											'doublescale'
										)}
									</div>
									<ExportFields />
									{!isFiltering && totalContact === 0 && (
										<div>
											{__(
												'No contacts found based on the filters',
												'doublescale'
											)}
										</div>
									)}
								</div>
							</CardContent>
						</Card>
						<ExportActions />
					</>
				)}
			</CardContent>
		</Card>
	);
};

export default ExportContent;
