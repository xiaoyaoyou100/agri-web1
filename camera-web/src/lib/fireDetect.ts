import type { CategoryLabel } from './yolo';

export async function detectFireFromImageElement(
    img: HTMLImageElement,
): Promise<boolean> {
    const canvas = document.createElement('canvas');
    const width = img.naturalWidth || img.width;
    const height = img.naturalHeight || img.height;
    canvas.width = width;
    canvas.height = height;

    const ctx = canvas.getContext('2d');
    if (!ctx) return false;

    ctx.drawImage(img, 0, 0, width, height);
    const { data } = ctx.getImageData(0, 0, width, height);

    let firePixels = 0;
    const total = width * height;

    for (let i = 0; i < data.length; i += 4) {
        const r = data[i];
        const g = data[i + 1];
        const b = data[i + 2];

        // 非常粗糙的“火焰色”阈值：偏红偏黄
        if (r > 170 && g > 80 && b < 80 && r >= g && g > b) {
            firePixels++;
        }
    }

    const ratio = firePixels / total;
    // 如果超过 2% 像素满足“火焰色”，认为有火灾
    return ratio > 0.02;
}

export function categoryToText(category: CategoryLabel): string {
    switch (category) {
        case 'person':
            return '人';
        case 'dogOrCat':
            return '狗或猫（选择狗）';
        case 'fire':
            return '火灾';
        default:
            return '未识别';
    }
}
