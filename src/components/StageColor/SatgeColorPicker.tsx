import * as React from "react";
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useState } from "react";
import { HexColorPicker } from "react-colorful";

interface StageColorPickerProps {
  color: string;
  onChange: (val: string) => void;
}

export const StageColorPicker: React.FC<StageColorPickerProps> = ({ color, onChange }) => {
  const [open, setOpen] = useState(false);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          style={{ backgroundColor: color }}
          className="w-full h-12 rounded-[8px] border border-[#DEE1E6] text-sm font-normal"
        >
          {color}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-60 p-4">
        <HexColorPicker color={color} onChange={onChange} />
        <Input
          value={color}
          onChange={(e) => onChange(e.target.value)}
          className="mt-2 w-full input-stage"
        />
      </PopoverContent>
    </Popover>
  );
};
