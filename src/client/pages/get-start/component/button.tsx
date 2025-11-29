import { Button } from '@quillcrm/components/ui/button'
import React from 'react'

export default function ButtonComponent({ children, onClick, type }: { children: React.ReactNode; onClick?: () => void; type?: string }) {
  return (
    <Button
      onClick={onClick}
      className={ `rounded-[8px] leading-7 ${type === 'go' ? 'bg-[#1E3A8A]  py-3 px-4 color-[#FFF] text-lg ' :type==='no'?' text-[#1E3A8A] hover:bg-transparent !shadow-none text-lg border-0 bg-0 outline-none' :' border border-[#458DC7] !bg-transparent text-[#458DC7] text-lg font-medium'} `}
    >
      {children}
    </Button>
  );
}
