import { BreedType, BREED_INFO } from '../types/pet.types';

export class AIPromptHelper {
  private static readonly breedDescriptions: Record<BreedType, string> = {
    golden_retriever: 'with beautiful golden fur, friendly brown eyes, sitting in a sunny park with green grass',
    husky: 'with striking blue eyes, gray and white fur, energetic pose in a snowy landscape',
    german_shepherd: 'with alert ears, tan and black coat, intelligent expression, standing proudly',
    corgi: 'with short legs, fluffy orange and white coat, cheerful expression, playful pose',
    poodle: 'with elegant curly coat, graceful stance, well-groomed appearance in a garden setting',
    mystical_wolf: 'with ethereal glowing eyes, silvery fur with magical sparkles, mystical forest background',
    celestial_hound: 'with starry cosmic fur pattern, glowing aura, divine presence, celestial background with nebulas',
    akita_dragon: 'with fierce yet noble expression, reddish-orange fur with subtle scales, flame-like aura around body'
  };

  private static readonly styleModifiers = {
    photorealistic: 'photorealistic, professional photography, DSLR, 50mm lens',
    artistic: 'digital art, beautiful colors, artistic style, painterly',
    fantasy: 'fantasy art, magical atmosphere, enchanted, mystical lighting',
    cinematic: 'cinematic lighting, dramatic composition, movie poster style'
  };

  static createPromptForBreed(
    breedType: BreedType,
    petName?: string,
    customDescription?: string,
    style: keyof typeof AIPromptHelper.styleModifiers = 'photorealistic'
  ): string {
    const breedInfo = BREED_INFO[breedType];
    const breedDescription = this.breedDescriptions[breedType] || 'beautiful and friendly dog';
    const styleModifier = this.styleModifiers[style];

    const namePrefix = petName ? `A dog named ${petName}, ` : 'A ';
    const description = customDescription || breedDescription;

    return `${namePrefix}${breedInfo.name} dog ${description}. ${styleModifier}, high quality, detailed fur texture, sharp focus, beautiful lighting, 8k resolution, award-winning photography`;
  }

  static enhanceUserPrompt(userPrompt: string, breedType: BreedType): string {
    const breedInfo = BREED_INFO[breedType];

    return `A ${breedInfo.name} dog. ${userPrompt}. Professional photography, high quality, detailed, beautiful lighting, sharp focus, 8k resolution`;
  }

  static getDefaultPromptForBreed(breedType: BreedType): string {
    return this.breedDescriptions[breedType] || 'beautiful and friendly dog in a natural setting';
  }

  static generatePromptSuggestions(breedType: BreedType): string[] {
    const breedInfo = BREED_INFO[breedType];
    const suggestions: string[] = [];

    switch (breedType) {
      case 'golden_retriever':
        suggestions.push(
          'playing with a ball in a sunny meadow',
          'sitting by a lake during golden hour',
          'running through autumn leaves',
          'portrait with flowing golden fur'
        );
        break;
      case 'husky':
        suggestions.push(
          'howling under the northern lights',
          'running through deep snow',
          'portrait with piercing blue eyes',
          'playing in a winter wonderland'
        );
        break;
      case 'german_shepherd':
        suggestions.push(
          'alert and watchful in a field',
          'sitting proudly on a mountain top',
          'portrait showing intelligence and loyalty',
          'in professional working dog pose'
        );
        break;
      case 'corgi':
        suggestions.push(
          'running with big smile and floppy ears',
          'wearing a tiny crown, royal setting',
          'jumping through flower fields',
          'cute close-up portrait with tongue out'
        );
        break;
      case 'poodle':
        suggestions.push(
          'elegantly groomed in a garden',
          'jumping gracefully over obstacles',
          'portrait with perfectly styled fur',
          'playing in a luxurious mansion'
        );
        break;
      case 'mystical_wolf':
        suggestions.push(
          'surrounded by magical blue flames',
          'howling with aurora borealis behind',
          'with glowing mystical runes floating around',
          'in an enchanted moonlit forest'
        );
        break;
      case 'celestial_hound':
        suggestions.push(
          'surrounded by swirling galaxies and stars',
          'with cosmic energy radiating from body',
          'floating in space with nebula background',
          'divine pose with heavenly light beams'
        );
        break;
      case 'akita_dragon':
        suggestions.push(
          'breathing small flames, warrior pose',
          'with dragon scales visible on body',
          'surrounded by fire and smoke effects',
          'powerful stance with fierce expression'
        );
        break;
    }

    return suggestions;
  }

  static validatePrompt(prompt: string): { valid: boolean; message?: string } {
    if (!prompt || prompt.trim().length === 0) {
      return { valid: false, message: 'Prompt cannot be empty' };
    }

    if (prompt.length < 10) {
      return { valid: false, message: 'Prompt is too short. Please add more details.' };
    }

    if (prompt.length > 500) {
      return { valid: false, message: 'Prompt is too long. Please keep it under 500 characters.' };
    }

    const inappropriateWords = ['nude', 'violent', 'gore', 'nsfw'];
    const lowerPrompt = prompt.toLowerCase();

    for (const word of inappropriateWords) {
      if (lowerPrompt.includes(word)) {
        return { valid: false, message: 'Please use appropriate language for your pet description.' };
      }
    }

    return { valid: true };
  }

  static extractKeywordsFromPrompt(prompt: string): string[] {
    const keywords: string[] = [];
    const words = prompt.toLowerCase().split(/\s+/);

    const colorWords = ['golden', 'brown', 'black', 'white', 'gray', 'silver', 'orange', 'red', 'blue'];
    const emotionWords = ['happy', 'playful', 'calm', 'fierce', 'gentle', 'friendly', 'proud', 'noble'];
    const actionWords = ['running', 'sitting', 'jumping', 'playing', 'sleeping', 'walking', 'standing'];

    words.forEach(word => {
      if (colorWords.includes(word) || emotionWords.includes(word) || actionWords.includes(word)) {
        keywords.push(word);
      }
    });

    return [...new Set(keywords)];
  }
}
