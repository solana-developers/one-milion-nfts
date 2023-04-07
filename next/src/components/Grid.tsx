"use client";
import React, { FC } from "react";
import dynamic from "next/dynamic";

const Canvas = dynamic(() => import("./Canvas"), { ssr: false });

type Props = {
  children?: React.ReactNode;
  onClickCallback: (x: number, y: number) => void;
  allNFTs: any;
  selectedColor: any;
};

export class NftPixel {
  c: string;
  o: string;

  constructor() {
    this.c = "ffffffff";
    this.o = "";
  } 
}

export const Grid: FC<Props> = ({
  children,
  onClickCallback,
  allNFTs,
  selectedColor,
}) => {
  let nftGrid: Array<Array<NftPixel>> = allNFTs;

  return (
    <div>
      <Canvas
        onClickCallback={onClickCallback}
        color={selectedColor}
        nftPixels={nftGrid}
        canvasWidth={1000}
        canvasHeight={1000}
      ></Canvas>
    </div>
  );
};
