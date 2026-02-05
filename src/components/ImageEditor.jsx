import { useState } from 'react';

export default function ImageEditor({ imageSrc, onSave, onCancel }) {
    const [filters, setFilters] = useState({
        brightness: 100,
        contrast: 100,
        saturate: 100,
        temperature: 0
    });

    return (
        <div className="page animate-fade-in">
            <header className="page-header"><h1 className="page-title">✨ 修圖優化</h1></header>

            <div className="card" style={{ padding: 'var(--space-md)', background: '#f0f0f0', marginBottom: 'var(--space-xl)' }}>
                <img
                    src={imageSrc}
                    alt="To edit"
                    style={{
                        width: '100%',
                        filter: `brightness(${filters.brightness}%) contrast(${filters.contrast}%) saturate(${filters.saturate}%) hue-rotate(${filters.temperature}deg)`
                    }}
                />
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-md)' }}>
                <div className="form-group">
                    <label className="label">亮度 {filters.brightness}%</label>
                    <input type="range" min="50" max="150" value={filters.brightness} onChange={e => setFilters({ ...filters, brightness: e.target.value })} style={{ width: '100%' }} />
                </div>
                <div className="form-group">
                    <label className="label">對比 {filters.contrast}%</label>
                    <input type="range" min="50" max="150" value={filters.contrast} onChange={e => setFilters({ ...filters, contrast: e.target.value })} style={{ width: '100%' }} />
                </div>
            </div>

            <div style={{ display: 'flex', gap: 'var(--space-sm)', marginTop: 'var(--space-xl)' }}>
                <button className="btn btn-secondary" onClick={onCancel} style={{ flex: 1 }}>返回</button>
                <button className="btn btn-primary" onClick={() => onSave(imageSrc)} style={{ flex: 2 }}>接著填寫資料</button>
            </div>
        </div>
    );
}
