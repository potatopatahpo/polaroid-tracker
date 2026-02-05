import { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { addPolaroid } from '../db/database';

export default function EventForm() {
    const location = useLocation();
    const navigate = useNavigate();
    const imageData = location.state?.imageData;
    const editData = location.state?.editData;

    const [formData, setFormData] = useState({
        idolName: editData?.idolName || '',
        groupName: editData?.groupName || '',
        eventName: editData?.eventName || '',
        eventDate: editData?.eventDate?.substring(0, 10) || new Date().toISOString().substring(0, 10),
        eventLocation: editData?.eventLocation || '',
        repo: editData?.repo || ''
    });
    const [saving, setSaving] = useState(false);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!formData.idolName || !formData.groupName) {
            alert('請填寫偶像名字和團體');
            return;
        }

        setSaving(true);
        try {
            await addPolaroid({
                imageData,
                ...formData,
                eventDate: new Date(formData.eventDate).toISOString()
            });
            navigate('/', { replace: true });
        } catch (error) {
            console.error('Failed to save:', error);
            alert('保存失敗，請重試');
        } finally {
            setSaving(false);
        }
    };

    if (!imageData) {
        return (
            <div className="page">
                <div className="empty-state">
                    <div className="empty-state-icon">⚠️</div>
                    <p>請先選擇照片</p>
                    <button
                        className="btn btn-primary"
                        onClick={() => navigate('/upload')}
                        style={{ marginTop: 'var(--space-md)' }}
                    >
                        選擇照片
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="page animate-fade-in">
            <header className="page-header">
                <h1 className="page-title">📝 登錄資料</h1>
                <p className="page-subtitle">填寫拍立得的相關資訊</p>
            </header>

            {/* Image Preview */}
            <div className="image-preview" style={{ marginBottom: 'var(--space-xl)' }}>
                <img src={imageData} alt="Preview" style={{ width: '100%', borderRadius: 'var(--radius-md)' }} />
            </div>

            <form onSubmit={handleSubmit}>
                <div className="form-group">
                    <label className="label">偶像名字 *</label>
                    <input
                        type="text"
                        name="idolName"
                        className="input"
                        placeholder="例：田中美久"
                        value={formData.idolName}
                        onChange={handleChange}
                        required
                    />
                </div>

                <div className="form-group">
                    <label className="label">所屬團體 *</label>
                    <input
                        type="text"
                        name="groupName"
                        className="input"
                        placeholder="例：HKT48"
                        value={formData.groupName}
                        onChange={handleChange}
                        required
                    />
                </div>

                <div className="form-group">
                    <label className="label">Event 名稱</label>
                    <input
                        type="text"
                        name="eventName"
                        className="input"
                        placeholder="例：握手會"
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
                            placeholder="例：東京"
                            value={formData.eventLocation}
                            onChange={handleChange}
                        />
                    </div>
                </div>

                <div className="form-group">
                    <label className="label">💬 對話記錄 / 備註</label>
                    <textarea
                        name="repo"
                        className="textarea"
                        placeholder="記錄與偶像的對話內容..."
                        value={formData.repo}
                        onChange={handleChange}
                        rows={4}
                    />
                </div>

                <button
                    type="submit"
                    className="btn btn-primary"
                    style={{ width: '100%', marginTop: 'var(--space-md)' }}
                    disabled={saving}
                >
                    {saving ? '保存中...' : '💾 保存拍立得'}
                </button>
            </form>
        </div>
    );
}
