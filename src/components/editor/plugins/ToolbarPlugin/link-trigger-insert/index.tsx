/**
 * Email toolbar control: pick a Link Trigger and insert it as an <a>.
 *
 * Kept out of SupportToolbar so the public portal bundle never hits the
 * admin Link Triggers API.
 */

import { useCallback, useRef, useState } from 'react';
import {
	$createRangeSelection,
	$createTextNode,
	$getSelection,
	$isRangeSelection,
	$setSelection,
	$findMatchingParent,
} from 'lexical';
import { $createLinkNode, $isLinkNode, $toggleLink } from '@lexical/link';

import { useIsProActive } from '@doublescale/shared/hooks/use-is-pro-active';
import {
	LinkTriggerPickerDialog,
	LinkTriggerToolbarButton,
	type PickedLinkTrigger,
} from '../../../../link-trigger-picker';

interface LinkTriggerInsertButtonProps {
	activeEditor: any;
}

type StoredSelection = {
	anchor: { key: string; offset: number; type: 'text' | 'element' };
	focus: { key: string; offset: number; type: 'text' | 'element' };
};

export default function LinkTriggerInsertButton({
	activeEditor,
}: LinkTriggerInsertButtonProps) {
	const isPro = useIsProActive();
	const [open, setOpen] = useState(false);
	const storedSelectionRef = useRef<StoredSelection | null>(null);
	const skipLinkTextStepRef = useRef(false);

	const openPicker = useCallback(() => {
		activeEditor.focus();
		activeEditor.update(() => {
			const selection = $getSelection();
			if ($isRangeSelection(selection)) {
				skipLinkTextStepRef.current = !selection.isCollapsed();
				storedSelectionRef.current = {
					anchor: {
						key: selection.anchor.key,
						offset: selection.anchor.offset,
						type: selection.anchor.type,
					},
					focus: {
						key: selection.focus.key,
						offset: selection.focus.offset,
						type: selection.focus.type,
					},
				};
			} else {
				skipLinkTextStepRef.current = false;
				storedSelectionRef.current = null;
			}
		});
		setOpen(true);
	}, [activeEditor]);

	const insertTrigger = useCallback(
		(trigger: PickedLinkTrigger) => {
			activeEditor.focus();
			activeEditor.update(() => {
				let selection = $getSelection();
				const stored = storedSelectionRef.current;
				if (stored) {
					try {
						const restored = $createRangeSelection();
						restored.anchor.set(
							stored.anchor.key,
							stored.anchor.offset,
							stored.anchor.type
						);
						restored.focus.set(
							stored.focus.key,
							stored.focus.offset,
							stored.focus.type
						);
						$setSelection(restored);
						selection = restored;
					} catch {
						// Nodes may have changed; keep the current selection.
					}
					storedSelectionRef.current = null;
				}

				if (!$isRangeSelection(selection)) {
					return;
				}

				const linkParent = $findMatchingParent(
					selection.anchor.getNode(),
					$isLinkNode
				);
				if (linkParent) {
					linkParent.setURL(trigger.url);
					return;
				}

				if (!selection.isCollapsed()) {
					$toggleLink(trigger.url, {
						rel: 'noopener noreferrer',
						target: '_blank',
					});
					return;
				}

				const linkNode = $createLinkNode(trigger.url, {
					rel: 'noopener noreferrer',
					target: '_blank',
				});
				linkNode.append($createTextNode(trigger.linkText));
				selection.insertNodes([linkNode]);
			});
		},
		[activeEditor]
	);

	if (!isPro) {
		return null;
	}

	return (
		<>
			<LinkTriggerToolbarButton
				className="h-8 w-8 p-0 text-[#52525B] hover:text-primary"
				onMouseDown={(event) => {
					event.preventDefault();
					openPicker();
				}}
			/>
			<LinkTriggerPickerDialog
				open={open}
				onOpenChange={setOpen}
				onPick={insertTrigger}
				skipLinkTextStep={skipLinkTextStepRef.current}
			/>
		</>
	);
}
