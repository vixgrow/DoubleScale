import React, { useState, useEffect, useCallback, useRef } from 'react';
import { __ } from '@wordpress/i18n';
import apiFetch from '@wordpress/api-fetch';
import { Card, CardContent } from '@/components/ui/card';
import './style.scss';
import { Automation } from '@doublescale/client';
// @ts-ignore
import D3Funnel from 'd3-funnel';

interface ChartReportProps {
	automation: Automation | null;
}

interface FunnelDataItem {
	label: string;
	value: number;
	percentage: number;
	step_id: number | null;
	step_type: string;
}

interface FunnelResponse {
	funnel_data: FunnelDataItem[];
	total_contacts: number;
	completion_rate: number;
	automation: {
		id: number;
		name: string;
	};
}

const ChartReport: React.FC<ChartReportProps> = ({ automation }) => {
	const [funnelData, setFunnelData] = useState<FunnelDataItem[]>([]);
	const [totalContacts, setTotalContacts] = useState<number>(0);
	const [completionRate, setCompletionRate] = useState<number>(0);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);
	const chartRef = useRef<HTMLDivElement>(null);
	const chartInstance = useRef<any>(null);

	const fetchFunnelData = useCallback(async () => {
		if (!automation?.id) {
			setFunnelData([]);
			setLoading(false);
			setError(null);
			return;
		}

		try {
			setLoading(true);
			setError(null);

			const response = (await apiFetch({
				path: `/doublescale/v1/automation-reports/${automation.id}/get-chart-report`,
			})) as FunnelResponse;

			console.log('response', response);

			if (response.funnel_data) {
				setFunnelData(response.funnel_data || []);
				setTotalContacts(response.total_contacts || 0);
				setCompletionRate(response.completion_rate || 0);
			}
			setLoading(false);
			setError(null);
		} catch (error: any) {
			console.error('Failed to fetch funnel data:', error);
			setFunnelData([]);
			setLoading(false);
			setError(
				error.message || __('Failed to fetch funnel data', 'doublescale')
			);
		}
	}, [automation?.id]);

	useEffect(() => {
		fetchFunnelData();
	}, [fetchFunnelData]);

	useEffect(() => {
		if (chartRef.current && funnelData.length > 0) {
			// Clear the container
			chartRef.current.innerHTML = '';

			// Create a wrapper div for both D3 funnel and custom overlay
			const wrapper = document.createElement('div');
			wrapper.style.position = 'relative';
			wrapper.style.width = '100%';
			wrapper.style.minHeight = '400px';

			// Create container for D3 funnel
			const funnelContainer = document.createElement('div');
			funnelContainer.style.position = 'absolute';
			funnelContainer.style.width = '250px';
			funnelContainer.style.height = '1000px';
			funnelContainer.style.left = '50%';
			funnelContainer.style.top = '52%';
			funnelContainer.style.transform = 'translate(-50%, -50%) rotate(-90deg)';
			funnelContainer.style.transformOrigin = 'center center';
			funnelContainer.style.display = 'flex';
			funnelContainer.style.justifyContent = 'center';
			funnelContainer.style.alignItems = 'center';

			// Create SVG overlay for custom labels and separators
			const svgOverlay = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
			svgOverlay.setAttribute('width', '100%');
			svgOverlay.setAttribute('height', '400');
			svgOverlay.setAttribute('viewBox', '0 0 1000 400');
			svgOverlay.setAttribute('preserveAspectRatio', 'xMidYMid meet');
			svgOverlay.style.position = 'absolute';
			svgOverlay.style.top = '0';
			svgOverlay.style.left = '0';
			svgOverlay.style.width = '100%';
			svgOverlay.style.maxWidth = '100%';

			const svgWidth = 1000;
			const svgHeight = 400;
			const segmentWidth = svgWidth / funnelData.length;

			// Add vertical segments with labels at top
			funnelData.forEach((item, index) => {
				const x = index * segmentWidth;
				const leftX = x + 15; // Position text 15px from the left edge of each segment

				// Vertical solid separator line (except for first segment)
				if (index > 0) {
					const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
					line.setAttribute('x1', String(x));
					line.setAttribute('y1', '50');
					line.setAttribute('x2', String(x));
					line.setAttribute('y2', String(svgHeight - 20));
					line.setAttribute('stroke', '#e5e7eb');
					line.setAttribute('stroke-width', '2');
					svgOverlay.appendChild(line);
				}

				// Step label at top
				const stepLabel = document.createElementNS('http://www.w3.org/2000/svg', 'text');
				stepLabel.setAttribute('x', String(leftX));
				stepLabel.setAttribute('y', '30');
				stepLabel.setAttribute('text-anchor', 'start');
				stepLabel.setAttribute('fill', '#09090B');
				stepLabel.setAttribute('font-size', '18');
				stepLabel.setAttribute('font-weight', '600');
				stepLabel.textContent = item.label;
				svgOverlay.appendChild(stepLabel);

				// Contacts info
				const contactsText = document.createElementNS('http://www.w3.org/2000/svg', 'text');
				contactsText.setAttribute('x', String(leftX));
				contactsText.setAttribute('y', '55');
				contactsText.setAttribute('text-anchor', 'start');
				contactsText.setAttribute('fill', '#09090B');
				contactsText.setAttribute('font-size', '14');

				const contactsLabel = document.createElementNS('http://www.w3.org/2000/svg', 'tspan');
				contactsLabel.textContent = 'Contacts: ';
				contactsLabel.setAttribute('fill', '#09090B');

				const contactsValue = document.createElementNS('http://www.w3.org/2000/svg', 'tspan');
				contactsValue.textContent = String(item.value);
				contactsValue.setAttribute('fill', '#3b82f6');
				contactsValue.setAttribute('font-weight', 'bold');

				contactsText.appendChild(contactsLabel);
				contactsText.appendChild(contactsValue);
				svgOverlay.appendChild(contactsText);

				// Conversion Rate info
				const conversionText = document.createElementNS('http://www.w3.org/2000/svg', 'text');
				conversionText.setAttribute('x', String(leftX));
				conversionText.setAttribute('y', '72');
				conversionText.setAttribute('text-anchor', 'start');
				conversionText.setAttribute('fill', '#09090B');
				conversionText.setAttribute('font-size', '14');

				const conversionLabel = document.createElementNS('http://www.w3.org/2000/svg', 'tspan');
				conversionLabel.textContent = 'Conversion Rate: ';
				conversionLabel.setAttribute('fill', '#09090B');

				const conversionValue = document.createElementNS('http://www.w3.org/2000/svg', 'tspan');
				conversionValue.textContent = `${item.percentage}%`;
				conversionValue.setAttribute('fill', '#3b82f6');
				conversionValue.setAttribute('font-weight', 'bold');

				conversionText.appendChild(conversionLabel);
				conversionText.appendChild(conversionValue);
				svgOverlay.appendChild(conversionText);
			});

			// Add horizontal line at the bottom connecting all vertical lines
			const horizontalLine = document.createElementNS('http://www.w3.org/2000/svg', 'line');
			horizontalLine.setAttribute('x1', '0');
			horizontalLine.setAttribute('y1', String(svgHeight - 20));
			horizontalLine.setAttribute('x2', String(svgWidth));
			horizontalLine.setAttribute('y2', String(svgHeight - 20));
			horizontalLine.setAttribute('stroke', '#e5e7eb');
			horizontalLine.setAttribute('stroke-width', '2');
			svgOverlay.appendChild(horizontalLine);

			// Initialize D3 Funnel for the funnel shape
			const data = funnelData.map((item) => ({
				label: '',
				value: item.value,
			}));

			const chart = new D3Funnel(funnelContainer);
			chart.draw(data, {
				chart: {
					width: 250,
					height: 1000,
					horizontal: false,
					bottomWidth: 1 / 3,
					bottomPinch: 0,
					curve: {
						enabled: true,
						height: 15,
					},
				},
				block: {
					dynamicHeight: false,
					dynamicSlope: true,
					fill: {
						type: 'solid',
						scale: ['#E3EEFF99'],
					},
					minHeight: 30,
					highlight: false,
				},
				label: {
					enabled: false,
				},
			});

			// Style the funnel SVG and add labels inside blocks
			setTimeout(() => {
				const svg = funnelContainer.querySelector('svg');
				if (svg) {
					svg.style.width = '100%';
					svg.style.height = '100%';
					svg.style.display = 'block';

					// Make funnel blocks visible with correct color
					const paths = svg.querySelectorAll('path');
					paths.forEach((path) => {
						path.setAttribute('fill', '#E3EEFF99');
						path.setAttribute('stroke', 'none');
					});

					console.log('D3 Funnel rendered:', svg);
				} else {
					console.error('SVG not found in funnel container');
				}
			}, 100);

			wrapper.appendChild(funnelContainer);
			wrapper.appendChild(svgOverlay);
			chartRef.current.appendChild(wrapper);

			chartInstance.current = chart;
		}

		return () => {
			if (chartRef.current) {
				chartRef.current.innerHTML = '';
			}
		};
	}, [funnelData]);

	if (loading) {
		return (
			<div className="chart-report-container">
				<div className="report-header">
					<h2 className="report-title">{__('Automation Funnel Chart', 'doublescale')}</h2>
				</div>
				<div className="loading-spinner">
					{__('Loading funnel data...', 'doublescale')}
				</div>
			</div>
		);
	}

	if (error) {
		return (
			<div className="chart-report-container">
				<div className="report-header">
					<h2 className="report-title">{__('Automation Funnel Chart', 'doublescale')}</h2>
				</div>
				<div className="error-message">{error}</div>
			</div>
		);
	}

	if (funnelData.length === 0) {
		return (
			<div className="chart-report-container">
				<div className="report-header">
					<h2 className="report-title">{__('Automation Funnel Chart', 'doublescale')}</h2>
				</div>
				<div className="empty-state">
					{__('No funnel data available', 'doublescale')}
				</div>
			</div>
		);
	}

	return (
		<div className="chart-report-container">
			<div className="report-header">
				<h2 className="report-title">{__('Automation Funnel Chart', 'doublescale')}</h2>
				<div className="stats-container">
					<div className="stat-box bg-[#E3EEFF99] text-secondary border border-secondary">
						<span className="stat-label">
							{__('Total Contacts:', 'doublescale')}
						</span>
						<span className="stat-value">{totalContacts}</span>
					</div>
					<div className="stat-box bg-[#E4FAEC] text-[#16A34A] border border-[#16A34A]">
						<span className="stat-label">
							{__('Completion Rate:', 'doublescale')}
						</span>
						<span className="stat-value">{completionRate}%</span>
					</div>
				</div>
			</div>
				<div className="p-6">
					<div className="chart-wrapper">
						<div ref={chartRef}></div>
					</div>
				</div>
		</div>
	);
};

export default ChartReport;
