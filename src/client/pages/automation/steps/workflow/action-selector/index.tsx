/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { useState, useMemo } from '@wordpress/element';

/**
 * External dependencies
 */
import { X } from 'lucide-react';

/**
 * Internal dependencies
 */
import ActionsGroupRender from './actions-group-render';
import ActionSelectorCard from './action-selector-card';
import './style.scss';
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogOverlay,
} from '@/components/ui/dialog';
import ConfigAPI from '@doublescale/config';
import type { ActionsGroup } from '@doublescale/config';
import {
	AccordingRightIcon,
	CartIcon,
	ContactSMSIcon,
	ContactsIcon,
	CoursesIcon,
	HelpdeskIcon,
	SalesIcon,
	TaskDoneIcon,
	ProjectsIcon,
} from '@doublescale/components';
import {
	Tabs,
	TabsContent,
	TabsList,
	TabsTrigger,
} from '@doublescale/shared/ui/tabs';
import { cn } from '@/lib/utils';

const ACTION_SIDEBAR_ORDER = [
	'modules',
	'ecommerce',
	'lms',
	'wp',
	'membership',
	'send_data',
] as const;

const sectionCardClassName =
	'rounded-xl bg-white shadow-[0_4px_20px_0_rgba(59,130,246,0.08)]';

const nestedSectionClassName =
	'rounded-xl border border-border bg-[#F7F8FA] p-4 lg:p-6';

const normalizeActionGroupsRecord = (
	raw: ActionsGroup[] | Record<string, ActionsGroup> | undefined
): Record<string, ActionsGroup> => {
	if (!raw) {
		return {};
	}
	if (Array.isArray(raw)) {
		return raw.reduce<Record<string, ActionsGroup>>((acc, group, index) => {
			acc[String(index)] = group;
			return acc;
		}, {});
	}
	return raw;
};

interface ActionSelectorProps {
	value: string;
	visible: boolean;
	onClose: () => void;
	onChange: (value: string) => void;
	onSave: (actionKey: string) => void;
}

