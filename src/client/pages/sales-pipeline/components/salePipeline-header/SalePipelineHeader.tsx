import React from 'react';
import { __ } from '@wordpress/i18n';
import { Button } from '@quillcrm/components/ui/button';
import { PageHeader, PlusIcon } from '@quillcrm/components';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import ArrowIcon from '@quillcrm/components/icons/dropdown-header';
import ArrowColoredIcon from '@quillcrm/components/icons/dropdown-headerColored';
import AddPipIcon from '@quillcrm/components/icons/addpip-header';
import DuplicatePipelineHeader from '@quillcrm/components/icons/duplicate-pipeline-header';
import ViewIcon from '@quillcrm/components/icons/view-header';
import EditHeaderIcon from '@quillcrm/components/icons/edit-header';
import TrashIcon from '@quillcrm/components/icons/trash';

interface PipelineHeaderProps {
  pipelines: any[];
  selectedPipeline: any;
  selectedPipelineId: number | null;
  setSelectedPipelineId: (id: number) => void;
  setNewPipelineModalVisible: (visible: boolean) => void;
  setDuplicatePipelineModalVisible: (visible: boolean) => void;
  setEditPipelineModalVisible: (visible: boolean) => void;
  setDeleteDialogOpen: (visible: boolean) => void;
  setNewDealModalVisible: (visible: boolean) => void;
  selectMode?: boolean;
  toggleSelectMode?: () => void;
  selectedCount?: number;
}

export const PipelineHeader: React.FC<PipelineHeaderProps> = ({
  pipelines,
  selectedPipeline,
  selectedPipelineId,
  setSelectedPipelineId,
  setNewPipelineModalVisible,
  setDuplicatePipelineModalVisible,
  setEditPipelineModalVisible,
  setDeleteDialogOpen,
  setNewDealModalVisible,
  selectMode = false,
  toggleSelectMode,
  selectedCount = 0,
}) => {

  return (
    <div className="flex justify-between items-center">
      <PageHeader
        title={selectedPipeline ? selectedPipeline.name : __('Select a pipeline', 'quillcrm')}
        subtitle={__('Pipelines', 'quillcrm')}
        actions={[]}
      />

      <div className="flex gap-4">
        {/* Pipeline dropdown + 3 dots */}
        <div className="flex items-center gap-1">
          <div className="flex items-center">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="outline"
                  disabled={pipelines.length <= 0}
                  className={`text-base font-medium !text-[#374151] leading-[26px] tracking-[-.5px] flex items-center justify-center gap-3 h-10 border !border-[#374151] py-2 px-4 rounded-l-[8px] rounded-r-none ${
                    pipelines.length <= 1 ? 'cursor-default' : ''
                  }`}
                >
                  {selectedPipeline ? selectedPipeline.name : 'Select Pipeline'}
                  <ArrowIcon />
                </Button>
              </DropdownMenuTrigger>

              {pipelines.length > 1 && (
                <DropdownMenuContent
                  style={{ boxShadow: '3px 3px 4px 0 rgba(0, 0, 0, 0.25)' }}
                  className="p-4 flex flex-col gap-[10px] rounded-[10px] border border-[#F5F5F5]"
                >
                  {pipelines.map((pipeline) => (
                    <DropdownMenuItem
                      key={pipeline.id}
                      onClick={
                        () => {setSelectedPipelineId(pipeline.id);
                      }
                    
                    }
                      className={selectedPipelineId === pipeline.id ? 'bg-gray-100' : ''}
                    >
                      {pipeline.name}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              )}
            </DropdownMenu>

            {/* Actions  */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="outline"
                  size="icon"
                  className="rounded-l-none rounded-r-[8px] text-base font-medium !text-[#374151] flex items-center justify-center h-10 w-10 p-0 border !border-[#374151]"
                >
                  
                  <PlusIcon color='#374151' width={24} height={24}/>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                align="end"
                style={{ boxShadow: '3px 3px 4px 0 rgba(0, 0, 0, 0.25)' }}
                className="p-4 flex flex-col gap-[10px] rounded-[10px] border border-[#F5F5F5]"
              >
                <DropdownMenuItem className="flex items-center gap-2 text-[#2E2C2F] font-medium text-sm leading-[16px]">
                  <ViewIcon />
                  {__('View Pipeline', 'quillcrm')}
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => setEditPipelineModalVisible(true)}
                  disabled={!selectedPipeline}
                  className="flex items-center gap-2 text-[#374151] font-medium text-sm leading-[16px]"
                >
                  <EditHeaderIcon />
                  {__('Edit Pipeline', 'quillcrm')}
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => setDeleteDialogOpen(true)}
                  className="flex items-center gap-2 text-[#2E2C2F] font-medium text-sm leading-[16px]"
                >
                  <TrashIcon />
                  {__('Delete Pipeline', 'quillcrm')}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {/* New Pipeline */}
        <div className="flex items-center gap-1">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="outline"
                className={`text-base font-medium !text-[#3B82F6] leading-[26px] tracking-[-.5px] flex items-center justify-center gap-3 h-10 border !border-[#3B82F6] py-2 px-4 rounded-[8px] `}
              >
                New Pipeline
                <ArrowColoredIcon />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              style={{ boxShadow: '3px 3px 4px 0 rgba(0, 0, 0, 0.25)' }}
              className="p-4 flex flex-col gap-[10px] rounded-[10px] border border-[#F5F5F5]"
            >
              <DropdownMenuItem
                onClick={() => setNewPipelineModalVisible(true)}
                className="flex items-center cursor-pointer gap-2 text-[#2E2C2F] font-medium text-sm leading-[16px]"
              >
                <AddPipIcon />
                New Pipeline
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => setDuplicatePipelineModalVisible(true)}
                disabled={!selectedPipeline}
                className="flex items-center cursor-pointer gap-2 text-[#2E2C2F] font-medium text-sm leading-[16px]"
              >
                <DuplicatePipelineHeader />
                Duplicate Pipeline
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Select Mode Toggle */}
        {toggleSelectMode && (
          <div className="flex items-center gap-1">
            <Button
              onClick={toggleSelectMode}
              variant={selectMode ? "default" : "outline"}
              className={`text-base font-medium leading-[26px] tracking-[-.5px] flex items-center justify-center gap-[6px] h-10 py-2 px-4 rounded-[8px] ${
                selectMode
                  ? 'bg-[#3B82F6] !text-white hover:bg-[#2563EB]'
                  : '!text-[#374151] border !border-[#374151]'
              }`}
            >
              {selectMode ? (
                <>
                  {__('Cancel', 'quillcrm')}
                  {selectedCount > 0 && (
                    <span className="ml-1 bg-white text-[#3B82F6] px-2 py-0.5 rounded-full text-sm font-semibold">
                      {selectedCount}
                    </span>
                  )}
                </>
              ) : (
                __('Bulk Select Deals', 'quillcrm')
              )}
            </Button>
          </div>
        )}

        {/* Add New Deal */}
        <div className="flex items-center gap-1">
          <Button
            onClick={() => setNewDealModalVisible(true)}
            disabled={selectMode}
            className={`text-base font-medium !text-[#FFF] leading-[26px] tracking-[-.5px] flex items-center justify-center gap-[6px] h-10 bg-[#1E3A8A] py-2 px-4 rounded-[8px] ${
              selectMode ? 'opacity-50 cursor-not-allowed' : ''
            }`}
          >
            + Add New Deal
          </Button>
        </div>
      </div>
    </div>
  );
};




