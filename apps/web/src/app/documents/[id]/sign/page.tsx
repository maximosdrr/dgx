'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { Navbar } from '@/components/layout/Navbar';
import { FacialCaptureResult, FacialSignatureCapture } from '@/components/signature/FacialSignatureCapture';
import { WrittenSignaturePad } from '@/components/signature/WrittenSignaturePad';
import { api } from '@/lib/api';

type SignatureStep = 'idle' | 'pick' | 'new' | 'written' | 'facial';
type SignatureKind = 'WRITTEN' | 'FACIAL';

interface DocumentDetail {
  id: string;
  status: 'PENDING' | 'PROCESSING' | 'DONE' | 'FAILED';
  signatureStatus?: 'PENDING' | 'SIGNED';
  signatureType?: SignatureKind;
  signedAt?: string;
  presignedUrl?: string;
  expiresAt?: string;
  createdAt: string;
  variables?: Record<string, string>;
  template?: {
    name: string;
    schema?: { content?: string };
  };
  signatureData?: {
    signatures?: PersistedSignature[];
  };
}

interface PersistedSignature {
  signatureId: string;
  slotId: string;
  label: string;
  type: SignatureKind;
  signerName?: string;
  signerDocument?: string;
  signatureImageUrl?: string;
  signatureImageBase64?: string;
  signatureImageKey?: string;
  signatureImageHash?: string;
  faceImageBase64?: string;
  faceImageHash?: string;
  signatureKey?: string;
}

interface SignatureCompletionResult {
  signatureId: string;
  documentId: string;
  signedAt: string;
  signatureType: SignatureKind;
  signatureStatus: 'SIGNED';
  presignedUrl: string;
  expiresAt: string;
  signerName?: string;
}

interface SignatureSlot {
  id: string;
  label: string;
}

interface SavedSignature {
  id: string;
  kind: SignatureKind;
  label: string;
  image?: string;
  signerName?: string;
  signerDocument?: string;
  faceImageBase64?: string;
  signatureImageKey?: string;
  signatureImageHash?: string;
  faceImageHash?: string;
  signatureKey?: string;
  result?: SignatureCompletionResult;
}

interface SlotSignature {
  signatureId: string;
  kind: SignatureKind;
  label: string;
  image?: string;
  signerName?: string;
  signerDocument?: string;
  faceImageBase64?: string;
  signatureImageKey?: string;
  signatureImageHash?: string;
  faceImageHash?: string;
  signatureKey?: string;
}

const SIGNATURE_LABELS = [
  'CONTRATANTE',
  'CONTRATADO',
  'PRESTADOR',
  'LOCADOR',
  'LOCATÁRIO',
  'TESTEMUNHA',
  'RESPONSÁVEL',
  'ALUNO',
  'RECEBEDOR',
  'PAGADOR',
];

const SIGNATURE_LABEL_PATTERN = SIGNATURE_LABELS.join('|');

