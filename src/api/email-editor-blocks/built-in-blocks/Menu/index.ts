

registerBlockType('menu', {
    title: 'Menu',
    icon: <MenuIcon />,
    attributes: {
        items: {
            type: 'array',
            default: [],
        },
    }
});