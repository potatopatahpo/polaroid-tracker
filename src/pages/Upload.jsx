import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import ImageCropper from '../components/ImageCropper';
import ImageEditor from '../components/ImageEditor';
import CameraScanner from '../components/CameraScanner';

export default function Upload() {
    const [step, setStep] = useState('select'); // select, scanner, crop, edit
    const [imageData, setImageData] = useState(null);
    const [croppedImageData, setCroppedImageData] = useState(null);
    const [instaxFormat, setInstaxFormat] = useState('mini');
    const fileInputRef = useRef(null);
    const navigate = useNavigate();

    const handleFileSelect = (e) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (event) => {
                setImageData(event.target.result);
                setStep('crop');
            };
            reader.readAsDataURL(file);
        }
    };

    const handleCameraStart = () => {
        setStep('scanner');
    };

    const handleCapture = (dataUrl, format) => {
        setImageData(dataUrl);
        setInstaxFormat(format);
        setStep('crop');
    };

    const handleScannerCancel = () => {
        setStep('select');
    };

    const handleCropComplete = (croppedData, format) => {
        setCroppedImageData(croppedData);
        setInstaxFormat(format);
        setStep('edit');
    };

    const handleCropCancel = () => {
        setImageData(null);
        setStep('select');
    };

    const handleImageSave = (dataUrl) => {
        navigate('/form', {
            state: {
                imageData: dataUrl,
                instaxFormat
            }
        });
    };

    const handleSkipEdit = () => {
        navigate('/form', {
            state: {
                imageData: croppedImageData || imageData,
                instaxFormat
            }
        });
    };

    const handleBack = () => {
        if (step === 'edit') {
            setStep('crop');
        } else if (step === 'crop') {
            setStep('select');
            setImageData(null);
        } else if (step === 'scanner') {
            setStep('select');
        }
    };

    return (
        <div className="page animate-fade-in">
            <header className="page-header">
                {step !== 'select' && step !== 'scanner' && (
                    <button
                        onClick={handleBack}
                        style={{
                            position: 'absolute',
                            left: 'var(--space-lg)',
                            top: 'var(--space-lg)',
                            background: 'none',
                            border: 'none',
                            color: 'var(--primary)',
                            fontSize: '1rem',
                            cursor: 'pointer'
                        }}
                    >
                        ← 返回
                    </button>
                )}
                <h1 className="page-title">📷 新增拍立得</h1>
                <p className="page-subtitle">
                    {step === 'select' && '選擇或拍攝照片'}
                    {step === 'scanner' && '對準框內拍攝'}
                    {step === 'crop' && '裁剪照片'}
                    {step === 'edit' && '調整照片'}
                </p>
            </header>

            {step === 'select' && (
                <div style={{ padding: '0 var(--space-lg)' }}>
                    <div
                        className="upload-area"
                        onClick={() => fileInputRef.current?.click()}
                        style={{ marginBottom: 'var(--space-lg)', padding: 'var(--space-xl)' }}
                    >
                        <div className="upload-icon" style={{ fontSize: '3rem', marginBottom: 'var(--space-md)' }}>📁</div>
                        <div style={{ fontWeight: 600, fontSize: '1.1rem', marginBottom: 'var(--space-xs)' }}>
                            從相簿選擇
                        </div>
                        <div style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>
                            選擇已有的拍立得照片
                        </div>
                    </div>

                    <div
                        className="upload-area"
                        onClick={handleCameraStart}
                        style={{ padding: 'var(--space-xl)', border: '2px dashed var(--primary)', background: 'hsla(158, 64%, 42%, 0.05)' }}
                    >
                        <div className="upload-icon" style={{ fontSize: '3rem', marginBottom: 'var(--space-md)' }}>📸</div>
                        <div style={{ fontWeight: 600, fontSize: '1.1rem', marginBottom: 'var(--space-xs)', color: 'var(--primary)' }}>
                            智慧掃描儀
                        </div>
                        <div style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>
                            顯示輔助框，精準對焦拍攝
                        </div>
                    </div>

                    <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        onChange={handleFileSelect}
                        style={{ display: 'none' }}
                    />
                </div>
            )}

            {step === 'scanner' && (
                <CameraScanner onCapture={handleCapture} onCancel={handleScannerCancel} />
            )}

            {step === 'crop' && imageData && (
                <ImageCropper
                    imageSrc={imageData}
                    onCrop={handleCropComplete}
                    onCancel={handleCropCancel}
                />
            )}

            {step === 'edit' && croppedImageData && (
                <div style={{ padding: '0 var(--space-lg)' }}>
                    <ImageEditor imageSrc={croppedImageData} onSave={handleImageSave} />
                    <button
                        className="btn btn-secondary"
                        onClick={handleSkipEdit}
                        style={{ width: '100%', marginTop: 'var(--space-md)', padding: 'var(--space-md)' }}
                    >
                        跳過調整，直接存檔
                    </button>
                </div>
            )}
        </div>
    );
}

