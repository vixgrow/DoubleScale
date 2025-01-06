/**
 * WordPress dependencies
 */
import {
	Popover,
	SlotFillProvider,
} from '@wordpress/components';

import { StrictMode } from '@wordpress/element';
import { FullscreenMode, InterfaceSkeleton } from '@wordpress/interface';
import { ShortcutProvider } from '@wordpress/keyboard-shortcuts';

/**
 * Internal dependencies
 */
import Notices from './components/notices';
import Header from './components/header';
import Sidebar from './components/sidebar';
import BlockEditor from './components/block-editor';
import InserterSidebar from './components/inserter-sidebar';

function Editor({ settings }) {
	return (
		<>
			<StrictMode>
				<ShortcutProvider>
					<FullscreenMode isActive={true} />
					<SlotFillProvider>
						<InterfaceSkeleton
							header={<Header />}
							sidebar={<Sidebar />}
							content={
								<>
									<Notices />
									<BlockEditor settings={settings} />
								</>
							}

						/>

						<Popover.Slot />
					</SlotFillProvider>
				</ShortcutProvider>
			</StrictMode>
		</>
	);
}

export default Editor;
