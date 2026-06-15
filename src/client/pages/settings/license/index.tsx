/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { useState, useEffect } from '@wordpress/element';
import { useDispatch } from '@wordpress/data';

/**
 * Internal dependencies
 */
import {
    LicenseStatusIcon,
    LicenseStartDateIcon,
    LicenseExpiryDateIcon,
    LicenseLastUpdateIcon,
    PlanIcon,
} from '@doublescale/components';
import ConfigAPI from '@doublescale/config';
import type { ProPluginData } from '@doublescale/config/types/config-data';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';

const applyProPluginData = (data: ProPluginData) => {
    ConfigAPI.setProPluginData(data);
    return data;
};

const reloadIfProActive = (data: ProPluginData) => {
    if (data.is_active) {
        setTimeout(() => {
            window.location.reload();
        }, 1000);
    }
};

const License: React.FC = () => {
    const license = ConfigAPI.getLicense();
    const [count, setCount] = useState(0); // counter used for force update.
    const [licenseKey, setLicenseKey] = useState('');
    const [isUpdating, setIsUpdating] = useState(false);
    const [isDeactivating, setIsDeactivating] = useState(false);
    const [isActivating, setIsActivating] = useState(false);
    const [isInstallingPro, setIsInstallingPro] = useState(false);
    const [isActivatingPro, setIsActivatingPro] = useState(false);
    const [proPluginData, setProPluginData] = useState<ProPluginData>(
        ConfigAPI.getProPluginData()
    );
    const [loading, setLoading] = useState(true);
    const ajaxUrl = ConfigAPI.getAjaxUrl();

    // Computed states based on license data
    const isActive = !!license;
    const status = license ? license.status === 'valid' : false;

    // dispatch notices.
    const { createNotice } = useDispatch('doublescale/core');

    const handleProPluginResponse = (data: ProPluginData) => {
        setProPluginData(applyProPluginData(data));
        setCount((prev) => prev + 1);
    };

    const notifyProPluginStatus = (data: ProPluginData) => {
        if (data.is_active) {
            createNotice({
                type: 'success',
                message: __(
                    'DoubleScale Pro is installed and active.',
                    'doublescale'
                ),
            });
            return;
        }

        if (data.is_installed) {
            createNotice({
                type: 'warning',
                message: __(
                    'DoubleScale Pro is installed but not active. Use the Activate button below.',
                    'doublescale'
                ),
            });
            return;
        }

        createNotice({
            type: 'warning',
            message: __(
                'DoubleScale Pro could not be installed automatically. Use the Install button below.',
                'doublescale'
            ),
        });
    };

    const activatePro = () => {
        if (isActivatingPro || isInstallingPro) {
            return;
        }

        setIsActivatingPro(true);
        const data = new FormData();
        data.append('action', 'doublescale_activate_pro');
        data.append('_nonce', ConfigAPI.getNonce());

        fetch(ajaxUrl, {
            method: 'POST',
            credentials: 'same-origin',
            body: data,
        })
            .then((res) => res.json())
            .then((res) => {
                if (res.success) {
                    handleProPluginResponse(res.data);
                    createNotice({
                        type: 'success',
                        message: __(
                            'DoubleScale Pro activated successfully.',
                            'doublescale'
                        ),
                    });
                    reloadIfProActive(res.data);
                } else {
                    createNotice({
                        type: 'error',
                        message: res.data,
                    });
                }
                setIsActivatingPro(false);
            })
            .catch(() => {
                setIsActivatingPro(false);
                createNotice({
                    type: 'error',
                    message: __('Something went wrong', 'doublescale'),
                });
            });
    };

    const installPro = () => {
        if (isInstallingPro || isActivatingPro) {
            return;
        }

        setIsInstallingPro(true);
        const data = new FormData();
        data.append('action', 'doublescale_install_pro');
        data.append('_nonce', ConfigAPI.getNonce());

        fetch(ajaxUrl, {
            method: 'POST',
            credentials: 'same-origin',
            body: data,
        })
            .then((res) => res.json())
            .then((res) => {
                if (res.success) {
                    handleProPluginResponse(res.data);
                    if (res.data.is_active) {
                        createNotice({
                            type: 'success',
                            message: __(
                                'DoubleScale Pro installed and activated successfully.',
                                'doublescale'
                            ),
                        });
                        reloadIfProActive(res.data);
                        setIsInstallingPro(false);
                        return;
                    }

                    createNotice({
                        type: 'success',
                        message: __(
                            'DoubleScale Pro installed successfully.',
                            'doublescale'
                        ),
                    });
                    setIsInstallingPro(false);
                    activatePro();
                    return;
                }

                createNotice({
                    type: 'error',
                    message: res.data,
                });
                setIsInstallingPro(false);
            })
            .catch(() => {
                setIsInstallingPro(false);
                createNotice({
                    type: 'error',
                    message: __('Something went wrong', 'doublescale'),
                });
            });
    };

    const activate = () => {
        if (isDeactivating || isUpdating || isActivating) return;
        setIsActivating(true);
        const data = new FormData();
        data.append('action', 'doublescale_license_activate');
        data.append('_nonce', ConfigAPI.getNonce());
        data.append('license_key', licenseKey?.trim());

        fetch(ajaxUrl, {
            method: 'POST',
            credentials: 'same-origin',
            body: data,
        })
            .then((res) => res.json())
            .then((res) => {
                if (res.success) {
                    const { pro_plugin_data: proData, ...licenseData } = res.data;

                    ConfigAPI.setLicense(licenseData);
                    setCount((prev) => prev + 1);
                    createNotice({
                        type: 'success',
                        message: __(
                            'License activated successfully.',
                            'doublescale'
                        ),
                    });

                    if (proData) {
                        handleProPluginResponse(proData);
                        notifyProPluginStatus(proData);
                        reloadIfProActive(proData);
                    }
                } else {
                    createNotice({
                        type: 'error',
                        message: res.data,
                    });
                }
                setIsActivating(false);
            })
            .catch(() => {
                setIsActivating(false);
                createNotice({
                    type: 'error',
                    message: __('Something went wrong', 'doublescale'),
                });
            });
    };

    const update = () => {
        if (isDeactivating || isUpdating || isActivating) return;
        setIsUpdating(true);
        const data = new FormData();
        data.append('action', 'doublescale_license_update');
        data.append('_nonce', ConfigAPI.getNonce());

        fetch(ajaxUrl, {
            method: 'POST',
            credentials: 'same-origin',
            body: data,
        })
            .then((res) => res.json())
            .then((res) => {
                if (res.success) {
                    ConfigAPI.setLicense(res.data);
                    setCount((prev) => prev + 1);
                    createNotice({
                        type: 'success',
                        message: __(
                            'License updated successfully.',
                            'doublescale'
                        ),
                    });
                } else {
                    createNotice({
                        type: 'error',
                        message: res.data,
                    });
                }
                setIsUpdating(false);
            })
            .catch(() => {
                createNotice({
                    type: 'error',
                    message: __('Something went wrong', 'doublescale'),
                });
                setIsUpdating(false);
            });
    };

    const deactivate = () => {
        if (isDeactivating || isUpdating || isActivating) return;
        setIsDeactivating(true);
        const data = new FormData();
        data.append('action', 'doublescale_license_deactivate');
        data.append('_nonce', ConfigAPI.getNonce());

        fetch(ajaxUrl, {
            method: 'POST',
            credentials: 'same-origin',
            body: data,
        })
            .then((res) => res.json())
            .then((res) => {
                if (res.success) {
                    ConfigAPI.setLicense(false);
                    setCount((prev) => prev + 1);
                    createNotice({
                        type: 'success',
                        message: __(
                            'License deactivated successfully.',
                            'doublescale'
                        ),
                    });
                } else {
                    createNotice({
                        type: 'error',
                        message: res.data,
                    });
                }

                setIsDeactivating(false);
            })
            .catch(() => {
                createNotice({
                    type: 'error',
                    message: __('Something went wrong', 'doublescale'),
                });

                setIsDeactivating(false);
            });
    };

    useEffect(() => {
        // Simulate loading time
        const timer = setTimeout(() => {
            setLoading(false);
        }, 500);

        return () => clearTimeout(timer);
    }, []);

    const renderProPluginStatus = () => {
        if (!status) {
            return null;
        }

        if (proPluginData.is_active) {
            return (
                <div className="text-xl font-bold text-[#34C759]">
                    {__('Active', 'doublescale')}
                </div>
            );
        }

        if (proPluginData.is_installed) {
            return (
                <div className="flex items-center gap-3">
                    <div className="text-xl font-bold text-[#F59E0B]">
                        {__('Installed', 'doublescale')}
                    </div>
                    <Button
                        className="h-9 px-4"
                        onClick={activatePro}
                        disabled={isActivatingPro || isInstallingPro}
                        variant="default"
                    >
                        {__('Activate', 'doublescale')}
                    </Button>
                </div>
            );
        }

        return (
            <div className="flex items-center gap-3">
                <div className="text-xl font-bold text-[#EF4444]">
                    {__('Not Installed', 'doublescale')}
                </div>
                <Button
                    className="h-9 px-4"
                    onClick={installPro}
                    disabled={isInstallingPro || isActivatingPro}
                    variant="default"
                >
                    {__('Install & Activate', 'doublescale')}
                </Button>
            </div>
        );
    };

    if (loading) {
        return (
            <div className="business-settings doublescale-fields">
                <div className="text-foreground font-semibold text-2xl mb-6">
                    {__('License Management', 'doublescale')}
                </div>
                <Skeleton className='h-4 w-full' />
            </div>
        );
    }

    return (
        <div className="business-settings doublescale-fields">
            <div className="text-foreground font-semibold text-2xl">
                {__('License Management', 'doublescale')}
            </div>
            {!isActive ? (
                <div className="mt-6">
                    <div className="mb-4">
                        <label className="block text-base text-foreground mb-2">
                            {__('Please Provide a license key of DoubleScale', 'doublescale')}
                        </label>
                        <Input
                            className="w-full"
                            placeholder={__('Enter license key', 'doublescale')}
                            value={licenseKey}
                            onChange={(e) => setLicenseKey(e.target.value)}
                        />
                    </div>
                    <div className="text-base text-[#818181] flex items-center gap-1 mt-2">
                        {__('By Activating this license, you agree to the', 'doublescale')}
                        <a
                            href="https://doublescale.io/terms"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="font-semibold text-[#CB5301] underline"
                        >
                            {__('terms of use', 'doublescale')}
                        </a>
                        {__('for this product.', 'doublescale')}
                    </div>
                    <div className="flex justify-end mt-4">
                        <Button
                           
                            onClick={activate}
                            disabled={isActivating || !licenseKey.trim()}
                            variant='default'
                        >
                            {__('Activate License', 'doublescale')}
                        </Button>
                    </div>
                </div>
            ) : (
                <>
                    <div className="grid grid-cols-2 gap-y-5 mt-6">
                        {/* Left Column - Status */}
                        <div className="flex justify-between items-center py-6 pl-6 border-r pr-10">
                            <div className="flex gap-2 items-center">
                                <div className="flex items-center justify-center">
                                    <LicenseStatusIcon />
                                </div>
                                <div>
                                    <div className="text-lg font-medium text-muted-foreground">
                                        {__('Status', 'doublescale')}
                                    </div>
                                </div>
                            </div>
                            <div className={`text-xl font-bold ${status ? 'text-[#34C759]' : 'text-[#EF4444]'}`}>
                                {license?.status_label || (status
                                    ? __('Activated', 'doublescale')
                                    : __('Invalid', 'doublescale'))}
                            </div>
                        </div>

                        {/* Right Column - Your Plan */}
                        <div className="flex justify-between items-center py-6 pr-6 pl-10">
                            <div className="flex gap-2 items-center">
                                <div className="flex items-center justify-center">
                                    <PlanIcon />
                                </div>
                                <div>
                                    <div className="text-lg font-medium text-muted-foreground">
                                        {__('Your Plan', 'doublescale')}
                                    </div>
                                </div>
                            </div>
                            <div className="text-xl text-foreground font-bold">
                                {license?.plan_label || __('N/A', 'doublescale')}
                            </div>
                        </div>

                        {/* Left Column - Last Update */}
                        <div className="flex justify-between items-center py-6 pl-6 border-r pr-10">
                            <div className="flex gap-2 items-center">
                                <div className="flex items-center justify-center">
                                    <LicenseStartDateIcon />
                                </div>
                                <div>
                                    <div className="text-lg font-medium text-muted-foreground">
                                        {__('Last Update', 'doublescale')}
                                    </div>
                                </div>
                            </div>
                            <div className="text-xl text-foreground font-bold">
                                {license?.last_update || __('N/A', 'doublescale')}
                            </div>
                        </div>

                        {/* Right Column - Expiry Date */}
                        <div className="flex justify-between items-center py-6 pr-6 pl-10">
                            <div className="flex gap-2 items-center">
                                <div className="flex items-center justify-center">
                                    <LicenseExpiryDateIcon />
                                </div>
                                <div>
                                    <div className="text-lg font-medium text-muted-foreground">
                                        {__('Expiry Date', 'doublescale')}
                                    </div>
                                </div>
                            </div>
                            <div className="text-xl text-foreground font-bold">
                                {license?.expires || __('N/A', 'doublescale')}
                            </div>
                        </div>

                        {/* Left Column - Last Check */}
                        <div className="flex justify-between items-center py-6 pl-6 border-r pr-10">
                            <div className="flex gap-2 items-center">
                                <div className="flex items-center justify-center">
                                    <LicenseLastUpdateIcon />
                                </div>
                                <div>
                                    <div className="text-lg font-medium text-muted-foreground">
                                        {__('Last Check', 'doublescale')}
                                    </div>
                                </div>
                            </div>
                            <div className="text-xl text-foreground font-bold">
                                {license?.last_check || __('N/A', 'doublescale')}
                            </div>
                        </div>

                        {/* Right Column - Pro Plugin */}
                        <div className="flex justify-between items-center py-6 pr-6 pl-10">
                            <div className="flex gap-2 items-center">
                                <div className="flex items-center justify-center">
                                    <PlanIcon />
                                </div>
                                <div>
                                    <div className="text-lg font-medium text-muted-foreground">
                                        {__('Pro Plugin', 'doublescale')}
                                    </div>
                                </div>
                            </div>
                            {renderProPluginStatus()}
                        </div>
                    </div>

                    {/* Upgrade Links Section */}
                    {license?.upgrades && Object.values(license.upgrades).length > 0 && (
                        <div className="mt-6 p-4 bg-gray-50 rounded-lg">
                            <div className="text-base font-semibold text-[#71717A] mb-2">
                                {__('Available Upgrades:', 'doublescale')}
                            </div>
                            <div className="flex flex-col gap-2">
                                {Object.values(license.upgrades).map((upgrade: any, index: number) => (
                                    <a
                                        key={index}
                                        href={upgrade.url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="text-[#CB5301] underline"
                                    >
                                        {__('Upgrade to', 'doublescale')} {upgrade.plan_label} {__('plan', 'doublescale')}
                                    </a>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Action Buttons */}
                    <div className="flex justify-end gap-4 mt-6">
                        <Button
                            className="bg-primary hover:bg-primary/90 px-7 h-10"
                            onClick={update}
                            disabled={isDeactivating || isUpdating || isActivating}
                            variant='default'
                        >
                            {__('Update', 'doublescale')}
                        </Button>
                        <Button
                            className="px-7 h-10"
                            onClick={deactivate}
                            disabled={isDeactivating || isUpdating || isActivating}
                            variant='destructive'
                        >
                            {__('Deactivate', 'doublescale')}
                        </Button>
                    </div>
                </>
            )}
        </div>
    );
};

export default License;
