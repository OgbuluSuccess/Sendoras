import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Save, Send, Download } from 'lucide-react';
import toast from 'react-hot-toast';
import campaignService from '../services/campaigns';
import '../styles/DashboardNew.css';

const EditCampaign = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [campaign, setCampaign] = useState(null);
    const [formData, setFormData] = useState({
        name: '', subject: '', sender: '', content: ''
    });

    useEffect(() => {
        const fetchCampaign = async () => {
            try {
                const data = await campaignService.getCampaign(id);
                setCampaign(data);
                setFormData({
                    name: data.name || '',
                    subject: data.subject || '',
                    sender: data.sender || '',
                    content: data.content || '',
                });
            } catch {
                toast.error('Failed to load campaign.');
                navigate('/campaigns');
            } finally {
                setLoading(false);
            }
        };
        fetchCampaign();
    }, [id, navigate]);

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSave = async () => {
        if (!formData.name || !formData.subject || !formData.sender || !formData.content) {
            return toast.error('Please fill in all required fields.');
        }
        setSaving(true);
        const tid = toast.loading('Saving changes…');
        try {
            await campaignService.updateCampaign(id, formData);
            toast.success('Campaign updated!', { id: tid });
            navigate('/campaigns');
        } catch (err) {
            toast.error(err?.response?.data?.msg || 'Failed to save.', { id: tid });
        } finally {
            setSaving(false);
        }
    };

    const handleSaveAndSend = async () => {
        if (!formData.name || !formData.subject || !formData.sender || !formData.content) {
            return toast.error('Please fill in all required fields.');
        }
        setSaving(true);
        const tid = toast.loading('Saving and sending…');
        try {
            await campaignService.updateCampaign(id, formData);
            await campaignService.resendCampaign(id);
            toast.success('Campaign saved and re-queued!', { id: tid });
            navigate('/campaigns');
        } catch (err) {
            toast.error(err?.response?.data?.msg || 'Failed.', { id: tid });
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <div className="d-empty" style={{ marginTop: '4rem' }}>
                <p>Loading campaign…</p>
            </div>
        );
    }

    const isSentOrFailed = campaign?.status === 'Sent' || campaign?.status === 'Failed';

    return (
        <>
            {/* Page header */}
            <div className="d-page-header">
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <button className="d-btn d-btn-ghost d-btn-sm" onClick={() => navigate('/campaigns')}>
                        <ArrowLeft size={16} /> Back
                    </button>
                    <div>
                        <h1 style={{ margin: 0 }}>Edit Campaign</h1>
                        <p style={{ margin: 0, fontSize: '0.875rem', color: '#64748b' }}>
                            Editing: <strong>{campaign?.name}</strong>
                            {' '}<span style={{ color: '#94a3b8' }}>· {campaign?.status}</span>
                        </p>
                    </div>
                </div>
                <div style={{ display: 'flex', gap: '0.75rem' }}>
                    <button className="d-btn d-btn-secondary" onClick={handleSave} disabled={saving}>
                        <Save size={16} /> Save
                    </button>
                    {isSentOrFailed && (
                        <button className="d-btn d-btn-primary" onClick={handleSaveAndSend} disabled={saving}>
                            <Send size={16} /> Save & Resend
                        </button>
                    )}
                </div>
            </div>

            {/* Two-column layout */}
            <div className="d-grid-2-3" style={{ alignItems: 'start' }}>

                {/* Left — form fields */}
                <div className="d-card">
                    <p className="d-card-title" style={{ marginBottom: '1.25rem' }}>Campaign Details</p>
                    <div className="d-form">

                        <div className="d-field">
                            <label className="d-label">Campaign Name <span className="req">*</span></label>
                            <input
                                className="d-input"
                                type="text"
                                name="name"
                                value={formData.name}
                                onChange={handleInputChange}
                                placeholder="e.g. Monthly Newsletter"
                            />
                        </div>

                        <div className="d-field">
                            <label className="d-label">Email Subject <span className="req">*</span></label>
                            <input
                                className="d-input"
                                type="text"
                                name="subject"
                                value={formData.subject}
                                onChange={handleInputChange}
                                placeholder="e.g. You won't believe this update…"
                            />
                        </div>

                        <div className="d-field">
                            <label className="d-label">Sender Name / Email <span className="req">*</span></label>
                            <input
                                className="d-input"
                                type="text"
                                name="sender"
                                value={formData.sender}
                                onChange={handleInputChange}
                                placeholder="e.g. John from Sendora <john@sendora.com>"
                            />
                        </div>

                        {/* Recipients info (read-only) */}
                        <div className="d-field">
                            <label className="d-label">Recipients</label>
                            <div style={{ padding: '0.75rem 1rem', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '10px', fontSize: '0.85rem', color: '#64748b' }}>
                                {campaign?.listId
                                    ? `📋 Contact list: ${campaign.listId.name || 'Linked list'} (${campaign.listId.contactCount?.toLocaleString() || '?'} contacts)`
                                    : `📎 Uploaded: ${campaign?.recipients?.length?.toLocaleString() || 0} recipients`
                                }
                                <div style={{ marginTop: '0.3rem', fontSize: '0.75rem', color: '#94a3b8' }}>
                                    To change recipients, duplicate this campaign and create a new one.
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Right — content editor */}
                <div className="d-card">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                        <p className="d-card-title" style={{ margin: 0 }}>Email Content <span className="req">*</span></p>
                        <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>HTML supported</span>
                    </div>
                    <textarea
                        className="d-input"
                        name="content"
                        value={formData.content}
                        onChange={handleInputChange}
                        rows={18}
                        style={{ resize: 'vertical', fontFamily: 'monospace', fontSize: '0.82rem' }}
                        placeholder="<h1>Hello {{firstName}}!</h1>&#10;<p>Write your email body here...</p>"
                    />
                </div>
            </div>
        </>
    );
};

export default EditCampaign;
