import React from 'react';
import { createPortal } from 'react-dom';
import { AlertTriangle, X } from 'lucide-react';

/**
 * Reusable Confirm Modal
 *
 * Props:
 *   open       – boolean, whether modal is visible
 *   title      – string, e.g. "Revoke API Key"
 *   message    – string or JSX, the description
 *   confirmLabel – string, label for confirm button (default "Confirm")
 *   danger     – boolean, if true the confirm button is red (default true)
 *   loading    – boolean, shows spinner on confirm button while async op is running
 *   onConfirm  – () => void
 *   onCancel   – () => void
 */
const ConfirmModal = ({
    open,
    title = 'Are you sure?',
    message = 'This action cannot be undone.',
    confirmLabel = 'Confirm',
    danger = true,
    loading = false,
    onConfirm,
    onCancel,
}) => {
    if (!open) return null;

    return createPortal(
        <div
            style={{
                position: 'fixed', inset: 0, zIndex: 10000,
                background: 'rgba(15,23,42,0.55)', backdropFilter: 'blur(4px)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                padding: '1rem',
            }}
            onClick={onCancel}
        >
            <div
                onClick={e => e.stopPropagation()}
                style={{
                    background: '#fff', borderRadius: 18,
                    boxShadow: '0 24px 64px rgba(0,0,0,0.22)',
                    padding: '2rem', maxWidth: 420, width: '100%',
                    animation: 'modal-pop 0.18s ease',
                }}
            >
                {/* Icon + Title */}
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '1rem', marginBottom: '1.25rem' }}>
                    <div style={{
                        flexShrink: 0, width: 44, height: 44, borderRadius: 12,
                        background: danger ? '#fff1f2' : '#fff7ed',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        color: danger ? '#ef4444' : '#f97316',
                    }}>
                        <AlertTriangle size={22} />
                    </div>
                    <div style={{ flex: 1 }}>
                        <h3 style={{ fontWeight: 700, fontSize: '1rem', color: '#0f172a', marginBottom: '0.35rem' }}>
                            {title}
                        </h3>
                        <p style={{ fontSize: '0.875rem', color: '#64748b', lineHeight: 1.6 }}>{message}</p>
                    </div>
                    <button
                        onClick={onCancel}
                        style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8', flexShrink: 0, padding: 2 }}
                    >
                        <X size={18} />
                    </button>
                </div>

                {/* Actions */}
                <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
                    <button
                        onClick={onCancel}
                        disabled={loading}
                        style={{
                            padding: '0.65rem 1.25rem', borderRadius: 10, border: '1px solid #e2e8f0',
                            background: '#fff', cursor: 'pointer', fontWeight: 600, fontSize: '0.875rem', color: '#334155',
                        }}
                    >
                        Cancel
                    </button>
                    <button
                        onClick={onConfirm}
                        disabled={loading}
                        style={{
                            padding: '0.65rem 1.5rem', borderRadius: 10, border: 'none',
                            background: danger ? '#ef4444' : '#f97316',
                            color: '#fff', cursor: loading ? 'not-allowed' : 'pointer',
                            fontWeight: 700, fontSize: '0.875rem',
                            opacity: loading ? 0.7 : 1,
                            display: 'flex', alignItems: 'center', gap: '0.5rem',
                        }}
                    >
                        {loading && (
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{ animation: 'spin 0.7s linear infinite' }}>
                                <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" />
                            </svg>
                        )}
                        {loading ? 'Please wait…' : confirmLabel}
                    </button>
                </div>
            </div>

            <style>{`
                @keyframes modal-pop {
                    from { opacity: 0; transform: scale(0.92) translateY(8px); }
                    to   { opacity: 1; transform: scale(1) translateY(0); }
                }
            `}</style>
        </div>,
        document.body
    );
};

export default ConfirmModal;
