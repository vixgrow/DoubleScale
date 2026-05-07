import { IconProps } from '@doublescale/config';

interface MoreHorizantail{
	color:string
}

const MoreHorizantail: React.FC<IconProps> = ({ width = 20, height =20 ,color='#374151' }) => {
	return (
		
		<svg xmlns="http://www.w3.org/2000/svg" width={width} height={height} viewBox="0 0 20 5" fill="none">
  <path d="M2.25 4.5C1.00736 4.5 0 3.49264 0 2.25C0 1.00736 1.00736 0 2.25 0C3.49264 0 4.5 1.00736 4.5 2.25C4.5 3.49264 3.49264 4.5 2.25 4.5ZM9.75 4.5C8.50736 4.5 7.5 3.49264 7.5 2.25C7.5 1.00736 8.50736 0 9.75 0C10.9926 0 12 1.00736 12 2.25C12 3.49264 10.9926 4.5 9.75 4.5ZM17.25 4.5C16.0074 4.5 15 3.49264 15 2.25C15 1.00736 16.0074 0 17.25 0C18.4926 0 19.5 1.00736 19.5 2.25C19.5 3.49264 18.4926 4.5 17.25 4.5Z" fill={color}/>
</svg>
	);
};

export default MoreHorizantail;

