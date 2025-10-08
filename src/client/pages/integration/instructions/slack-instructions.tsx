/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */

const SlackInstructions: React.FC = () => {
    return (
        <div className="space-y-4">
            <h2 className="text-xl font-semibold text-destructive">
                {__('Slack Instructions:', 'quillcrm')}
            </h2>

            <p className="text-base text-gray-900 font-semibold">
                {__('an application must be created with Slack to get your Client ID & Secret.', 'quillcrm')}
            </p>

            <ol className="list-decimal list-inside space-y-3 text-lg text-gray-500">
                <li>
                    {__('Login to the', 'quillcrm')} <a href="https://api.slack.com/apps" target="_blank" rel="noopener noreferrer" className="text-secondary font-semibold hover:underline">{__('Slack', 'quillcrm')}</a> {__('Apps and click "Create New App".', 'quillcrm')}
                </li>

                <li>
                    <span>{__('Choose "From an app manifest" and select your workspace and click next.', 'quillcrm')}</span>
                    <p className="text-base text-[#660FF1] mt-1">
                        {__('Note: you will be able to integrate it with all your workspaces.', 'quillcrm')}
                    </p>
                </li>

                <li>
                    <span>{__('Click on JSON tab and paste json below there.', 'quillcrm')}</span>

                    <div className="mt-2 ml-5 bg-gray-200 border p-3 rounded-md overflow-x-auto">
                        <pre className="text-sm text-gray-500 whitespace-pre-wrap break-all">
                            {`{"display_information":{"name":"Quill Forms"},"features":
{"bot_user":{"display_name":"Quill Forms","always_online":false}},
"oauth_config":{"redirect_urls":["https://demo.quillforms.com/
dododod9@gmailcom-admin/admin.php"],"scopes":{"bot":
["users:read","channels:read","groups:read","im:read","mpim:read","chat:write","chat:write.public"]},"settings":
{"org_deploy_enabled":false,"socket_mode_enabled":false,"token_rotation_enabled":false}}}`}
                        </pre>
                    </div>

                    <p className="text-sm text-gray-500 mt-2 ml-5">
                        {__('and click next.', 'quillcrm')}
                    </p>
                </li>

                <li>
                    {__('To integrate with many workspaces go to app "Manage Distribution". Check "Remove Hard Coded Information" and Click "Activate Public Distribution".', 'quillcrm')}
                </li>

                <li>
                    {__('Copy App ID, Client ID, & Client Secret from app "Basic Information" and paste them below.', 'quillcrm')}
                </li>
            </ol>
        </div>
    );
};

export default SlackInstructions;

