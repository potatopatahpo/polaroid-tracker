import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getAllPolaroids } from '../db/database';
import PhotoCard from '../components/PhotoCard';

export default function Album() {
    const [polaroids, setPolaroids] = useState([]);
    const [currentMonth, setCurrentMonth] = useState(() => {
        const now = new Date();
        return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadPolaroids();
    }, []);

    async function loadPolaroids() {
        try {
            const data = await getAllPolaroids();
            setPolaroids(data);
        } catch (error) {
            console.error('Failed to load polaroids:', error);
        } finally {
            setLoading(false);
        }
    }

    const navigateMonth = (direction) => {
        const [year, month] = currentMonth.split('-').map(Number);
        const date = new Date(year, month - 1 + direction, 1);
        setCurrentMonth(`${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`);
    };

    const formatMonth = (yearMonth) => {
        const [year, month] = yearMonth.split('-');
        return `${year}年${month}月`;
    };

    // Filter polaroids by current month
    const filteredPolaroids = polaroids.filter(p => {
        const date = p.eventDate.substring(0, 7);
        return date === currentMonth;
    }).sort((a, b) => new Date(b.eventDate) - new Date(a.eventDate));

    // Get all months that have polaroids
    const availableMonths = [...new Set(polaroids.map(p => p.eventDate.substring(0, 7)))].sort().reverse();

    return (
        <div className="page animate-fade-in">
            <header className="page-header">
                <h1 className="page-title">🖼️ 相冊</h1>
                <p className="page-subtitle">按月份瀏覽拍立得</p>
            </header>

            {/* Month Navigation */}
            <div className="month-nav">
                <button onClick={() => navigateMonth(-1)}>
                    ←
                </button>
                <span className="month-display">{formatMonth(currentMonth)}</span>
                <button onClick={() => navigateMonth(1)}>
                    →
                </button>
            </div>

            {/* Quick Month Selector */}
            {availableMonths.length > 0 && (
                <div style={{
                    display: 'flex',
                    gap: 'var(--space-sm)',
                    flexWrap: 'wrap',
                    marginBottom: 'var(--space-lg)'
                }}>
                    {availableMonths.slice(0, 6).map(month => (
                        <button
                            key={month}
                            className={`btn ${month === currentMonth ? 'btn-primary' : 'btn-secondary'}`}
                            style={{ padding: 'var(--space-xs) var(--space-sm)', fontSize: '0.75rem' }}
                            onClick={() => setCurrentMonth(month)}
                        >
                            {month.replace('-', '/')}
                        </button>
                    ))}
                </div>
            )}

            {/* Polaroid Grid */}
            {loading ? (
                <div className="empty-state">
                    <p>載入中...</p>
                </div>
            ) : filteredPolaroids.length === 0 ? (
                <div className="empty-state">
                    <div className="empty-state-icon">📅</div>
                    <p>{formatMonth(currentMonth)} 沒有拍立得</p>
                </div>
            ) : (
                <>
                    <p style={{ color: 'var(--text-secondary)', marginBottom: 'var(--space-md)', fontSize: '0.875rem' }}>
                        共 {filteredPolaroids.length} 張
                    </p>
                    <div className="grid-3">
                        {filteredPolaroids.map(polaroid => (
                            <Link key={polaroid.id} to={`/detail/${polaroid.id}`} style={{ textDecoration: 'none' }}>
                                <PhotoCard polaroid={polaroid} />
                            </Link>
                        ))}
                    </div>
                </>
            )}
        </div>
    );
}
