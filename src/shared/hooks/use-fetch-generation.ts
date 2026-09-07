import { useCallback, useRef } from 'react';

/**
 * Ignore stale list responses when page, per_page, or filters change
 * before an earlier request finishes.
 */
export function useFetchGeneration() {
	const generationRef = useRef(0);

	const beginFetch = useCallback(() => ++generationRef.current, []);

	const isCurrent = useCallback(
		(generation: number) => generation === generationRef.current,
		[]
	);

	return { beginFetch, isCurrent };
}
