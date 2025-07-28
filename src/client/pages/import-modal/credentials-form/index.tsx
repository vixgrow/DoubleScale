// components/ApiCredentials.tsx
import React from 'react';
import { __ } from '@wordpress/i18n';
import { map } from 'lodash';
import { ArrowUpLeft } from 'lucide-react';
import {
    Card,
    CardHeader,
    CardTitle,
    CardContent,
} from '@/components/ui/card';
import { Field } from '@quillcrm/components';
import { useImportContext } from '../contexts';

interface ApiCredentialsProps {
    importer: any;
}

const ApiCredentials: React.FC<ApiCredentialsProps> = ({ importer }) => {
    const { state, updateCredentials } = useImportContext();
    const { credentials } = state;

    return (
        <div className="space-y-6">
            <Card className="space-y-4 p-6 shadow-none rounded-2xl">
                <CardHeader className="p-0 mb-4">
                    <CardTitle className="text-2xl font-normal text-[#09090B]">
                        {importer.name} {__('Data Import Tool', 'quillcrm')}
                    </CardTitle>
                    <div className="text-[#71717A] text-lg">
                        {__(
                            'Start syncing your contacts to the Quill CRM using your API key.',
                            'quillcrm'
                        )}
                    </div>
                </CardHeader>

                <CardContent className="p-0 space-y-4">
                    {map(importer.credentials, (field, key) => (
                        <Field
                            key={key}
                            label={field.label}
                            type={field.type}
                            value={credentials[key]}
                            onChange={(value) => updateCredentials(key, value)}
                            placeholder={field.label}
                        />
                    ))}
                </CardContent>
            </Card>

            <Card className="bg-[#F6F6F6] rounded-xl shadow-none border border-gray-200">
                <CardContent className="p-6 space-y-3">
                    <CardTitle className="text-2xl font-normal text-[#09090B] mb-2">
                        {__('Find your API key', 'quillcrm')}
                    </CardTitle>

                    <ul className="list-decimal list-inside text-lg text-[#71717A] space-y-1">
                        <li>
                            {__(`Sign in to your ${importer.name} account.`, 'quillcrm')}
                        </li>
                        <li>
                            {__(
                                `Go to API Keys under Extras section of your ${importer.name} account.`,
                                'quillcrm'
                            )}
                        </li>
                        <li>
                            {__(
                                'Copy an existing API key or click the Create A Key button.',
                                'quillcrm'
                            )}
                        </li>
                    </ul>

                    <a
                        href="#"
                        className="inline-flex items-center text-base text-[#274C77] hover:underline mt-2"
                    >
                        <ArrowUpLeft className="w-4 h-4 mr-1" />
                        {__('In-depth Document guide', 'quillcrm')}
                    </a>
                </CardContent>
            </Card>
        </div>
    );
};

export default ApiCredentials;