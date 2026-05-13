import { IconProps } from '@doublescale/config';

const PipelineIcon: React.FC<IconProps> = ({ width = 32, height = 32 ,color = '#0D9DFC'}) => {
	return (
<svg xmlns="http://www.w3.org/2000/svg" width={width} height={height} viewBox="0 0 32 32" fill="none">
  <g clip-path="url(#clip0_193_16796)">
    <path opacity="0.4" d="M21.8847 14.666H28.7813C29.0902 14.666 29.333 14.9528 29.333 15.3179V22.8142C29.333 26.3993 26.8502 29.3327 23.8158 29.3327H21.8847C21.5758 29.3327 21.333 29.0459 21.333 28.6808V15.3179C21.333 14.9528 21.5758 14.666 21.8847 14.666Z" fill={color}/>
    <path d="M29.3332 11.666V9.33268C29.3332 5.66602 26.3332 2.66602 22.6665 2.66602H9.33317C5.6665 2.66602 2.6665 5.66602 2.6665 9.33268V11.666C2.6665 12.0393 2.95984 12.3327 3.33317 12.3327H28.6665C29.0398 12.3327 29.3332 12.0393 29.3332 11.666Z" fill={color}/>
    <path opacity="0.4" d="M10.1148 14.666H3.21823C2.90926 14.666 2.6665 14.9528 2.6665 15.3179V22.8142C2.6665 26.3993 5.14926 29.3327 8.18375 29.3327H10.1148C10.4237 29.3327 10.6665 29.0459 10.6665 28.6808V15.3179C10.6665 14.9528 10.4237 14.666 10.1148 14.666Z" fill={color}/>
    <rect opacity="0.4" x="12" y="14.666" width="8" height="14.6667" rx="0.533333" fill={color}/>
  </g>
  <defs>
    <clipPath id="clip0_193_16796">
      <rect width="32" height="32" fill="white"/>
    </clipPath>
  </defs>
</svg>
	);
};

export default PipelineIcon;
