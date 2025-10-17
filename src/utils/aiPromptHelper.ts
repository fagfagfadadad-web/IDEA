import { BreedType, BREED_INFO } from '../types/pet.types';

export class AIPromptHelper {
  private static readonly breedDescriptions: Record<BreedType, string> = {
    golden_retriever: 'happy derpy cartoon character with big goofy smile, exaggerated fluffy golden fur, silly cheerful expression',
    husky: 'dramatic meme dog with hilarious judgemental face, sassy cartoon eyes, comic overreacting to everything',
    german_shepherd: 'funny serious cartoon cop dog with comically alert expression, wearing tiny detective hat',
    corgi: 'adorable stumpy cartoon loaf on tiny legs, goofy big smile, bouncing around like a fluffy potato',
    poodle: 'fancy diva cartoon poodle with ridiculously fluffy fur, fabulous pose, living their best life',
    mystical_wolf: 'mystical moon moon wolf meme character, goofy magical sparkles, derpy mystical vibes',
    celestial_hound: 'cosmic space doge floating in stars, adorable confused expression in zero gravity, much space very wow',
    akita_dragon: 'fierce but cute mini dragon doggo breathing tiny flames, trying to look tough but adorable',
    shiba_inu: 'iconic doge meme style, MUCH WOW expression, such cartoon very funny, crypto moon vibes',
    border_collie: 'smart nerdy cartoon dog with glasses, big brain energy, teaching meme style',
    beagle: 'cartoon detective with giant floppy ears, silly sniffing pose, goofy treasure hunter vibes',
    dachshund: 'hilarious hot dog shaped cartoon sausage dog, comically long body, adorably ridiculous',
    pomeranian: 'fluffy cartoon cloud puffball with tiny legs, viral meme star energy, cuteness overload',
    dalmatian: 'energetic spotted cartoon speedster, action comic style with motion lines, heroic fire dog',
    bulldog: 'tough guy cartoon with funny wrinkly face, wearing construction helmet, multitasking master meme',
    samoyed: 'famous smiling cloud doggo cartoon, ridiculously fluffy white fur, spreading joy meme style',
    labrador: 'goodest boy cartoon character, holding giant bone, wholesome friendship meme energy',
    chihuahua: 'angry tiny cartoon warrior, comically fierce despite smol size, boss fight meme style',
    rottweiler: 'buff bodyguard cartoon with sunglasses, protecting treasure, tough but lovable meme',
    doberman: 'super speedy cartoon with lightning effects, fast as frick boi, time warp meme style'
  };

  private static readonly styleModifiers = {
    photorealistic: 'cute cartoon character style, funny meme aesthetic, vibrant colors, thick outlines, kawaii vibes',
    artistic: 'hilarious cartoon art, meme-worthy expression, bold colors, comic book style, fun and silly',
    fantasy: 'magical cartoon character, meme fantasy style, adorable enchanted vibes, funny mystical energy',
    cinematic: 'dramatic cartoon meme style, epic funny composition, vibrant lighting, internet famous worthy'
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

    return `${namePrefix}${breedInfo.name} dog ${description}. ${styleModifier}, hilarious, adorable, meme-worthy, trending on social media, viral energy, fun cartoon vibes, maximum cuteness`;
  }

