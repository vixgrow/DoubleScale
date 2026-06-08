/**
 * WordPress dependencies
 */
import { useCallback, useEffect, useMemo, useRef, useState } from '@wordpress/element';
import { __, sprintf } from '@wordpress/i18n';

/**
 * DoubleScale dependencies
 */
import { getToLink, useNavigate, useParams } from '@doublescale/navigation';
import { PageHeader, PlusIcon } from '@doublescale/components';
import config from '@doublescale/config';

/**
 * Internal dependencies
 */
import ModuleDisabledNotice from '@/components/module-disabled-notice';
import { getApiErrorMessage } from '@/utils';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import BuiltinSmtpSettings from '../settings/smtp/builtin-smtp-settings';
import { ConnectionsViewToggle } from '../settings/smtp/connections-view-toggle';
import {
    fetchSmtpSettings,
    sendSmtpTestEmail,
} from '../settings/smtp/smtp-api';
import type { SmtpConnection, SmtpSettingsPayload } from '../settings/smtp/types';
import SmtpEmailLogPanel from './smtp-email-log-panel';
import SmtpAlertsPanel, { type SmtpAlertsSettings } from './smtp-alerts-panel';
import SmtpUnsavedChangesDialog from './smtp-unsaved-changes-dialog';
import EmailTestIcon from '../../../components/icons/email-test';
import SendIcon from '../../../components/icons/send';
import TrashIcon from '@doublescale/shared/icons/trash';
import Editor from '@/components/editor';
import { htmlEditorHasMeaningfulContent } from '@/components/editor/utils';

function escapeHtmlForEditor(text: string): string {
    return text
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}

function plainToSimpleHtml(plain: string): string {
    const t = plain.trim();
    if (!t) {
        return '';
    }
    return `<p>${escapeHtmlForEditor(t).replace(/\n/g, '<br>')}</p>`;
}

