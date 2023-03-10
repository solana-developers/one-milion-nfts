import {
  useEffect,
  useCallback,
  useLayoutEffect,
  useRef,
  useState,
} from "react";
import * as React from "react";

type CanvasProps = {
  color: any;
  canvasWidth: number;
  canvasHeight: number;
};

export default function SinglePixelCanvas(props: CanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [context, setContext] = useState<CanvasRenderingContext2D | null>(null);

  const waitForContext = useCallback(
    (context: CanvasRenderingContext2D) => {
      if (context) {
        setContext(context);
      }
    },
    [props.canvasWidth, props.canvasHeight]
  );

  useLayoutEffect(() => {
    if (canvasRef.current) {
      const renderCtx = canvasRef.current.getContext("2d");

      if (renderCtx) {
        waitForContext(renderCtx);
      }
    }
  }, [waitForContext, props.canvasHeight, props.canvasWidth]);

  useEffect(() => {
    if (!context) return;
    context.fillStyle = props.color;
    context.fillRect(0, 0, props.canvasWidth, props.canvasHeight);
    console.log("drawing");
  }, [context]);

  return (
    <div>
      <canvas
        ref={canvasRef}
        width={props.canvasWidth}
        height={props.canvasWidth}
        style={{
          backgroundColor: "transparent",
          border: "2px solid #000",
          width: `${props.canvasWidth}px`,
          height: `${props.canvasHeight}px`,
        }}
      ></canvas>
    </div>
  );
}
