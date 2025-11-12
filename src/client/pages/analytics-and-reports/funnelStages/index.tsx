

// import React, { useState, useEffect, useCallback } from 'react';
// import apiFetch from '@wordpress/api-fetch';
// import { __ } from '@wordpress/i18n';

// interface ChartReportProps {
//   selectedPipelineId: number | null;
//   ownerId?: number;
// }

// interface StageData {
//   id: number;
//   name: string;
//   count: number;
//   value: string;
//   color: string;
// }

// const ChartReport: React.FC<ChartReportProps> = ({ selectedPipelineId, ownerId }) => {
//   const [stages, setStages] = useState<StageData[]>([]);
//   const [loading, setLoading] = useState(true);
//   const [error, setError] = useState<string | null>(null);

//   const fetchStages = useCallback(async () => {
//     if (!selectedPipelineId) return;

//     try {
//       setLoading(true);
//       setError(null);

//       const params = new URLSearchParams();
//       params.append('pipeline_id', String(selectedPipelineId));
//       if (ownerId) params.append('owner_id', String(ownerId));

//       const response = await apiFetch({
//         path: `/qc/v1/reports/sales-rep/pipeline-stages?${params.toString()}`,
//         method: 'GET',
//       }) as any;

//       const stagesData: StageData[] = (response.pipeline_stages?.stages || []).map(stage => ({
//         id: stage.id,
//         name: stage.name,
//         count: stage.count,
//         value: stage.value,
//         color: stage.color || '#ccc',
//       }));

//       setStages(stagesData);
//       setLoading(false);
//     } catch (err: any) {
//       console.error(err);
//       setError(err.message || __('Failed to fetch stages', 'quillcrm'));
//       setLoading(false);
//     }
//   }, [selectedPipelineId, ownerId]);

//   useEffect(() => {
//     fetchStages();
//   }, [fetchStages]);

//   if (loading) return <div>{__('Loading pipeline stages...', 'quillcrm')}</div>;
//   if (error) return <div className="text-red-500">{error}</div>;
//   if (stages.length === 0) return <div>{__('No stages available', 'quillcrm')}</div>;

//   // نحسب الحد الأقصى للـ count عشان نحدد عرض المربعات
//   const maxCount = Math.max(...stages.map(s => s.count), 1); // نتأكد من 1 على الأقل

//   return (
//     <div style={{ display: 'flex', gap: '24px', alignItems: 'flex-end', padding: '16px' }}>
//       {/* Funnel Bars */}
//       <div style={{ display: 'flex', alignItems: 'flex-end', gap: '12px', flexWrap: 'wrap' }}>
//         {stages.map(stage => {
//           const width = 60; // ثابت
//           const height = 50 + (stage.count / maxCount) * 150; // ارتفاع حسب count
//           return (
//             <div
//               key={stage.id}
//               style={{
//                 width,
//                 height,
//                 backgroundColor: stage.color,
//                 display: 'flex',
//                 alignItems: 'center',
//                 justifyContent: 'center',
//                 flexDirection: 'column',
//                 borderRadius: '8px',
//                 color: '#000',
//                 fontWeight: 600,
//                 textAlign: 'center',
//                 boxShadow: '0 2px 6px rgba(0,0,0,0.1)',
//               }}
//               title={`${stage.name}: ${stage.count} deals, Value: ${stage.value}`}
//             >
//               <span style={{ fontSize: '14px' }}>{stage.count} Deals</span>
//               <span style={{ fontSize: '12px', marginTop: '4px' }}>{stage.value}</span>
//             </div>
//           );
//         })}
//       </div>

//       {/* Legend */}
//       <div style={{ marginLeft: '24px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
//         {stages.map(stage => (
//           <div key={stage.id} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
//             <div style={{
//               width: '16px',
//               height: '16px',
//               backgroundColor: stage.color,
//               borderRadius: '4px',
//             }} />
//             <span>{stage.name}</span>
//           </div>
//         ))}
//       </div>
//     </div>
//   );
// };

// export default ChartReport;
// import React, { useState, useEffect, useCallback, useRef } from 'react';
// import apiFetch from '@wordpress/api-fetch';
// // @ts-ignore
// import D3Funnel from 'd3-funnel';

// interface ChartReportProps {
//   selectedPipelineId: number | null;
//   ownerId?: number;
// }

// interface StageData {
//   id: number;
//   name: string;
//   count: number;
//   value: string;
//   color: string;
// }

// const ChartReport: React.FC<ChartReportProps> = ({ selectedPipelineId, ownerId }) => {
//   const [stages, setStages] = useState<StageData[]>([]);
//   const [loading, setLoading] = useState(true);
//   const [error, setError] = useState<string | null>(null);
//   const chartRef = useRef<HTMLDivElement>(null);

