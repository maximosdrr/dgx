'use client';
import { STARTER_TEMPLATES, StarterTemplate } from '@/lib/starterTemplates';

interface Props {
  onSelect: (tpl: StarterTemplate | null) => void;
}

export default function StarterTemplateModal({ onSelect }: Props) {
  return (
    <div
      style={{
        position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 200,
        display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px',
      }}
    >
      <div style={{
        background: '#fff', borderRadius: '16px', width: '100%', maxWidth: '760px',
        maxHeight: '90vh', display: 'flex', flexDirection: 'column', overflow: 'hidden',
        boxShadow: '0 24px 80px rgba(0,0,0,0.25)',
      }}>
        <div style={{ padding: '24px 28px', borderBottom: '1px solid #e5e7eb' }}>
          <h2 style={{ fontSize: '20px', fontWeight: 700, margin: '0 0 4px' }}>Escolher modelo</h2>
          <p style={{ fontSize: '13px', color: '#6b7280', margin: 0 }}>Comece com um modelo pronto ou do zero</p>
        </div>

        <div style={{ overflowY: 'auto', padding: '20px 28px 28px', display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '14px' }}>
          {/* Blank option */}
          <button
            onClick={() => onSelect(null)}
            style={{
              padding: '20px', border: '2px dashed #d1d5db', borderRadius: '12px',
              background: '#f9fafb', cursor: 'pointer', textAlign: 'left',
              display: 'flex', flexDirection: 'column', gap: '8px',
              transition: 'border-color 0.15s, background 0.15s',
            }}
            onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.borderColor = '#3b82f6'; (e.currentTarget as HTMLButtonElement).style.background = '#eff6ff'; }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.borderColor = '#d1d5db'; (e.currentTarget as HTMLButtonElement).style.background = '#f9fafb'; }}
          >
            <span style={{ fontSize: '28px' }}>📄</span>
            <span style={{ fontWeight: 700, fontSize: '14px', color: '#111' }}>Começar do zero</span>
            <span style={{ fontSize: '12px', color: '#6b7280', lineHeight: 1.4 }}>Documento em branco com um bloco de cláusula</span>
          </button>

          {STARTER_TEMPLATES.map((tpl) => (
            <button
              key={tpl.id}
              onClick={() => onSelect(tpl)}
              style={{
                padding: '20px', border: '2px solid #e5e7eb', borderRadius: '12px',
                background: '#fff', cursor: 'pointer', textAlign: 'left',
                display: 'flex', flexDirection: 'column', gap: '8px',
                transition: 'border-color 0.15s, background 0.15s',
              }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.borderColor = '#3b82f6'; (e.currentTarget as HTMLButtonElement).style.background = '#eff6ff'; }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.borderColor = '#e5e7eb'; (e.currentTarget as HTMLButtonElement).style.background = '#fff'; }}
            >
              <span style={{ fontSize: '28px' }}>{tpl.icon}</span>
              <span style={{ fontWeight: 700, fontSize: '13px', color: '#111' }}>{tpl.name}</span>
              <span style={{ fontSize: '11px', color: '#6b7280', lineHeight: 1.4 }}>{tpl.description}</span>
              <span style={{
                display: 'inline-block', padding: '2px 8px', borderRadius: '99px',
                background: '#f3f4f6', fontSize: '10px', fontWeight: 600, color: '#6b7280', alignSelf: 'flex-start',
              }}>{tpl.category}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
