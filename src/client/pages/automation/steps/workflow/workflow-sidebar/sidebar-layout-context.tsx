/**
 * WordPress dependencies
 */
import { createContext, useContext, useState } from '@wordpress/element';
import type { ReactNode } from 'react';

interface SidebarLayoutContextValue {
	footer: ReactNode;
	setFooter: (node: ReactNode) => void;
}

const SidebarLayoutContext = createContext<SidebarLayoutContextValue | null>(
	null
);

export const SidebarLayoutProvider: React.FC<{ children: ReactNode }> = ({
	children,
}) => {
	const [footer, setFooter] = useState<ReactNode>(null);
	return (
		<SidebarLayoutContext.Provider value={{ footer, setFooter }}>
			{children}
		</SidebarLayoutContext.Provider>
	);
};

export const useSidebarLayout = () => useContext(SidebarLayoutContext);

export const SidebarFooter: React.FC = () => {
	const context = useSidebarLayout();
	if (!context?.footer) return null;
	return (
		<div className="doublescale-workflow-sidebar__footer shrink-0 border-t border-[#E4E7EC] p-4 bg-white">
			{context.footer}
		</div>
	);
};
