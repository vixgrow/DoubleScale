/**
 * wordpress dependencies
 */
import { __ } from '@wordpress/i18n';
/**
 * external dependencies
 */
import React from 'react';
import { AlertCircle, Info } from 'lucide-react';
/**
 * internal dependencies
 */
import { UnknownBlockProps } from '../index';

export interface UnknownEditorProps {
	props: UnknownBlockProps;
	onChange: (props: Record<string, any>) => void;
}

export const UnknownEditor: React.FC<UnknownEditorProps> = ({ props }) => {
	const { originalType } = props;

	return (
		<div className="space-y-4">
			<div className="flex items-start gap-3 p-4 border border-gray-200 rounded-lg bg-gray-50">
				<div className="flex-shrink-0 mt-1">
					<AlertCircle className="w-8 h-8 text-gray-400" />
				</div>
				<div className="flex-1 space-y-2">
					<h4 className="font-semibold text-gray-900">
						{__('Unknown Block', 'doublescale')}
					</h4>
					<p className="text-sm text-gray-600">
						{__(
							'This block type is not available. It requires the Pro version of the plugin to be installed and activated.',
							'doublescale'
						)}
					</p>
				</div>
			</div>

			<div className="space-y-3">
				<div className="flex items-center gap-2 text-sm text-gray-700">
					<Info className="w-4 h-4" />
					<span className="font-medium">
						{__('Block Information', 'doublescale')}
					</span>
				</div>

				<div className="bg-white border border-gray-200 rounded-lg p-3 space-y-2">
					<div className="flex justify-between text-sm">
						<span className="text-gray-600">
							{__('Block Type:', 'doublescale')}
						</span>
						<code className="bg-gray-100 px-2 py-1 rounded text-xs font-mono">
							{originalType}
						</code>
					</div>
				</div>
			</div>

			<div className="p-3 bg-blue-50 border border-blue-200 rounded-lg text-xs text-blue-800">
				<p className="font-medium mb-1">
					{__('Data Preserved', 'doublescale')}
				</p>
				<p>
					{__(
						"This block's original configuration is preserved. If the Pro version of the plugin is installed or the block becomes available again, it will be restored automatically.",
						'doublescale'
					)}
				</p>
			</div>
		</div>
	);
};
