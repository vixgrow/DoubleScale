/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { useState, useEffect } from '@wordpress/element';
import { useDispatch } from '@wordpress/data';

/**
 * External dependencies
 */
import { Button, Input, Skeleton } from 'antd';

/**
 * Internal dependencies
 */
import {
    LicenseStatusIcon,
    LicenseStartDateIcon,
    LicenseExpiryDateIcon,
    LicenseLastUpdateIcon,
    PlanIcon,
} from '@quillcrm/components';
import ConfigAPI from '@quillcrm/config';

const License: React.FC = () => {
    const license = ConfigAPI.getLicense();
    const pluginData = ConfigAPI.getProPluginData();
    const [count, setCount] = useState(0); // counter used for force update.
    const [licenseKey, setLicenseKey] = useState('');
    const [isUpdating, setIsUpdating] = useState(false);
    const [isDeactivating, setIsDeactivating] = useState(false);
    const [isActivating, setIsActivating] = useState(false);
    const [isInstalling, setIsInstalling] = useState(false);
    const [isActivatingPlugin, setIsActivatingPlugin] = useState(false);
    const [loading, setLoading] = useState(true);
    const ajaxUrl = ConfigAPI.getAjaxUrl();

    // Computed states based on license data
    const isActive = !!license;
    const status = license ? license.status === 'valid' : false;

    // dispatch notices.
    const { createNotice } = useDispatch('quillcrm/core');

    const activate = () => {
        if (isDeactivating || isUpdating || isActivating) return;
        setIsActivating(true);
        const data = new FormData();
        data.append('action', 'quillcrm_license_activate');
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
                    ConfigAPI.setLicense(res.data);
                    setCount(count + 1);
                    createNotice({
                        type: 'success',
                        message: __(
                            'License activated successfully.',
                            'quillcrm'
                        ),
                    });

                    if (pluginData && !pluginData.is_installed) {
                        installPlugin();
                    } else if (pluginData && pluginData.is_installed && !pluginData.is_active) {
                        activatePlugin();
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
                    message: __('Something went wrong', 'quillcrm'),
                });
            });
    };

    const update = () => {
        if (isDeactivating || isUpdating || isActivating) return;
        setIsUpdating(true);
        const data = new FormData();
        data.append('action', 'quillcrm_license_update');
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
                    setCount(count + 1);
                    createNotice({
                        type: 'success',
                        message: __(
                            'License updated successfully.',
                            'quillcrm'
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
                    message: __('Something went wrong', 'quillcrm'),
                });
                setIsUpdating(false);
            });
    };

    const deactivate = () => {
        if (isDeactivating || isUpdating || isActivating) return;
        setIsDeactivating(true);
        const data = new FormData();
        data.append('action', 'quillcrm_license_deactivate');
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
                    setCount(count + 1);
                    createNotice({
                        type: 'success',
                        message: __(
                            'License deactivated successfully.',
                            'quillcrm'
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
                    message: __('Something went wrong', 'quillcrm'),
                });

                setIsDeactivating(false);
            });
    };

    const installPlugin = () => {
        if (isDeactivating || isUpdating || isActivating) return;
        setIsInstalling(true);
        const data = new FormData();
        data.append('action', 'quillcrm_install_pro');
        data.append('_nonce', ConfigAPI.getNonce());

        fetch(ajaxUrl, {
            method: 'POST',
            credentials: 'same-origin',
            body: data,
        })
            .then((res) => res.json())
            .then((res) => {
                if (res.success) {
                    setCount(count + 1);
                    ConfigAPI.setProPluginData({
                        ...ConfigAPI.getProPluginData(),
                        is_installed: true,
                    });
                    activatePlugin();
                } else {
                    createNotice({
                        type: 'error',
                        message: res.data,
                    });
                }
                setIsInstalling(false);
            })
            .catch(() => {
                createNotice({
                    type: 'error',
                    message: __('Something went wrong', 'quillcrm'),
                });
                setIsInstalling(false);
            });
    };

    const activatePlugin = () => {
        if (isDeactivating || isUpdating || isActivating || isInstalling) return;
        setIsActivatingPlugin(true);
        const data = new FormData();
        data.append('action', 'quillcrm_activate_pro');
        data.append('_nonce', ConfigAPI.getNonce());

        fetch(ajaxUrl, {
            method: 'POST',
            credentials: 'same-origin',
            body: data,
        })
            .then((res) => res.json())
            .then((res) => {
                if (res.success) {
                    setCount(count + 1);
                    createNotice({
                        type: 'success',
                        message: __(
                            'Plugin activated successfully.',
                            'quillcrm'
                        ),
                    });
                    ConfigAPI.setProPluginData({
                        ...ConfigAPI.getProPluginData(),
                        is_active: true,
                    });
                } else {
                    createNotice({
                        type: 'error',
                        message: res.data,
                    });
                }
                setIsActivatingPlugin(false);
            })
            .catch(() => {
                createNotice({
                    type: 'error',
                    message: __('Something went wrong', 'quillcrm'),
                });
                setIsActivatingPlugin(false);
            });
    };

    useEffect(() => {
        // Simulate loading time
        const timer = setTimeout(() => {
            setLoading(false);
        }, 500);

        return () => clearTimeout(timer);
    }, []);

    if (loading) {
        return (
            <div className="business-settings qcrm-fields">
                <div className="text-[#09090B] font-semibold text-2xl mb-6">
                    {__('License Management', 'quillcrm')}
                </div>
                <Skeleton active paragraph={{ rows: 6 }} />
            </div>
        );
    }

    return (
        <div className="business-settings qcrm-fields">
            <div className="text-[#09090B] font-semibold text-2xl">
                {__('License Management', 'quillcrm')}
            </div>
            {!isActive ? (
                <div className="mt-6">
                    <div className="mb-4">
                        <label className="block text-base text-[#09090B] mb-2">
                            {__('Please Provide a license key of QuillCRM', 'quillcrm')}
                        </label>
                        <Input
                            className="w-full h-[48px] rounded-lg"
                            placeholder={__('Enter license key', 'quillcrm')}
                            value={licenseKey}
                            onChange={(e) => setLicenseKey(e.target.value)}
                        />
                    </div>
                    <div className="text-base text-[#818181] flex items-center gap-1 mt-2">
                        {__('By Activating this license, you agree to the', 'quillcrm')}
                        <a 
                            href="https://quillcrm.io/terms" 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="font-semibold text-[#CB5301] underline"
                        >
                            {__('terms of use', 'quillcrm')}
                        </a>
                        {__('for this product.', 'quillcrm')}
                    </div>
                    <div className="flex justify-end mt-4">
                        <Button
                            type="primary"
                            className="bg-[#CB5301] hover:bg-[#a84401] px-7 h-10"
                            onClick={activate}
                            loading={isActivating}
                            disabled={isActivating || !licenseKey.trim()}
                        >
                            {__('Activate License', 'quillcrm')}
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
                                    <div className="text-lg font-medium text-[#777]">
                                        {__('Status', 'quillcrm')}
                                    </div>
                                </div>
                            </div>
                            <div className={`text-xl font-bold ${status ? 'text-[#34C759]' : 'text-[#EF4444]'}`}>
                                {license?.status_label || (status
                                    ? __('Activated', 'quillcrm')
                                    : __('Invalid', 'quillcrm'))}
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
                                {license?.plan_label || __('N/A', 'quillcrm')}
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
                                        {__('Last Update', 'quillcrm')}
                                    </div>
                                </div>
                            </div>
                            <div className="text-xl text-[#09090B] font-bold">
                                {license?.last_update || __('N/A', 'quillcrm')}
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
                                {license?.expires || __('N/A', 'quillcrm')}
                            </div>
                        </div>

                        {/* Left Column - Last Check */}
                        <div className="flex justify-between items-center py-6 pl-6 border-r pr-10">
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
                                {license?.last_check || __('N/A', 'quillcrm')}
                            </div>
                        </div>

                        {/* Right Column - Empty or Plugin Status */}
                        <div className="flex justify-between items-center py-6 pr-6 pl-10">
                            {pluginData && (!pluginData.is_installed || !pluginData.is_active) ? (
                                <>
                                    <div className="flex gap-2 items-center">
                                        <div>
                                            <div className="text-lg font-medium text-[#777]">
                                                {__('Pro Plugin', 'quillcrm')}
                                            </div>
                                        </div>
                                    </div>
                                    <div>
                                        {!pluginData.is_installed && (
                                            <Button
                                                type="primary"
                                                className="bg-[#CB5301] hover:bg-[#a84401]"
                                                onClick={installPlugin}
                                                loading={isInstalling}
                                                disabled={isDeactivating || isUpdating || isActivating || isInstalling}
                                            >
                                                {isInstalling ? __('Installing...', 'quillcrm') : __('Install Plugin', 'quillcrm')}
                                            </Button>
                                        )}
                                        {pluginData.is_installed && !pluginData.is_active && (
                                            <Button
                                                type="primary"
                                                className="bg-[#CB5301] hover:bg-[#a84401]"
                                                onClick={activatePlugin}
                                                loading={isActivatingPlugin}
                                                disabled={isDeactivating || isUpdating || isActivating || isInstalling || isActivatingPlugin}
                                            >
                                                {isActivatingPlugin ? __('Activating...', 'quillcrm') : __('Activate Plugin', 'quillcrm')}
                                            </Button>
                                        )}
                                    </div>
                                </>
                            ) : (
                                <div className="w-full" />
                            )}
                        </div>
                    </div>

                    {/* Upgrade Links Section */}
                    {license?.upgrades && Object.values(license.upgrades).length > 0 && (
                        <div className="mt-6 p-4 bg-gray-50 rounded-lg">
                            <div className="text-base font-semibold text-[#71717A] mb-2">
                                {__('Available Upgrades:', 'quillcrm')}
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
                                        {__('Upgrade to', 'quillcrm')} {upgrade.plan_label} {__('plan', 'quillcrm')}
                                    </a>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Action Buttons */}
                    <div className="flex justify-end gap-4 mt-6">
                        <Button
                            type="primary"
                            className="bg-[#CB5301] hover:bg-[#a84401] px-7 h-10"
                            onClick={update}
                            loading={isUpdating}
                            disabled={isDeactivating || isUpdating || isActivating}
                        >
                            {__('Update', 'quillcrm')}
                        </Button>
                        <Button
                            danger
                            className="px-7 h-10"
                            onClick={deactivate}
                            loading={isDeactivating}
                            disabled={isDeactivating || isUpdating || isActivating}
                        >
                            {__('Deactivate', 'quillcrm')}
                        </Button>
                    </div>
                </>
            )}
        </div>
    );
};

export default License;
