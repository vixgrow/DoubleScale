import React, { useState } from 'react';
import EditHeaderIcon from '@quillcrm/components/icons/edit-header';
import { __ } from '@wordpress/i18n';
import { StageTextColor } from '@quillcrm/components/stagebody-color/stagebodyColor';

interface PipelineStageBoxProps {
  stage: {
    name?: string;
    color: string;
  };
  index: number;
  totalStages: number;
  children?: React.ReactNode;
}

interface PipelineStageBoxProps {
  stage: {
    name?: string;
    color: string;
  };
  index: number;
  totalStages: number;
  isActive?: boolean;
  children?: React.ReactNode;
}

export const PipelineStageHeaderBox: React.FC<PipelineStageBoxProps> = ({
  stage,
  index,
  totalStages,
  isActive = false,
  children,
}) => {
  // const { backgroundColor } = StageColorBody(stage.color, index, totalStages);
  const isFirst = index === 0;
  const isLast = index === totalStages - 1;

  return (
    <div
      className="relative flex items-center justify-center h-14"
      style={{
        backgroundColor: isActive ? stage.color : '#E5E7EB', 
        width: `${100 / totalStages}%`,
        marginLeft: isFirst ? 0 :5,
        zIndex: 100 - index,
        borderRadius: isFirst
          ? "10px 0 0 10px"
          : isLast
          ? "0 10px 10px 0"
          : undefined,
      }}
    >
      <span className='text-base font-semibold  whitespace-nowrap' style={{ color: isActive ? StageTextColor(stage.color) : '#9CA3AF' }} >
        {children}
      </span>

      {!isLast && (
        <span
          className="absolute top-0 right-[-14px] w-0 h-0"
          style={{
            borderTop: "28px solid transparent",
            borderBottom: "28px solid transparent",
            borderLeft: `15px solid ${isActive ? stage.color : '#E5E7EB'}`,
          }}
        />
      )}
      {!isFirst && (
        <span
          className="absolute top-0 left-0 w-0 h-0"
          style={{
            borderTop: "28px solid transparent",
            borderBottom: "28px solid transparent",
            borderLeft: "15px solid white",
          }}
        />
      )}
    </div>
  );
};



interface PipelineStagesHeaderProps {
    stages: {
      id: number;
      name: string;
      color: string;
      
    }[];
    currentStageId?: number;
  }
  
  export const PipelineStagesHeader: React.FC<PipelineStagesHeaderProps> = ({
    stages,
    currentStageId
  }) => {
    if (!Array.isArray(stages) || stages.length === 0) return null;

    const currentIndex = stages.findIndex(stage => stage.id === currentStageId);
  
    return (
      <div className="w-full overflow-hidden pt-3">
        <div className="flex w-full">
          {stages.map((stage, index) => (
            <PipelineStageHeaderBox
              key={stage.id || index}
              stage={stage}
              index={index}
              totalStages={stages.length}
              isActive={index <= currentIndex}
            >
              {stage.name}
            </PipelineStageHeaderBox>
          ))}
        </div>
        
      </div>
    );
  };
  