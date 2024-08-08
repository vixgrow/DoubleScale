export type InitialPayload = {
	// Business Settings
	business: BusinessSettings;
	// Email Settings
	email: EmailSettings;
	// Double Opt-In Settings
	double_optin: DoubleOptInSettings;
	// Any other rest field
	[x: string]: any;
};

type BusinessSettings = {
	business_name: string;
	business_address: string;
};

type EmailSettings = {
	from_name: string;
	from_email: string;
	reply_to: string;
	email_footer: string;
	max_in_second: number;
	max_in_day: number;
};

type DoubleOptInSettings = {
	email_subject: string;
	email_content: string;
	after_confirmation: string;
	confirmation_message: string;
	confirmation_redirect: string;
};