//   const stageColors = ['#60A5FA', '#8B5CF6', '#F59E0B', '#F97316', '#10B981', '#EF4444'];

//   const fetchStages = useCallback(async () => {
//     if (!selectedPipelineId) return;

//     try {
//       setLoading(true);
//       setError(null);

//       const params = new URLSearchParams();
//       params.append('pipeline_id', String(selectedPipelineId));
//       if (ownerId) params.append('owner_id', String(ownerId));

//       const response = (await apiFetch({
//         path: `/qc/v1/reports/sales-rep/pipeline-stages?${params.toString()}`,
//       })) as {
//         pipeline_stages: { stages: any[] };
//       };

//       const stagesData: StageData[] = (response.pipeline_stages.stages || []).map((stage, index) => ({
//         id: stage.id,
//         name: stage.name,
//         count: stage.count,
//         value: stage.value,
//         color: stageColors[index % stageColors.length],
//       }));

//       setStages(stagesData);
//       setLoading(false);
//     } catch (err: any) {
//       console.error(err);
//       setError(err.message || 'Failed to fetch stages');
//       setLoading(false);
//     }
//   }, [selectedPipelineId, ownerId]);

//   useEffect(() => {
//     fetchStages();
//   }, [fetchStages]);

//   useEffect(() => {
//     if (!chartRef.current || stages.length === 0) return;

//     chartRef.current.innerHTML = '';

//     const funnelDataForD3 = stages.map(stage => ({
//       label: stage.name,
//       value: stage.count,
//       color: stage.color,
//       valueText: stage.value,
//     }));

//     const wrapper = document.createElement('div');
//     wrapper.style.position = 'relative';
//     wrapper.style.width = '100%';
//     wrapper.style.minHeight = '400px';

//     const funnelContainer = document.createElement('div');
//     funnelContainer.style.position = 'absolute';
//     funnelContainer.style.width = '300px';
//     funnelContainer.style.height = '800px';
//     funnelContainer.style.left = '50%';
//     funnelContainer.style.top = '50%';
//     funnelContainer.style.transform = 'translate(-50%, -50%)';
    
//     // Initialize D3Funnel
//     const chart = new D3Funnel(funnelContainer);
//     chart.draw(
//       funnelDataForD3.map(d => ({ label: '', value: d.value })),
//       {
//         chart: {
//           width: 300,
//           height: 800,
//           bottomWidth: 0.3,
//           curve: { enabled: true, height: 20 },
//         },
//         block: {
//           dynamicHeight: true,
//           fill: { scale: funnelDataForD3.map(d => d.color) },
//           minHeight: 50,
//         },
//         label: { enabled: false },
//       }
//     );

//     // Add SVG overlay for labels inside blocks
//     const svgOverlay = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
//     svgOverlay.setAttribute('width', '100%');
//     svgOverlay.setAttribute('height', '400');
//     svgOverlay.setAttribute('viewBox', '0 0 1000 400');
//     svgOverlay.setAttribute('preserveAspectRatio', 'xMidYMid meet');
//     svgOverlay.style.position = 'absolute';
//     svgOverlay.style.top = '0';
//     svgOverlay.style.left = '0';
//     svgOverlay.style.width = '100%';
//     svgOverlay.style.maxWidth = '100%';

//     const svgWidth = 1000;
//     const svgHeight = 400;
//     const segmentWidth = svgWidth / funnelDataForD3.length;

//     funnelDataForD3.forEach((stage, i) => {
//       const x = i * segmentWidth + 20;

//       const label = document.createElementNS('http://www.w3.org/2000/svg', 'text');
//       label.setAttribute('x', String(x));
//       label.setAttribute('y', '30');
//       label.setAttribute('fill', '#000');
//       label.setAttribute('font-size', '16');
//       label.setAttribute('font-weight', '600');
//       label.textContent = `${stage.label}`;
//       svgOverlay.appendChild(label);

//       const deals = document.createElementNS('http://www.w3.org/2000/svg', 'text');
//       deals.setAttribute('x', String(x));
//       deals.setAttribute('y', '55');
//       deals.setAttribute('fill', '#000');
//       deals.setAttribute('font-size', '14');
//       deals.textContent = `Deals: ${stage.value}`;
//       svgOverlay.appendChild(deals);

//       const valueText = document.createElementNS('http://www.w3.org/2000/svg', 'text');
//       valueText.setAttribute('x', String(x));
//       valueText.setAttribute('y', '72');
//       valueText.setAttribute('fill', '#000');
//       valueText.setAttribute('font-size', '14');
//       valueText.textContent = `Value: ${stage.valueText}`;
//       svgOverlay.appendChild(valueText);
//     });

