// src/utils/guestNames.ts

// List of cool animal names for guests
const GUEST_ANIMALS = [
    'wolf',
    'eagle',
    'lion',
    'tiger',
    'bear',
    'fox',
    'shark',
    'falcon',
    'panther',
    'dragon',
    'phoenix',
    'raven',
    'owl',
    'leopard',
    'jaguar',
    'hawk',
    'cobra',
    'lynx',
    'puma',
    'cheetah',
    'viper',
    'stallion',
    'mustang',
    'thunder',
    'lightning',
    'storm',
    'blaze',
    'shadow',
    'spirit',
    'mystic',
    'titan',
    'atlas',
    'orion',
    'nova',
    'comet',
    'meteor',
    'stellar',
    'cosmic',
    'nebula',
    'galaxy'
  ] as const;
  
  // Generate a random guest name using i18n
  // Pass the t function from useTranslation() hook
  export const generateGuestName = (t: (key: string) => string): string => {
    const randomAnimal = GUEST_ANIMALS[Math.floor(Math.random() * GUEST_ANIMALS.length)];
    const randomNumber = Math.floor(Math.random() * 999) + 1;
    
    return `${t(`guestNames.${randomAnimal}`)} ${randomNumber}`;
  };
  
  // Export the list for reference
  export { GUEST_ANIMALS };