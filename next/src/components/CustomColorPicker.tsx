import React, { useState } from "react";
import { CompactPicker } from "react-color";

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
            <CompactPicker 
            color={color} 
            onChangeComplete={(newColor) => handleChange(newColor)} 
            colors={['#00FFA3', '#03E1FF', '#DC1FFF', '#000000', '#be4a2f',
            '#d77643',
            '#ead4aa',
            '#e4a672',
            '#b86f50',
            '#733e39',
            '#3e2731',
            '#a22633',
            '#e43b44',
            '#f77622',
            '#feae34',
            '#fee761',
            '#63c74d',
            '#3e8948',
            '#265c42',
            '#193c3e',
            '#124e89',
            '#0099db',
            '#2ce8f5',
            '#ffffff',
            '#c0cbdc',
            '#8b9bb4',
            '#5a6988',
            '#3a4466',
            '#262b44',
            '#181425',
            '#ff0044',
            '#68386c',
            '#b55088',
            '#f6757a',
            '#e8b796',
            '#c28569']}/>
          </div>
        </>
      )}
    </div>
  );
}
