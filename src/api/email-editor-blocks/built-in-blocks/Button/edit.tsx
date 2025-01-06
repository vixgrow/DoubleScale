// Depending on attributes defined in index.tsx, we should run this component`
const Edit = ({ attributes }) => {
    const {
        label,
        url,
        color,
        backgroundColor,
        borderRadius,
        padding,
        fontSize,
        borderWidth,
        borderColor
    } = attributes;
    return (
        <div className="qcrm-button-block">
            <a
                href={url}
                style={{
                    display: 'inline-block',
                    color,
                    backgroundColor,
                    borderRadius,
                    padding,
                    fontSize,
                    borderWidth,
                    borderColor
                }}
            >
                {label}
            </a>
        </div>
    )
}

export default Edit;