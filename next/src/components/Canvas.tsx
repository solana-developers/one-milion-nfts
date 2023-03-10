"use client";
import {
  useEffect,
  useCallback,
  useLayoutEffect,
  useRef,
  useState,
} from "react";
import * as React from "react";
import { NftPixel } from "./Grid";

type CanvasProps = {
  canvasWidth: number;
  canvasHeight: number;
  nftPixels: Array<Array<NftPixel>>;
  nftData: any;
  color: any;
  onClickCallback: (x: Number, y: Number) => void;
};

type Point = {
  x: number;
  y: number;
};

const ORIGIN = Object.freeze({ x: 0, y: 0 });

// adjust to device to avoid blur
const { devicePixelRatio: ratio = 1 } = window;

function diffPoints(p1: Point, p2: Point) {
  return { x: p1.x - p2.x, y: p1.y - p2.y };
}

function addPoints(p1: Point, p2: Point) {
  return { x: p1.x + p2.x, y: p1.y + p2.y };
}

function scalePoint(p1: Point, scale: number) {
  return { x: p1.x / scale, y: p1.y / scale };
}

const ZOOM_SENSITIVITY = 500; // bigger for lower zoom per scroll

export default function Canvas(props: CanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [context, setContext] = useState<CanvasRenderingContext2D | null>(null);
  const [scale, setScale] = useState<number>(1);
  const [offset, setOffset] = useState<Point>(ORIGIN);
  const [mousePos, setMousePos] = useState<Point>(ORIGIN);
  const [pixelPosition, setPixelPosition] = useState<Point>(ORIGIN);
  const [viewportTopLeft, setViewportTopLeft] = useState<Point>(ORIGIN);
  const [mouseDownPosition, setMouseDownPosition] = useState<Point>(ORIGIN);
  const isResetRef = useRef<boolean>(false);
  const lastMousePosRef = useRef<Point>(ORIGIN);
  const lastOffsetRef = useRef<Point>(ORIGIN);

  // update last offset
  useEffect(() => {
    lastOffsetRef.current = offset;
  }, [offset]);

  // reset
  const reset = useCallback(
    (context: CanvasRenderingContext2D) => {
      if (context && !isResetRef.current) {
        // adjust for device pixel density
        context.canvas.width = props.canvasWidth * ratio;
        context.canvas.height = props.canvasHeight * ratio;
        context.scale(ratio, ratio);
        setScale(1);

        // reset state and refs
        setContext(context);
        setOffset(ORIGIN);
        setMousePos(ORIGIN);
        setViewportTopLeft(ORIGIN);
        lastOffsetRef.current = ORIGIN;
        lastMousePosRef.current = ORIGIN;

        // this thing is so multiple resets in a row don't clear canvas
        isResetRef.current = true;
        const newPoint = {x: 0, y: 0};

        setScale(10);

        setOffset(newPoint);
        setMousePos(newPoint);
        setViewportTopLeft(newPoint);
        lastOffsetRef.current = newPoint;
        lastMousePosRef.current = newPoint;

        let zoom = 10;
        let newLocal = scale * zoom;

        const viewportTopLeftDelta = {
          x: (mousePos.x / scale) * (1 - 1 / zoom),
          y: (mousePos.y / scale) * (1 - 1 / zoom),
        };
        const newViewportTopLeft = addPoints(
          viewportTopLeft,
          viewportTopLeftDelta
        );

        context.translate(viewportTopLeft.x, viewportTopLeft.y);

        context.scale(zoom, zoom);
        context.translate(-newViewportTopLeft.x, -newViewportTopLeft.y);

        setViewportTopLeft(newViewportTopLeft);
        
        setScale(newLocal);
        isResetRef.current = false;
      }
    },
    [props.canvasWidth, props.canvasHeight]
  );

  // functions for panning
  const mouseMove = useCallback(
    (event: MouseEvent) => {
      if (context) {
        const lastMousePos = lastMousePosRef.current;
        const currentMousePos = { x: event.pageX, y: event.pageY }; // use document so can pan off element
        lastMousePosRef.current = currentMousePos;

        const mouseDiff = diffPoints(currentMousePos, lastMousePos);
        setOffset((prevOffset) => addPoints(prevOffset, mouseDiff));
      }
    },
    [context]
  );

  const mouseUp = useCallback(() => {
    document.removeEventListener("mousemove", mouseMove);
    document.removeEventListener("mouseup", mouseUp);
  }, [mouseMove]);

  const startPan = useCallback(
    (event: React.MouseEvent<HTMLCanvasElement, MouseEvent>) => {
      document.addEventListener("mousemove", mouseMove);
      document.addEventListener("mouseup", mouseUp);
      setMouseDownPosition({ x: event.pageX, y: event.pageY });
      lastMousePosRef.current = { x: event.pageX, y: event.pageY };
    },
    [mouseMove, mouseUp]
  );

  const handleClick = useCallback(
    (event: React.MouseEvent<HTMLCanvasElement, MouseEvent>) => {
      if (mouseDownPosition.x == event.pageX && mouseDownPosition.y == event.pageY) {
        props.onClickCallback(pixelPosition.x, pixelPosition.y);
      }
    },
    [pixelPosition.x, pixelPosition.y, mouseDownPosition]
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
  }, [reset, props.canvasHeight, props.canvasWidth]);

  // pan when offset or scale changes
  useLayoutEffect(() => {
    if (context && lastOffsetRef.current) {
      const offsetDiff = scalePoint(
        diffPoints(offset, lastOffsetRef.current),
        scale
      );
      context.translate(offsetDiff.x, offsetDiff.y);
      setViewportTopLeft((prevVal) => diffPoints(prevVal, offsetDiff));
      isResetRef.current = false;
    }
  }, [context, offset, scale]);

  // draw
  useLayoutEffect(() => {
    if (context) {
      if (!context) return;
      context.fillStyle = "white";
      context.clearRect(-6000, -6000, 12000, 12000);
      context.fillRect(0, 0, 1000, 1000);

      for (var i = 0; i < props.nftData.items.length; i++) {
        const nft = props.nftData.items[i];
        const name = nft.content.metadata.name;
        try {
          const x = name.split(".")[0];
          const y = name.split(".")[1].split("-")[0];
          const color = name.split(".")[1].split("-")[1];
          props.nftPixels[x][y].x = x;
          props.nftPixels[x][y].y = y;
          props.nftPixels[x][y].color = color;
          //console.log("name: " + name + "color " + props.nftPixels[x][y].color);
          context.fillStyle = props.nftPixels[x][y].color;
          context.fillRect(x, y, 1, 1);
        } catch (e) {
          //console.log("error " + e);
        }
      }

      context.fillStyle = props.color;
      context.fillRect(pixelPosition.x , pixelPosition.y, 1, 1);

    }
  }, [
    props.canvasWidth,
    props.canvasHeight,
    context,
    scale,
    offset,
    viewportTopLeft,
    pixelPosition,
    props.nftData,
    props.nftPixels,
  ]);

  // add event listener on canvas for mouse position
  useEffect(() => {
    const canvasElem = canvasRef.current;
    if (canvasElem === null) {
      return;
    }

    function handleUpdateMouse(event: MouseEvent) {
      event.preventDefault();

      if (canvasRef.current) {
        const viewportMousePos = { x: event.clientX, y: event.clientY };
        var BB= canvasRef.current.getBoundingClientRect();

        const topLeftCanvasPos = {
          x: BB.left,
          y: BB.top,
        };

        const newLocal = diffPoints(viewportMousePos, topLeftCanvasPos);
        let posOnConvasX = newLocal.x + (viewportTopLeft.x * scale);
        let posOnConvasY = newLocal.y + (viewportTopLeft.y * scale);

        //console.log("new local: " + newLocal.x + " " + newLocal.y)
        //console.log("Canvas: x " + posOnConvasX + " y " + posOnConvasY)
        //console.log("Scale " + scale)
        //console.log("Pixel position: " + newLocal + " " + Math.floor( posOnConvasY / scale) )
        const xPixel = Math.floor(posOnConvasX / scale);
        const yPixel = Math.floor(posOnConvasY / scale);

        setPixelPosition({x: xPixel, y: yPixel});

        setMousePos(newLocal);
      }
    }

    canvasElem.addEventListener("mousemove", handleUpdateMouse);
    canvasElem.addEventListener("wheel", handleUpdateMouse);
    return () => {
      canvasElem.removeEventListener("mousemove", handleUpdateMouse);
      canvasElem.removeEventListener("wheel", handleUpdateMouse);
    };
  }, [offset, scale]);

  // add event listener on canvas for zoom
  useEffect(() => {
    const canvasElem = canvasRef.current;
    if (canvasElem === null) {
      return;
    }

    // this is tricky. Update the viewport's "origin" such that
    // the mouse doesn't move during scale - the 'zoom point' of the mouse
    // before and after zoom is relatively the same position on the viewport
    function handleWheel(event: WheelEvent) {
      event.preventDefault();
      if (context) {
        let zoom = 1 - event.deltaY / ZOOM_SENSITIVITY;
        let newLocal = scale * zoom;

        // Limit zoom so that the canvas is always visible
        if (newLocal > 30 || newLocal < 0.9) {
          return;
        }
        const viewportTopLeftDelta = {
          x: (mousePos.x / scale) * (1 - 1 / zoom),
          y: (mousePos.y / scale) * (1 - 1 / zoom),
        };
        const newViewportTopLeft = addPoints(
          viewportTopLeft,
          viewportTopLeftDelta
        );

        context.translate(viewportTopLeft.x, viewportTopLeft.y);

        context.scale(zoom, zoom);
        context.translate(-newViewportTopLeft.x, -newViewportTopLeft.y);

        setViewportTopLeft(newViewportTopLeft);
        
        setScale(newLocal);
        isResetRef.current = false;
      }
    }

    canvasElem.addEventListener("wheel", handleWheel);
    return () => canvasElem.removeEventListener("wheel", handleWheel);
  }, [context, mousePos.x, mousePos.y, viewportTopLeft, scale]);

  return (
    <div>
      {/*<button className="text-white" onClick={() => context && reset(context)}>Reset</button>
      <pre>scale: {scale}</pre>
      <pre>offset: {JSON.stringify(offset)}</pre>
      <pre>viewportTopLeft: {JSON.stringify(viewportTopLeft)}</pre>
      <pre>pixel position: {JSON.stringify(pixelPosition)}</pre>*/}
      <canvas
        onMouseDown={startPan}     
        onClick={handleClick}   
        ref={canvasRef}
        width={props.canvasWidth * ratio}
        height={props.canvasHeight * ratio}
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
