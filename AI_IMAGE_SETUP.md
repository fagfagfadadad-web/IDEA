# AI Image Generation Setup Guide

This guide will help you set up AI image generation for pet avatars in the PupFi application.

## Overview

The AI image generation feature allows users to create custom, AI-generated images of their pets during adoption. The system uses Stability AI's Stable Diffusion model to generate photorealistic dog images based on breed and user descriptions.

## Features

- **AI-Powered Generation**: Uses Stability AI Stable Diffusion XL for high-quality images
- **Custom Descriptions**: Users can describe exactly how they want their pet to look
- **Auto-Generated Prompts**: Smart prompts are automatically created based on selected breed
- **Image Storage**: Generated images are stored in Supabase Storage with compression
- **Fallback Support**: System gracefully falls back to emoji if AI generation fails
- **Preview System**: Users can preview and regenerate images before adopting

## Setup Instructions

### Step 1: Get Stability AI API Key

1. Go to [Stability AI Platform](https://platform.stability.ai/)
2. Create an account or log in
3. Navigate to [API Keys section](https://platform.stability.ai/account/keys)
4. Click "Create API Key"
5. Copy your API key

### Step 2: Configure Environment Variable

1. Open the `.env` file in your project root
2. Find the line: `VITE_STABILITY_AI_API_KEY=your_stability_ai_api_key_here`
3. Replace `your_stability_ai_api_key_here` with your actual API key:

```env
VITE_STABILITY_AI_API_KEY=sk-your-actual-api-key-here
```

### Step 3: Create Supabase Storage Bucket

The application needs a Supabase Storage bucket to store generated images.

**Option A: Automatic Creation**
The bucket will be created automatically when the first image is uploaded.

**Option B: Manual Creation**
1. Go to your Supabase Dashboard
2. Navigate to Storage
3. Click "Create a new bucket"
4. Name it: `pet-images`
5. Set it as **Public bucket**
6. Set file size limit: 5 MB
7. Click "Create bucket"

### Step 4: Test the Feature

1. Start the development server: `npm run dev`
2. Log in to the application
3. Navigate to "My Pet Collection"
4. Click "Adopt New Pet"
5. Enter a pet name
6. Check "Generate AI Image of My Dog"
7. Modify the auto-generated description if desired
8. Click "Generate Preview"
9. Wait for the image to generate (5-10 seconds)
10. Click "Adopt" to complete the adoption with the AI image

## How It Works

### 1. User Flow

```
User clicks "Adopt New Pet"
  ↓
Checks "Generate AI Image"
  ↓
System auto-fills description based on breed
  ↓
User can modify description
  ↓
Clicks "Generate Preview"
  ↓
AI generates image (5-10 seconds)
  ↓
User previews image
  ↓
User can regenerate or proceed to adopt
  ↓
Image is compressed and uploaded to Supabase Storage
  ↓
Pet is created with AI image URL
```

### 2. Technical Architecture

**Services Created:**

- `aiImageService.ts` - Handles communication with Stability AI API
- `imageStorageService.ts` - Manages Supabase Storage operations
- `aiPromptHelper.ts` - Generates and validates AI prompts

**Database Schema:**

Added to Pet type:
- `aiImageUrl?: string` - URL to the stored AI image
- `aiImagePrompt?: string` - The prompt used to generate the image
- `hasCustomImage?: boolean` - Flag indicating AI-generated image

**UI Components Updated:**

- `PetCollection.tsx` - Added AI generation UI in adoption modal
- `PetCollection.tsx` - Grid display shows AI images instead of emoji
- `PetDetail.tsx` - Detail view displays larger AI image with prompt

### 3. Cost Considerations

**Stability AI Pricing:**
- Stable Diffusion XL: ~$0.002 per image
- Extremely affordable for most use cases
- Example: 1000 images = ~$2.00

**Storage Costs:**
- Images are compressed to WebP format (~100-200 KB each)
- Supabase Storage: First 1 GB is free
- Example: ~5000-10000 images in 1 GB

## Breed-Specific Prompts

The system automatically generates optimized prompts for each breed:

- **Golden Retriever**: "with beautiful golden fur, friendly brown eyes, sitting in a sunny park"
- **Husky**: "with striking blue eyes, gray and white fur, energetic pose in snowy landscape"
- **German Shepherd**: "with alert ears, tan and black coat, intelligent expression"
- **Corgi**: "with short legs, fluffy orange and white coat, cheerful expression"
- **Poodle**: "with elegant curly coat, graceful stance, well-groomed appearance"
- **Mystical Wolf**: "with ethereal glowing eyes, silvery fur with magical sparkles"
- **Celestial Hound**: "with starry cosmic fur pattern, glowing aura, celestial background"
- **Akita Dragon**: "with fierce yet noble expression, reddish-orange fur with subtle scales"

## Error Handling

The system includes comprehensive error handling:

- **No API Key**: Warning message, feature disabled gracefully
- **Generation Fails**: User notified, can retry or adopt without AI image
- **Upload Fails**: Warning logged, pet adopted with emoji fallback
- **Invalid Prompt**: Validation with helpful error messages

## Security & Validation

- Prompt validation prevents inappropriate content
- Character limits (500 max) prevent abuse
- Image size limits (5 MB) in storage
- Automatic image compression before upload
- API key stored securely in environment variables

## Troubleshooting

### "AI service not configured"
- Check that `VITE_STABILITY_AI_API_KEY` is set in `.env`
- Restart the development server after adding the key

### "Failed to upload image"
- Verify Supabase Storage bucket exists and is public
- Check Supabase connection in `.env`
- Verify sufficient storage quota

### "Failed to generate image"
- Check Stability AI API key is valid
- Verify account has credits
- Check network connectivity
- Review console for detailed error messages

### Images not displaying
- Check browser console for errors
- Verify Supabase Storage bucket is public
- Check image URLs are valid
- Ensure CORS is configured properly

## Development Notes

### Adding New Breeds

To add prompts for new breeds:

1. Edit `src/utils/aiPromptHelper.ts`
2. Add breed description to `breedDescriptions` object
3. Add prompt suggestions to `generatePromptSuggestions` function

### Customizing Image Generation

To adjust image quality or style:

1. Edit `src/services/aiImageService.ts`
2. Modify parameters in `generateDogImage` function:
   - `cfg_scale`: Controls prompt adherence (1-35, default: 7)
   - `steps`: Generation steps (10-50, default: 30)
   - `width/height`: Image dimensions (default: 1024x1024)

### Storage Configuration

To change storage settings:

1. Edit `src/services/imageStorageService.ts`
2. Modify `BUCKET_NAME` constant
3. Adjust compression quality in `compressImage` function

## Future Enhancements

Potential improvements:

- Multiple style options (realistic, artistic, fantasy)
- Ability to regenerate images for existing pets
- Image editing tools (filters, effects)
- Batch generation for multiple pets
- User gallery of generated images
- NFT minting integration

## Support

For issues or questions:

1. Check console logs for detailed error messages
2. Verify all environment variables are set correctly
3. Ensure Supabase Storage is properly configured
4. Check Stability AI account status and credits

## Resources

- [Stability AI Documentation](https://platform.stability.ai/docs)
- [Supabase Storage Guide](https://supabase.com/docs/guides/storage)
- [Stable Diffusion Prompt Guide](https://stable-diffusion-art.com/prompt-guide/)
