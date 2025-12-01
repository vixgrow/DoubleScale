/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import { Field } from '@quillcrm/components';
import {
    LicenseStatusIcon,
    LicenseStartDateIcon,
    LicenseExpiryDateIcon,
    LicenseLastUpdateIcon,
    PlanIcon,
} from '@quillcrm/components';

interface LicenseProps {
    isActivated: boolean;
}

const License: React.FC<LicenseProps> = ({ isActivated }) => {
    return (
        <div className="business-settings qcrm-fields">
            <div className="text-[#09090B] font-semibold text-2xl">
                {__('License Management', 'quillcrm')}
            </div>
            {!isActivated ? (
                <div>
                    <Field
                        label={__('Please Provide a license key of Quill Booking', 'quillcrm')}
                        value={''}
                        onChange={() => { }}
                        type="text"
                        placeholder={__('Enter license key', 'quillcrm')}
                    />
                    <div className="text-base text-[#818181] flex items-center gap-1 mt-2">
                        {__('By Activating this license, you agree to the', 'quillcrm')}
                        <div className="font-semibold text-[#CB5301] underline">{__('terms of use', 'quillcrm')}</div>
                        {__('for this product.', 'quillcrm')}
                    </div>
                </div>
            ) : (
                <div className="grid grid-cols-2 gap-y-5 mt-6">
                    {/* Left Column - Status */}
                    <div className="flex justify-between items-center py-6 pl-6 border-r pr-10">
                        <div className="flex gap-2 items-center">
                            <div className="flex items-center justify-center">
                                <LicenseStatusIcon />
                            </div>
                            <div>
                                <div className="text-lg font-medium text-[#777]">
                                    {__('Status', 'quillcrm')}
                                </div>
                            </div>
                        </div>
                        <div className="text-xl text-[#09090B] font-bold">
                            {__('Activated', 'quillcrm')}
                        </div>
                    </div>

                    {/* Right Column - Your Plan */}
                    <div className="flex justify-between items-center py-6 pr-6 pl-10">
                        <div className="flex gap-2 items-center">
                            <div className="flex items-center justify-center">
                                <PlanIcon />
                            </div>
                            <div>
                                <div className="text-lg font-medium text-[#777]">
                                    {__('Your Plan', 'quillcrm')}
                                </div>
                            </div>
                        </div>
                        <div className="text-xl text-[#09090B] font-bold">
                            {__('Enterprise', 'quillcrm')}
                        </div>
                    </div>

                    {/* Left Column - Start Date */}
                    <div className="flex justify-between items-center py-6 pl-6 border-r pr-10">
                        <div className="flex gap-2 items-center">
                            <div className="flex items-center justify-center">
                                <LicenseStartDateIcon />
                            </div>
                            <div>
                                <div className="text-lg font-medium text-[#777]">
                                    {__('Start Date', 'quillcrm')}
                                </div>
                            </div>
                        </div>
                        <div className="text-xl text-[#09090B] font-bold">
                            {__('19 March 2025 02:44:12 PM', 'quillcrm')}
                        </div>
                    </div>

                    {/* Right Column - Expiry Date */}
                    <div className="flex justify-between items-center py-6 pr-6 pl-10">
                        <div className="flex gap-2 items-center">
                            <div className="flex items-center justify-center">
                                <LicenseExpiryDateIcon />
                            </div>
                            <div>
                                <div className="text-lg font-medium text-[#777]">
                                    {__('Expiry Date', 'quillcrm')}
                                </div>
                            </div>
                        </div>
                        <div className="text-xl text-[#09090B] font-bold">
                            {__('19 March 2026 02:44:12 PM', 'quillcrm')}
                        </div>
                    </div>

                    {/* Left Column - Last Update */}
                    <div className="flex justify-between items-center py-6 pl-6 border-r pr-10">
                        <div className="flex gap-2 items-center">
                            <div className="flex items-center justify-center">
                                <LicenseLastUpdateIcon />
                            </div>
                            <div>
                                <div className="text-lg font-medium text-[#777]">
                                    {__('Last Update', 'quillcrm')}
                                </div>
                            </div>
                        </div>
                        <div className="text-xl text-[#09090B] font-bold">
                            {__('19 March 2025 02:44:12 PM', 'quillcrm')}
                        </div>
                    </div>

                    {/* Right Column - Last Check */}
                    <div className="flex justify-between items-center py-6 pr-6 pl-10">
                        <div className="flex gap-2 items-center">
                            <div className="flex items-center justify-center">
                                <LicenseLastUpdateIcon />
                            </div>
                            <div>
                                <div className="text-lg font-medium text-[#777]">
                                    {__('Last Check', 'quillcrm')}
                                </div>
                            </div>
                        </div>
                        <div className="text-xl text-[#09090B] font-bold">
                            {__('19 March 2026 02:44:12 PM', 'quillcrm')}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default License;
