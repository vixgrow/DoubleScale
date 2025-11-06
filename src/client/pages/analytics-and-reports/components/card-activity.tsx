import { Phone, Mail, MessageSquare, Calendar } from 'lucide-react';

export interface ActivityItem {
	id: number;
	type: string;
	title: string;
	time: string;
}

const ActivityCard: React.FC<{ activity: ActivityItem }> = ({ activity }) => {
	const iconConfig = {
		call_logged: { icon: Phone, bg: 'bg-red-50', color: 'text-red-600' },
		email_sent: { icon: Mail, bg: 'bg-green-50', color: 'text-green-600' },
		note_added: {
			icon: MessageSquare,
			bg: 'bg-blue-50',
			color: 'text-blue-600',
		},
		meeting_scheduled: {
			icon: Calendar,
			bg: 'bg-yellow-50',
			color: 'text-yellow-600',
		},
	};

	const config = iconConfig[activity.type];
	const Icon = config.icon;

	return (
		<div className="flex items-center p-3 hover:bg-gray-50 transition-colors rounded-lg">
			<div
				className={`w-9 h-9 rounded-lg flex items-center justify-center mr-3 ${config.bg}`}
			>
				<Icon className={`w-4 h-4 ${config.color}`} />
			</div>
			<div className="flex-1 min-w-0">
				<div className="text-sm font-medium text-gray-900 truncate">
					{activity.title}
				</div>
				<div className="text-xs text-gray-500">{activity.time}</div>
			</div>
		</div>
	);
};

export default ActivityCard;
