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

export const OBSTACLE_INFO = [
  {
    id: 'obstacle',
    name: 'Wall',
    world: 'World 1 — Lunar Front',
    specialEffect: 'Solid wall. Blocks movement and player bullets. Enemy bullets pass through.',
    description: 'Wall — World 1 (Lunar Front).',
    spritePath: '/sprites/obs1.png'
  },
  {
    id: 'cactus',
    name: 'Cactus',
    world: 'World 2 — Mars Invasion',
    specialEffect: 'Solid wall. Deals contact damage. Enemy bullets pass through.',
    description: 'Cactus — World 2 (Mars Invasion).',
    spritePath: '/sprites/obs2.png'
  },
  {
    id: 'iceberg',
    name: 'Iceberg',
    world: 'World 3 — Neon Tundra',
    specialEffect: 'Solid moving wall. Contact freezes player (no damage). Sweeps one-way.',
    description: 'Iceberg — World 3 (Neon Tundra).',
    spritePath: '/sprites/obs3.png'
  },
  {
    id: 'quicksand',
    name: 'Quicksand Patch',
    world: 'World 4 — Farthest Black Hole',
    specialEffect: 'Ground hazard. Traps player in place until released. Not solid.',
    description: 'Quicksand Patch — World 4 (Farthest Black Hole).',
    spritePath: '/sprites/obs4.png'
  },
  {
    id: 'sitting_duck',
    name: 'Sitting Duck',
    world: 'World 5 — Void Rift',
    specialEffect: 'Moving ground hazard. Deals damage and forces player to duck. Sweeps one-way.',
    description: 'Sitting Duck — World 5 (Void Rift).',
    spritePath: '/sprites/obs5.png'
  },
];

export const BOSS_INFO = [
  {
    id: 'boss',
    name: 'War Machine',
    world: 'World 1 — Lunar Front',
    specialEffect: 'Stationary boss. Summons basic gunmen as shields.',
    description: 'War Machine — World 1 Boss.',
    spritePath: '/sprites/boss.png', spriteColumns: 3, spriteRows: 2
  },
  {
    id: 'bossfrog',
    name: 'Giant Frog',
    world: 'World 2 — Mars Invasion',
    specialEffect: 'Hops around. Spawns baby frogs and spits fireballs.',
    description: 'Giant Frog — World 2 Boss.',
    spritePath: '/sprites/bossfrog.png', spriteColumns: 4, spriteRows: 2
  },
  {
    id: 'glacier',
    name: 'Twin Glaciers',
    world: 'World 3 — Neon Tundra',
    specialEffect: 'Stationary bosses at edges. Fire straight shots independently.',
    description: 'Twin Glaciers — World 3 Boss.',
    spritePath: '/sprites/glacier.png', spriteColumns: 4, spriteRows: 2
  },
  {
    id: 'blackhole_boss',
    name: 'Black Hole Boss',
    world: 'World 4 — Farthest Black Hole',
    specialEffect: 'Flies across screen. Spawns Dark Matter Beings. Alters zone physics.',
    description: 'Black Hole Boss — World 4 Boss.',
    spritePath: '/sprites/blackhole_boss.png', spriteColumns: 4, spriteRows: 2
  },
  {
    id: 'timedistorter',
    name: 'Time Distorter',
    world: 'World 5 — Void Rift',
    specialEffect: 'Alters time and space. Reverses time and inverts controls.',
    description: 'Time Distorter — World 5 Boss.',
    spritePath: '/sprites/timedistorter.png', spriteColumns: 4, spriteRows: 4
  }
];
