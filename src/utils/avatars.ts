// Emoji avatars for users without profile pictures
const emojiAvatars = [
  '👨‍💻', '👩‍💻', '🧑‍💻', '👨‍🎨', '👩‍🎨', '🧑‍🎨', 
  '👨‍💼', '👩‍💼', '🧑‍💼', '👨‍🔬', '👩‍🔬', '🧑‍🔬',
  '🦸‍♂️', '🦸‍♀️', '🦸', '🧙‍♂️', '🧙‍♀️', '🧙',
  '👑', '🎯', '🚀', '⭐', '💎', '🔥'
];

// Function to get consistent emoji based on user ID
export const getEmojiAvatar = (userId: string) => {
  if (!userId) return '👤';
  const hash = userId.split('').reduce((a, b) => {
    a = ((a << 5) - a) + b.charCodeAt(0);
    return a & a;
  }, 0);
  return emojiAvatars[Math.abs(hash) % emojiAvatars.length];
};