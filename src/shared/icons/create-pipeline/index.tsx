import { IconProps } from '@doublescale/config';

const CreatePipelineIcon: React.FC<IconProps> = ({
	width = 24,
	height = 24,
}) => {
	return (
		<svg
			xmlns="http://www.w3.org/2000/svg"
			width={width}
			height={height}
			viewBox="0 0 24 24"
			fill="none"
		>
			<defs>
				<linearGradient
					id="layoutGradient"
					x1="0%"
					y1="0%"
					x2="100%"
					y2="0%"
				>
					<stop offset="0%" stopColor="#3A3A99" />
					<stop offset="100%" stopColor="#1B1145" />
				</linearGradient>
			</defs>

			<path
				opacity="0.4"
				d="M15.9724 11.1H20.6276C20.8361 11.1 21 11.2936 21 11.54V16.6C21 19.02 19.3241 21 17.2759 21H15.9724C15.7639 21 15.6 20.8064 15.6 20.56V11.54C15.6 11.2936 15.7639 11.1 15.9724 11.1Z"
				fill="url(#layoutGradient)"
			/>
			<path
				d="M21 9.075V7.5C21 5.025 18.975 3 16.5 3H7.5C5.025 3 3 5.025 3 7.5V9.075C3 9.327 3.198 9.525 3.45 9.525H20.55C20.802 9.525 21 9.327 21 9.075Z"
				fill="url(#layoutGradient)"
			/>
			<path
				opacity="0.4"
				d="M8.02759 11.1H3.37241C3.16386 11.1 3 11.2936 3 11.54V16.6C3 19.02 4.67586 21 6.72414 21H8.02759C8.23614 21 8.4 20.8064 8.4 20.56V11.54C8.4 11.2936 8.23614 11.1 8.02759 11.1Z"
				fill="url(#layoutGradient)"
			/>
			<rect
				opacity="0.4"
				x="9.2998"
				y="11.1"
				width="5.4"
				height="9.9"
				rx="0.36"
				fill="url(#layoutGradient)"
			/>
		</svg>
	);
};

export default CreatePipelineIcon;
