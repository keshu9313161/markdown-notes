interface D3Selection {
  selectAll(selector: string): D3Selection;
  select(selector: string): D3Selection;
  append(type: string): D3Selection;
  data(data: any[]): D3Selection;
  join(type: string): D3Selection;
  attr(name: string, value: any): D3Selection;
  style(name: string, value: any): D3Selection;
  text(value: string | ((d: any) => string)): D3Selection;
  classed(names: string, value: boolean | ((d: any) => boolean)): D3Selection;
  remove(): D3Selection;
  on(
    event: string,
    handler: ((event: any, d: any) => void) | null,
  ): D3Selection;
  call(fn: any): D3Selection;
  node(): Element | null;
  each(fn: (this: any, d: any) => void): D3Selection;
}

interface D3SimNode {
  x?: number;
  y?: number;
  vx?: number;
  vy?: number;
  fx?: number | null;
  fy?: number | null;
  index?: number;
}

interface D3Simulation<N extends D3SimNode = D3SimNode> {
  force(name: string, force?: any): D3Simulation<N>;
  on(event: string, handler: () => void): D3Simulation<N>;
  stop(): void;
  alpha(): number;
  alpha(value: number): D3Simulation<N>;
  alphaTarget(value: number): D3Simulation<N>;
  restart(): D3Simulation<N>;
  nodes(): N[];
}

interface D3ForceLink<N extends D3SimNode = D3SimNode> {
  id(accessor: (d: N) => number | string): D3ForceLink<N>;
  distance(value: number | ((d: unknown, i: number) => number)): D3ForceLink<N>;
}

interface D3ForceManyBody {
  strength(value: number): D3ForceManyBody;
}

interface D3ForceCollide {
  radius(value: number | ((d: any) => number)): D3ForceCollide;
}

interface D3ZoomTransform {
  k: number;
  x: number;
  y: number;
}

interface D3ZoomBehavior {
  scaleExtent(extent: [number, number]): D3ZoomBehavior;
  on(event: string, handler: (event: any) => void): D3ZoomBehavior;
}

interface D3DragBehavior {
  on(event: string, handler: (event: any) => void): D3DragBehavior;
}

interface Window {
  d3: {
    select(element: Element): D3Selection;
    forceSimulation<N extends D3SimNode>(nodes?: N[]): D3Simulation<N>;
    forceLink<N extends D3SimNode>(
      links?: { source: any; target: any }[],
    ): D3ForceLink<N>;
    forceManyBody(): D3ForceManyBody;
    forceCenter(x: number, y: number): object;
    forceCollide(radius?: number): D3ForceCollide;
    forceX(x?: number): { strength(s: number): object };
    forceY(y?: number): { strength(s: number): object };
    zoom(): D3ZoomBehavior;
    zoomIdentity: D3ZoomTransform;
    drag<N extends D3SimNode>(): D3DragBehavior;
  };
}
