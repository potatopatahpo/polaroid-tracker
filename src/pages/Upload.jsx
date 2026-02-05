import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import ImageCropper from '../components/ImageCropper';
import ImageEditor from '../components/ImageEditor';

export default function Upload() {
    const [step, setStep] = useState('select'); // select, crop, edit
    const [imageData, setImageData] = useState(null);
    const [croppedImageData, setCroppedImageData] = useState(null);
    const [instaxFormat, setInstaxFormat] = useState('mini');
    const fileInputRef = useRef(null);
    const cameraInputRef = useRef(null);
    const navigate = useNavigate();

    const handleFileSelect = (e) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (event) => {
                setImageData(event.target.result);
                setStep('crop');
            };
            reader.readAsDataURL(file);
        }
    };

    const handleNext = () => {
        navigate('/event-form', {
            state: {
                imageData: croppedImageData,
                format: instaxFormat
            }
        });
    };

    if (step === 'crop') {
        return (
            <ImageCropper
                imageSrc={imageData}
                onCrop={(cropped) => {
                    setCroppedImageData(cropped);
                    setStep('edit');
                }}
                onCancel={() => setStep('select')}
                initialFormat={instaxFormat}
            />
        );
    }

    if (step === 'edit') {
        return (
            <ImageEditor
                imageSrc={croppedImageData}
                onSave={(edited) => {
                    setCroppedImageData(edited);
                    handleNext();
                }}
                onCancel={() => setStep('crop')}
            />
        );
    }

    return (
        <div className="page animate-fade-in">
            <header className="page-header">
                <h1 className="page-title">📸 新增拍立得</h1>
                <p className="page-subtitle">選擇照片或直接拍攝</p>
            </header>

            <div className="upload-options" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-lg)', marginTop: 'var(--space-xl)' }}>
                {/* Custom Camera Button */}
                <button
                    className="btn btn-primary"
                    onClick={() => cameraInputRef.current?.click()}
                    style={{
                        height: '160px',
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'center',
                        alignItems: 'center',
                        fontSize: '1.25rem',
                        gap: 'var(--space-md)',
                        borderRadius: 'var(--radius-xl)',
                        boxShadow: 'var(--shadow-lg)'
                    }}
                >
                    <span style={{ fontSize: '3rem' }}>📷</span>
                    直接拍攝
                </button>

                <div style={{ display: 'flex', gap: 'var(--space-md)' }}>
                    <button
                        className="btn btn-secondary"
                        onClick={() => fileInputRef.current?.click()}
                        style={{
                            flex: 1,
                            height: '120px',
                            display: 'flex',
                            flexDirection: 'column',
                            justifyContent: 'center',
                            alignItems: 'center',
                            borderRadius: 'var(--radius-lg)'
                        }}
                    >
                        <span style={{ fontSize: '2rem', marginBottom: 'var(--space-xs)' }}>🖼️</span>
                        相簿開發
                    </button>
                </div>
            </div>

            {/* Hidden Inputs */}
            <input
                type="file"
                ref={cameraInputRef}
                accept="image/*"
                capture="environment"
                onChange={handleFileSelect}
                style={{ display: 'none' }}
            />
            <input
                type="file"
                ref={fileInputRef}
                accept="image/*"
                onChange={handleFileSelect}
                style={{ display: 'none' }}
            />

            <div style={{ marginTop: 'var(--space-2xl)', padding: 'var(--space-lg)', background: 'var(--card-bg)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border-color)' }}>
                <h3 style={{ fontSize: '1rem', marginBottom: 'var(--space-sm)' }}>💡 小提示</h3>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', lineHeight: '1.5' }}>
                    拍完照後，系統會引導您對齊拍立得的邊框（有綠色虛線輔助），並自動校正角度。
                </p>
            </div>
        </div>
    );
}