//     wrapper.appendChild(funnelContainer);
//     wrapper.appendChild(svgOverlay);
//     chartRef.current.appendChild(wrapper);

//     return () => {
//       if (chartRef.current) chartRef.current.innerHTML = '';
//     };
//   }, [stages]);

//   if (loading) return <div>Loading funnel...</div>;
//   if (error) return <div style={{ color: 'red' }}>{error}</div>;
//   if (stages.length === 0) return <div>No stages available</div>;

//   return (
//     <div>
//       <div ref={chartRef}></div>

//       <div style={{ display: 'flex', gap: '12px', marginTop: '16px', flexWrap: 'wrap' }}>
//         {stages.map(stage => (
//           <div key={stage.id} style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
//             <span style={{ width: '20px', height: '20px', backgroundColor: stage.color, borderRadius: '4px' }}></span>
//             <span>{stage.name}</span>
//           </div>
//         ))}
//       </div>
//     </div>
//   );
// };

// export default ChartReport;
// ------------------------------------
// import React, { useState, useEffect, useCallback, useRef } from 'react';
// import apiFetch from '@wordpress/api-fetch';

// interface ChartReportProps {
//   selectedPipelineId: number | null;
//   ownerId?: number;
// }

// interface StageData {
//   id: number;
//   name: string;
//   count: number;
//   value: string;
//   color: string;
// }

// const ChartReport: React.FC<ChartReportProps> = ({ selectedPipelineId, ownerId }) => {
//   const [stages, setStages] = useState<StageData[]>([]);
//   const [loading, setLoading] = useState(true);
//   const [error, setError] = useState<string | null>(null);
//   const chartRef = useRef<HTMLDivElement>(null);

//   const fetchStages = useCallback(async () => {
//     if (!selectedPipelineId) {
//       setStages([]);
//       setLoading(false);
//       return;
//     }

//     try {
//       setLoading(true);
//       setError(null);

//       const params = new URLSearchParams();
//       params.append('pipeline_id', String(selectedPipelineId));
//       if (ownerId) params.append('owner_id', String(ownerId));

//       const response = (await apiFetch({
//         path: `/qc/v1/reports/sales-rep/pipeline-stages?${params.toString()}`,
//       })) as { pipeline_stages: { stages: any[] } };

//       const stagesData: StageData[] = (response.pipeline_stages.stages || []).map((stage, index) => ({
//         id: stage.id,
//         name: stage.name,
//         count: stage.count,
//         value: stage.value,
//         color: stage.color || ['#60A5FA', '#8B5CF6', '#F59E0B', '#F97316', '#10B981', '#EF4444'][index % 6],
//       }));

//       // ترتيب المراحل من الصغير للكبير حسب عدد الـ deals
//       const sortedStages = stagesData.sort((a, b) => a.count - b.count);
//       setStages(sortedStages);
//       setLoading(false);
//     } catch (err: any) {
//       setError(err.message || 'Failed to fetch stages');
//       setLoading(false);
//     }
//   }, [selectedPipelineId, ownerId]);

//   useEffect(() => {
//     fetchStages();
//   }, [fetchStages]);

//   useEffect(() => {
//     if (!chartRef.current || stages.length === 0) return;

//     chartRef.current.innerHTML = '';

//     // إنشاء SVG
//     const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
//     svg.setAttribute('width', '100%');
//     svg.setAttribute('height', '400');
//     svg.setAttribute('viewBox', '0 0 1200 400');
//     svg.style.display = 'block';
//     svg.style.margin = '0 auto';

//     // حساب أقصى عدد deals
//     const maxDeals = Math.max(...stages.map(s => s.count));
    
//     // عرض وإرتفاع كل مرحلة
//     const stageWidth = 180;
//     const spacing = 0;
//     const startX = 50;
//     const centerY = 200;

//     // رسم كل مرحلة
//     stages.forEach((stage, index) => {
//       const x = startX + (index * (stageWidth + spacing));
      
//       // حساب الارتفاع بناءً على عدد الـ deals (النسبة من أقصى قيمة)
//       const heightRatio = stage.count / maxDeals;
//       const maxHeight = 300;
//       const height = Math.max(80, maxHeight * heightRatio);
      
//       const y = centerY - (height / 2);

//       // رسم المستطيل الملون
//       const rect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
//       rect.setAttribute('x', x.toString());
//       rect.setAttribute('y', y.toString());
//       rect.setAttribute('width', stageWidth.toString());
//       rect.setAttribute('height', height.toString());
//       rect.setAttribute('fill', stage.color);
//       rect.setAttribute('rx', '8');
//     //   rect.setAttribute('opacity', '0.9');
//       svg.appendChild(rect);

