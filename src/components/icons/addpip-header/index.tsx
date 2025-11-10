import { IconProps } from '@quillcrm/config';

const AddPipIcon: React.FC<IconProps> = ({ width = 24, height = 24 }) => {
	return (
		<svg xmlns="http://www.w3.org/2000/svg" width={width} height={height} viewBox="0 0 24 24" fill="none">
  <mask id="mask0_31478_27139"  maskUnits="userSpaceOnUse" x="0" y="0" width="24" height="24">
    <path d="M24 0H0V24H24V0Z" fill="white"/>
  </mask>
  <g mask="url(#mask0_31478_27139)">
    <path opacity="0.4" d="M12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22Z" fill="#2E2C2F"/>
    <path d="M16 11.25H12.75V8C12.75 7.59 12.41 7.25 12 7.25C11.59 7.25 11.25 7.59 11.25 8V11.25H8C7.59 11.25 7.25 11.59 7.25 12C7.25 12.41 7.59 12.75 8 12.75H11.25V16C11.25 16.41 11.59 16.75 12 16.75C12.41 16.75 12.75 16.41 12.75 16V12.75H16C16.41 12.75 16.75 12.41 16.75 12C16.75 11.59 16.41 11.25 16 11.25Z" fill="#2E2C2F"/>
  </g>
</svg>
	);
};

export default AddPipIcon;
