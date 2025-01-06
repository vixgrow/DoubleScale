import { registerBlockType } from "../../registration";
import Icon from "./icon";



registerBlockType('image', {
    title: 'Image',
    icon: <ImageIcon />,
    attributes: {
        imageUrl: {
            type: 'string',
        },
    }
});