//       // إضافة النصوص
//       const textGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g');

//       // اسم المرحلة
//       const nameText = document.createElementNS('http://www.w3.org/2000/svg', 'text');
//       nameText.setAttribute('x', (x + stageWidth / 2).toString());
//       nameText.setAttribute('y', (y + height / 2 - 25).toString());
//       nameText.setAttribute('text-anchor', 'middle');
//       nameText.setAttribute('fill', '#fff');
//       nameText.setAttribute('font-size', '16');
//       nameText.setAttribute('font-weight', 'bold');
//       nameText.textContent = stage.name;
//       textGroup.appendChild(nameText);

//       // عدد الـ deals
//       const dealsText = document.createElementNS('http://www.w3.org/2000/svg', 'text');
//       dealsText.setAttribute('x', (x + stageWidth / 2).toString());
//       dealsText.setAttribute('y', (y + height / 2).toString());
//       dealsText.setAttribute('text-anchor', 'middle');
//       dealsText.setAttribute('fill', '#fff');
//       dealsText.setAttribute('font-size', '14');
//       dealsText.textContent = `Total Deals: ${stage.count}`;
//       textGroup.appendChild(dealsText);

//       // القيمة
//       const valueText = document.createElementNS('http://www.w3.org/2000/svg', 'text');
//       valueText.setAttribute('x', (x + stageWidth / 2).toString());
//       valueText.setAttribute('y', (y + height / 2 + 20).toString());
//       valueText.setAttribute('text-anchor', 'middle');
//       valueText.setAttribute('fill', '#fff');
//       valueText.setAttribute('font-size', '14');
//       valueText.textContent = `Total Value: ${stage.value}`;
//       textGroup.appendChild(valueText);

//       svg.appendChild(textGroup);

//       // رسم خط الربط بين المراحل
//       if (index < stages.length - 1) {
//         const nextStage = stages[index + 1];
//         const nextHeightRatio = nextStage.count / maxDeals;
//         const nextHeight = Math.max(80, maxHeight * nextHeightRatio);
        
//         const line1 = document.createElementNS('http://www.w3.org/2000/svg', 'line');
//         line1.setAttribute('x1', (x + stageWidth).toString());
//         line1.setAttribute('y1', y.toString());
//         line1.setAttribute('x2', (x + stageWidth + spacing).toString());
//         line1.setAttribute('y2', (centerY - nextHeight / 2).toString());
//         line1.setAttribute('stroke', '#D1D5DB');
//         line1.setAttribute('stroke-width', '2');
//         line1.setAttribute('opacity', '0.5');
//         svg.appendChild(line1);

//         const line2 = document.createElementNS('http://www.w3.org/2000/svg', 'line');
//         line2.setAttribute('x1', (x + stageWidth).toString());
//         line2.setAttribute('y1', (y + height).toString());
//         line2.setAttribute('x2', (x + stageWidth + spacing).toString());
//         line2.setAttribute('y2', (centerY + nextHeight / 2).toString());
//         line2.setAttribute('stroke', '#D1D5DB');
//         line2.setAttribute('stroke-width', '2');
//         line2.setAttribute('opacity', '0.5');
//         svg.appendChild(line2);
//       }
//     });

//     chartRef.current.appendChild(svg);

//     return () => {
//       if (chartRef.current) chartRef.current.innerHTML = '';
//     };
//   }, [stages]);

//   if (loading) return <div style={{ padding: '40px', textAlign: 'center' }}>جاري التحميل...</div>;
//   if (error) return <div style={{ color: 'red', padding: '20px' }}>{error}</div>;
//   if (stages.length === 0) return <div style={{ padding: '40px', textAlign: 'center' }}>لا توجد مراحل</div>;

//   return (
//     <div style={{ fontFamily: 'Tajawal, sans-serif', padding: '20px' }}>
//       <div ref={chartRef}></div>

//       {/* Legend */}
//       <div style={{
//         display: 'flex',
//         justifyContent: 'center',
//         gap: '24px',
//         marginTop: '32px',
//         flexWrap: 'wrap'
//       }}>
//         {stages.map(stage => (
//           <div key={stage.id} style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
//             <div style={{
//               width: '20px',
//               height: '20px',
//               backgroundColor: stage.color,
//               borderRadius: '4px',
//               boxShadow: '0 1px 3px rgba(0,0,0,0.2)'
//             }}></div>
//             <span style={{ fontSize: '15px', fontWeight: 500, color: '#374151' }}>{stage.name}</span>
//           </div>
//         ))}
//       </div>
//     </div>
//   );
// };

// export default ChartReport;



// import React, { useState, useEffect, useCallback, useRef } from 'react';
// import apiFetch from '@wordpress/api-fetch';
// // @ts-ignore
// import D3Funnel from 'd3-funnel';

