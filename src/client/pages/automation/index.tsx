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
import { useParams, useNavigate, getToLink } from '@quillcrm/navigation';
/**
 * Internal dependencies
 */
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
import { ChevronDown, ChevronRight } from 'lucide-react';
import { UndoIcon, RedoIcon } from '@quillcrm/components';
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuTrigger,
	DropdownMenuItem,
} from '@/components/ui/dropdown-menu';
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

	const [activeTab, setActiveTab] = useState<'workflow' | 'contacts'>(
		'workflow'
	);
	const [open, setOpen] = useState(true);

	const renderContent = () => {
		switch (activeTab) {
			case 'workflow':
				return <Workflow />;
			case 'contacts':
				return <Contacts />;
			default:
				return <Contacts />;
		}
	};

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
					className="z-[150000] w-screen h-screen max-w-none gap-0 overflow-hidden bg-white rounded-none shadow-none"
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

										{/* Middle section - Title and Dropdown */}
										<div className="flex items-center gap-2">
											<span className="text-base text-normal text-[#667085]">
												{__(
													'Create Automation',
													'quillcrm'
												)}
											</span>
											<ChevronRight className="h-4 w-4" />
											<DropdownMenu>
												<DropdownMenuTrigger asChild>
													<div className="flex gap-2 items-center cursor-pointer">
														<span className="capitalize text-normal text-[#374151]">
															{activeTab ===
															'workflow'
																? automation?.trigger
																: activeTab}
														</span>
														<ChevronDown className="h-4 w-4" />
													</div>
												</DropdownMenuTrigger>
												<DropdownMenuContent className="z-[150000]">
													<DropdownMenuItem
														onClick={() =>
															setActiveTab(
																'workflow'
															)
														}
														className="hover:bg-accent cursor-pointer"
													>
														{__(
															'Workflow',
															'quillcrm'
														)}
													</DropdownMenuItem>
													<DropdownMenuItem
														onClick={() =>
															setActiveTab(
																'contacts'
															)
														}
														className="hover:bg-accent cursor-pointer"
													>
														{__(
															'Contacts',
															'quillcrm'
														)}
													</DropdownMenuItem>
													<DropdownMenuItem
														onClick={() => {
															setOpen(false);
															// Wait for dialog to close before navigating
															setTimeout(() => {
																navigate(
																	getToLink(
																		`automations/${automation?.id}/reports`
																	)
																);
															}, 100);
														}}
														className="hover:bg-accent cursor-pointer"
													>
														{__(
															'Reports',
															'quillcrm'
														)}
													</DropdownMenuItem>
												</DropdownMenuContent>
											</DropdownMenu>
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
							<div className="h-screen">{renderContent()}</div>
						</>
					)}
				</DialogContent>
			</Dialog>
		</Provider>
	);
};

export default Automation;