function SignatureOption({
  title,
  description,
  mark,
  onClick,
  disabled = false,
}: {
  title: string;
  description: string;
  mark: string;
  onClick: () => void;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="w-full rounded-xl border border-gray-200 bg-white p-5 text-left transition hover:border-blue-300 hover:bg-blue-50 disabled:cursor-not-allowed disabled:opacity-50"
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

function slotId(label: string, index: number): string {
  return `${label.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/\W+/g, '-')}-${index}`;
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function interpolateVariables(content: string, variables?: Record<string, string>): string {
  return content.replace(/\{\{([a-zA-Z0-9_]+)\}\}/g, (_match, name) => escapeHtml(variables?.[name] ?? `{{${name}}}`));
}

function renderSignatureSlot(slot: SignatureSlot, signature?: SlotSignature): string {
  const baseStyle = [
    'width:280px',
    'min-height:58px',
    'display:flex',
    'flex-direction:column',
    'align-items:center',
    'justify-content:flex-end',
    'margin:0 auto 4px',
    'text-align:center',
    'font-family:inherit',
    'font-size:12pt',
  ].join(';');

  if (signature?.kind === 'WRITTEN' && signature.image) {
    return `
      <div data-signature-slot-rendered="${slot.id}" style="${baseStyle};position:relative;">
        <button type="button" data-delete-signature="${slot.id}" aria-label="Remover assinatura" style="position:absolute;right:-24px;top:8px;width:20px;height:20px;border:1px solid #fecaca;border-radius:999px;background:#fff;color:#dc2626;font-size:12px;line-height:16px;cursor:pointer;">×</button>
        <img src="${signature.image}" alt="Assinatura de ${escapeHtml(slot.label)}" style="max-height:70px;width:100%;object-fit:contain;display:block;margin:0 auto -6px;" />
        <div style="border-top:1px solid #333;width:100%;height:1px;"></div>
      </div>
    `;
  }

  if (signature?.kind === 'FACIAL') {
    return `
      <div data-signature-slot-rendered="${slot.id}" style="${baseStyle};position:relative;">
        <button type="button" data-delete-signature="${slot.id}" aria-label="Remover assinatura" style="position:absolute;right:-24px;top:8px;width:20px;height:20px;border:1px solid #fecaca;border-radius:999px;background:#fff;color:#dc2626;font-size:12px;line-height:16px;cursor:pointer;">×</button>
        <div style="width:100%;border-bottom:1px solid #333;padding-bottom:4px;font:inherit;font-size:12pt;font-weight:400;color:#1a1a1a;">
          ${escapeHtml(signature.signerName ?? signature.label)}
        </div>
      </div>
    `;
  }

  return `
    <button
      type="button"
      data-signature-slot="${slot.id}"
      style="${baseStyle};border:1px dashed #2563eb;border-radius:6px;background:#eff6ff;color:#1d4ed8;cursor:pointer;padding:10px 12px;font-size:10pt;font-weight:700;"
    >
      Clique para assinar
    </button>
  `;
}

function renderDocumentWithSlots(
  content?: string,
  variables?: Record<string, string>,
  signatures: Record<string, SlotSignature> = {},
): { html: string; slots: SignatureSlot[] } {
  const slots: SignatureSlot[] = [];
  let slotIndex = 0;
  let html = interpolateVariables(content ?? '', variables);

  const createSlot = (label: string) => {
    const normalized = label.trim().toUpperCase();
    const slot = { id: slotId(normalized, slotIndex++), label: normalized };
    slots.push(slot);
    return slot;
  };

  // Craft.js SignatureBlock renderer: line div immediately followed by party div.
  html = html.replace(
    /<div([^>]*)style="([^"]*border-top\s*:\s*1px\s+solid[^"]*)"([^>]*)><\/div>\s*<div([^>]*)>([^<]{2,80})<\/div>/gi,
    (_match, _a, _lineStyle, _b, labelAttrs, rawLabel) => {
      const label = rawLabel.trim();
      const slot = createSlot(label);
      return `${renderSignatureSlot(slot, signatures[slot.id])}<div${labelAttrs}>${escapeHtml(label)}</div>`;
    },
  );

  // Plain text templates: underline/underscore line followed by a known party label.
  const underlinePattern = new RegExp(`(?:_{5,}|-{5,})\\s*(?:<br\\s*\\/?>|\\n|\\r\\n)?\\s*(${SIGNATURE_LABEL_PATTERN})`, 'gi');
  html = html.replace(underlinePattern, (_match, rawLabel) => {
    const slot = createSlot(rawLabel);
    return `${renderSignatureSlot(slot, signatures[slot.id])}<div style="text-align:center;font-weight:700;text-transform:uppercase;">${escapeHtml(slot.label)}</div>`;
  });

  // Horizontal rule followed by a known party label.
  const hrPattern = new RegExp(`<hr[^>]*>\\s*(${SIGNATURE_LABEL_PATTERN})`, 'gi');
  html = html.replace(hrPattern, (_match, rawLabel) => {
    const slot = createSlot(rawLabel);
    return `${renderSignatureSlot(slot, signatures[slot.id])}<div style="text-align:center;font-weight:700;text-transform:uppercase;">${escapeHtml(slot.label)}</div>`;
  });

  if (!slots.length) {
    const labels = SIGNATURE_LABELS.filter((label) => html.toUpperCase().includes(label)).slice(0, 2);
    const fallbackLabels = labels.length ? labels : ['ASSINATURA'];
    const fallbackHtml = fallbackLabels.map((label) => {
      const slot = createSlot(label);
      return `<div style="margin-top:48px;text-align:center;">${renderSignatureSlot(slot, signatures[slot.id])}<div style="font-weight:700;text-transform:uppercase;">${escapeHtml(slot.label)}</div></div>`;
    }).join('');
    html = `${html}${fallbackHtml}`;
  }

  return {
    slots,
    html: `
      <style>
        .docgen-sign-preview * { box-sizing: border-box; }
        .docgen-sign-preview h1 { font-size: 18pt; margin: 0 0 16px; }
        .docgen-sign-preview h2 { font-size: 14pt; margin: 18px 0 12px; }
        .docgen-sign-preview p { margin: 0 0 10px; }
        .docgen-sign-preview table { width: 100%; border-collapse: collapse; margin-bottom: 16px; }
        .docgen-sign-preview th, .docgen-sign-preview td { border: 1px solid #ccc; padding: 6px 10px; text-align: left; }
        .docgen-sign-preview button[data-signature-slot]:hover { background: #dbeafe !important; border-color: #1d4ed8 !important; }
      </style>
      <div class="docgen-sign-preview">${html}</div>
    `,
  };
}

function hydratePersistedSignatures(doc: DocumentDetail): {
  slots: Record<string, SlotSignature>;
  reusable: SavedSignature[];
} {
  const signatures = doc.signatureData?.signatures ?? [];
  const slots: Record<string, SlotSignature> = {};
  const reusable: SavedSignature[] = [];

  for (const signature of signatures) {
    if (!signature.slotId || !signature.type) continue;

    const image = signature.signatureImageBase64 ?? signature.signatureImageUrl;
    const slotSignature: SlotSignature = {
      signatureId: signature.signatureId,
      kind: signature.type,
      label: signature.label,
      image,
      signerName: signature.signerName,
      signerDocument: signature.signerDocument,
      faceImageBase64: signature.faceImageBase64,
      signatureImageKey: signature.signatureImageKey,
      signatureImageHash: signature.signatureImageHash,
      faceImageHash: signature.faceImageHash,
      signatureKey: signature.signatureKey,
    };

    slots[signature.slotId] = slotSignature;
    reusable.push({
      id: signature.signatureId,
      kind: signature.type,
      label: signature.label,
      image,
      signerName: signature.signerName,
      signerDocument: signature.signerDocument,
      faceImageBase64: signature.faceImageBase64,
      signatureImageKey: signature.signatureImageKey,
      signatureImageHash: signature.signatureImageHash,
      faceImageHash: signature.faceImageHash,
      signatureKey: signature.signatureKey,
    });
  }

  return { slots, reusable };
}

export default function SignDocumentPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const [doc, setDoc] = useState<DocumentDetail | null>(null);
  const [activeSlotId, setActiveSlotId] = useState<string | null>(null);
  const [step, setStep] = useState<SignatureStep>('idle');
  const [writtenSignerName, setWrittenSignerName] = useState('');
  const [savedSignatures, setSavedSignatures] = useState<SavedSignature[]>([]);
  const [slotSignatures, setSlotSignatures] = useState<Record<string, SlotSignature>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [signing, setSigning] = useState(false);
  const [savingAll, setSavingAll] = useState(false);
  const [saveMessage, setSaveMessage] = useState('');
  const [signatureError, setSignatureError] = useState('');

  useEffect(() => {
    if (!params.id) return;

    api.get(`/documents/${params.id}`)
      .then(({ data }) => {
        const loadedDoc: DocumentDetail = data.data ?? data;
        const hydrated = hydratePersistedSignatures(loadedDoc);
        setDoc(loadedDoc);
        setSlotSignatures(hydrated.slots);
        setSavedSignatures(hydrated.reusable);
      })
      .catch(() => {
        setError('Não foi possível carregar o documento.');
        router.push('/documents');
      })
      .finally(() => setLoading(false));
  }, [params.id, router]);

  const renderedDocument = useMemo(
    () => renderDocumentWithSlots(doc?.template?.schema?.content, doc?.variables, slotSignatures),
    [doc, slotSignatures],
  );
  const slots = renderedDocument.slots;
  const activeSlot = slots.find((slot) => slot.id === activeSlotId) ?? null;
  const usedMethods = new Set(savedSignatures.map((signature) => signature.kind));
  const availableNewMethods: SignatureKind[] = (['WRITTEN', 'FACIAL'] as const).filter((kind) => !usedMethods.has(kind));
  const signedSlotCount = Object.keys(slotSignatures).length;

  function openSlot(slotId: string) {
    setActiveSlotId(slotId);
    setStep(savedSignatures.length ? 'pick' : 'new');
    setSignatureError('');
  }

  function closePanel() {
    setActiveSlotId(null);
    setStep('idle');
    setSignatureError('');
  }

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

  function applySavedSignature(slotId: string, signature: SavedSignature) {
    setSlotSignatures((current) => ({
      ...current,
      [slotId]: {
        signatureId: signature.id,
        kind: signature.kind,
        label: signature.label,
        image: signature.image,
        signerName: signature.signerName,
        signerDocument: signature.signerDocument,
        faceImageBase64: signature.faceImageBase64,
        signatureImageKey: signature.signatureImageKey,
        signatureImageHash: signature.signatureImageHash,
        faceImageHash: signature.faceImageHash,
        signatureKey: signature.signatureKey,
      },
    }));
    closePanel();
  }

  function newLocalSignatureId(): string {
    return typeof crypto !== 'undefined' && 'randomUUID' in crypto
      ? crypto.randomUUID()
      : `${Date.now()}-${Math.random().toString(36).slice(2)}`;
  }

  function removeSlotSignature(slotId: string) {
    setSlotSignatures((current) => {
      const next = { ...current };
      delete next[slotId];
      return next;
    });
    if (activeSlotId === slotId) closePanel();
    setSaveMessage('');
  }

  function submitWrittenSignature(signatureImageBase64: string) {
    if (!doc || !activeSlot) return;
    setSignatureError('');
    if (writtenSignerName.trim().length < 2) {
      setSignatureError('Informe o nome de quem está assinando.');
      return;
    }

    setSigning(true);
    try {
      const saved: SavedSignature = {
        id: newLocalSignatureId(),
        kind: 'WRITTEN',
        label: 'assinatura escrita',
        image: signatureImageBase64,
        signerName: writtenSignerName,
      };
      setSavedSignatures((current) => [...current, saved]);
      setSlotSignatures((current) => ({
        ...current,
        [activeSlot.id]: {
          signatureId: saved.id,
          kind: saved.kind,
          label: saved.label,
          image: saved.image,
          signerName: saved.signerName,
        },
      }));
      closePanel();
      setSaveMessage('');
    } catch {
      setSignatureError('Não foi possível concluir a assinatura escrita.');
    } finally {
      setSigning(false);
    }
  }

  function handleFacialComplete(result: FacialCaptureResult) {
    if (!activeSlot) return;
    const saved: SavedSignature = {
      id: newLocalSignatureId(),
      kind: 'FACIAL',
      label: 'assinatura facial',
      signerName: result.signerName,
      signerDocument: result.signerDocument,
      faceImageBase64: result.faceImageBase64,
    };
    setSavedSignatures((current) => [...current, saved]);
    setSlotSignatures((current) => ({
      ...current,
      [activeSlot.id]: {
        signatureId: saved.id,
        kind: saved.kind,
        label: saved.label,
        signerName: result.signerName,
        signerDocument: result.signerDocument,
        faceImageBase64: result.faceImageBase64,
      },
    }));
    closePanel();
    setSaveMessage('');
  }

  async function saveAllSignatures() {
    if (!doc || !signedSlotCount) return;
    setSavingAll(true);
    setSignatureError('');
    setSaveMessage('');

    try {
      const signatures = Object.entries(slotSignatures).map(([slotId, signature]) => ({
        slotId,
        label: slots.find((slot) => slot.id === slotId)?.label ?? signature.label,
        type: signature.kind,
        signerName: signature.signerName ?? signature.label,
        signerDocument: signature.signerDocument,
        signatureImageBase64: signature.kind === 'WRITTEN' && signature.image?.startsWith('data:')
          ? signature.image
          : undefined,
        signatureImageKey: signature.kind === 'WRITTEN' ? signature.signatureImageKey : undefined,
        signatureImageHash: signature.kind === 'WRITTEN' ? signature.signatureImageHash : undefined,
        faceImageBase64: signature.kind === 'FACIAL' ? signature.faceImageBase64 : undefined,
        faceImageHash: signature.kind === 'FACIAL' ? signature.faceImageHash : undefined,
        signatureKey: signature.kind === 'FACIAL' ? signature.signatureKey : undefined,
      }));

      const { data } = await api.post('/signatures/batch', {
        documentId: doc.id,
        signatures,
      });
      const result: SignatureCompletionResult = data.data ?? data;
      applySignatureResult(result);
      setSaveMessage('Assinaturas salvas com sucesso.');
    } catch (err: any) {
      setSignatureError(err.response?.data?.error?.message ?? 'Não foi possível salvar as assinaturas.');
    } finally {
      setSavingAll(false);
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
            <h1 className="mt-2 text-2xl font-semibold text-gray-950">Assinar documento</h1>
            <p className="mt-1 text-sm text-gray-500">{doc?.template?.name ?? 'Documento gerado'}</p>
            {doc?.signatureStatus === 'SIGNED' && (
              <p className="mt-2 inline-flex rounded-full bg-green-50 px-3 py-1 text-xs font-semibold text-green-700">
                Documento assinado
              </p>
            )}
          </div>
          <button
            type="button"
            onClick={saveAllSignatures}
            disabled={!signedSlotCount || savingAll}
            className="rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {savingAll ? 'Salvando...' : 'Salvar Assinaturas'}
          </button>
        </div>

        {saveMessage && (
          <div className="mb-4 rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm font-semibold text-green-800">
            {saveMessage}
          </div>
        )}

        {loading && <p className="text-gray-500">Carregando documento...</p>}
        {error && <p className="text-sm text-red-600">{error}</p>}

        {!loading && doc && (
          <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_380px]">
            <section className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
              <div className="mb-3 flex items-center justify-between">
                <div>
                  <h2 className="font-semibold text-gray-950">Prévia do documento</h2>
                  <p className="text-xs text-gray-500">Clique em uma área de assinatura no documento.</p>
                </div>
                {doc.presignedUrl && (
                  <a href={doc.presignedUrl} target="_blank" rel="noopener noreferrer" className="text-sm font-medium text-blue-600 hover:text-blue-700">
                    Abrir em nova aba
                  </a>
                )}
              </div>

              <div
                className="max-h-[calc(100vh-14rem)] min-h-[560px] overflow-auto rounded-lg border border-gray-100 bg-gray-100 p-6"
                onClick={(event) => {
                  const target = event.target as HTMLElement;
                  const deleteButton = target.closest<HTMLButtonElement>('button[data-delete-signature]');
                  if (deleteButton?.dataset.deleteSignature) {
                    event.preventDefault();
                    event.stopPropagation();
                    removeSlotSignature(deleteButton.dataset.deleteSignature);
                    return;
                  }
                  const button = target.closest<HTMLButtonElement>('button[data-signature-slot]');
                  if (button?.dataset.signatureSlot) openSlot(button.dataset.signatureSlot);
                }}
              >
                <div
                  className="mx-auto min-h-[1123px] w-[794px] max-w-full bg-white px-[60px] py-[60px] text-[12pt] leading-relaxed text-gray-950 shadow-lg"
                  dangerouslySetInnerHTML={{ __html: renderedDocument.html }}
                />
              </div>
            </section>

            <aside className="rounded-xl border border-gray-200 bg-gray-50 p-5 shadow-sm">
              {!activeSlot || step === 'idle' ? (
                <div className="rounded-xl border border-dashed border-gray-300 bg-white p-5">
                  <p className="text-xs font-bold uppercase tracking-wide text-blue-600">Assinatura por slot</p>
                  <h2 className="mt-2 text-xl font-semibold text-gray-950">Selecione um campo no documento</h2>
                  <p className="mt-2 text-sm leading-6 text-gray-500">
                    O menu de assinatura aparece aqui quando você clicar em um slot interativo na prévia.
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  <button type="button" onClick={closePanel} className="text-sm font-medium text-gray-500 hover:text-gray-900">
                    Voltar
                  </button>

                  <div>
                    <p className="text-xs font-bold uppercase tracking-wide text-blue-600">Slot selecionado</p>
                    <h2 className="mt-1 text-xl font-semibold text-gray-950">{activeSlot.label}</h2>
                  </div>

                  {step === 'pick' && (
                    <div className="space-y-3">
                      {savedSignatures.map((signature) => (
                        <SignatureOption
                          key={signature.id}
                          mark={signature.kind === 'WRITTEN' ? 'ASS' : 'ID'}
                          title={`Reutilizar ${signature.label}`}
                          description="Aplica a assinatura já feita neste slot."
                          onClick={() => applySavedSignature(activeSlot.id, signature)}
                        />
                      ))}
                      <SignatureOption
                        mark="+"
                        title="Fazer nova assinatura"
                        description={availableNewMethods.length ? 'Escolha um método ainda não usado nesta sessão.' : 'Todos os métodos já foram usados nesta sessão.'}
                        disabled={!availableNewMethods.length}
                        onClick={() => setStep('new')}
                      />
                    </div>
                  )}

                  {step === 'new' && (
                    <div className="space-y-3">
                      <SignatureOption
                        mark="ASS"
                        title="Assinar com o mouse/touchscreen"
                        description="Desenhe sua assinatura direto na tela."
                        disabled={!availableNewMethods.includes('WRITTEN')}
                        onClick={() => setStep('written')}
                      />
                      <SignatureOption
                        mark="ID"
                        title="Assinar via Reconhecimento Facial"
                        description="Use a câmera para validar sua identidade."
                        disabled={!availableNewMethods.includes('FACIAL')}
                        onClick={() => setStep('facial')}
                      />
                    </div>
                  )}

                  {step === 'written' && (
                    <div className="space-y-4">
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
                    </div>
                  )}

                  {step === 'facial' && (
                    <FacialSignatureCapture onComplete={handleFacialComplete} />
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
