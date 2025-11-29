import React, { useState } from "react";
import { Pencil, Trash2, Plus, Check, X } from "lucide-react";
import { EditIcon, PlusIcon } from "@quillcrm/components";
import TrashIcon from "@quillcrm/components/icons/trash";
import EditHeaderIcon from "@quillcrm/components/icons/edit-header";
import ButtonComponent from "../component/button";
import { Pagination, PaginationContent, PaginationEllipsis, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from "@quillcrm/components/ui/pagination";

export default function Lists({ onNext, onPrevious ,onSkip}: { onNext: () => void; onPrevious: () => void,onSkip:()=>void}) {
  const [segments, setSegments] = useState([
    { id: 1, name: "EG User Type", slug: "Slug", isEditing: false },
    { id: 2, name: "EG User Type", slug: "Slug", isEditing: false, showConfirm: true },
    { id: 3, name: "User Type", slug: "Slug", isEditing: false },
    { id: 4, name: "User Type", slug: "Slug", isEditing: false },
  ]);

  const [isAdding, setIsAdding] = useState(false);
  const [newSegment, setNewSegment] = useState({ name: "", slug: "" });

  const handleAdd = () => {
    if (newSegment.name && newSegment.slug) {
      setSegments([...segments, { id: Date.now(), ...newSegment, isEditing: false }]);
      setNewSegment({ name: "", slug: "" });
      setIsAdding(false);
    }
  };

  const handleCancel = () => {
    setNewSegment({ name: "", slug: "" });
    setIsAdding(false);
  };

  const handleDelete = (id) => {
    setSegments(segments.filter((s) => s.id !== id));
  };

  return (
    <div className="flex flex-col gap-10">
     <div>
        <h3 className="text-[#170F49] text-[32px] font-semibold">
         Segment Your Contacts—Create Smart Lists for Better Targeting
        </h3>
        <p className="text-[#777] text-lg font-normal leading-7">
          Create smart contact segments to organize leads, customers, and users by type, behavior. From VIPs to WordPress users, segmenting helps you personalize outreach and automate with precision.
         </p>
      </div>
        {/* Table */}
        <div className="border border-[#DEE1E6] rounded-[8px] overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="bg-[#F8F8F8] border-b border-[#DEE1E6]">
                <th className="text-left px-6 py-4 text-sm  font-medium text-[#09090B]">
                  Segment Name
                </th>
                <th className="text-left px-6 py-4 text-sm font-medium text-[#09090B]">
                  Slug
                </th>
                <th className=" text-center px-6 py-4 text-sm font-medium text-[#09090B]">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
                 <tr className="border-b border-[#DEE1E6]">
                  <td className="px-6 py-3">
                    <input
                      type="text"
                      placeholder="EG User Type"
                      value={newSegment.name}
                      onChange={(e) => setNewSegment({ ...newSegment, name: e.target.value })}
                      className="w-full px-4 py-[5px] bg-[#FFF] border !border-[#DEE1E6] rounded-[8px] text-sm text-[#9197A4] focus:outline-none focus:ring-2 focus:ring-[#458DC7]"
                      autoFocus
                    />
                  </td>
                  <td className="px-6 py-3">
                    <input
                      type="text"
                      placeholder="Slug"
                      value={newSegment.slug}
                      onChange={(e) =>
                        setNewSegment({
                          ...newSegment,
                          slug: e.target.value,
                        })
                      }
                      className="w-full px-4 py-[5px] bg-[#FFF] border !border-[#DEE1E6] rounded-[8px] text-sm text-[#9197A4] focus:outline-none focus:ring-2 focus:ring-[#458DC7]"
                    />
                  </td>
                  <td className="px-6 py-3 text-center">
                    <div className=" flex justify-center">
                    <button
                      onClick={handleAdd}
                      className="flex items-center justify-center  rounded-full border p-2 border-[#374151] text-[#374151]"
                    >
                      <PlusIcon color="#374151" width={16} height={16}/>
                    </button>
                    </div>
                  </td>
                </tr>

              {/* Row with Confirm Button */}
              <tr className="border-b border-[#DEE1E6]">
                <td className="px-6 py-4">
                  <input
                    type="text"
                    value="EG User Type"
                    className="w-full px-4 py-[5px] !bg-[#FFF] border !border-[#DEE1E6] rounded-[8px] text-sm text-[#9197A4] focus:outline-none focus:ring-2 focus:ring-[#458DC7]"
                    readOnly
                  />
                </td>
                <td className="px-6 py-4">
                  <input
                    type="text"
                    value="Slug"
                    className="w-full px-4 py-[5px] !bg-[#FFF] border !border-[#DEE1E6] rounded-[8px] text-sm text-[#9197A4] focus:outline-none focus:ring-2 focus:ring-[#458DC7]"
                    readOnly
                  />
                </td>
                <td className="px-6 py-4 text-center">
                  <button className="px-4 py-2 border border-[#458DC7] text-[#458DC7] rounded-md text-sm font-medium ">
                    Confirm
                  </button>
                </td>
              </tr>

              {/* Regular Rows */}
              {segments.slice(2).map((segment) => (
                <tr key={segment.id} className="border-b border-[#DEE1E6] bg-white hover:bg-gray-50">
                  <td className="px-6 py-4 text-sm text-[#09090B]">{segment.name}</td>
                  <td className="px-6 py-4 text-sm text-[#09090B]">{segment.slug}</td>
                  <td className="px-6 py-4 text-center">
                    <button className="inline-flex items-center justify-center w-8 h-8 text-blue-600 hover:bg-blue-50 rounded mr-2">
                      <EditHeaderIcon color="#458DC7"/>
                    </button>
                    <button
                      onClick={() => handleDelete(segment.id)}
                      className="inline-flex items-center justify-center w-8 h-8 text-red-600 hover:bg-red-50 rounded"
                    >
                      <TrashIcon/>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Footer with Pagination */}
          <div className="flex items-center justify-between px-6 py-4  border-t border-[#E4E4E7]">
            <div  className=" flex justify-center items-center gap-4">
            <p className="text-sm text-[#3F3F46]">
              Showing 1 to 10 of 843 results
            </p>
            <div className="flex items-center gap-4 bg-[#FFF] rounded-[8px] py-2 px-3" style={{boxShadow: '0 0 0 1px rgba(9, 9, 11, 0.10), 0 1px 2px 0 rgba(0, 0, 0, 0.05)'}}>
              <span className="text-sm text-[#71717A] pr-2 border-r border-[#6B7280]">Per page</span>
              <select className=" rounded-md px-3 py-1 text-sm text-[#09090B] border-0 outline:0 focus:border-0 focus:outline-none">
                <option>10</option>
                <option>20</option>
                <option>50</option>
              </select>
            </div>
            </div>
              
              <div className="flex items-center gap-1">
              <Pagination>
              <PaginationContent>
                <PaginationItem><PaginationPrevious href="#" /></PaginationItem>
                <PaginationItem><PaginationLink href="#">1</PaginationLink></PaginationItem>
                <PaginationItem><PaginationLink href="#" isActive>2</PaginationLink></PaginationItem>
                <PaginationItem><PaginationLink href="#">3</PaginationLink></PaginationItem>
                <PaginationItem><PaginationLink href="#">4</PaginationLink></PaginationItem>
                <PaginationItem><PaginationEllipsis /></PaginationItem>
                <PaginationItem><PaginationLink href="#">85</PaginationLink></PaginationItem>
                <PaginationItem><PaginationNext href="#" /></PaginationItem>
              </PaginationContent>
            </Pagination>
              </div>
            </div>
          </div>

          <div className="flex justify-between pt-8">
            <div className=" flex gap-2">
            <ButtonComponent onClick={onPrevious} type="">
              Previous
            </ButtonComponent>

            <ButtonComponent type="no" onClick={onSkip}>
              Skip →
            </ButtonComponent>
            </div>
            <ButtonComponent type="go" onClick={onNext}>
              Next Step
            </ButtonComponent>
          </div>
        </div>
         
         
        // {/* Bottom Navigation */}
        // <div className="flex items-center justify-between mt-8">
        //   <button className="px-6 py-2 border border-blue-600 text-blue-600 rounded-md text-sm font-medium hover:bg-blue-50">
        //     Previous
        //   </button>
        //   <div className="flex gap-3">
        //     <button className="px-6 py-2 text-blue-600 text-sm font-medium hover:bg-blue-50 rounded-md">
        //       Skip →
        //     </button>
        //     <button className="px-8 py-2 bg-blue-900 text-white rounded-md text-sm font-medium hover:bg-blue-800">
        //       Next Step
        //     </button>
        //   </div>
        // </div>
    //   </div>
  );
}