// interface ChartReportProps {
//   selectedPipelineId: number | null;
//   ownerId?: number;
// }

// interface StageData {
//   id: number;
//   name: string;
//   count: number;
//   value: string;
//   color: string;
//   percentage?: number;
// }

// const ChartReport: React.FC<ChartReportProps> = ({ selectedPipelineId, ownerId }) => {
//   const [stages, setStages] = useState<StageData[]>([]);
//   const [loading, setLoading] = useState(true);
//   const [error, setError] = useState<string | null>(null);
//   const chartRef = useRef<HTMLDivElement>(null);

//   const fetchStages = useCallback(async () => {
//     if (!selectedPipelineId) {
//       setStages([]);
//       setLoading(false);
//       return;
//     }

//     try {
//       setLoading(true);
//       setError(null);

//       const params = new URLSearchParams();
//       params.append('pipeline_id', String(selectedPipelineId));
//       if (ownerId) params.append('owner_id', String(ownerId));

//       const response = (await apiFetch({
//         path: `/qc/v1/reports/sales-rep/pipeline-stages?${params.toString()}`,
//       })) as { pipeline_stages: { stages: any[] } };

//       const stagesData: StageData[] = (response.pipeline_stages.stages || []).map((stage, index) => ({
//         id: stage.id,
//         name: stage.name,
//         count: stage.count,
//         value: stage.value,
//         color: stage.color || ['#60A5FA', '#8B5CF6', '#F59E0B', '#F97316', '#10B981', '#EF4444'][index % 6],
//         percentage: stage.percentage || 0,
//       }));

//       // ترتيب المراحل من الصغير للكبير حسب عدد الـ deals
//       const sortedStages = stagesData.sort((a, b) => a.count - b.count);
//       setStages(sortedStages);
//       setLoading(false);
//     } catch (err: any) {
//       setError(err.message || 'Failed to fetch stages');
//       setLoading(false);
//     }
//   }, [selectedPipelineId, ownerId]);

//   useEffect(() => {
//     fetchStages();
//   }, [fetchStages]);

//   useEffect(() => {
//     if (chartRef.current && stages.length > 0) {
//       // Clear the container
//       chartRef.current.innerHTML = '';

//       // Create a wrapper div for both D3 funnel and custom overlay
//       const wrapper = document.createElement('div');
//       wrapper.style.position = 'relative';
//       wrapper.style.width = '100%';
//       wrapper.style.minHeight = '400px';

//       // Create container for D3 funnel
//       const funnelContainer = document.createElement('div');
//       funnelContainer.style.position = 'absolute';
//       funnelContainer.style.width = '250px';
//       funnelContainer.style.height = '350px';
//       funnelContainer.style.left = '50%';
//       funnelContainer.style.top = '52%';
//       funnelContainer.style.transform = 'translate(-50%, -50%) rotate(-90deg)';
//       funnelContainer.style.transformOrigin = 'center center';
//       funnelContainer.style.display = 'flex';
//       funnelContainer.style.justifyContent = 'center';
//       funnelContainer.style.alignItems = 'center';

//       // Create SVG overlay for custom labels and separators
//       const svgOverlay = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
//       svgOverlay.setAttribute('width', '100%');
//       svgOverlay.setAttribute('height', '400');
//       svgOverlay.setAttribute('viewBox', '0 0 1000 400');
//       svgOverlay.setAttribute('preserveAspectRatio', 'xMidYMid meet');
//       svgOverlay.style.position = 'absolute';
//       svgOverlay.style.top = '0';
//       svgOverlay.style.left = '0';
//       svgOverlay.style.width = '100%';
//       svgOverlay.style.maxWidth = '100%';

//       const svgWidth = 1000;
//       const svgHeight = 400;
//       const segmentWidth = svgWidth / stages.length;

//       // Add vertical segments with labels at top
//       stages.forEach((stage, index) => {
//         const x = index * segmentWidth;
//         const leftX = x + 15;

//         // Vertical solid separator line (except for first segment)
//         if (index > 0) {
//           const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
//           line.setAttribute('x1', String(x));
//           line.setAttribute('y1', '50');
//           line.setAttribute('x2', String(x));
//           line.setAttribute('y2', String(svgHeight - 20));
//           line.setAttribute('stroke', '#e5e7eb');
//           line.setAttribute('stroke-width', '2');
//           svgOverlay.appendChild(line);
//         }

