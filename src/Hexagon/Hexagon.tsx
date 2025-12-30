import * as React from "react"
//import classNames from "classnames"
import { Hex } from "../models/Hex.js"
import { HexUtils } from "../HexUtils.js"
import { LayoutDimension, useLayoutContext } from "../Layout.js"
import { Point } from "../models/Point.js"
import { LAYOUT_FLAT } from "../Layout.js";
import { calculateCoordinates } from "../Layout.js"

type H = { data?: any; state: { hex: Hex }; props: HexagonProps }

export type HexagonDragEventHandler<T = Element, AdditionalData = any> = (
  event: React.DragEvent<T>,
  h: H,
  additionalData?: AdditionalData,
) => void

export type HexagonDragDropEventHandler<T = Element, AdditionalData = any> = (
  event: React.DragEvent<T>,
  h: H,
  additionalData: AdditionalData,
) => void

export type HexagonMouseEventHandler<T = SVGGElement> = (
  event: React.MouseEvent<T, globalThis.MouseEvent>,
  h: H,
) => void

export type HexagonProps = {
  /**
   * The q coordinate of the hexagon.
   */
  q: number
  /**
   * The r coordinate of the hexagon.
   */
  r: number
  /**
   * The s coordinate of the hexagon.
   */
  s: number
  /**
   * The pattern id for the fill image of the hexagon
   */
  fill?: string
  /**
   * Optional classname. 
   */
  className?: string
  /**
   * The circumradius (from origin to vertex) of the hexagon.  Defaults to 10.
   */

  radius?: number

  /**
   * CSSProperties for the hexagon.  cellStyle is deprecated and only remains to avoid breaking changes
   */
  cellStyle?: React.CSSProperties | undefined
  style?: React.CSSProperties | undefined
  data?: any

  onMouseEnter?: HexagonMouseEventHandler
  onMouseDown?: HexagonMouseEventHandler
  onMouseUp?: HexagonMouseEventHandler
  onMouseLeave?: HexagonMouseEventHandler
  onClick?: HexagonMouseEventHandler
  onDragStart?: HexagonDragEventHandler
  onDragEnd?: HexagonDragEventHandler
  onDragOver?: HexagonDragEventHandler
  onDrop?: HexagonDragDropEventHandler<any, TargetProps>
  onMouseMove?: HexagonMouseEventHandler
  children?: React.ReactNode | React.ReactNode[]
}

type TargetProps = {
  hex: Hex
  pixel: Point
  data?: any
  fill?: string
  className?: string
}

/**
 * Renders a Hexagon cell at the given qrs-based coordinates.
 */
export function Hexagon(
  props: HexagonProps &
    Omit<
      React.SVGProps<SVGGElement>,
      | "transform"
      | "onDrop"
      | "onDragOver"
      | "onMouseEnter"
      | "onClick"
      | "onMouseMove"
      | "onMouseLeave"
      | "onMouseUp"
      | "onMouseDown"
    >,
) {
  // destructure props into their values
  const {
    q,
    r,
    s,
    fill,
    cellStyle,
    style,
    className,
    radius,
    children,
    onDrop,
    data,
    fillOpacity,
    ...rest
  } = props

  // const { layout, points } = useLayoutContext()

  /*
  from ../Layout.tsx
  
  */

  /**
   * Hexagons need default size, origin, and spacing values to be rendered.
   * These are the default values used if no layout is provided.
   * These are copied from Layout.tsx
   */
  const defaultSize = new Point(10, 10)
  const defaultOrigin = new Point(0, 0)
  const defaultSpacing = 1.0

  const flatDefaultLayout: LayoutDimension = ({
    size: defaultSize,
    orientation: LAYOUT_FLAT,
    origin: defaultOrigin,
    spacing: defaultSpacing,
  })


  // Here we look for a layout context (layout parent).  If it isn't there, we use the default.
  const layout = useLayoutContext().layout || flatDefaultLayout
  // if radius is set, we use that, otherwise we know layout is guaranteed so we can safely use that
  const smartRadius = radius || layout.size.x;
  const points = useLayoutContext().points || calculateCoordinates(smartRadius).map((point) => `${point.x},${point.y}`).join(" ");


  const { hex, pixel } = React.useMemo(() => {
    const hex = new Hex(q, r, s)
    const pixel = HexUtils.hexToPixel(hex, layout)
    return {
      hex,
      pixel,
    }
  }, [q, r, s, layout])

  // for backwards comapatbility
  const state = { hex }

  // the fill prop used to be set to fillId.  However, it doesn't work and throughout the code
  // we just use css with the g or polygon selectors to set fill.
  // I'm actually not sure what this prop and variable are supposed to do
  const fillId = fill ? `url(#${fill})` : undefined
  //const draggable = (onDragStart || onDragEnd || onDragOver) ? { draggable: true } : { draggable: false }
  const draggable = { draggable: true } as any
//   console.log(draggable)
  function createMouseEvent(name: string) {
    return function (event: React.MouseEvent<SVGGElement, MouseEvent>){
      if (name in props) {
        (props[name as keyof typeof props] as HexagonMouseEventHandler)(event, { data, state, props })
      }
    }
  }
  const eventListeners = {
    onDragOver: createMouseEvent("onDragOver"),
    onMouseEnter: createMouseEvent("onMouseEnter"),
    onClick: createMouseEvent("onClick"),
    onMouseMove: createMouseEvent("onMouseMove"),
    onMouseLeave: createMouseEvent("onMouseLeave"),
    onMouseDown: createMouseEvent("onMouseDown"),
    onMouseUp: createMouseEvent("onMouseDown"),
  };
  return (
    <g
      className={className}
      transform={`translate(${pixel.x}, ${pixel.y})`}
      {...rest}
      {...draggable}
      {...eventListeners}
      onDrop={(e) => {
        if (onDrop) {
          e.preventDefault()
          const target = JSON.parse(e.dataTransfer.getData("hexagon"))
          onDrop(e, { data, state, props }, target)
        }
      }}
    >
      <g className="hexagon">
        <polygon points={points} fill={fillId} style={cellStyle || style} />
        {children}
      </g>
    </g>
  )
}

export default Hexagon
