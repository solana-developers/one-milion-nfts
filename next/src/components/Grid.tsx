"use client";
import React, { FC, useCallback, useEffect, useRef } from "react";
import dynamic from "next/dynamic";
import { MyPixel } from "./MyPixels";

const Canvas = dynamic(() => import("./Canvas"), { ssr: false });

type Props = {
  children?: React.ReactNode;
  onClickCallback: (x: Number, y: Number) => void;
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
  let nftGrid: Array<Array<NftPixel>> = JSON.parse(allNFTs);

 // console.log("nftGrid: " + JSON.stringify(nftGrid));

  for (var i = 0; i < 1000; i++) {
    for (var j = 0; j < 1000; j++) {
      //console.log("nftGrid entry " + nftGrid[i][j]);
    }
  }

  //console.log("nftGrid: " + JSON.stringify(nftGrid));
  /*var nftGrid = new Array<Array<NftPixel>>(1000);

  for (var i = 0; i < nftGrid.length; i++) {
    nftGrid[i] = new Array<NftPixel>(1000);
  }

  for (var i = 0; i < nftGrid.length; i++) {
    var cube = nftGrid[i];
    for (var j = 0; j < cube.length; j++) {
      nftGrid[i][j] = new NftPixel();
    }
  }

  for (var i = 0; i < allNFTs.length; i++) {
    const nft = allNFTs[i];
    const name = nft.content.metadata.name;
    try {
      const x = name.split(".")[0];
      const y = name.split(".")[1].split("-")[0];
      const color = name.split(".")[1].split("-")[1];
      nftGrid[x][y].x = x;
      nftGrid[x][y].y = y;
      nftGrid[x][y].c = color;
      //console.log("name: " + name + "color " + props.nftPixels[x][y].color);
    } catch (e) {
      //console.log("error " + e);
    }
  }*/

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
