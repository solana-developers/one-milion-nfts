import React, {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from "react";
import { useSpring, animated } from "@react-spring/web";
import {
  createUseGesture,
  dragAction,
  moveAction,
  pinchAction,
} from "@use-gesture/react";

import styles from "./styles.module.css";
import Canvas from "./Canvas";
import { NftPixel } from "./Grid";

const useGesture = createUseGesture([dragAction, pinchAction, moveAction]);

type CanvasProps = {
  children?: React.ReactNode;
  onClickCallback: (x: Number, y: Number) => void;
  nftPixels: any;
  selectedColor: any;
  canvasWidth: number;
  canvasHeight: number;
};

export default function Pinch(props: CanvasProps) {
  const [context, setContext] = useState<CanvasRenderingContext2D | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const reset = useCallback(
    (context: CanvasRenderingContext2D) => {
      if (context) {
        // reset state and refs
        setContext(context);
      }
    },
    [props.canvasWidth, props.canvasHeight]
  );

  // setup canvas and set context
  useLayoutEffect(() => {
    if (canvasRef.current) {
      // get new drawing context
      const renderCtx = canvasRef.current.getContext("2d");

      if (renderCtx) {
        reset(renderCtx);
      }
    }
  }, [reset, props.canvasWidth, props.canvasHeight]);

  useLayoutEffect(() => {
    if (context) {
      if (!context) return;
      context.fillStyle = "white";
      // Need to clean a bit more since we will be able to move the canvas
      context.clearRect(-6000, -6000, 12000, 12000);
      console.log(props.canvasHeight);
      context.fillRect(0, 0, props.canvasWidth, props.canvasHeight);
      let hoverPixel = false;
      //console.log(props.nftPixels.length);
      let nftPixel: NftPixel;
      let nftPixelName: string;

      /*var imageData = context.getImageData(0, 0, canvasWidth, canvasHeight);
          var buf = new ArrayBuffer(imageData.data.length);
          var buf8 = new Uint8ClampedArray(buf);
          var data = new Uint32Array(buf);*/
          console.log("Pixels:");
          console.log(props.nftPixels)

      for (var x = 0; x < 1000; x++) {
        for (var y = 0; y < 1000; y++) {
          let pixel = props.nftPixels[x][y];

          /*imageData.data[4 * (y * imageData.width + x)] = 255; // Rotwert
              imageData.data[4 * (y * imageData.width + x) + 1] = 0; // Grünwert
              imageData.data[4 * (y * imageData.width + x) + 2] = 0; // Blauwert
              imageData.data[4 * (y * imageData.width + x) + 3] = 255; // Alphawert*/

          if (pixel.c != "ffffffff") {
            context.fillStyle = "#" + pixel.c;
            context.fillRect(x, y, 1, 1);
            /*if (x == pixelPosition.x && y == pixelPosition.y) {
                  nftPixel = pixel;
                  nftPixelName = x + "." + y + "-" + nftPixel.c;
                }*/
          }
        }
      }
      // context.putImageData(imageData, 0, 0);

      /*if (nftPixel) {
            setTooltip(nftPixelName);
            setNftAddress(nftPixel.o);
            hoverPixel = true;
          }
          
          console.log("Redraw canvas");
          setHoverPixel(hoverPixel);
    
          context.fillStyle = props.color;
          context.fillRect(pixelPosition.x , pixelPosition.y, 1, 1);*/
    }
  }, [
    props.canvasWidth,
    props.canvasHeight,
    context,
    //viewportTopLeft,
    props.nftPixels,
  ]);

  useEffect(() => {
    const handler = (e: Event) => e.preventDefault();
    document.addEventListener("gesturestart", handler);
    document.addEventListener("gesturechange", handler);
    document.addEventListener("gestureend", handler);
    return () => {
      document.removeEventListener("gesturestart", handler);
      document.removeEventListener("gesturechange", handler);
      document.removeEventListener("gestureend", handler);
    };
  }, []);

  const [style, api] = useSpring(() => ({
    x: 0,
    y: 0,
    scale: 1,
    rotateZ: 0,
  }));
  const ref = React.useRef<HTMLDivElement>(null);

  useGesture(
    {
      onPointerDown: ({ event, ...sharedState }) => {
        console.log("pointer down", event);
      },
      onHover: ({ active, event }) => console.log("hover", event, active),
      onMove: ({ event, offset: [x, y] }) => {} /*console.log('move', event)*/,
      onDrag: ({ pinching, cancel, offset: [x, y], ...rest }) => {
        if (pinching) return cancel();
        api.start({ x, y });
      },
      onPinch: ({
        origin: [ox, oy],
        first,
        movement: [ms],
        offset: [s, a],
        memo,
      }) => {
        if (first) {
          const { width, height, x, y } = ref.current!.getBoundingClientRect();
          const tx = ox - (x + width / 2);
          const ty = oy - (y + height / 2);
          memo = [style.x.get(), style.y.get(), tx, ty];
        }

        const x = memo[0] - (ms - 1) * memo[2];
        const y = memo[1] - (ms - 1) * memo[3];
        api.start({ scale: s, rotateZ: a, x, y });
        return memo;
      },
    },
    {
      target: ref,
      drag: { from: () => [style.x.get(), style.y.get()] },
      pinch: { scaleBounds: { min: 0.1, max: 4 }, rubberband: true, rotate: false },
    }
  );

  return (
    <div className={`flex fill center ${styles.container}`}>
      <animated.div className={styles.card} ref={ref} style={style}>
        <canvas
          width={1000}
          height={1000}
          ref={canvasRef}
          style={{
            backgroundColor: "white",
            border: "2px solid #000",
            width: `${1000}px`,
            height: `${1000}px`,
          }}
        ></canvas> 
      </animated.div>
    </div>
  );
}
