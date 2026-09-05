import React, { useEffect, useRef, useState } from "react";
import { Eraser, Pen, RotateCcw, Trash2, X } from "lucide-react";

const COLORS = ["#60a5fa", "#34d399", "#fbbf24", "#f472b6", "#f8fafc"];

function drawStroke(context, stroke, width, height) {
  if (!stroke?.points?.length) return;
  context.beginPath();
  context.lineCap = "round";
  context.lineJoin = "round";
  context.strokeStyle = stroke.color;
  context.lineWidth = stroke.size;
  stroke.points.forEach((point, index) => {
    const x = point.x * width;
    const y = point.y * height;
    if (index === 0) context.moveTo(x, y);
    else context.lineTo(x, y);
  });
  context.stroke();
}

export default function Whiteboard({ sendDataMessage, dataMessages = [], onClose }) {
  const canvasRef = useRef(null);
  const containerRef = useRef(null);
  const drawingRef = useRef(null);
  const [strokes, setStrokes] = useState([]);
  const [tool, setTool] = useState("pen");
  const [color, setColor] = useState(COLORS[0]);
  const [size, setSize] = useState(4);

  const redraw = () => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;
    const rect = container.getBoundingClientRect();
    const ratio = window.devicePixelRatio || 1;
    canvas.width = rect.width * ratio;
    canvas.height = rect.height * ratio;
    canvas.style.width = `${rect.width}px`;
    canvas.style.height = `${rect.height}px`;
    const context = canvas.getContext("2d");
    context.scale(ratio, ratio);
    context.fillStyle = "#0f172a";
    context.fillRect(0, 0, rect.width, rect.height);
    strokes.forEach((stroke) => drawStroke(context, stroke, rect.width, rect.height));
  };

  useEffect(() => {
    redraw();
    const observer = new ResizeObserver(redraw);
    if (containerRef.current) observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, [strokes]);

  useEffect(() => {
    const latest = dataMessages[dataMessages.length - 1];
    if (!latest || latest.type !== "whiteboard") return;
    if (latest.action === "clear") setStrokes([]);
    if (latest.action === "stroke" && latest.stroke) {
      setStrokes((current) => [...current, latest.stroke]);
    }
  }, [dataMessages]);

  const pointFromEvent = (event) => {
    const rect = canvasRef.current.getBoundingClientRect();
    return {
      x: Math.max(0, Math.min(1, (event.clientX - rect.left) / rect.width)),
      y: Math.max(0, Math.min(1, (event.clientY - rect.top) / rect.height)),
    };
  };

  const handlePointerDown = (event) => {
    event.currentTarget.setPointerCapture(event.pointerId);
    drawingRef.current = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
      color: tool === "eraser" ? "#0f172a" : color,
      size: tool === "eraser" ? 24 : size,
      points: [pointFromEvent(event)],
    };
    setStrokes((current) => [...current, drawingRef.current]);
  };

  const handlePointerMove = (event) => {
    const active = drawingRef.current;
    if (!active) return;
    active.points = [...active.points, pointFromEvent(event)];
    setStrokes((current) => current.map((stroke) => stroke.id === active.id ? active : stroke));
  };

  const finishStroke = () => {
    const active = drawingRef.current;
    drawingRef.current = null;
    if (active?.points?.length > 1) {
      sendDataMessage?.({ type: "whiteboard", action: "stroke", stroke: active });
    }
  };

  const clearBoard = () => {
    setStrokes([]);
    sendDataMessage?.({ type: "whiteboard", action: "clear" });
  };

  return (
    <div className="absolute inset-0 z-20 flex flex-col overflow-hidden rounded-3xl border border-blue-500/30 bg-slate-950 shadow-2xl">
      <div className="flex shrink-0 items-center justify-between border-b border-slate-800 bg-slate-950/95 px-4 py-3">
        <div><p className="text-sm font-semibold text-slate-100">System Design Whiteboard</p><p className="text-[10px] text-slate-500">Shared live canvas · strokes sync through Agora RTC</p></div>
        <div className="flex items-center gap-2">
          <button type="button" onClick={() => setTool("pen")} className={`rounded-lg p-2 ${tool === "pen" ? "bg-blue-600 text-white" : "bg-slate-800 text-slate-400"}`} title="Pen"><Pen size={15} /></button>
          <button type="button" onClick={() => setTool("eraser")} className={`rounded-lg p-2 ${tool === "eraser" ? "bg-blue-600 text-white" : "bg-slate-800 text-slate-400"}`} title="Eraser"><Eraser size={15} /></button>
          <div className="flex items-center gap-1 rounded-lg bg-slate-800 p-1">{COLORS.map((item) => <button key={item} type="button" onClick={() => { setColor(item); setTool("pen"); }} className={`h-4 w-4 rounded-full ${color === item && tool === "pen" ? "ring-2 ring-white ring-offset-1 ring-offset-slate-800" : ""}`} style={{ backgroundColor: item }} />)}</div>
          <select value={size} onChange={(event) => setSize(Number(event.target.value))} className="rounded-lg border-0 bg-slate-800 px-2 py-1.5 text-xs text-slate-300 outline-none"><option value={2}>Thin</option><option value={4}>Medium</option><option value={8}>Thick</option></select>
          <button type="button" onClick={() => setStrokes((current) => current.slice(0, -1))} className="rounded-lg bg-slate-800 p-2 text-slate-400 hover:text-white" title="Undo local stroke"><RotateCcw size={15} /></button>
          <button type="button" onClick={clearBoard} className="rounded-lg bg-red-500/10 p-2 text-red-400 hover:bg-red-500/20" title="Clear for everyone"><Trash2 size={15} /></button>
          <button type="button" onClick={onClose} className="rounded-lg bg-slate-800 p-2 text-slate-400 hover:text-white" title="Close whiteboard"><X size={16} /></button>
        </div>
      </div>
      <div ref={containerRef} className="relative min-h-0 flex-1 touch-none bg-slate-900">
        <canvas ref={canvasRef} onPointerDown={handlePointerDown} onPointerMove={handlePointerMove} onPointerUp={finishStroke} onPointerCancel={finishStroke} onPointerLeave={finishStroke} className="absolute inset-0 cursor-crosshair" />
        <div className="pointer-events-none absolute bottom-3 left-3 rounded-lg border border-slate-700/80 bg-slate-950/80 px-2 py-1 text-[10px] text-slate-500">{tool === "eraser" ? "Eraser" : "Pen"} · draw architecture, flows, and trade-offs</div>
      </div>
    </div>
  );
}
