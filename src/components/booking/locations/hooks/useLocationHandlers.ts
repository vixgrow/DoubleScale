import { __ } from '@wordpress/i18n';
import useNotice from '@/hooks/booking/notice';
import { get, isEmpty, uniqueId } from 'lodash';
import type {
    ExtendedLocation,
    CustomLocationState,
    IntegrationType,
    LocationsProps,
} from '../types';
import { IntegrationHelper } from '../helpers';

export const useLocationHandlers = (
    locations: ExtendedLocation[],
    onChange: (locations: ExtendedLocation[]) => void,
    connected_integrations: LocationsProps['connected_integrations'],
    locationTypes: any,
    cachedLocationData: Record<string, any>,
    setCachedLocationData: React.Dispatch<React.SetStateAction<Record<string, any>>>,
    customLocations: CustomLocationState[],
    setCustomLocations: React.Dispatch<React.SetStateAction<CustomLocationState[]>>,
    openModal?: (index: number, type: string) => void,
) => {
    const { errorNotice } = useNotice();
    const integrationHelper = new IntegrationHelper(connected_integrations);

    const handleCheckboxChange = async (type: string, checked: boolean) => {
        // Require a real per-calendar / account connection (not org-wide “global settings” only).
        if (
            checked &&
            !integrationHelper.isIntegrationConnected(type as IntegrationType) &&
            !integrationHelper.hasGetStarted(type as IntegrationType)
        ) {
            switch (type) {
                case 'google-meet':
                    errorNotice(
                        __(
                            'Google Meet is not connected. Please connect it first.',
                            'doublescale'
                        )
                    );
                    return;
                case 'zoom':
                    errorNotice(
                        __(
                            'Zoom is not connected. Please connect it first.',
                            'doublescale'
                        )
                    );
                    return;
                case 'ms-teams':
                    // Check if Teams is enabled for the default account
                    if (!integrationHelper.isTeamsEnabled()) {
                        errorNotice(
                            __(
                                'Microsoft Teams is not enabled for your default account. Please enable it in the Outlook integration settings.',
                                'doublescale'
                            )
                        );
                    } else {
                        errorNotice(
                            __(
                                'Microsoft Teams is not connected. Please connect it first.',
                                'doublescale'
                            )
                        );
                    }
                    return;
            }
        }

        // If not custom and integration is connected (or not required), handle regular location toggle
        const existingIndex = locations.findIndex((loc) => loc.type === type);

        if (checked) {
            // If the location was previously saved, restore its data
            const savedFields = cachedLocationData[type] || {};

            if (existingIndex !== -1) {
                const updatedLocations = [...locations];
                updatedLocations[existingIndex] = {
                    type,
                    fields: Object.keys(savedFields).length > 0 ? savedFields : {},
                };
                onChange(updatedLocations);
            } else {
                const updatedLocations = [...locations];
                updatedLocations.push({
                    type,
                    fields: Object.keys(savedFields).length > 0 ? savedFields : {},
                });
                onChange(updatedLocations);

                // If there are saved fields but the location needs configuration, open modal
                if (
                    Object.keys(savedFields).length === 0 &&
                    !isEmpty(get(locationTypes, `${type}.fields`))
                ) {
                    handleLocationTypeChange(updatedLocations.length - 1, type);
                }
            }
        } else {
            // When unchecking, save the current location data before removing
            const locationToRemove = locations.find((loc) => loc.type === type);
            if (locationToRemove && locationToRemove.fields) {
                setCachedLocationData((prev) => ({
                    ...prev,
                    [type]: locationToRemove.fields,
                }));
            }

            const updatedLocations = locations.filter((loc) => loc.type !== type);
            onChange(updatedLocations);
        }
    };

    // Handle regular location type changes
    const handleLocationTypeChange = (index: number, newType: string) => {
        const locationType = get(locationTypes, newType);

        // If the new location type has no fields, update it directly
        if (isEmpty(locationType?.fields)) {
            const updatedLocations = [...locations];
            updatedLocations[index] = {
                type: newType,
                fields: {},
            };
            onChange(updatedLocations);
            return;
        }

        // Open the modal in the parent component to fill the fields
        if (openModal) {
            openModal(index, newType);
        }
    };

    // Toggle custom location checkbox
    const handleCustomCheckboxChange = (customId: string, checked: boolean) => {
        // Update the customLocations visibility state
        setCustomLocations((prev) =>
            prev.map((custom) =>
                custom.id === customId ? { ...custom, visible: checked } : custom
            )
        );

        if (checked) {
            // Get the custom location data
            const customLocation = customLocations.find(
                (custom) => custom.id === customId
            );

            // Add to locations array if not already there
            if (customLocation) {
                const existingIndex = locations.findIndex(
                    (loc) => loc.type === 'custom' && loc.id === customId
                );

                if (existingIndex === -1) {
                    const updatedLocations = [...locations];
                    updatedLocations.push({
                        type: 'custom',
                        id: customId,
                        fields: customLocation.fields || {},
                    });
                    onChange(updatedLocations);

                    // If fields need configuration, open the modal
                    if (
                        !customLocation.fields ||
                        Object.keys(customLocation.fields).length === 0
                    ) {
                        // This would need to be handled by the parent component
                        // setNewLocationType('custom');
                        // setEditingCustomId(customId);
                        // setIsModalVisible(true);
                    }
                }
            }
        } else {
            // Remove from locations array but keep in customLocations
            const updatedLocations = locations.filter(
                (loc) => !(loc.type === 'custom' && loc.id === customId)
            );
            onChange(updatedLocations);
        }
    };

    // Add custom location
    const addCustomLocation = () => {
        const newCustomId = uniqueId('custom-');

        // Open modal to edit the new custom location
        // This would need to be handled by the parent component
        // setNewLocationType('custom');
        // setEditingCustomId(newCustomId);
        // form.resetFields();
        // setIsModalVisible(true);

        return newCustomId;
    };

    // Remove custom location completely
    const removeCustomLocation = (customId: string) => {
        // Remove from customLocations state
        setCustomLocations((prev) =>
            prev.filter((custom) => custom.id !== customId)
        );

        // Remove from locations array
        const updatedLocations = locations.filter(
            (loc) => !(loc.type === 'custom' && loc.id === customId)
        );

        onChange(updatedLocations);
    };

    return {
        integrationHelper,
        handleCheckboxChange,
        handleLocationTypeChange,
        handleCustomCheckboxChange,
        addCustomLocation,
        removeCustomLocation,
    };
};
