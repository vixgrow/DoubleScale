import { __ } from '@wordpress/i18n';
import WandIcon from '../icons/wand';
import { BuilderArrowIcon, WandOutlinedIcon } from '../icons';
import { Button } from '../ui/button';
//@ts-ignore
import device from '../../../assets/images/email-device.png';

const FeedBuilder: React.FC<{
	setVisibile: (visible: boolean) => void;
}> = ({ setVisibile }) => {
	return (
		<div className="flex flex-col items-center justify-center border border-gray-200 rounded-2xl bg-[#F8F8F8] w-1/3">
			<img src={device} alt="device" className="w-[300px]" />
			{/* <div className="bg-sidebar-accent w-fit rounded-lg p-2 mb-4">
				<WandIcon />
			</div>
			<div className="text-black text-center">
				<p className="text-lg">
					{__(
						"You don't have any feeds configured. Let's go",
						'quillcrm'
					)}
				</p>
				<p className="text-lg">
					{__('Create one From here!', 'quillcrm')}
				</p>
			</div>
			<div className="py-8">
				<BuilderArrowIcon />
			</div>
			<Button variant="gradient" onClick={() => setVisibile(true)}>
				<WandOutlinedIcon />
				{__('Create with Email Builder', 'quillcrm')}
			</Button> */}
		</div>
	);
};

export default FeedBuilder;
