import "./style.scss";

const Edit = ({ attributes, setAttributes }) => {
    const { src, alt, width, height } = attributes;

    const handleWidthChange = (event) => {
        setAttributes({ width: parseInt(event.target.value, 10) });
    };

    const handleHeightChange = (event) => {
        setAttributes({ height: parseInt(event.target.value, 10) });
    };

    return (
        <div className="qcrm-image-block">
            <img
                src={src}
                alt={alt}
                style={{
                    width: `${width}px`,
                    height: `${height}px`,
                }}
            />
            <div className="qcrm-image-controls">
                <label>
                    Width:
                    <input
                        type="number"
                        value={width}
                        onChange={handleWidthChange}
                        className="qcrm-image-control-input"
                    />
                </label>
                <label>
                    Height:
                    <input
                        type="number"
                        value={height}
                        onChange={handleHeightChange}
                        className="qcrm-image-control-input"
                    />
                </label>
            </div>
        </div>
    );
};

export default Edit;
