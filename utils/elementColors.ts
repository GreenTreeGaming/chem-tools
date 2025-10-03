export const getElementColor = (category: string | undefined): string => {
  if (!category) {
    return 'bg-gray-200 text-gray-600';
  }

  switch (category.toLowerCase()) {
    case 'alkali metal':
      return 'bg-alkali-metal';
    case 'alkaline earth metal':
      return 'bg-alkaline-earth-metal';
    case 'transition metal':
      return 'bg-transition-metal';
    case 'post-transition metal':
      return 'bg-post-transition-metal';
    case 'metalloid':
      return 'bg-metalloid';
    case 'nonmetal':
      return 'bg-nonmetal';
    case 'halogen':
      return 'bg-halogen';
    case 'noble gas':
      return 'bg-noble-gas';
    case 'lanthanide':
      return 'bg-lanthanide';
    case 'actinide':
      return 'bg-actinide';
    default:
      return 'bg-default';
  }
};