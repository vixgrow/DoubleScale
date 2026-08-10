/**
 * Which surface the email builder is running on.
 *
 * `campaign` — the standalone campaign screen, with its own breadcrumb and
 * "Save & choose recipients" flow.
 *
 * `embedded` — the builder opened as a modal from somewhere else (the
 * automation "Send Email" action, email sequences). It is handed an `onSave`
 * callback by the host and must not show campaign chrome, because a campaign
 * may still be cached in the store from an earlier screen — showing its
 * breadcrumb there points the user at an unrelated flow.
 */
export type BuilderMode = 'campaign' | 'embedded';

export interface BuilderModeInput {
	/** Present only when a host owns saving — i.e. the embedded builder. */
	hasOnSave: boolean;
	/** Whether a campaign is currently loaded in the store. */
	hasCampaign: boolean;
}

export function getBuilderMode({ hasOnSave }: BuilderModeInput): BuilderMode {
	return hasOnSave ? 'embedded' : 'campaign';
}

/**
 * The campaign breadcrumb is campaign-mode only. A cached campaign is not
 * enough — the embedded builder is layered over a different screen entirely.
 */
export function shouldShowCampaignBreadcrumb(
	input: BuilderModeInput
): boolean {
	return getBuilderMode(input) === 'campaign' && input.hasCampaign;
}

/**
 * Preview is offered on every surface: it renders the live builder content and
 * needs no campaign, subject or from-address context.
 */
export function shouldShowPreviewButton(_input: BuilderModeInput): boolean {
	return true;
}
