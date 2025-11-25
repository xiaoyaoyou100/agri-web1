/* eslint-disable @typescript-eslint/no-explicit-any */
import * as tf from '@tensorflow/tfjs';
import YOLOTf from 'yolo-tfjs';

export type CategoryLabel = 'person' | 'dogOrCat' | 'fire' | 'unknown';

// COCO 80 类
export const COCO_CLASSES: string[] = [
    'person',
    'bicycle',
    'car',
    'motorcycle',
    'airplane',
    'bus',
    'train',
    'truck',
    'boat',
    'traffic light',
    'fire hydrant',
    'stop sign',
    'parking meter',
    'bench',
    'bird',
    'cat',
    'dog',
    'horse',
    'sheep',
    'cow',
    'elephant',
    'bear',
    'zebra',
    'giraffe',
    'backpack',
    'umbrella',
    'handbag',
    'tie',
    'suitcase',
    'frisbee',
    'skis',
    'snowboard',
    'sports ball',
    'kite',
    'baseball bat',
    'baseball glove',
    'skateboard',
    'surfboard',
    'tennis racket',
    'bottle',
    'wine glass',
    'cup',
    'fork',
    'knife',
    'spoon',
    'bowl',
    'banana',
    'apple',
    'sandwich',
    'orange',
    'broccoli',
    'carrot',
    'hot dog',
    'pizza',
    'donut',
    'cake',
    'chair',
    'couch',
    'potted plant',
    'bed',
    'dining table',
    'toilet',
    'tv',
    'laptop',
    'mouse',
    'remote',
    'keyboard',
    'cell phone',
    'microwave',
    'oven',
    'toaster',
    'sink',
    'refrigerator',
    'book',
    'clock',
    'vase',
    'scissors',
    'teddy bear',
    'hair drier',
    'toothbrush',
];

export const COLORS: string[] = COCO_CLASSES.map((_, idx) => {
    const hue = (idx * 37) % 360;
    return `hsl(${hue} 90% 50%)`;
});

let yoloInstance: any | null = null;

export async function loadYoloModel() {
    if (yoloInstance) return yoloInstance;
    await tf.setBackend('webgl');
    await tf.ready();

    yoloInstance = await YOLOTf.loadYoloModel(
        '/models/yolov5s_web_model/model.json',
        COCO_CLASSES,
        {
            yoloVersion: 'v5',
            onProgress(fraction: number) {
                console.log('YOLO loading...', Math.round(fraction * 100) + '%');
            },
        },
    );

    return yoloInstance;
}

export interface YoloResults {
    boxes: number[][];
    classes: number[];
    scores: number[];
    xRatio: number;
    yRatio: number;
}

export async function detectWithYolo(
    img: HTMLImageElement,
): Promise<{ model: any; results: YoloResults }> {
    const model = await loadYoloModel();
    const results = (await model.predict(img)) as YoloResults;
    return { model, results };
}

export function renderYoloBoxes(
    model: any,
    canvas: HTMLCanvasElement,
    results: YoloResults,
) {
    model.renderBox(
        canvas,
        {
            ...results,
            ratio: [results.xRatio, results.yRatio],
        },
        COLORS,
    );
}

// 用 YOLO 结果判断是“人”还是“狗/猫”
export function classifyCategoryFromYolo(results: YoloResults): CategoryLabel {
    const classes: number[] = results.classes || [];
    const scores: number[] = results.scores || [];

    let personScore = 0;
    let dogCatScore = 0;

    for (let i = 0; i < classes.length; i++) {
        const label = COCO_CLASSES[classes[i]];
        const score = scores[i] ?? 0;
        if (label === 'person' && score > personScore) personScore = score;
        if ((label === 'dog' || label === 'cat') && score > dogCatScore) {
            dogCatScore = score;
        }
    }

    if (personScore >= 0.5) return 'person';
    if (dogCatScore >= 0.5) return 'dogOrCat';
    return 'unknown';
}
