/*
 * External dependencies
 */
import { ChevronLeft as LeftOutlined, ChevronRight as RightOutlined } from 'lucide-react';

/*
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';

interface MonthSelectorProps {
	year: number;
	setYear: React.Dispatch<React.SetStateAction<number>>;
	selectedMonth: number;
	setSelectedMonth: (month: number) => void;
}

const MonthSelector: React.FC<MonthSelectorProps> = ({
	year,
	setYear,
	selectedMonth,
	setSelectedMonth,
}) => {
	const MONTHS = [
		__('January', 'doublescale'),
		__('February', 'doublescale'),
		__('March', 'doublescale'),
		__('April', 'doublescale'),
		__('May', 'doublescale'),
		__('June', 'doublescale'),
		__('July', 'doublescale'),
		__('August', 'doublescale'),
		__('September', 'doublescale'),
		__('October', 'doublescale'),
		__('November', 'doublescale'),
		__('December', 'doublescale'),
	];

	// Handlers to update the year
	const handlePrevYear = () => setYear((year) => year - 1);
	const handleNextYear = () => setYear((year) => year + 1);

	return (
		<div className="w-full p-4 rounded-md border">
			<div className="w-full flex items-center justify-between mb-4">
				<button
					onClick={handlePrevYear}
					className="border p-2 rounded hover:bg-gray-100"
					title={__('Previous Year', 'doublescale')}
					aria-label={__('Previous Year', 'doublescale')}
				>
					<LeftOutlined />
				</button>

				<div className="font-semibold text-xl text-[#09090B]">
					{year}
				</div>

				<button
					onClick={handleNextYear}
					className="border p-2 rounded hover:bg-gray-100"
					title={__('Next Year', 'doublescale')}
					aria-label={__('Next Year', 'doublescale')}
				>
					<RightOutlined />
				</button>
			</div>

			{/* Months row */}
			<div className="border-t pt-4">
				<div className="flex gap-2 justify-start sm:justify-center flex-wrap">
					{MONTHS.map((month, index) => {
						const monthNumber = index + 1;
						const isActive = monthNumber === selectedMonth;

						return (
							<button
								key={monthNumber}
								onClick={() => setSelectedMonth(monthNumber)}
								className={`px-3 py-1.5 rounded-md transition-colors text-sm font-semibold ${
									isActive
										? 'bg-primary text-white'
										: 'bg-transparent text-color-primary-text hover:bg-gray-100'
								}`}
							>
								{month}
							</button>
						);
					})}
				</div>
			</div>
		</div>
	);
};

export default MonthSelector;
