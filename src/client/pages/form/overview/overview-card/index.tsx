/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { useState } from '@wordpress/element';

/**
 * External dependencies
 */
import { MoreHorizontal as MoreOutlined } from 'lucide-react';
import { useNavigate, getToLink } from '@doublescale/navigation';
/**
 * Internal dependencies
 */
import './style.scss';
import { useFormContext } from '../../state/context';
import ConfigAPI from '@doublescale/config';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
	Popover,
	PopoverContent,
	PopoverTrigger,
} from '@/components/ui/popover';

const OverviewRow: React.FC<{ children: React.ReactNode }> = ({ children }) => (
	<li className="doublescale-overview-list__item flex border-b border-border last:border-b-0 px-3 py-2">
		{children}
	</li>
);

const Overview: React.FC = () => {
	const { form, isLoading, saveForm } = useFormContext();
	const [deactivating, setDeactivating] = useState(false);
	const formsData = ConfigAPI.getForms();
	const navigate = useNavigate();
	const deactivateForm = async () => {
		setDeactivating(true);

		try {
			await saveForm({
				status: 'inactive',
			});

			navigate(getToLink('forms'));
		} catch (error) {
			console.error(error);
		} finally {
			setDeactivating(false);
		}
	};

	return (
        <Card><CardHeader><CardTitle>{<div className='flex justify-between'>
                        <span>
                            {__('Overview', 'doublescale')}
                        </span>
                        <Popover>
                            <PopoverTrigger asChild>
                                <button className="p-1" type="button">
                                    <MoreOutlined />
                                </button>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-2">
                                <Button
                                    disabled
                                    onClick={deactivateForm}
                                    variant='link'
                                >
                                    {__('Deactivate', 'doublescale')}
                                </Button>
                            </PopoverContent>
                        </Popover>
                    </div>}</CardTitle></CardHeader><CardContent>
                <ul className="doublescale-overview-list border border-border rounded-md divide-y divide-border">
                    {form && (
                        <>
                            <OverviewRow>
                                <div className='flex w-full justify-between'>
                                    <span>
                                        {__('Name', 'doublescale')}
                                    </span>
                                    <span>{form.name}</span>
                                </div>
                            </OverviewRow>
                            <OverviewRow>
                                <div className='flex w-full justify-between'>
                                    <span>
                                        {__('Form Type', 'doublescale')}
                                    </span>
                                    <span>
                                        {formsData[form.form_type]?.label}
                                    </span>
                                </div>
                            </OverviewRow>
                            <OverviewRow>
                                <div className='flex w-full justify-between'>
                                    <span>
                                        {__('Form ID', 'doublescale')}
                                    </span>
                                    <span>
                                        {form.form_id}
                                    </span>
                                </div>
                            </OverviewRow>
                            <OverviewRow>
                                <div className='flex w-full justify-between'>
                                    <span>
                                        {__('Status', 'doublescale')}
                                    </span>
                                    <span>{form.status}</span>
                                </div>
                            </OverviewRow>
                        </>
                    )}
                </ul>
            </CardContent></Card>
    );
};

export default Overview;
