import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getAllPolaroids } from '../db/database';

export default function Stats() {
    const navigate = useNavigate();
    const [stats, setStats] = useState({ total: 0, byIdol: {} });

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        const data = await getAllPolaroids();
        const byIdol = {};
        data.forEach(p => {
            if (!byIdol[p.idolName]) byIdol[p.idolName] = 0;
            byIdol[p.idolName]++;
        });
        setStats({ total: data.length, byIdol });
    };

    const sortedIdols = Object.entries(stats.byIdol).sort((a, b) => b[1] - a[1]);

    return (
        <div className="page animate-fade-in">
            <header className="page-header">
                <button onClick={() => navigate(-1)} className="btn btn-secondary" style={{ padding: '4px 12px', fontSize: '0.8rem', marginBottom: 'var(--space-md)' }}>← 返回</button>
                <h1 className="page-title">📊 數據統計</h1>
            </header>

            <div className="card" style={{ textAlign: 'center', padding: 'var(--space-xl)', marginBottom: 'var(--space-xl)', background: 'var(--gradient-primary)', color: 'white' }}>
                <div style={{ fontSize: '0.875rem', opacity: 0.9 }}>總收藏數量</div>
                <div style={{ fontSize: '3rem', fontWeight: 800 }}>{stats.total}</div>
                <div style={{ fontSize: '0.875rem', opacity: 0.9 }}>張拍立得</div>
            </div>

            <h2 style={{ fontSize: '1.25rem', marginBottom: 'var(--space-lg)' }}>偶像追蹤排行</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-md)' }}>
                {sortedIdols.map(([name, count]) => (
                    <div key={name} className="card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontWeight: 600 }}>{name}</span>
                        <span className="badge" style={{ backgroundColor: 'var(--primary)', color: 'white', padding: '4px 12px', borderRadius: '50px' }}>{count} 張</span>
                    </div>
                ))}
            </div>
        </div>
    );
}
