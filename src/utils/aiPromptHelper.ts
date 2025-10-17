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
    akita_dragon: 'with fierce yet noble expression, reddish-orange fur with subtle scales, flame-like aura around body',
    shiba_inu: 'with fox-like features, orange and white coat, confident meme-worthy expression, Japanese garden setting',
    border_collie: 'with intelligent gaze, black and white coat, alert herding pose in green meadow',
    beagle: 'with floppy ears, tricolor coat, nose to ground tracking pose, curious expression',
    dachshund: 'with long body and short legs, smooth coat, adorable hot-dog shape, playful garden setting',
    pomeranian: 'with fluffy teddy bear coat, tiny size, viral-worthy cute expression, bouncing pose',
    dalmatian: 'with distinctive black spots on white coat, athletic build, running with speed and grace',
    bulldog: 'with wrinkled determined face, muscular stocky build, powerful stance showing strength',
    samoyed: 'with fluffy white cloud-like coat, famous smiling expression, joyful and happy pose',
    labrador: 'with friendly loyal eyes, golden or chocolate coat, holding bone, best friend pose',
    chihuahua: 'with tiny size but fierce expression, big personality, mighty stance despite small stature',
    rottweiler: 'with protective guardian stance, black and tan coat, strong muscular build, shield-like presence',
    doberman: 'with sleek athletic build, alert pointed ears, lightning-fast pose, elegant and powerful'
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
      case 'shiba_inu':
        suggestions.push(
          'meme-worthy side-eye glance, much wow',
          'in Japanese garden with cherry blossoms',
          'rocket ship to the moon background',
          'confident pose with crypto coins around'
        );
        break;
      case 'border_collie':
        suggestions.push(
          'herding sheep in countryside',
          'catching frisbee mid-air with focus',
          'running agility course with intelligence',
          'teaching other dogs tricks'
        );
        break;
      case 'beagle':
        suggestions.push(
          'nose to ground tracking scent trail',
          'howling with head tilted back',
          'finding hidden treasure in forest',
          'portrait with big floppy ears alert'
        );
        break;
      case 'dachshund':
        suggestions.push(
          'digging tunnel underground for treasure',
          'long body running with ears flying',
          'wearing tiny sweater in autumn leaves',
          'standing on hind legs looking adorable'
        );
        break;
      case 'pomeranian':
        suggestions.push(
          'viral internet star with phone camera',
          'fluffy teddy bear pose with followers',
          'bouncing with big personality energy',
          'groomed perfectly for social media photo'
        );
        break;
      case 'dalmatian':
        suggestions.push(
          'running at full speed with spots blurring',
          'firehouse hero pose with fire truck',
          'critical strike action pose, dynamic',
          'jumping through water with grace'
        );
        break;
      case 'bulldog':
        suggestions.push(
          'multitasking two activities at once',
          'determined unstoppable warrior stance',
          'wearing work uniform doing two jobs',
          'powerful pose showing raw strength'
        );
        break;
      case 'samoyed':
        suggestions.push(
          'famous smiling expression spreading joy',
          'fluffy white cloud surrounded by happy pets',
          'playing in snow with pure happiness',
          'aura of joy making everyone around happy'
        );
        break;
      case 'labrador':
        suggestions.push(
          'sharing treats with other dog friends',
          'loyal best friend pose with bone',
          'leading pack of dogs with friendship',
          'golden retriever moment being helpful'
        );
        break;
      case 'chihuahua':
        suggestions.push(
          'tiny but fierce fighting giant boss',
          'small dog with huge personality and attitude',
          'mighty warrior pose despite small size',
          'defeating massive enemy with courage'
        );
        break;
      case 'rottweiler':
        suggestions.push(
          'guardian protecting treasure with shield',
          'strong muscular protective stance',
          'preventing thieves from stealing food',
          'iron guard watching over everything'
        );
        break;
      case 'doberman':
        suggestions.push(
          'lightning-fast speed blur effect',
          'playing two games simultaneously',
          'time warp effect showing no cooldown',
          'sleek athletic pose breaking sound barrier'
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
