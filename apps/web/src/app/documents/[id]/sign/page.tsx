'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { Navbar } from '@/components/layout/Navbar';
import { FacialSignatureCapture } from '@/components/signature/FacialSignatureCapture';
import { WrittenSignaturePad } from '@/components/signature/WrittenSignaturePad';
import { api } from '@/lib/api';

type SignatureStep = 'choose' | 'written' | 'facial';

interface DocumentDetail {
  id: string;
  status: 'PENDING' | 'PROCESSING' | 'DONE' | 'FAILED';
  signatureStatus?: 'PENDING' | 'SIGNED';
  signatureType?: 'WRITTEN' | 'FACIAL';
  signedAt?: string;
  presignedUrl?: string;
  expiresAt?: string;
  createdAt: string;
  template?: { name: string };
}

interface SignatureCompletionResult {
  signatureId: string;
  documentId: string;
  signedAt: string;
  signatureType: 'WRITTEN' | 'FACIAL';
  signatureStatus: 'SIGNED';
  presignedUrl: string;
  expiresAt: string;
}

function SignatureOption({
  title,
  description,
  mark,
  onClick,
}: {
  title: string;
  description: string;
  mark: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="w-full rounded-xl border border-gray-200 bg-white p-5 text-left transition hover:border-blue-300 hover:bg-blue-50"
    >
      <div className="flex items-start gap-4">
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-blue-100 text-sm font-bold text-blue-700">
          {mark}
        </span>
        <div>
          <p className="font-semibold text-gray-950">{title}</p>
          <p className="mt-1 text-sm leading-5 text-gray-500">{description}</p>
        </div>
      </div>
    </button>
  );
}