//         // Step label at top
//         const stepLabel = document.createElementNS('http://www.w3.org/2000/svg', 'text');
//         stepLabel.setAttribute('x', String(leftX));
//         stepLabel.setAttribute('y', '30');
//         stepLabel.setAttribute('text-anchor', 'start');
//         stepLabel.setAttribute('fill', '#09090B');
//         stepLabel.setAttribute('font-size', '18');
//         stepLabel.setAttribute('font-weight', '600');
//         stepLabel.textContent = stage.name;
//         svgOverlay.appendChild(stepLabel);

//         // Total Deals info
//         const dealsText = document.createElementNS('http://www.w3.org/2000/svg', 'text');
//         dealsText.setAttribute('x', String(leftX));
//         dealsText.setAttribute('y', '55');
//         dealsText.setAttribute('text-anchor', 'start');
//         dealsText.setAttribute('fill', '#09090B');
//         dealsText.setAttribute('font-size', '14');

//         const dealsLabel = document.createElementNS('http://www.w3.org/2000/svg', 'tspan');
//         dealsLabel.textContent = 'Total Deals: ';
//         dealsLabel.setAttribute('fill', '#09090B');

//         const dealsValue = document.createElementNS('http://www.w3.org/2000/svg', 'tspan');
//         dealsValue.textContent = String(stage.count);
//         dealsValue.setAttribute('fill', '#3b82f6');
//         dealsValue.setAttribute('font-weight', 'bold');

//         dealsText.appendChild(dealsLabel);
//         dealsText.appendChild(dealsValue);
//         svgOverlay.appendChild(dealsText);

//         // Total Deals Value info
//         const valueText = document.createElementNS('http://www.w3.org/2000/svg', 'text');
//         valueText.setAttribute('x', String(leftX));
//         valueText.setAttribute('y', '72');
//         valueText.setAttribute('text-anchor', 'start');
//         valueText.setAttribute('fill', '#09090B');
//         valueText.setAttribute('font-size', '14');

//         const valueLabel = document.createElementNS('http://www.w3.org/2000/svg', 'tspan');
//         valueLabel.textContent = 'Total Deals Value: ';
//         valueLabel.setAttribute('fill', '#09090B');

//         const valueValue = document.createElementNS('http://www.w3.org/2000/svg', 'tspan');
//         valueValue.textContent = stage.value;
//         valueValue.setAttribute('fill', '#3b82f6');
//         valueValue.setAttribute('font-weight', 'bold');

//         valueText.appendChild(valueLabel);
//         valueText.appendChild(valueValue);
//         svgOverlay.appendChild(valueText);
//       });

//       // Add horizontal line at the bottom connecting all vertical lines
//       const horizontalLine = document.createElementNS('http://www.w3.org/2000/svg', 'line');
//       horizontalLine.setAttribute('x1', '0');
//       horizontalLine.setAttribute('y1', String(svgHeight - 20));
//       horizontalLine.setAttribute('x2', String(svgWidth));
//       horizontalLine.setAttribute('y2', String(svgHeight - 20));
//       horizontalLine.setAttribute('stroke', '#e5e7eb');
//       horizontalLine.setAttribute('stroke-width', '2');
//       svgOverlay.appendChild(horizontalLine);

//       // Initialize D3 Funnel for the funnel shape
//       const data = stages.map((stage) => ({
//         label: '',
       
        
//         value: stage.count === 0 ?.001: stage.count
//       }));

//     //   const chart = new D3Funnel(funnelContainer);
//     //   chart.draw(data, {
//     //     chart: {
//     //       width: 350,
//     //       height: 350,
//     //       horizontal: false,
//     //       bottomWidth: 1 / 3,
//     //       bottomPinch: 0,
//     //       curve: {
//     //         enabled: true,
//     //         height: 15,
//     //       },
//     //     },
//     //     block: {
//     //         dynamicHeight: true,
//     //       dynamicSlope: false,
//     //       fill: {
//     //         type: 'solid',
//     //         scale: stages.map(s => s.color),
            
//     //       },
//     //       minHeight: 30,     
//     //       maxHeight: 80,
        
//     //       highlight: false,
//     //     },
//     //     label: {
//     //       enabled: false,
//     //     },
//     //   });
//     const chart = new D3Funnel(funnelContainer);
//     chart.draw(data, {
//       chart: {
//         width: 350,
//         height: 350,
//         horizontal: false,
//         bottomWidth: 1 / 3,
//         bottomPinch: 0,
//         curve: {
//           enabled: true,
//           height: 20,
//         },
//       },
//       block: {
//         dynamicHeight: false,
//         dynamicSlope: true,
//         fill: {
//           type: 'solid',
//           scale: stages.map(s => s.color),
//         },
//         minHeight: 30,
//         highlight: false,
//       },
//       label: {
//         enabled: false,
//       },
//     });

//       // Style the funnel SVG
//       setTimeout(() => {
//         const svg = funnelContainer.querySelector('svg');
//         if (!svg) return;
      
