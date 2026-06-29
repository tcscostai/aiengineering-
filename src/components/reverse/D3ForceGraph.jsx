import { useEffect, useRef, useMemo, useState } from 'react'
import * as d3 from 'd3'
import { GlassPanel } from '../ui/GlassPanel'

const NODE_COLORS = {
  module: { fill: 'rgba(94,200,242,0.15)', stroke: '#5ec8f2' },
  dependency: { fill: 'rgba(155,139,212,0.15)', stroke: '#9b8bd4' },
  dataflow: { fill: 'rgba(62,207,155,0.15)', stroke: '#3ecf9b' },
}

const LAYER_EDGE_STYLE = {
  architecture: { color: '#5ec8f2', dash: null },
  dependencies: { color: '#9b8bd4', dash: '4 4' },
  dataflow: { color: '#3ecf9b', dash: '2 6' },
}

function filterGraph(graph, layer) {
  if (!graph) return { nodes: [], edges: [] }
  if (layer === 'all') return graph

  const nodes = graph.nodes.filter((n) => n.layer === layer || (layer === 'architecture' && n.type === 'module'))
  const nodeIds = new Set(nodes.map((n) => n.id))

  if (layer === 'dependencies') {
    const depNodes = graph.nodes.filter((n) => n.type === 'dependency' || n.type === 'module')
    const depIds = new Set(depNodes.map((n) => n.id))
    return {
      nodes: depNodes,
      edges: graph.edges.filter((e) => e.layer === 'dependencies' && depIds.has(e.source) && depIds.has(e.target)),
    }
  }

  if (layer === 'dataflow') {
    const flowNodes = graph.nodes.filter((n) => n.layer === 'dataflow' || n.type === 'module')
    const flowIds = new Set(flowNodes.map((n) => n.id))
    return {
      nodes: flowNodes,
      edges: graph.edges.filter((e) => e.layer === 'dataflow' && flowIds.has(e.source) && flowIds.has(e.target)),
    }
  }

  return {
    nodes,
    edges: graph.edges.filter((e) => e.layer === layer && nodeIds.has(e.source) && nodeIds.has(e.target)),
  }
}

export function D3ForceGraph({ graph, layer = 'all', height = 520, selectedNodeId, onNodeSelect }) {
  const svgRef = useRef(null)
  const containerRef = useRef(null)
  const simRef = useRef(null)
  const [containerWidth, setContainerWidth] = useState(800)
  const filtered = useMemo(() => filterGraph(graph, layer), [graph, layer])

  useEffect(() => {
    const el = containerRef.current
    if (!el) return
    const ro = new ResizeObserver(([entry]) => {
      const w = entry.contentRect.width
      if (w > 0) setContainerWidth(w)
    })
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  useEffect(() => {
    const svgEl = svgRef.current
    if (!svgEl || !filtered.nodes.length) return

    const width = containerWidth || svgEl.clientWidth || 800
    const svg = d3.select(svgEl)
    svg.selectAll('*').remove()

    const g = svg.append('g')

    const zoom = d3.zoom().scaleExtent([0.2, 3]).on('zoom', (event) => {
      g.attr('transform', event.transform)
    })
    svg.call(zoom)

    const nodes = filtered.nodes.map((n) => ({ ...n }))
    const links = filtered.edges.map((e) => ({ ...e }))

    const link = g.append('g')
      .selectAll('line')
      .data(links)
      .join('line')
      .attr('stroke', (d) => LAYER_EDGE_STYLE[d.layer]?.color ?? '#5ec8f266')
      .attr('stroke-width', (d) => Math.min(3, 1 + (d.weight ?? 1) * 0.4))
      .attr('stroke-dasharray', (d) => LAYER_EDGE_STYLE[d.layer]?.dash ?? null)
      .attr('marker-end', 'url(#arrow)')

    svg.append('defs').append('marker')
      .attr('id', 'arrow')
      .attr('viewBox', '0 -5 10 10')
      .attr('refX', 22)
      .attr('refY', 0)
      .attr('markerWidth', 6)
      .attr('markerHeight', 6)
      .attr('orient', 'auto')
      .append('path')
      .attr('d', 'M0,-5L10,0L0,5')
      .attr('fill', '#5ec8f288')

    const node = g.append('g')
      .selectAll('g')
      .data(nodes)
      .join('g')
      .style('cursor', 'pointer')
      .call(
        d3.drag()
          .on('start', (event, d) => {
            if (!event.active) simulation.alphaTarget(0.3).restart()
            d.fx = d.x
            d.fy = d.y
          })
          .on('drag', (event, d) => {
            d.fx = event.x
            d.fy = event.y
          })
          .on('end', (event, d) => {
            if (!event.active) simulation.alphaTarget(0)
            d.fx = null
            d.fy = null
          })
      )
      .on('click', (_, d) => onNodeSelect?.(d.id))

    node.append('circle')
      .attr('r', (d) => d.radius ?? (d.type === 'dependency' ? 12 : 20))
      .attr('fill', (d) => NODE_COLORS[d.type]?.fill ?? NODE_COLORS.module.fill)
      .attr('stroke', (d) => (d.id === selectedNodeId ? '#e8edf4' : NODE_COLORS[d.type]?.stroke ?? '#5ec8f2'))
      .attr('stroke-width', (d) => (d.id === selectedNodeId ? 2.5 : 1.5))

    node.append('text')
      .text((d) => d.label)
      .attr('x', 0)
      .attr('y', (d) => (d.radius ?? 20) + 14)
      .attr('text-anchor', 'middle')
      .attr('fill', '#cbd5e1')
      .attr('font-size', '10px')
      .attr('font-family', 'Inter, system-ui, sans-serif')

    node.filter((d) => d.count)
      .append('text')
      .text((d) => d.count)
      .attr('text-anchor', 'middle')
      .attr('dy', 4)
      .attr('fill', '#9b8bd4')
      .attr('font-size', '9px')

    const simulation = d3.forceSimulation(nodes)
      .force('link', d3.forceLink(links).id((d) => d.id).distance(90).strength(0.5))
      .force('charge', d3.forceManyBody().strength(-280))
      .force('center', d3.forceCenter(width / 2, height / 2))
      .force('collision', d3.forceCollide().radius((d) => (d.radius ?? 20) + 12))

    simulation.on('tick', () => {
      link
        .attr('x1', (d) => d.source.x)
        .attr('y1', (d) => d.source.y)
        .attr('x2', (d) => d.target.x)
        .attr('y2', (d) => d.target.y)
      node.attr('transform', (d) => `translate(${d.x},${d.y})`)
    })

    simRef.current = simulation
    return () => simulation.stop()
  }, [filtered, height, selectedNodeId, onNodeSelect, containerWidth])

  if (!filtered.nodes.length) {
    return (
      <div className="flex items-center justify-center h-full min-h-[200px] text-sm text-cx-fg-dim p-8 text-center">
        No nodes in this layer. Try <strong className="text-cx-fg-muted mx-1">All layers</strong> or run a scan with more interconnected code.
      </div>
    )
  }

  return (
    <div ref={containerRef} className="w-full h-full">
      <svg
        ref={svgRef}
        width="100%"
        height={height}
        className="bg-cx-deep/50"
        style={{ display: 'block' }}
      />
    </div>
  )
}
