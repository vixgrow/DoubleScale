import { IconProps } from '@doublescale/config';

const CheckTrue: React.FC<IconProps> = ({ width = 24, height = 24 }) => {
	return (
		<svg xmlns="http://www.w3.org/2000/svg" width={width} height={height} viewBox="0 0 24 24" fill="none">
            <path d="M12 0C5.37 0 0 5.37 0 12C0 14.25 0.62997 16.38 1.73997 18.18C3.80997 21.66 7.62 24 12 24C16.38 24 20.19 21.66 22.26 18.18C23.37 16.38 24 14.25 24 12C24 5.37 18.63 0 12 0ZM17.91 11.01L11.52 16.92C11.1 17.31 10.53 17.52 9.98997 17.52C9.41997 17.52 8.84997 17.31 8.39997 16.86L5.43 13.89C4.56 13.02 4.56 11.58 5.43 10.71C6.3 9.84 7.74 9.84 8.61 10.71L10.05 12.15L14.85 7.71C15.75 6.87 17.19 6.93 18.03 7.83C18.87 8.73 18.81 10.17 17.91 11.01Z" fill="#1E3A8A"/>
        </svg>
	);
};

export default CheckTrue;
