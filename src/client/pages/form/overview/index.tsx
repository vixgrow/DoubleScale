/**
 * Internal dependencies
 */
import './style.scss';
import OverviewCard from './overview-card';
import FieldsCard from './fields-card';

const Overview: React.FC = () => {
	return (
		<>
			<OverviewCard />
			<FieldsCard />
		</>
	);
};

export default Overview;