const SmtpPage: React.FC = () => {
    const { tab } = useParams<{ tab?: string }>();
    const navigate = useNavigate();
    const smtpOn = config.isModuleEnabled('smtp');

    const [alertsDirty, setAlertsDirty] = useState(false);
    const [alertsSaving, setAlertsSaving] = useState(false);
    const [alertsDraft, setAlertsDraft] = useState<SmtpAlertsSettings | null>(null);
    /** SmtpAlertsPanel writes its save function here so this component can call it. */
    const alertsSaveRef = useRef<(() => Promise<void>) | null>(null);
    const [leaveConfirmOpen, setLeaveConfirmOpen] = useState(false);
    const [pendingSection, setPendingSection] = useState<string | null>(null);
    const prevSectionRef = useRef('settings');
    const skipGuardRef = useRef(false);
    const emailTestSendRef = useRef<(() => Promise<void>) | null>(null);
    const [emailTestSending, setEmailTestSending] = useState(false);
    const [emailTestCanSend, setEmailTestCanSend] = useState(false);
    const settingsAddConnectionRef = useRef<(() => void) | null>(null);
    const [smtpConnectionsView, setSmtpConnectionsView] = useState<'table' | 'card'>('table');
    const logRefreshRef = useRef<(() => Promise<void>) | null>(null);
    const logDeleteSelectedRef = useRef<(() => void) | null>(null);
    const [logLoading, setLogLoading] = useState(false);
    const [logSelectedCount, setLogSelectedCount] = useState(0);

    const getSectionPath = useCallback((sub: string) => {
        return `smtp/${sub}`;
    }, []);

    const section =
        !tab || tab === 'home' || tab === 'debug' ? 'settings' : tab;

    useEffect(() => {
        if (!smtpOn) {
            return;
        }
        if (!tab || tab === 'home' || tab === 'debug') {
            navigate(getToLink('smtp/settings'), { replace: true });
        }
    }, [smtpOn, tab, navigate]);

    useEffect(() => {
        const prevSection = prevSectionRef.current;

        if (skipGuardRef.current) {
            skipGuardRef.current = false;
            prevSectionRef.current = section;
            return;
        }

        if (prevSection === 'alerts' && section !== 'alerts' && alertsDirty) {
            setPendingSection(section);
            setLeaveConfirmOpen(true);
            skipGuardRef.current = true;
            navigate(getToLink(getSectionPath('alerts')), { replace: true });
            prevSectionRef.current = 'alerts';
            return;
        }

        prevSectionRef.current = section;
    }, [alertsDirty, getSectionPath, navigate, section]);

    const headerActions =
        section === 'alerts'
            ? [
                {
                    label: alertsSaving ? 'Saving...' : 'Save settings',
                    onClick: () => void alertsSaveRef.current?.(),
                    disabled: !alertsDirty || alertsSaving,
                    className:
                        'bg-brandPrimary hover:bg-brandPrimary text-white',
                },
            ]
            : section === 'email-test'
                ? [
                    {
                        label: emailTestSending ? 'Sending...' : 'Send test email',
                        onClick: () => void emailTestSendRef.current?.(),
                        disabled: emailTestSending || !emailTestCanSend,
                        icon: (
                            <SendIcon />
                        ),
                        className:
                            'bg-brandPrimary hover:bg-brandPrimary text-white',
                    },
                ]
                : section === 'logs'
                    ? [
                        {
                            label: sprintf(
                                __('Delete selected (%d)', 'doublescale'),
                                logSelectedCount
                            ),
                            onClick: () => logDeleteSelectedRef.current?.(),
                            variant: 'outline' as const,
                            icon: (
                                <TrashIcon width={24} height={24} />
                            ),
                            className:
                                'text-[#C30A0A] border-[#C30A0A] hover:bg-destructive/10',
                        },
                        {
                            label: logLoading ? 'Loading…' : 'Refresh log',
                            onClick: () => void logRefreshRef.current?.(),
                            disabled: logLoading,
                            variant: 'outline' as const,
                            className:
                                'text-brandPrimary border-brandPrimary hover:bg-brandPrimary/10',
                        },
                    ]
                    : section === 'settings'
                        ? [
                            {
                                label: 'Add connection',
                                onClick: () => settingsAddConnectionRef.current?.(),
                                icon: (
                                    <PlusIcon width={24} height={24} />
                                ),
                                className: 'bg-brandPrimary hover:bg-brandPrimary text-white',
                            },
                        ]
                        : [];

    const handleConfirmLeave = useCallback(() => {
        if (!pendingSection) return;
        setAlertsDirty(false);
        setAlertsDraft(null);
        setLeaveConfirmOpen(false);
        navigate(getToLink(getSectionPath(pendingSection)));
        setPendingSection(null);
    }, [getSectionPath, navigate, pendingSection]);

    if (!smtpOn) {
        return (
            <div className="smtp-hub space-y-6 max-w-3xl">
                <PageHeader
                    title={__('SMTP', 'doublescale')}
                    subtitle={__('Email delivery', 'doublescale')}
                />
                <ModuleDisabledNotice featureName={__('SMTP (built-in)', 'doublescale')} />
            </div>
        );
    }

    return (
        <div className="smtp-hub space-y-6">
            {section === 'settings' ? (
                <div className="mb-6 flex flex-col gap-1">
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                        <div className="flex min-w-0 flex-wrap items-center gap-3">
                            <h1 className="text-2xl font-bold tracking-tight text-foreground">
                                {__('Connections', 'doublescale')}
                            </h1>
                            <ConnectionsViewToggle
                                value={smtpConnectionsView}
                                onChange={setSmtpConnectionsView}
                            />
                        </div>
                        <Button
                            type="button"
                            className="shrink-0 bg-brandPrimary text-white hover:bg-brandPrimary"
                            onClick={() => settingsAddConnectionRef.current?.()}
                        >
                            <span className="btn-icon">
                                <PlusIcon width={24} height={24} />
                            </span>
                            {__('Add connection', 'doublescale')}
                        </Button>
                    </div>
                </div>
            ) : (
                <PageHeader
                    title={__(`${section}`, 'doublescale')}
                    className='capitalize'
                    actions={headerActions}
                />
            )}

            {section === 'settings' && (
                <BuiltinSmtpSettings
                    addConnectionRef={settingsAddConnectionRef}
                    connectionsView={smtpConnectionsView}
                />
            )}
            {section === 'email-test' && (
                <SmtpEmailTest
                    sendRef={emailTestSendRef}
                    onSendingChange={setEmailTestSending}
                    onCanSendChange={setEmailTestCanSend}
                />
            )}
            {section === 'logs' && (
                <SmtpEmailLogPanel
                    refreshRef={logRefreshRef}
                    deleteSelectedRef={logDeleteSelectedRef}
                    onLogLoadingChange={setLogLoading}
                    onSelectedCountChange={setLogSelectedCount}
                />
            )}
            {section === 'alerts' && (<SmtpAlertsPanel
                onDirtyChange={setAlertsDirty}
                onSavingChange={setAlertsSaving}
                saveRef={alertsSaveRef}
                draftSettings={alertsDraft}
                onSettingsChange={setAlertsDraft}
            />)}

            <SmtpUnsavedChangesDialog
                open={leaveConfirmOpen}
                onOpenChange={(open) => {
                    setLeaveConfirmOpen(open);
                    if (!open) {
                        setPendingSection(null);
                    }
                }}
                onConfirm={handleConfirmLeave}
            />
        </div>
    );
};

