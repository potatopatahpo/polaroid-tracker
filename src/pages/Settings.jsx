import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getAllPolaroids } from '../db/database';
import {
    getGoogleScriptUrl,
    setGoogleScriptUrl,
    isSyncConfigured,
    syncAllToCloud,
    fetchFromCloud
} from '../db/sync';

export default function Settings() {
    const navigate = useNavigate();
    const [scriptUrl, setScriptUrl] = useState('');
    const [isSaving, setIsSaving] = useState(false);
    const [isSyncing, setIsSyncing] = useState(false);
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

        setIsSyncing(true);
        setMessage('⏳ 正在上傳到雲端...');

        try {
            const polaroids = await getAllPolaroids();
            await syncAllToCloud(polaroids);
            setMessage(`✅ 已上傳 ${polaroids.length} 張拍立得到雲端！`);
        } catch (error) {
            setMessage('❌ 上傳失敗：' + error.message);
        } finally {
            setIsSyncing(false);
        }
    };

    const handleSyncDown = async () => {
        if (!isSyncConfigured()) {
            setMessage('❌ 請先設定 Google Script URL');
            return;
        }

        setIsSyncing(true);
        setMessage('⏳ 正在從雲端下載...');

        try {
            const cloudData = await fetchFromCloud();
            setMessage(`✅ 從雲端獲取 ${cloudData.length} 張拍立得！請刷新頁面查看。`);
        } catch (error) {
            setMessage('❌ 下載失敗：' + error.message);
        } finally {
            setIsSyncing(false);
        }
    };

    return (
        <div className="page animate-fade-in">
            <button
                onClick={() => navigate(-1)}
                style={{
                    background: 'none',
                    border: 'none',
                    color: 'var(--primary)',
                    fontSize: '1rem',
                    cursor: 'pointer',
                    marginBottom: 'var(--space-md)'
                }}
            >
                ← 返回
            </button>

            <header className="page-header" style={{ textAlign: 'left' }}>
                <h1 className="page-title" style={{ justifyContent: 'flex-start' }}>
                    ⚙️ 設定
                </h1>
                <p className="page-subtitle">配置雲端同步</p>
            </header>

            {/* Local Data Info */}
            <div className="card" style={{ marginBottom: 'var(--space-lg)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-md)' }}>
                    <div style={{
                        width: 48,
                        height: 48,
                        borderRadius: 'var(--radius-md)',
                        background: 'var(--gradient-primary)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '1.5rem'
                    }}>
                        📱
                    </div>
                    <div>
                        <div style={{ fontWeight: 600 }}>本機數據</div>
                        <div style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
                            {localCount} 張拍立得
                        </div>
                    </div>
                </div>
            </div>

            {/* Google Sheets Setup */}
            <div className="card" style={{ marginBottom: 'var(--space-lg)' }}>
                <h2 style={{ fontSize: '1rem', marginBottom: 'var(--space-md)', color: 'var(--text-secondary)' }}>
                    ☁️ Google Sheets 同步
                </h2>

                <div className="form-group">
                    <label className="label">Google Apps Script URL</label>
                    <input
                        type="url"
                        className="input"
                        placeholder="https://script.google.com/macros/s/..."
                        value={scriptUrl}
                        onChange={(e) => setScriptUrl(e.target.value)}
                    />
                    <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: 'var(--space-sm)' }}>
                        需要先在 Google Sheets 建立 Apps Script 來處理數據同步
                    </p>
                </div>

                <button
                    className="btn btn-primary"
                    onClick={handleSave}
                    style={{ width: '100%' }}
                >
                    💾 保存設定
                </button>
            </div>

            {/* Sync Actions */}
            <div className="card" style={{ marginBottom: 'var(--space-lg)' }}>
                <h2 style={{ fontSize: '1rem', marginBottom: 'var(--space-md)', color: 'var(--text-secondary)' }}>
                    🔄 同步操作
                </h2>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-md)' }}>
                    <button
                        className="btn btn-secondary"
                        onClick={handleSyncUp}
                        disabled={isSyncing}
                        style={{ width: '100%' }}
                    >
                        ⬆️ 上傳本機數據到雲端
                    </button>

                    <button
                        className="btn btn-secondary"
                        onClick={handleSyncDown}
                        disabled={isSyncing}
                        style={{ width: '100%' }}
                    >
                        ⬇️ 從雲端下載數據
                    </button>
                </div>
            </div>

            {/* Message */}
            {message && (
                <div className="card" style={{
                    background: message.includes('✅') ? 'hsla(158, 64%, 42%, 0.1)' :
                        message.includes('❌') ? 'hsla(0, 70%, 50%, 0.1)' :
                            'hsla(45, 90%, 50%, 0.1)',
                    borderColor: message.includes('✅') ? 'var(--primary)' :
                        message.includes('❌') ? 'hsl(0, 70%, 50%)' :
                            'hsl(45, 90%, 50%)'
                }}>
                    {message}
                </div>
            )}

            {/* Setup Guide */}
            <div className="card" style={{ marginTop: 'var(--space-lg)' }}>
                <h2 style={{ fontSize: '1rem', marginBottom: 'var(--space-md)', color: 'var(--text-secondary)' }}>
                    📖 設定指南
                </h2>
                <ol style={{ paddingLeft: 'var(--space-lg)', fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                    <li style={{ marginBottom: 'var(--space-sm)' }}>建立一個 Google Sheets</li>
                    <li style={{ marginBottom: 'var(--space-sm)' }}>打開 Extensions → Apps Script</li>
                    <li style={{ marginBottom: 'var(--space-sm)' }}>貼上提供的腳本代碼</li>
                    <li style={{ marginBottom: 'var(--space-sm)' }}>Deploy → New deployment → Web app</li>
                    <li style={{ marginBottom: 'var(--space-sm)' }}>設定 Execute as: Me, Who has access: Anyone</li>
                    <li>複製 Web app URL 到上方輸入框</li>
                </ol>
            </div>
        </div>
    );
}
