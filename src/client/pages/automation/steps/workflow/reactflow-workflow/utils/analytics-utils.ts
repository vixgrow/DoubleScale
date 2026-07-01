export interface StepAnalyticsItem {
	step_id: number | null;
	contacts: number;
	conversion_rate: number;
	step_type?: string;
}

export interface NodeAnalytics {
	contacts: number;
	conversion_rate: number;
}

export function toNodeAnalytics(
	item?: StepAnalyticsItem | null
): NodeAnalytics {
	return {
		contacts: item?.contacts ?? 0,
		conversion_rate: item?.conversion_rate ?? 0,
	};
}

export function findEntranceAnalytics(
	analyticsData: StepAnalyticsItem[]
): StepAnalyticsItem | undefined {
	return analyticsData.find(
		(item) =>
			item.step_id == null ||
			item.step_type === 'entrance' ||
			item.step_type === 'trigger'
	);
}

export function findStepAnalytics(
	analyticsData: StepAnalyticsItem[],
	stepId: number | string
): StepAnalyticsItem | undefined {
	const normalizedStepId = Number(stepId);
	if (Number.isNaN(normalizedStepId)) {
		return undefined;
	}

	return analyticsData.find(
		(item) =>
			item.step_id != null &&
			Number(item.step_id) === normalizedStepId
	);
}

export function getNodeAnalyticsForId(
	nodeId: string,
	analyticsData: StepAnalyticsItem[]
): NodeAnalytics | null {
	if (nodeId === 'trigger') {
		return toNodeAnalytics(findEntranceAnalytics(analyticsData));
	}

	const stepId = Number(nodeId);
	if (Number.isNaN(stepId)) {
		return null;
	}

	return toNodeAnalytics(findStepAnalytics(analyticsData, stepId));
}

export function mapFunnelResponseToAnalytics(
	funnelData: Array<{
		step_id: number | null;
		value?: number;
		percentage?: number;
		step_type?: string;
	}>
): StepAnalyticsItem[] {
	return funnelData.map((item) => ({
		step_id: item.step_id,
		contacts: item.value ?? 0,
		conversion_rate: item.percentage ?? 0,
		step_type: item.step_type,
	}));
}
