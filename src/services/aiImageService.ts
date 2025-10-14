import axios from 'axios';

export interface GenerateDogImageParams {
  breed: string;
  description: string;
  style?: string;
}

export interface GenerateDogImageResponse {
  success: boolean;
  imageUrl?: string;
  error?: string;
}

export class AIImageService {
  private static readonly API_URL = 'https://api.stability.ai/v1/generation/stable-diffusion-xl-1024-v1-0/text-to-image';
  private static readonly API_KEY = import.meta.env.VITE_STABILITY_AI_API_KEY;

  static async generateDogImage(params: GenerateDogImageParams): Promise<GenerateDogImageResponse> {
    try {
      if (!this.API_KEY) {
        console.warn('⚠️ Stability AI API key not configured');
        return {
          success: false,
          error: 'AI service not configured'
        };
      }

      const prompt = this.buildPrompt(params);
      console.log('🎨 Generating AI image with prompt:', prompt);

      const response = await axios.post(
        this.API_URL,
        {
          text_prompts: [
            {
              text: prompt,
              weight: 1
            },
            {
              text: 'blurry, bad quality, distorted, ugly, cartoon, anime',
              weight: -1
            }
          ],
          cfg_scale: 7,
          height: 1024,
          width: 1024,
          samples: 1,
          steps: 30
        },
        {
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
            'Authorization': `Bearer ${this.API_KEY}`
          }
        }
      );

      if (response.data.artifacts && response.data.artifacts.length > 0) {
        const base64Image = response.data.artifacts[0].base64;
        const imageUrl = `data:image/png;base64,${base64Image}`;

        console.log('✅ AI image generated successfully');
        return {
          success: true,
          imageUrl
        };
      }

      return {
        success: false,
        error: 'No image generated'
      };
    } catch (error: any) {
      console.error('❌ Error generating AI image:', error);
      return {
        success: false,
        error: error.response?.data?.message || error.message || 'Failed to generate image'
      };
    }
  }

  private static buildPrompt(params: GenerateDogImageParams): string {
    const { breed, description, style = 'photorealistic' } = params;

    return `A ${style} high-quality professional photograph of a ${breed} dog. ${description}. Beautiful lighting, sharp focus, detailed fur texture, warm and friendly expression, 8k resolution, professional photography`;
  }

  static async generateDogImageFallback(breed: string): Promise<GenerateDogImageResponse> {
    return this.generateDogImage({
      breed,
      description: `Beautiful ${breed} in a natural outdoor setting`,
      style: 'photorealistic'
    });
  }

  static base64ToBlob(base64Data: string): Blob {
    const base64 = base64Data.split(',')[1];
    const byteCharacters = atob(base64);
    const byteNumbers = new Array(byteCharacters.length);

    for (let i = 0; i < byteCharacters.length; i++) {
      byteNumbers[i] = byteCharacters.charCodeAt(i);
    }

    const byteArray = new Uint8Array(byteNumbers);
    return new Blob([byteArray], { type: 'image/png' });
  }

  static async compressImage(imageUrl: string, maxWidth: number = 800): Promise<string> {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';

      img.onload = () => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');

        if (!ctx) {
          reject(new Error('Failed to get canvas context'));
          return;
        }

        let width = img.width;
        let height = img.height;

        if (width > maxWidth) {
          height = (height * maxWidth) / width;
          width = maxWidth;
        }

        canvas.width = width;
        canvas.height = height;
        ctx.drawImage(img, 0, 0, width, height);

        resolve(canvas.toDataURL('image/webp', 0.85));
      };

      img.onerror = () => reject(new Error('Failed to load image'));
      img.src = imageUrl;
    });
  }
}
