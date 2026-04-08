import React, { useState, useEffect } from 'react';
import { Key, Plus, Trash2, Copy, Check, X, BookOpen, Terminal, Code2 } from 'lucide-react';
import apiKeyService from '../services/apiKeys';
import toast from 'react-hot-toast';
import ConfirmModal from '../components/ConfirmModal';
import '../styles/DashboardNew.css';

const BASE_URL = import.meta.env.VITE_API_URL?.replace(/\/api\/v1|\/api/g, '') || window.location.origin;

// ── Code examples for each language ──────────────────────────────────────────
const getExamples = (apiKey) => ({
    curl: `curl -X POST ${BASE_URL}/api/v1/messages \\
  -H "Authorization: Bearer ${apiKey}" \\
  -H "Content-Type: application/json" \\
  -d '{
    "from": "Your App <hello@yourdomain.com>",
    "to": "recipient@example.com",
    "subject": "Hello from Sendora!",
    "html": "<h1>Hello!</h1><p>This email was sent via Sendora API.</p>"
  }'`,

    node: `const axios = require('axios'); // npm install axios

const response = await axios.post(
  '${BASE_URL}/api/v1/messages',
  {
    from: 'Your App <hello@yourdomain.com>',
    to: 'recipient@example.com',
    subject: 'Hello from Sendora!',
    html: '<h1>Hello!</h1><p>This email was sent via Sendora API.</p>'
  },
  {
    headers: {
      Authorization: 'Bearer ${apiKey}',
      'Content-Type': 'application/json'
    }
  }
);

console.log(response.data);
// { success: true, message: "1 of 1 email(s) queued", id: "..." }`,

    python: `import requests  # pip install requests

response = requests.post(
    '${BASE_URL}/api/v1/messages',
    json={
        'from': 'Your App <hello@yourdomain.com>',
        'to': 'recipient@example.com',
        'subject': 'Hello from Sendora!',
        'html': '<h1>Hello!</h1><p>This email was sent via Sendora API.</p>',
    },
    headers={
        'Authorization': 'Bearer ${apiKey}',
        'Content-Type': 'application/json',
    }
)

data = response.json()
print(data)
# {'success': True, 'message': '1 of 1 email(s) queued', 'id': '...'}`,

    php: `<?php
$ch = curl_init('${BASE_URL}/api/v1/messages');

curl_setopt_array($ch, [
    CURLOPT_RETURNTRANSFER => true,
    CURLOPT_POST           => true,
    CURLOPT_HTTPHEADER     => [
        'Authorization: Bearer ${apiKey}',
        'Content-Type: application/json',
    ],
    CURLOPT_POSTFIELDS => json_encode([
        'from'    => 'Your App <hello@yourdomain.com>',
        'to'      => 'recipient@example.com',
        'subject' => 'Hello from Sendora!',
        'html'    => '<h1>Hello!</h1><p>This email was sent via Sendora API.</p>',
    ]),
]);

$response = json_decode(curl_exec($ch), true);
curl_close($ch);

var_dump($response);
// ['success' => true, 'message' => '1 of 1 email(s) queued', ...]`,

    csharp: `using System.Net.Http;
using System.Net.Http.Headers;
using System.Text;
using System.Text.Json;

// Works with .NET 6+ (HttpClient)
var client = new HttpClient();
client.DefaultRequestHeaders.Authorization =
    new AuthenticationHeaderValue("Bearer", "${apiKey}");

var payload = new {
    from    = "Your App <hello@yourdomain.com>",
    to      = "recipient@example.com",
    subject = "Hello from Sendora!",
    html    = "<h1>Hello!</h1><p>This email was sent via Sendora API.</p>"
};

var json    = JsonSerializer.Serialize(payload);
var content = new StringContent(json, Encoding.UTF8, "application/json");

var response = await client.PostAsync("${BASE_URL}/api/v1/messages", content);
var body     = await response.Content.ReadAsStringAsync();

Console.WriteLine(body);
// {"success":true,"message":"1 of 1 email(s) queued","id":"..."}`,

    go: `package main

import (
    "bytes"
    "encoding/json"
    "fmt"
    "net/http"
)

func main() {
    body, _ := json.Marshal(map[string]string{
        "from":    "Your App <hello@yourdomain.com>",
        "to":      "recipient@example.com",
        "subject": "Hello from Sendora!",
        "html":    "<h1>Hello!</h1><p>Sent via Sendora API.</p>",
    })

    req, _ := http.NewRequest("POST", "${BASE_URL}/api/v1/messages", bytes.NewBuffer(body))
    req.Header.Set("Authorization", "Bearer ${apiKey}")
    req.Header.Set("Content-Type", "application/json")

    client := &http.Client{}
    resp, _ := client.Do(req)
    defer resp.Body.Close()

    fmt.Println("Status:", resp.Status)
}`,
});


