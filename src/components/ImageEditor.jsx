import { useRef, useEffect, useState, useCallback } from 'react';

export default function ImageEditor({ imageSrc, onSave }) {
    const canvasRef = useRef(null);
    const imageRef = useRef(null);
    const [imageLoaded, setImageLoaded] = useState(false);
    const [brightness, setBrightness] = useState(100);
    const [contrast, setContrast] = useState(100);
    const [saturation, setSaturation] = useState(100);
    const [temperature, setTemperature] = useState(0);

    // Load image once
    useEffect(() => {
        if (!imageSrc) return;

        const img = new Image();
        img.crossOrigin = 'anonymous';
        img.onload = () => {
            imageRef.current = img;
            setImageLoaded(true);
        };
        img.onerror = (e) => {
            console.error('Failed to load image:', e);
        };
        img.src = imageSrc;
    }, [imageSrc]);

    // Check if canvas filter is supported (iOS Safari may not support it well)
    const supportsCanvasFilter = useCallback(() => {
        const testCanvas = document.createElement('canvas');
        const testCtx = testCanvas.getContext('2d');
        return typeof testCtx.filter !== 'undefined';
    }, []);

    // Apply filters using pixel manipulation (fallback for iOS)
    const applyPixelFilters = useCallback((ctx, width, height) => {
        const imageData = ctx.getImageData(0, 0, width, height);
        const data = imageData.data;

        const brightnessFactor = brightness / 100;
        const contrastFactor = (contrast - 100) / 100;
        const saturationFactor = saturation / 100;

        for (let i = 0; i < data.length; i += 4) {
            let r = data[i];
            let g = data[i + 1];
            let b = data[i + 2];

            // Brightness
            r *= brightnessFactor;
            g *= brightnessFactor;
            b *= brightnessFactor;

            // Contrast
            r = ((r / 255 - 0.5) * (1 + contrastFactor) + 0.5) * 255;
            g = ((g / 255 - 0.5) * (1 + contrastFactor) + 0.5) * 255;
            b = ((b / 255 - 0.5) * (1 + contrastFactor) + 0.5) * 255;

            // Saturation
            const gray = 0.299 * r + 0.587 * g + 0.114 * b;
            r = gray + saturationFactor * (r - gray);
            g = gray + saturationFactor * (g - gray);
            b = gray + saturationFactor * (b - gray);

            // Temperature (shift towards warm/cool)
            if (temperature > 0) {
                r += temperature * 2;
                b -= temperature * 2;
            } else {
                r += temperature * 2;
                b -= temperature * 2;
            }

            // Clamp values
            data[i] = Math.max(0, Math.min(255, r));
            data[i + 1] = Math.max(0, Math.min(255, g));
            data[i + 2] = Math.max(0, Math.min(255, b));
        }

        ctx.putImageData(imageData, 0, 0);
    }, [brightness, contrast, saturation, temperature]);

    // Apply filters
    const applyFilters = useCallback(() => {
        if (!imageLoaded || !canvasRef.current || !imageRef.current) return;

        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');
        const img = imageRef.current;

        // Set canvas size
        const maxWidth = Math.min(400, window.innerWidth - 32);
        const ratio = Math.min(maxWidth / img.width, 1);
        canvas.width = img.width * ratio;
        canvas.height = img.height * ratio;

        // Clear canvas
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        // Try CSS filter first (faster if supported)
        const useCSS = supportsCanvasFilter() && typeof ctx.filter === 'string';

        if (useCSS) {
            let filterStr = `brightness(${brightness}%) contrast(${contrast}%) saturate(${saturation}%)`;
            if (temperature !== 0) {
                filterStr += ` hue-rotate(${-temperature}deg)`;
            }
            ctx.filter = filterStr;
            ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        } else {
            // Fallback: draw image first, then apply pixel manipulation
            ctx.filter = 'none';
            ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
            applyPixelFilters(ctx, canvas.width, canvas.height);
        }
    }, [imageLoaded, brightness, contrast, saturation, temperature, supportsCanvasFilter, applyPixelFilters]);

    useEffect(() => {
        applyFilters();
    }, [applyFilters]);

    const handleSave = () => {
        if (!canvasRef.current) return;
        applyFilters();
        const dataUrl = canvasRef.current.toDataURL('image/jpeg', 0.92);
        onSave?.(dataUrl, { brightness, contrast, saturation, temperature });
    };

    const handleReset = () => {
        setBrightness(100);
        setContrast(100);
        setSaturation(100);
        setTemperature(0);
    };

    return (
        <div>
            <div style={{
                width: '100%',
                borderRadius: 'var(--radius-lg)',
                overflow: 'hidden',
                marginBottom: 'var(--space-lg)',
                boxShadow: 'var(--shadow-md)'
            }}>
                {!imageLoaded ? (
                    <div style={{
                        padding: 'var(--space-xl)',
                        textAlign: 'center',
                        color: 'var(--text-muted)'
                    }}>
                        載入中...
                    </div>
                ) : (
                    <canvas
                        ref={canvasRef}
                        style={{
                            width: '100%',
                            height: 'auto',
                            display: 'block'
                        }}
                    />
                )}
            </div>

            <div style={{ marginTop: 'var(--space-lg)' }}>
                {/* 亮度 */}
                <div style={{ marginBottom: 'var(--space-lg)' }}>
                    <div style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        marginBottom: 'var(--space-sm)',
                        fontSize: '0.875rem'
                    }}>
                        <span style={{ fontWeight: 600, color: 'var(--text-secondary)' }}>亮度</span>
                        <span style={{
                            color: brightness !== 100 ? 'var(--primary)' : 'var(--text-muted)',
                            fontWeight: brightness !== 100 ? 600 : 400
                        }}>
                            {brightness}%
                        </span>
                    </div>
                    <input
                        type="range"
                        min={50}
                        max={150}
                        value={brightness}
                        onChange={(e) => setBrightness(parseInt(e.target.value, 10))}
                        style={{
                            width: '100%',
                            height: '12px',
                            WebkitAppearance: 'none',
                            appearance: 'none',
                            background: 'hsla(158, 64%, 42%, 0.15)',
                            borderRadius: '9999px',
                            outline: 'none',
                            cursor: 'pointer'
                        }}
                    />
                </div>

                {/* 對比度 */}
                <div style={{ marginBottom: 'var(--space-lg)' }}>
                    <div style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        marginBottom: 'var(--space-sm)',
                        fontSize: '0.875rem'
                    }}>
                        <span style={{ fontWeight: 600, color: 'var(--text-secondary)' }}>對比度</span>
                        <span style={{
                            color: contrast !== 100 ? 'var(--primary)' : 'var(--text-muted)',
                            fontWeight: contrast !== 100 ? 600 : 400
                        }}>
                            {contrast}%
                        </span>
                    </div>
                    <input
                        type="range"
                        min={50}
                        max={150}
                        value={contrast}
                        onChange={(e) => setContrast(parseInt(e.target.value, 10))}
                        style={{
                            width: '100%',
                            height: '12px',
                            WebkitAppearance: 'none',
                            appearance: 'none',
                            background: 'hsla(158, 64%, 42%, 0.15)',
                            borderRadius: '9999px',
                            outline: 'none',
                            cursor: 'pointer'
                        }}
                    />
                </div>

                {/* 飽和度 */}
                <div style={{ marginBottom: 'var(--space-lg)' }}>
                    <div style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        marginBottom: 'var(--space-sm)',
                        fontSize: '0.875rem'
                    }}>
                        <span style={{ fontWeight: 600, color: 'var(--text-secondary)' }}>飽和度</span>
                        <span style={{
                            color: saturation !== 100 ? 'var(--primary)' : 'var(--text-muted)',
                            fontWeight: saturation !== 100 ? 600 : 400
                        }}>
                            {saturation}%
                        </span>
                    </div>
                    <input
                        type="range"
                        min={0}
                        max={200}
                        value={saturation}
                        onChange={(e) => setSaturation(parseInt(e.target.value, 10))}
                        style={{
                            width: '100%',
                            height: '12px',
                            WebkitAppearance: 'none',
                            appearance: 'none',
                            background: 'hsla(158, 64%, 42%, 0.15)',
                            borderRadius: '9999px',
                            outline: 'none',
                            cursor: 'pointer'
                        }}
                    />
                </div>

                {/* 色溫 */}
                <div style={{ marginBottom: 'var(--space-lg)' }}>
                    <div style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        marginBottom: 'var(--space-sm)',
                        fontSize: '0.875rem'
                    }}>
                        <span style={{ fontWeight: 600, color: 'var(--text-secondary)' }}>色溫</span>
                        <span style={{
                            color: temperature !== 0 ? 'var(--primary)' : 'var(--text-muted)',
                            fontWeight: temperature !== 0 ? 600 : 400
                        }}>
                            {temperature}°
                        </span>
                    </div>
                    <input
                        type="range"
                        min={-30}
                        max={30}
                        value={temperature}
                        onChange={(e) => setTemperature(parseInt(e.target.value, 10))}
                        style={{
                            width: '100%',
                            height: '12px',
                            WebkitAppearance: 'none',
                            appearance: 'none',
                            background: 'hsla(158, 64%, 42%, 0.15)',
                            borderRadius: '9999px',
                            outline: 'none',
                            cursor: 'pointer'
                        }}
                    />
                </div>
            </div>

            <div style={{ display: 'flex', gap: 'var(--space-md)', marginTop: 'var(--space-lg)' }}>
                <button className="btn btn-secondary" onClick={handleReset} style={{ flex: 1 }}>
                    重置
                </button>
                <button className="btn btn-primary" onClick={handleSave} style={{ flex: 2 }}>
                    確認調整
                </button>
            </div>
        </div>
    );
}
