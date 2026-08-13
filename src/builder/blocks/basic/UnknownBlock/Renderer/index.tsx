/**
 * wordpress dependencies
 */
import { __ } from '@wordpress/i18n';
/**
 * external dependencies
 */
import React from 'react';
import { AlertCircleIcon } from '@doublescale/components';
/**
 * internal dependencies
 */
import { UnknownBlockProps } from '../index';

export interface UnknownRendererProps {
	props: UnknownBlockProps;
}

export const UnknownRenderer: React.FC<UnknownRendererProps> = ({ props }) => {
	const { originalType } = props;

	return (
		<div className="flex items-center justify-center p-6 border-2 border-dashed border-gray-300 rounded-lg bg-gray-50">
			<div className="text-center space-y-2">
				<div className="flex justify-center text-gray-400">
					<AlertCircleIcon width={24} height={24} color="#9CA3AF" />
				</div>
				<div>
					<p className="font-semibold text-gray-700">
						{__('Unknown Block', 'doublescale')}
					</p>
					<p className="text-sm text-gray-500">
						{__('Type:', 'doublescale')}{' '}
						<code className="bg-gray-200 px-1 rounded">
							{originalType}
						</code>
					</p>
					<p className="text-sm text-gray-600 mt-1">
						{__(
							'This block is a Pro feature. Please install and activate the Pro version of the plugin to use it.',
							'doublescale'
						)}
					</p>
				</div>
			</div>
		</div>
	);
};
