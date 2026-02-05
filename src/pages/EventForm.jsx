import { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { addPolaroid } from '../db/database';

export default function EventForm() {
    const location = useLocation();
    const navigate = useNavigate();
    const { imageData, format } = location.state || {};

    const [formData, setFormData] = useState({
        idolName: '',
        groupName: '',
        eventName: '',
        eventDate: new Date().toISOString().substring(0, 10),
        eventLocation: '',
        repo: ''
    });

    const [isSaving, setIsSaving] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!formData.idolName) {
            alert('請填寫偶像姓名');
            return;
        }

        setIsSaving(true);
        try {
            await addPolaroid({
                ...formData,
                imageData,
                format
            });
            navigate('/');
        } catch (error) {
            console.error('Save failed:', error);
            alert('儲存失敗');
        } finally {
            setIsSaving(false);
        }
    };

    if (!imageData) {
        navigate('/upload');
        return null;
    }

    return (
        <div className="page animate-fade-in">
            <header className="page-header">
                <h1 className="page-title">📝 填寫資訊</h1>
            </header>

            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-md)' }}>
                <div className="card" style={{ marginBottom: 'var(--space-md)', padding: 0, overflow: 'hidden' }}>
                    <img src={imageData} alt="Captured" style={{ width: '100%', maxHeight: '200px', objectFit: 'contain', background: '#f5f5f5' }} />
                </div>

                <div className="form-group">
                    <label className="label">偶像姓名 *</label>
                    <input type="text" className="input" value={formData.idolName} onChange={e => setFormData({ ...formData, idolName: e.target.value })} placeholder="例如：張員瑛" required />
                </div>

                <div className="form-group">
                    <label className="label">所屬團體</label>
                    <input type="text" className="input" value={formData.groupName} onChange={e => setFormData({ ...formData, groupName: e.target.value })} placeholder="例如：IVE" />
                </div>

                <div className="form-group">
                    <label className="label">活動名稱</label>
                    <input type="text" className="input" value={formData.eventName} onChange={e => setFormData({ ...formData, eventName: e.target.value })} placeholder="例如：簽售會 / 演唱會" />
                </div>

                <div className="form-group">
                    <label className="label">日期</label>
                    <input type="date" className="input" value={formData.eventDate} onChange={e => setFormData({ ...formData, eventDate: e.target.value })} />
                </div>

                <div className="form-group">
                    <label className="label">地點</label>
                    <input type="text" className="input" value={formData.eventLocation} onChange={e => setFormData({ ...formData, eventLocation: e.target.value })} placeholder="例如：首爾 / 台北" />
                </div>

                <div style={{ display: 'flex', gap: 'var(--space-sm)', marginTop: 'var(--space-xl)' }}>
                    <button type="button" className="btn btn-secondary" onClick={() => navigate(-1)} style={{ flex: 1 }}>返回</button>
                    <button type="submit" className="btn btn-primary" disabled={isSaving} style={{ flex: 2 }}>{isSaving ? '儲存中...' : '確認儲存'}</button>
                </div>
            </form>
        </div>
    );
}
