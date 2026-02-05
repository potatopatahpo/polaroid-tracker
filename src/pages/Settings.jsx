import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getAllPolaroids } from '../db/database';
import { getGoogleScriptUrl, setGoogleScriptUrl, isSyncConfigured, syncAllToCloud } from '../db/sync';

export default function Settings() {
    const navigate = useNavigate();
    const [scriptUrl, setScriptUrl] = useState('');
    const [isSaving, setIsSaving] = useState(false);
    const [message, setMessage] = useState('');
    const [localCount, setLocalCount] = useState(0);

    useEffect(() => {
        setScriptUrl(getGoogleScriptUrl());
        loadLocalCount();
    }, []);

    async function loadLocalCount() {
        const polaroids = await getAllPolaroids();
        setLocalCount(polaroids.length);
    }

    const handleSave = () => {
        setGoogleScriptUrl(scriptUrl);
        setMessage('✅ 已保存！');
        setTimeout(() => setMessage(''), 3000);
    };

    const handleSyncUp = async () => {
        if (!isSyncConfigured()) {
            setMessage('❌ 請先設定 Google Script URL');
            return;
        }
        setIsSaving(true);
        setMessage('⏳ 正在同步中...');
        try {
            const polaroids = await getAllPolaroids();
            await syncAllToCloud(polaroids);
            setMessage(`✅ 已同步 ${polaroids.length} 張作品！`);
        } catch (error) {
            setMessage('❌ 同步失敗');
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className="page animate-fade-in">
            <header className="page-header">
                <button onClick={() => navigate(-1)} className="btn btn-secondary" style={{ padding: '4px 12px', fontSize: '0.8rem', marginBottom: 'var(--space-md)' }}>← 返回</button>
                <h1 className="page-title">⚙️ 設定</h1>
            </header>

            <div className="card" style={{ marginBottom: 'var(--space-xl)' }}>
                <h2 style={{ fontSize: '1rem', marginBottom: 'var(--space-md)' }}>雲端同步</h2>
                <div className="form-group">
                    <label className="label">Google Apps Script URL</label>
                    <input type="url" className="input" value={scriptUrl} onChange={e => setScriptUrl(e.target.value)} />
                </div>
                <button className="btn btn-primary" onClick={handleSave} style={{ width: '100%' }}>儲存設定</button>
            </div>

            <div className="card">
                <h2 style={{ fontSize: '1rem', marginBottom: 'var(--space-md)' }}>數據管理</h2>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-md)' }}>
                    <span>本機儲存量</span>
                    <span style={{ fontWeight: 600 }}>{localCount} 張</span>
                </div>
                <button className="btn btn-secondary" onClick={handleSyncUp} disabled={isSaving} style={{ width: '100%' }}>強制手動同步到雲端</button>
            </div>

            {message && <div style={{ marginTop: 'var(--space-md)', textAlign: 'center', color: 'var(--primary)', fontWeight: 600 }}>{message}</div>}
        </div>
    );
}
