import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { getAllPolaroids } from '../db/database';

export default function Home() {
    const [recentPolaroids, setRecentPolaroids] = useState([]);
    const navigate = useNavigate();

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        const data = await getAllPolaroids();
        // Sort by date descending and take top 5
        const sorted = data.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)).slice(0, 5);
        setRecentPolaroids(sorted);
    };

    return (
        <div className="page animate-fade-in">
            <header className="page-header" style={{ marginBottom: 'var(--space-2xl)' }}>
                <h1 className="page-title" style={{ fontSize: '2.5rem', letterSpacing: '-0.02em' }}>
                    Polaroid <span style={{ color: 'var(--primary)' }}>Tracker</span>
                </h1>
                <p className="page-subtitle">珍藏每一份心動瞬間</p>
            </header>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-md)', marginBottom: 'var(--space-2xl)' }}>
                <Link to="/upload" className="card" style={{ textDecoration: 'none', display: 'flex', flexDirection: 'column', alignItems: 'center', padding: 'var(--space-xl)', background: 'var(--gradient-primary)' }}>
                    <span style={{ fontSize: '2.5rem', marginBottom: 'var(--space-md)' }}>📸</span>
                    <span style={{ fontWeight: 700, color: 'white' }}>新增拍攝</span>
                </Link>
                <Link to="/album" className="card" style={{ textDecoration: 'none', display: 'flex', flexDirection: 'column', alignItems: 'center', padding: 'var(--space-xl)' }}>
                    <span style={{ fontSize: '2.5rem', marginBottom: 'var(--space-md)' }}>📂</span>
                    <span style={{ fontWeight: 700 }}>我的相簿</span>
                </Link>
            </div>

            <section>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-lg)' }}>
                    <h2 style={{ fontSize: '1.25rem', fontWeight: 700 }}>最近紀錄</h2>
                    <Link to="/album" style={{ color: 'var(--primary)', fontWeight: 600, fontSize: '0.875rem' }}>查看全部</Link>
                </div>

                {recentPolaroids.length === 0 ? (
                    <div className="card" style={{ padding: 'var(--space-2xl)', textAlign: 'center', color: 'var(--text-secondary)' }}>
                        還沒有紀錄，快去拍一張吧！✨
                    </div>
                ) : (
                    <div style={{ display: 'flex', gap: 'var(--space-md)', overflowX: 'auto', paddingBottom: 'var(--space-md)' }}>
                        {recentPolaroids.map(p => (
                            <div key={p.id} className="card" onClick={() => navigate(`/detail/${p.id}`)} style={{ minWidth: '140px', padding: 'var(--space-sm)' }}>
                                <div style={{ height: '160px', borderRadius: 'var(--radius-md)', overflow: 'hidden', marginBottom: 'var(--space-sm)' }}>
                                    <img src={URL.createObjectURL(p.thumbnail)} alt={p.idolName} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                </div>
                                <div style={{ fontWeight: 600, fontSize: '0.875rem' }}>{p.idolName}</div>
                                <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{p.eventDate.substring(5, 10)}</div>
                            </div>
                        ))}
                    </div>
                )}
            </section>

            <div style={{ marginTop: 'auto', display: 'flex', justifyContent: 'center', gap: 'var(--space-xl)', padding: 'var(--space-xl) 0' }}>
                <Link to="/stats" className="nav-link">📊 數據統計</Link>
                <Link to="/settings" className="nav-link">⚙️ 設定</Link>
            </div>
        </div>
    );
}
