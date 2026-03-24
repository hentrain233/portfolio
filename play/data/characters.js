export const CHARACTER_IDS = {
  WARRIOR: 'warrior',
  NATURE_MAGE: 'natureMage',
};

export const CHARACTER_DEFS = {
  [CHARACTER_IDS.WARRIOR]: {
    id: CHARACTER_IDS.WARRIOR,
    name: '战士',
    cubeColor: 'red',
    starterDeck: [
      ...Array(4).fill('strike'),
      ...Array(5).fill('defend'),
      'armorBreak',
      'adrenalineLock',
      'comboSlash',
    ],
  },
  [CHARACTER_IDS.NATURE_MAGE]: {
    id: CHARACTER_IDS.NATURE_MAGE,
    name: '自然法师',
    cubeColor: 'green',
    starterDeck: [
      ...Array(4).fill('strike'),
      ...Array(5).fill('defend'),
      'growth',
      'newBranch',
      'fallingLeaf',
    ],
    comingSoon: false,
  },
};