const SmtpEmailTest: React.FC<{
    sendRef?: React.MutableRefObject<(() => Promise<void>) | null>;
    onSendingChange?: (sending: boolean) => void;
    onCanSendChange?: (canSend: boolean) => void;
}> = ({ sendRef, onSendingChange, onCanSendChange }) => {
    const adminEmail = config.getAdminEmail();
    const [email, setEmail] = useState(adminEmail || '');
    const [connection, setConnection] = useState('');
    const [isHtml, setIsHtml] = useState(true);
    const [htmlBody, setHtmlBody] = useState('');
    const [plainBody, setPlainBody] = useState('');
    const [sending, setSending] = useState(false);
    const [msg, setMsg] = useState<{ type: 'ok' | 'err'; text: string } | null>(null);
    const [connections, setConnections] = useState<
        Record<string, SmtpConnection>
    >({});

    const connectionIds = useMemo(
        () => Object.keys(connections),
        [connections]
    );

    useEffect(() => {
        let cancelled = false;
        (async () => {
            try {
                const data = (await fetchSmtpSettings()) as SmtpSettingsPayload;
                const c = (data.connections as Record<string, SmtpConnection>) || {};
                const keys = Object.keys(c);
                if (!cancelled) {
                    setConnections(c);
                    setConnection((prev) => prev || keys[0] || '');
                }
            } catch {
                if (!cancelled) setConnections({});
            }
        })();
        return () => {
            cancelled = true;
        };
    }, []);

    const send = async () => {
        if (!email || !connection) {
            setMsg({
                type: 'err',
                text: __('Choose a connection and enter a recipient email.', 'doublescale'),
            });
            return;
        }
        setSending(true);
        setMsg(null);
        try {
            const trimmed = isHtml
                ? htmlEditorHasMeaningfulContent(htmlBody)
                    ? htmlBody.trim()
                    : ''
                : plainBody.trim();
            await sendSmtpTestEmail({
                email,
                connection,
                content_type: isHtml ? 'html' : 'plain',
                ...(trimmed ? { message: trimmed } : {}),
            });
            setMsg({ type: 'ok', text: __('Email sent successfully.', 'doublescale') });
        } catch (e: unknown) {
            const text = getApiErrorMessage(
                e,
                __('Could not send test email.', 'doublescale')
            );
            setMsg({ type: 'err', text });
        } finally {
            setSending(false);
        }
    };

    useEffect(() => {
        sendRef && (sendRef.current = send);
        return () => {
            if (sendRef) {
                sendRef.current = null;
            }
        };
    }, [send, sendRef]);

    useEffect(() => {
        onSendingChange?.(sending);
    }, [onSendingChange, sending]);

    useEffect(() => {
        onCanSendChange?.(connectionIds.length > 0);
    }, [connectionIds.length, onCanSendChange]);

    return (
        <div className="w-full flex flex-col gap-6 min-h-screen p-6 rounded-[20px] bg-background shadow-[0_4px_20px_0_rgba(59,130,246,0.14)]">
            <div className="flex items-start gap-2">
                <EmailTestIcon />
                <div className="space-y-2">
                    <h3 className="text-xl font-semibold leading-8 text-foreground">{__('Test Your Email Configuration', 'doublescale')}</h3>
                    <p className="text-sm font-medium leading-6 text-muted-foreground">
                        {__(
                            'Send a test email to verify your SMTP or API setup and ensure smooth email delivery.',
                            'doublescale'
                        )}
                    </p>
                </div>
            </div>
            <div className="space-y-4">
                {msg && (
                    <Alert variant={msg.type === 'err' ? 'destructive' : 'default'}>
                        <AlertTitle>
                            {msg.type === 'ok' ? __('Sent', 'doublescale') : __('Error', 'doublescale')}
                        </AlertTitle>
                        <AlertDescription>{msg.text}</AlertDescription>
                    </Alert>
                )}
                <div className="grid gap-6 md:grid-cols-2">
                    <div className="space-y-2">
                        <Label className="text-foreground">
                            {__('Default Connection', 'doublescale')} <span className="text-destructive">*</span>
                        </Label>
                        {connectionIds.length === 0 ? (
                            <p className="text-sm text-muted-foreground">
                                {__(
                                    'No connections yet. Add one under Settings.',
                                    'doublescale'
                                )}
                            </p>
                        ) : (
                            <Select value={connection} onValueChange={setConnection}>
                                <SelectTrigger>
                                    <SelectValue placeholder={__('Select…', 'doublescale')} />
                                </SelectTrigger>
                                <SelectContent>
                                    {connectionIds.map((id) => {
                                        const conn = connections[id];
                                        const label =
                                            String(conn?.connection_name || '').trim() || id;
                                        return (
                                            <SelectItem key={id} value={id}>
                                                {label}
                                            </SelectItem>
                                        );
                                    })}
                                </SelectContent>
                            </Select>
                        )}
                    </div>
                    <div className="space-y-2">
                        <Label className="text-foreground" htmlFor="smtp-test-email">
                            {__('Email Address', 'doublescale')} <span className="text-destructive">*</span>
                        </Label>
                        <Input
                            id="smtp-test-email"
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            autoComplete="email"
                            className=' !border-border text-foreground placeholder:text-muted-foreground'
                            placeholder={__('Email Address', 'doublescale')}
                        />
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <Switch
                        id="smtp-test-html"
                        checked={isHtml}
                        onCheckedChange={(checked) => {
                            if (checked === isHtml) {
                                return;
                            }
                            if (checked) {
                                setHtmlBody(plainToSimpleHtml(plainBody));
                            } else {
                                const div = document.createElement('div');
                                div.innerHTML = htmlBody;
                                setPlainBody(div.textContent || '');
                            }
                            setIsHtml(checked);
                        }}
                        className="data-[state=checked]:bg-brandPrimary data-[state=unchecked]:bg-[#E2E2EA]"
                    />
                    <Label className='text-sm font-medium leading-6 text-foreground' htmlFor="smtp-test-html" >
                        {__('HTML Email (Send the email as HTML or plain text.)', 'doublescale')}
                    </Label>
                </div>
                {isHtml ? (
                    <div className="space-y-2">
                        <Label className="text-foreground">{__('Body', 'doublescale')}</Label>
                        <Editor message={htmlBody} onChange={setHtmlBody} />
                        <p className="text-xs text-muted-foreground">
                            {__(
                                'Optional body: leave empty to use the default test message. WordPress sanitizes HTML on send.',
                                'doublescale'
                            )}
                        </p>
                    </div>
                ) : (
                    <div className="space-y-2">
                        <Label className="text-foreground" htmlFor="smtp-test-plain-message">
                            {__('Message (plain text)', 'doublescale')}
                        </Label>
                        <Textarea
                            id="smtp-test-plain-message"
                            value={plainBody}
                            onChange={(e) => setPlainBody(e.target.value)}
                            rows={10}
                            className="min-h-[200px] !border-border text-sm text-foreground placeholder:text-muted-foreground"
                            placeholder={__(
                                'Optional. Leave empty for the default test message.',
                                'doublescale'
                            )}
                        />
                    </div>
                )}
            </div>
        </div>
    );
};

export default SmtpPage;
