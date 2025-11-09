

// export default PlusIcon;
import { IconProps } from '@quillcrm/config';

interface PlusIconProps extends IconProps {
  color?: string; // أضفنا خاصية اللون
}
// color = '#1E3A8A', 

const PlusIcon: React.FC<PlusIconProps> = ({
  width = 24,
  height = 24,
  color = '#374151', 
}) => {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width={width} height={height} viewBox="0 0 24 24" fill="none">
    <mask id="mask0_32711_131701"  maskUnits="userSpaceOnUse" x="0" y="0" width="24" height="24">
    <path d="M24 0H0V24H24V0Z" fill="white"/>
    </mask>
    <g mask="url(#mask0_32711_131701)">
    <path d="M18.7368 10.7368H13.2632V5.26316C13.2632 4.57263 12.6905 4 12 4C11.3095 4 10.7368 4.57263 10.7368 5.26316V10.7368H5.26316C4.57263 10.7368 4 11.3095 4 12C4 12.6905 4.57263 13.2632 5.26316 13.2632H10.7368V18.7368C10.7368 19.4274 11.3095 20 12 20C12.6905 20 13.2632 19.4274 13.2632 18.7368V13.2632H18.7368C19.4274 13.2632 20 12.6905 20 12C20 11.3095 19.4274 10.7368 18.7368 10.7368Z" fill={color}/>
    </g>
    </svg>
  );
};

export default PlusIcon;

