// Housemate - Seed Tasks Data

import { Task } from './types';

export const seedTasks: Task[] = [
  // 🐕 Dog – Scout (CRITICAL)
  // Note: Two separate tasks for morning and evening, but instructions are the same
  {
    id: 'dog-morning',
    title: 'Feed Scout',
    category: 'dog',
    frequency: 'daily',
    timeOfDay: 'morning',
    estimatedMinutes: 5,
    overview: 'Feed Scout his meal and ensure fresh water is available.',
    steps: [
      'Measure 1 cup of dry food into Scout\'s bowl',
      'Add Scout\'s medication tablet if provided (check the container on the counter)',
      'Place bowl in usual feeding spot',
      'Check and refill water bowl with fresh water',
      'Give Scout a quick pat and check he\'s eating normally',
    ],
    description: `Feed Scout his meal and ensure fresh water is available.

**Steps:**
1. Measure 1 cup of dry food into Scout's bowl
2. Add Scout's medication tablet if provided (check the container on the counter)
3. Place bowl in usual feeding spot
4. Check and refill water bowl with fresh water
5. Give Scout a quick pat and check he's eating normally`,
    priority: 'critical',
    requiresMedication: true,
    medicationText: "Add Scout's tablet if provided – check the labeled container on the kitchen counter",
    requiresPhoto: false,
    isActive: true,
    doneProperlyText: 'Scout has eaten his food, medication given if applicable, water bowl is full and fresh',
    redFlagsText: 'Scout not eating, vomiting, lethargic behavior, or unusual discharge – contact owner immediately',
  },
  {
    id: 'dog-evening',
    title: 'Feed Scout',
    category: 'dog',
    frequency: 'daily',
    timeOfDay: 'evening',
    estimatedMinutes: 5,
    overview: 'Feed Scout his meal and ensure fresh water is available.',
    steps: [
      'Measure 1 cup of dry food into Scout\'s bowl',
      'Add Scout\'s medication tablet if provided (check the container on the counter)',
      'Place bowl in usual feeding spot',
      'Check and refill water bowl with fresh water',
      'Give Scout a quick pat and check he\'s eating normally',
    ],
    description: `Feed Scout his meal and ensure fresh water is available.

**Steps:**
1. Measure 1 cup of dry food into Scout's bowl
2. Add Scout's medication tablet if provided (check the container on the counter)
3. Place bowl in usual feeding spot
4. Check and refill water bowl with fresh water
5. Give Scout a quick pat and check he's eating normally`,
    priority: 'critical',
    requiresMedication: true,
    medicationText: "Add Scout's tablet if provided",
    requiresPhoto: false,
    isActive: true,
    doneProperlyText: 'Scout has eaten his food, medication given if applicable, water bowl is full',
    redFlagsText: 'Scout not eating, seems unwell, or any unusual behavior – contact owner immediately',
  },

  // 🐔 Chickens (IMPORTANT)
  {
    id: 'chickens-morning',
    title: 'Chicken care',
    category: 'chickens',
    frequency: 'daily',
    timeOfDay: 'morning',
    estimatedMinutes: 10,
    overview: 'Daily care for the chickens.',
    steps: [
      'Open the coop door to let chickens out',
      'Fill feeder with layer pellets (scoop is in the feed bin)',
      'Check and refill water – clean if dirty',
      'Quick health check: are all chickens moving normally? Eyes clear? No injuries?',
      'Check for any predator damage to coop or run',
    ],
    description: `Daily care for the chickens.

**Steps:**
1. Open the coop door to let chickens out
2. Fill feeder with layer pellets (scoop is in the feed bin)
3. Check and refill water – clean if dirty
4. Quick health check: are all chickens moving normally? Eyes clear? No injuries?
5. Check for any predator damage to coop or run`,
    priority: 'important',
    requiresMedication: false,
    requiresPhoto: false,
    isActive: true,
    doneProperlyText: 'Chickens are out and active, feeder full, water clean and full, no visible health issues',
    redFlagsText: 'Chicken not moving, bleeding, labored breathing, or signs of predator attack',
  },
  {
    id: 'chickens-eggs',
    title: 'Collect eggs',
    category: 'chickens',
    frequency: 'daily',
    timeOfDay: 'anytime',
    estimatedMinutes: 5,
    overview: 'Collect eggs from the nesting boxes.',
    steps: [
      'Check all nesting boxes for eggs',
      'Gently collect eggs into the basket',
      'Note the count in the completion notes',
      'Place eggs in the designated spot in the kitchen',
      'Remove any broken eggs or soiled bedding',
    ],
    description: `Collect eggs from the nesting boxes.

**Steps:**
1. Check all nesting boxes for eggs
2. Gently collect eggs into the basket
3. Note the count in the completion notes
4. Place eggs in the designated spot in the kitchen
5. Remove any broken eggs or soiled bedding`,
    priority: 'important',
    requiresMedication: false,
    requiresPhoto: false,
    isActive: true,
    doneProperlyText: 'All eggs collected, counted, and stored properly. Any broken eggs cleaned up',
    redFlagsText: 'Soft-shelled eggs repeatedly, blood in eggs, or drastically reduced laying',
  },

  // 🐠 Aquariums (IMPORTANT)
  {
    id: 'aquarium-daily',
    title: 'Aquarium care',
    category: 'aquarium',
    frequency: 'daily',
    timeOfDay: 'morning',
    estimatedMinutes: 10,
    overview: 'Feed the fish and check aquarium equipment.',
    steps: [
      'Feed fish – small pinch of flakes, they should eat it all within 2-3 minutes',
      'Check all pumps are running (you should see water movement)',
      'Check heater lights are on',
      'Check water level – top up with treated water if low (see container)',
      'Quick visual check: all fish present and swimming normally?',
    ],
    description: `Feed the fish and check aquarium equipment.

**Steps:**
1. Feed fish – small pinch of flakes, they should eat it all within 2-3 minutes
2. Check all pumps are running (you should see water movement)
3. Check heater lights are on
4. Check water level – top up with treated water if low (see container)
5. Quick visual check: all fish present and swimming normally?`,
    priority: 'important',
    requiresMedication: false,
    requiresPhoto: false,
    isActive: true,
    doneProperlyText: 'Fish fed, equipment running, water level good, fish appearing healthy',
    redFlagsText: 'Dead fish, pump not running, heater off, cloudy water, fish gasping at surface',
  },
  {
    id: 'aquarium-weekly',
    title: 'Aquarium deep clean',
    category: 'aquarium',
    frequency: 'weekly',
    timeOfDay: 'anytime',
    estimatedMinutes: 15,
    overview: 'Clean the aquarium glass and check equipment.',
    steps: [
      'Use the algae scraper to clean inside glass',
      'Wipe down outside glass with damp cloth',
      'Check filter intake isn\'t clogged',
      'Inspect all equipment for proper operation',
      'Note any observations in completion notes',
    ],
    description: `Clean the aquarium glass and check equipment.

**Steps:**
1. Use the algae scraper to clean inside glass
2. Wipe down outside glass with damp cloth
3. Check filter intake isn't clogged
4. Inspect all equipment for proper operation
5. Note any observations in completion notes`,
    priority: 'important',
    requiresMedication: false,
    requiresPhoto: false,
    isActive: true,
    doneProperlyText: 'Glass clean, equipment checked and working, no issues noted',
    redFlagsText: 'Equipment malfunction, unusual smells, persistent cloudiness',
  },

  // 🌱 Vegetable Garden (IMPORTANT)
  {
    id: 'garden-daily',
    title: 'Garden check & water',
    category: 'garden',
    frequency: 'daily',
    timeOfDay: 'morning',
    estimatedMinutes: 15,
    overview: 'Check the garden and water as needed.',
    steps: [
      'Check irrigation system is working (look for wet soil near drippers)',
      'Hand water any dry spots or pots not on irrigation',
      'Check for obviously ripe vegetables and harvest them',
      'Quick pest check – look for large insects or obvious damage',
      'Place harvested produce in the kitchen',
    ],
    description: `Check the garden and water as needed.

**Steps:**
1. Check irrigation system is working (look for wet soil near drippers)
2. Hand water any dry spots or pots not on irrigation
3. Check for obviously ripe vegetables and harvest them
4. Quick pest check – look for large insects or obvious damage
5. Place harvested produce in the kitchen`,
    priority: 'important',
    requiresMedication: false,
    requiresPhoto: false,
    isActive: true,
    doneProperlyText: 'Irrigation checked, dry areas watered, ripe produce harvested',
    redFlagsText: 'Irrigation failure, severe wilting, major pest infestation',
  },
  {
    id: 'garden-weekly',
    title: 'Garden maintenance',
    category: 'garden',
    frequency: 'weekly',
    timeOfDay: 'anytime',
    estimatedMinutes: 20,
    overview: 'Tidy the garden, support plants, and remove weeds.',
    steps: [
      'Tie up any climbing plants to trellises',
      'Remove dead or yellowing leaves/plants',
      'Check stakes and supports are secure',
      'Look for pest damage and remove affected leaves',
      'Pull obvious weeds near vegetable plants',
    ],
    description: `Tidy the garden, support plants, and remove weeds.

**Steps:**
1. Tie up any climbing plants to trellises
2. Remove dead or yellowing leaves/plants
3. Check stakes and supports are secure
4. Look for pest damage and remove affected leaves
5. Pull obvious weeds near vegetable plants`,
    priority: 'important',
    requiresMedication: false,
    requiresPhoto: false,
    isActive: true,
    doneProperlyText: 'Plants supported, dead material removed, weeds pulled, garden tidy',
    redFlagsText: 'Widespread disease, structural damage to beds, irrigation leaks',
  },

  // 🤖 Robot Mowers (ROUTINE)
  {
    id: 'mower-check',
    title: 'Robot mower check',
    category: 'mowers',
    frequency: 'daily',
    timeOfDay: 'anytime',
    estimatedMinutes: 5,
    overview: 'Quick check on the robot mowers.',
    steps: [
      'Check mower is either docked (charging) or running',
      'If docked, check charging light is on',
      'Clean grass off sensors and wheels if visibly dirty',
      'Check for any error messages on display',
      'Ensure boundary wire isn\'t damaged (if visible)',
    ],
    description: `Quick check on the robot mowers.

**Steps:**
1. Check mower is either docked (charging) or running
2. If docked, check charging light is on
3. Clean grass off sensors and wheels if visibly dirty
4. Check for any error messages on display
5. Ensure boundary wire isn't damaged (if visible)`,
    priority: 'routine',
    requiresMedication: false,
    requiresPhoto: false,
    isActive: true,
    doneProperlyText: 'Mower operating normally or charging, sensors clean',
    redFlagsText: 'Error message displayed, mower stuck, not charging',
  },

  // ⚡ Property & Grounds (IMPORTANT)
  {
    id: 'property-walkaround',
    title: 'Property walk-around',
    category: 'property',
    frequency: 'daily',
    timeOfDay: 'morning',
    estimatedMinutes: 10,
    overview: 'Walk the property and check for any issues.',
    steps: [
      'Walk the perimeter of the main buildings',
      'Check for any water leaks (taps, pipes, irrigation)',
      'Verify main power is on (check porch light works)',
      'Check all gates and fences are secure',
      'Look for any storm damage or fallen branches',
      'Note anything unusual in completion notes',
    ],
    description: `Walk the property and check for any issues.

**Steps:**
1. Walk the perimeter of the main buildings
2. Check for any water leaks (taps, pipes, irrigation)
3. Verify main power is on (check porch light works)
4. Check all gates and fences are secure
5. Look for any storm damage or fallen branches
6. Note anything unusual in completion notes`,
    priority: 'important',
    requiresMedication: false,
    requiresPhoto: false,
    isActive: true,
    doneProperlyText: 'Property secure, no leaks, power on, gates closed',
    redFlagsText: 'Active leak, power outage, gate/fence damage, security concern',
  },
  {
    id: 'deck-leaves',
    title: 'Blow leaves off deck',
    category: 'property',
    frequency: 'weekly',
    timeOfDay: 'anytime',
    estimatedMinutes: 15,
    overview: 'Clear leaves and debris from the deck.',
    steps: [
      'Get leaf blower from shed',
      'Blow all leaves and debris off deck',
      'Pay attention to corners and under furniture',
      'Blow debris away from house onto lawn',
      'Return blower to shed',
    ],
    description: `Clear leaves and debris from the deck.

**Steps:**
1. Get leaf blower from shed
2. Blow all leaves and debris off deck
3. Pay attention to corners and under furniture
4. Blow debris away from house onto lawn
5. Return blower to shed`,
    priority: 'routine',
    requiresMedication: false,
    requiresPhoto: false,
    isActive: true,
    doneProperlyText: 'Deck clear of leaves and debris, tidy appearance',
    redFlagsText: 'Blower not working, deck damage noticed',
  },

  // 🌞 Seasonal Tasks (Owner-controlled)
  {
    id: 'pool-maintenance',
    title: 'Pool maintenance',
    category: 'seasonal',
    frequency: 'daily',
    timeOfDay: 'morning',
    estimatedMinutes: 15,
    overview: 'Skim the pool and check equipment.',
    steps: [
      'Skim surface for leaves and debris',
      'Check pump is running',
      'Empty skimmer basket if needed',
      'Check water level – should be mid-tile',
      'Note water clarity in completion notes',
    ],
    description: `Skim the pool and check equipment.

**Steps:**
1. Skim surface for leaves and debris
2. Check pump is running
3. Empty skimmer basket if needed
4. Check water level – should be mid-tile
5. Note water clarity in completion notes`,
    priority: 'important',
    requiresMedication: false,
    requiresPhoto: false,
    isActive: false,
    seasonProfiles: ['summer'],
    doneProperlyText: 'Pool skimmed, pump running, water level correct, water clear',
    redFlagsText: 'Pump not running, green water, very low water level',
  },
  {
    id: 'firewood-stacking',
    title: 'Firewood stacking',
    category: 'seasonal',
    frequency: 'weekly',
    timeOfDay: 'anytime',
    estimatedMinutes: 30,
    overview: 'Move and stack delivered firewood.',
    steps: [
      'Transfer wood from delivery pile to woodshed',
      'Stack neatly in rows',
      'Ensure good airflow between stacks',
      'Keep woodshed organized',
      'Bring a small load to inside log basket',
    ],
    description: `Move and stack delivered firewood.

**Steps:**
1. Transfer wood from delivery pile to woodshed
2. Stack neatly in rows
3. Ensure good airflow between stacks
4. Keep woodshed organized
5. Bring a small load to inside log basket`,
    priority: 'routine',
    requiresMedication: false,
    requiresPhoto: false,
    isActive: false,
    seasonProfiles: ['winter'],
    doneProperlyText: 'Wood stacked neatly, inside basket full',
    redFlagsText: 'Woodshed leaking, signs of termites',
  },
  {
    id: 'irrigation-check',
    title: 'Irrigation system check',
    category: 'seasonal',
    frequency: 'weekly',
    timeOfDay: 'morning',
    estimatedMinutes: 20,
    overview: 'Inspect the irrigation system for leaks and coverage.',
    steps: [
      'Walk each irrigation zone while running',
      'Check for broken sprinkler heads',
      'Look for leaks at joints',
      'Ensure coverage is reaching plants',
      'Clear any clogged drippers',
    ],
    description: `Inspect the irrigation system for leaks and coverage.

**Steps:**
1. Walk each irrigation zone while running
2. Check for broken sprinkler heads
3. Look for leaks at joints
4. Ensure coverage is reaching plants
5. Clear any clogged drippers`,
    priority: 'important',
    requiresMedication: false,
    requiresPhoto: false,
    isActive: false,
    seasonProfiles: ['summer'],
    doneProperlyText: 'All zones running, no leaks, full coverage',
    redFlagsText: 'Major leak, zone not running, significant dry patches',
  },
];

export default seedTasks;
