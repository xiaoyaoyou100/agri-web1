/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useRef, useState } from 'react';
import type { ImageItem } from '../types';
import type { CategoryLabel } from '../lib/yolo';
import {
    classifyCategoryFromYolo,
    detectWithYolo,
    renderYoloBoxes,
} from '../lib/yolo';
import { categoryToText, detectFireFromImageElement } from '../lib/fireDetect';

interface ImageDetailProps {
    image: ImageItem;
    onBack: () => void;
}

export const ImageDetail: React.FC<ImageDetailProps> = ({ image, onBack }) => {
    const imgRef = useRef<HTMLImageElement | null>(null);
    const canvasRef = useRef<HTMLCanvasElement | null>(null);

    const [detecting, setDetecting] = useState(false);
    const [category, setCategory] = useState<CategoryLabel | null>(null);
    const [message, setMessage] = useState<string>('');
    const [error, setError] = useState<string>('');

    const handleDetect = async () => {
        setError('');
        setMessage('');
        setDetecting(true);
        try {
            const imgEl = imgRef.current;
            const canvas = canvasRef.current;
            if (!imgEl || !canvas) {
                setError('图片尚未加载完成');
                setDetecting(false);
                return;
            }

            // YOLO 检测
            const { model, results } = await detectWithYolo(imgEl);
            let cat: CategoryLabel = classifyCategoryFromYolo(results);

            // “火灾”检测：先用颜色规则看是否存在火焰
            const hasFire = await detectFireFromImageElement(imgEl);
            if (hasFire) {
                cat = 'fire';
            }

            setCategory(cat);
            setMessage('识别完成：' + categoryToText(cat));

            // 在 canvas 上画框
            canvas.width = imgEl.clientWidth;
            canvas.height = imgEl.clientHeight;
            renderYoloBoxes(model, canvas, results);
        } catch (e: any) {
            console.error(e);
            setError('识别失败：' + e.message);
        } finally {
            setDetecting(false);
        }
    };

    const categoryText = category ? categoryToText(category) : '尚未识别';

    return (
        <div className="detail-layout">
            <div className="detail-topbar">
                <button className="btn btn-outline" onClick={onBack}>
                    返回
                </button>
                <div style={{ fontSize: 13, color: '#9ca3af' }}>
                    来源：{image.source === 'local' ? '本机拍摄' : '蓝牙接收'}
                </div>
            </div>

            <div className="detail-main">
                <div className="detail-image-box">
                    <img
                        ref={imgRef}
                        src={image.src}
                        alt="detail"
                        onLoad={() => {
                            const imgEl = imgRef.current;
                            const canvas = canvasRef.current;
                            if (imgEl && canvas) {
                                canvas.width = imgEl.clientWidth;
                                canvas.height = imgEl.clientHeight;
                            }
                        }}
                    />
                    <canvas ref={canvasRef} />
                </div>
                <div className="detail-info">
                    <div>
                        <div className="section-title">识别结果</div>
                        <div>
                            {category === 'fire' ? (
                                <span className="badge badge-yellow">{categoryText}</span>
                            ) : category === 'person' ? (
                                <span className="badge badge-green">{categoryText}</span>
                            ) : category === 'dogOrCat' ? (
                                <span className="badge badge-blue">{categoryText}</span>
                            ) : (
                                <span>{categoryText}</span>
                            )}
                        </div>
                    </div>

                    <div>
                        <div className="section-title">操作</div>
                        <button
                            className="btn btn-primary"
                            disabled={detecting}
                            onClick={handleDetect}
                        >
                            {detecting ? '识别中...' : '识别'}
                        </button>
                    </div>

                    {message && (
                        <div style={{ fontSize: 12, color: '#a5b4fc' }}>{message}</div>
                    )}
                    {error && <div className="form-error">{error}</div>}

                    <div style={{ fontSize: 12, color: '#9ca3af' }}>
                        说明：点击“识别”后，前端会调用 YOLO 模型识别人和狗/猫，并结合颜色特征判断是否存在火焰，然后在图片上框选检测到的目标。
                    </div>
                </div>
            </div>
        </div>
    );
};
