import { useState, useRef, useEffect } from 'react';

const INSTAX_FORMATS = {
    mini: { name: 'Instax Mini', ratio: 54 / 86 },
    square: { name: 'Instax Square', ratio: 1 },
    wide: { name: 'Instax Wide', ratio: 99 / 62 },
};

export default function CameraScanner({ onCapture, onCancel }) {
    const videoRef = useRef(null);
    const [format, setFormat] = useState('mini');
    const [stream, setStream] = useState(null);
    const [error, setError] = useState(null);
    const [isCapturing, setIsCapturing] = useState(false);
    const [isInsecure, setIsInsecure] = useState(false);
    const fallbackInputRef = useRef(null);

    useEffect(() => {
        if (!window.isSecureContext && window.location.hostname !== 'localhost') {
            setIsInsecure(true);
            setError('瀏覽器安全性限制：在連結為 HTTP（非 https）時無法開啟自定義相機鏡頭。');
        } else {
            startCamera();
        }

        return () => {
            if (stream) {
                stream.getTracks().forEach(track => track.stop());
            }
        };
    }, []);

    const startCamera = async () => {
        if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
            setError('您的瀏覽器不支援相機讀取功能。');
            return;
        }

        try {
            const mediaStream = await navigator.mediaDevices.getUserMedia({
                video: {
                    facingMode: 'environment',
                    width: { ideal: 1920 },
                    height: { ideal: 1080 }
                },
                audio: false
            });
            setStream(mediaStream);
            if (videoRef.current) {
                videoRef.current.srcObject = mediaStream;
            }
        } catch (err) {
            console.error('Camera access error:', err);
            if (err.name === 'NotAllowedError') {
                setError('相機權限被拒絕，請在手機系統或瀏覽器設定中允許此網站存取相機。');
            } else {
                setError('無法啟動相機：' + err.message);
            }
        }
    };

    const capturePhoto = () => {
        if (!videoRef.current || isCapturing) return;
        setIsCapturing(true);

        const video = videoRef.current;
        const canvas = document.createElement('canvas');
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;

        const ctx = canvas.getContext('2d');
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

        const imageData = canvas.toDataURL('image/jpeg', 0.95);
        onCapture(imageData, format);
        setIsCapturing(false);
    };

    const handleFallbackCapture = (e) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (event) => {
                onCapture(event.target.result, format);
            };
            reader.readAsDataURL(file);
        }
    };

    if (error) {
        return (
            <div className="camera-scanner" style={{
                position: 'fixed',
                inset: 0,
                backgroundColor: '#111',
                zIndex: 1000,
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
                alignItems: 'center',
                padding: 'var(--space-xl)',
                textAlign: 'center'
            }}>
                <div style={{ fontSize: '3rem', marginBottom: 'var(--space-md)' }}>🚫</div>
                <div style={{
                    color: '#fff',
                    marginBottom: 'var(--space-lg)',
                    fontSize: '1rem',
                    lineHeight: 1.6,
                    maxWidth: '300px'
                }}>
                    {error}
                </div>

                {isInsecure && (
                    <div style={{
                        background: 'rgba(255,255,255,0.08)',
                        padding: 'var(--space-md)',
                        borderRadius: 'var(--radius-md)',
                        fontSize: '0.825rem',
                        color: '#ccc',
                        marginBottom: 'var(--space-xl)',
                        textAlign: 'left',
                        borderLeft: '4px solid var(--primary)'
                    }}>
                        <p style={{ marginBottom: '8px', color: '#fff', fontWeight: 'bold' }}>為何無法使用？</p>
                        <p>因為目前連線為不安全的 HTTP，手機瀏覽器為了隱私會封裝相機功能。</p>
                        <p style={{ marginTop: '8px' }}>您可以：</p>
                        <ul style={{ paddingLeft: '16px', marginTop: '4px' }}>
                            <li>點擊下方按鈕使用系統相機（無輔助框）</li>
                            <li>或使用更安全的連線 (HTTPS)</li>
                        </ul>
                    </div>
                )}

                <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-md)', width: '100%', maxWidth: '300px' }}>
                    <button
                        className="btn btn-primary"
                        onClick={() => fallbackInputRef.current?.click()}
                        style={{ width: '100%', padding: 'var(--space-md)', fontSize: '1rem', background: 'var(--primary)', border: 'none' }}
                    >
                        📸 使用系統相機直接拍攝
                    </button>
                    <button
                        className="btn btn-secondary"
                        onClick={onCancel}
                        style={{ width: '100%', padding: 'var(--space-sm)', background: 'transparent', border: '1px solid #444', color: '#888' }}
                    >
                        取消並返回
                    </button>
                </div>

                <input
                    ref={fallbackInputRef}
                    type="file"
                    accept="image/*"
                    capture="environment"
                    onChange={handleFallbackCapture}
                    style={{ display: 'none' }}
                />
            </div>
        );
    }

    return (
        <div className="camera-scanner" style={{ position: 'fixed', inset: 0, backgroundColor: '#000', zIndex: 1000, display: 'flex', flexDirection: 'column' }}>
            <div style={{ position: 'absolute', top: 0, left: 0, right: 0, padding: 'var(--space-lg)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', zIndex: 10, background: 'linear-gradient(to bottom, rgba(0,0,0,0.7), transparent)' }}>
                <button
                    onClick={onCancel}
                    style={{ background: 'none', border: 'none', color: '#fff', fontSize: '1.5rem', cursor: 'pointer', padding: 'var(--space-sm)' }}
                >
                    ✕
                </button>
                <div style={{ color: '#fff', fontWeight: 600 }}>智慧輔助掃描</div>
                <div style={{ width: '40px' }}></div>
            </div>

            <div style={{ flex: 1, position: 'relative', overflow: 'hidden' }}>
                <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    muted
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                />
            </div>

            <div style={{ backgroundColor: '#111', padding: 'var(--space-xl) var(--space-lg)', display: 'flex', flexDirection: 'column', gap: 'var(--space-lg)', alignItems: 'center' }}>
                <div style={{ display: 'flex', gap: 'var(--space-sm)', width: '100%', maxWidth: '300px' }}>
                    {Object.entries(INSTAX_FORMATS).map(([key, info]) => (
                        <button
                            key={key}
                            className={`btn ${format === key ? 'btn-primary' : 'btn-secondary'}`}
                            onClick={() => setFormat(key)}
                            style={{ flex: 1, padding: 'var(--space-sm)', fontSize: '0.75rem', background: format === key ? 'var(--primary)' : '#222', borderColor: '#333' }}
                        >
                            {info.name.replace('Instax ', '')}
                        </button>
                    ))}
                </div>

                <button
                    onClick={capturePhoto}
                    disabled={!stream || isCapturing}
                    style={{
                        width: '70px',
                        height: '70px',
                        borderRadius: '50%',
                        backgroundColor: '#fff',
                        border: '8px solid rgba(255,255,255,0.2)',
                        padding: 0,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                    }}
                >
                    <div style={{ width: '50px', height: '50px', borderRadius: '50%', backgroundColor: isCapturing ? 'var(--primary)' : '#fff', border: '2px solid #000' }}></div>
                </button>
            </div>
        </div>
    );
}
