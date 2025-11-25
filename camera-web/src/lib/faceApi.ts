// 人脸检测与特征提取封装
// 使用 @vladmandic/face-api ESM 版本
import * as faceapi from '@vladmandic/face-api/dist/face-api.esm.js';

let faceReady = false;

export async function initFaceApi() {
    if (faceReady) return;
    // 模型路径：public/models/face-api
    await faceapi.nets.ssdMobilenetv1.loadFromUri('/models/face-api');
    await faceapi.nets.faceLandmark68Net.loadFromUri('/models/face-api');
    await faceapi.nets.faceRecognitionNet.loadFromUri('/models/face-api');
    faceReady = true;
    console.log('face-api models loaded');
}

// 从 <canvas> 中提取单张人脸的 descriptor
export async function getFaceDescriptorFromCanvas(
    canvas: HTMLCanvasElement,
): Promise<number[] | null> {
    if (!faceReady) {
        await initFaceApi();
    }

    const detection = await faceapi
        .detectSingleFace(canvas)
        .withFaceLandmarks()
        .withFaceDescriptor();

    if (!detection) return null;

    // Float32Array -> number[]
    return Array.from(detection.descriptor as Float32Array);
}

// 欧氏距离
export function faceDistance(a: number[], b: number[]): number {
    if (a.length !== b.length) return Infinity;
    let sum = 0;
    for (let i = 0; i < a.length; i++) {
        const d = a[i] - b[i];
        sum += d * d;
    }
    return Math.sqrt(sum);
}
