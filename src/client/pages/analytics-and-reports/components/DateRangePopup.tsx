// import React, { useState, useRef, useEffect } from 'react';
// import { Calendar } from 'lucide-react';
// import { __ } from '@wordpress/i18n';

// interface DateRange {
//   from: Date | null;
//   to: Date | null;
// }

// interface DateRangePopupProps {
//   value: DateRange;
//   onChange: (range: DateRange) => void;
//   className?: string;
// }

// interface QuickRange {
//   label: string;
//   getValue: () => DateRange;
// }

// export const DateRangePopup: React.FC<DateRangePopupProps> = ({ 
//   value, 
//   onChange, 
//   className = '' 
// }) => {
//   const [isOpen, setIsOpen] = useState(false);
//   const [tempRange, setTempRange] = useState<DateRange>(value);
//   const [currentMonth, setCurrentMonth] = useState(new Date());
//   const [nextMonth, setNextMonth] = useState(() => {
//     const next = new Date();
//     next.setMonth(next.getMonth() + 1);
//     return next;
//   });
//   const popupRef = useRef<HTMLDivElement>(null);

//   useEffect(() => {
//     const handleClickOutside = (event: MouseEvent) => {
//       if (popupRef.current && !popupRef.current.contains(event.target as Node)) {
//         setIsOpen(false);
//       }
//     };

//     if (isOpen) {
//       document.addEventListener('mousedown', handleClickOutside);
//     }

//     return () => {
//       document.removeEventListener('mousedown', handleClickOutside);
//     };
//   }, [isOpen]);

//   const quickRanges: QuickRange[] = [
//     { label: __('Today', 'quillcrm'), getValue: () => ({ from: new Date(), to: new Date() }) },
//     { label: __('This week', 'quillcrm'), getValue: () => {
//       const today = new Date();
//       const first = new Date(today.setDate(today.getDate() - today.getDay()));
//       const last = new Date(today.setDate(today.getDate() - today.getDay() + 6));
//       return { from: first, to: last };
//     }},
//     { label: __('Last week', 'quillcrm'), getValue: () => {
//       const today = new Date();
//       const first = new Date(today.setDate(today.getDate() - today.getDay() - 7));
//       const last = new Date(today.setDate(today.getDate() - today.getDay() + 6));
//       return { from: first, to: last };
//     }},
//     { label: __('This month', 'quillcrm'), getValue: () => {
//       const today = new Date();
//       const first = new Date(today.getFullYear(), today.getMonth(), 1);
//       const last = new Date(today.getFullYear(), today.getMonth() + 1, 0);
//       return { from: first, to: last };
//     }},
//     { label: __('Last month', 'quillcrm'), getValue: () => {
//       const today = new Date();
//       const first = new Date(today.getFullYear(), today.getMonth() - 1, 1);
//       const last = new Date(today.getFullYear(), today.getMonth(), 0);
//       return { from: first, to: last };
//     }},
//     { label: __('This Quarter', 'quillcrm'), getValue: () => {
//       const today = new Date();
//       const quarter = Math.floor(today.getMonth() / 3);
//       const first = new Date(today.getFullYear(), quarter * 3, 1);
//       const last = new Date(today.getFullYear(), quarter * 3 + 3, 0);
//       return { from: first, to: last };
//     }},
//     { label: __('Last Quarter', 'quillcrm'), getValue: () => {
//       const today = new Date();
//       const quarter = Math.floor(today.getMonth() / 3) - 1;
//       const first = new Date(today.getFullYear(), quarter * 3, 1);
//       const last = new Date(today.getFullYear(), quarter * 3 + 3, 0);
//       return { from: first, to: last };
//     }},
//     { label: __('YTD', 'quillcrm'), getValue: () => {
//       const today = new Date();
//       const first = new Date(today.getFullYear(), 0, 1);
//       return { from: first, to: new Date() };
//     }},
//   ];

