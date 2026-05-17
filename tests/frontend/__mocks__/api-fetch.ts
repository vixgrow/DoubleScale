/**
 * Programmable mock for @wordpress/api-fetch.
 *
 * Tests register expected endpoints; the mock looks them up by method+path
 * (path matches as a suffix so test code can pass the route or the full URL).
 * Unregistered calls throw — tests should never reach a real network.
 */

type RestMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';

interface MockedEndpoint {
	method: RestMethod;
	pathSuffix: string;
	response: unknown;
	status?: number;
}

const endpoints: MockedEndpoint[] = [];

export function mockEndpoint(
	method: RestMethod,
	pathSuffix: string,
	response: unknown,
	status = 200
) {
	endpoints.push({ method, pathSuffix, response, status });
}

export function resetMockedEndpoints() {
	endpoints.length = 0;
}

interface ApiFetchOptions {
	path?: string;
	url?: string;
	method?: string;
	data?: unknown;
}

export async function apiFetch<T = unknown>(options: ApiFetchOptions): Promise<T> {
	const method = (options.method?.toUpperCase() ?? 'GET') as RestMethod;
	const path = options.path ?? options.url ?? '';

	const match = endpoints.find(
		(e) => e.method === method && path.endsWith(e.pathSuffix)
	);

	if (!match) {
		throw new Error(
			`Unmocked @wordpress/api-fetch call: ${method} ${path}. ` +
				`Register it via mockEndpoint('${method}', '<pathSuffix>', <response>) in your test.`
		);
	}

	if (match.status && match.status >= 400) {
		throw match.response;
	}

	return match.response as T;
}
