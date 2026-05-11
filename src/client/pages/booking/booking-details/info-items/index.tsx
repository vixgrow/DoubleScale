interface InfoItemProps {
	icon: React.ReactNode;
	title: string;
	content: string | number | React.ReactNode | undefined;
	className?: string;
	/**
	 * Disable the default `capitalize` transform — needed for values that
	 * must preserve their casing (emails, timezone IDs, URLs, codes).
	 */
	preserveCase?: boolean;
}

const InfoItem: React.FC<InfoItemProps> = ({
	icon,
	title,
	content,
	className,
	preserveCase = false,
}) => {
	return (
		<div
			className={`flex gap-3 text-color-primary-text items-start ${className || ''}`}
		>
			<span className="shrink-0">{icon}</span>
			<div className="min-w-0">
				<p className="text-[#71717A] text-sm font-normal">{title}</p>
				<p
					className={`text-[#09090B] text-base leading-5 font-medium flex break-words ${preserveCase ? '' : 'capitalize'}`}
				>
					{content}
				</p>
			</div>
		</div>
	);
};

export default InfoItem;
