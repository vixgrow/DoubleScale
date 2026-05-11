import ProVersion from '../pro-version';
import { Card, CardContent } from '@/components/ui/card';

interface ProGlobalIntegrationsProps {
	list: Record<string, string[]>;
}

const ProGlobalIntegrations: React.FC<ProGlobalIntegrationsProps> = ({
	list,
}) => {
	return (
        <div className="flex flex-col gap-4">
            <Card><CardContent>
                    <ProVersion />
                </CardContent></Card>
            <Card><CardContent>
                    {Object.entries(list).map(([key, values]) => (
                        <div key={key} style={{ marginBottom: 16 }}>
                            <h3 className="font-bold text-xl">{key}</h3>
                            <ul className="list-disc list-inside">
                                {values.map((item, idx) => (
                                    <li className="text-base" key={idx}>
                                        {item}
                                    </li>
                                ))}
                            </ul>
                        </div>
                    ))}
                </CardContent></Card>
        </div>
    );
};

export default ProGlobalIntegrations;
