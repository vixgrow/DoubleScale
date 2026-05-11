import CardHeader from '../card-header';
import ProVersion from '../pro-version';
import { Card, CardContent } from '@/components/ui/card';

const ProTab: React.FC<{
	title: string;
	description: string;
	icon: React.ReactNode;
}> = ({ title, description, icon }) => {
	return (
        <Card><CardContent>
                <CardHeader title={title} description={description} icon={icon} />
                <div className="py-8">
                    <ProVersion />
                </div>
            </CardContent></Card>
    );
};

export default ProTab;
