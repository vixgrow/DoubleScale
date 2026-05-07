import { IconProps } from '@doublescale/config';

const LocationIcon: React.FC<IconProps> = ({ width = 24, height = 24 }) => {
    return (
        <svg xmlns="http://www.w3.org/2000/svg" width={width} height={height} viewBox="0 0 24 24" fill="none">
            <path opacity="0.4" d="M3.24286 7.5025C5.20286 -1.1675 18.0329 -1.1675 20.0029 7.5025C21.9729 16.1725 11.6229 22.4325 11.6229 22.4325C11.6229 22.4325 1.30286 16.0525 3.24286 7.5025Z" fill="#CB5301" />
            <path d="M11.6239 12.4324C13.3471 12.4324 14.7439 11.0355 14.7439 9.31238C14.7439 7.58925 13.3471 6.19238 11.6239 6.19238C9.90078 6.19238 8.50391 7.58925 8.50391 9.31238C8.50391 11.0355 9.90078 12.4324 11.6239 12.4324Z" fill="#CB5301" />
        </svg>
    );
};

export default LocationIcon;
