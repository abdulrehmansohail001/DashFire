export const ENEMY_INFO = [
  {
    id: 'enemy',
    name: 'Gunman',
    world: 'World 1 — Lunar Front',
    specialEffect: 'None — standard damage only.',
    description: 'Gunman — World 1 (Lunar Front).',
    spritePath: '/sprites/enemy.png', spriteColumns: 4, spriteRows: 4
  },
  {
    id: 'eagle',
    name: 'Eagle',
    world: 'World 1 — Lunar Front',
    specialEffect: 'None — standard damage only. Aerial, drops bomb projectiles in an arc.',
    description: 'Eagle — World 1 (Lunar Front).',
    spritePath: '/sprites/eagle.png', spriteColumns: 8, spriteRows: 1
  },
  {
    id: 'martian_cat',
    name: 'Martian Cat',
    world: 'World 2 — Mars Invasion',
    specialEffect: 'None — standard damage only. Visual reskin of the base Gunman (shares Enemy.js, no separate entity class).',
    description: 'Martian Cat — World 2 (Mars Invasion).',
    spritePath: '/sprites/martian_cat.png', spriteColumns: 4, spriteRows: 4
  },
  {
    id: 'frog',
    name: 'Frog',
    world: 'World 2 — Mars Invasion',
    specialEffect: 'None — standard contact damage only. No ranged attack, hops toward/around the player.',
    description: 'Frog — World 2 (Mars Invasion).',
    spritePath: '/sprites/frog.png', spriteColumns: 8, spriteRows: 1
  },
  {
    id: 'yeti',
    name: 'Yeti',
    world: 'World 3 — Neon Tundra',
    specialEffect: 'Damage + Freeze — hit locks player movement/jump/shoot for 1-1.5s.',
    description: 'Yeti — World 3 (Neon Tundra).',
    spritePath: '/sprites/yeti.png', spriteColumns: 4, spriteRows: 2
  },
  {
    id: 'icy_bee',
    name: 'Icy Bee',
    world: 'World 3 — Neon Tundra',
    specialEffect: 'Damage + Freeze — hit locks player movement/jump/shoot for 1-1.5s. Spawned by the Spaceship, dies in 1 hit.',
    description: 'Icy Bee — World 3 (Neon Tundra).',
    spritePath: '/sprites/icebee.png', spriteColumns: 4, spriteRows: 1
  },
  {
    id: 'spaceship',
    name: 'Hive Spaceship',
    world: 'World 3 — Neon Tundra',
    specialEffect: 'None — standard damage only. Spawns up to 3 Icy Bees, then transforms into an attacking Queen Bee form once all bees are dead.',
    description: 'Hive Spaceship — World 3 (Neon Tundra).',
    spritePath: '/sprites/spaceship_beeform.png', spriteColumns: 4, spriteRows: 2
  },
  {
    id: 'vortex',
    name: 'Vortex',
    world: 'World 4 — Farthest Black Hole',
    specialEffect: 'Damage + Teleport — contact mirrors the player\'s position across the arena instead of just damaging.',
    description: 'Vortex — World 4 (Farthest Black Hole).',
    spritePath: '/sprites/vortex.png', spriteColumns: 4, spriteRows: 2
  },
  {
    id: 'dark_matter_being',
    name: 'Dark Matter Being',
    world: 'World 4 — Farthest Black Hole',
    specialEffect: 'None on hit — but pulls the player toward it if they stand still for 0.5s+.',
    description: 'Dark Matter Being — World 4 (Farthest Black Hole).',
    spritePath: '/sprites/darkmatterbeing.png', spriteColumns: 4, spriteRows: 2
  },
  {
    id: 'shapeshifter',
    name: 'Shapeshifter',
    world: 'World 5 — Void Rift',
    specialEffect: 'None — standard damage only. Disguises itself as a copy of the player between attack phases.',
    description: 'Shapeshifter — World 5 (Void Rift).',
    spritePath: '/sprites/shapeshifter.png', spriteColumns: 4, spriteRows: 3
  },
  {
    id: 'reg',
    name: 'REG',
    world: 'World 5 — Void Rift',
    specialEffect: 'Varies — cycles randomly between 5 other enemy forms (and their effects) every few seconds.',
    description: 'REG — World 5 (Void Rift).',
    spritePath: '/sprites/reg_glitch.png', spriteColumns: 4, spriteRows: 1
  },
  {
    id: 'time_gunman',
    name: 'Time Gunman',
    world: 'World 5 — Void Rift',
    specialEffect: 'None — standard damage only. Spawned by the TimeDistorter boss.',
    spritePath: '/sprites/time_gunman.png', spriteColumns: 4, spriteRows: 4
  },
];
