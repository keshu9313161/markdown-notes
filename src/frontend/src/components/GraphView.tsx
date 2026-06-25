import { Button } from "@/components/ui/button";
import { Loader2, X } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { useGraphData } from "../hooks/useQueries";

interface GraphSimNode extends D3SimNode {
  id: string;
  title: string;
}

interface GraphViewProps {
  selectDoc: (id: bigint | null) => void;
  closeGraphView: () => void;
}

export function GraphView({ selectDoc, closeGraphView }: GraphViewProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const simulationRef = useRef<D3Simulation<GraphSimNode> | null>(null);
  const { data: graphData, isLoading, isError } = useGraphData();
  const [resizeKey, setResizeKey] = useState(0);

  // Re-initialize graph when window resizes so SVG dimensions match the new container size
  useEffect(() => {
    const handle = () => setResizeKey((k) => k + 1);
    window.addEventListener("resize", handle);
    return () => window.removeEventListener("resize", handle);
  }, []);

  const handleNodeClick = useCallback(
    (nodeId: string) => {
      selectDoc(BigInt(nodeId));
    },
    [selectDoc],
  );

  // biome-ignore lint/correctness/useExhaustiveDependencies: intentional
  useEffect(() => {
    if (!graphData || !svgRef.current || !containerRef.current) return;
    if (graphData.nodes.length === 0) return;

    const d3 = window.d3;
    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove();

    const rect = containerRef.current.getBoundingClientRect();
    const width = rect.width;
    const height = rect.height;

    svg.attr("width", width).attr("height", height);

    // Prepare data (d3 mutates nodes in place)
    const nodes: GraphSimNode[] = graphData.nodes.map((n) => ({
      id: n.id.toString(),
      title: n.title,
    }));
    const links = graphData.edges.map((e) => ({
      source: e.source.toString(),
      target: e.target.toString(),
    }));

    // Build adjacency set for highlight lookups
    const neighbors = new Map<string, Set<string>>();
    for (const l of links) {
      if (!neighbors.has(l.source)) neighbors.set(l.source, new Set());
      if (!neighbors.has(l.target)) neighbors.set(l.target, new Set());
      neighbors.get(l.source)!.add(l.target);
      neighbors.get(l.target)!.add(l.source);
    }

    function isConnected(a: string, b: string) {
      return a === b || !!neighbors.get(a)?.has(b);
    }

    // Container group for zoom/pan
    const g = svg.append("g");

    // Zoom behavior
    const zoom = d3
      .zoom()
      .scaleExtent([0.2, 5])
      .on("zoom", (event: { transform: D3ZoomTransform }) => {
        g.attr(
          "transform",
          `translate(${event.transform.x},${event.transform.y}) scale(${event.transform.k})`,
        );
      });
    svg.call(zoom);

    // Edges
    const link = g
      .append("g")
      .selectAll("line")
      .data(links)
      .join("line")
      .style("stroke", "var(--border)")
      .style("stroke-opacity", "0.5")
      .attr("stroke-width", 1.5);

    // Node groups
    const node = g
      .append("g")
      .selectAll("g")
      .data(nodes)
      .join("g")
      .style("cursor", "pointer");

    // Node circles
    node
      .append("circle")
      .attr("r", 7)
      .style("fill", "var(--primary)")
      .style("stroke", "var(--background)")
      .attr("stroke-width", 2)
      .style("transition", "r 0.15s, fill-opacity 0.15s");

    // Node labels
    node
      .append("text")
      .text((d: GraphSimNode) =>
        d.title.length > 14 ? `${d.title.slice(0, 12)}...` : d.title,
      )
      .attr("dx", 12)
      .attr("dy", 4)
      .style("font-size", "11px")
      .style("fill", "var(--foreground)")
      .style("pointer-events", "none")
      .style("user-select", "none")
      .style("transition", "opacity 0.15s");

    // Hover highlight
    node.on("mouseenter", (_event: MouseEvent, d: GraphSimNode) => {
      node.each(function (this: SVGGElement, o: GraphSimNode) {
        const connected = isConnected(d.id, o.id);
        const el = d3.select(this);
        el.select("circle")
          .style("fill-opacity", connected ? "1" : "0.15")
          .attr("r", o.id === d.id ? 9 : 7);
        el.select("text").style("opacity", connected ? "1" : "0.15");
      });
      link
        .style(
          "stroke-opacity",
          (l: { source: GraphSimNode; target: GraphSimNode }) =>
            l.source.id === d.id || l.target.id === d.id ? "0.8" : "0.05",
        )
        .attr(
          "stroke-width",
          (l: { source: GraphSimNode; target: GraphSimNode }) =>
            l.source.id === d.id || l.target.id === d.id ? 2 : 1.5,
        );
    });

    node.on("mouseleave", () => {
      node.each(function (this: SVGGElement) {
        const el = d3.select(this);
        el.select("circle").style("fill-opacity", "1").attr("r", 7);
        el.select("text").style("opacity", "1");
      });
      link.style("stroke-opacity", "0.5").attr("stroke-width", 1.5);
    });

    // Click to navigate
    node.on("click", (_event: MouseEvent, d: GraphSimNode) => {
      handleNodeClick(d.id);
    });

    // Drag behavior
    const drag = d3
      .drag<GraphSimNode>()
      .on("start", (event: { active: number; subject: GraphSimNode }) => {
        if (!event.active) simulation.alphaTarget(0.3).restart();
        event.subject.fx = event.subject.x;
        event.subject.fy = event.subject.y;
      })
      .on("drag", (event: { subject: GraphSimNode; x: number; y: number }) => {
        event.subject.fx = event.x;
        event.subject.fy = event.y;
      })
      .on("end", (event: { active: number; subject: GraphSimNode }) => {
        if (!event.active) simulation.alphaTarget(0);
        event.subject.fx = null;
        event.subject.fy = null;
      });
    node.call(drag);

    // Force simulation
    const simulation = d3
      .forceSimulation<GraphSimNode>(nodes)
      .force(
        "link",
        d3
          .forceLink<GraphSimNode>(links)
          .id((d: GraphSimNode) => d.id)
          .distance(130),
      )
      .force("charge", d3.forceManyBody().strength(-300))
      .force("x", d3.forceX(width / 2).strength(0.05))
      .force("y", d3.forceY(height / 2).strength(0.05))
      .force("collide", d3.forceCollide(60))
      .on("tick", () => {
        link
          .attr("x1", (d: { source: GraphSimNode }) => d.source.x ?? 0)
          .attr("y1", (d: { source: GraphSimNode }) => d.source.y ?? 0)
          .attr("x2", (d: { target: GraphSimNode }) => d.target.x ?? 0)
          .attr("y2", (d: { target: GraphSimNode }) => d.target.y ?? 0);
        node.attr(
          "transform",
          (d: GraphSimNode) => `translate(${d.x ?? 0},${d.y ?? 0})`,
        );

        // Hide labels that overlap with nearby nodes
        node.each(function (this: SVGGElement, a: GraphSimNode) {
          const label = d3.select(this).select("text");
          let hidden = false;
          node.each(function (this: SVGGElement, b: GraphSimNode) {
            if (a === b || hidden) return;
            const dx = (b.x ?? 0) - (a.x ?? 0);
            const dy = (b.y ?? 0) - (a.y ?? 0);
            // Hide if another node is within the label's horizontal span and close vertically
            if (dx > 0 && dx < 100 && Math.abs(dy) < 16) {
              hidden = true;
            }
          });
          label.style("opacity", hidden ? "0" : null);
        });
      });

    simulationRef.current = simulation;

    return () => {
      simulation.stop();
      simulationRef.current = null;
    };
  }, [graphData, handleNodeClick, resizeKey]);

  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <p className="text-destructive">Failed to load graph data.</p>
      </div>
    );
  }

  if (graphData && graphData.nodes.length === 0) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center gap-2 text-muted-foreground">
        <p>No documents to visualize.</p>
        <p className="text-sm">
          Create some documents to see your knowledge graph.
        </p>
        <Button
          variant="ghost"
          size="sm"
          onClick={closeGraphView}
          className="mt-2"
        >
          Back to editor
        </Button>
      </div>
    );
  }

  return (
    <div ref={containerRef} className="flex-1 relative overflow-hidden">
      <svg ref={svgRef} className="absolute inset-0 w-full h-full" />
      <div className="absolute top-3 right-3 flex items-center gap-2">
        <span className="text-xs text-muted-foreground bg-background/80 backdrop-blur-sm px-2 py-1 rounded">
          {graphData?.nodes.length ?? 0} nodes &middot;{" "}
          {graphData?.edges.length ?? 0} edges
        </span>
        <Button
          variant="outline"
          size="icon"
          className="h-8 w-8 bg-background/80 backdrop-blur-sm"
          onClick={closeGraphView}
        >
          <X className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
