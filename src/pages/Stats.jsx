import { useState, useEffect } from 'react';
import { getStats } from '../db/database';

export default function Stats() {
    const [period, setPeriod] = useState('all');
    const [stats, setStats] = useState({ total: 0, byIdol: {}, byGroup: {}, byMonth: {} });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadStats();
    }, [period]);

    async function loadStats() {
        setLoading(true);
        try {
            const data = await getStats(period);
            setStats(data);
        } catch (error) {
            console.error('Failed to load stats:', error);
        } finally {
            setLoading(false);
        }
    }

    const idolRanking = Object.entries(stats.byIdol)
        .sort((a, b) => b[1].count - a[1].count);

    const groupRanking = Object.entries(stats.byGroup)
        .sort((a, b) => b[1] - a[1]);

    const monthlyData = Object.entries(stats.byMonth)
        .sort((a, b) => b[0].localeCompare(a[0]));

    const maxMonthly = Math.max(...Object.values(stats.byMonth), 1);

    const periodLabels = {
        month: '本月',
        year: '今年',
        all: '全部'
    };

    return (
        <div className="page animate-fade-in">
            <header className="page-header">
                <h1 className="page-title">📊 統計</h1>
                <p className="page-subtitle">分析你的拍立得收藏</p>
            </header>

            {/* Period Selector */}
            <div style={{ display: 'flex', gap: 'var(--space-sm)', marginBottom: 'var(--space-xl)' }}>
                {['month', 'year', 'all'].map(p => (
                    <button
                        key={p}
                        className={`btn ${p === period ? 'btn-primary' : 'btn-secondary'}`}
                        style={{ flex: 1 }}
                        onClick={() => setPeriod(p)}
                    >
                        {periodLabels[p]}
                    </button>
                ))}
            </div>

            {loading ? (
                <div className="empty-state">
                    <p>載入中...</p>
                </div>
            ) : stats.total === 0 ? (
                <div className="empty-state">
                    <div className="empty-state-icon">📊</div>
                    <p>{periodLabels[period]}沒有拍立得數據</p>
                </div>
            ) : (
                <>
                    {/* Summary Stats */}
                    <div className="stats-grid" style={{ marginBottom: 'var(--space-xl)' }}>
                        <div className="card stat-card">
                            <div className="stat-value">{stats.total}</div>
                            <div className="stat-label">總拍立得</div>
                        </div>
                        <div className="card stat-card">
                            <div className="stat-value">{Object.keys(stats.byIdol).length}</div>
                            <div className="stat-label">不同偶像</div>
                        </div>
                        <div className="card stat-card">
                            <div className="stat-value">{Object.keys(stats.byGroup).length}</div>
                            <div className="stat-label">不同團體</div>
                        </div>
                        <div className="card stat-card">
                            <div className="stat-value">{Object.keys(stats.byMonth).length}</div>
                            <div className="stat-label">活動月份</div>
                        </div>
                    </div>

                    {/* Idol Ranking */}
                    {idolRanking.length > 0 && (
                        <section style={{ marginBottom: 'var(--space-xl)' }}>
                            <h2 style={{ fontSize: '1rem', marginBottom: 'var(--space-md)', color: 'var(--text-secondary)' }}>
                                🌟 偶像排行
                            </h2>
                            <div className="list">
                                {idolRanking.map(([name, data], index) => (
                                    <div key={name} className="list-item">
                                        <div style={{
                                            width: 32,
                                            height: 32,
                                            borderRadius: '50%',
                                            background: index < 3 ? 'var(--gradient-primary)' : 'var(--bg-input)',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            fontWeight: 'bold',
                                            fontSize: '0.875rem'
                                        }}>
                                            {index + 1}
                                        </div>
                                        <div className="list-item-content">
                                            <div className="list-item-title">{name}</div>
                                            <div className="list-item-subtitle">{data.group}</div>
                                        </div>
                                        <div style={{
                                            color: 'var(--primary)',
                                            fontWeight: 600,
                                            fontSize: '0.875rem'
                                        }}>
                                            {data.count} 張
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </section>
                    )}

                    {/* Group Ranking */}
                    {groupRanking.length > 0 && (
                        <section style={{ marginBottom: 'var(--space-xl)' }}>
                            <h2 style={{ fontSize: '1rem', marginBottom: 'var(--space-md)', color: 'var(--text-secondary)' }}>
                                👥 團體排行
                            </h2>
                            <div className="list">
                                {groupRanking.map(([name, count]) => (
                                    <div key={name} className="list-item">
                                        <div className="list-item-content">
                                            <div className="list-item-title">{name}</div>
                                        </div>
                                        <div style={{
                                            color: 'var(--secondary)',
                                            fontWeight: 600,
                                            fontSize: '0.875rem'
                                        }}>
                                            {count} 張
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </section>
                    )}

                    {/* Monthly Chart */}
                    {monthlyData.length > 0 && (
                        <section>
                            <h2 style={{ fontSize: '1rem', marginBottom: 'var(--space-md)', color: 'var(--text-secondary)' }}>
                                📅 月份趨勢
                            </h2>
                            <div className="card" style={{ padding: 'var(--space-md)' }}>
                                {monthlyData.slice(0, 12).map(([month, count]) => (
                                    <div key={month} style={{ marginBottom: 'var(--space-md)' }}>
                                        <div style={{
                                            display: 'flex',
                                            justifyContent: 'space-between',
                                            fontSize: '0.75rem',
                                            marginBottom: 'var(--space-xs)'
                                        }}>
                                            <span>{month.replace('-', '/')}</span>
                                            <span style={{ color: 'var(--primary)' }}>{count} 張</span>
                                        </div>
                                        <div style={{
                                            height: 8,
                                            background: 'var(--bg-input)',
                                            borderRadius: 'var(--radius-full)',
                                            overflow: 'hidden'
                                        }}>
                                            <div style={{
                                                height: '100%',
                                                width: `${(count / maxMonthly) * 100}%`,
                                                background: 'var(--gradient-primary)',
                                                borderRadius: 'var(--radius-full)',
                                                transition: 'width 0.5s ease'
                                            }} />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </section>
                    )}
                </>
            )}
        </div>
    );
}
