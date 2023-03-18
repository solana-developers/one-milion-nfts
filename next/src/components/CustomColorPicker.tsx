import React, { useState } from "react";
import { SketchPicker, SwatchesPicker } from "react-color";

interface Props {
  color: string;
  onChangeComplete: (color: string) => void;
}

export default function ColorPicker(props: Props) {
  const [color, setColor] = useState("#121212");
  const [displayColorPicker, setDisplayColorPicker] = useState(false);

  function handleChange(color: any) {
    setColor(color.hex);
    props.onChangeComplete(color.hex);
  }

  return (
    <div>
        <button className="h-8 w-8 border-2 border-slate-50 border-solid" 
          onClick={() => setDisplayColorPicker(!displayColorPicker)} 
          style={{backgroundColor: color}}>
          
        </button>
      {displayColorPicker && (
        <>
          <div className="absolute">
            <div
              className="fixed inset-0"
              onClick={() => setDisplayColorPicker(!displayColorPicker)}
            />
            <SwatchesPicker
          
              color={color}
              onChange={(newColor) => handleChange(newColor)}
            />
          </div>
        </>
      )}
    </div>
  );
}
