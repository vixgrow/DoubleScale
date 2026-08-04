/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';

/**
 * External dependencies
 */
import React, { useState, useMemo, useRef, useEffect } from 'react';
import { map } from 'lodash';

/**
 * Internal dependencies
 */
import ConfigAPI from '@doublescale/config';
import type { TriggersGroup } from '@doublescale/config';
import type { NoticeMessage } from '@doublescale/client';
import {
	CustomDialogHeader,
	Field,
	NoticeBanner,
	GradientAutomationsIcon,
	AutomationsIcon,
	HelpdeskIcon,
	SalesIcon,
	TaskDoneIcon,
	ProjectsIcon,
} from '@doublescale/components';
import { IntegrationsIcon } from '@doublescale/components/icons/index';
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import TriggersGroupRender from './triggers-group-render';
import { Input } from '@doublescale/shared/ui/input';
import { Label } from '@doublescale/shared/ui/label';
import {
	Tabs,
	TabsContent,
	TabsList,
	TabsTrigger,
} from '@doublescale/shared/ui/tabs';

const normalizeTriggerGroups = (
	raw: TriggersGroup[] | Record<string, TriggersGroup> | undefined
): TriggersGroup[] => {
	if (!raw) {
		return [];
	}
	if (Array.isArray(raw)) {
		return raw;
	}
	return Object.values(raw);
};

const groupContainsTrigger = (
	groups: TriggersGroup[] | Record<string, TriggersGroup> | undefined,
	triggerSlug: string
): boolean =>
	normalizeTriggerGroups(groups).some(
		(group) =>
			group?.triggers &&
			Object.prototype.hasOwnProperty.call(group.triggers, triggerSlug)
	);

interface CreateAutomationModalProps {
	visible: boolean;
	isEditAutomation?: boolean;
	isSaving: boolean;
	automation: {
		name: string;
		trigger: string;
	};
	onOk: () => void;
	onCancel: () => void;
	onAutomationChange: (automation: { name: string; trigger: string }) => void;
	onClearError: () => void;
	error?: NoticeMessage | null;
	/**
	 * When true (default), dialog renders inline — works in normal pages.
	 * Set false to portal to document.body when the parent uses transform/overflow
	 * (e.g. React Flow workflow canvas).
	 */
	removePortal?: boolean;
}

