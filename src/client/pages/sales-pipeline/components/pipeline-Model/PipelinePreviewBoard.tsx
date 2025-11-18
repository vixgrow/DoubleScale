import { PipelineStageHeaderBox } from '@quillcrm/components/pipeline-stage-headerBox/pipeline-stage-headerBox';
import {  StageTextColor } from '@quillcrm/components/stagebody-color/stagebodyColor';
import { __ } from '@wordpress/i18n';

export const PipelinePreviewBoard = ({ stages }) => {
	if (!stages) return null;

	return (
		<div className="pipeline-board w-full overflow-x-auto  ">
			<div
				className="grid gap-4  min-h-[400px]"
				style={{
					gridTemplateColumns: `repeat(${stages.length}, minmax(120px, 1fr))`,
				}}
			>
				{stages.map((stage, index) => {
					

					return (
						<div
							key={index}
							className=" flex flex-col  p-0 m-0 relative"
						>
							<PipelineStageHeaderBox
								stage={stage}
								index={index}
								totalStages={stages.length}
							>
								<div
									className="font-bold  text-base leading-[26px] truncate max-w-[120px] tracking-[-.5px]"
									style={{ color: StageTextColor(stage.color) }}
								>
									{stage.name || `Stage ${index + 1}`}
								</div>
							</PipelineStageHeaderBox>

							<div
								className="relative flex flex-col items-center p-4 pt-0 rounded-[8px] rounded-t-none shadow-sm h-full overflow-hidden "
								style={{ background: stage.color }}
							>
								<div className="flex flex-col gap-3 w-full items-center mt-6">
									{Array.from({ length: 10 }).map((_, i) => (
										<div
											key={`cell-${index}-${i}`}
											className=" w-full px-4 py-1 bg-[#FFFFFFCC] border border-[#DEE1E6] rounded-[8px] h-9 flex items-center justify-center shadow-sm hover:shadow-md transition"
										></div>
									))}
								</div>
							</div>
						</div>
					);
				})}
			</div>
		</div>
	);
};
