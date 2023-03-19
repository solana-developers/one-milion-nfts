import React, { FC } from "react";
import { NftPixel } from "./Grid";
import SinglePixelCanvas from "./SinglePixelCanvas";

type Props = {
  children?: React.ReactNode;
  onTransferCallback: (nftPixel: MyPixel) => void;
  onRedeemCallback: (asset: string) => void;
  onDecompressCallback: (asset: string, name: string) => void;
  allNFTs: any;
};

export class MyPixel {
  x: number;
  y: number;
  color: string;
  name: string;
  id: string;

  constructor() {
    this.x = 0;
    this.y = 0;
    this.color = "#ffffffff";
    this.id = "";
    this.name = "";
  }
}

export const MyPixels: FC<Props> = ({ onRedeemCallback, onDecompressCallback, onTransferCallback, allNFTs }) => {
  var myParsedPixels = new Array<MyPixel>();

  for (var i = 0; i < allNFTs.items.length; i++) {
    try {
      const nft = allNFTs.items[i];
      const name = nft.content.metadata.name;

      let newPixel = new MyPixel();
      const x = name.split(".")[0];
      const y = name.split(".")[1].split("-")[0];
      const color = name.split(".")[1].split("-")[1];
      newPixel.x = x;
      newPixel.y = y;
      newPixel.color = color;
      newPixel.id = nft.id;
      newPixel.name = name;

      myParsedPixels.push(newPixel);
    } catch (error) {
      // Get assets by owner may get a bunch of pixels that dont fit the naming convention
      //console.log(error);
    }
  }

  return (
    <div>
      
      <div className={"flex flex-row space-x-5 overflow-x-auto self-end place-items-center justify-center ... "}>
        {myParsedPixels.map((nft: MyPixel) => (
          <div key={nft.id} >
            <p className="text-sky-400 truncate ...">{nft.name}</p>
            <div className="flex flex-row place-items-center ...">
            <SinglePixelCanvas
              color={nft.color}
              canvasWidth={40}
              canvasHeight={40}
            ></SinglePixelCanvas>
            { /* 
                <button
                  onClick={() => onRedeemCallback(nft.id)}
                  className={
                    "bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
                  }
                >
                  Redeem
                </button> 
                <button
                  onClick={() => onDecompressCallback(nft.id, nft.name)}
                  className={
                    "bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
                  }
                >
                  Decompress
                </button>
            */ }
            <button
              onClick={() => onTransferCallback(nft)}
              className={
                "bg-blue-500 hover:bg-blue-700 text-white h-10 font-bold py-2 px-1 rounded"
              }
            >
              Transfer
            </button>
            
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
