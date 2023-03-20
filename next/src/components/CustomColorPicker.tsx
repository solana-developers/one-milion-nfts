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
'#10121c',
'#2c1e31',
'#6b2643',
'#ac2847',
'#ec273f',
'#94493a',
'#de5d3a',
'#e98537',
'#f3a833',
'#4d3533',
'#6e4c30',
'#a26d3f',
'#ce9248',
'#dab163',
'#e8d282',
'#f7f3b7',
'#1e4044',
'#006554',
'#26854c',
'#5ab552',
'#9de64e',
'#008b8b',
'#62a477',
'#a6cb96',
'#d3eed3',
'#3e3b65',
'#3859b3',
'#3388de',
'#36c5f4',
'#6dead6',
'#5e5b8c',
'#8c78a5',
'#b0a7b8',
'#deceed',
'#9a4d76',
'#c878af',
'#cc99ff',
'#fa6e79',
'#ffa2ac',
'#ffd1d5',
'#f6e8e0',
      '#d77643'
            ]}/>
          </div>
        </>
      )}
    </div>
  );
}
