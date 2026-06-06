'use client';

import { useEffect, useRef, useState } from 'react';

interface WrittenSignaturePadProps {
  onConfirm: (signaturePngBase64: string) => void;
}

type Point = { x: number; y: number };

function getPoint(canvas: HTMLCanvasElement, event: React.PointerEvent<HTMLCanvasElement>): Point {
  const rect = canvas.getBoundingClientRect();
  return {
    x: event.clientX - rect.left,
    y: event.clientY - rect.top,
  };
}

function setupContext(canvas: HTMLCanvasElement): CanvasRenderingContext2D | null {
  const context = canvas.getContext('2d');
  if (!context) return null;

  context.lineCap = 'round';
  context.lineJoin = 'round';
  context.strokeStyle = '#111827';
  context.lineWidth = 2.4;
  return context;
}

export function WrittenSignaturePad({ onConfirm }: WrittenSignaturePadProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const drawing = useRef(false);
  const lastPoint = useRef<Point | null>(null);
  const hasInkRef = useRef(false);
  const [hasInk, setHasInk] = useState(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const resizeCanvas = () => {
      const previousImage = hasInkRef.current ? canvas.toDataURL('image/png') : null;
      const rect = canvas.getBoundingClientRect();
      const dpr = window.devicePixelRatio || 1;

      canvas.width = Math.max(1, Math.floor(rect.width * dpr));
      canvas.height = Math.max(1, Math.floor(rect.height * dpr));

      const context = setupContext(canvas);
      if (!context) return;
      context.scale(dpr, dpr);

      if (previousImage) {
        const image = new Image();
        image.onload = () => context.drawImage(image, 0, 0, rect.width, rect.height);
        image.src = previousImage;
      }
    };

    resizeCanvas();

    const observer = new ResizeObserver(resizeCanvas);
    observer.observe(canvas);
    return () => observer.disconnect();
  }, []);

  const syncInk = () => {
    if (!hasInkRef.current) {
      hasInkRef.current = true;
      setHasInk(true);
    }
  };

  const clear = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const context = canvas.getContext('2d');
    context?.clearRect(0, 0, canvas.width, canvas.height);
    drawing.current = false;
    lastPoint.current = null;
    hasInkRef.current = false;
    setHasInk(false);
  };

  const confirm = () => {
    const canvas = canvasRef.current;
    if (!canvas || !hasInk) return;
    onConfirm(canvas.toDataURL('image/png'));
  };

  const handlePointerDown = (event: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = event.currentTarget;
    const context = setupContext(canvas);
    if (!context) return;

    canvas.setPointerCapture(event.pointerId);
    drawing.current = true;
    lastPoint.current = getPoint(canvas, event);

    context.beginPath();
    context.arc(lastPoint.current.x, lastPoint.current.y, 1.2, 0, Math.PI * 2);
    context.fillStyle = '#111827';
    context.fill();
    syncInk();
  };

  const handlePointerMove = (event: React.PointerEvent<HTMLCanvasElement>) => {
    if (!drawing.current || !lastPoint.current) return;

    const canvas = event.currentTarget;
    const context = setupContext(canvas);
    if (!context) return;

    const point = getPoint(canvas, event);
    context.beginPath();
    context.moveTo(lastPoint.current.x, lastPoint.current.y);
    context.quadraticCurveTo(
      lastPoint.current.x,
      lastPoint.current.y,
      (lastPoint.current.x + point.x) / 2,
      (lastPoint.current.y + point.y) / 2,
    );
    context.stroke();

    lastPoint.current = point;
    syncInk();
  };

  const handlePointerEnd = (event: React.PointerEvent<HTMLCanvasElement>) => {
    drawing.current = false;
    lastPoint.current = null;
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
  };

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-5">
      <div>
        <h3 className="text-lg font-semibold text-gray-950">Assinatura escrita</h3>
        <p className="mt-1 text-sm leading-6 text-gray-500">
          Desenhe sua assinatura no campo abaixo usando mouse, dedo ou caneta.
        </p>
      </div>

      <div className="mt-5 rounded-xl border border-gray-200 bg-white p-3">
        <canvas
          ref={canvasRef}
          className="h-56 w-full cursor-crosshair rounded-lg bg-white"
          style={{ touchAction: 'none' }}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerEnd}
          onPointerCancel={handlePointerEnd}
          aria-label="Área para desenhar assinatura"
        />
        <div className="mt-2 border-t border-dashed border-gray-200 pt-2 text-center text-xs text-gray-400">
          Assine acima da linha
        </div>
      </div>

      <div className="mt-5 flex gap-3">
        <button
          type="button"
          onClick={clear}
          disabled={!hasInk}
          className="flex-1 rounded-lg border border-gray-300 px-4 py-2 text-sm font-semibold text-gray-700 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
        >
          Limpar
        </button>
        <button
          type="button"
          onClick={confirm}
          disabled={!hasInk}
          className="flex-1 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
        >
          Confirmar Assinatura
        </button>
      </div>
    </div>
  );
}
