import React, { useState, useEffect } from 'react';
import { Users, Upload, Search, Trash2, Plus, ArrowLeft, Link2, AlertCircle } from 'lucide-react';
import * as XLSX from 'xlsx';
import toast from 'react-hot-toast';
import listService from '../services/lists';
import { importFromDriveUrl, extractDriveFileId } from '../utils/driveImport';

const Contacts = () => {
    const [lists, setLists] = useState([]);
    const [search, setSearch] = useState('');
    const [loading, setLoading] = useState(true);

    // Modal state for creating a new list & importing
    const [showModal, setShowModal] = useState(false);
    const [newListName, setNewListName] = useState('');
    const [selectedFile, setSelectedFile] = useState(null);
    const [importing, setImporting] = useState(false);
    const [driveUrl, setDriveUrl] = useState('');

    // Detail state
    const [selectedList, setSelectedList] = useState(null);
    const [listContacts, setListContacts] = useState([]);
    const [contactsLoading, setContactsLoading] = useState(false);

    useEffect(() => {
        fetchLists();
    }, []);

    const fetchLists = async () => {
        try {
            const data = await listService.getLists();
            setLists(data);
        } catch (err) {
            toast.error('Failed to load lists');
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteList = async (id, e) => {
        e.stopPropagation();
        if (!window.confirm('Are you sure you want to delete this list and all its contacts?')) return;
        try {
            await listService.deleteList(id);
            setLists(lists.filter(l => l._id !== id));
            toast.success('List deleted');
        } catch (err) {
            toast.error('Failed to delete list');
        }
    };

    const handleCreateAndImport = async (e) => {
        e.preventDefault();
        if (!newListName.trim()) return toast.error('List name is required');
        if (!selectedFile) return toast.error('Please select a CSV/Excel file');

        setImporting(true);
        const tid = toast.loading('Reading file...');

        const reader = new FileReader();
        reader.onload = async (evt) => {
            try {
                const data = new Uint8Array(evt.target.result);
                const wb = XLSX.read(data, { type: 'array' });
                const ws = wb.Sheets[wb.SheetNames[0]];
                const rows = XLSX.utils.sheet_to_json(ws, { header: 1, defval: '' });
                if (!rows || rows.length < 2) {
                    setImporting(false);
                    return toast.error('File appears to be empty or has no data rows', { id: tid });
                }
                const headers = rows[0].map(h => String(h).toLowerCase().trim());
                const emailIdx = headers.findIndex(h => h === 'email' || h.includes('email'));
                const firstIdx = headers.findIndex(h => h.includes('first'));
                const lastIdx = headers.findIndex(h => h.includes('last'));
                if (emailIdx === -1) {
                    setImporting(false);
                    return toast.error('No "email" column found in file', { id: tid });
                }
                const parsed = rows.slice(1)
                    .filter(r => r[emailIdx] && String(r[emailIdx]).trim())
                    .map(r => ({
                        email: String(r[emailIdx]).trim(),
                        firstName: firstIdx > -1 ? String(r[firstIdx] || '').trim() : '',
                        lastName: lastIdx > -1 ? String(r[lastIdx] || '').trim() : ''
                    }));
                if (parsed.length === 0) {
                    setImporting(false);
                    return toast.error('No valid rows with an email address found', { id: tid });
                }
                toast.loading(`Importing ${parsed.length} contacts...`, { id: tid });
                const list = await listService.createList({ name: newListName });
                const result = await listService.importContacts(list._id, parsed);
                toast.success(result.msg, { id: tid });
                setShowModal(false);
                setNewListName('');
                setSelectedFile(null);
                setDriveUrl('');
                fetchLists();
            } catch (error) {
                console.error(error);
                toast.error(error.response?.data?.msg || 'Failed to import contacts', { id: tid });
            } finally {
                setImporting(false);
            }
        };
        reader.onerror = () => {
            setImporting(false);
            toast.error('Failed to read file. Please try again.', { id: tid });
        };
        reader.readAsArrayBuffer(selectedFile);
    };

    const handleDriveImport = async (e) => {
        e.preventDefault();
        if (!newListName.trim()) return toast.error('List name is required');
        if (!driveUrl.trim()) return toast.error('Please enter a Google Drive URL');
        if (!extractDriveFileId(driveUrl)) return toast.error('Not a valid Google Drive link. Use the "Share" link from Drive.');

        setImporting(true);
        const tid = toast.loading('Fetching file from Google Drive…');
        try {
            const parsed = await importFromDriveUrl(driveUrl);
            toast.loading(`Importing ${parsed.length} contacts...`, { id: tid });
            const list = await listService.createList({ name: newListName });
            const result = await listService.importContacts(list._id, parsed);
            toast.success(result.msg, { id: tid });
            setShowModal(false);
            setNewListName('');
            setDriveUrl('');
            setSelectedFile(null);
            fetchLists();
        } catch (error) {
            if (error.message === 'PRIVATE_FILE') {
                toast.error('This Google Drive file is private. To fix: open the file in Drive → Share → Anyone with the link → Viewer.', { id: tid, duration: 8000 });
            } else {
                toast.error(error.message || 'Failed to import from Google Drive', { id: tid });
            }
        } finally { setImporting(false); }
    };

    const handleViewList = async (list) => {
        setSelectedList(list);
        setContactsLoading(true);
        try {
            const data = await listService.getListContacts(list._id);
            setListContacts(data.contacts);
        } catch (err) {
            toast.error('Failed to load contacts for this list');
            setSelectedList(null);
        } finally {
            setContactsLoading(false);
        }
    };

    const visibleLists = lists.filter(l => l.name.toLowerCase().includes(search.toLowerCase()));

    if (selectedList) {
        return (
            <>
                <div className="d-page-header">
                    <div>
                        <button
                            onClick={() => setSelectedList(null)}
                            style={{ background: 'none', border: 'none', color: '#64748b', display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', marginBottom: '0.5rem', padding: 0 }}
                        >
                            <ArrowLeft size={16} /> Back to Lists
                        </button>
                        <h1>{selectedList.name}</h1>
                        <p>{selectedList.contactCount.toLocaleString()} total contacts</p>
                    </div>
                </div>

                <div className="d-table-wrap">
                    {contactsLoading ? (
                        <div className="d-empty"><p>Loading contacts...</p></div>
                    ) : listContacts.length === 0 ? (
                        <div className="d-empty">
                            <p>This list is empty.</p>
                        </div>
                    ) : (
                        <table className="d-table">
                            <thead>
                                <tr>
                                    <th>Email</th>
                                    <th>First Name</th>
                                    <th>Last Name</th>
                                    <th>Status</th>
                                    <th>Added</th>
                                </tr>
                            </thead>
                            <tbody>
                                {listContacts.map(c => (
                                    <tr key={c._id}>
                                        <td style={{ fontWeight: 500 }}>{c.email}</td>
                                        <td>{c.firstName || '—'}</td>
                                        <td>{c.lastName || '—'}</td>
                                        <td>
                                            <span className={`d-badge ${c.status === 'active' ? 'd-badge-success' : 'd-badge-danger'}`}>
                                                {c.status}
                                            </span>
                                        </td>
                                        <td style={{ color: '#64748b', fontSize: '0.82rem' }}>{new Date(c.createdAt).toLocaleDateString()}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>
            </>
        );
    }

    return (
        <>
            <div className="d-page-header">
                <div>
                    <h1>Contact Lists</h1>
                    <p>Manage your recipient lists for campaigns</p>
                </div>
                <button className="d-btn d-btn-primary" onClick={() => setShowModal(true)}>
                    <Plus size={16} /> New List
                </button>
            </div>

            {lists.length > 0 && (
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                    <span style={{ fontSize: '0.85rem', color: '#64748b' }}>
                        {lists.length} lists total
                    </span>
                    <div className="d-search-wrap">
                        <Search size={15} className="d-search-icon" />
                        <input
                            className="d-search-input"
                            placeholder="Search lists..."
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                        />
                    </div>
                </div>
            )}

            <div className="d-table-wrap">
                {loading ? (
                    <div className="d-empty"><p>Loading...</p></div>
                ) : lists.length === 0 ? (
                    <div className="d-empty">
                        <div className="d-empty-icon"><Users size={24} /></div>
                        <h3>No lists yet</h3>
                        <p>Create a list and import your contacts from a CSV or Excel file.</p>
                        <button className="d-btn d-btn-primary" onClick={() => setShowModal(true)}>
                            <Plus size={16} /> New List
                        </button>
                    </div>
                ) : (
                    <table className="d-table">
                        <thead>
                            <tr>
                                <th>List Name</th>
                                <th>Contacts</th>
                                <th>Created</th>
                                <th style={{ textAlign: 'right' }}>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {visibleLists.map(l => (
                                <tr key={l._id} onClick={() => handleViewList(l)} style={{ cursor: 'pointer' }} className="d-tr-hover">
                                    <td style={{ fontWeight: 600 }}>{l.name}</td>
                                    <td>{l.contactCount.toLocaleString()}</td>
                                    <td style={{ color: '#64748b', fontSize: '0.82rem' }}>{new Date(l.createdAt).toLocaleDateString()}</td>
                                    <td style={{ textAlign: 'right' }}>
                                        <button
                                            onClick={(e) => handleDeleteList(l._id, e)}
                                            style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', padding: '0.5rem' }}
                                            title="Delete List"
                                        >
                                            <Trash2 size={16} />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>

            {/* Import Modal */}
            {showModal && (
                <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '1rem' }}>
                    <div style={{ background: '#fff', padding: '2rem', borderRadius: '12px', width: '100%', maxWidth: '440px', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)' }}>
                        <h2 style={{ fontSize: '1.25rem', fontWeight: 600, margin: '0 0 0.5rem 0', color: '#0f172a' }}>Import Contact List</h2>
                        <p style={{ fontSize: '0.85rem', color: '#64748b', marginBottom: '1.5rem', lineHeight: 1.5 }}>
                            Upload a CSV or Excel file, or paste a <strong>public</strong> Google Drive link.
                        </p>

                        <div className="d-form-group" style={{ marginBottom: '1.25rem' }}>
                            <label className="d-label">List Name</label>
                            <input
                                className="d-input"
                                placeholder="e.g. Newsletter Subscribers"
                                value={newListName}
                                onChange={e => setNewListName(e.target.value)}
                                autoFocus
                            />
                        </div>

                        {/* ── Tab: Local File ── */}
                        <form onSubmit={handleCreateAndImport}>
                            <div className="d-form-group" style={{ marginBottom: '0.75rem' }}>
                                <label className="d-label">Upload File (.csv, .xlsx)</label>
                                <input
                                    type="file"
                                    accept=".csv,.xlsx,.xls"
                                    className="d-input"
                                    style={{ padding: '0.5rem' }}
                                    onChange={e => { setSelectedFile(e.target.files[0]); setDriveUrl(''); }}
                                />
                            </div>
                            <button
                                type="submit"
                                className="d-btn d-btn-primary"
                                style={{ width: '100%', marginBottom: '1rem' }}
                                disabled={importing || !newListName || !selectedFile}
                            >
                                <Upload size={15} /> {importing && selectedFile ? 'Importing…' : 'Upload & Import'}
                            </button>
                        </form>

                        {/* ── Divider ── */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
                            <div style={{ flex: 1, height: 1, background: '#e2e8f0' }} />
                            <span style={{ fontSize: '0.75rem', color: '#94a3b8', fontWeight: 600 }}>OR</span>
                            <div style={{ flex: 1, height: 1, background: '#e2e8f0' }} />
                        </div>

                        {/* ── Tab: Google Drive URL ── */}
                        <form onSubmit={handleDriveImport}>
                            <div className="d-form-group" style={{ marginBottom: '0.5rem' }}>
                                <label className="d-label" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                                    <Link2 size={14} /> Google Drive URL
                                </label>
                                <input
                                    className="d-input"
                                    placeholder="https://drive.google.com/file/d/…"
                                    value={driveUrl}
                                    onChange={e => { setDriveUrl(e.target.value); setSelectedFile(null); }}
                                />
                            </div>
                            {/* Private file warning */}
                            <div style={{ display: 'flex', gap: '0.4rem', alignItems: 'flex-start', fontSize: '0.73rem', color: '#92400e', background: '#fffbeb', border: '1px solid #fde68a', borderRadius: '8px', padding: '0.5rem 0.65rem', marginBottom: '0.75rem' }}>
                                <AlertCircle size={13} style={{ flexShrink: 0, marginTop: 1 }} />
                                <span>The file must be publicly shared. In Drive: <strong>Share → Anyone with the link → Viewer</strong>. Private files will be rejected.</span>
                            </div>
                            <button
                                type="submit"
                                className="d-btn d-btn-secondary"
                                style={{ width: '100%', marginBottom: '1rem' }}
                                disabled={importing || !newListName || !driveUrl}
                            >
                                <Link2 size={15} /> {importing && driveUrl ? 'Fetching…' : 'Import from Drive'}
                            </button>
                        </form>

                        <button
                            type="button"
                            className="d-btn d-btn-ghost"
                            style={{ width: '100%' }}
                            onClick={() => { setShowModal(false); setDriveUrl(''); setSelectedFile(null); }}
                            disabled={importing}
                        >
                            Cancel
                        </button>
                    </div>
                </div>
            )}
        </>
    );
};

export default Contacts;