//         const blocks = svg.querySelectorAll('.block');
        
//         blocks.forEach((block, i) => {
//           const paths = block.querySelectorAll('path');
//           paths.forEach((p) => {
//             p.setAttribute('fill', stages[i].color);
//             p.setAttribute('stroke', 'none');
//             // p.setAttribute('fill-opacity', '0.35'); // لو عايزة نفس شفافية الصورة
//           });
//         });
//       }, 100);

//       wrapper.appendChild(funnelContainer);
//       wrapper.appendChild(svgOverlay);
//       chartRef.current.appendChild(wrapper);
//     }

//     return () => {
//       if (chartRef.current) {
//         chartRef.current.innerHTML = '';
//       }
//     };
//   }, [stages]);

//   if (loading) {
//     return (
//       <div style={{ padding: '40px', textAlign: 'center' }}>
//         جاري التحميل...
//       </div>
//     );
//   }

//   if (error) {
//     return (
//       <div style={{ color: 'red', padding: '20px' }}>
//         {error}
//       </div>
//     );
//   }

//   if (stages.length === 0) {
//     return (
//       <div style={{ padding: '40px', textAlign: 'center' }}>
//         لا توجد مراحل
//       </div>
//     );
//   }

//   return (
//     <div style={{ fontFamily: 'Tajawal, sans-serif', padding: '20px' }}>
//       <div ref={chartRef}></div>
//     </div>
//   );
// };

// export default ChartReport;


import React, { useState, useEffect, useCallback, useRef } from 'react';
import { __ } from '@wordpress/i18n';
import apiFetch from '@wordpress/api-fetch';
import { Card, CardContent } from '@/components/ui/card';
import './style.scss';
import D3Funnel from 'd3-funnel';
import { StageTextColor } from '@quillcrm/components/stagebody-color/stagebodyColor';

interface ChartReportProps {
  selectedPipelineId: number | null;
  ownerId?: number;
}

interface StageData {
  id: number;
  name: string;
  count: number;
  value: string;
  color: string;
  percentage?: number;
  originalIndex?: number;
}

