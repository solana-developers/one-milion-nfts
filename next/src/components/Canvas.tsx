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
  const [tooltip, setTooltip] = useState<string>("");
  const [nftAddress, setNftAddress] = useState<string>("");
  const [hoverPixel, setHoverPixel] = useState<boolean>(false);

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

        /*setScale(10);

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
        isResetRef.current = false;*/
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
        if (hoverPixel) {
          window.alert("You clicked on a pixel that is already minted!");
          return;
        }
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
      // Need to clean a bit more since we will be able to move the canvas
      context.clearRect(-6000, -6000, 12000, 12000);
      context.fillRect(0, 0, 1000, 1000);
      let hoverPixel = false;
      //console.log(props.nftPixels.length);
      let nftPixel: NftPixel;
      let nftPixelName: string;

      var canvasWidth  = 1000;
      var canvasHeight = 1000;
      /*var imageData = context.getImageData(0, 0, canvasWidth, canvasHeight);
      var buf = new ArrayBuffer(imageData.data.length);
      var buf8 = new Uint8ClampedArray(buf);
      var data = new Uint32Array(buf);*/

      for (var x = 0; x < 1000; x++) {
        for (var y = 0; y < 1000; y++) {
          let pixel = props.nftPixels[x][y];

          /*imageData.data[4 * (y * imageData.width + x)] = 255; // Rotwert
          imageData.data[4 * (y * imageData.width + x) + 1] = 0; // Grünwert
          imageData.data[4 * (y * imageData.width + x) + 2] = 0; // Blauwert
          imageData.data[4 * (y * imageData.width + x) + 3] = 255; // Alphawert*/

          if (pixel.c != "ffffffff") {
            context.fillStyle = "#"+pixel.c;
            context.fillRect(x, y, 1, 1);
            if (x == pixelPosition.x && y == pixelPosition.y) {
              nftPixel = pixel;
              nftPixelName = x + "." + y + "-" + nftPixel.c;
            }
          }
        }
      }
     // context.putImageData(imageData, 0, 0);

      if (nftPixel) {
        setTooltip(nftPixelName);
        setNftAddress(nftPixel.o);
        hoverPixel = true;
      }
      
      console.log("Redraw canvas");
      setHoverPixel(hoverPixel);

      context.fillStyle = props.color;
      context.fillRect(pixelPosition.x , pixelPosition.y, 1, 1);
    }
  }, [
    props.canvasWidth,
    props.canvasHeight,
    context,
    scale,
    offset,
    //viewportTopLeft,
    pixelPosition.x,
    pixelPosition.y,
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
        var BB = canvasRef.current.getBoundingClientRect();

        const topLeftCanvasPos = {
          x: BB.left,
          y: BB.top,
        };

        const newLocal = diffPoints(viewportMousePos, topLeftCanvasPos);
        let posOnCanvasX = newLocal.x + (viewportTopLeft.x * scale);
        let posOnCanvasY = newLocal.y + (viewportTopLeft.y * scale);

        const xPixel = Math.floor(posOnCanvasX / scale);
        const yPixel = Math.floor(posOnCanvasY / scale);
 
        console.log("page mouse pos: " + event.pageX + " " + event.pageY)
        console.log("viewport top left: " + viewportTopLeft.x + " " + viewportTopLeft.y)
        console.log("viewportMousePos: " + viewportMousePos.x + " " + viewportMousePos.y)
        console.log("Local Position: " + newLocal.x + " " + newLocal.y)
        console.log("PosOnCanvasX: x " + posOnCanvasX + " y " + posOnCanvasY)
        console.log("Scale " + scale)
        console.log("Pixel position: " + xPixel + " " + yPixel )

        if (pixelPosition.x != xPixel || pixelPosition.y != yPixel) {
          setPixelPosition({x: xPixel, y: yPixel});
        }        

        setMousePos(newLocal);
      }
    }

    canvasElem.addEventListener("mousemove", handleUpdateMouse);
    canvasElem.addEventListener("wheel", handleUpdateMouse);
    return () => {
      canvasElem.removeEventListener("mousemove", handleUpdateMouse);
      canvasElem.removeEventListener("wheel", handleUpdateMouse);
    };
  }, [offset, scale, pixelPosition, mousePos, viewportTopLeft]);

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
        let newScale = scale * zoom;

        // Limit zoom so that the canvas is always visible
        if (newScale > 10 || newScale < 0.8) {
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
        
        setScale(newScale);
        isResetRef.current = false;
      }
    }

    canvasElem.addEventListener("wheel", handleWheel);
    return () => canvasElem.removeEventListener("wheel", handleWheel);
  }, [context, mousePos.x, mousePos.y, viewportTopLeft, scale]);

  return (
    <div className={"group flex "+ (hoverPixel ? "relative" : "")}>
      {hoverPixel &&  <span className="group-hover:opacity-100 transition-opacity bg-gray-800 px-1 text-sm text-gray-100 rounded-md absolute left-1/2 
    -translate-x-1/2 translate-y-full opacity-0 m-4 mx-auto">
      {tooltip} <br></br>
      {nftAddress}
      </span>
    }
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
