import React, { useState } from "react";
import { getPrimaryColor, setPrimaryColor } from "../utils/themeUtils";

const ColorPicker = () => {
  const [selectedColor, setSelectedColor] = useState(getPrimaryColor());

  // Predefined color options
  const colorOptions = [
    { name: "Purple", value: "#7269FF" },
    { name: "Blue", value: "#3B82F6" },
    { name: "Green", value: "#10B981" },
    { name: "Red", value: "#EF4444" },
    { name: "Orange", value: "#F97316" },
    { name: "Pink", value: "#EC4899" },
    { name: "Yellow", value: "#F59E0B" },
    { name: "Brown", value: "#F3A261" },
    { name: "Grey", value: "#6B7280" },
    { name: "Black", value: "#1F2937" },
    { name: "White", value: "#FFFFFF" },
    { name: "Turquoise", value: "#3ABAB4" },
  ];

  const handleColorChange = (color) => {
    setSelectedColor(color);
    setPrimaryColor(color);
  };

  return (
    <div className="p-4 bg-white dark:bg-primary-dark/95 rounded-lg shadow-sm">
      <div className="grid grid-cols-6 gap-3">
        {colorOptions.map((color) => (
          <div key={color.value} className="flex flex-col items-center">
            <button
              className={`w-6 h-6 rounded-full mb-1 border-[1px] ${selectedColor === color.value
                ? "border-gray-800 dark:border-white"
                : "border-transparent"
                }`}
              style={{ backgroundColor: color.value }}
              onClick={() => handleColorChange(color.value)}
              aria-label={`Select ${color.name} color`}
            />
          </div>
        ))}
      </div>
    </div>
  );
};

export default ColorPicker;
