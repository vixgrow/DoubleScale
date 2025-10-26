/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import apiFetch from '@wordpress/api-fetch';
import { useEffect, useState } from '@wordpress/element';
import { useDispatch } from '@wordpress/data';

/**
 * External dependencies
 */
import { useReducer, useRef } from 'react';
/**
 * Internal dependencies
 */
import { useParams, useNavigate, getToLink } from '@quillcrm/navigation';
import './style.scss';
import { Provider } from './state/context';
import reducer, { State } from './state/reducer';
import actions from './state/actions';
import { Automation as AutomationType } from '@quillcrm/client';
import Workflow from './steps/workflow';
import Contacts from './steps/contacts';
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { ChevronRight } from 'lucide-react';
import { UndoIcon, RedoIcon, WorkflowIcon, AutomationContactsIcon, AutomationAnalyticsIcon } from '@quillcrm/components';
import { AutomationShimmer } from './automation-shimmer';

const Automation: React.FC = () => {
	const { id } = useParams<{ id: string }>();
	const [state, dispatch] = useReducer(reducer, {
		automation: null,
		steps: [],
		updatedSteps: {},
	} as State);
	const stateRef = useRef<State>(state);
	stateRef.current = state;
	const $actions = actions(dispatch);
	const { setAutomation, setSteps } = $actions;
	const { automation, steps, updatedSteps } = state;
	const [loading, setLoading] = useState<boolean>(true);
	const [isSaving, setIsSaving] = useState<boolean>(false);
	const navigate = useNavigate();
	const { createNotice } = useDispatch('quillcrm/core');

	useEffect(() => {
		fetchAutomation();
	}, [id]);

	const fetchAutomation = async () => {
		setLoading(true);

		try {
			const response = (await apiFetch({
				path: `/qc/v1/automations/${id}`,
			})) as AutomationType;

			setAutomation(response);
			setSteps(response.steps);
		} catch (error) {
			createNotice({
				type: 'error',
				message: __('Failed to fetch automation', 'quillcrm'),
			});
		} finally {
			setLoading(false);
		}
	};

	const saveAutomation = async (data: Partial<AutomationType> = {}) => {
		setIsSaving(true);

		const newAutomation = { ...automation, ...data };

		try {
			const response = (await apiFetch({
				path: `/qc/v1/automations/${newAutomation.id}`,
				method: 'POST',
				data: newAutomation,
			})) as AutomationType;

			setAutomation(response);
			setSteps(response.steps);
		} catch (error) {
			console.error(error);
		} finally {
			setIsSaving(false);
		}
	};

	const [activeTab, setActiveTab] = useState<'workflow' | 'contacts' | 'reports'>(
		'workflow'
	);
	const [open, setOpen] = useState(true);

	useEffect(() => {
		if (activeTab === 'reports') {
			setOpen(false);
			setTimeout(() => {
				navigate(
					getToLink(
						`automations/${automation?.id}/reports`
					)
				);
			}, 100);
		}
	}, [activeTab, automation?.id, navigate]);

	const renderContent = () => {
		switch (activeTab) {
			case 'workflow':
				return <Workflow />;
			case 'contacts':
				return <Contacts />;
			case 'reports':
				return null;
			default:
				return <Workflow />;
		}
	};

	const tabs = [
		{
			id: 'workflow',
			label: __('Workflow', 'quillcrm'),
			icon: WorkflowIcon,
		},
		{
			id: 'contacts',
			label: __('Contacts', 'quillcrm'),
			icon: AutomationContactsIcon,
		},
		{
			id: 'reports',
			label: __('Reports', 'quillcrm'),
			icon: AutomationAnalyticsIcon,
		},
	];

	return (
		<Provider
			value={{
				automation,
				steps,
				updatedSteps,
				isLoading: loading,
				isSaving,
				setIsLoading: setLoading,
				setIsSaving: setIsSaving,
				saveAutomation,
				...$actions,
			}}
		>
			<Dialog
				open={open}
				onOpenChange={(isOpen) => {
					if (!isOpen && open) {
						// Only navigate back if the dialog was closed by clicking outside or escape key
						navigate(getToLink('automations'));
					}
					setOpen(isOpen);
				}}
			>
				<DialogContent
					className="z-[150000] w-screen h-screen max-w-none gap-0 bg-white rounded-none shadow-none"
					style={{
						paddingTop: '10px',
						paddingLeft: '0px',
						paddingRight: '0px',
						paddingBottom: '0px',
					}}
				>
					{loading ? (
						<AutomationShimmer />
					) : (
						<>
							<DialogHeader className="border-b border-[#E4E7EC] pr-14 pl-5 pb-4">
								<DialogTitle>
									<div className="flex items-center justify-between">
										{/* Left section - Undo/Redo buttons */}
										<div className="flex gap-2">
											{activeTab === 'workflow' && (
												<>
													<Button
														variant="outline"
														size="sm"
													>
														<UndoIcon />
													</Button>
													<Button
														variant="outline"
														size="sm"
													>
														<RedoIcon />
													</Button>
												</>
											)}
										</div>

										{/* Middle section - Title */}
										<div className="flex items-center gap-2">
											<span className="text-base text-normal text-[#667085]">
												{__(
													'Create Automation',
													'quillcrm'
												)}
											</span>
											<ChevronRight className="h-4 w-4" />
											<span className="capitalize text-normal text-[#374151]">
												{activeTab === 'workflow'
													? automation?.trigger
													: activeTab}
											</span>
										</div>

										{/* Right section - Save button */}
										<div className="flex gap-2">
											<Button
												variant="default"
												className="px-4 text-base font-normal rounded-lg"
												disabled={isSaving}
												onClick={() =>
													saveAutomation({
														status: 'active',
													})
												}
											>
												{__(
													'Save & Publish',
													'quillcrm'
												)}
											</Button>
										</div>
									</div>
								</DialogTitle>
							</DialogHeader>
							<div className="">
							<div className="flex">
								{/* Left Sidebar */}
								<div className="w-28 border-r border-[#E4E7EC] flex flex-col gap-5 pt-4 px-2">
									{tabs.map((tab) => {
										const Icon = tab.icon;
										const isActive = activeTab === tab.id;
										return (
											<button
												key={tab.id}
												onClick={() => setActiveTab(tab.id as 'workflow' | 'contacts' | 'reports')}
												className={`flex flex-col items-center justify-center gap-2 py-3 px-2 rounded-lg transition-colors shadow-none ${isActive
													? 'bg-[#E3EEFF99] text-secondary'
													: 'border border-[#E4E7EC] text-[#667085] hover:bg-gray-50'
													}`}
											>
												<Icon width={24} height={24} />
												<span className="text-base font-normal">
													{tab.label}
												</span>
											</button>
										);
									})}
								</div>
								{/* Main Content */}
								<div className="flex-1 overflow-y-auto overflow-x-hidden">
									{renderContent()}
								</div>
								</div>
							</div>
						</>
					)}
				</DialogContent>
			</Dialog>
		</Provider>
	);
};

export default Automation;