const ActionSelector: React.FC<ActionSelectorProps> = ({
	onChange,
	value,
	onSave,
	visible,
	onClose,
}) => {
	const [isSaving, setIsSaving] = useState(false);
	const [selectedCategory, setSelectedCategory] = useState('modules');
	const [selectedCategoryTab, setSelectedCategoryTab] = useState('crm');
	const automationActions = ConfigAPI.getAutomationActions();

	const filteredActions = useMemo(() => {
		const next = { ...automationActions };
		const crmGroups = next.modules?.tabs?.crm?.groups;
		if (crmGroups && !Array.isArray(crmGroups)) {
			const { delay, ...restGroups } = crmGroups;
			next.modules = {
				...next.modules,
				tabs: {
					...next.modules.tabs,
					crm: {
						...next.modules.tabs!.crm,
						groups: restGroups,
					},
				},
			};
		}
		return next;
	}, [automationActions]);

	const sidebarCategories = useMemo(
		() =>
			ACTION_SIDEBAR_ORDER.filter(
				(key) => filteredActions[key] !== undefined
			).map((key) => [key, filteredActions[key]] as const),
		[filteredActions]
	);

	const handleActionSelect = async (actionKey: string) => {
		onChange(actionKey);
		setIsSaving(true);
		try {
			await onSave(actionKey);
		} catch (error) {
			console.error(error);
		} finally {
			setIsSaving(false);
		}
	};

	const categoryData = {
		modules: {
			image: (
				<span className="flex h-full w-full items-center justify-center">
					<svg
						xmlns="http://www.w3.org/2000/svg"
						width="24"
						height="24"
						viewBox="0 0 24 24"
						fill="none"
					>
						<path
							d="M12.6127 17.6913C13.0821 16.7261 12.7581 15.982 12.0224 15.3498C11.8901 15.2358 11.7499 15.1303 11.6076 15.0289C10.9244 14.5416 10.2402 14.0559 9.55437 13.5722C8.0457 12.5094 7.36147 11.0238 7.37722 9.21215C7.39875 6.65008 9.21935 4.55747 11.7567 4.10482C13.5458 3.78607 15.1721 4.21142 16.6882 5.14823C17.2222 5.47854 17.7305 5.85032 18.273 6.21791C18.5208 5.71274 18.776 5.19287 19.058 4.61839C19.7134 6.23891 20.3498 7.81323 20.9999 9.42115C19.3164 9.17067 17.6701 8.92596 15.9808 8.67495C16.4298 8.29897 16.8489 7.94819 17.2731 7.5932C17.2605 7.5659 17.2569 7.53701 17.2406 7.52441C16.1977 6.7194 15.1128 6.00156 13.7963 5.70749C11.9552 5.29632 10.0028 6.21843 9.28499 7.85891C8.61283 9.39595 9.04816 11.1551 10.383 12.166C11.0935 12.7037 11.8429 13.1894 12.5675 13.7093C13.1683 14.1404 13.5532 14.7112 13.664 15.4574C13.7774 16.222 13.3069 17.2591 12.6137 17.6913H12.6127Z"
							fill="#3A3A99"
						/>
						<path
							d="M5.7905 18.2957C5.52899 18.8219 5.28008 19.3218 5.03065 19.8207C5.02382 19.8348 5.00492 19.8427 4.96763 19.8732C4.31543 18.3151 3.66638 16.7655 3 15.1733C4.68407 15.417 6.3235 15.6543 8.02805 15.9011C7.57697 16.2656 7.15739 16.6048 6.70631 16.9692C6.88958 17.1079 7.05814 17.2412 7.23196 17.3662C8.18033 18.0478 9.16861 18.6481 10.3323 18.897C12.0274 19.2598 13.5991 18.6775 14.5327 17.2265C15.5399 15.6617 15.2227 13.6001 13.6847 12.4443C12.9799 11.9144 12.2348 11.4381 11.5175 10.924C10.9362 10.5071 10.5376 9.96725 10.4205 9.23733C10.2682 8.28739 10.6563 7.58162 11.382 7.00977C11.1646 7.50023 11.1341 7.98439 11.3836 8.47171C11.6052 8.90493 11.9497 9.22526 12.3361 9.50095C13.0976 10.0439 13.8674 10.5759 14.6341 11.1115C15.8602 11.969 16.4704 13.1873 16.671 14.633C17.0029 17.0202 15.593 19.4562 13.0724 20.3069C11.6608 20.7832 10.2514 20.6813 8.86824 20.1426C7.82482 19.7361 6.88905 19.1506 6.01367 18.4611C5.94593 18.4075 5.87504 18.3577 5.79155 18.2957H5.7905Z"
							fill="#3A3A99"
						/>
					</svg>
				</span>
			),
			description: __(
				'Actions from Contacts, Helpdesk, Sales, Tasks, Projects, Email & Messaging',
				'doublescale'
			),
		},
		support: {
			image: <HelpdeskIcon width={24} height={24} color="#0D9DFC" />,
			description: __(
				'Manage helpdesk tickets and agents',
				'doublescale'
			),
		},
		tasks: {
			image: <TaskDoneIcon width={22} height={22} color="#0D9DFC" />,
			description: __('Create and update CRM tasks', 'doublescale'),
		},
		projects: {
			image: <ProjectsIcon width={22} height={22} color="#0D9DFC" />,
			description: __('Create and update projects', 'doublescale'),
		},
		sales: {
			image: <SalesIcon width={22} height={22} color="#0D9DFC" />,
			description: __(
				'Automate sales documents and deal workflows',
				'doublescale'
			),
		},
		crm: {
			image: <ContactsIcon width={22} height={22} color="#0D9DFC" />,
			description: __(
				'Automate your CRM workflows and tasks',
				'doublescale'
			),
		},
		email: {
			image: (
				<svg
					xmlns="http://www.w3.org/2000/svg"
					width="24"
					height="24"
					viewBox="0 0 24 24"
					fill="none"
				>
					<path
						opacity="0.4"
						d="M17 20.5H7C4 20.5 2 19 2 15.5V8.5C2 5 4 3.5 7 3.5H17C20 3.5 22 5 22 8.5V15.5C22 19 20 20.5 17 20.5Z"
						fill="#0D9DFC"
					/>
					<path
						d="M11.9988 12.87C11.1588 12.87 10.3088 12.61 9.6588 12.08L6.5288 9.57997C6.2088 9.31997 6.14881 8.84997 6.4088 8.52997C6.66881 8.20997 7.13881 8.14997 7.45881 8.40997L10.5888 10.91C11.3488 11.52 12.6388 11.52 13.3988 10.91L16.5288 8.40997C16.8488 8.14997 17.3288 8.19997 17.5788 8.52997C17.8388 8.84997 17.7888 9.32997 17.4588 9.57997L14.3288 12.08C13.6888 12.61 12.8388 12.87 11.9988 12.87Z"
						fill="#0D9DFC"
					/>
				</svg>
			),
			description: __('Send email to users', 'doublescale'),
		},
		message: {
			image: <ContactSMSIcon width={22} height={22} color="#0D9DFC" />,
			description: __('Send message to users', 'doublescale'),
		},
		ecommerce: {
			image: (
				<svg
					xmlns="http://www.w3.org/2000/svg"
					width="24"
					height="24"
					viewBox="0 0 24 24"
					fill="none"
				>
					<path
						d="M14.8251 20.0453C15.5859 20.0453 16.201 19.4302 16.201 18.6694C16.201 17.9086 15.5859 17.2935 14.8251 17.2935C14.0643 17.2935 13.4492 17.9086 13.4492 18.6694C13.4492 19.4302 14.0643 20.0453 14.8251 20.0453Z"
						fill="url(#paint0_linear_2651_86569)"
					/>
					<path
						d="M8.51946 20.0453C9.28025 20.0453 9.89536 19.4302 9.89536 18.6694C9.89536 17.9086 9.28025 17.2935 8.51946 17.2935C7.75866 17.2935 7.14355 17.9086 7.14355 18.6694C7.14355 19.4302 7.75866 20.0453 8.51946 20.0453Z"
						fill="url(#paint1_linear_2651_86569)"
					/>
					<path
						opacity="0.4"
						d="M18.8633 9.21618L18.5477 13.5624C18.4587 14.7441 17.4227 15.7153 16.241 15.7153L7.47572 15.7153C6.1241 15.7153 5.06385 14.5579 5.17716 13.2144L5.74371 6.53722L5.83274 5.42031C5.84892 5.16941 5.76799 4.9347 5.60612 4.75664C5.43615 4.57858 5.20953 4.48146 4.96673 4.48146H3.59082C3.26708 4.48146 3 4.21437 3 3.89063C3 3.56689 3.26708 3.2998 3.59082 3.2998L4.96673 3.2998C5.53327 3.2998 6.08364 3.54261 6.48022 3.95538C6.72303 4.23866 6.8768 4.5624 6.95774 4.91042L15.0756 4.91042C14.7356 5.09657 14.5252 5.4365 14.5252 5.84118C14.5252 6.33488 14.8408 6.73956 15.3022 6.86906L16.0953 7.08758C16.5 7.20089 16.8076 7.50845 16.9209 7.91312L17.1313 8.6982C17.2608 9.18381 17.6655 9.49136 18.1592 9.49136C18.4344 9.49136 18.6772 9.38615 18.8633 9.21618Z"
						fill="url(#paint2_linear_2651_86569)"
					/>
					<path
						d="M15.4067 9.16799C15.4067 9.52411 15.1153 9.81547 14.7592 9.81547H9.32034C8.96422 9.81547 8.67285 9.52411 8.67285 9.16799C8.67285 8.81187 8.96422 8.52051 9.32034 8.52051L14.7592 8.52051C15.1153 8.52051 15.4067 8.81187 15.4067 9.16799Z"
						fill="url(#paint3_linear_2651_86569)"
					/>
					<path
						d="M21.0002 5.85702C21.0002 5.91368 20.9678 6.04317 20.814 6.09173L20.0208 6.31026C19.3329 6.49641 18.8149 7.0144 18.6288 7.70235L18.4183 8.47933C18.3698 8.65739 18.2322 8.67357 18.1674 8.67357C18.1027 8.67357 17.9651 8.65739 17.9165 8.47933L17.7061 7.69425C17.5199 7.0144 16.9939 6.49641 16.314 6.31026L15.5289 6.09983C15.359 6.05127 15.3428 5.90558 15.3428 5.84893C15.3428 5.78418 15.359 5.63849 15.5289 5.58993L16.3221 5.3795C17.002 5.18526 17.5199 4.66727 17.7061 3.98741L17.9327 3.16187C17.9894 3.02428 18.1189 3 18.1674 3C18.216 3 18.3536 3.01619 18.4021 3.14568L18.6288 3.97932C18.8149 4.65918 19.341 5.17716 20.0208 5.37141L20.8302 5.59803C20.9921 5.66278 21.0002 5.80846 21.0002 5.85702Z"
						fill="url(#paint4_linear_2651_86569)"
					/>
					<defs>
						<linearGradient
							id="paint0_linear_2651_86569"
							x1="13.4492"
							y1="18.6694"
							x2="16.201"
							y2="18.6694"
							gradientUnits="userSpaceOnUse"
						>
							<stop stop-color="#3A3A99" />
							<stop offset="1" stop-color="#1B1145" />
						</linearGradient>
						<linearGradient
							id="paint1_linear_2651_86569"
							x1="7.14355"
							y1="18.6694"
							x2="9.89536"
							y2="18.6694"
							gradientUnits="userSpaceOnUse"
						>
							<stop stop-color="#3A3A99" />
							<stop offset="1" stop-color="#1B1145" />
						</linearGradient>
						<linearGradient
							id="paint2_linear_2651_86569"
							x1="3"
							y1="9.50755"
							x2="18.8633"
							y2="9.50755"
							gradientUnits="userSpaceOnUse"
						>
							<stop stop-color="#3A3A99" />
							<stop offset="1" stop-color="#1B1145" />
						</linearGradient>
						<linearGradient
							id="paint3_linear_2651_86569"
							x1="8.67285"
							y1="9.16799"
							x2="15.4067"
							y2="9.16799"
							gradientUnits="userSpaceOnUse"
						>
							<stop stop-color="#3A3A99" />
							<stop offset="1" stop-color="#1B1145" />
						</linearGradient>
						<linearGradient
							id="paint4_linear_2651_86569"
							x1="15.3428"
							y1="5.83679"
							x2="21.0002"
							y2="5.83679"
							gradientUnits="userSpaceOnUse"
						>
							<stop stop-color="#3A3A99" />
							<stop offset="1" stop-color="#1B1145" />
						</linearGradient>
					</defs>
				</svg>
			),
			description: __('E-commerce and order automation', 'doublescale'),
		},
		lms: {
			image: (
				<svg
					width="32"
					height="25"
					viewBox="0 0 32 25"
					fill="none"
					xmlns="http://www.w3.org/2000/svg"
				>
					<path
						d="M2.61414 13V2.92H4.51814V11.222H8.85814V13H2.61414ZM10.0484 13V2.92H11.7564L15.0884 9.612L18.4204 2.92H20.1284V13H18.3504V6.98L15.4244 13H14.7524L11.8264 6.98V13H10.0484ZM25.9013 13.21C25.1546 13.21 24.4803 13.0793 23.8783 12.818C23.2809 12.552 22.7886 12.174 22.4013 11.684C22.0186 11.1893 21.7759 10.6013 21.6733 9.92L23.6613 9.626C23.8013 10.2047 24.0906 10.6503 24.5293 10.963C24.9679 11.2757 25.4673 11.432 26.0273 11.432C26.3399 11.432 26.6433 11.383 26.9373 11.285C27.2313 11.187 27.4716 11.0423 27.6583 10.851C27.8496 10.6597 27.9453 10.424 27.9453 10.144C27.9453 10.0413 27.9289 9.94333 27.8963 9.85C27.8683 9.752 27.8193 9.661 27.7493 9.577C27.6793 9.493 27.5789 9.41367 27.4483 9.339C27.3223 9.26433 27.1613 9.19667 26.9653 9.136L24.3473 8.366C24.1513 8.31 23.9226 8.23067 23.6613 8.128C23.4046 8.02533 23.1549 7.87833 22.9123 7.687C22.6696 7.49567 22.4666 7.24367 22.3033 6.931C22.1446 6.61367 22.0653 6.21467 22.0653 5.734C22.0653 5.05733 22.2356 4.495 22.5763 4.047C22.9169 3.599 23.3719 3.26533 23.9413 3.046C24.5106 2.82667 25.1406 2.71933 25.8313 2.724C26.5266 2.73333 27.1473 2.85233 27.6933 3.081C28.2393 3.30967 28.6966 3.64333 29.0653 4.082C29.4339 4.516 29.6999 5.048 29.8633 5.678L27.8053 6.028C27.7306 5.70133 27.5929 5.426 27.3923 5.202C27.1916 4.978 26.9513 4.80767 26.6713 4.691C26.3959 4.57433 26.1066 4.51133 25.8033 4.502C25.5046 4.49267 25.2223 4.53467 24.9563 4.628C24.6949 4.71667 24.4803 4.84733 24.3123 5.02C24.1489 5.19267 24.0673 5.398 24.0673 5.636C24.0673 5.85533 24.1349 6.035 24.2703 6.175C24.4056 6.31033 24.5759 6.42 24.7813 6.504C24.9866 6.588 25.1966 6.658 25.4113 6.714L27.1613 7.19C27.4226 7.26 27.7119 7.35333 28.0293 7.47C28.3466 7.582 28.6499 7.74067 28.9393 7.946C29.2333 8.14667 29.4736 8.41267 29.6603 8.744C29.8516 9.07533 29.9473 9.49533 29.9473 10.004C29.9473 10.5453 29.8329 11.019 29.6043 11.425C29.3803 11.8263 29.0769 12.16 28.6943 12.426C28.3116 12.6873 27.8776 12.8833 27.3923 13.014C26.9116 13.1447 26.4146 13.21 25.9013 13.21Z"
						fill="url(#paint0_linear_3934_36338)"
					/>
					<path
						d="M0.77647 21.147V14.3705H3.39294C3.45882 14.3705 3.53255 14.3736 3.61412 14.3799C3.69882 14.3831 3.78353 14.3925 3.86823 14.4081C4.22274 14.4615 4.52235 14.5854 4.76706 14.7799C5.0149 14.9713 5.20157 15.2129 5.32706 15.5046C5.45569 15.7964 5.52 16.1195 5.52 16.474C5.52 16.8254 5.45569 17.147 5.32706 17.4387C5.19843 17.7305 5.0102 17.9736 4.76235 18.1681C4.51765 18.3595 4.21961 18.4819 3.86823 18.5352C3.78353 18.5478 3.69882 18.5572 3.61412 18.5634C3.53255 18.5697 3.45882 18.5729 3.39294 18.5729H1.46823V21.147H0.77647ZM1.46823 17.914H3.37412C3.43059 17.914 3.49647 17.9109 3.57176 17.9046C3.64706 17.8983 3.72078 17.8874 3.79294 17.8717C4.0251 17.8215 4.2149 17.7258 4.36235 17.5846C4.51294 17.4434 4.62431 17.2756 4.69647 17.0811C4.77176 16.8866 4.80941 16.6842 4.80941 16.474C4.80941 16.2638 4.77176 16.0615 4.69647 15.867C4.62431 15.6693 4.51294 15.4999 4.36235 15.3587C4.2149 15.2176 4.0251 15.1219 3.79294 15.0717C3.72078 15.056 3.64706 15.0466 3.57176 15.0434C3.49647 15.0372 3.43059 15.034 3.37412 15.034H1.46823V17.914ZM6.55073 21.147V14.2293H7.2425V21.147H6.55073ZM10.5968 21.274C10.2925 21.274 10.0259 21.227 9.79684 21.1329C9.57096 21.0387 9.37801 20.9117 9.21801 20.7517C9.06115 20.5917 8.93409 20.4097 8.83684 20.2058C8.73958 19.9987 8.66899 19.7807 8.62507 19.5517C8.58115 19.3195 8.55919 19.0889 8.55919 18.8599V16.0646H9.25566V18.6576C9.25566 18.9368 9.28233 19.1956 9.33566 19.434C9.38899 19.6725 9.4737 19.8811 9.58978 20.0599C9.70899 20.2356 9.86115 20.3721 10.0462 20.4693C10.2345 20.5666 10.4619 20.6152 10.7286 20.6152C10.9733 20.6152 11.1882 20.5729 11.3733 20.4881C11.5615 20.4034 11.7184 20.2827 11.8439 20.1258C11.9725 19.9658 12.0698 19.7729 12.1357 19.547C12.2015 19.318 12.2345 19.0607 12.2345 18.7752L12.7239 18.8834C12.7239 19.4042 12.6329 19.8419 12.451 20.1964C12.269 20.5509 12.018 20.8191 11.698 21.0011C11.378 21.1831 11.011 21.274 10.5968 21.274ZM12.3051 21.147V19.8952H12.2345V16.0646H12.9263V21.147H12.3051ZM16.2604 23.547C16 23.547 15.7427 23.5078 15.4886 23.4293C15.2376 23.354 15.0055 23.2332 14.7921 23.067C14.5788 22.9038 14.4 22.6905 14.2557 22.427L14.8815 22.0787C15.0227 22.3611 15.2204 22.5634 15.4745 22.6858C15.7317 22.8113 15.9937 22.874 16.2604 22.874C16.6274 22.874 16.9239 22.805 17.1498 22.667C17.3788 22.5321 17.5451 22.3313 17.6486 22.0646C17.7521 21.798 17.8023 21.4654 17.7992 21.067V19.7117H17.8792V16.0646H18.4957V21.0764C18.4957 21.2207 18.491 21.3587 18.4815 21.4905C18.4753 21.6254 18.4612 21.7572 18.4392 21.8858C18.3796 22.2654 18.2557 22.5776 18.0674 22.8223C17.8823 23.067 17.6376 23.2489 17.3333 23.3681C17.0321 23.4874 16.6745 23.547 16.2604 23.547ZM16.2133 21.2881C15.7396 21.2881 15.3349 21.1705 14.9992 20.9352C14.6635 20.6968 14.4062 20.3752 14.2274 19.9705C14.0486 19.5658 13.9592 19.1093 13.9592 18.6011C13.9592 18.096 14.047 17.6411 14.2227 17.2364C14.4015 16.8317 14.6572 16.5117 14.9898 16.2764C15.3223 16.0411 15.7208 15.9234 16.1851 15.9234C16.6619 15.9234 17.0635 16.0395 17.3898 16.2717C17.7161 16.5038 17.9623 16.8223 18.1286 17.227C18.298 17.6285 18.3827 18.0866 18.3827 18.6011C18.3827 19.1062 18.2996 19.5627 18.1333 19.9705C17.967 20.3752 17.7223 20.6968 17.3992 20.9352C17.0761 21.1705 16.6808 21.2881 16.2133 21.2881ZM16.2839 20.6434C16.6447 20.6434 16.9427 20.5556 17.178 20.3799C17.4133 20.2042 17.589 19.9627 17.7051 19.6552C17.8212 19.3446 17.8792 18.9932 17.8792 18.6011C17.8792 18.2027 17.8212 17.8513 17.7051 17.547C17.589 17.2395 17.4133 16.9995 17.178 16.827C16.9459 16.6544 16.6525 16.5681 16.298 16.5681C15.9341 16.5681 15.6329 16.6576 15.3945 16.8364C15.1561 17.0152 14.9788 17.2583 14.8627 17.5658C14.7498 17.8732 14.6933 18.2183 14.6933 18.6011C14.6933 18.987 14.7513 19.3352 14.8674 19.6458C14.9866 19.9532 15.1639 20.1964 15.3992 20.3752C15.6345 20.554 15.9294 20.6434 16.2839 20.6434ZM19.9055 15.0999V14.3234H20.5973V15.0999H19.9055ZM19.9055 21.147V16.0646H20.5973V21.147H19.9055ZM25.6787 21.147V18.554C25.6787 18.2717 25.652 18.0129 25.5987 17.7776C25.5453 17.5391 25.4591 17.3321 25.3399 17.1564C25.2238 16.9776 25.0716 16.8395 24.8834 16.7423C24.6983 16.645 24.4724 16.5964 24.2057 16.5964C23.961 16.5964 23.7446 16.6387 23.5563 16.7234C23.3712 16.8081 23.2144 16.9305 23.0857 17.0905C22.9602 17.2474 22.8646 17.4387 22.7987 17.6646C22.7328 17.8905 22.6999 18.1478 22.6999 18.4364L22.2104 18.3281C22.2104 17.8074 22.3014 17.3697 22.4834 17.0152C22.6653 16.6607 22.9163 16.3925 23.2363 16.2105C23.5563 16.0285 23.9234 15.9376 24.3375 15.9376C24.6418 15.9376 24.9069 15.9846 25.1328 16.0787C25.3618 16.1729 25.5548 16.2999 25.7116 16.4599C25.8716 16.6199 26.0002 16.8034 26.0975 17.0105C26.1948 17.2144 26.2653 17.4325 26.3093 17.6646C26.3532 17.8936 26.3751 18.1227 26.3751 18.3517V21.147H25.6787ZM22.0034 21.147V16.0646H22.6293V17.3164H22.6999V21.147H22.0034ZM29.4928 21.2834C28.8967 21.2834 28.4057 21.1548 28.0199 20.8976C27.6371 20.6403 27.4018 20.2827 27.314 19.8246L28.0199 19.707C28.0951 19.9956 28.2661 20.2262 28.5328 20.3987C28.8026 20.5681 29.1351 20.6529 29.5304 20.6529C29.9163 20.6529 30.2206 20.5729 30.4434 20.4129C30.6661 20.2497 30.7775 20.0285 30.7775 19.7493C30.7775 19.5925 30.7414 19.4654 30.6693 19.3681C30.6002 19.2678 30.4575 19.1752 30.241 19.0905C30.0246 19.0058 29.7014 18.9054 29.2716 18.7893C28.8104 18.6638 28.4497 18.5383 28.1893 18.4129C27.9289 18.2874 27.7438 18.1431 27.634 17.9799C27.5242 17.8136 27.4693 17.6113 27.4693 17.3729C27.4693 17.0842 27.5508 16.8317 27.714 16.6152C27.8771 16.3956 28.103 16.2262 28.3916 16.107C28.6802 15.9846 29.0159 15.9234 29.3987 15.9234C29.7814 15.9234 30.1234 15.9862 30.4246 16.1117C30.7289 16.234 30.9736 16.4066 31.1587 16.6293C31.3438 16.8521 31.4536 17.1109 31.4881 17.4058L30.7822 17.5329C30.7351 17.2348 30.5861 16.9995 30.3351 16.827C30.0873 16.6513 29.772 16.5603 29.3893 16.554C29.0285 16.5446 28.7351 16.6136 28.5093 16.7611C28.2834 16.9054 28.1704 17.0983 28.1704 17.3399C28.1704 17.4748 28.2112 17.5909 28.2928 17.6881C28.3744 17.7823 28.5218 17.8717 28.7351 17.9564C28.9516 18.0411 29.2591 18.1336 29.6575 18.234C30.125 18.3532 30.492 18.4787 30.7587 18.6105C31.0253 18.7423 31.2151 18.8976 31.3281 19.0764C31.441 19.2552 31.4975 19.4764 31.4975 19.7399C31.4975 20.2199 31.3187 20.598 30.961 20.874C30.6065 21.147 30.1171 21.2834 29.4928 21.2834Z"
						fill="url(#paint1_linear_3934_36338)"
					/>
					<defs>
						<linearGradient
							id="paint0_linear_3934_36338"
							x1="1"
							y1="8"
							x2="31"
							y2="8"
							gradientUnits="userSpaceOnUse"
						>
							<stop offset="0.610577" stop-color="#3a3a99" />
							<stop offset="1" stop-color="#1B1145" />
						</linearGradient>
						<linearGradient
							id="paint1_linear_3934_36338"
							x1="0"
							y1="17.647"
							x2="32"
							y2="17.647"
							gradientUnits="userSpaceOnUse"
						>
							<stop offset="0.610577" stop-color="#3a3a99" />
							<stop offset="1" stop-color="#1B1145" />
						</linearGradient>
					</defs>
				</svg>
			),
			description: __(
				'Learning management system automation',
				'doublescale'
			),
		},
		wp: {
			image: (
				<svg
					xmlns="http://www.w3.org/2000/svg"
					width="24"
					height="24"
					viewBox="0 0 24 24"
					fill="none"
				>
					<path
						d="M4.27125 12C4.27125 15.0656 6.03187 17.7066 8.6025 18.9457L4.95638 8.86969C4.53281 9.84788 4.27125 10.8919 4.27125 12ZM17.2172 11.6085C17.2172 10.6635 16.8583 9.97725 16.5647 9.489C16.1732 8.8365 15.8149 8.31506 15.8149 7.66313C15.8149 6.94594 16.3695 6.29344 17.1199 6.29344H17.2177C15.8475 5.02163 14.0216 4.27125 12 4.27125C10.7209 4.28257 9.46406 4.6064 8.33877 5.21454C7.21348 5.82267 6.25391 6.69667 5.54362 7.76044H6.033C6.84863 7.76044 8.08725 7.66256 8.08725 7.66256C8.51137 7.62994 8.544 8.24925 8.1525 8.31506C8.1525 8.31506 7.72837 8.38031 7.27219 8.38031L10.0768 16.7278L11.7722 11.6732L10.5656 8.37975L9.75 8.31562C9.32587 8.283 9.39112 7.66313 9.78262 7.66313C9.78262 7.66313 11.0539 7.761 11.8043 7.761C12.6199 7.761 13.8585 7.66313 13.8585 7.66313C14.2826 7.6305 14.3153 8.24981 13.9237 8.31562C13.9237 8.31562 13.4996 8.38088 13.0434 8.38088L15.8475 16.6969L16.635 14.1206C16.9613 13.0446 17.2217 12.2948 17.2217 11.6096L17.2172 11.6085ZM12.1305 12.6846L9.81525 19.4025C10.4998 19.5982 11.2496 19.7288 12 19.7288C12.9129 19.7288 13.7606 19.56 14.5763 19.3046C14.5436 19.272 14.5436 19.2394 14.511 19.2068L12.1305 12.6846ZM18.7826 8.31562L18.8479 9.10313C18.8479 9.89062 18.7174 10.7664 18.2612 11.8751L15.9133 18.6904C18.1959 17.3533 19.7608 14.8749 19.7608 12.0056C19.7282 10.6686 19.3693 9.42938 18.7821 8.32125L18.7826 8.31562ZM12 3C7.04325 3 3 7.04325 3 12C3 16.9567 7.04325 21 12 21C16.9567 21 21 16.9567 21 12C21 7.04325 16.9567 3 12 3ZM12 20.6085C7.27163 20.6085 3.42413 16.761 3.42413 12C3.4277 9.72663 4.33237 7.5474 5.93988 5.93988C7.5474 4.33237 9.72663 3.4277 12 3.42413C14.2734 3.4277 16.4526 4.33237 18.0601 5.93988C19.6676 7.5474 20.5723 9.72663 20.5759 12C20.5759 16.761 16.7284 20.6085 12 20.6085Z"
						fill="#00749A"
					/>
				</svg>
			),
			description: __(
				'WordPress user and content automation',
				'doublescale'
			),
		},
		membership: {
			image: (
				<svg
					width="24"
					height="24"
					viewBox="0 0 24 24"
					fill="none"
					xmlns="http://www.w3.org/2000/svg"
				>
					<path
						opacity="0.4"
						d="M17 2H7C4.24 2 2 4.24 2 7V17C2 19.76 4.24 22 7 22H17C19.76 22 22 19.76 22 17V7C22 4.24 19.76 2 17 2Z"
						fill="url(#paint0_linear_membership_trigger)"
					/>
					<path
						d="M15.5 9.75H8.5C8.09 9.75 7.75 9.41 7.75 9C7.75 8.59 8.09 8.25 8.5 8.25H15.5C15.91 8.25 16.25 8.59 16.25 9C16.25 9.41 15.91 9.75 15.5 9.75Z"
						fill="url(#paint1_linear_membership_trigger)"
					/>
					<path
						d="M12 12.75C10.9 12.75 10 11.85 10 10.75V7.25C10 6.15 10.9 5.25 12 5.25C13.1 5.25 14 6.15 14 7.25V10.75C14 11.85 13.1 12.75 12 12.75Z"
						fill="url(#paint2_linear_membership_trigger)"
					/>
					<path
						d="M17 15.75H7C6.59 15.75 6.25 15.41 6.25 15C6.25 14.59 6.59 14.25 7 14.25H17C17.41 14.25 17.75 14.59 17.75 15C17.75 15.41 17.41 15.75 17 15.75Z"
						fill="url(#paint3_linear_membership_trigger)"
					/>
					<path
						d="M14 18.75H10C9.59 18.75 9.25 18.41 9.25 18C9.25 17.59 9.59 17.25 10 17.25H14C14.41 17.25 14.75 17.59 14.75 18C14.75 18.41 14.41 18.75 14 18.75Z"
						fill="url(#paint4_linear_membership_trigger)"
					/>
					<defs>
						<linearGradient
							id="paint0_linear_membership_trigger"
							x1="2"
							y1="12"
							x2="22"
							y2="12"
							gradientUnits="userSpaceOnUse"
						>
							<stop offset="0.610577" stopColor="#3a3a99" />
							<stop offset="1" stopColor="#1B1145" />
						</linearGradient>
						<linearGradient
							id="paint1_linear_membership_trigger"
							x1="7.75"
							y1="9"
							x2="16.25"
							y2="9"
							gradientUnits="userSpaceOnUse"
						>
							<stop offset="0.610577" stopColor="#3a3a99" />
							<stop offset="1" stopColor="#1B1145" />
						</linearGradient>
						<linearGradient
							id="paint2_linear_membership_trigger"
							x1="10"
							y1="9"
							x2="14"
							y2="9"
							gradientUnits="userSpaceOnUse"
						>
							<stop offset="0.610577" stopColor="#3a3a99" />
							<stop offset="1" stopColor="#1B1145" />
						</linearGradient>
						<linearGradient
							id="paint3_linear_membership_trigger"
							x1="6.25"
							y1="15"
							x2="17.75"
							y2="15"
							gradientUnits="userSpaceOnUse"
						>
							<stop offset="0.610577" stopColor="#3a3a99" />
							<stop offset="1" stopColor="#1B1145" />
						</linearGradient>
						<linearGradient
							id="paint4_linear_membership_trigger"
							x1="9.25"
							y1="18"
							x2="14.75"
							y2="18"
							gradientUnits="userSpaceOnUse"
						>
							<stop offset="0.610577" stopColor="#3a3a99" />
							<stop offset="1" stopColor="#1B1145" />
						</linearGradient>
					</defs>
				</svg>
			),
			description: __(
				'Membership and subscription automation',
				'doublescale'
			),
		},
		send_data: {
			image: (
				<svg
					xmlns="http://www.w3.org/2000/svg"
					width="32"
					height="32"
					viewBox="0 0 32 32"
					fill="none"
				>
					<path
						d="M20.9517 5.73307C21.4675 6.25871 21.4593 7.1029 20.9337 7.6186L8.89369 19.3996C8.39444 19.8991 7.90992 20.3839 7.48839 20.7082C7.09875 21.0079 6.22225 21.5995 5.22425 21.212C4.22625 20.8247 4.06604 19.8307 4.02308 19.363C3.9766 18.857 4.00925 18.1969 4.04288 17.5167L4.10663 16.222C4.13914 15.5586 4.17084 14.9116 4.26593 14.4094C4.35559 13.9358 4.61021 12.9635 5.61277 12.5081C6.63081 12.0457 7.45443 12.5502 7.8266 12.8219C8.2174 13.1072 8.65453 13.5445 9.09895 13.9892L9.85843 14.7487L19.0663 5.71506C19.5919 5.19936 20.436 5.20742 20.9517 5.73307Z"
						fill="url(#paint0_linear_2674_34810)"
					/>
					<path
						opacity="0.4"
						d="M11.0486 26.2671C10.5329 25.7415 10.5409 24.8973 11.0666 24.3816L23.1066 12.6005C23.6058 12.101 24.0904 11.6163 24.5119 11.292C24.9015 10.9923 25.778 10.4007 26.776 10.7881C27.774 11.1755 27.9343 12.1695 27.9772 12.6372C28.0236 13.1431 27.9911 13.8032 27.9574 14.4834L27.8936 15.7782C27.8611 16.4415 27.8295 17.0885 27.7344 17.5908C27.6447 18.0644 27.39 19.0367 26.3875 19.492C25.3695 19.9544 24.5459 19.45 24.1736 19.1783C23.783 18.8929 23.3458 18.4556 22.9014 18.011L22.1419 17.2515L12.9341 26.2851C12.4084 26.8008 11.5643 26.7928 11.0486 26.2671Z"
						fill="url(#paint1_linear_2674_34810)"
					/>
					<defs>
						<linearGradient
							id="paint0_linear_2674_34810"
							x1="4"
							y1="13.3365"
							x2="21.3333"
							y2="13.3365"
							gradientUnits="userSpaceOnUse"
						>
							<stop stop-color="#3A3A99" />
							<stop offset="1" stop-color="#1B1145" />
						</linearGradient>
						<linearGradient
							id="paint1_linear_2674_34810"
							x1="10.667"
							y1="18.6637"
							x2="28.0003"
							y2="18.6637"
							gradientUnits="userSpaceOnUse"
						>
							<stop stop-color="#3A3A99" />
							<stop offset="1" stop-color="#1B1145" />
						</linearGradient>
					</defs>
				</svg>
			),
			description: __('Send data to external services', 'doublescale'),
		},
	};

	const currentCategoryData = filteredActions[selectedCategory];

	const categoryTabs = useMemo(() => {
		const tabs = currentCategoryData?.tabs;
		if (!tabs || typeof tabs !== 'object') {
			return [];
		}
		return Object.entries(tabs).map(([key, tab]) => ({
			key,
			label: tab.label,
			groups: normalizeActionGroupsRecord(tab.groups),
			is_disabled: !!(tab as { is_disabled?: boolean }).is_disabled,
		}));
	}, [currentCategoryData]);

	const actionGroupsForCategory = useMemo((): Record<string, ActionsGroup> => {
		if (categoryTabs.length > 0) {
			const activeTab =
				categoryTabs.find((tab) => tab.key === selectedCategoryTab) ??
				categoryTabs[0];
			return activeTab?.groups ?? {};
		}

		return normalizeActionGroupsRecord(currentCategoryData?.groups);
	}, [categoryTabs, currentCategoryData, selectedCategoryTab]);

	const handleCategorySelect = (categoryKey: string) => {
		setSelectedCategory(categoryKey);
		const tabs = filteredActions[categoryKey]?.tabs;
		if (tabs && typeof tabs === 'object') {
			const firstTab = Object.keys(tabs)[0];
			if (firstTab) {
				setSelectedCategoryTab(firstTab);
			}
		}
	};

	return (
		<Dialog open={visible} onOpenChange={(open) => !open && onClose()}>
			<DialogOverlay className="z-[150200]" />
			<DialogContent
				className="left-0 top-0 z-[150200] flex h-[100dvh] w-screen max-w-none translate-x-0 translate-y-0 flex-col overflow-hidden gap-0 rounded-none border-0 bg-[#f7f8fa] p-0 shadow-none"
				hideCloseButton
			>
				<DialogHeader className="shrink-0 space-y-0 border-b border-[#E8ECF0] bg-white px-4 py-4 lg:px-6">
					<nav
						className="flex w-full min-w-0 items-center justify-between gap-2"
						aria-label={__('Breadcrumb', 'doublescale')}
					>
						<div className="flex min-w-0 items-center gap-1.5">
							<button
								type="button"
								className="shrink-0 cursor-pointer text-base font-medium leading-7 text-foreground transition-colors hover:text-secondary"
								onClick={onClose}
							>
								{__('Workflow', 'doublescale')}
							</button>
							<AccordingRightIcon
								width={20}
								height={20}
								color="hsl(var(--foreground))"
							/>
							<span className="truncate text-base font-medium leading-7 text-muted-foreground">
								{__('Action Library', 'doublescale')}
							</span>
						</div>
						<button
							type="button"
							className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-md text-[#101828] opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
							onClick={onClose}
							aria-label={__('Close', 'doublescale')}
						>
							<X className="h-6 w-6" />
						</button>
					</nav>
				</DialogHeader>

				<div className="min-h-0 flex-1 overflow-y-auto bg-[#F7F8FA] px-4 py-4 lg:px-6 lg:py-6">
					<div
						className={`${sectionCardClassName} flex w-full flex-col gap-4 p-4 lg:gap-6 lg:p-6`}
					>
						<section
							className={`${nestedSectionClassName} flex min-w-0 flex-col gap-4`}
						>
							<h2 className="text-base font-semibold text-foreground sm:text-lg">
								{__('Choose Action', 'doublescale')}
							</h2>

							<div className="grid grid-cols-1 gap-4 lg:grid-cols-[280px_1fr] lg:gap-6">
								<ActionSelectorCard
									sidebarCategories={sidebarCategories}
									selectedCategory={selectedCategory}
									setSelectedCategory={handleCategorySelect}
									categoryData={categoryData}
								/>

								<div
									role="tabpanel"
									aria-label={__('Actions', 'doublescale')}
									className="min-w-0 rounded-xl border border-border bg-white p-4 max-h-[calc(100dvh-320px)] min-h-[320px] overflow-y-auto"
								>
									{categoryTabs.length > 0 ? (
										<Tabs
											value={selectedCategoryTab}
											onValueChange={
												setSelectedCategoryTab
											}
											className="flex flex-col gap-4"
										>
											<TabsList className="flex h-auto w-full flex-wrap justify-start gap-3 rounded-lg bg-transparent p-0">
												{categoryTabs.map((tab) => (
													<TabsTrigger
														key={tab.key}
														value={tab.key}
														className={cn(
															'flex items-center whitespace-nowrap rounded-lg border border-border bg-white p-2 text-sm font-normal text-foreground shadow-none data-[state=active]:border-[#EEEEFF] data-[state=active]:bg-[#EEEEFF] data-[state=active]:font-medium data-[state=active]:text-primary data-[state=active]:shadow-none',
															tab.is_disabled &&
																'opacity-60'
														)}
													>
														<span className="truncate">
															{tab.label}
														</span>
														{tab.is_disabled ? (
															<span className="truncate text-[10px] font-normal text-muted-foreground sm:text-xs">
																(
																{__(
																	'Not Available',
																	'doublescale'
																)}
																)
															</span>
														) : null}
													</TabsTrigger>
												))}
											</TabsList>
											{categoryTabs.map((tab) => (
												<TabsContent
													key={tab.key}
													value={tab.key}
													className="mt-0"
												>
													<ActionsGroupRender
														groups={tab.groups}
														onChange={(
															actionKey
														) =>
															handleActionSelect(
																actionKey
															)
														}
														value={value}
														isSaving={isSaving}
													/>
												</TabsContent>
											))}
										</Tabs>
									) : (
										<ActionsGroupRender
											groups={actionGroupsForCategory}
											onChange={(actionKey) =>
												handleActionSelect(actionKey)
											}
											value={value}
											isSaving={isSaving}
										/>
									)}
								</div>
							</div>
						</section>
					</div>
				</div>
			</DialogContent>
		</Dialog>
	);
};

export default ActionSelector;
