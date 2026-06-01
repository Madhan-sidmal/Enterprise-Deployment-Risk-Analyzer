import React, { useEffect, useRef, useState } from 'react';

/**
 * Pure-canvas dependency graph — no external lib needed.
 * Renders nodes as circles connected by arrows, red for conflicted edges.
 */
const DependencyGraph = ({ nodes = [], edges = [] }) => {
  const canvasRef = useRef(null);
  const [hovered, setHovered] = useState(null);
  const posRef = useRef({});

  // Layout: spread nodes in a circle
  const computePositions = (nodes, w, h) => {
    const cx = w / 2, cy = h / 2;
    const r  = Math.min(w, h) * 0.35;
    const positions = {};
    if (nodes.length === 1) {
      positions[nodes[0].id] = { x: cx, y: cy };
    } else {
      nodes.forEach((n, i) => {
        const angle = (2 * Math.PI * i) / nodes.length - Math.PI / 2;
        positions[n.id] = { x: cx + r * Math.cos(angle), y: cy + r * Math.sin(angle) };
      });
    }
    return positions;
  };

  const draw = () => {
    const canvas = canvasRef.current;
    if (!canvas || nodes.length === 0) return;
    const ctx   = canvas.getContext('2d');
    const w = canvas.width, h = canvas.height;
    ctx.clearRect(0, 0, w, h);

    const positions = computePositions(nodes, w, h);
    posRef.current = positions;

    const nodeRadius = 36;

    // Draw edges
    edges.forEach(edge => {
      const from = positions[edge.from];
      const to   = positions[edge.to];
      if (!from || !to) return;

      const color = edge.hasConflict ? '#ef4444' : '#6366f1';
      const alpha = edge.hasConflict ? 'cc' : '80';

      ctx.beginPath();
      ctx.strokeStyle = color + alpha;
      ctx.lineWidth   = edge.hasConflict ? 2.5 : 1.5;
      if (edge.hasConflict) ctx.setLineDash([6, 3]);
      else ctx.setLineDash([]);

      // Arrow from → to
      const dx = to.x - from.x, dy = to.y - from.y;
      const len = Math.sqrt(dx * dx + dy * dy);
      const ux = dx / len, uy = dy / len;
      const startX = from.x + ux * nodeRadius;
      const startY = from.y + uy * nodeRadius;
      const endX   = to.x   - ux * (nodeRadius + 8);
      const endY   = to.y   - uy * (nodeRadius + 8);

      ctx.moveTo(startX, startY);
      ctx.lineTo(endX, endY);
      ctx.stroke();
      ctx.setLineDash([]);

      // Arrowhead
      const headLen = 10;
      const angle   = Math.atan2(endY - startY, endX - startX);
      ctx.beginPath();
      ctx.fillStyle = color + alpha;
      ctx.moveTo(endX, endY);
      ctx.lineTo(endX - headLen * Math.cos(angle - 0.4), endY - headLen * Math.sin(angle - 0.4));
      ctx.lineTo(endX - headLen * Math.cos(angle + 0.4), endY - headLen * Math.sin(angle + 0.4));
      ctx.closePath();
      ctx.fill();

      // Version label
      if (edge.requiredVersion) {
        const mx = (startX + endX) / 2, my = (startY + endY) / 2;
        ctx.font = '10px Inter, sans-serif';
        ctx.fillStyle = edge.hasConflict ? '#f87171' : '#818cf8';
        ctx.textAlign = 'center';
        ctx.fillText(`v${edge.requiredVersion}`, mx, my - 6);
      }
    });

    // Draw nodes
    nodes.forEach(node => {
      const pos = positions[node.id];
      if (!pos) return;
      const isHovered  = hovered === node.id;
      const isConflict = node.hasIssue;

      // Shadow
      ctx.shadowColor  = isConflict ? 'rgba(239,68,68,0.4)' : 'rgba(99,102,241,0.3)';
      ctx.shadowBlur   = isHovered ? 20 : 12;

      // Circle fill
      const gradient = ctx.createRadialGradient(pos.x - 8, pos.y - 8, 4, pos.x, pos.y, nodeRadius);
      if (isConflict) {
        gradient.addColorStop(0, '#7f1d1d');
        gradient.addColorStop(1, '#450a0a');
      } else {
        gradient.addColorStop(0, '#312e81');
        gradient.addColorStop(1, '#1e1b4b');
      }
      ctx.beginPath();
      ctx.arc(pos.x, pos.y, nodeRadius, 0, 2 * Math.PI);
      ctx.fillStyle = gradient;
      ctx.fill();

      // Border
      ctx.strokeStyle = isConflict ? '#ef4444' : (isHovered ? '#6366f1' : '#4338ca');
      ctx.lineWidth   = isConflict ? 2.5 : (isHovered ? 2 : 1.5);
      ctx.stroke();
      ctx.shadowBlur  = 0;

      // Service name
      ctx.font        = `${isHovered ? '600' : '500'} 11px Inter, sans-serif`;
      ctx.fillStyle   = isConflict ? '#fca5a5' : '#c7d2fe';
      ctx.textAlign   = 'center';
      ctx.textBaseline = 'middle';
      const name = node.label.length > 10 ? node.label.substring(0, 9) + '…' : node.label;
      ctx.fillText(name, pos.x, pos.y - 6);

      // Version
      ctx.font        = '10px Inter, sans-serif';
      ctx.fillStyle   = isConflict ? '#f87171' : '#818cf8';
      ctx.fillText(`v${node.version || '?'}`, pos.x, pos.y + 8);

      // Issue badge
      if (isConflict) {
        ctx.font = 'bold 12px sans-serif';
        ctx.fillStyle = '#ef4444';
        ctx.fillText('⚠', pos.x + nodeRadius - 8, pos.y - nodeRadius + 8);
      }
    });
  };

  useEffect(() => { draw(); }, [nodes, edges, hovered]);

  const handleMouseMove = (e) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const mx = e.clientX - rect.left;
    const my = e.clientY - rect.top;
    let found = null;
    for (const [id, pos] of Object.entries(posRef.current)) {
      const dx = mx - pos.x, dy = my - pos.y;
      if (Math.sqrt(dx * dx + dy * dy) < 36) { found = id; break; }
    }
    setHovered(found);
  };

  if (nodes.length === 0) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: 300, color: 'var(--text-muted)', gap: 12 }}>
        <div style={{ fontSize: '2.5rem' }}>🌐</div>
        <div style={{ fontSize: '0.9rem' }}>Submit a dependency graph to visualize it here</div>
      </div>
    );
  }

  return (
    <div style={{ position: 'relative' }}>
      <canvas
        ref={canvasRef}
        width={700} height={420}
        onMouseMove={handleMouseMove}
        onMouseLeave={() => setHovered(null)}
        style={{ width: '100%', height: 'auto', borderRadius: 'var(--radius-md)', cursor: 'crosshair', background: 'rgba(0,0,0,0.15)' }}
      />
      {hovered && (
        <div style={{
          position: 'absolute', bottom: 12, left: 12,
          background: 'rgba(15,23,42,0.95)', border: '1px solid var(--border-subtle)',
          borderRadius: 'var(--radius-md)', padding: '0.5rem 0.9rem',
          fontSize: '0.8rem', color: 'var(--text-primary)', pointerEvents: 'none'
        }}>
          📍 <strong>{hovered}</strong>
          {nodes.find(n => n.id === hovered)?.hasIssue && <span style={{ color: '#f87171', marginLeft: 6 }}>⚠ Has Issues</span>}
        </div>
      )}
      <div style={{ display: 'flex', gap: 'var(--space-4)', marginTop: 'var(--space-3)', flexWrap: 'wrap' }}>
        {[
          { color: '#6366f1', label: 'Normal dependency' },
          { color: '#ef4444', label: 'Conflicted / missing edge', dashed: true },
          { color: '#c7d2fe', label: 'Service node' },
          { color: '#fca5a5', label: 'Node with issues' },
        ].map((l, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <div style={{ width: 20, height: 3, background: l.color, borderRadius: 2, ...(l.dashed ? { borderTop: `2px dashed ${l.color}`, background: 'transparent', height: 0 } : {}) }} />
            <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{l.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default DependencyGraph;
