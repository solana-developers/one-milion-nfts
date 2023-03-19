import React, { useState } from "react";
import { MyPixel } from "./MyPixels";

type Props = {
  children?: React.ReactNode;
  onTransferCallback: (target: string, nftPixel: MyPixel) => void;
  onCancelCallback: () => void;
  assetId: string | undefined;
  nftPixel: MyPixel | undefined;
};

export default function TransferAdressInput(props: Props) {
  const [value, setValue] = useState<string>("");

  function handleChange(event: any) {
    setValue(event.target.value);
  }

  return (
    <div className="w-full h-full flex justify-center items-center backdrop-brightness-50">
      <div className="bg-red-700 rounded-lg border-4 px-4 py-4">
      <h1 className="text-sky-400 text-3xl font-bold">Transfer NFT:</h1>
      <h6 className="text-s">{props.assetId}</h6>
      <h1 className="text-sky-400 text-3xl font-bold">to:</h1>
      <input type="text" id="target_address" value={value} onChange={handleChange}  className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500" placeholder="Address" required>
      </input>
      <div>
      <button onClick={() => props.onCancelCallback()} className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded">
        Cancel
      </button>
      <button onClick={() => props.onTransferCallback(value, props.nftPixel)} className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded">
        Transfer
      </button>
      </div>
            </div>
    </div>
  );
}