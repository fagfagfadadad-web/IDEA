// Generate a consistent color based on user ID
export const getAvatarColor = (userId: string): string => {
  if (!userId) return '#6b7280'; // gray-500 as default
  
  const colors = [
    '#ef4444', // red-500
    '#f97316', // orange-500
    '#eab308', // yellow-500
    '#22c55e', // green-500
    '#06b6d4', // cyan-500
    '#3b82f6', // blue-500
    '#6366f1', // indigo-500
    '#8b5cf6', // violet-500
    '#d946ef', // fuchsia-500
    '#ec4899', // pink-500
    '#10b981', // emerald-500
    '#f59e0b', // amber-500
  ];
  
  const hash = userId.split('').reduce((a, b) => {
    a = ((a << 5) - a) + b.charCodeAt(0);
    return a & a;
  }, 0);
  
  return colors[Math.abs(hash) % colors.length];
};

// Get user initials from username or fallback
export const getUserInitials = (username?: string, fullName?: string): string => {
  if (fullName && fullName.trim()) {
    const names = fullName.trim().split(' ');
    if (names.length >= 2) {
      return (names[0].charAt(0) + names[names.length - 1].charAt(0)).toUpperCase();
    }
    return fullName.charAt(0).toUpperCase();
  }
  
  if (username && username.trim()) {
    return username.charAt(0).toUpperCase();
  }
  
  return 'U';
};