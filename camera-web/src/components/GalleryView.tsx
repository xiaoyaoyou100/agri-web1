import React, { useEffect, useRef, useState } from 'react';
import { v4 as uuidv4 } from 'uuid';
import type { ImageItem, ImageSourceType } from '../types';
import { ImageDetail } from './ImageDetail';

const PER_PAGE = 15; // 每页 3 行 x 5 列

interface GalleryViewProps {
    activeTab: 'camera' | 'bluetooth';
    localImages: ImageItem[];
    btImages: ImageItem[];
    onAddImages: (source: ImageSourceType, images: ImageItem[]) => void;
}

export const GalleryView: React.FC<GalleryViewProps> = ({
                                                            activeTab,
                                                            localImages,
                                                            btImages,
                                                            onAddImages,
                                                        }) => {
    const videoRef = useRef<HTMLVideoElement | null>(null);
    const [stream, setStream] = useState<MediaStream | null>(null);
    const [page, setPage] = useState(1);
    const [selectedImage, setSelectedImage] = useState<ImageItem | null>(null);

    const images = activeTab === 'camera' ? localImages : btImages;

    useEffect(() => {
        // tab 变化时重置分页
        setPage(1);
    }, [activeTab, images.length]);

    useEffect(() => {
        // 组件卸载时关闭摄像头
        return () => {
            if (stream) {
                stream.getTracks().forEach((t) => t.stop());
            }
        };
    }, [stream]);

    useEffect(() => {
        // 只有本机拍摄 tab 才自动尝试打开摄像头
        if (activeTab === 'camera') {
            startCamera().catch(console.error);
        } else {
            stopCamera();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [activeTab]);

    const startCamera = async () => {
        try {
            if (stream || activeTab !== 'camera') return;
            const media = await navigator.mediaDevices.getUserMedia({
                video: { width: 640, height: 480 },
            });
            setStream(media);
            if (videoRef.current) {
                videoRef.current.srcObject = media;
                await videoRef.current.play();
            }
        } catch (e) {
            console.error(e);
        }
    };

    const stopCamera = () => {
        if (stream) {
            stream.getTracks().forEach((t) => t.stop());
            setStream(null);
        }
        if (videoRef.current) {
            videoRef.current.srcObject = null;
        }
    };

    const handleCapture = () => {
        if (!videoRef.current) return;
        const video = videoRef.current;
        const canvas = document.createElement('canvas');
        canvas.width = video.videoWidth || 640;
        canvas.height = video.videoHeight || 480;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        const dataUrl = canvas.toDataURL('image/jpeg');

        const img: ImageItem = {
            id: uuidv4(),
            src: dataUrl,
            source: 'local',
            createdAt: Date.now(),
        };

        onAddImages('local', [img]);
    };

    // 蓝牙接收（用文件选择模拟）
    const handleBluetoothReceive = (files: FileList | null) => {
        if (!files || files.length === 0) return;
        const list: ImageItem[] = [];
        let loaded = 0;
        for (let i = 0; i < files.length; i++) {
            const f = files[i];
            const reader = new FileReader();
            reader.onload = () => {
                loaded++;
                const src = reader.result as string;
                list.push({
                    id: uuidv4(),
                    src,
                    source: 'bluetooth',
                    createdAt: Date.now(),
                });
                if (loaded === files.length) {
                    onAddImages('bluetooth', list);
                }
            };
            reader.readAsDataURL(f);
        }
    };

    const totalPages = Math.max(1, Math.ceil(images.length / PER_PAGE));
    const startIdx = (page - 1) * PER_PAGE;
    const pageItems = images.slice(startIdx, startIdx + PER_PAGE);

    if (selectedImage) {
        return (
            <ImageDetail
                image={selectedImage}
                onBack={() => setSelectedImage(null)}
            />
        );
    }

    return (
        <div className="gallery-layout">
            {activeTab === 'camera' ? (
                <div className="camera-area">
                    <div className="camera-video-box">
                        <video ref={videoRef} autoPlay muted />
                    </div>
                    <div className="camera-side">
                        <div className="section-title">本机拍摄</div>
                        <div style={{ fontSize: 13, color: '#9ca3af' }}>
                            点击下方按钮从本机摄像头拍照，照片仅保存在本地浏览器中。
                        </div>
                        <button className="btn btn-primary" onClick={handleCapture}>
                            拍照
                        </button>
                        <button className="btn btn-outline" onClick={stopCamera}>
                            关闭摄像头
                        </button>
                    </div>
                </div>
            ) : (
                <div className="camera-area">
                    <div className="camera-video-box">
                        <div style={{ fontSize: 13, color: '#9ca3af', padding: 16 }}>
                            由于 Web 浏览器对蓝牙文件传输支持有限，这里使用 “选择图片文件” 来
                            <span style={{ color: '#a5b4fc' }}> 模拟蓝牙接收 </span>
                            。从手机或其他设备把图片拷到电脑，再在这里选择即可。
                        </div>
                    </div>
                    <div className="camera-side">
                        <div className="section-title">蓝牙接收（模拟）</div>
                        <input
                            type="file"
                            accept="image/*"
                            multiple
                            onChange={(e) => handleBluetoothReceive(e.target.files)}
                        />
                        <div style={{ fontSize: 12, color: '#9ca3af' }}>
                            选中的图片会作为“蓝牙接收”的图片保存，只在当前浏览器生效，不会上传到服务器。
                        </div>
                    </div>
                </div>
            )}

            <div className="gallery-grid-wrap">
                <div
                    style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        marginBottom: 8,
                    }}
                >
                    <div className="section-title">
                        {activeTab === 'camera' ? '本机拍摄图片' : '蓝牙接收图片'}
                    </div>
                    <div style={{ fontSize: 12, color: '#9ca3af' }}>
                        共 {images.length} 张，当前第 {page}/{totalPages} 页
                    </div>
                </div>
                {pageItems.length === 0 ? (
                    <div className="gallery-empty">暂无图片。</div>
                ) : (
                    <div className="gallery-grid">
                        {pageItems.map((img) => (
                            <div
                                key={img.id}
                                className="gallery-item"
                                onClick={() => setSelectedImage(img)}
                            >
                                <img src={img.src} alt="thumb" />
                                <div className="gallery-item-time">
                                    {new Date(img.createdAt).toLocaleTimeString()}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
                <div className="gallery-pager">
                    <button
                        className="btn btn-outline"
                        disabled={page <= 1}
                        onClick={() => setPage((p) => Math.max(1, p - 1))}
                    >
                        上一页
                    </button>
                    <button
                        className="btn btn-outline"
                        disabled={page >= totalPages}
                        onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                    >
                        下一页
                    </button>
                </div>
            </div>
        </div>
    );
};
