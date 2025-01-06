import { registerBlockType } from "../..";

const BannerIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <rect x="2" y="8" width="20" height="8" rx="2" />
        <path d="M2 8l10-4 10 4" />
    </svg>
);

registerBlockType('banner', {
    title: 'Banner',
    icon: <BannerIcon />,
    attributes: {
        imageUrl: {
            type: 'string',
        },
        link: {
            type: 'string',
        },
    }
});
