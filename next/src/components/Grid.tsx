"use client";
import React, { FC, useCallback, useEffect, useRef } from "react";
import dynamic from "next/dynamic";

const Canvas = dynamic(() => import("./Canvas"), { ssr: false });

type Props = {
  children?: React.ReactNode;
  onClickCallback: (x: Number, y: Number) => void;
  allNFTs: any;
  selectedColor: any;
};

export class NftPixel {
  x: number;
  y: number;
  color: string;

  constructor() {
    this.x = 0;
    this.y = 0;
    this.color = "#ffffffff";
  }
}

export const Grid: FC<Props> = ({
  children,
  onClickCallback,
  allNFTs,
  selectedColor,
}) => {
  var nftGrid = new Array<Array<NftPixel>>(1000);

  for (var i = 0; i < nftGrid.length; i++) {
    nftGrid[i] = new Array<NftPixel>(1000);
  }

  for (var i = 0; i < nftGrid.length; i++) {
    var cube = nftGrid[i];
    for (var j = 0; j < cube.length; j++) {
      nftGrid[i][j] = new NftPixel();
    }
  }

  return (
    <div>
      <Canvas
        onClickCallback={onClickCallback}
        color={selectedColor}
        nftPixels={nftGrid}
        nftData={allNFTs}
        canvasWidth={1000}
        canvasHeight={1000}
      ></Canvas>

      <div className={"grid gap-1 grid-cols-" + nftGrid[0].length.toString()}>

      </div>
    </div>
  );
};