//   const getDaysInMonth = (date: Date) => {
//     const year = date.getFullYear();
//     const month = date.getMonth();
//     const firstDay = new Date(year, month, 1);
//     const lastDay = new Date(year, month + 1, 0);
//     const daysInMonth = lastDay.getDate();
//     const startingDayOfWeek = firstDay.getDay();
    
//     return { daysInMonth, startingDayOfWeek, year, month };
//   };

//   const formatDate = (date: Date | null): string => {
//     if (!date) return '';
//     return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
//   };

//   const isSameDay = (date1: Date | null, date2: Date | null): boolean => {
//     if (!date1 || !date2) return false;
//     return date1.toDateString() === date2.toDateString();
//   };

//   const isInRange = (date: Date, range: DateRange): boolean => {
//     if (!range.from || !range.to) return false;
//     return date >= range.from && date <= range.to;
//   };

//   const handleDateClick = (date: Date) => {
//     if (!tempRange.from || (tempRange.from && tempRange.to)) {
//       setTempRange({ from: date, to: null });
//     } else {
//       if (date < tempRange.from) {
//         setTempRange({ from: date, to: tempRange.from });
//       } else {
//         setTempRange({ from: tempRange.from, to: date });
//       }
//     }
//   };

//   const handleQuickRange = (range: QuickRange) => {
//     const newRange = range.getValue();
//     setTempRange(newRange);
//   };

//   const handleApply = () => {
//     onChange(tempRange);
//     setIsOpen(false);
//   };

//   const handleCancel = () => {
//     setTempRange(value);
//     setIsOpen(false);
//   };

//   const renderCalendar = (date: Date) => {
//     const { daysInMonth, startingDayOfWeek, year, month } = getDaysInMonth(date);
//     const days: JSX.Element[] = [];
//     const monthName = date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

//     // Add empty cells for days before month starts
//     for (let i = 0; i < startingDayOfWeek; i++) {
//       const prevMonth = new Date(year, month, 0);
//       const prevMonthDay = prevMonth.getDate() - startingDayOfWeek + i + 1;
//       days.push(
//         <div key={`empty-${i}`} className="text-gray-300 text-center py-2 text-sm">
//           {prevMonthDay}
//         </div>
//       );
//     }

//     // Add days of current month
//     for (let day = 1; day <= daysInMonth; day++) {
//       const currentDate = new Date(year, month, day);
//       const isSelected = isSameDay(currentDate, tempRange.from) || isSameDay(currentDate, tempRange.to);
//       const isInSelectedRange = isInRange(currentDate, tempRange);
//       const isToday = isSameDay(currentDate, new Date());

//       days.push(
//         <button
//           key={day}
//           onClick={() => handleDateClick(currentDate)}
//           className={`
//             text-center py-2 text-sm rounded transition-colors
//             ${isSelected ? 'bg-blue-500 text-white font-semibold' : ''}
//             ${isInSelectedRange && !isSelected ? 'bg-blue-100' : ''}
//             ${isToday && !isSelected ? 'bg-blue-50 font-semibold' : ''}
//             ${!isSelected && !isInSelectedRange && !isToday ? 'hover:bg-gray-100' : ''}
//           `}
//         >
//           {day}
//         </button>
//       );
//     }

//     return (
//       <div className="flex-1 px-3">
//         <div className="font-semibold text-center mb-3">{monthName}</div>
//         <div className="grid grid-cols-7 gap-1 mb-2">
//           {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
//             <div key={day} className="text-xs text-gray-600 text-center font-medium py-1">
//               {day}
//             </div>
//           ))}
//         </div>
//         <div className="grid grid-cols-7 gap-1">
//           {days}
//         </div>
//       </div>
//     );
//   };

//   const handlePrevMonth = () => {
//     setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1));
//     setNextMonth(new Date(nextMonth.getFullYear(), nextMonth.getMonth() - 1));
//   };

//   const handleNextMonth = () => {
//     setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1));
//     setNextMonth(new Date(nextMonth.getFullYear(), nextMonth.getMonth() + 1));
//   };

