/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';

/**
 * External dependencies
 */
import React from 'react';

/**
 * Internal dependencies
 */
import { CardHeader, GroupIcon } from '@/components/booking';

import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';

interface GroupSettingsProps {
	maxInvites: number;
	showRemaining: boolean;
	onChange: (
		key: 'max_invites' | 'show_remaining',
		value: number | boolean
	) => void;
}

const GroupSettings: React.FC<GroupSettingsProps> = ({
	maxInvites,
	showRemaining,
	onChange,
}) => {
	return (
        <div>
                <div className='flex gap-5 flex-col'>
                    <div className='flex flex-col gap-2'>
                        <div className="text-[#09090B] text-[16px]">
                            {__('Max invitees in a spot', 'doublescale')}
                            <span className="text-red-500">*</span>
                        </div>
                        <Input
                            type="number"
                            value={maxInvites}
                            onChange={(e) => {
                                onChange('max_invites', Number(e.target.value));
                            }}
                            placeholder={__('Enter Max invitees', 'doublescale')}
                            className="h-[48px] rounded-lg"
                        />
                    </div>
                    <label
                        htmlFor="doublescale-booking-show-remaining-spots"
                        className="flex items-center gap-2 text-[#5E6278] font-semibold cursor-pointer select-none"
                    >
                        <Checkbox
                            id="doublescale-booking-show-remaining-spots"
                            checked={showRemaining}
                            onCheckedChange={(checked) =>
                                onChange('show_remaining', Boolean(checked))
                            }
                            className="custom-check"
                        />
                        <span>
                            {__(
                                'Display Remaining Spots on Booking Page',
                                'doublescale'
                            )}
                        </span>
                    </label>
                </div>
        </div>
    );
};

export default GroupSettings;
