/**
 * WordPress dependencies
 */
import { memo } from '@wordpress/element';

interface FieldWrapperProps {
	label?: string | React.ReactNode;
	description?: string | React.ReactNode;
	children: React.ReactNode;
	style?: React.CSSProperties;
	type?: 'horizontal' | 'vertical';
	required?: boolean;
}

/**
 * Reusable component for descriptions.
 */
const DescriptionText: React.FC<{ text?: string | React.ReactNode }> = ({
	text,
}) => {
	if (!text) return null;
	return <span>{text}</span>;
};

const FieldWrapper: React.FC<FieldWrapperProps> = ({
	label,
	description,
	children,
	style,
	type = 'vertical',
	required = false,
}) => {
	return (
        <div style={style} className='flex flex-col gap-[5px]'>
            <div className='flex flex-col gap-[5px]'>
				<div className="flex items-center">
					{label && <span>{label}</span>}
					{label && required && <span>*</span>}
				</div>
				{type === 'horizontal' && (
					<DescriptionText text={description} />
				)}
			</div>
            {children}
            {type === 'vertical' && <DescriptionText text={description} />}
        </div>
    );
};

export default memo(FieldWrapper);
