const Edit = ({ attributes, setAttributes }) => {
    const {
        color,
        height,
        style,
        width,
        alignment,
        containerPadding
    } = attributes;
    return (
        <div className="divider" style={{ textAlign: alignment, padding: containerPadding }}>
            <div style={{
                borderTop: `${height}px ${style} ${color}`,
                width: `${width}%`
            }}>
            </div>
        </div >
    )
}

export default Edit;