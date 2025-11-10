import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";

export const COLORS = [
  { name: "Light Green", hex: "#E4FAEC" },
  { name: "Light Red", hex: "#FBE8E8" },
  { name: "Light Gray", hex: "#F8F8F8" },
  { name: "Blue Transparent", hex: "#5570F129" },
  { name: "Mint", hex: "#EFFFF5" },
  { name: "Sky Blue", hex: "#E4EEFD" },
  { name: "Soft Blue", hex: "#EEF5FF" },
  { name: "Lavender", hex: "#EEE4FF" },
  { name: "Beige", hex: "#FAF3DF" },
  { name: "Peach", hex: "#FAEADF" },
];

interface Color {
  name: string;
  hex: string;
}

interface ColorPickerProps {
  colors?: Color[];
  selected?: string;
  onSelect: (color: string) => void;
  defaultColor?: string; 
}

export const CustomColorPicker: React.FC<ColorPickerProps> = ({
  colors = COLORS,
  selected,
  onSelect,
  defaultColor = COLORS[0].hex, // اختيار أول لون كـ default
}) => {
  // لو مفيش لون مختار نستخدم الافتراضي
  const currentColor = selected || defaultColor;
  const selectedColor = colors.find(c => c.hex === currentColor);

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          className={` w-full h-12 py-[5px] px-4 flex items-center !shadow-none text-[#09090B] justify-start gap-2 rounded-md border border-[#DEE1E6] hover:bg-white bg-white `}

        >
          <span className="text-sm">{selectedColor?.hex || "Select color"}</span>
          <span
            className="w-6 h-6 rounded-[8px] px-2 border border-[#DEE1E6]"
            style={{ backgroundColor: selectedColor?.hex || "transparent" }}
          />
        </Button>
      </PopoverTrigger>

      <PopoverContent
        side="top"
        align="start"
        sideOffset={8}
        style={{ zIndex: 100001 }}
        className="grid grid-cols-2 gap-2 p-2"
      >
        {/* الأعمدة: الألوان على اليسار، الأسماء على اليمين */}
        {colors.map((color) => (
          <div
            key={color.hex}
            className="flex gap-2 justify-between items-center cursor-pointer"
            onClick={() => onSelect(color.hex)}
          >
            <span className="text-sm">{color.hex}</span>
            <div
              className="w-6 h-6 rounded-sm border"
              style={{ backgroundColor: color.hex }}
            />
          </div>
        ))}
      </PopoverContent>
    </Popover>
  );
};
