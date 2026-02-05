import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getAllPolaroids, getStats } from '../db/database';
import PhotoCard from '../components/PhotoCard';

export default function Home() {
    const [recentPolaroids, setRecentPolaroids] = useState([]);
    const [stats, setStats] = useState({ total: 0, byIdol: {}, byGroup: {} });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadData();
    }, []);

    async function loadData() {
        try {
            const [polaroids, statsData] = await Promise.all([
                getAllPolaroids(),
                getStats('all')
            ]);

            // Sort by createdAt and take recent 6
            const sorted = polaroids.sort((a, b) =>
                new Date(b.createdAt) - new Date(a.createdAt)
            );
            setRecentPolaroids(sorted.slice(0, 6));
            setStats(statsData);
        } catch (error) {
            console.error('Failed to load data:', error);
        } finally {
            setLoading(false);
        }
    }

    const topIdols = Object.entries(stats.byIdol)
        .sort((a, b) => b[1].count - a[1].count)
        .slice(0, 3);

    return (
        <div className="page animate-fade-in">
            <header className="page-header">
                <Link to="/settings" style={{
                    position: 'absolute',
                    right: 'var(--space-lg)',
                    top: 'var(--space-lg)',
                    color: 'var(--text-secondary)',
                    fontSize: '1.5rem',
                    textDecoration: 'none'
                }}>
                    ⚙️
                </Link>
                <h1 className="page-title">
                    <img src="/penguin-mascot.png" alt="Penguin" className="mascot animate-bounce" />
                    Polaroid Tracker
                </h1>
                <p className="page-subtitle">記錄與偶像的每一刻</p>
            </header>

            {/* Quick Stats */}
            <div className="stats-grid" style={{ marginBottom: 'var(--space-xl)' }}>
                <div className="stat-card">
                    <div className="stat-value">{stats.total}</div>
                    <div className="stat-label">總拍立得數</div>
                </div>
                <div className="stat-card">
                    <div className="stat-value">{Object.keys(stats.byIdol).length}</div>
                    <div className="stat-label">不同偶像</div>
                </div>
            </div>

            {/* Top Idols */}
            {topIdols.length > 0 && (
                <section style={{ marginBottom: 'var(--space-xl)' }}>
                    <h2 style={{ fontSize: '1rem', marginBottom: 'var(--space-md)', color: 'var(--text-secondary)' }}>
                        🏆 拍最多的偶像
                    </h2>
                    <div className="list">
                        {topIdols.map(([name, data], index) => (
                            <div key={name} className="list-item">
                                <div style={{
                                    width: 32,
                                    height: 32,
                                    borderRadius: '50%',
                                    background: 'var(--gradient-primary)',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    fontWeight: 'bold',
                                    color: 'white'
                                }}>
                                    {index + 1}
                                </div>
                                <div className="list-item-content">
                                    <div className="list-item-title">{name}</div>
                                    <div className="list-item-subtitle">{data.group}</div>
                                </div>
                                <div style={{ color: 'var(--primary)', fontWeight: 600 }}>
                                    {data.count} 張
                                </div>
                            </div>
                        ))}
                    </div>
                </section>
            )}

            {/* Recent Polaroids */}
            <section>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-md)' }}>
                    <h2 style={{ fontSize: '1rem', color: 'var(--text-secondary)' }}>
                        📸 最近的拍立得
                    </h2>
                    <Link to="/album" style={{ color: 'var(--primary)', fontSize: '0.875rem', textDecoration: 'none' }}>
                        查看全部 →
                    </Link>
                </div>

                {loading ? (
                    <div className="empty-state">
                        <p>載入中...</p>
                    </div>
                ) : recentPolaroids.length === 0 ? (
                    <div className="empty-state">
                        <img src="/penguin-mascot.png" alt="Penguin" className="empty-state-mascot" />
                        <p>還沒有任何拍立得</p>
                        <Link to="/upload" className="btn btn-primary" style={{ marginTop: 'var(--space-md)' }}>
                            新增第一張
                        </Link>
                    </div>
                ) : (
                    <div className="grid-3">
                        {recentPolaroids.map(polaroid => (
                            <Link key={polaroid.id} to={`/detail/${polaroid.id}`} style={{ textDecoration: 'none' }}>
                                <PhotoCard polaroid={polaroid} />
                            </Link>
                        ))}
                    </div>
                )}
            </section>

            {/* Quick Add Button */}
            <Link
                to="/upload"
                className="btn btn-primary btn-icon"
                style={{
                    position: 'fixed',
                    bottom: 'calc(80px + var(--space-lg))',
                    right: 'var(--space-lg)',
                    width: 56,
                    height: 56,
                    fontSize: '1.5rem',
                    boxShadow: 'var(--shadow-lg), var(--shadow-glow)'
                }}
            >
                +
            </Link>
        </div>
    );
}
