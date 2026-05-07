"use client";

import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { useT } from "@/lib/i18n/locale-context";

interface Props {
  onSign: (dataUrl: string) => Promise<void> | void;
  onCancel: () => void;
  submitting?: boolean;
}

interface Point { x: number; y: number }

export function SignaturePad({ onSign, onCancel, submitting }: Props) {
  const t = useT();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const drawingRef = useRef(false);
  const lastRef = useRef<Point | null>(null);
  const [hasInk, setHasInk] = useState(false);

  // Configure canvas at hi-DPI for sharp lines
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ratio = Math.max(window.devicePixelRatio || 1, 1);
    const rect = canvas.getBoundingClientRect();
    canvas.width = Math.round(rect.width * ratio);
    canvas.height = Math.round(rect.height * ratio);
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.scale(ratio, ratio);
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, rect.width, rect.height);
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.lineWidth = 2.2;
    ctx.strokeStyle = "#0f172a";
  }, []);

  const pointFromEvent = (e: PointerEvent | React.PointerEvent): Point => {
    const canvas = canvasRef.current!;
    const rect = canvas.getBoundingClientRect();
    return { x: e.clientX - rect.left, y: e.clientY - rect.top };
  };

  const onPointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    canvasRef.current?.setPointerCapture(e.pointerId);
    drawingRef.current = true;
    lastRef.current = pointFromEvent(e);
  };

  const onPointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!drawingRef.current) return;
    const ctx = canvasRef.current?.getContext("2d");
    if (!ctx || !lastRef.current) return;
    const p = pointFromEvent(e);
    ctx.beginPath();
    ctx.moveTo(lastRef.current.x, lastRef.current.y);
    ctx.lineTo(p.x, p.y);
    ctx.stroke();
    lastRef.current = p;
    if (!hasInk) setHasInk(true);
  };

  const onPointerUp = (e: React.PointerEvent<HTMLCanvasElement>) => {
    drawingRef.current = false;
    lastRef.current = null;
    canvasRef.current?.releasePointerCapture(e.pointerId);
  };

  const clear = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const rect = canvas.getBoundingClientRect();
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, rect.width, rect.height);
    setHasInk(false);
  };

  const handleSubmit = async () => {
    const canvas = canvasRef.current;
    if (!canvas || !hasInk) return;
    const dataUrl = canvas.toDataURL("image/png");
    await onSign(dataUrl);
  };

  return (
    <div className="flex flex-col gap-3">
      <div className="rounded-xl border border-border bg-white p-1">
        <canvas
          ref={canvasRef}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerCancel={onPointerUp}
          className="block h-44 w-full touch-none rounded-lg"
          aria-label={t.documents.signature.canvasLabel}
        />
      </div>
      <p className="text-[11px] text-muted-foreground">{t.documents.signature.hint}</p>
      <div className="flex justify-end gap-2">
        <Button variant="outline" onClick={clear} disabled={submitting || !hasInk}>
          {t.documents.signature.clear}
        </Button>
        <Button variant="outline" onClick={onCancel} disabled={submitting}>
          {t.common.cancel}
        </Button>
        <Button onClick={handleSubmit} disabled={!hasInk || submitting}>
          {submitting ? t.documents.signature.signing : t.documents.signature.confirm}
        </Button>
      </div>
    </div>
  );
}
