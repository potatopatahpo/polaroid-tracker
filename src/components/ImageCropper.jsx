import { useState, useRef, useEffect, useCallback } from 'react';

// Instax format dimensions - Mini is PORTRAIT (taller than wide)
const INSTAX_FORMATS = {
    mini: { name: 'Instax Mini', width: 54, height: 86, ratio: 54 / 86 },
    square: { name: 'Instax Square', width: 62, height: 62, ratio: 1 },
    wide: { name: 'Instax Wide', width: 99, height: 62, ratio: 99 / 62 },
};

export default function ImageCropper({ imageSrc, onCrop, onCancel }) {
    const containerRef = useRef(null);
    const imageRef = useRef(null);
    const [format, setFormat] = useState('mini');
    const [imageLoaded, setImageLoaded] = useState(false);
    const [containerSize, setContainerSize] = useState({ width: 0, height: 0 });
    const [imageDimensions, setImageDimensions] = useState({ width: 0, height: 0 });

    // Four corner points for perspective correction (percentage of container)
    const [corners, setCorners] = useState({
        topLeft: { x: 25, y: 15 },
        topRight: { x: 75, y: 15 },
        bottomRight: { x: 75, y: 85 },
        bottomLeft: { x: 25, y: 85 }
    });

    const [draggingCorner, setDraggingCorner] = useState(null);
    const [rotation, setRotation] = useState(0);
    const [isDetecting, setIsDetecting] = useState(false);

    // Initial load
    useEffect(() => {
        if (!imageSrc) return;

        const img = new Image();
        img.crossOrigin = 'anonymous';
        img.onload = () => {
            imageRef.current = img;
            setImageDimensions({ width: img.width, height: img.height });
            setImageLoaded(true);
            // Auto detect after a short delay for container size to be ready
            setTimeout(() => autoDetect(), 500);
        };
        img.src = imageSrc;
    }, [imageSrc]);

    // Update container size
    useEffect(() => {
        if (!containerRef.current) return;

        const updateSize = () => {
            const rect = containerRef.current.getBoundingClientRect();
            setContainerSize({ width: rect.width, height: rect.height });
        };

        updateSize();
        window.addEventListener('resize', updateSize);
        return () => window.removeEventListener('resize', updateSize);
    }, []);

    // When format changes, reset corners to match target aspect ratio (as a guide)
    useEffect(() => {
        if (!imageLoaded || isDetecting) return;

        const f = INSTAX_FORMATS[format];
        const margin = 15;
        let w, h;

        if (f.ratio < 1) { // Portrait (Mini)
            h = 100 - (margin * 2);
            w = h * f.ratio;
        } else { // Square or Wide
            w = 100 - (margin * 2);
            h = w / f.ratio;
        }

        const x = (100 - w) / 2;
        const y = (100 - h) / 2;

        // Only update if not already adjusted significantly? 
        // Actually, let's update to provide feedback to user
        setCorners({
            topLeft: { x: x, y: y },
            topRight: { x: x + w, y: y },
            bottomRight: { x: x + w, y: y + h },
            bottomLeft: { x: x, y: y + h }
        });
    }, [format, imageLoaded]);

    const handleCornerDragStart = (cornerName, e) => {
        e.preventDefault();
        e.stopPropagation();
        setDraggingCorner(cornerName);
    };

    const handleDragMove = useCallback((e) => {
        if (!draggingCorner || !containerRef.current) return;

        const rect = containerRef.current.getBoundingClientRect();
        const clientX = e.touches ? e.touches[0].clientX : e.clientX;
        const clientY = e.touches ? e.touches[0].clientY : e.clientY;

        const x = Math.max(0, Math.min(100, ((clientX - rect.left) / rect.width) * 100));
        const y = Math.max(0, Math.min(100, ((clientY - rect.top) / rect.height) * 100));

        setCorners(prev => ({
            ...prev,
            [draggingCorner]: { x, y }
        }));
    }, [draggingCorner]);

    const handleDragEnd = () => {
        setDraggingCorner(null);
    };

    useEffect(() => {
        if (draggingCorner) {
            window.addEventListener('mousemove', handleDragMove);
            window.addEventListener('mouseup', handleDragEnd);
            window.addEventListener('touchmove', handleDragMove, { passive: false });
            window.addEventListener('touchend', handleDragEnd);
        }
        return () => {
            window.removeEventListener('mousemove', handleDragMove);
            window.removeEventListener('mouseup', handleDragEnd);
            window.removeEventListener('touchmove', handleDragMove);
            window.removeEventListener('touchend', handleDragEnd);
        };
    }, [draggingCorner, handleDragMove]);

    // Homography Matrix math for perspective
    const getHomographyMatrix = (w, h, p) => {
        const A = [
            [0, 0, 1, 0, 0, 0, 0, 0],
            [w, 0, 1, 0, 0, 0, -w * p[1].x, 0],
            [w, h, 1, 0, 0, 0, -w * p[2].x, -h * p[2].x],
            [0, h, 1, 0, 0, 0, 0, -h * p[3].x],
            [0, 0, 0, 0, 0, 1, 0, 0],
            [0, 0, 0, w, 0, 1, 0, -w * p[1].y],
            [0, 0, 0, w, h, 1, -w * p[2].y, -h * p[2].y],
            [0, 0, 0, 0, h, 1, 0, -h * p[3].y]
        ];
        const b = [p[0].x, p[1].x, p[2].x, p[3].x, p[0].y, p[1].y, p[2].y, p[3].y];

        const solve = (A, b) => {
            const n = b.length;
            for (let i = 0; i < n; i++) {
                let max = i;
                for (let j = i + 1; j < n; j++) if (Math.abs(A[j][i]) > Math.abs(A[max][i])) max = j;
                [A[i], A[max]] = [A[max], A[i]];
                [b[i], b[max]] = [b[max], b[i]];
                for (let j = i + 1; j < n; j++) {
                    const f = A[j][i] / A[i][i];
                    b[j] -= f * b[i];
                    for (let k = i; k < n; k++) A[j][k] -= f * A[i][k];
                }
            }
            const x = new Array(n);
            for (let i = n - 1; i >= 0; i--) {
                let s = 0;
                for (let j = i + 1; j < n; j++) s += A[i][j] * x[j];
                x[i] = (b[i] - s) / A[i][i];
            }
            return x;
        };
        return solve(A, b);
    };

    // Robust Polaroid Detection
    const autoDetect = () => {
        if (!imageRef.current || !containerRef.current) return;
        setIsDetecting(true);
        const img = imageRef.current;
        const canvas = document.createElement('canvas');
        const processingScale = 0.2;
        canvas.width = img.width * processingScale;
        canvas.height = img.height * processingScale;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const data = imageData.data;
        const w = canvas.width;
        const h = canvas.height;

        // 1. Dynamic Thresholding: Find the brightness of the top ~15% pixels
        const brightnessValues = new Uint8Array(w * h);
        for (let i = 0; i < data.length; i += 4) {
            brightnessValues[i / 4] = (data[i] * 0.299 + data[i + 1] * 0.587 + data[i + 2] * 0.114);
        }

        // Sample brightness to find a dynamic threshold
        const samples = [...brightnessValues].filter((_, i) => i % 10 === 0).sort((a, b) => b - a);
        const topBright = samples[Math.floor(samples.length * 0.15)] || 200;
        const threshold = Math.max(150, Math.min(235, topBright - 20)); // Adaptive logic

        const whitePixels = new Uint8Array(w * h);
        for (let i = 0; i < w * h; i++) {
            // Simple noise reduction: must be brighter than threshold
            if (brightnessValues[i] > threshold) {
                whitePixels[i] = 1;
            }
        }

        // 2. Find the largest connected component (simple 4-neighborhood)
        let maxComponent = [];
        const visited = new Uint8Array(w * h);

        for (let i = 0; i < w * h; i++) {
            if (whitePixels[i] === 1 && !visited[i]) {
                const component = [];
                const stack = [i];
                visited[i] = 1;
                while (stack.length > 0) {
                    const curr = stack.pop();
                    component.push(curr);
                    const cx = curr % w;
                    const cy = Math.floor(curr / w);

                    const neighbors = [
                        [cx + 1, cy], [cx - 1, cy], [cx, cy + 1], [cx, cy - 1]
                    ];
                    for (const [nx, ny] of neighbors) {
                        if (nx >= 0 && nx < w && ny >= 0 && ny < h) {
                            const ni = ny * w + nx;
                            if (whitePixels[ni] === 1 && !visited[ni]) {
                                visited[ni] = 1;
                                stack.push(ni);
                            }
                        }
                    }
                }
                if (component.length > maxComponent.length) {
                    maxComponent = component;
                }
            }
        }

        if (maxComponent.length > 50) { // Found a significant white area
            let points = maxComponent.map(i => ({ x: i % w, y: Math.floor(i / w) }));

            // Find 4 corners of the tilted quad using coordinate extremes
            let tl = points[0], tr = points[0], br = points[0], bl = points[0];
            let minSum = w + h, maxSum = 0, minDiff = w, maxDiff = -w;

            for (const p of points) {
                const sum = p.x + p.y;
                const diff = p.x - p.y;
                if (sum < minSum) { minSum = sum; tl = p; }
                if (sum > maxSum) { maxSum = sum; br = p; }
                if (diff > maxDiff) { maxDiff = diff; tr = p; }
                if (diff < minDiff) { minDiff = diff; bl = p; }
            }

            // Map to percentage
            const displayW = containerSize.width;
            const displayH = containerSize.height;
            const s = Math.min(displayW / img.width, displayH / img.height);
            const offX = (displayW - img.width * s) / 2;
            const offY = (displayH - img.height * s) / 2;

            const toPctX = (px) => (((px / processingScale) * s + offX) / displayW) * 100;
            const toPctY = (px) => (((px / processingScale) * s + offY) / displayH) * 100;

            // Added a small margin (overshoot by 1.5%) to ensure border inclusion
            const margin = 1.5;
            setCorners({
                topLeft: { x: toPctX(tl.x) - margin, y: toPctY(tl.y) - margin },
                topRight: { x: toPctX(tr.x) + margin, y: toPctY(tr.y) - margin },
                bottomRight: { x: toPctX(br.x) + margin, y: toPctY(br.y) + margin },
                bottomLeft: { x: toPctX(bl.x) - margin, y: toPctY(bl.y) + margin }
            });
        }
        setIsDetecting(false);
    };

    const expandCorners = (amount = 2) => {
        setCorners(prev => ({
            topLeft: { x: Math.max(0, prev.topLeft.x - amount), y: Math.max(0, prev.topLeft.y - amount) },
            topRight: { x: Math.min(100, prev.topRight.x + amount), y: Math.max(0, prev.topRight.y - amount) },
            bottomRight: { x: Math.min(100, prev.bottomRight.x + amount), y: Math.min(100, prev.bottomRight.y + amount) },
            bottomLeft: { x: Math.max(0, prev.bottomLeft.x - amount), y: Math.min(100, prev.bottomLeft.y + amount) }
        }));
    };

    const handleCrop = () => {
        if (!imageRef.current) return;

        const img = imageRef.current;
        const formatInfo = INSTAX_FORMATS[format];
        const outputWidth = 800;
        const outputHeight = Math.round(outputWidth / formatInfo.ratio);

        const canvas = document.createElement('canvas');
        canvas.width = outputWidth;
        canvas.height = outputHeight;
        const ctx = canvas.getContext('2d');

        // Create rotated source
        const tempCanvas = document.createElement('canvas');
        const radians = (rotation * Math.PI) / 180;
        const isVer = Math.abs(rotation % 180) === 90;
        tempCanvas.width = isVer ? img.height : img.width;
        tempCanvas.height = isVer ? img.width : img.height;
        const tempCtx = tempCanvas.getContext('2d');
        tempCtx.translate(tempCanvas.width / 2, tempCanvas.height / 2);
        tempCtx.rotate(radians);
        tempCtx.drawImage(img, -img.width / 2, -img.height / 2);

        const srcW = tempCanvas.width;
        const srcH = tempCanvas.height;
        const srcData = tempCtx.getImageData(0, 0, srcW, srcH);

        const s = Math.min(containerSize.width / srcW, containerSize.height / srcH);
        const offX = (containerSize.width - srcW * s) / 2;
        const offY = (containerSize.height - srcH * s) / 2;

        const p = [
            { x: ((corners.topLeft.x / 100) * containerSize.width - offX) / s, y: ((corners.topLeft.y / 100) * containerSize.height - offY) / s },
            { x: ((corners.topRight.x / 100) * containerSize.width - offX) / s, y: ((corners.topRight.y / 100) * containerSize.height - offY) / s },
            { x: ((corners.bottomRight.x / 100) * containerSize.width - offX) / s, y: ((corners.bottomRight.y / 100) * containerSize.height - offY) / s },
            { x: ((corners.bottomLeft.x / 100) * containerSize.width - offX) / s, y: ((corners.bottomLeft.y / 100) * containerSize.height - offY) / s }
        ];

        const h = getHomographyMatrix(outputWidth, outputHeight, p);
        const outData = ctx.createImageData(outputWidth, outputHeight);

        for (let y = 0; y < outputHeight; y++) {
            for (let x = 0; x < outputWidth; x++) {
                const z = h[6] * x + h[7] * y + 1;
                const sx = Math.round((h[0] * x + h[1] * y + h[2]) / z);
                const sy = Math.round((h[3] * x + h[4] * y + h[5]) / z);

                if (sx >= 0 && sx < srcW && sy >= 0 && sy < srcH) {
                    const si = (sy * srcW + sx) * 4;
                    const di = (y * outputWidth + x) * 4;
                    outData.data[di] = srcData.data[si];
                    outData.data[di + 1] = srcData.data[si + 1];
                    outData.data[di + 2] = srcData.data[si + 2];
                    outData.data[di + 3] = srcData.data[si + 3];
                }
            }
        }
        ctx.putImageData(outData, 0, 0);
        onCrop?.(canvas.toDataURL('image/jpeg', 0.92), format);
    };

    const resetCorners = () => {
        setRotation(0);
        setFormat('mini');
        autoDetect();
    };

    const cornerPositions = [
        { name: 'topLeft', label: '左上' },
        { name: 'topRight', label: '右上' },
        { name: 'bottomRight', label: '右下' },
        { name: 'bottomLeft', label: '左下' }
    ];

    return (
        <div className="image-cropper">
            {/* Format selector */}
            <div style={{ marginBottom: 'var(--space-md)' }}>
                <label className="label">拍立得尺寸</label>
                <div style={{ display: 'flex', gap: 'var(--space-sm)' }}>
                    {Object.entries(INSTAX_FORMATS).map(([key, { name }]) => (
                        <button
                            key={key}
                            className={`btn ${format === key ? 'btn-primary' : 'btn-secondary'}`}
                            style={{ flex: 1, padding: 'var(--space-sm)', fontSize: '0.8rem' }}
                            onClick={() => setFormat(key)}
                        >
                            {name.replace('Instax ', '')}
                        </button>
                    ))}
                </div>
            </div>

            {/* Rotation & Detection */}
            <div style={{ marginBottom: 'var(--space-md)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-xs)' }}>
                    <label className="label" style={{ marginBottom: 0 }}>調整角度與白邊</label>
                    <div style={{ display: 'flex', gap: 'var(--space-xs)' }}>
                        <button
                            className="btn btn-secondary"
                            onClick={() => expandCorners(-2)}
                            style={{ padding: '6px 12px', fontSize: '0.8rem', borderRadius: '20px', background: '#333', color: '#fff', border: 'none' }}
                            title="縮小邊框"
                        >
                            ➖
                        </button>
                        <button
                            className="btn btn-secondary"
                            onClick={() => expandCorners(2)}
                            style={{ padding: '6px 12px', fontSize: '0.8rem', borderRadius: '20px', background: '#333', color: '#fff', border: 'none' }}
                            title="擴大邊框"
                        >
                            ➕ 留白
                        </button>
                        <button
                            className="btn btn-secondary"
                            onClick={autoDetect}
                            disabled={isDetecting}
                            style={{ padding: '6px 16px', fontSize: '0.8rem', borderRadius: '20px', background: 'var(--primary)', color: 'white', border: 'none', fontWeight: 'bold', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}
                        >
                            {isDetecting ? '偵測中...' : '✨ 自動對焦'}
                        </button>
                    </div>
                </div>
                <div style={{ display: 'flex', gap: 'var(--space-sm)', alignItems: 'center' }}>
                    <button className="btn btn-secondary" onClick={() => setRotation(r => (r - 90) % 360)} style={{ padding: 'var(--space-sm)', fontSize: '1.2rem' }}>↺</button>
                    <button className="btn btn-secondary" onClick={() => setRotation(r => r - 5)} style={{ padding: 'var(--space-sm)' }}>-5°</button>
                    <div style={{ flex: 1, textAlign: 'center', fontSize: '1rem', fontWeight: rotation !== 0 ? 600 : 400, color: rotation !== 0 ? 'var(--primary)' : 'var(--text-secondary)' }}>
                        {rotation}°
                    </div>
                    <button className="btn btn-secondary" onClick={() => setRotation(r => r + 5)} style={{ padding: 'var(--space-sm)' }}>+5°</button>
                    <button className="btn btn-secondary" onClick={() => setRotation(r => (r + 90) % 360)} style={{ padding: 'var(--space-sm)', fontSize: '1.2rem' }}>↻</button>
                </div>
            </div>

            <div style={{ padding: 'var(--space-sm) var(--space-md)', background: 'hsla(158, 64%, 42%, 0.1)', borderRadius: 'var(--radius-md)', marginBottom: 'var(--space-md)', fontSize: '0.8rem', color: 'var(--text-secondary)', borderLeft: '4px solid var(--primary)' }}>
                💡 <b>提示：</b>請將角點移動到拍立得最外緣（包括白色邊框），系統會自動將其拉直。
            </div>

            {/* Preview Box */}
            <div ref={containerRef} style={{ position: 'relative', width: '100%', height: '380px', backgroundColor: '#111', borderRadius: 'var(--radius-lg)', overflow: 'hidden', touchAction: 'none', boxShadow: 'inset 0 0 20px rgba(0,0,0,0.5)' }}>
                {imageLoaded && (
                    <img src={imageSrc} alt="To crop" style={{ position: 'absolute', top: '50%', left: '50%', transform: `translate(-50%, -50%) rotate(${rotation}deg)`, maxWidth: '95%', maxHeight: '95%', objectFit: 'contain', pointerEvents: 'none', transition: 'transform 0.3s ease' }} />
                )}

                <svg style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', pointerEvents: 'none' }}>
                    <defs>
                        <mask id="quadMask">
                            <rect width="100%" height="100%" fill="white" />
                            <polygon points={`${corners.topLeft.x}%,${corners.topLeft.y}% ${corners.topRight.x}%,${corners.topRight.y}% ${corners.bottomRight.x}%,${corners.bottomRight.y}% ${corners.bottomLeft.x}%,${corners.bottomLeft.y}%`} fill="black" />
                        </mask>
                    </defs>
                    <rect width="100%" height="100%" fill="rgba(0,0,0,0.6)" mask="url(#quadMask)" />
                    <polygon points={`${corners.topLeft.x}%,${corners.topLeft.y}% ${corners.topRight.x}%,${corners.topRight.y}% ${corners.bottomRight.x}%,${corners.bottomRight.y}% ${corners.bottomLeft.x}%,${corners.bottomLeft.y}%`} fill="none" stroke="#2db987" strokeWidth="2.5" />

                    {/* High-Visibility Perspective Guide Lines */}
                    {Object.values(corners).map((c, i) => (
                        <line
                            key={i}
                            x1={`${c.x}%`} y1="0" x2={`${c.x}%`} y2="100%"
                            stroke="#00ff9d"
                            strokeWidth="1.5"
                            strokeDasharray="6 4"
                            style={{
                                opacity: 0.4,
                                filter: 'drop-shadow(0 0 2px rgba(0, 255, 157, 0.4))'
                            }}
                        />
                    ))}
                </svg>

                {cornerPositions.map(({ name }) => {
                    const pos = corners[name];
                    const isActive = draggingCorner === name;
                    const isTop = name.includes('top');
                    const isLeft = name.includes('Left');

                    return (
                        <div key={name} onMouseDown={(e) => handleCornerDragStart(name, e)} onTouchStart={(e) => handleCornerDragStart(name, e)} style={{ position: 'absolute', left: `${pos.x}%`, top: `${pos.y}%`, transform: 'translate(-50%, -50%)', width: 60, height: 60, cursor: 'move', zIndex: isActive ? 10 : 1, touchAction: 'none' }}>
                            <svg width="60" height="60" viewBox="0 0 60 60" style={{ position: 'absolute', top: 0, left: 0, filter: isActive ? 'drop-shadow(0 0 8px #2db987)' : 'drop-shadow(0 2px 6px rgba(0,0,0,0.4))' }}>
                                <path d={isTop && isLeft ? 'M12,48 L12,12 L48,12' : isTop && !isLeft ? 'M12,12 L48,12 L48,48' : !isTop && !isLeft ? 'M48,12 L48,48 L12,48' : 'M48,48 L12,48 L12,12'} fill="none" stroke={isActive ? '#2db987' : 'white'} strokeWidth="6" strokeLinecap="round" strokeLinejoin="round" />
                                <path d={isTop && isLeft ? 'M12,48 L12,12 L48,12' : isTop && !isLeft ? 'M12,12 L48,12 L48,48' : !isTop && !isLeft ? 'M48,12 L48,48 L12,48' : 'M48,48 L12,48 L12,12'} fill="none" stroke={isActive ? 'white' : '#2db987'} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                        </div>
                    );
                })}
            </div>

            {/* Bottom Buttons */}
            <div style={{ display: 'flex', gap: 'var(--space-sm)', marginTop: 'var(--space-lg)' }}>
                <button className="btn btn-secondary" onClick={resetCorners} style={{ padding: 'var(--space-sm)', flex: 1 }}>重置</button>
                <button className="btn btn-secondary" onClick={onCancel} style={{ flex: 1 }}>取消</button>
                <button className="btn btn-primary" onClick={handleCrop} style={{ flex: 2, fontSize: '1.1rem' }}>確認校正</button>
            </div>
        </div>
    );
}