export default function SignDocumentPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const [doc, setDoc] = useState<DocumentDetail | null>(null);
  const [step, setStep] = useState<SignatureStep>('choose');
  const [writtenSignerName, setWrittenSignerName] = useState('');
  const [writtenSignature, setWrittenSignature] = useState<string | null>(null);
  const [facialSignatureId, setFacialSignatureId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [signing, setSigning] = useState(false);
  const [signatureError, setSignatureError] = useState('');

  useEffect(() => {
    if (!params.id) return;

    api.get(`/documents/${params.id}`)
      .then(({ data }) => setDoc(data.data ?? data))
      .catch(() => {
        setError('Não foi possível carregar o documento.');
        router.push('/documents');
      })
      .finally(() => setLoading(false));
  }, [params.id, router]);

  function applySignatureResult(result: SignatureCompletionResult) {
    setDoc((current) => current
      ? {
        ...current,
        signatureStatus: result.signatureStatus,
        signatureType: result.signatureType,
        signedAt: result.signedAt,
        presignedUrl: result.presignedUrl,
        expiresAt: result.expiresAt,
      }
      : current);
    router.replace(`/documents/${result.documentId}/sign?signed=${result.signatureType.toLowerCase()}`);
  }

  async function submitWrittenSignature(signatureImageBase64: string) {
    if (!doc) return;
    setSignatureError('');
    if (writtenSignerName.trim().length < 2) {
      setSignatureError('Informe o nome de quem está assinando.');
      return;
    }

    setSigning(true);
    try {
      const { data } = await api.post('/signatures/written', {
        documentId: doc.id,
        signerName: writtenSignerName,
        signatureImageBase64,
      });
      const result = data.data ?? data;
      setWrittenSignature(signatureImageBase64);
      applySignatureResult(result);
    } catch (err: any) {
      setSignatureError(err.response?.data?.error?.message ?? 'Não foi possível concluir a assinatura escrita.');
    } finally {
      setSigning(false);
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar authenticated />

      <main className="mx-auto max-w-7xl px-6 py-8">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <Link href="/documents" className="text-sm font-medium text-gray-500 hover:text-gray-900">
              Voltar para documentos
            </Link>
            <h1 className="mt-2 text-2xl font-semibold text-gray-950">
              Assinar documento
            </h1>
            <p className="mt-1 text-sm text-gray-500">
              {doc?.template?.name ?? 'Documento gerado'}
            </p>
            {doc?.signatureStatus === 'SIGNED' && (
              <p className="mt-2 inline-flex rounded-full bg-green-50 px-3 py-1 text-xs font-semibold text-green-700">
                Documento assinado
              </p>
            )}
          </div>
        </div>

        {loading && <p className="text-gray-500">Carregando documento...</p>}
        {error && <p className="text-sm text-red-600">{error}</p>}

        {!loading && doc && (
          <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_380px]">
            <section className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
              <div className="mb-3 flex items-center justify-between">
                <h2 className="font-semibold text-gray-950">Prévia do documento</h2>
                {doc.presignedUrl && (
                  <a
                    href={doc.presignedUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm font-medium text-blue-600 hover:text-blue-700"
                  >
                    Abrir em nova aba
                  </a>
                )}
              </div>

              {doc.presignedUrl ? (
                <iframe
                  title="Prévia do documento para assinatura"
                  src={doc.presignedUrl}
                  className="h-[calc(100vh-14rem)] min-h-[560px] w-full rounded-lg border border-gray-100 bg-gray-100"
                />
              ) : (
                <div className="flex h-[560px] items-center justify-center rounded-lg border border-dashed border-gray-200 bg-gray-50 text-sm text-gray-500">
                  Prévia indisponível para este documento.
                </div>
              )}
            </section>

            <aside className="rounded-xl border border-gray-200 bg-gray-50 p-5 shadow-sm">
              {step === 'choose' ? (
                <div>
                  <p className="text-xs font-bold uppercase tracking-wide text-blue-600">
                    Escolha o método
                  </p>
                  <h2 className="mt-2 text-xl font-semibold text-gray-950">
                    Como deseja assinar?
                  </h2>
                  <p className="mt-2 text-sm leading-6 text-gray-500">
                    Confira o documento ao lado antes de iniciar o fluxo de assinatura.
                  </p>

                  <div className="mt-6 space-y-3">
                    <SignatureOption
                      mark="ASS"
                      title="Assinar com o mouse/touchscreen"
                      description="Desenhe sua assinatura direto na tela."
                      onClick={() => setStep('written')}
                    />
                    <SignatureOption
                      mark="ID"
                      title="Assinar via Reconhecimento Facial"
                      description="Use a câmera para validar sua identidade antes de assinar."
                      onClick={() => setStep('facial')}
                    />
                  </div>
                </div>
              ) : step === 'written' ? (
                <div className="space-y-4">
                  <button
                    type="button"
                    onClick={() => setStep('choose')}
                    className="text-sm font-medium text-gray-500 hover:text-gray-900"
                  >
                    Voltar
                  </button>
                  <div className="rounded-xl border border-gray-200 bg-white p-5">
                    <label className="mb-1 block text-xs font-medium text-gray-500">Nome completo</label>
                    <input
                      type="text"
                      value={writtenSignerName}
                      onChange={(event) => setWrittenSignerName(event.target.value)}
                      className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                    />
                    {signatureError && <p className="mt-3 text-sm text-red-600">{signatureError}</p>}
                    {signing && <p className="mt-3 text-sm text-gray-500">Finalizando assinatura...</p>}
                  </div>
                  <WrittenSignaturePad onConfirm={submitWrittenSignature} />
                  {writtenSignature && (
                    <div className="rounded-xl border border-green-200 bg-green-50 p-4">
                      <p className="text-sm font-semibold text-green-800">Assinatura capturada</p>
                      <img
                        src={writtenSignature}
                        alt="Prévia da assinatura confirmada"
                        className="mt-3 h-20 w-full rounded-lg border border-green-100 bg-white object-contain"
                      />
                    </div>
                  )}
                </div>
              ) : (
                <div className="space-y-4">
                  <button
                    type="button"
                    onClick={() => setStep('choose')}
                    className="text-sm font-medium text-gray-500 hover:text-gray-900"
                  >
                    Voltar
                  </button>
                  <FacialSignatureCapture
                    documentId={doc.id}
                    onComplete={(result) => {
                      setFacialSignatureId(result.signatureId);
                      applySignatureResult(result);
                    }}
                  />
                  {facialSignatureId && (
                    <div className="rounded-xl border border-green-200 bg-green-50 p-4">
                      <p className="text-sm font-semibold text-green-800">
                        Transação biométrica registrada
                      </p>
                      <p className="mt-1 break-all text-xs text-green-700">
                        UUID: {facialSignatureId}
                      </p>
                    </div>
                  )}
                </div>
              )}
            </aside>
          </div>
        )}
      </main>
    </div>
  );
}
