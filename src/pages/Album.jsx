import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { getAllPolaroids } from '../db/database';

export default function Album() {
    const [polaroids, setPolaroids] = useState([]);
    const [filter, setFilter] = useState('');
    const navigate = useNavigate();

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        const data = await getAllPolaroids();
        setPolaroids(data.sort((a, b) => new Date(b.eventDate) - new Date(a.eventDate)));
    };

    const filtered = polaroids.filter(p =>
        p.idolName.toLowerCase().includes(filter.toLowerCase()) ||
        p.groupName.toLowerCase().includes(filter.toLowerCase())
    );

    return (
        <div className="page animate-fade-in">
            <header className="page-header">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
                    <h1 className="page-title">📂 我的相簿</h1>
                    <Link to="/upload" className="btn btn-primary" style={{ padding: '8px 16px', borderRadius: '50px' }}>＋</Link>
                </div>
            </header>

            <div className="form-group" style={{ marginBottom: 'var(--space-xl)' }}>
                <input
                    type="text"
                    className="input"
                    placeholder="搜尋偶像或團體..."
                    value={filter}
                    onChange={e => setFilter(e.target.value)}
                    style={{ borderRadius: '50px', paddingLeft: '20px' }}
                />
            </div>

            {filtered.length === 0 ? (
                <div style={{ textAlign: 'center', padding: 'var(--space-2xl)', color: 'var(--text-secondary)' }}>
                    找不到符合的作品 🧊
                </div>
            ) : (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-md)' }}>
                    {filtered.map(p => (
                        <div key={p.id} className="card" onClick={() => navigate(`/detail/${p.id}`)} style={{ padding: 'var(--space-xs)', cursor: 'pointer' }}>
                            <div style={{ aspectRatio: '1', borderRadius: 'var(--radius-md)', overflow: 'hidden', marginBottom: 'var(--space-xs)' }}>
                                <img src={URL.createObjectURL(p.thumbnail)} alt={p.idolName} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                            </div>
                            <div style={{ padding: '4px' }}>
                                <div style={{ fontWeight: 600, fontSize: '0.875rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.idolName}</div>
                                <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{p.eventDate}</div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            <Link to="/" style={{ position: 'fixed', bottom: 'var(--space-xl)', left: '50%', transform: 'translateX(-50%)', background: 'var(--gradient-primary)', color: 'white', padding: '12px 24px', borderRadius: '50px', textDecoration: 'none', fontWeight: 600, boxShadow: 'var(--shadow-lg)' }}>
                🏠 回到主頁
            </Link>
        </div>
    );
}