//   return (
//     <div className={`relative ${className}`} ref={popupRef}>
//       <button
//         onClick={() => setIsOpen(!isOpen)}
//         className="w-full px-3 py-2 border border-gray-300 rounded-md bg-white hover:bg-gray-50 flex items-center justify-between"
//       >
//         <span className="text-sm">
//           {value.from && value.to 
//             ? `${formatDate(value.from)} - ${formatDate(value.to)}`
//             : __('Select date range', 'quillcrm')}
//         </span>
//         <Calendar className="w-4 h-4 text-gray-500" />
//       </button>

//       {isOpen && (
//         <div className="absolute top-full right-0 mt-2 bg-white border border-gray-200 rounded-lg shadow-xl z-50 p-4" style={{ minWidth: '650px' }}>
//           <div className="flex gap-4">
//             {/* Quick ranges sidebar */}
//             <div className="w-40 border-r border-gray-200 pr-4">
//               <div className="text-xs font-semibold text-gray-600 mb-2">{__('QUICK RANGES', 'quillcrm')}</div>
//               {quickRanges.map((range, idx) => (
//                 <button
//                   key={idx}
//                   onClick={() => handleQuickRange(range)}
//                   className="w-full text-left px-2 py-1.5 text-sm hover:bg-gray-100 rounded mb-1"
//                 >
//                   {range.label}
//                 </button>
//               ))}
//               <button
//                 onClick={() => setTempRange({ from: null, to: null })}
//                 className="w-full text-left px-2 py-1.5 text-sm text-blue-600 hover:bg-blue-50 rounded mt-2"
//               >
//                 {__('Custom Date', 'quillcrm')}
//               </button>
//             </div>

//             {/* Calendars */}
//             <div className="flex-1">
//               <div className="flex items-center justify-between mb-4">
//                 <button
//                   onClick={handlePrevMonth}
//                   className="p-1 hover:bg-gray-100 rounded"
//                 >
//                   <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
//                     <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
//                   </svg>
//                 </button>
//                 <button
//                   onClick={handleNextMonth}
//                   className="p-1 hover:bg-gray-100 rounded"
//                 >
//                   <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
//                     <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
//                   </svg>
//                 </button>
//               </div>

//               <div className="flex gap-4">
//                 {renderCalendar(currentMonth)}
//                 {renderCalendar(nextMonth)}
//               </div>

//               {/* Action buttons */}
//               <div className="flex justify-end gap-2 mt-4 pt-4 border-t border-gray-200">
//                 <button
//                   onClick={handleCancel}
//                   className="px-4 py-2 text-sm text-red-600 hover:bg-red-50 rounded"
//                 >
//                   {__('Cancel', 'quillcrm')}
//                 </button>
//                 <button
//                   onClick={handleApply}
//                   className="px-4 py-2 text-sm bg-blue-600 text-white hover:bg-blue-700 rounded"
//                 >
//                   {__('Apply', 'quillcrm')}
//                 </button>
//               </div>
//             </div>
//           </div>
//         </div>
//       )}
//     </div>
//   );
// };

import React, { useState, useRef, useEffect } from 'react';
import { Calendar } from 'lucide-react';
import { __ } from '@wordpress/i18n';
// import { getPredefinedDateRange } from '@/client/pages/analytics-and-reports/hooks/usePredefinedPeriod';
import dayjs from 'dayjs';
import { getPredefinedDateRange } from '@quillcrm/components/reports/hooks/usePredefinedPeriod';
import { ArrowUpIcon } from '@quillcrm/components';
import PrevArrowIcon from '@quillcrm/components/icons/prev-arrow';
import NextArrowIcon from '@quillcrm/components/icons/next-arrow';
import DropArrowIcon from '@quillcrm/components/icons/drop-arrow';

interface DateRange {
  from: Date | null;
  to: Date | null;
}

interface DateRangePopupProps {
  value: DateRange;
  onChange: (range: DateRange) => void;
  className?: string;
  position?: string;
}

