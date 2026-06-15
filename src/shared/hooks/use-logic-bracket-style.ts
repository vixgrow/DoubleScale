import { useLayoutEffect, useState, type RefObject } from '@wordpress/element';

export interface LogicBracketStyle {
	top: number;
	height: number;
}

function observeElements(
	observer: ResizeObserver,
	...elements: (HTMLElement | null | undefined)[]
) {
	elements.forEach((element) => {
		if (element) {
			observer.observe(element);
		}
	});
}

/**
 * Vertical bracket between the first and last child inside a container (AND/OR connectors).
 */
export function useLogicBracketStyle(
	active: boolean,
	containerRef: RefObject<HTMLElement | null>,
	firstRef: RefObject<HTMLElement | null>,
	lastRef: RefObject<HTMLElement | null>,
	deps: unknown[] = []
): LogicBracketStyle {
	const [style, setStyle] = useState<LogicBracketStyle>({ top: 0, height: 0 });

	useLayoutEffect(() => {
		const update = () => {
			if (
				!active ||
				!containerRef.current ||
				!firstRef.current ||
				!lastRef.current
			) {
				setStyle({ top: 0, height: 0 });
				return;
			}

			const containerRect = containerRef.current.getBoundingClientRect();
			const firstRect = firstRef.current.getBoundingClientRect();
			const lastRect = lastRef.current.getBoundingClientRect();
			const firstMid =
				firstRect.top - containerRect.top + firstRect.height / 2;
			const lastMid =
				lastRect.top - containerRect.top + lastRect.height / 2;

			setStyle({
				top: firstMid,
				height: Math.max(0, lastMid - firstMid),
			});
		};

		update();
		const id1 = window.setTimeout(update, 0);
		const id2 = window.setTimeout(update, 50);
		window.addEventListener('resize', update);

		const resizeObserver = new ResizeObserver(update);
		observeElements(
			resizeObserver,
			containerRef.current,
			firstRef.current,
			lastRef.current
		);

		const mobileQuery = window.matchMedia('(max-width: 639px)');
		mobileQuery.addEventListener('change', update);

		return () => {
			window.clearTimeout(id1);
			window.clearTimeout(id2);
			window.removeEventListener('resize', update);
			mobileQuery.removeEventListener('change', update);
			resizeObserver.disconnect();
		};
	}, [active, containerRef, firstRef, lastRef, ...deps]);

	return style;
}

/**
 * Same as useLogicBracketStyle but resolves first/last from a ref array (OR group list).
 */
export function useLogicBracketStyleFromList(
	active: boolean,
	containerRef: RefObject<HTMLElement | null>,
	itemRefs: RefObject<(HTMLElement | null)[]>,
	itemCount: number
): LogicBracketStyle {
	const [style, setStyle] = useState<LogicBracketStyle>({ top: 0, height: 0 });

	useLayoutEffect(() => {
		const update = () => {
			if (
				!active ||
				itemCount <= 1 ||
				!containerRef.current ||
				!itemRefs.current?.[0] ||
				!itemRefs.current?.[itemCount - 1]
			) {
				setStyle({ top: 0, height: 0 });
				return;
			}

			const first = itemRefs.current[0];
			const last = itemRefs.current[itemCount - 1];
			if (!first || !last) {
				setStyle({ top: 0, height: 0 });
				return;
			}

			const containerRect = containerRef.current.getBoundingClientRect();
			const firstRect = first.getBoundingClientRect();
			const lastRect = last.getBoundingClientRect();
			const firstMid =
				firstRect.top - containerRect.top + firstRect.height / 2;
			const lastMid =
				lastRect.top - containerRect.top + lastRect.height / 2;

			setStyle({
				top: firstMid,
				height: Math.max(0, lastMid - firstMid),
			});
		};

		update();
		const id1 = window.setTimeout(update, 0);
		const id2 = window.setTimeout(update, 50);
		window.addEventListener('resize', update);

		const resizeObserver = new ResizeObserver(update);
		observeElements(
			resizeObserver,
			containerRef.current,
			itemRefs.current?.[0],
			itemRefs.current?.[itemCount - 1]
		);

		const mobileQuery = window.matchMedia('(max-width: 639px)');
		mobileQuery.addEventListener('change', update);

		return () => {
			window.clearTimeout(id1);
			window.clearTimeout(id2);
			window.removeEventListener('resize', update);
			mobileQuery.removeEventListener('change', update);
			resizeObserver.disconnect();
		};
	}, [active, itemCount, containerRef, itemRefs]);

	return style;
}
