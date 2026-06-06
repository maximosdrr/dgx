'use client';

import { useEffect, useRef, useState } from 'react';
import { api } from '@/lib/api';

interface FacialSignatureCaptureProps {
  documentId: string;
  onComplete: (result: FacialSignatureResult) => void;
}

interface FacialSignatureResult {
  signatureId: string;
  documentId: string;
  signedAt: string;
  signatureType: 'FACIAL';
  signatureStatus: 'SIGNED';
  presignedUrl: string;
  expiresAt: string;
  faceImageHash: string;
  signatureKey: string;
}

export function FacialSignatureCapture({ documentId, onComplete }: FacialSignatureCaptureProps) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [signerName, setSignerName] = useState('');
  const [signerDocument, setSignerDocument] = useState('');
  const [cameraOpen, setCameraOpen] = useState(false);
  const [cameraReady, setCameraReady] = useState(false);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [result, setResult] = useState<FacialSignatureResult | null>(null);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!cameraOpen) return;

    let cancelled = false;

    async function startCamera() {
      setError('');
      setCameraReady(false);
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: 'user',
            width: { ideal: 1280 },
            height: { ideal: 720 },
          },
          audio: false,
        });

        if (cancelled) {
          stream.getTracks().forEach((track) => track.stop());
          return;
        }

        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play();
        }
        setCameraReady(true);
      } catch {
        setError('Não foi possível acessar a câmera. Verifique a permissão do navegador.');
        setCameraOpen(false);
      }
    }

    startCamera();

    return () => {
      cancelled = true;
      stopCamera();
    };
  }, [cameraOpen]);

  useEffect(() => () => stopCamera(), []);

  function stopCamera() {
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
    if (videoRef.current) videoRef.current.srcObject = null;
    setCameraReady(false);
  }

  function openCamera() {
    setError('');
    if (signerName.trim().length < 2 || signerDocument.replace(/\D/g, '').length < 5) {
      setError('Informe nome completo e CPF/documento antes de capturar a foto.');
      return;
    }
    setCameraOpen(true);
  }

  function closeCamera() {
    setCameraOpen(false);
    stopCamera();
  }

  async function submitFacialSignature(faceImageBase64: string) {
    setSubmitting(true);

    try {
      const { data } = await api.post('/signatures/facial', {
        documentId,
        signerName,
        signerDocument,
        faceImageBase64,
      });
      const payload = data.data ?? data;
      setResult(payload);
      onComplete(payload);
    } catch (err: any) {
      setError(err.response?.data?.error?.message ?? 'Não foi possível validar a assinatura facial.');
    } finally {
      setSubmitting(false);
    }
  }

  async function capturePhoto() {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas || !cameraReady) return;

    setError('');

    try {
      const width = video.videoWidth || 1280;
      const height = video.videoHeight || 720;
      canvas.width = width;
      canvas.height = height;

      const context = canvas.getContext('2d');
      if (!context) throw new Error('Canvas unavailable');

      context.drawImage(video, 0, 0, width, height);
      const faceImageBase64 = canvas.toDataURL('image/png');
      setCapturedImage(faceImageBase64);
      closeCamera();
      await submitFacialSignature(faceImageBase64);
    } catch (err: any) {
      setError(err.response?.data?.error?.message ?? 'Não foi possível validar a assinatura facial.');
    }
  }

  const canOpenCamera = signerName.trim().length >= 2 && signerDocument.replace(/\D/g, '').length >= 5;

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-5">
      <div>
        <h3 className="text-lg font-semibold text-gray-950">Assinatura facial</h3>
        <p className="mt-1 text-sm leading-6 text-gray-500">
          Posicione seu rosto dentro da área indicada. A imagem será usada para gerar hash e chave da transação.
        </p>
      </div>

      <div className="mt-5 space-y-3">
        <div>
          <label className="mb-1 block text-xs font-medium text-gray-500">Nome completo</label>
          <input
            type="text"
            value={signerName}
            onChange={(event) => setSignerName(event.target.value)}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
          />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-gray-500">CPF ou documento</label>
          <input
            type="text"
            value={signerDocument}
            onChange={(event) => setSignerDocument(event.target.value)}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
          />
        </div>
      </div>

      <button
        type="button"
        onClick={openCamera}
        disabled={!canOpenCamera || submitting}
        className="mt-5 w-full rounded-lg border border-blue-200 bg-blue-50 px-4 py-3 text-sm font-semibold text-blue-700 transition hover:border-blue-300 hover:bg-blue-100 disabled:cursor-not-allowed disabled:opacity-50"
      >
        Abrir Câmera para Captura
      </button>

      <canvas ref={canvasRef} className="hidden" aria-hidden />

      {capturedImage && (
        <div className="mt-4 rounded-lg border border-gray-200 bg-gray-50 p-3">
          <p className="mb-2 text-xs font-medium text-gray-500">Foto capturada</p>
          <img
            src={capturedImage}
            alt="Foto facial capturada"
            className="h-28 w-full rounded-md bg-white object-cover"
          />
        </div>
      )}

      {result && (
        <div className="mt-4 rounded-lg border border-green-200 bg-green-50 p-3">
          <p className="text-sm font-semibold text-green-800">Validação concluída</p>
          <p className="mt-1 break-all text-xs text-green-700">
            UUID: {result.signatureId}
          </p>
        </div>
      )}

      {error && <p className="mt-4 text-sm text-red-600">{error}</p>}

      {submitting && (
        <p className="mt-4 text-sm font-medium text-gray-500">Validando assinatura facial...</p>
      )}

      {cameraOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-950/70 px-4">
          <div className="w-full max-w-3xl rounded-2xl bg-white p-5 shadow-2xl">
            <div className="mb-4">
              <h4 className="text-lg font-semibold text-gray-950">Captura facial</h4>
              <p className="mt-1 text-sm text-gray-500">
                Centralize seu rosto dentro da máscara antes de capturar.
              </p>
            </div>

            <div className="mx-auto overflow-hidden rounded-xl border border-gray-200 bg-gray-950" style={{ maxWidth: 640 }}>
              <div className="relative aspect-[4/3]">
                <video
                  ref={videoRef}
                  autoPlay
                  muted
                  playsInline
                  className="h-full w-full object-cover"
                />
                <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
                  <div className="h-80 w-64 rounded-[50%] border-4 border-blue-300 shadow-[0_0_0_9999px_rgba(0,0,0,0.35)]" />
                </div>
                {!cameraReady && (
                  <div className="absolute inset-0 flex items-center justify-center bg-gray-950 text-sm text-gray-300">
                    Aguardando câmera...
                  </div>
                )}
              </div>
            </div>

            <div className="mt-5 flex justify-end gap-3">
              <button
                type="button"
                onClick={closeCamera}
                className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-semibold text-gray-700 transition hover:bg-gray-50"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={capturePhoto}
                disabled={!cameraReady || submitting}
                className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Capturar Foto
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