  static enhanceUserPrompt(userPrompt: string, breedType: BreedType): string {
    const breedInfo = BREED_INFO[breedType];

    return `A ${breedInfo.name} dog. ${userPrompt}. Cute cartoon character style, funny meme aesthetic, vibrant colors, adorable, hilarious, viral worthy, internet famous vibes`;
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
          'derpy face catching flying pizza like a goofball',
          'wearing sunglasses being too cool for school',
          'surrounded by hearts doing the goodest boy pose',
          'big dumb happy smile with tongue flopping out'
        );
        break;
      case 'husky':
        suggestions.push(
          'dramatic NO meme face, absolutely refusing',
          'judging you silently with sass level 9000',
          'screaming at absolutely nothing like a weirdo',
          'side-eye meme with maximum attitude'
        );
        break;
      case 'german_shepherd':
        suggestions.push(
          'detective solving crimes with magnifying glass',
          'wearing cop sunglasses being super serious',
          'protecting donuts like a true hero',
          'saluting with funny military hat'
        );
        break;
      case 'corgi':
        suggestions.push(
          'bouncing on tiny legs like adorable potato',
          'royal corgi judging peasants from throne',
          'sploot pose showing maximum floof',
          'loaf mode activated, no legs visible'
        );
        break;
      case 'poodle':
        suggestions.push(
          'fabulous diva with ridiculous fancy haircut',
          'wearing sunglasses sipping boba tea',
          'dramatic hair flip living best life',
          'posing for instagram being extra AF'
        );
        break;
      case 'mystical_wolf':
        suggestions.push(
          'moon moon derp wolf with magical sparkles',
          'howling AWOOOO at pizza moon',
          'mystical but goofy with floating runes',
          'trying to be mysterious but too cute'
        );
        break;
      case 'celestial_hound':
        suggestions.push(
          'space doge floating among stars much cosmic',
          'galaxy brain meme in zero gravity',
          'confused astronaut dog in nebula',
          'divine being but still wants treats'
        );
        break;
      case 'akita_dragon':
        suggestions.push(
          'smol dragon breathing tiny cute flames',
          'fierce rawr but actually adorable',
          'trying to be scary dragon but too fluffy',
          'fire doggo with maximum determination'
        );
        break;
      case 'shiba_inu':
        suggestions.push(
          'classic doge meme MUCH WOW SUCH AMAZE',
          'to the moon rocket with diamond hands',
          'side-eye judging your life choices',
          'bonk bat meme destroying negativity'
        );
        break;
      case 'border_collie':
        suggestions.push(
          'big brain wearing nerdy glasses teaching class',
          'solving math equations on blackboard',
          'herding cats like absolute chaos',
          '200 IQ galaxy brain meme energy'
        );
        break;
      case 'beagle':
        suggestions.push(
          'detective with giant nose finding snacks',
          'AROOO howling at absolutely nothing',
          'digging up treasure with silly determination',
          'ears so floppy they defy physics'
        );
        break;
      case 'dachshund':
        suggestions.push(
          'literal hot dog in a bun being hilarious',
          'LONGBOI mode extended to maximum length',
          'tiny legs running at warp speed',
          'wearing hot dog costume being meta AF'
        );
        break;
      case 'pomeranian':
        suggestions.push(
          'fluffy cloud screaming for no reason',
          'viral tiktok star doing silly dance',
          'smol but FIERCE angry cotton ball',
          'bouncing like hyperactive ping pong ball'
        );
        break;
      case 'dalmatian':
        suggestions.push(
          'firefighter hero sliding down pole',
          'zooming so fast spots become blur effect',
          'critical hit meme with damage numbers',
          'superhero landing pose with cape'
        );
        break;
      case 'bulldog':
        suggestions.push(
          'juggling multiple tasks like a boss',
          'wearing hard hat being construction legend',
          'grumpy but lovable wrinkly face',
          'unstoppable force meeting immovable good boy'
        );
        break;
      case 'samoyed':
        suggestions.push(
          'famous cloud smile spreading pure joy',
          'floating floof defying gravity',
          'happiness aura making everyone smile',
          'smiling so hard it becomes meme legendary'
        );
        break;
      case 'labrador':
        suggestions.push(
          'sharing pizza with homies being wholesome',
          'best friend energy with giant bone',
          'friendship is magic pose with heart eyes',
          'goodest boy sharing all the snacks'
        );
        break;
      case 'chihuahua':
        suggestions.push(
          'tiny but ANGY fighting giant monsters',
          'smol chaos gremlin with maximum attitude',
          'boss battle vs huge enemy epic showdown',
          'pocket sized but packing BIG energy'
        );
        break;
      case 'rottweiler':
        suggestions.push(
          'buff bodyguard with sunglasses protecting snacks',
          'no one gets past this absolute unit',
          'tough guy with secretly soft heart',
          'security guard catching snack thieves'
        );
        break;
      case 'doberman':
        suggestions.push(
          'ZOOM speed lines moving faster than light',
          'multitasking like hacker with multiple screens',
          'time stop ability freezing everything',
          'sonic speed breaking the sound barrier'
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
