import { IconProps } from '@doublescale/config';

const MediumIcon: React.FC<IconProps> = ({ width = 24, height = 24, shape = 'circle', color }) => {
	const getBorderRadius = () => {
		switch (shape) {
			case 'circle':
				return 24;
			case 'rounded':
				return 8;
			case 'square':
				return 0;
			default:
				return 24;
		}
	};
	return (
		<svg
			width={width}
			height={height}
			viewBox="0 0 48 48"
			fill="none"
			xmlns="http://www.w3.org/2000/svg"
		>
			<rect
				x="0.5"
				y="0.5"
				width="47"
				height="47"
				rx={getBorderRadius()}
				ry={getBorderRadius()}
				fill={color || "black"}
			/>
			<path
				d="M12.5574 17.692C12.5758 17.5166 12.5511 17.3396 12.4855 17.1751C12.4198 17.0107 12.3149 16.8635 12.1793 16.7455L9.37786 13.4865V13H18.0756L24.7981 27.2381L30.7088 13H39V13.4868L36.605 15.7043C36.5037 15.7788 36.4254 15.8787 36.3785 15.9931C36.3316 16.1075 36.3179 16.232 36.3389 16.3534V32.6466C36.3179 32.768 36.3316 32.8925 36.3785 33.0069C36.4254 33.1213 36.5037 33.2212 36.605 33.2957L38.9439 35.5132V36H27.1793V35.5132L29.6022 33.2415C29.8404 33.0115 29.8404 32.9441 29.8404 32.5927V19.4227L23.1037 35.9458H22.1931L14.3501 19.4227V30.4968C14.3178 30.7266 14.3402 30.9604 14.4154 31.1807C14.4906 31.4009 14.6168 31.6016 14.7843 31.7678L17.9354 35.4591V35.9458H9V35.4593L12.1511 31.7678C12.3173 31.6015 12.4407 31.3999 12.5112 31.1791C12.5818 30.9583 12.5976 30.7246 12.5574 30.4968V17.692Z"
				fill="white"
			/>
		</svg>
	);
};

export default MediumIcon;
