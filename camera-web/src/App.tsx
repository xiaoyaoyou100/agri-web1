/* eslint-disable react-hooks/set-state-in-effect */
/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useEffect, useState } from 'react';
import { LoginRegister } from './components/LoginRegister';
import { GalleryView } from './components/GalleryView';
import type { ImageItem, ImageSourceType, UserRecord } from './types';
import { loadYoloModel } from './lib/yolo';
import { initFaceApi } from './lib/faceApi';

type MainTab = 'camera' | 'bluetooth';

const USERS_KEY = 'camera-web-users';

const App: React.FC = () => {
    const [users, setUsers] = useState<UserRecord[]>([]);
    const [currentUser, setCurrentUser] = useState<UserRecord | null>(null);
    const [activeTab, setActiveTab] = useState<MainTab>('camera');

    const [localImages, setLocalImages] = useState<ImageItem[]>([]);
    const [btImages, setBtImages] = useState<ImageItem[]>([]);

    const [aiReady, setAiReady] = useState(false);
    const [aiError, setAiError] = useState<string | null>(null);

    useEffect(() => {
        // 从 localStorage 读取用户信息
        const raw = window.localStorage.getItem(USERS_KEY);
        if (raw) {
            try {
                const list = JSON.parse(raw) as UserRecord[];
                setUsers(list);
            } catch (e) {
                console.warn('failed to parse users', e);
            }
        }

        // 预加载 YOLO 和 Face 模型
        (async () => {
            try {
                await Promise.all([loadYoloModel(), initFaceApi()]);
                setAiReady(true);
            } catch (e: any) {
                console.error(e);
                setAiError(e.message ?? String(e));
            }
        })();
    }, []);

    const saveUsers = (list: UserRecord[]) => {
        setUsers(list);
        window.localStorage.setItem(USERS_KEY, JSON.stringify(list));
    };

    const handleRegistered = (user: UserRecord) => {
        const list = [...users, user];
        saveUsers(list);
        setCurrentUser(user);
    };

    const handleLoggedIn = (user: UserRecord) => {
        setCurrentUser(user);
    };

    const handleLogout = () => {
        setCurrentUser(null);
    };

    const handleAddImages = (source: ImageSourceType, images: ImageItem[]) => {
        if (source === 'local') {
            setLocalImages((prev) => [...images, ...prev]);
        } else {
            setBtImages((prev) => [...images, ...prev]);
        }
    };

    return (
        <div className="app-root">
            <header className="app-header">
                <div className="app-header-title">Camera Web - 图像采集与识别系统</div>
                <div className="app-header-right">
                    {currentUser ? (
                        <>
                            <span>当前用户：{currentUser.username}</span>
                            <button className="btn btn-outline" onClick={handleLogout}>
                                退出登录
                            </button>
                        </>
                    ) : (
                        <span style={{ fontSize: 13, color: '#9ca3af' }}>
              请先登录或注册后使用功能
            </span>
                    )}
                </div>
            </header>

            <div className="app-body">
                <aside className="app-sidebar">
                    <div>
                        <div className="side-section-title">功能</div>
                        <button
                            className={`sidebar-button ${
                                activeTab === 'camera' ? 'active' : ''
                            } ${!currentUser ? 'disabled' : ''}`}
                            disabled={!currentUser}
                            onClick={() => setActiveTab('camera')}
                        >
                            本机拍摄
                        </button>
                        <button
                            className={`sidebar-button ${
                                activeTab === 'bluetooth' ? 'active' : ''
                            } ${!currentUser ? 'disabled' : ''}`}
                            disabled={!currentUser}
                            onClick={() => setActiveTab('bluetooth')}
                        >
                            蓝牙接收（模拟）
                        </button>
                    </div>
                    <div>
                        <div className="side-section-title">说明</div>
                        <div style={{ fontSize: 12, color: '#9ca3af' }}>
                            注册时需采集人脸，之后可以选择
                            <br />
                            密码或人脸登录。
                            <br />
                            登录后可从本机摄像头拍照，或通过文件选择模拟蓝牙接收图片，并使用 YOLO 模型进行识别。
                        </div>
                    </div>
                </aside>

                <main className="app-main">
                    {!currentUser ? (
                        <LoginRegister
                            users={users}
                            onRegistered={handleRegistered}
                            onLoggedIn={handleLoggedIn}
                        />
                    ) : (
                        <GalleryView
                            activeTab={activeTab}
                            localImages={localImages}
                            btImages={btImages}
                            onAddImages={handleAddImages}
                        />
                    )}
                </main>
            </div>

            {!aiReady && (
                <div className="ai-overlay">
                    <div className="ai-spinner" />
                    <div>正在加载 YOLO 与人脸模型，请稍候...</div>
                </div>
            )}
            {aiError && <div className="ai-error">模型加载失败：{aiError}</div>}
        </div>
    );
};

export default App;
