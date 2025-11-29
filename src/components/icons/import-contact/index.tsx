import { IconProps } from '@quillcrm/config';

const ImportContact: React.FC<IconProps> = ({
	width = 60,
	height = 60,
}) => {
	return (
		<svg xmlns="http://www.w3.org/2000/svg" width={width} height={height} viewBox="0 0 60 60" fill="none">
         <path opacity="0.4" d="M42 22.5H18C10 22.5 5 27.5 5 35.5V41.975C5 50 10 55 18 55H41.975C49.975 55 54.975 50 54.975 42V35.5C55 27.5 50 22.5 42 22.5Z" fill="currentColor"/>
         <path d="M39.6996 31.075L31.3246 39.45C30.5996 40.175 29.3996 40.175 28.6746 39.45L20.2996 31.075C19.5746 30.35 19.5746 29.15 20.2996 28.425C21.0246 27.7 22.2246 27.7 22.9496 28.425L28.1246 33.6V6.875C28.1246 5.85 28.9746 5 29.9996 5C31.0246 5 31.8746 5.85 31.8746 6.875V33.6L37.0496 28.425C37.4246 28.05 37.8996 27.875 38.3746 27.875C38.8496 27.875 39.3246 28.05 39.6996 28.425C40.4496 29.15 40.4496 30.325 39.6996 31.075Z" fill="currentColor"/>
        </svg>
	);
};

export default ImportContact;
