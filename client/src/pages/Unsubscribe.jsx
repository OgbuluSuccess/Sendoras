import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';

const BASE_URL = import.meta.env.VITE_API_URL || 'https://app.sendoras.online';
// Normalize URL to remove trailing /api/v1 or /api if it exists, so we can append exactly what we need
const API_URL = BASE_URL.replace(/\/api\/v1|\/api/g, '').replace(/\/$/, '') + '/api/v1';

const Unsubscribe = () => {
    const [searchParams] = useSearchParams();
    const [status, setStatus] = useState('processing'); // 'processing', 'success', 'error'
    
    useEffect(() => {
        const email = searchParams.get('email');
        const u = searchParams.get('u');
        
        if (!email || !u) {
            setStatus('error');
            return;
        }

        const handleUnsubscribe = async () => {
            try {
                const response = await fetch(`${API_URL}/unsubscribe`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ email, u })
                });
                
                if (response.ok) {
                    setStatus('success');
                } else {
                    setStatus('error');
                }
            } catch (err) {
                setStatus('error');
            }
        };

        // Adding a slight delay so it doesn't just flash instantly if the network is extremely fast
        const timeoutId = setTimeout(() => {
            handleUnsubscribe();
        }, 1000);

        return () => clearTimeout(timeoutId);
    }, [searchParams]);

    return (
        <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#f8fafc', padding: '20px', fontFamily: 'system-ui, -apple-system, sans-serif' }}>
            <div style={{ backgroundColor: '#ffffff', padding: '40px', borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.05), 0 4px 6px -2px rgba(0, 0, 0, 0.025)', maxWidth: '400px', width: '100%', textAlign: 'center' }}>
                {status === 'processing' && (
                    <>
                        <div style={{ width: '40px', height: '40px', border: '3px solid #f1f5f9', borderTopColor: '#94a3b8', borderRadius: '50%', margin: '0 auto 20px', animation: 'spin 1s linear infinite' }}></div>
                        <style>
                            {`
                                @keyframes spin {
                                    0% { transform: rotate(0deg); }
                                    100% { transform: rotate(360deg); }
                                }
                            `}
                        </style>
                        <h2 style={{ margin: '0 0 12px', color: '#334155', fontSize: '20px', fontWeight: '600' }}>Processing Request</h2>
                        <p style={{ margin: 0, color: '#64748b', fontSize: '15px', lineHeight: '1.5' }}>Please wait while we update your preferences...</p>
                    </>
                )}
                
                {status === 'success' && (
                    <>
                        <div style={{ width: '56px', height: '56px', backgroundColor: '#dcfce7', color: '#16a34a', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px', fontSize: '28px', fontWeight: '700' }}>✓</div>
                        <h2 style={{ margin: '0 0 12px', color: '#0f172a', fontSize: '22px', fontWeight: '600' }}>Unsubscribed</h2>
                        <p style={{ margin: 0, color: '#64748b', fontSize: '15px', lineHeight: '1.5' }}>
                            You have been successfully unsubscribed. You will no longer receive these emails.
                        </p>
                    </>
                )}

                {status === 'error' && (
                    <>
                        <div style={{ width: '56px', height: '56px', backgroundColor: '#fee2e2', color: '#dc2626', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px', fontSize: '28px', fontWeight: 'bold' }}>!</div>
                        <h2 style={{ margin: '0 0 12px', color: '#0f172a', fontSize: '22px', fontWeight: '600' }}>Invalid Request</h2>
                        <p style={{ margin: 0, color: '#64748b', fontSize: '15px', lineHeight: '1.5' }}>
                            We couldn't process your request. The link might be invalid or expired.
                        </p>
                    </>
                )}
            </div>
        </div>
    );
};

export default Unsubscribe;