const ChartReport: React.FC<ChartReportProps> = ({ selectedPipelineId, ownerId }) => {
  const [stages, setStages] = useState<StageData[]>([]);
  const [totalDeals, setTotalDeals] = useState<number>(0);
  const [totalValue, setTotalValue] = useState<string>('0');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const chartRef = useRef<HTMLDivElement>(null);

  const fetchStages = useCallback(async () => {
    if (!selectedPipelineId) {
      setStages([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const params = new URLSearchParams();
      params.append('pipeline_id', String(selectedPipelineId));
      if (ownerId) params.append('owner_id', String(ownerId));

      const response = (await apiFetch({
        path: `/qc/v1/reports/sales-rep/pipeline-stages?${params.toString()}`,
      })) as { pipeline_stages: { stages: any[] } };

      const rawStages = (response.pipeline_stages.stages || []).map((stage, index) => ({
        id: stage.id,
        name: stage.name,
        count: stage.count || 0,
        value: stage.value || '0',
        color: stage.color|| ['#60A5FA', '#8B5CF6', '#F59E0B', '#F97316', '#10B981', '#EF4444'],
        percentage: stage.percentage || 0,
        originalIndex: index,
      }));

      
      const total = rawStages.reduce((sum, s) => sum + s.count, 0);
      const totalVal = rawStages.reduce(
        (sum, s) => sum + (parseFloat(s.value.replace(/[^0-9.-]+/g, '')) || 0),
        0
      );

      
      const firstCount = rawStages[0]?.count || 1;
      const stagesWithPercentage = rawStages.map((stage) => ({
        ...stage,
        percentage: total > 0 ? Math.round((stage.count / firstCount) * 100) : 0,
      }));

      setStages(stagesWithPercentage); 
      setTotalDeals(total);
      setTotalValue(`$${totalVal.toLocaleString()}`);
      setLoading(false);
    } catch (err: any) {
      setError(err.message || __('Failed to fetch stages', 'quillcrm'));
      setLoading(false);
    }
  }, [selectedPipelineId, ownerId]);

  useEffect(() => {
    fetchStages();
  }, [fetchStages]);

useEffect(() => {
    if (chartRef.current && stages.length > 0) {
      chartRef.current.innerHTML = '';
  
     
      const sortedStages = [...stages].sort((a, b) => b.count - a.count);
  
      const wrapper = document.createElement('div');
      wrapper.style.position = 'relative';
      wrapper.style.width = '100%';
      wrapper.style.minHeight = '600px';
  
      const funnelContainer = document.createElement('div');
      funnelContainer.style.position = 'absolute';
    //   funnelContainer.style.width = '500px';
      funnelContainer.style.height = '1000px';
      funnelContainer.style.left = '50%';
      funnelContainer.style.top = '33%';
      funnelContainer.style.transform = 'translate(-50%, -50%) rotate(90deg)';
      funnelContainer.style.transformOrigin = 'center center';
      funnelContainer.style.display = 'flex';
      funnelContainer.style.justifyContent = 'center';
      funnelContainer.style.alignItems = 'center';
  
      // D3 Funnel
      const data = sortedStages.map((stage) => ({
        label: stage.name,
        value: stage.count, 
      }));
  
      const chart = new D3Funnel(funnelContainer);
      chart.draw(data, {
        chart: {
          width: 400,
          height: 1000,
          horizontal: false,
          bottomWidth: 1 / 3,
          bottomPinch: 0,
          curve: { enabled: true, height: 2 },
        },
        block: {
          dynamicHeight: true,   
          dynamicSlope: false,
          minHeight: 70,
          highlight: false,
          
          fill: {
            type: 'solid',
            scale: sortedStages.map((s) => s.color), 
          },
          borderWidth: 2,
        borderColor: '#fff'
        },
        label: { enabled: false },
      });
 
      setTimeout(() => {
        const svg = funnelContainer.querySelector('svg');
        if (!svg) return;
  
        const blocks = svg.querySelectorAll('g'); 
        blocks.forEach((block, i) => {
          const stage = sortedStages[i];
          if (!stage) return;
  
        //   // إنشاء عنصر <text> داخل البلوك
          const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
          text.setAttribute('text-anchor', 'middle');
          text.setAttribute('dominant-baseline', 'central');
          text.setAttribute('fill', StageTextColor(stage.color) || '#000'); 
          text.setAttribute('font-size', '14');
          text.setAttribute('font-weight', 'bold');
          text.setAttribute('pointer-events', 'none');
  
          const bbox = block.getBBox();
          const x = bbox.x + bbox.width / 2;
          const y = bbox.y + bbox.height / 2;
  
          text.setAttribute('x', String(x));
          text.setAttribute('y', String(y));
  
          
          const lines = [
            `Total Deals Value: ${stage.value}`,
            ` Total Deal: ${stage.count}`
          ];
  
          lines.forEach((line, j) => {
            const tspan = document.createElementNS('http://www.w3.org/2000/svg', 'tspan');
            tspan.textContent = line;
            tspan.setAttribute('x', String(x));
            tspan.setAttribute('dy', j === 0 ? '-0.6em' : '1.2em');
            text.appendChild(tspan);
          });
  
          block.appendChild(text);
       
        });
      }, 100);
  
      wrapper.appendChild(funnelContainer);
      chartRef.current.appendChild(wrapper);
    }
  
    return () => {
      if (chartRef.current) chartRef.current.innerHTML = '';
    };
  }, [stages]);
  

  if (loading) {
    return (
      <div className="chart-report-container">
        <div className="report-header">
          <h2 className="report-title">{__('Pipeline Funnel Chart', 'quillcrm')}</h2>
        </div>
        <div className="loading-spinner">{__('Loading funnel data...', 'quillcrm')}</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="chart-report-container">
        <div className="report-header">
          <h2 className="report-title">{__('Pipeline Funnel Chart', 'quillcrm')}</h2>
        </div>
        <div className="error-message">{error}</div>
      </div>
    );
  }

  if (stages.length === 0) {
    return (
      <div className="chart-report-container">
        <div className="report-header">
          <h2 className="report-title">{__('Pipeline Funnel Chart', 'quillcrm')}</h2>
        </div>
        <div className="empty-state">{__('No funnel data available', 'quillcrm')}</div>
      </div>
    );
  }

  return (
    <div className="chart-report-container p-5">
      <div className="report-header">
        <h3 className="report-title text-xl font-medium text-[#09090B]">{__('Pipeline Funnel Chart', 'quillcrm')}</h3>
      </div>
      <div className=" flex gap-3 items-center p-5">
        <div className="chart-wrapper">
          <div ref={chartRef}></div>
        </div>
        <div className=' flex flex-col gap-3 p-5 min-w-[200px]'
           >
            {stages.map((stage) => (
              <div className=' flex items-center gap-[10px]' key={stage.id}
                >
                <div className=' w-6 h-6 rounded-[4px] border' style={{ 
                  backgroundColor: stage.color,
                  borderColor:StageTextColor(stage.color),
                  flexShrink: 0
                }}></div>
                <span className=' text-base text-[#09090B] font-medium'>
                  {stage.name}
                </span>
              </div>
            ))}
          </div>
      </div>
    </div>
  );
};

export default ChartReport;