const CreateAutomationModal: React.FC<CreateAutomationModalProps> = ({
	visible,
	isEditAutomation = false,
	isSaving,
	automation,
	onOk,
	onCancel,
	onAutomationChange,
	onClearError,
	error,
	removePortal = false,
}) => {
	const automationTriggers = ConfigAPI.getAutomationTriggers();
	const [selectedCategory, setSelectedCategory] = useState('crm');
	const [selectedCategoryTab, setSelectedCategoryTab] =
		useState('woocommerce');
	const noticeBannerRef = useRef<HTMLDivElement>(null);

	const categoryData = {
		booking: {
			image: (
				<svg
					xmlns="http://www.w3.org/2000/svg"
					width="19"
					height="20"
					viewBox="0 0 19 20"
					fill="none"
				>
					<path
						d="M12.6431 2.12414V0.689655C12.6431 0.312644 12.3305 0 11.9534 0C11.5764 0 11.2638 0.312644 11.2638 0.689655V2.06897H5.28681V0.689655C5.28681 0.312644 4.97417 0 4.59716 0C4.22015 0 3.9075 0.312644 3.9075 0.689655V2.12414C1.42474 2.35402 0.220137 3.83448 0.0362291 6.03218C0.0178383 6.29885 0.238528 6.51954 0.495999 6.51954H16.0546C16.3213 6.51954 16.5419 6.28966 16.5144 6.03218C16.3305 3.83448 15.1259 2.35402 12.6431 2.12414Z"
						fill="url(#paint0_linear_34202_54170)"
					/>
					<path
						opacity="0.4"
						d="M16.5517 8.81938V10.4194C16.5517 10.9803 16.0552 11.4125 15.5034 11.3205C15.246 11.2837 14.9793 11.2562 14.7126 11.2562C11.9264 11.2562 9.65517 13.5274 9.65517 16.3136C9.65517 16.7366 9.82069 17.3251 9.9954 17.8585C10.1977 18.4562 9.75632 19.0723 9.12184 19.0723H4.5977C1.37931 19.0723 0 17.2332 0 14.4746V8.81018C0 8.30444 0.413793 7.89062 0.91954 7.89062H15.6322C16.1379 7.89982 16.5517 8.31363 16.5517 8.81938Z"
						fill="url(#paint1_linear_34202_54170)"
					/>
					<path
						d="M5.05626 12.6446C4.81718 12.6446 4.5781 12.5434 4.40339 12.3779C4.23787 12.2032 4.13672 11.9641 4.13672 11.725C4.13672 11.486 4.23787 11.2469 4.40339 11.0722C4.61488 10.8607 4.93672 10.7595 5.24017 10.8239C5.29534 10.8331 5.35051 10.8515 5.40568 10.8791C5.46086 10.8975 5.51603 10.925 5.5712 10.9618C5.61718 10.9986 5.66316 11.0354 5.70913 11.0722C5.87465 11.2469 5.9758 11.486 5.9758 11.725C5.9758 11.9641 5.87465 12.2032 5.70913 12.3779C5.66316 12.4147 5.61718 12.4515 5.5712 12.4883C5.51603 12.525 5.46086 12.5526 5.40568 12.571C5.35051 12.5986 5.29534 12.617 5.24017 12.6262C5.1758 12.6354 5.11143 12.6446 5.05626 12.6446Z"
						fill="url(#paint2_linear_34202_54170)"
					/>
					<path
						d="M8.27501 12.642C8.03593 12.642 7.79685 12.5409 7.62214 12.3754C7.45662 12.2007 7.35547 11.9616 7.35547 11.7225C7.35547 11.4834 7.45662 11.2443 7.62214 11.0696C7.97156 10.7294 8.58765 10.7294 8.92788 11.0696C9.0934 11.2443 9.19455 11.4834 9.19455 11.7225C9.19455 11.9616 9.0934 12.2007 8.92788 12.3754C8.75317 12.5409 8.51409 12.642 8.27501 12.642Z"
						fill="url(#paint3_linear_34202_54170)"
					/>
					<path
						d="M5.05626 15.8615C4.81718 15.8615 4.5781 15.7603 4.40339 15.5948C4.23787 15.4201 4.13672 15.181 4.13672 14.9419C4.13672 14.7029 4.23787 14.4639 4.40339 14.2892C4.49534 14.2064 4.58729 14.1419 4.70683 14.096C5.04706 13.9488 5.45166 14.0317 5.70913 14.2892C5.87465 14.4639 5.9758 14.7029 5.9758 14.9419C5.9758 15.181 5.87465 15.4201 5.70913 15.5948C5.53442 15.7603 5.29534 15.8615 5.05626 15.8615Z"
						fill="url(#paint4_linear_34202_54170)"
					/>
					<path
						opacity="0.4"
						d="M18.3913 16.3206C18.3913 17.0137 18.1932 17.6656 17.8549 18.2184C17.2196 19.2828 16.0562 20.0006 14.7113 20.0006C13.7789 20.0006 12.9373 19.6623 12.2937 19.0848C12.0049 18.8455 11.7573 18.5484 11.5676 18.2184C11.221 17.6656 11.0312 17.0137 11.0312 16.3206C11.0312 16.1721 11.0395 16.0236 11.056 15.8751C11.0725 15.7761 11.089 15.677 11.1055 15.578C11.4521 13.903 12.9373 12.6406 14.7113 12.6406C15.3218 12.6406 15.8912 12.7891 16.3945 13.0532C16.6173 13.1687 16.8318 13.3007 17.0216 13.4657C17.0793 13.507 17.1371 13.5565 17.1866 13.606C17.2856 13.6968 17.3846 13.7958 17.4671 13.8948C18.0365 14.5466 18.3913 15.3965 18.3913 16.3206Z"
						fill="url(#paint5_linear_34202_54170)"
					/>
					<path
						d="M14.3249 17.4368C14.2103 17.4368 14.0958 17.3946 14.0053 17.3041L13.3421 16.6409C13.1672 16.466 13.1672 16.1766 13.3421 16.0018C13.5169 15.8269 13.8063 15.8269 13.9812 16.0018L14.3369 16.3575L15.4524 15.3265C15.6333 15.1576 15.9227 15.1697 16.0915 15.3506C16.2603 15.5315 16.2483 15.8209 16.0674 15.9897L14.6324 17.3162C14.5419 17.4006 14.4334 17.4368 14.3249 17.4368Z"
						fill="url(#paint6_linear_34202_54170)"
					/>
					<defs>
						<linearGradient
							id="paint0_linear_34202_54170"
							x1="0.0351562"
							y1="3.25977"
							x2="16.5167"
							y2="3.25977"
							gradientUnits="userSpaceOnUse"
						>
							<stop offset="0.610577" stop-color="#1E3A8A" />
							<stop offset="1" stop-color="#3B82F6" />
						</linearGradient>
						<linearGradient
							id="paint1_linear_34202_54170"
							x1="0"
							y1="13.4814"
							x2="16.5517"
							y2="13.4814"
							gradientUnits="userSpaceOnUse"
						>
							<stop offset="0.610577" stop-color="#1E3A8A" />
							<stop offset="1" stop-color="#3B82F6" />
						</linearGradient>
						<linearGradient
							id="paint2_linear_34202_54170"
							x1="4.13672"
							y1="11.7246"
							x2="5.9758"
							y2="11.7246"
							gradientUnits="userSpaceOnUse"
						>
							<stop offset="0.610577" stop-color="#1E3A8A" />
							<stop offset="1" stop-color="#3B82F6" />
						</linearGradient>
						<linearGradient
							id="paint3_linear_34202_54170"
							x1="7.35547"
							y1="11.7282"
							x2="9.19455"
							y2="11.7282"
							gradientUnits="userSpaceOnUse"
						>
							<stop offset="0.610577" stop-color="#1E3A8A" />
							<stop offset="1" stop-color="#3B82F6" />
						</linearGradient>
						<linearGradient
							id="paint4_linear_34202_54170"
							x1="4.13672"
							y1="14.9425"
							x2="5.9758"
							y2="14.9425"
							gradientUnits="userSpaceOnUse"
						>
							<stop offset="0.610577" stop-color="#1E3A8A" />
							<stop offset="1" stop-color="#3B82F6" />
						</linearGradient>
						<linearGradient
							id="paint5_linear_34202_54170"
							x1="11.0312"
							y1="16.3206"
							x2="18.3913"
							y2="16.3206"
							gradientUnits="userSpaceOnUse"
						>
							<stop offset="0.610577" stop-color="#1E3A8A" />
							<stop offset="1" stop-color="#3B82F6" />
						</linearGradient>
						<linearGradient
							id="paint6_linear_34202_54170"
							x1="13.2109"
							y1="16.3219"
							x2="16.2109"
							y2="16.3219"
							gradientUnits="userSpaceOnUse"
						>
							<stop offset="0.610577" stop-color="#1E3A8A" />
							<stop offset="1" stop-color="#3B82F6" />
						</linearGradient>
					</defs>
				</svg>
			),
			description: __(
				'Trigger automations based on booking events',
				'doublescale'
			),
		},
		support: {
			image: (
				<HelpdeskIcon width={22} height={22} color="#1E3A8A" />
			),
			description: __(
				'Trigger automations based on helpdesk ticket events',
				'doublescale'
			),
		},
		tasks: {
			image: (
				<TaskDoneIcon width={22} height={22} color="#1E3A8A" />
			),
			description: __(
				'Trigger automations based on task and subtask events',
				'doublescale'
			),
		},
		projects: {
			image: (
				<ProjectsIcon width={22} height={22} color="#1E3A8A" />
			),
			description: __(
				'Trigger automations based on project lifecycle events',
				'doublescale'
			),
		},
		sales: {
			image: (
				<SalesIcon width={22} height={22} color="#1E3A8A" />
			),
			description: __(
				'Trigger automations based on sales document and deal events',
				'doublescale'
			),
		},
		crm: {
			image: (
				<svg
					width="32"
					height="16"
					viewBox="0 0 32 16"
					fill="none"
					xmlns="http://www.w3.org/2000/svg"
				>
					<path
						d="M5.37143 13.21C4.36343 13.21 3.4931 12.9907 2.76043 12.552C2.03243 12.1133 1.4701 11.4997 1.07343 10.711C0.68143 9.92233 0.48543 9.00533 0.48543 7.96C0.48543 6.91467 0.68143 5.99767 1.07343 5.209C1.4701 4.42033 2.03243 3.80667 2.76043 3.368C3.4931 2.92933 4.36343 2.71 5.37143 2.71C6.52876 2.71 7.49943 2.997 8.28343 3.571C9.0721 4.145 9.62743 4.922 9.94943 5.902L8.03143 6.434C7.84476 5.82267 7.52976 5.349 7.08643 5.013C6.6431 4.67233 6.07143 4.502 5.37143 4.502C4.7321 4.502 4.19776 4.64433 3.76843 4.929C3.34376 5.21367 3.0241 5.615 2.80943 6.133C2.59476 6.651 2.48743 7.26 2.48743 7.96C2.48743 8.66 2.59476 9.269 2.80943 9.787C3.0241 10.305 3.34376 10.7063 3.76843 10.991C4.19776 11.2757 4.7321 11.418 5.37143 11.418C6.07143 11.418 6.6431 11.2477 7.08643 10.907C7.52976 10.5663 7.84476 10.0927 8.03143 9.486L9.94943 10.018C9.62743 10.998 9.0721 11.775 8.28343 12.349C7.49943 12.923 6.52876 13.21 5.37143 13.21ZM11.4907 13V2.92H15.7467C15.8447 2.92 15.9754 2.92467 16.1387 2.934C16.3067 2.93867 16.4561 2.95267 16.5867 2.976C17.1887 3.06933 17.6811 3.26767 18.0637 3.571C18.4511 3.87433 18.7357 4.257 18.9177 4.719C19.0997 5.17633 19.1907 5.68733 19.1907 6.252C19.1907 7.09667 18.9807 7.82 18.5607 8.422C18.1407 9.01933 17.4827 9.388 16.5867 9.528L15.7467 9.584H13.3947V13H11.4907ZM17.1747 13L15.1867 8.898L17.1467 8.52L19.3307 13H17.1747ZM13.3947 7.806H15.6627C15.7607 7.806 15.8681 7.80133 15.9847 7.792C16.1014 7.78267 16.2087 7.764 16.3067 7.736C16.5634 7.666 16.7617 7.54933 16.9017 7.386C17.0417 7.218 17.1374 7.03367 17.1887 6.833C17.2447 6.62767 17.2727 6.434 17.2727 6.252C17.2727 6.07 17.2447 5.87867 17.1887 5.678C17.1374 5.47267 17.0417 5.28833 16.9017 5.125C16.7617 4.957 16.5634 4.838 16.3067 4.768C16.2087 4.74 16.1014 4.72133 15.9847 4.712C15.8681 4.70267 15.7607 4.698 15.6627 4.698H13.3947V7.806ZM20.8696 13V2.92H22.5776L25.9096 9.612L29.2416 2.92H30.9496V13H29.1716V6.98L26.2456 13H25.5736L22.6476 6.98V13H20.8696Z"
						fill="url(#paint0_linear_3934_36303)"
					/>
					<defs>
						<linearGradient
							id="paint0_linear_3934_36303"
							x1="0"
							y1="8"
							x2="32"
							y2="8"
							gradientUnits="userSpaceOnUse"
						>
							<stop offset="0.610577" stop-color="#1E3A8A" />
							<stop offset="1" stop-color="#3B82F6" />
						</linearGradient>
					</defs>
				</svg>
			),
			description: __(
				'Automate your CRM workflows and tasks',
				'doublescale'
			),
		},
		forms: {
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
						d="M20.5 10.19H17.61C15.24 10.19 13.31 8.26 13.31 5.89V3C13.31 2.45 12.86 2 12.31 2H8.07C4.99 2 2.5 4 2.5 7.57V16.43C2.5 20 4.99 22 8.07 22H15.93C19.01 22 21.5 20 21.5 16.43V11.19C21.5 10.64 21.05 10.19 20.5 10.19Z"
						fill="url(#paint0_linear_forms)"
					/>
					<path
						d="M15.7997 2.21048C15.3897 1.80048 14.6797 2.08048 14.6797 2.65048V6.14048C14.6797 7.60048 15.9197 8.81048 17.4297 8.81048C18.3797 8.82048 19.6997 8.82048 20.8297 8.82048C21.3997 8.82048 21.6997 8.15048 21.2997 7.75048C19.8597 6.30048 17.2797 3.69048 15.7997 2.21048Z"
						fill="url(#paint1_linear_forms)"
					/>
					<path
						d="M13.5 13.75H7.5C7.09 13.75 6.75 13.41 6.75 13C6.75 12.59 7.09 12.25 7.5 12.25H13.5C13.91 12.25 14.25 12.59 14.25 13C14.25 13.41 13.91 13.75 13.5 13.75Z"
						fill="url(#paint2_linear_forms)"
					/>
					<path
						d="M11.5 17.75H7.5C7.09 17.75 6.75 17.41 6.75 17C6.75 16.59 7.09 16.25 7.5 16.25H11.5C11.91 16.25 12.25 16.59 12.25 17C12.25 17.41 11.91 17.75 11.5 17.75Z"
						fill="url(#paint3_linear_forms)"
					/>
					<defs>
						<linearGradient
							id="paint0_linear_forms"
							x1="2.5"
							y1="12"
							x2="21.5"
							y2="12"
							gradientUnits="userSpaceOnUse"
						>
							<stop offset="0.610577" stopColor="#1E3A8A" />
							<stop offset="1" stopColor="#3B82F6" />
						</linearGradient>
						<linearGradient
							id="paint1_linear_forms"
							x1="14.6797"
							y1="5.41805"
							x2="21.4828"
							y2="5.41805"
							gradientUnits="userSpaceOnUse"
						>
							<stop offset="0.610577" stopColor="#1E3A8A" />
							<stop offset="1" stopColor="#3B82F6" />
						</linearGradient>
						<linearGradient
							id="paint2_linear_forms"
							x1="6.75"
							y1="13"
							x2="14.25"
							y2="13"
							gradientUnits="userSpaceOnUse"
						>
							<stop offset="0.610577" stopColor="#1E3A8A" />
							<stop offset="1" stopColor="#3B82F6" />
						</linearGradient>
						<linearGradient
							id="paint3_linear_forms"
							x1="6.75"
							y1="17"
							x2="12.25"
							y2="17"
							gradientUnits="userSpaceOnUse"
						>
							<stop offset="0.610577" stopColor="#1E3A8A" />
							<stop offset="1" stopColor="#3B82F6" />
						</linearGradient>
					</defs>
				</svg>
			),
			description: __(
				'Trigger actions when forms are submitted',
				'doublescale'
			),
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
							<stop offset="0.610577" stop-color="#1E3A8A" />
							<stop offset="1" stop-color="#3B82F6" />
						</linearGradient>
						<linearGradient
							id="paint1_linear_3934_36338"
							x1="0"
							y1="17.647"
							x2="32"
							y2="17.647"
							gradientUnits="userSpaceOnUse"
						>
							<stop offset="0.610577" stop-color="#1E3A8A" />
							<stop offset="1" stop-color="#3B82F6" />
						</linearGradient>
					</defs>
				</svg>
			),
			description: __(
				'Learning management system automation',
				'doublescale'
			),
		},
		ecommerce: {
			image: (
				<svg
					width="68"
					height="40"
					viewBox="0 0 68 40"
					fill="none"
					xmlns="http://www.w3.org/2000/svg"
				>
					<path
						d="M6.23651 0H60.9343C64.396 0 67.1982 2.80211 67.1982 6.26387V27.1428C67.1982 30.6046 64.396 33.4067 60.9343 33.4067H41.319L44.0114 40L32.1706 33.4067H6.26381C2.80231 33.4067 0.000201614 30.6046 0.000201614 27.1428V6.26387C-0.0273602 2.82968 2.77449 0 6.23651 0Z"
						fill="#9B5C8F"
					/>
					<path
						d="M3.82559 5.71149C4.20805 5.19228 4.78159 4.91928 5.5465 4.86469C6.93981 4.75523 7.73202 5.41067 7.92311 6.83128C8.76991 12.5405 9.69861 17.3756 10.6819 21.3364L16.6641 9.9455C17.2106 8.90734 17.8936 8.36109 18.7131 8.30649C19.9151 8.2246 20.6524 8.98924 20.953 10.6009C21.636 14.2338 22.5101 17.3208 23.548 19.9431C24.2583 13.0049 25.4603 8.00594 27.1539 4.91928C27.5634 4.15438 28.1645 3.77193 28.9567 3.71707C29.5851 3.66273 30.1586 3.85383 30.6776 4.26358C31.1965 4.67333 31.4698 5.19228 31.5244 5.82069C31.5517 6.31234 31.4698 6.72209 31.2514 7.13184C30.1859 9.0987 29.3116 12.404 28.6015 16.9929C27.9188 21.4456 27.6728 24.915 27.8366 27.4008C27.8915 28.0832 27.782 28.6844 27.509 29.2036C27.1809 29.8044 26.6895 30.1323 26.0611 30.1869C25.3508 30.2415 24.6135 29.9139 23.9032 29.1763C21.3628 26.581 19.3413 22.7021 17.8663 17.5394C16.0906 21.0358 14.7794 23.6581 13.9326 25.4063C12.3209 28.4933 10.9552 30.0777 9.80781 30.1596C9.07021 30.2142 8.44206 29.5858 7.89581 28.2749C6.50276 24.6963 5.00025 17.7851 3.38881 7.54159C3.27935 6.83128 3.44314 6.20288 3.82559 5.71149ZM62.5285 10.0001C61.5452 8.2792 60.0973 7.2413 58.158 6.83128C57.6388 6.72209 57.1474 6.66749 56.6828 6.66749C54.0605 6.66749 51.9298 8.03324 50.2635 10.765C48.8429 13.0868 48.1328 15.6545 48.1328 18.4681C48.1328 20.5715 48.5699 22.3743 49.444 23.8768C50.4273 25.5977 51.8752 26.6356 53.8145 27.0453C54.3335 27.1548 54.8251 27.2094 55.2897 27.2094C57.9393 27.2094 60.07 25.8437 61.709 23.1119C63.1293 20.7626 63.8396 18.1949 63.8396 15.3815C63.8669 13.2508 63.4026 11.475 62.5285 10.0001ZM59.0867 17.5667C58.7042 19.3695 58.0212 20.708 57.0104 21.6094C56.2184 22.3197 55.4808 22.62 54.7981 22.4835C54.1424 22.347 53.5958 21.7734 53.1864 20.708C52.8582 19.8612 52.6947 19.0144 52.6947 18.2222C52.6947 17.5394 52.7493 16.8564 52.8858 16.2283C53.1318 15.1082 53.5961 14.0155 54.3335 12.9776C55.2351 11.6388 56.1911 11.0929 57.1744 11.284C57.8301 11.4204 58.3766 11.9943 58.7861 13.0595C59.114 13.9063 59.2778 14.7531 59.2778 15.5453C59.2778 16.2556 59.2232 16.9386 59.0867 17.5667ZM45.4284 10.0001C44.4451 8.2792 42.9699 7.2413 41.0579 6.83128C40.5389 6.72209 40.0473 6.66749 39.5827 6.66749C36.9603 6.66749 34.8297 8.03324 33.1634 10.765C31.743 13.0868 31.0327 15.6545 31.0327 18.4681C31.0327 20.5715 31.4698 22.3743 32.3439 23.8768C33.3272 25.5977 34.7751 26.6356 36.7144 27.0453C37.2336 27.1548 37.725 27.2094 38.1896 27.2094C40.8392 27.2094 42.9699 25.8437 44.6089 23.1119C46.0295 20.7626 46.7395 18.1949 46.7395 15.3815C46.7395 13.2508 46.3025 11.475 45.4284 10.0001ZM41.9593 17.5667C41.5768 19.3695 40.8938 20.708 39.8832 21.6094C39.091 22.3197 38.3534 22.62 37.6704 22.4835C37.0149 22.347 36.4687 21.7734 36.0587 20.708C35.7311 19.8612 35.5673 19.0144 35.5673 18.2222C35.5673 17.5394 35.6219 16.8564 35.7584 16.2283C36.0043 15.1082 36.4687 14.0155 37.2063 12.9776C38.1077 11.6388 39.0637 11.0929 40.047 11.284C40.7027 11.4204 41.2492 11.9943 41.6587 13.0595C41.9868 13.9063 42.1504 14.7531 42.1504 15.5453C42.1779 16.2556 42.0958 16.9386 41.9593 17.5667Z"
						fill="white"
					/>
				</svg>
			),
			description: __('E-commerce and order automation', 'doublescale'),
		},
		wp: {
			image: (
				<svg
					width="40"
					height="40"
					viewBox="0 0 40 40"
					fill="none"
					xmlns="http://www.w3.org/2000/svg"
				>
					<path
						d="M20.0003 39.9994C8.91686 39.9994 -0.0830149 31.166 0.000577643 19.9997C0.0841702 8.83347 8.50046 0 20.0003 0C31.5009 0 40 8.99987 40 19.9997C40 30.9996 31.0837 39.9994 20.0003 39.9994ZM25.9166 36.9159L20.2503 21.6661L14.9168 37.2495C18.8339 38.1666 21.5003 38.4159 25.9166 36.9159ZM12.084 36.0831L3.58412 12.8334C2.41695 15.3334 2.16773 17.4169 2.00055 19.9997C2.08414 26.8324 5.9169 33.0823 12.084 36.0831ZM37.9172 19.9997C38 15.5834 36.0008 12.0834 35.8337 11.5834C36.0008 15.0006 35.5001 16.7498 34.9173 18.6669L29.0837 35.4167C36.4172 30.9996 37.8328 24.4161 38 19.9997H37.9172ZM19.4175 19.2497L16.5839 11.4998L14.5004 11.3334C13.6676 10.7498 14.1668 9.83345 14.7504 9.83345C18.5003 10.0834 20.5831 10.0834 24.3338 9.83345C25.251 9.83345 25.5002 11.167 24.4166 11.3334L22.4167 11.4998L28.9158 30.666L31.9986 20.1661C32.1657 15.5834 30.915 15.0834 29.2486 11.7498C27.915 9.16628 29.3322 6.66631 31.9157 6.5835C29.8314 4.58353 25.5822 2.08356 19.9987 1.99997C14.4152 1.91638 8.49889 4.74993 4.99894 10.0834L11.166 9.91705C11.916 10.2506 11.5824 11.3334 11.166 11.417L8.99967 11.5834L15.4996 31.0832L19.4175 19.2497Z"
						fill="#21759B"
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
							<stop
								offset="0.610577"
								stopColor="#1E3A8A"
							/>
							<stop offset="1" stopColor="#3B82F6" />
						</linearGradient>
						<linearGradient
							id="paint1_linear_membership_trigger"
							x1="7.75"
							y1="9"
							x2="16.25"
							y2="9"
							gradientUnits="userSpaceOnUse"
						>
							<stop
								offset="0.610577"
								stopColor="#1E3A8A"
							/>
							<stop offset="1" stopColor="#3B82F6" />
						</linearGradient>
						<linearGradient
							id="paint2_linear_membership_trigger"
							x1="10"
							y1="9"
							x2="14"
							y2="9"
							gradientUnits="userSpaceOnUse"
						>
							<stop
								offset="0.610577"
								stopColor="#1E3A8A"
							/>
							<stop offset="1" stopColor="#3B82F6" />
						</linearGradient>
						<linearGradient
							id="paint3_linear_membership_trigger"
							x1="6.25"
							y1="15"
							x2="17.75"
							y2="15"
							gradientUnits="userSpaceOnUse"
						>
							<stop
								offset="0.610577"
								stopColor="#1E3A8A"
							/>
							<stop offset="1" stopColor="#3B82F6" />
						</linearGradient>
						<linearGradient
							id="paint4_linear_membership_trigger"
							x1="9.25"
							y1="18"
							x2="14.75"
							y2="18"
							gradientUnits="userSpaceOnUse"
						>
							<stop
								offset="0.610577"
								stopColor="#1E3A8A"
							/>
							<stop offset="1" stopColor="#3B82F6" />
						</linearGradient>
					</defs>
				</svg>
			),
			description: __('Membership and subscription automation', 'doublescale'),
		},
		video: {
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
						d="M22 15V9C22 4 20 2 15 2H9C4 2 2 4 2 9V15C2 20 4 22 9 22H15C20 22 22 20 22 15Z"
						fill="url(#paint0_linear_video)"
					/>
					<path
						d="M9.1001 12.0001V10.5201C9.1001 8.61012 10.4501 7.84012 12.1001 8.79012L13.3801 9.53012L14.6601 10.2701C16.3101 11.2201 16.3101 12.7801 14.6601 13.7301L13.3801 14.4701L12.1001 15.2101C10.4501 16.1601 9.1001 15.3901 9.1001 13.4801V12.0001Z"
						fill="url(#paint1_linear_video)"
					/>
					<defs>
						<linearGradient
							id="paint0_linear_video"
							x1="2"
							y1="12"
							x2="22"
							y2="12"
							gradientUnits="userSpaceOnUse"
						>
							<stop offset="0.610577" stopColor="#1E3A8A" />
							<stop offset="1" stopColor="#3B82F6" />
						</linearGradient>
						<linearGradient
							id="paint1_linear_video"
							x1="9.1001"
							y1="12"
							x2="16.0001"
							y2="12"
							gradientUnits="userSpaceOnUse"
						>
							<stop offset="0.610577" stopColor="#1E3A8A" />
							<stop offset="1" stopColor="#3B82F6" />
						</linearGradient>
					</defs>
				</svg>
			),
			description: __('Video player automation', 'doublescale'),
		},
	};

	// Get the currently selected category's data
	const currentCategoryData = useMemo(() => {
		return automationTriggers[selectedCategory];
	}, [automationTriggers, selectedCategory]);

	const categoryTabs = useMemo(() => {
		const tabs = currentCategoryData?.tabs;
		if (!tabs || typeof tabs !== 'object') {
			return [];
		}
		return Object.entries(tabs).map(([key, tab]) => ({
			key,
			label: tab.label,
			groups: normalizeTriggerGroups(tab.groups),
		}));
	}, [currentCategoryData]);

	// PHP sends `groups` as an object (associative array). TS types expect an array; normalize for the UI.
	const triggerGroupsForCategory = useMemo((): TriggersGroup[] => {
		if (categoryTabs.length > 0) {
			const activeTab =
				categoryTabs.find((tab) => tab.key === selectedCategoryTab) ??
				categoryTabs[0];
			return activeTab?.groups ?? [];
		}

		return normalizeTriggerGroups(currentCategoryData?.groups);
	}, [currentCategoryData, categoryTabs, selectedCategoryTab]);

	// When editing, switch to the category that contains the saved trigger.
	useEffect(() => {
		if (!visible || !automation.trigger) {
			return;
		}
		for (const [categoryKey, category] of Object.entries(
			automationTriggers
		)) {
			if (category?.tabs && typeof category.tabs === 'object') {
				for (const [tabKey, tab] of Object.entries(category.tabs)) {
					if (groupContainsTrigger(tab.groups, automation.trigger)) {
						setSelectedCategory(categoryKey);
						setSelectedCategoryTab(tabKey);
						return;
					}
				}
				continue;
			}

			if (groupContainsTrigger(category?.groups, automation.trigger)) {
				setSelectedCategory(categoryKey);
				break;
			}
		}
	}, [visible, automation.trigger, automationTriggers]);

	// Scroll to notice banner when error appears
	useEffect(() => {
		if (error && noticeBannerRef.current) {
			noticeBannerRef.current.scrollIntoView({
				behavior: 'smooth',
				block: 'nearest',
			});
		}
	}, [error]);

	return (
		<Dialog open={visible} onOpenChange={(open) => !open && onCancel()}>
			<DialogContent
				className="left-0 top-0 z-[150300] flex h-[100dvh] w-screen max-w-none translate-x-0 translate-y-0 flex-col overflow-hidden gap-0 rounded-none bg-[#fff] p-0 sm:left-[50%] sm:top-[50%] sm:h-auto sm:max-h-[90vh] sm:max-w-[1100px] sm:-translate-x-1/2 sm:-translate-y-1/2 sm:rounded-xl"
				removePortal={removePortal}
			>
				{/* Sticky header */}
				<DialogHeader className="shrink-0 bg-white p-4 sm:p-6">
					<CustomDialogHeader
						title={
							isEditAutomation
								? __('Edit Automation', 'doublescale')
								: __('Create Automation', 'doublescale')
						}
						subtitle={
							isEditAutomation
								? __('Edit Automation', 'doublescale')
								: __('Add New Automation', 'doublescale')
						}
						icon={
							<AutomationsIcon width={24} height={24} color='#3A3A99' />
						}
					/>
				</DialogHeader>

				{/* Scrollable body — light gray surface, 24px gutter around the inner card */}
				<div className="min-h-0 flex-1 overflow-y-auto p-4 pt-0 sm:p-6 sm:pt-0">
					{error && (
						<div className="mb-4">
							<NoticeBanner
								ref={noticeBannerRef}
								notice={error}
								closeNotice={onClearError}
							/>
						</div>
					)}

					<div className="rounded-2xl border border-border bg-[#f7f8fa] p-4 sm:p-6">
						<div className="doublescale-fields doublescale-automation-modal-fields flex flex-col gap-6">
							{/* Row 1 — Automation Name (full width) */}
							<div className="min-w-0 flex flex-col gap-2">
								<Label className="text-base font-normal text-foreground !p-0">
									{__('Automation Name', 'doublescale')}
									<span className="text-destructive">*</span>
								</Label>
								<Input
									value={automation.name}
									onChange={(e) =>
										onAutomationChange({
											...automation,
											name: e.target.value,
										})
									}
								/>
							</div>

							{/* Row 2 — full-width divider */}
							<div
								className="border-t border-neutral-200"
								role="separator"
							/>

							{/* Row 3 — Trigger tabs (left) + Groups list (right) */}
							<div className="doublescale-field min-w-0 flex flex-col gap-3">
								<div className="doublescale-field-label flex items-center gap-1 text-base font-normal text-foreground">
									{__('Trigger', 'doublescale')}
									<span className="text-destructive">*</span>
								</div>

								<div className="grid grid-cols-1 gap-6 md:grid-cols-2">
									{/* Left: vertical list of horizontal trigger tabs */}
									<div
										role="tablist"
										aria-orientation="vertical"
										aria-label={__(
											'Trigger category',
											'doublescale'
										)}
										className="flex flex-col gap-1.5 rounded-xl border border-neutral-200 bg-white p-2 max-h-[480px] overflow-y-auto"
									>
										{map(
											automationTriggers,
											(trigger, key) => {
												const categoryKey = String(key);
												const isActive =
													selectedCategory ===
													categoryKey;
												const meta =
													categoryData[categoryKey];
												return (
													<button
														key={categoryKey}
														type="button"
														role="tab"
														aria-selected={isActive}
														onClick={() => {
															setSelectedCategory(
																categoryKey
															);
															const tabs =
																automationTriggers[
																	categoryKey
																]?.tabs;
															if (
																tabs &&
																typeof tabs ===
																	'object'
															) {
																const firstTab =
																	Object.keys(
																		tabs
																	)[0];
																if (firstTab) {
																	setSelectedCategoryTab(
																		firstTab
																	);
																}
															}
														}}
														className={cn(
															'flex w-full cursor-pointer items-center gap-3 rounded-lg border px-3 py-2 text-left transition-colors',
															'focus:outline-none focus:ring-2 focus:ring-brandPrimary/20',
															isActive
																? 'border-brandPrimary/40 bg-brandPrimary/5'
																: 'border-transparent hover:bg-neutral-50'
														)}
													>
														<span className="flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-md border border-neutral-200 bg-white [&_svg]:max-h-[28px] [&_svg]:max-w-[28px]">
															{meta?.image ?? (
																<IntegrationsIcon
																	width={22}
																	height={22}
																/>
															)}
														</span>
														<span
															className={cn(
																'min-w-0 flex-1 truncate text-sm font-medium',
																isActive
																	? 'text-brandPrimary'
																	: 'text-neutral-800'
															)}
														>
															{trigger.label}
														</span>
													</button>
												);
											}
										)}
									</div>

									{/* Right: trigger groups for selected category */}
									<div
										role="tabpanel"
										aria-label={__(
											'Triggers',
											'doublescale'
										)}
										className="min-w-0 rounded-xl border border-neutral-200 bg-white p-4 max-h-[480px] overflow-y-auto"
									>
										{categoryTabs.length > 0 ? (
											<Tabs
												value={selectedCategoryTab}
												onValueChange={
													setSelectedCategoryTab
												}
												className="flex flex-col gap-4"
											>
												<TabsList className="h-auto w-full flex-wrap justify-start gap-1 bg-neutral-100 p-1">
													{categoryTabs.map(
														(tab) => (
															<TabsTrigger
																key={tab.key}
																value={tab.key}
																className="text-xs sm:text-sm"
															>
																{tab.label}
															</TabsTrigger>
														)
													)}
												</TabsList>
												{categoryTabs.map((tab) => (
													<TabsContent
														key={tab.key}
														value={tab.key}
														className="mt-0"
													>
														<TriggersGroupRender
															groups={
																tab.groups
															}
															value={
																automation.trigger
															}
															onChange={(
																value
															) =>
																onAutomationChange(
																	{
																		...automation,
																		trigger:
																			value,
																	}
																)
															}
														/>
													</TabsContent>
												))}
											</Tabs>
										) : (
											<TriggersGroupRender
												groups={
													triggerGroupsForCategory
												}
												value={automation.trigger}
												onChange={(value) =>
													onAutomationChange({
														...automation,
														trigger: value,
													})
												}
											/>
										)}
									</div>
								</div>
							</div>
						</div>
					</div>
				</div>

				{/* Sticky footer */}
				<DialogFooter className="shrink-0  bg-white px-6 py-4 flex flex-row items-end justify-end gap-6">
					<Button
						type="button"
						variant="secondaryDeepBlue"

						onClick={onCancel}
						disabled={isSaving}
					>
						{__('Cancel', 'doublescale')}
					</Button>
					<Button
						onClick={onOk}
						disabled={isSaving}

					>
						{isSaving
							? isEditAutomation
								? __('Updating...', 'doublescale')
								: __('Creating...', 'doublescale')
							: isEditAutomation
								? __('Update Automation', 'doublescale')
								: __('Create Automation', 'doublescale')}
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
};

export default CreateAutomationModal;
