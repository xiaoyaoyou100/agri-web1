/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useEffect, useRef, useState } from 'react';
import type { UserRecord } from '../types';
import {
    getFaceDescriptorFromCanvas,
    faceDistance,
    initFaceApi,
} from '../lib/faceApi';

interface LoginRegisterProps {
    users: UserRecord[];
    onRegistered: (user: UserRecord) => void;
    onLoggedIn: (user: UserRecord) => void;
}

type AuthTab = 'login' | 'register';
type LoginMode = 'password' | 'face';

export const LoginRegister: React.FC<LoginRegisterProps> = ({
                                                                users,
                                                                onRegistered,
                                                                onLoggedIn,
                                                            }) => {
    const [tab, setTab] = useState<AuthTab>('login');
    const [loginMode, setLoginMode] = useState<LoginMode>('password');

    // 登录表单
    const [loginUsername, setLoginUsername] = useState('');
    const [loginPassword, setLoginPassword] = useState('');

    // 注册表单
    const [regUsername, setRegUsername] = useState('');
    const [regPassword, setRegPassword] = useState('');
    const [regPassword2, setRegPassword2] = useState('');

    const [error, setError] = useState<string>('');

    // 摄像头与人脸
    const videoRef = useRef<HTMLVideoElement | null>(null);
    const [stream, setStream] = useState<MediaStream | null>(null);
    const [registerFaceImg, setRegisterFaceImg] = useState<string | null>(null);
    const [registerDescriptor, setRegisterDescriptor] = useState<number[] | null>(
        null,
    );

    const [loginFaceImg, setLoginFaceImg] = useState<string | null>(null);
    const [loginDescriptor, setLoginDescriptor] = useState<number[] | null>(null);
    const [faceStatus, setFaceStatus] = useState<string>('');

    useEffect(() => {
        // 预加载人脸模型
        initFaceApi().catch(console.error);
    }, []);

    useEffect(() => {
        // 组件卸载时关闭摄像头
        return () => {
            if (stream) {
                stream.getTracks().forEach((t) => t.stop());
            }
        };
    }, [stream]);

    const startCamera = async () => {
        try {
            if (stream) return;
            const media = await navigator.mediaDevices.getUserMedia({
                video: { width: 640, height: 480 },
            });
            setStream(media);
            if (videoRef.current) {
                videoRef.current.srcObject = media;
                await videoRef.current.play();
            }
        } catch (e: any) {
            setError('无法打开摄像头：' + e.message);
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

    const captureFace = async (forRegister: boolean) => {
        setError('');
        setFaceStatus('正在识别人脸，请稍候...');
        if (!videoRef.current) {
            setFaceStatus('没有视频流');
            return;
        }
        const video = videoRef.current;
        const canvas = document.createElement('canvas');
        canvas.width = video.videoWidth || 640;
        canvas.height = video.videoHeight || 480;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
            setFaceStatus('Canvas 不可用');
            return;
        }
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        const dataUrl = canvas.toDataURL('image/jpeg');

        const descriptor = await getFaceDescriptorFromCanvas(canvas);
        if (!descriptor) {
            setFaceStatus('未检测到人脸，请调整姿势后重试');
            return;
        }

        if (forRegister) {
            setRegisterFaceImg(dataUrl);
            setRegisterDescriptor(descriptor);
            setFaceStatus('注册：已成功采集人脸特征');
        } else {
            setLoginFaceImg(dataUrl);
            setLoginDescriptor(descriptor);
            setFaceStatus('登录：已采集人脸特征');
        }
    };

    // 注册
    const handleRegister = () => {
        setError('');
        if (!regUsername.trim()) {
            setError('请输入用户名');
            return;
        }
        if (!regPassword) {
            setError('请输入密码');
            return;
        }
        if (regPassword !== regPassword2) {
            setError('两次输入的密码不一致');
            return;
        }
        if (!registerDescriptor) {
            setError('请先点击“采集人脸”完成采集');
            return;
        }
        if (users.some((u) => u.username === regUsername)) {
            setError('该用户名已存在');
            return;
        }

        const newUser: UserRecord = {
            username: regUsername,
            password: regPassword, // 示例：明文存储，实际项目请改为哈希
            faceDescriptor: registerDescriptor,
        };

        onRegistered(newUser);
        setRegUsername('');
        setRegPassword('');
        setRegPassword2('');
        setRegisterDescriptor(null);
        setRegisterFaceImg(null);
        setFaceStatus('注册成功，已自动登录');
    };

    // 密码登录
    const handlePasswordLogin = () => {
        setError('');
        const user = users.find((u) => u.username === loginUsername);
        if (!user) {
            setError('用户不存在');
            return;
        }
        if (user.password !== loginPassword) {
            setError('密码错误');
            return;
        }
        onLoggedIn(user);
        setLoginPassword('');
        setFaceStatus('');
    };

    // 人脸登录
    const handleFaceLogin = () => {
        setError('');
        const user = users.find((u) => u.username === loginUsername);
        if (!user) {
            setError('用户不存在');
            return;
        }
        if (!user.faceDescriptor) {
            setError('该用户尚未注册人脸信息');
            return;
        }
        if (!loginDescriptor) {
            setError('请先点击“采集人脸”');
            return;
        }
        const dist = faceDistance(user.faceDescriptor, loginDescriptor);
        console.log('face distance:', dist);
        if (dist < 0.6) {
            setFaceStatus(`人脸匹配成功 (距离=${dist.toFixed(3)})`);
            onLoggedIn(user);
            setLoginDescriptor(null);
            setLoginFaceImg(null);
        } else {
            setFaceStatus(`人脸不匹配 (距离=${dist.toFixed(3)})`);
            setError('人脸识别失败，请重试或改用密码登录');
        }
    };

    return (
        <div className="login-container">
            <div className="login-tabs">
                <button
                    className={`login-tab ${tab === 'login' ? 'active' : ''}`}
                    onClick={() => {
                        setTab('login');
                        setError('');
                    }}
                >
                    登录
                </button>
                <button
                    className={`login-tab ${tab === 'register' ? 'active' : ''}`}
                    onClick={() => {
                        setTab('register');
                        setError('');
                    }}
                >
                    注册
                </button>
            </div>

            {tab === 'login' ? (
                <>
                    {/* 登录用户名 */}
                    <div className="form-row">
                        <div className="form-field">
                            <label>用户名</label>
                            <input
                                value={loginUsername}
                                onChange={(e) => setLoginUsername(e.target.value)}
                                placeholder="请输入用户名"
                            />
                        </div>
                    </div>

                    {/* 登录方式：密码 / 人脸 */}
                    <div className="form-row">
                        <div className="form-field">
                            <label>登录方式</label>
                            <div style={{ display: 'flex', gap: 8 }}>
                                <button
                                    type="button"
                                    className={`btn btn-outline ${
                                        loginMode === 'password' ? 'active' : ''
                                    }`}
                                    onClick={() => {
                                        setLoginMode('password');
                                        setError('');
                                    }}
                                >
                                    密码登录
                                </button>
                                <button
                                    type="button"
                                    className={`btn btn-outline ${
                                        loginMode === 'face' ? 'active' : ''
                                    }`}
                                    onClick={() => {
                                        setLoginMode('face');
                                        setError('');
                                    }}
                                >
                                    人脸登录
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* 密码登录区域 */}
                    {loginMode === 'password' && (
                        <>
                            <div className="form-row">
                                <div className="form-field">
                                    <label>密码</label>
                                    <input
                                        type="password"
                                        value={loginPassword}
                                        onChange={(e) => setLoginPassword(e.target.value)}
                                        placeholder="请输入密码"
                                    />
                                </div>
                            </div>
                            <button className="btn btn-primary" onClick={handlePasswordLogin}>
                                登录
                            </button>
                        </>
                    )}

                    {/* 人脸登录区域 */}
                    {loginMode === 'face' && (
                        <>
                            <div className="face-panel">
                                <div className="face-video-wrap">
                                    <div className="section-title">人脸登录 - 摄像头</div>
                                    <div className="face-video-box">
                                        <video ref={videoRef} autoPlay muted />
                                    </div>
                                    <div className="face-actions">
                                        <button className="btn btn-outline" onClick={startCamera}>
                                            打开摄像头
                                        </button>
                                        <button className="btn btn-outline" onClick={stopCamera}>
                                            关闭摄像头
                                        </button>
                                        <button
                                            className="btn btn-primary"
                                            onClick={() => captureFace(false)}
                                        >
                                            采集人脸
                                        </button>
                                    </div>
                                </div>
                                <div>
                                    <div className="section-title">人脸预览</div>
                                    <div className="face-preview">
                                        {loginFaceImg ? (
                                            <img src={loginFaceImg} alt="login face" />
                                        ) : (
                                            <span>尚未采集</span>
                                        )}
                                    </div>
                                </div>
                            </div>
                            <div style={{ marginTop: 10 }}>
                                <button className="btn btn-primary" onClick={handleFaceLogin}>
                                    使用人脸登录
                                </button>
                            </div>
                        </>
                    )}

                    {error && <div className="form-error">{error}</div>}
                    {faceStatus && !error && (
                        <div style={{ marginTop: 6, fontSize: 12, color: '#a5b4fc' }}>
                            {faceStatus}
                        </div>
                    )}
                </>
            ) : (
                <>
                    {/* 注册用户名 */}
                    <div className="form-row">
                        <div className="form-field">
                            <label>用户名</label>
                            <input
                                value={regUsername}
                                onChange={(e) => setRegUsername(e.target.value)}
                                placeholder="请输入用户名"
                            />
                        </div>
                    </div>

                    {/* 注册密码 */}
                    <div className="form-row">
                        <div className="form-field">
                            <label>密码</label>
                            <input
                                type="password"
                                value={regPassword}
                                onChange={(e) => setRegPassword(e.target.value)}
                                placeholder="请输入密码"
                            />
                        </div>
                        <div className="form-field">
                            <label>确认密码</label>
                            <input
                                type="password"
                                value={regPassword2}
                                onChange={(e) => setRegPassword2(e.target.value)}
                                placeholder="请再次输入密码"
                            />
                        </div>
                    </div>

                    {/* 注册采集人脸 */}
                    <div className="face-panel">
                        <div className="face-video-wrap">
                            <div className="section-title">注册 - 采集人脸</div>
                            <div className="face-video-box">
                                <video ref={videoRef} autoPlay muted />
                            </div>
                            <div className="face-actions">
                                <button className="btn btn-outline" onClick={startCamera}>
                                    打开摄像头
                                </button>
                                <button className="btn btn-outline" onClick={stopCamera}>
                                    关闭摄像头
                                </button>
                                <button
                                    className="btn btn-primary"
                                    onClick={() => captureFace(true)}
                                >
                                    采集人脸
                                </button>
                            </div>
                        </div>
                        <div>
                            <div className="section-title">采集结果预览</div>
                            <div className="face-preview">
                                {registerFaceImg ? (
                                    <img src={registerFaceImg} alt="register face" />
                                ) : (
                                    <span>尚未采集</span>
                                )}
                            </div>
                        </div>
                    </div>

                    <div style={{ marginTop: 12 }}>
                        <button className="btn btn-primary" onClick={handleRegister}>
                            注册并登录
                        </button>
                    </div>

                    {error && <div className="form-error">{error}</div>}
                    {faceStatus && !error && (
                        <div style={{ marginTop: 6, fontSize: 12, color: '#a5b4fc' }}>
                            {faceStatus}
                        </div>
                    )}
                </>
            )}
        </div>
    );
};
