// src/engine/AssetLoader.ts

class AssetLoader {
    private imageCache: Map<string, HTMLImageElement> = new Map();
    private soundCache: Map<string, HTMLAudioElement> = new Map();
    private fontCache: Map<string, FontFace> = new Map();

    async loadImage(path: string): Promise<HTMLImageElement> {
        if (this.imageCache.has(path)) {
            console.log(`[AssetLoader] Image ${path} already in cache.`);
            return this.imageCache.get(path)!;
        }

        console.log(`[AssetLoader] Loading image: ${path}`);
        return new Promise((resolve, reject) => {
            const img = new Image();
            img.onload = () => {
                console.log(`[AssetLoader] Image loaded successfully: ${path}`);
                this.imageCache.set(path, img);
                resolve(img);
            };
            img.onerror = (error) => {
                console.error(`[AssetLoader] Error loading image: ${path}`, error);
                reject(error);
            };
            img.src = path;
        });
    }

    async loadSound(path: string): Promise<HTMLAudioElement> {
        if (this.soundCache.has(path)) {
            return this.soundCache.get(path)!;
        }

        return new Promise((resolve, reject) => {
            const audio = new Audio();
            audio.oncanplaythrough = () => {
                this.soundCache.set(path, audio);
                resolve(audio);
            };
            audio.onerror = reject;
            audio.src = path;
        });
    }

    async loadFont(name: string, path: string): Promise<FontFace> {
        if (this.fontCache.has(name)) {
            return this.fontCache.get(name)!;
        }

        const font = new FontFace(name, `url(${path})`);
        await font.load();
        document.fonts.add(font);
        this.fontCache.set(name, font);
        return font;
    }
}

export const assetLoader = new AssetLoader();
