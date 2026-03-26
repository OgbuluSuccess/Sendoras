import React, { useState } from 'react';
import { CheckCircle, XCircle, AlertTriangle, Search, Upload, Download, Loader } from 'lucide-react';
import * as XLSX from 'xlsx';
import toast from 'react-hot-toast';
import api from '../services/api';
import '../styles/DashboardNew.css';

const STATUS_CONFIG = {
    valid: { icon: <CheckCircle size={20} />, color: '#10b981', label: 'Valid', bg: '#f0fdf4', borderColor: '#86efac' },
    invalid: { icon: <XCircle size={20} />, color: '#ef4444', label: 'Invalid', bg: '#fff1f2', borderColor: '#fca5a5' },
    risky: { icon: <AlertTriangle size={20} />, color: '#f59e0b', label: 'Risky', bg: '#fffbeb', borderColor: '#fde68a' },
};

const EmailValidation = () => {
    const [email, setEmail] = useState('');
    const [result, setResult] = useState(null);
    const [checking, setChecking] = useState(false);
    const [bulkResults, setBulkResults] = useState([]);
    const [bulkLoading, setBulkLoading] = useState(false);

    /* ── Single validation ── */
    const handleCheck = async (e) => {
        e.preventDefault();
        if (!email.trim()) return;
        setChecking(true);
        setResult(null);
        try {
            const { data } = await api.post('/validate/single', { email: email.trim() });
            setResult(data);
        } catch (err) {
            toast.error(err?.response?.data?.msg || 'Server error during validation.');
        } finally {
            setChecking(false);
        }
    };

    /* ── Bulk validation via file upload ── */
    const handleBulkUpload = (e) => {
        const file = e.target.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = async (evt) => {
            try {
                const wb = XLSX.read(evt.target.result, { type: 'binary' });
                const ws = wb.Sheets[wb.SheetNames[0]];
                const rows = XLSX.utils.sheet_to_json(ws, { header: 1 });
                const headers = rows[0].map(h => String(h).toLowerCase().trim());
                const idx = headers.indexOf('email');
                if (idx === -1) { toast.error('No "email" column found in file.'); return; }

                const emailList = rows.slice(1).filter(r => r[idx]).map(r => String(r[idx]).trim());
                if (emailList.length === 0) { toast.error('No email addresses found.'); return; }

                setBulkLoading(true);
                const tid = toast.loading(`Validating ${emailList.length} emails…`);
                const { data } = await api.post('/validate/bulk', { emails: emailList });
                setBulkResults(data);
                const valid = data.filter(r => r.status === 'valid').length;
                const invalid = data.filter(r => r.status === 'invalid').length;
                const risky = data.filter(r => r.status === 'risky').length;
                toast.success(`Done — ${valid} valid, ${invalid} invalid, ${risky} risky`, { id: tid });
            } catch {
                toast.error('Failed to validate emails. Please try again.');
            } finally {
                setBulkLoading(false);
                e.target.value = '';
            }
        };
        reader.readAsBinaryString(file);
    };

    /* ── Export results ── */
    const handleExport = () => {
        const ws = XLSX.utils.json_to_sheet(bulkResults.map(r => ({
            Email: r.email, Status: r.status, Reason: r.reason || ''
        })));
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, 'Validated');
        XLSX.writeFile(wb, 'validated_emails.xlsx');
        toast.success('Results exported!');
    };

    const res = result && STATUS_CONFIG[result.status];

    return (
        <>
            <div className="d-page-header">
                <div>
                    <h1>Email Validation</h1>
                    <p>Verify if an email address is real and deliverable</p>
                </div>
            </div>

            <div className="d-grid-2" style={{ marginBottom: '1.5rem', alignItems: 'start' }}>
                {/* Single check */}
                <div className="d-card">
                    <p className="d-card-title" style={{ marginBottom: '0.4rem' }}>Single Validation</p>
                    <p style={{ fontSize: '0.85rem', color: '#64748b', marginBottom: '1.25rem' }}>
                        Checks format, disposable domains, and live DNS MX records.
                    </p>

                    <form onSubmit={handleCheck} style={{ display: 'flex', gap: '0.75rem' }}>
                        <div className="d-input-icon-wrap" style={{ flex: 1 }}>
                            <Search size={16} className="d-input-icon" />
                            <input
                                className="d-input"
                                type="text"
                                placeholder="someone@example.com"
                                value={email}
                                onChange={e => setEmail(e.target.value)}
                                required
                            />
                        </div>
                        <button type="submit" className="d-btn d-btn-primary" disabled={checking}>
                            {checking ? <><Loader size={14} className="spin" /> Checking…</> : 'Check'}
                        </button>
                    </form>

                    {result && res && (
                        <div style={{
                            marginTop: '1.25rem', padding: '1rem 1.25rem', borderRadius: '12px',
                            background: res.bg, border: `1px solid ${res.borderColor}`,
                            display: 'flex', alignItems: 'flex-start', gap: '0.75rem',
                        }}>
                            <span style={{ color: res.color, marginTop: 2 }}>{res.icon}</span>
                            <div>
                                <div style={{ fontWeight: 700, color: res.color, marginBottom: '0.25rem' }}>{res.label}</div>
                                <div style={{ fontSize: '0.85rem', color: '#334155' }}>{result.email}</div>
                                <div style={{ fontSize: '0.8rem', color: '#94a3b8', marginTop: '0.3rem' }}>{result.reason}</div>
                            </div>
                        </div>
                    )}

                    {/* How it works */}
                    <div style={{ marginTop: '1.5rem', padding: '0.875rem 1rem', borderRadius: 10, background: '#f8fafc', border: '1px solid #e2e8f0', fontSize: '0.8rem', color: '#64748b' }}>
                        <strong style={{ color: '#334155' }}>How validation works:</strong>
                        <ul style={{ margin: '0.5rem 0 0 1rem', lineHeight: 1.8 }}>
                            <li>✓ RFC 5322 format check (@ symbol, valid characters)</li>
                            <li>✓ Disposable domain blocklist (Mailinator, YopMail, etc.)</li>
                            <li>✓ Role-based prefix detection (info@, support@, etc.)</li>
                            <li>✓ Live DNS MX record lookup (does the domain accept mail?)</li>
                        </ul>
                    </div>
                </div>

                {/* Bulk validation */}
                <div className="d-card">
                    <p className="d-card-title" style={{ marginBottom: '0.4rem' }}>Bulk Validation</p>
                    <p style={{ fontSize: '0.85rem', color: '#64748b', marginBottom: '1.25rem' }}>
                        Upload an Excel or CSV with an <code>email</code> column (up to 500 rows).
                    </p>

                    <div style={{ display: 'flex', gap: '0.75rem' }}>
                        <label className={`d-btn d-btn-primary${bulkLoading ? ' disabled' : ''}`} style={{ cursor: bulkLoading ? 'not-allowed' : 'pointer', flex: 1, justifyContent: 'center', opacity: bulkLoading ? 0.6 : 1 }}>
                            {bulkLoading ? <><Loader size={16} className="spin" /> Validating…</> : <><Upload size={16} /> Upload List</>}
                            <input type="file" accept=".xlsx,.csv" style={{ display: 'none' }} onChange={handleBulkUpload} disabled={bulkLoading} />
                        </label>
                        {bulkResults.length > 0 && (
                            <button className="d-btn d-btn-secondary" onClick={handleExport}>
                                <Download size={16} /> Export
                            </button>
                        )}
                    </div>

                    {bulkResults.length > 0 && (
                        <div style={{ marginTop: '1rem', display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
                            {['valid', 'invalid', 'risky'].map(s => {
                                const count = bulkResults.filter(r => r.status === s).length;
                                const rc = STATUS_CONFIG[s];
                                return (
                                    <div key={s} style={{ flex: 1, minWidth: 80, padding: '0.75rem', background: rc.bg, border: `1px solid ${rc.borderColor}`, borderRadius: 10, textAlign: 'center' }}>
                                        <div style={{ fontSize: '1.4rem', fontWeight: 900, color: rc.color }}>{count}</div>
                                        <div style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 600 }}>{rc.label}</div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            </div>

            {/* Bulk results table */}
            {bulkResults.length > 0 && (
                <div className="d-table-wrap">
                    <table className="d-table">
                        <thead>
                            <tr>
                                <th>Email</th>
                                <th>Status</th>
                                <th>Reason</th>
                            </tr>
                        </thead>
                        <tbody>
                            {bulkResults.map((r, i) => {
                                const badge = r.status === 'valid' ? 'd-badge-success' : r.status === 'invalid' ? 'd-badge-danger' : 'd-badge-warning';
                                return (
                                    <tr key={i}>
                                        <td style={{ fontWeight: 500 }}>{r.email}</td>
                                        <td><span className={`d-badge ${badge}`}>{r.status}</span></td>
                                        <td style={{ color: '#64748b', fontSize: '0.82rem' }}>{r.reason}</td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            )}
        </>
    );
};

export default EmailValidation;
