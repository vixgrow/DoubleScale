/**
 * wordpress dependencies
 */

/**
 * external dependencies
 */

/**
 * internal dependencies
 */
import { MenuBlockProps } from '..';

export interface MenuBlockRendererProps {
	props: MenuBlockProps;
}

export const MenuBlockRenderer: React.FC<MenuBlockRendererProps> = ({
	props,
}) => {
	const getMenuItemStyle = (item: any) => {
		const textDecoration = (() => {
			if (item.underline && item.strikethrough)
				return 'underline line-through';
			if (item.underline) return 'underline';
			if (item.strikethrough) return 'line-through';
			return 'none';
		})();

		return {
			fontSize: `${item.fontSize}px`,
			color: item.color,
			fontFamily: item.fontFamily,
			fontWeight: item.bold ? 'bold' : 'normal',
			fontStyle: item.italic ? 'italic' : 'normal',
			textDecoration,
			backgroundColor: item.backgroundColor,
			borderRadius: `${item.borderRadius}px`,
			letterSpacing: item.letterSpacing,
			textDecorationColor: item.color,
		};
	};

	const getAlignmentStyle = () => {
		switch (props.align) {
			case 'left':
				return 'justify-start';
			case 'right':
				return 'justify-end';
			case 'center':
			default:
				return 'justify-center';
		}
	};

	return (
		<div
			style={{
				display: 'flex',
				gap: '16px', // gap-4 equivalent
				alignItems: 'center',
				flexWrap: 'wrap',
				padding: `${(props.padding?.top || 0) * 2}px ${(props.padding?.right || 0) * 4}px ${(props.padding?.bottom || 0) * 2}px ${(props.padding?.left || 0) * 4}px`,
				width: '100%',
				overflow: 'hidden',
			}}
			className={getAlignmentStyle()}
		>
			{props.menuItems.map((item, index) => (
				<a
					key={item.id}
					href={item.link}
					style={{
						...getMenuItemStyle(item),
						whiteSpace: 'nowrap',
						overflow: 'hidden',
						textOverflow: 'ellipsis',
						maxWidth: '150px',
					}}
					className="text-decoration-none hover:opacity-80 transition-opacity"
				>
					{item.name ||
						`MenuItem ${(index + 1).toString().padStart(2, '0')}`}
				</a>
			))}
		</div>
	);
};
