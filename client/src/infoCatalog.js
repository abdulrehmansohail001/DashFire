export const ENEMY_INFO = [
  {
    id: 'enemy',
    name: 'Gunman',
<<<<<<< HEAD
    world: 'World 1 — Mission Moon',
=======
    world: 'World 1 — Lunar Front',
>>>>>>> 93df97b945134ee821297a94dc4e41341ac7bb46
    specialEffect: 'None — standard damage only.',
    description: 'Gunman — World 1 (Lunar Front).',
  },
  {
    id: 'eagle',
    name: 'Eagle',
<<<<<<< HEAD
    world: 'World 1 — Mission Moon',
=======
    world: 'World 1 — Lunar Front',
>>>>>>> 93df97b945134ee821297a94dc4e41341ac7bb46
    specialEffect: 'None — standard damage only. Aerial, drops bomb projectiles in an arc.',
    description: 'Eagle — World 1 (Lunar Front).',
  },
  {
    id: 'martian_cat',
    name: 'Martian Cat',
    world: 'World 2 — Mars Invasion',
<<<<<<< HEAD
    specialEffect: 'None — standard damage only. ',
=======
    specialEffect: 'None — standard damage only. Visual reskin of the base Gunman (shares Enemy.js, no separate entity class).',
>>>>>>> 93df97b945134ee821297a94dc4e41341ac7bb46
    description: 'Martian Cat — World 2 (Mars Invasion).',
  },
  {
    id: 'frog',
    name: 'Frog',
    world: 'World 2 — Mars Invasion',
    specialEffect: 'None — standard contact damage only. No ranged attack, hops toward/around the player.',
    description: 'Frog — World 2 (Mars Invasion).',
  },
  {
    id: 'yeti',
    name: 'Yeti',
    world: 'World 3 — Neon Tundra',
    specialEffect: 'Damage + Freeze — hit locks player movement/jump/shoot for 1-1.5s.',
    description: 'Yeti — World 3 (Neon Tundra).',
  },
  {
    id: 'icy_bee',
    name: 'Icy Bee',
    world: 'World 3 — Neon Tundra',
<<<<<<< HEAD
    specialEffect: 'Damage + Freeze — hit locks player movement/jump/shoot for 1-1.5s. Spawned by the Spaceship, dies in 2 hits.',
=======
    specialEffect: 'Damage + Freeze — hit locks player movement/jump/shoot for 1-1.5s. Spawned by the Spaceship, dies in 1 hit.',
>>>>>>> 93df97b945134ee821297a94dc4e41341ac7bb46
    description: 'Icy Bee — World 3 (Neon Tundra).',
  },
  {
    id: 'spaceship',
    name: 'Hive Spaceship',
    world: 'World 3 — Neon Tundra',
    specialEffect: 'None — standard damage only. Spawns up to 3 Icy Bees, then transforms into an attacking Queen Bee form once all bees are dead.',
    description: 'Hive Spaceship — World 3 (Neon Tundra).',
  },
  {
    id: 'vortex',
    name: 'Vortex',
    world: 'World 4 — Farthest Black Hole',
    specialEffect: 'Damage + Teleport — contact mirrors the player\'s position across the arena instead of just damaging.',
    description: 'Vortex — World 4 (Farthest Black Hole).',
  },
  {
    id: 'dark_matter_being',
    name: 'Dark Matter Being',
    world: 'World 4 — Farthest Black Hole',
<<<<<<< HEAD
    specialEffect: 'Standard damage + pulls the player toward it if they stand still for 0.5s+.',
=======
    specialEffect: 'None on hit — but pulls the player toward it if they stand still for 0.5s+.',
>>>>>>> 93df97b945134ee821297a94dc4e41341ac7bb46
    description: 'Dark Matter Being — World 4 (Farthest Black Hole).',
  },
  {
    id: 'shapeshifter',
    name: 'Shapeshifter',
<<<<<<< HEAD
    world: 'World 5 — Multiverse Endgame',
    specialEffect: 'None — standard damage only. Disguises itself as a copy of the player between attack phases and reflects damage.',
=======
    world: 'World 5 — Void Rift',
    specialEffect: 'None — standard damage only. Disguises itself as a copy of the player between attack phases.',
>>>>>>> 93df97b945134ee821297a94dc4e41341ac7bb46
    description: 'Shapeshifter — World 5 (Void Rift).',
  },
  {
    id: 'reg',
    name: 'REG',
<<<<<<< HEAD
    world: 'World 5 — Multiverse Endgame',
=======
    world: 'World 5 — Void Rift',
>>>>>>> 93df97b945134ee821297a94dc4e41341ac7bb46
    specialEffect: 'Varies — cycles randomly between 5 other enemy forms (and their effects) every few seconds.',
    description: 'REG — World 5 (Void Rift).',
  },
  {
    id: 'time_gunman',
    name: 'Time Gunman',
<<<<<<< HEAD
    world: 'World 5 — Multiverse Endgame',
    specialEffect: 'None — standard damage only. Spawned by the TimeDistorter boss. ',
=======
    world: 'World 5 — Void Rift',
    specialEffect: 'None — standard damage only. Spawned by the TimeDistorter boss; visual reskin sharing Enemy.js, no separate entity class.',
>>>>>>> 93df97b945134ee821297a94dc4e41341ac7bb46
    description: 'Time Gunman — World 5 (Void Rift).',
  },
];