// استخدام نفس الـ options من ReportFilters (بدون custom_date_range)
const PREDEFINED_DATE_RANGE_OPTIONS = [
  { value: 'today', label: __('Today', 'quillcrm') },
  { value: 'this_week', label: __('This Week', 'quillcrm') },
  { value: 'this_month', label: __('This Month', 'quillcrm') },
  { value: 'this_quarter', label: __('This Quarter', 'quillcrm') },
  { value: 'ytd', label: __('YTD', 'quillcrm') },
  { value: 'last_week', label: __('Last Week', 'quillcrm') },
  { value: 'last_month', label: __('Last Month', 'quillcrm') },
  { value: 'last_quarter', label: __('Last Quarter', 'quillcrm') },
];

export const DateRangePopup: React.FC<DateRangePopupProps> = ({ 
  value, 
  onChange, 
  className = '' ,
  position = 'left'
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [tempRange, setTempRange] = useState<DateRange>(value);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [nextMonth, setNextMonth] = useState(() => {
    const next = new Date();
    next.setMonth(next.getMonth() + 1);
    return next;
  });
  const popupRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (popupRef.current && !popupRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();
    
    return { daysInMonth, startingDayOfWeek, year, month };
  };

  const formatDate = (date: Date | null): string => {
    if (!date) return '';
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const isSameDay = (date1: Date | null, date2: Date | null): boolean => {
    if (!date1 || !date2) return false;
    return date1.toDateString() === date2.toDateString();
  };

  const isInRange = (date: Date, range: DateRange): boolean => {
    if (!range.from || !range.to) return false;
    return date >= range.from && date <= range.to;
  };

  const handleDateClick = (date: Date) => {
    if (!tempRange.from || (tempRange.from && tempRange.to)) {
      setTempRange({ from: date, to: null });
    } else {
      if (date < tempRange.from) {
        setTempRange({ from: date, to: tempRange.from });
      } else {
        setTempRange({ from: tempRange.from, to: date });
      }
    }
  };

  const handleQuickRange = (rangeKey: string) => {
    const dateRange = getPredefinedDateRange(rangeKey);
    if (dateRange) {
      const newRange: DateRange = {
        from: dateRange[0].toDate(),
        to: dateRange[1].toDate(),
      };
      setTempRange(newRange);
    }
  };

  const handleApply = () => {
    onChange(tempRange);
    setIsOpen(false);
  };

  const handleCancel = () => {
    setTempRange(value);
    setIsOpen(false);
  };

  const renderCalendar = (date: Date) => {
    const { daysInMonth, startingDayOfWeek, year, month } = getDaysInMonth(date);
    const days: JSX.Element[] = [];
    const monthName = date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

    // Add empty cells for days before month starts
    for (let i = 0; i < startingDayOfWeek; i++) {
      const prevMonth = new Date(year, month, 0);
      const prevMonthDay = prevMonth.getDate() - startingDayOfWeek + i + 1;
      days.push(
        <div key={`empty-${i}`} className="text-gray-300 text-center py-2 text-sm">
          {prevMonthDay}
        </div>
      );
    }

    // Add days of current month
    for (let day = 1; day <= daysInMonth; day++) {
      const currentDate = new Date(year, month, day);
      const isSelected = isSameDay(currentDate, tempRange.from) || isSameDay(currentDate, tempRange.to);
      const isInSelectedRange = isInRange(currentDate, tempRange);
      const isToday = isSameDay(currentDate, new Date());

      days.push(
        <button
          key={day}
          onClick={() => handleDateClick(currentDate)}
          className={`
            text-center py-2 text-sm rounded transition-colors
            ${isSelected ? 'bg-[#458DC7] text-white font-semibold' : ''}
            ${isInSelectedRange && !isSelected ? 'bg-[#E3EEFF] text-[#458DC7]' : ''}
            ${isToday && !isSelected ? 'bg-blue-50 font-semibold' : ''}
            ${!isSelected && !isInSelectedRange && !isToday ? 'hover:bg-gray-100 text-[#09090B]' : ''}
          `}
        >
          {day}
        </button>
      );
    }

    return (
      <div className="flex-1 px-3">
        <div className="font-semibold text-center mb-3 text-[#09090B]">{monthName}</div>
        <div className="grid grid-cols-7 gap-1 mb-2">
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
            <div key={day} className="text-xs text-center font-medium py-1 text-[#09090B]">
              {day}
            </div>
          ))}
        </div>
        <div className="grid grid-cols-7 gap-1">
          {days}
        </div>
      </div>
    );
  };

  const handlePrevMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1));
    setNextMonth(new Date(nextMonth.getFullYear(), nextMonth.getMonth() - 1));
  };

  const handleNextMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1));
    setNextMonth(new Date(nextMonth.getFullYear(), nextMonth.getMonth() + 1));
  };
  const positionClasses = position === 'right' 
    ? 'right-0' 
    : 'left-0';

  return (
    <div className={`relative ${className}`} ref={popupRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full h-12 py-[5px] px-4 border border-[#DEE1E6] rounded-[8px] bg-[#FFF] flex items-center justify-between"
      >
        <span className="text-sm text-[#09090B] font-[Manrope]">
          {value.from && value.to 
            ? `${formatDate(value.from)} - ${formatDate(value.to)}`
            : __('Select Period', 'quillcrm')}
        </span>
        <DropArrowIcon/>
      </button>

      {isOpen && (
        <div className={`absolute ${positionClasses} top-full z-[1000] mt-2 bg-white border border-gray-200 rounded-lg shadow-xl p-4`} style={{ minWidth: '650px' }}>
          <div className="flex gap-4">
            {/* Quick ranges sidebar */}
            <div className="w-40 flex flex-col justify-center items-center border-r border-gray-200 pr-4">
              {PREDEFINED_DATE_RANGE_OPTIONS.map((range) => (
                <button
                  key={range.value}
                  onClick={() => handleQuickRange(range.value)}
                  className=" text-center py-1 px-[10px] block font-[Inter] font-normal leading-[26px] text-base text-[#09090B] hover:bg-gray-100 rounded mb-1"
                >
                  {range.label}
                </button>
              ))}
              <button
                onClick={() => setTempRange({ from: null, to: null })}
                className=" bg-[#458DC7] text-center font-[Poppins] font-normal leading-[22px] text-sm text-[#FFF] py-1 px-[10px]  rounded-[6px] mt-2"
              >
                {__('Custom Date', 'quillcrm')}
              </button>
            </div>

            {/* Calendars */}
            <div className="flex-1">
              <div className="flex items-center justify-between mb-4">
                <button
                  onClick={handlePrevMonth}
                  className="w-6 h-6 hover:bg-gray-100 rounded-full flex justify-center items-center bg-[#e9ecf0]"
                >
                  <PrevArrowIcon/>
                </button>
                <button
                  onClick={handleNextMonth}
                  className="w-6 h-6 hover:bg-gray-100 rounded-full flex justify-center items-center bg-[#e9ecf0]"
                >
                  <NextArrowIcon/>
                </button>
              </div>

              <div className="flex gap-4">
                {renderCalendar(currentMonth)}
                {renderCalendar(nextMonth)}
              </div>

              {/* Action buttons */}
              <div className="flex justify-end gap-2 mt-4 pt-4 border-t border-gray-200">
                <button
                  onClick={handleCancel}
                  className="p-3 text-base font-semibold h-12 bg-transparent border border-[#E13B3B] text-[#E13B3B]  rounded-[8px]"
                >
                  {__('Cancel', 'quillcrm')}
                </button>
                <button
                  onClick={handleApply}
                  className="p-3 text-base font-semibold h-12 bg-[#1E3A8A] text-white  rounded-[8px]"
                >
                  {__('Apply', 'quillcrm')}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};