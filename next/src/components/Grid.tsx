"use client";
import React, { FC, useCallback, useEffect, useRef } from "react";
import dynamic from "next/dynamic";
import { MyPixel } from "./MyPixels";
import { useSpring,animated } from "@react-spring/core";
import { createUseGesture, dragAction, pinchAction } from '@use-gesture/react'

const Canvas = dynamic(() => import("./Canvas"), { ssr: false });
import styles from './styles.module.css'

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

const useGesture = createUseGesture([dragAction, pinchAction])

export const Grid: FC<Props> = ({
  children,
  onClickCallback,
  allNFTs,
  selectedColor,
}) => {
  //let nftGrid: Array<Array<NftPixel>> = JSON.parse(allNFTs.allNfts);


  useEffect(() => {
    const handler = (e: Event) => e.preventDefault()
    document.addEventListener('gesturestart', handler)
    document.addEventListener('gesturechange', handler)
    document.addEventListener('gestureend', handler)
    return () => {
      document.removeEventListener('gesturestart', handler)
      document.removeEventListener('gesturechange', handler)
      document.removeEventListener('gestureend', handler)
    }
  }, [])

  const [style, api] = useSpring(() => ({
    x: 0,
    y: 0,
    scale: 1,
    rotateZ: 0,
  }))
  const ref = React.useRef<HTMLDivElement>(null)

  useGesture(
    {
      // onHover: ({ active, event }) => console.log('hover', event, active),
      // onMove: ({ event }) => console.log('move', event),
      onDrag: ({ pinching, cancel, offset: [x, y], ...rest }) => {
        if (pinching) return cancel()
        api.start({ x, y })
      },
      onPinch: ({ origin: [ox, oy], first, movement: [ms], offset: [s, a], memo }) => {
        if (first) {
          const { width, height, x, y } = ref.current!.getBoundingClientRect()
          const tx = ox - (x + width / 2)
          const ty = oy - (y + height / 2)
          memo = [style.x.get(), style.y.get(), tx, ty]
        }

        const x = memo[0] - (ms - 1) * memo[2]
        const y = memo[1] - (ms - 1) * memo[3]
        api.start({ scale: s, rotateZ: a, x, y })
        return memo
      },
    },
    {
      target: ref,
      drag: { from: () => [style.x.get(), style.y.get()] },
      pinch: { scaleBounds: { min: 0.5, max: 2 }, rubberband: true },
    }
  )

  return (
    <div className={`flex fill center ${styles.container}`}>
   
    </div>
  );
};
