import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { db, updatePolaroid, deletePolaroid } from '../db/database';

export default function Detail() {
    const { id } = useParams();
    const navigate = useNavigate();
    const [polaroid, setPolaroid] = useState(null);
    const [loading, setLoading] = useState(true);
    const [editing, setEditing] = useState(false);
    const [formData, setFormData] = useState({});
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        loadPolaroid();
    }, [id]);

    async function loadPolaroid() {
        try {
            const data = await db.polaroids.get(Number(id));
            if (data) {
                setPolaroid(data);
                setFormData({
                    idolName: data.idolName,
                    groupName: data.groupName,
                    eventName: data.eventName || '',
                    eventDate: data.eventDate?.substring(0, 10) || '',
                    eventLocation: data.eventLocation || '',
                    repo: data.repo || ''
                });
            }
        } catch (error) {
            console.error('Failed to load polaroid:', error);
        } finally {
            setLoading(false);
        }
    }

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            await updatePolaroid(Number(id), {
                ...formData,
                eventDate: formData.eventDate ? new Date(formData.eventDate).toISOString() : null
            });
            await loadPolaroid();
            setEditing(false);
        } catch (error) {
            console.error('Failed to update:', error);
            alert('更新失敗');
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async () => {
        if (!confirm('確定要刪除這張拍立得嗎？')) return;

        try {
            await deletePolaroid(Number(id));
            navigate('/', { replace: true });
        } catch (error) {
            console.error('Failed to delete:', error);
            alert('刪除失敗');
        }
    };

    const formatDate = (dateStr) => {
        if (!dateStr) return '-';
        const date = new Date(dateStr);
        return date.toLocaleDateString('zh-TW', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    };

    if (loading) {
        return (
            <div className="page">
                <div className="empty-state">
                    <p>載入中...</p>
                </div>
            </div>
        );
    }

    if (!polaroid) {
        return (
            <div className="page">
                <div className="empty-state">
                    <div className="empty-state-icon">❌</div>
                    <p>找不到這張拍立得</p>
                    <Link to="/" className="btn btn-primary" style={{ marginTop: 'var(--space-md)' }}>
                        返回首頁
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className="page animate-fade-in">
            {/* Back button */}
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

            {/* Image */}
            <div className="image-preview" style={{ marginBottom: 'var(--space-lg)' }}>
                <img
                    src={polaroid.imageData}
                    alt={polaroid.idolName}
                    style={{ width: '100%', borderRadius: 'var(--radius-lg)' }}
                />
            </div>

            {editing ? (
                /* Edit Mode */
                <div className="card">
                    <div className="form-group">
                        <label className="label">偶像名字</label>
                        <input
                            type="text"
                            name="idolName"
                            className="input"
                            value={formData.idolName}
                            onChange={handleChange}
                        />
                    </div>

                    <div className="form-group">
                        <label className="label">所屬團體</label>
                        <input
                            type="text"
                            name="groupName"
                            className="input"
                            value={formData.groupName}
                            onChange={handleChange}
                        />
                    </div>

                    <div className="form-group">
                        <label className="label">Event 名稱</label>
                        <input
                            type="text"
                            name="eventName"
                            className="input"
                            value={formData.eventName}
                            onChange={handleChange}
                        />
                    </div>

                    <div className="grid-2">
                        <div className="form-group">
                            <label className="label">日期</label>
                            <input
                                type="date"
                                name="eventDate"
                                className="input"
                                value={formData.eventDate}
                                onChange={handleChange}
                            />
                        </div>

                        <div className="form-group">
                            <label className="label">場所</label>
                            <input
                                type="text"
                                name="eventLocation"
                                className="input"
                                value={formData.eventLocation}
                                onChange={handleChange}
                            />
                        </div>
                    </div>

                    <div className="form-group">
                        <label className="label">💬 對話記錄</label>
                        <textarea
                            name="repo"
                            className="textarea"
                            value={formData.repo}
                            onChange={handleChange}
                            rows={4}
                        />
                    </div>

                    <div style={{ display: 'flex', gap: 'var(--space-md)' }}>
                        <button
                            className="btn btn-secondary"
                            onClick={() => setEditing(false)}
                            style={{ flex: 1 }}
                        >
                            取消
                        </button>
                        <button
                            className="btn btn-primary"
                            onClick={handleSave}
                            disabled={saving}
                            style={{ flex: 1 }}
                        >
                            {saving ? '保存中...' : '保存'}
                        </button>
                    </div>
                </div>
            ) : (
                /* View Mode */
                <>
                    <div className="card" style={{ marginBottom: 'var(--space-lg)' }}>
                        <h2 style={{ fontSize: '1.5rem', marginBottom: 'var(--space-xs)' }}>
                            {polaroid.idolName}
                        </h2>
                        <p style={{ color: 'var(--text-secondary)', marginBottom: 'var(--space-lg)' }}>
                            {polaroid.groupName}
                        </p>

                        <div style={{ display: 'grid', gap: 'var(--space-md)' }}>
                            {polaroid.eventName && (
                                <div>
                                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: 'var(--space-xs)' }}>
                                        Event
                                    </div>
                                    <div>{polaroid.eventName}</div>
                                </div>
                            )}

                            <div className="grid-2">
                                <div>
                                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: 'var(--space-xs)' }}>
                                        日期
                                    </div>
                                    <div>{formatDate(polaroid.eventDate)}</div>
                                </div>
                                {polaroid.eventLocation && (
                                    <div>
                                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: 'var(--space-xs)' }}>
                                            場所
                                        </div>
                                        <div>{polaroid.eventLocation}</div>
                                    </div>
                                )}
                            </div>

                            {polaroid.repo && (
                                <div>
                                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: 'var(--space-xs)' }}>
                                        💬 對話記錄
                                    </div>
                                    <div style={{
                                        background: 'var(--bg-input)',
                                        padding: 'var(--space-md)',
                                        borderRadius: 'var(--radius-md)',
                                        whiteSpace: 'pre-wrap'
                                    }}>
                                        {polaroid.repo}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    <div style={{ display: 'flex', gap: 'var(--space-md)' }}>
                        <button
                            className="btn btn-primary"
                            onClick={() => setEditing(true)}
                            style={{ flex: 1 }}
                        >
                            ✏️ 編輯
                        </button>
                        <button
                            className="btn btn-secondary"
                            onClick={handleDelete}
                            style={{
                                flex: 1,
                                borderColor: 'hsl(0, 70%, 50%)',
                                color: 'hsl(0, 70%, 60%)'
                            }}
                        >
                            🗑️ 刪除
                        </button>
                    </div>
                </>
            )}
        </div>
    );
}