// ── Docs Tab Component ─────────────────────────────────────────────────────
const DocsTab = ({ apiKeys }) => {
    const [lang, setLang] = useState('curl');
    const [copied, setCopied] = useState(false);

    const activeKey = apiKeys.find(k => k.status === 'active')?.key || 'YOUR_API_KEY';
    const examples = getExamples(activeKey);
    const code = examples[lang];

    const copyCode = () => {
        navigator.clipboard.writeText(code);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
        toast.success('Code copied!');
    };

    const langs = [
        { id: 'curl', label: 'cURL' },
        { id: 'node', label: 'Node.js' },
        { id: 'python', label: 'Python' },
        { id: 'php', label: 'PHP' },
        { id: 'csharp', label: 'C# (.NET)' },
        { id: 'go', label: 'Go' },
    ];

    const field = (name, type, required, desc) => (
        <tr key={name}>
            <td style={{ padding: '0.6rem 0.75rem', fontFamily: 'monospace', fontSize: '0.78rem', color: '#0f172a', fontWeight: 600 }}>{name}</td>
            <td style={{ padding: '0.6rem 0.75rem', fontSize: '0.75rem', color: '#64748b' }}>{type}</td>
            <td style={{ padding: '0.6rem 0.75rem' }}>
                <span style={{ fontSize: '0.68rem', padding: '0.15rem 0.5rem', borderRadius: 99, background: required ? '#fff1f2' : '#f0fdf4', color: required ? '#e11d48' : '#16a34a', fontWeight: 600 }}>
                    {required ? 'required' : 'optional'}
                </span>
            </td>
            <td style={{ padding: '0.6rem 0.75rem', fontSize: '0.78rem', color: '#64748b' }}>{desc}</td>
        </tr>
    );

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>

            {/* Endpoint */}
            <div className="d-card">
                <p className="d-card-title" style={{ marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <Terminal size={16} /> Send Email — API Reference
                </p>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem', flexWrap: 'wrap' }}>
                    <span style={{ background: '#dcfce7', color: '#15803d', fontWeight: 700, fontSize: '0.8rem', padding: '0.25rem 0.65rem', borderRadius: 6 }}>POST</span>
                    <code style={{ fontSize: '0.85rem', color: '#0f172a', background: '#f1f5f9', padding: '0.35rem 0.75rem', borderRadius: 8, fontFamily: 'monospace' }}>
                        {BASE_URL}/api/v1/messages
                    </code>
                </div>
                <div style={{ fontSize: '0.85rem', color: '#64748b', lineHeight: 1.7 }}>
                    Authenticate with <code style={{ background: '#f1f5f9', padding: '0.1rem 0.4rem', borderRadius: 4, fontSize: '0.82rem' }}>Authorization: Bearer sk_live_xxx</code> header.<br />
                    Alternatively use HTTP Basic Auth: username = <code style={{ background: '#f1f5f9', padding: '0.1rem 0.4rem', borderRadius: 4, fontSize: '0.82rem' }}>api</code>, password = your key.
                </div>
            </div>

            {/* Request fields */}
            <div className="d-card">
                <p className="d-card-title" style={{ marginBottom: '1rem' }}>Request Body (JSON)</p>
                <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.82rem' }}>
                        <thead>
                            <tr style={{ background: '#f8fafc' }}>
                                {['Field', 'Type', 'Required', 'Description'].map(h => (
                                    <th key={h} style={{ padding: '0.5rem 0.75rem', textAlign: 'left', fontSize: '0.72rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{h}</th>
                                ))}
                            </tr>
                        </thead>
                        <tbody style={{ borderTop: '1px solid #e2e8f0' }}>
                            {field('from', 'string', false, 'Sender address. e.g. "Acme <hello@yourdomain.com>". Falls back to your verified domain.')}
                            {field('to', 'string | array', true, 'Recipient(s). A single address or array/comma-separated list.')}
                            {field('subject', 'string', true, 'Email subject line.')}
                            {field('html', 'string', false, 'HTML body. Required if "text" is not provided.')}
                            {field('text', 'string', false, 'Plain text body. Required if "html" is not provided.')}
                            {field('reply_to', 'string', false, 'Reply-To email address.')}
                        </tbody>
                    </table>
                    <p style={{ fontSize: '0.7rem', color: '#94a3b8', marginTop: '0.5rem', paddingLeft: '0.75rem' }}>* Either "html" or "text" is required.</p>
                </div>
            </div>

            {/* Response */}
            <div className="d-card">
                <p className="d-card-title" style={{ marginBottom: '0.75rem' }}>Response</p>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                    <div>
                        <p style={{ fontSize: '0.75rem', fontWeight: 700, color: '#15803d', marginBottom: '0.4rem' }}>✅ 200 Success</p>
                        <pre style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 8, padding: '0.75rem', fontSize: '0.73rem', color: '#166534', overflow: 'auto', margin: 0 }}>{`{
  "success": true,
  "message": "1 of 1 email(s) queued",
  "id": "010201947..."
}`}</pre>
                    </div>
                    <div>
                        <p style={{ fontSize: '0.75rem', fontWeight: 700, color: '#dc2626', marginBottom: '0.4rem' }}>❌ Error</p>
                        <pre style={{ background: '#fff1f2', border: '1px solid #fecaca', borderRadius: 8, padding: '0.75rem', fontSize: '0.73rem', color: '#991b1b', overflow: 'auto', margin: 0 }}>{`{
  "success": false,
  "error": "\"to\" is required"
}`}</pre>
                    </div>
                </div>
            </div>

            {/* Code examples */}
            <div className="d-card">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem', flexWrap: 'wrap', gap: '0.5rem' }}>
                    <p className="d-card-title" style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <Code2 size={16} /> Code Examples
                    </p>
                    <div style={{ display: 'flex', gap: '0.3rem', flexWrap: 'wrap' }}>
                        {langs.map(l => (
                            <button
                                key={l.id}
                                onClick={() => setLang(l.id)}
                                style={{
                                    padding: '0.3rem 0.75rem', borderRadius: 8, border: 'none', cursor: 'pointer',
                                    fontSize: '0.8rem', fontWeight: 600, transition: 'all 0.15s',
                                    background: lang === l.id ? '#0f172a' : '#f1f5f9',
                                    color: lang === l.id ? '#fff' : '#64748b'
                                }}
                            >{l.label}</button>
                        ))}
                    </div>
                </div>
                <div style={{ position: 'relative' }}>
                    <button
                        onClick={copyCode}
                        style={{ position: 'absolute', top: '0.6rem', right: '0.6rem', zIndex: 2, background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.15)', borderRadius: 6, cursor: 'pointer', padding: '0.3rem 0.65rem', display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.72rem', color: '#94a3b8' }}
                    >
                        {copied ? <Check size={13} color="#10b981" /> : <Copy size={13} />}
                        {copied ? 'Copied!' : 'Copy'}
                    </button>
                    <pre style={{ background: '#0f172a', color: '#e2e8f0', borderRadius: 12, padding: '1.25rem', fontSize: '0.78rem', overflowX: 'auto', lineHeight: 1.7, margin: 0, whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
                        {code}
                    </pre>
                </div>
                {activeKey === 'YOUR_API_KEY' && (
                    <div style={{ marginTop: '0.65rem', fontSize: '0.72rem', color: '#f97316', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                        ⚠️ Generate an API key above to see your real key in the examples.
                    </div>
                )}
            </div>

            {/* Rate limits */}
            <div className="d-card">
                <p className="d-card-title" style={{ marginBottom: '0.75rem' }}>Rate Limits & Quotas</p>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '0.75rem', fontSize: '0.82rem' }}>
                    {[
                        { plan: 'Free', limit: '1,000 / mo' },
                        { plan: 'Starter', limit: '10,000 / mo' },
                        { plan: 'Pro', limit: '100,000 / mo' },
                        { plan: 'Enterprise', limit: 'Unlimited' },
                    ].map(p => (
                        <div key={p.plan} style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 10, padding: '0.75rem 1rem' }}>
                            <div style={{ fontWeight: 700, color: '#0f172a', marginBottom: '0.15rem' }}>{p.plan}</div>
                            <div style={{ color: '#64748b' }}>{p.limit}</div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

// ── Main Component ─────────────────────────────────────────────────────────
const ApiKeys = () => {
    const [apiKeys, setApiKeys] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [newKeyName, setNewKeyName] = useState('');
    const [copiedId, setCopiedId] = useState(null);
    const [tab, setTab] = useState('keys'); // 'keys' | 'docs'

    const [revokeTarget, setRevokeTarget] = useState(null);
    const [revoking, setRevoking] = useState(false);

    useEffect(() => { fetchKeys(); }, []);

    const fetchKeys = async () => {
        try {
            const data = await apiKeyService.getApiKeys();
            setApiKeys(Array.isArray(data) ? data : []);
        } catch {
            toast.error('Failed to load API keys.');
        } finally {
            setLoading(false);
        }
    };

    const handleGenerate = async (e) => {
        e.preventDefault();
        if (!newKeyName.trim()) return;
        try {
            const newKey = await apiKeyService.createApiKey(newKeyName.trim());
            setApiKeys([newKey, ...apiKeys]);
            setNewKeyName('');
            setShowModal(false);
            toast.success('API key generated!');
        } catch {
            toast.error('Failed to generate key.');
        }
    };

    const confirmRevoke = async () => {
        if (!revokeTarget) return;
        setRevoking(true);
        try {
            await apiKeyService.revokeApiKey(revokeTarget.id);
            setApiKeys(apiKeys.filter(k => k._id !== revokeTarget.id));
            toast.success(`"${revokeTarget.name}" key revoked.`);
        } catch {
            toast.error('Failed to revoke key.');
        } finally {
            setRevoking(false);
            setRevokeTarget(null);
        }
    };

    const handleCopy = (id, key) => {
        navigator.clipboard.writeText(key);
        setCopiedId(id);
        setTimeout(() => setCopiedId(null), 2000);
        toast.success('Copied to clipboard!');
    };

    return (
        <>
            <ConfirmModal
                open={!!revokeTarget}
                title="Revoke API Key"
                message={`Are you sure you want to revoke "${revokeTarget?.name}"? Any app using this key will lose access immediately.`}
                confirmLabel="Revoke Key"
                danger={true}
                loading={revoking}
                onConfirm={confirmRevoke}
                onCancel={() => setRevokeTarget(null)}
            />

            {/* Header */}
            <div className="d-page-header">
                <div>
                    <h1>API Keys</h1>
                    <p>Manage access tokens for the Sendora API</p>
                </div>
                <button className="d-btn d-btn-primary" onClick={() => setShowModal(true)}>
                    <Plus size={16} /> Generate New Key
                </button>
            </div>

            {/* Tabs */}
            <div className="d-filter-tabs" style={{ marginBottom: '1.25rem' }}>
                <button className={`d-filter-tab${tab === 'keys' ? ' active' : ''}`} onClick={() => setTab('keys')}>
                    <Key size={14} /> My Keys
                </button>
                <button className={`d-filter-tab${tab === 'docs' ? ' active' : ''}`} onClick={() => setTab('docs')}>
                    <BookOpen size={14} /> Documentation
                </button>
            </div>

            {tab === 'docs' ? (
                <DocsTab apiKeys={apiKeys} />
            ) : (
                <>
                    {/* Info banner */}
                    <div className="d-card" style={{ marginBottom: '1rem', background: '#fff7ed', border: '1px solid #fed7aa', display: 'flex', gap: '1rem', alignItems: 'flex-start' }}>
                        <Key size={18} style={{ color: '#f97316', marginTop: 2, flexShrink: 0 }} />
                        <div>
                            <p style={{ fontWeight: 700, color: '#c2410c', marginBottom: '0.25rem', fontSize: '0.875rem' }}>Keep your API keys secret</p>
                            <p style={{ fontSize: '0.82rem', color: '#92400e', margin: 0 }}>
                                Never expose API keys in client-side code or public repos. Use environment variables on your server instead.
                            </p>
                        </div>
                    </div>

                    {loading ? (
                        <div className="d-empty"><p>Loading keys…</p></div>
                    ) : apiKeys.length === 0 ? (
                        <div className="d-card">
                            <div className="d-empty" style={{ padding: '3rem' }}>
                                <div className="d-empty-icon"><Key size={22} /></div>
                                <h3>No API keys yet</h3>
                                <p>Generate your first key to start sending emails programmatically.</p>
                                <button className="d-btn d-btn-primary" onClick={() => setShowModal(true)}>
                                    <Plus size={16} /> Generate Key
                                </button>
                            </div>
                        </div>
                    ) : (
                        <div className="d-table-wrap">
                            <table className="d-table">
                                <thead>
                                    <tr>
                                        <th>Name</th>
                                        <th>Key</th>
                                        <th>Last Used</th>
                                        <th>Created</th>
                                        <th>Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {apiKeys.map(k => (
                                        <tr key={k._id}>
                                            <td style={{ fontWeight: 600 }}>{k.name}</td>
                                            <td>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                                    <code style={{ fontSize: '0.78rem', background: '#f1f5f9', padding: '0.25rem 0.5rem', borderRadius: 6, color: '#334155', letterSpacing: '0.5px' }}>
                                                        {k.key ? `${k.key.slice(0, 12)}••••••••••••` : 'sk-••••••••••••'}
                                                    </code>
                                                    <button
                                                        className="d-btn d-btn-ghost d-btn-sm"
                                                        style={{ padding: '0.3rem', borderRadius: '8px' }}
                                                        onClick={() => handleCopy(k._id, k.key)}
                                                        title="Copy"
                                                    >
                                                        {copiedId === k._id ? <Check size={14} style={{ color: '#10b981' }} /> : <Copy size={14} />}
                                                    </button>
                                                </div>
                                            </td>
                                            <td style={{ color: '#64748b', fontSize: '0.82rem' }}>
                                                {k.lastUsed ? new Date(k.lastUsed).toLocaleDateString() : '—'}
                                            </td>
                                            <td style={{ color: '#64748b', fontSize: '0.82rem' }}>
                                                {new Date(k.createdAt).toLocaleDateString()}
                                            </td>
                                            <td>
                                                <button
                                                    className="d-btn d-btn-danger d-btn-sm"
                                                    onClick={() => setRevokeTarget({ id: k._id, name: k.name })}
                                                    style={{ gap: '0.35rem' }}
                                                >
                                                    <Trash2 size={14} /> Revoke
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </>
            )}

            {/* Generate Key Modal */}
            {showModal && (
                <div className="d-modal-overlay" onClick={() => setShowModal(false)}>
                    <div className="d-modal" onClick={e => e.stopPropagation()}>
                        <div className="d-modal-header">
                            <h2>Generate New API Key</h2>
                            <button className="d-modal-close" onClick={() => setShowModal(false)}><X size={16} /></button>
                        </div>
                        <form onSubmit={handleGenerate} className="d-form">
                            <div className="d-field">
                                <label className="d-label">Key Name <span className="req">*</span></label>
                                <input
                                    className="d-input"
                                    type="text"
                                    placeholder="e.g. Marketing App, Testing"
                                    value={newKeyName}
                                    onChange={e => setNewKeyName(e.target.value)}
                                    autoFocus
                                    required
                                />
                            </div>
                            <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
                                <button type="button" className="d-btn d-btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
                                <button type="submit" className="d-btn d-btn-primary"><Key size={15} /> Generate</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </>
    );
};

export default ApiKeys;
