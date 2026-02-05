import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import db from '../db/database';

export default function Detail() {
    const { id } = useParams();
    const navigate = useNavigate();
    const [polaroid, setPolaroid] = useState(null);

    useEffect(() => {
        db.polaroids.get(Number(id)).then(setPolaroid);
    }, [id]);

    const handleDelete = async () => {
        if (window.confirm('確定要刪除這張拍立得嗎？')) {
            await db.polaroids.delete(Number(id));
            navigate('/album');
        }
    };

    if (!polaroid) return <div className="page">Loading...</div>;

    return (
        <div className="page animate-fade-in">
            <header className="page-header">
                <button onClick={() => navigate(-1)} className="btn btn-secondary" style={{ padding: '4px 12px' }}>← 返回</button>
            </header>

            <div className="card" style={{ padding: 'var(--space-md)', background: '#fff' }}>
                <img src={polaroid.imageData} alt={polaroid.idolName} style={{ width: '100%', borderRadius: 'var(--radius-sm)', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }} />
            </div>

            <div style={{ marginTop: 'var(--space-xl)' }}>
                <h1 style={{ fontSize: '1.75rem', fontWeight: 800, marginBottom: 'var(--space-xs)' }}>{polaroid.idolName}</h1>
                <p style={{ color: 'var(--text-secondary)', marginBottom: 'var(--space-lg)' }}>{polaroid.groupName}</p>

                <div className="card" style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 'var(--space-md)' }}>
                    <div>
                        <div style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>活動</div>
                        <div style={{ fontWeight: 600 }}>{polaroid.eventName || '無'}</div>
                    </div>
                    <div>
                        <div style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>日期</div>
                        <div style={{ fontWeight: 600 }}>{polaroid.eventDate}</div>
                    </div>
                    <div>
                        <div style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>地點</div>
                        <div style={{ fontWeight: 600 }}>{polaroid.eventLocation || '無'}</div>
                    </div>
                </div>
            </div>

            <div style={{ marginTop: 'var(--space-2xl)', display: 'flex', gap: 'var(--space-sm)' }}>
                <button className="btn btn-secondary" onClick={handleDelete} style={{ flex: 1, borderColor: '#ff4d4f', color: '#ff4d4f' }}>🗑️ 刪除紀錄</button>
            </div>
        </div>
    );
}
