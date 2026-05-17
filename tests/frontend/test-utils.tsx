import { ReactElement, ReactNode } from 'react';
import { render, RenderOptions } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';

interface ProviderOptions {
	route?: string;
}

function AllProviders({ children, route = '/' }: { children: ReactNode; route?: string }) {
	return <MemoryRouter initialEntries={[route]}>{children}</MemoryRouter>;
}

export function renderWithProviders(
	ui: ReactElement,
	{ route, ...options }: ProviderOptions & Omit<RenderOptions, 'wrapper'> = {}
) {
	return render(ui, {
		wrapper: ({ children }) => <AllProviders route={route}>{children}</AllProviders>,
		...options,
	});
}

export * from '@testing-library/react';
export { default as userEvent } from '@testing-library/user-event';
