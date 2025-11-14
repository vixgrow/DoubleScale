import { __ } from '@wordpress/i18n';
import {
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
} from '@quillcrm/components/ui/accordion';
import GroupIcon from '@quillcrm/components/icons/group-icon';
import { Deal } from '../../types';
import { useCustomFields } from '@/client/pages/custom-fields/use-customFields';
import EditHeaderIcon from '@quillcrm/components/icons/edit-header';
import { PlusIcon } from '@quillcrm/components';
import CustomFields from '@/client/pages/custom-fields';
import { useNavigate } from 'react-router';

interface CustomFieldsViewProps {
  deal: Deal;
}

export const CustomFieldsView = ({ deal }: CustomFieldsViewProps) => {
  const { groups, isLoading, error } = useCustomFields() as any;

//   const AddCustomFieldButton = () => {
    const navigate = useNavigate();
//   }

  if (isLoading)
    return (
      <div className="mt-4">
      <div className="h-6 w-40 bg-gray-200 animate-pulse mb-4 rounded"></div>
      <div className="h-12 w-full bg-gray-200 animate-pulse rounded mb-3"></div>
      <div className="h-12 w-full bg-gray-200 animate-pulse rounded mb-3"></div>
      <div className="h-12 w-full bg-gray-200 animate-pulse rounded mb-3"></div>
    </div>
    );

  if (error)
    return (
      <p className="text-sm text-red-500">
        {__('Failed to load custom fields', 'quillcrm')}
      </p>
    );

    if (!isLoading && (!groups || groups.length === 0)) {
      return (
        <p className="text-sm text-gray-500">
          {__('No custom fields available.', 'quillcrm')}
        </p>
    )
  }

  return (
    <div className="flex flex-col gap-4 mt-4">
      <label className="font-medium text-[#09090B] text-base">
        {__('Custom Fields', 'quillcrm')}
      </label>

      {groups.length?(
        <Accordion type="multiple" className="w-full">
        {groups.map((group: any) => (
          <AccordionItem key={group.id} value={group.slug} className="mb-6">
            <AccordionTrigger className="flex justify-between py-3 px-4 items-center w-full bg-[#F8F8F8] h-12 border border-[#DEE1E6] rounded-[8px]">
              <span className="flex items-center gap-2">
                <GroupIcon />
                <span className="text-lg font-medium text-[#09090B]">
                  {group.name}
                </span>
              </span>
            </AccordionTrigger>

            <AccordionContent className="grid grid-cols-1 md:grid-cols-2 gap-6 rounded-bl-[8px] rounded-br-[8px] border border-[#DEE1E6] p-6">
  {group.custom_fields?.length ? (
    group.custom_fields.map((field: any) => (
      <div key={field.id} className="col-span-2 grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
        
        {/* Field Label & Name */}
        <div className="flex flex-col gap-2">
          <p className="text-[#777] text-base font-medium">
            {__('Label Name', 'quillcrm')}
          </p>
          <p className="text-[#09090B] font-bold text-lg">{field.name}</p>
        </div>

        {/* Deal Owner */}
        {deal.owner && (
          <div className="flex justify-between items-center border-t md:border-t-0 md:border-l border-[#DEE1E6] pt-4 md:pt-0 md:pl-6">
            <div className="flex flex-col gap-2">
              <p className="text-[#777] text-base font-medium">
                {__('Deal Owner', 'quillcrm')}
              </p>
              <p className="text-[#09090B] font-bold text-lg">
                {deal.owner.display_name}
              </p>
            </div>

            <button
              type="button"
              className="w-8 h-8 flex items-center justify-center rounded-full bg-[#E4EEFD] hover:bg-[#D8E5FA] transition"
            >
              <EditHeaderIcon color="#458DC7" width={20} height={20} />
            </button>
          </div>
        )}
      </div>
    ))
  ) : (
    <p className="text-sm text-gray-500 col-span-2">
      {__('No fields in this group.', 'quillcrm')}
    </p>
  )}
</AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
      ):(
        <div className=" flex justify-center items-center flex-col text-center h-full ">
						<span className=" block my-2">
							<GroupIcon width={58} height={58}/>
						</span>
						<p className=" my-2  text-base font-medium leading-7 tracking-[-.5px] text-[#777]">
							{__('No Custom Fields', 'quillcrm')}
						</p>
						<button onClick={() => navigate('/custom-fields')} className=' h-10 text-[#458DC7] border border-[#458DC7] rounded-[8px] flex justify-center items-center'>
                           <PlusIcon color='#458DC7'/>
                           Add Custom Filed
                        </button>
					</div>
      )}

      
    </div>
  );
};
