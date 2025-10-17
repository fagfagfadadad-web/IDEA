# Pet Abilities & Passive Income System

## Overview
This system implements special abilities for pets that provide passive income, protection, multi-tasking, and other benefits.

## Passive Income System

### How It Works
1. **Automatic Collection**: When you visit the Pet Collection page, the system automatically checks if your pets have earned passive income
2. **Hourly Earnings**: Eligible pets generate Food every hour (max 24 hours of accumulated rewards)
3. **Modal Notification**: You'll see a beautiful modal showing all rewards collected
4. **Auto-Added to Balance**: Food is automatically added to your account

### Pets with Passive Income

#### Beagle (450 Food)
- **Evolved**: 5 Food/hour
- **Ascended**: 12 Food/hour + rare items
- **Total per day**: 120 Food (evolved) or 288 Food (ascended)

#### Pomeranian (480 Food)
- **Evolved**: 4 Food/hour from fame
- **Ascended**: 12 Food/hour + referral bonuses
- **Total per day**: 96 Food (evolved) or 288 Food (ascended)

#### Mystical Wolf (550 Food)
- **Evolved**: 6 Food/hour
- **Ascended**: 18 Food/hour + 10% boost to all pets
- **Total per day**: 144 Food (evolved) or 432 Food (ascended)

## Special Abilities

### Protection (Rottweiler - 700 Food)
- **Evolved**: Prevents 50% of Food loss from failed actions
- **Ascended**: Complete protection from Food loss + theft prevention
- **Usage**: Automatically activates when you would lose Food

### Multi-Task (Bulldog - 750 Food)
- **Evolved**: Can complete 2 tasks simultaneously
- **Ascended**: 3 simultaneous tasks + reduced task time
- **Usage**: Allows you to do multiple tasks at once

### No Cooldown (Doberman - 850 Food)
- **Evolved**: Can play mini-games 2x during cooldown
- **Ascended**: No cooldown on mini-games + 50% bonus rewards
- **Usage**: Play games without waiting

### Other Special Abilities

#### Critical Hits (Dalmatian - 260 Food)
- **Ascended**: 30% chance for 3x rewards
- Applies to all reward sources

#### Boss Killer (Chihuahua - 120 Food)
- **Evolved**: 2x boss rewards
- **Ascended**: 3x boss rewards + 50% faster cooldown

#### Training Discount (Border Collie - 240 Food)
- **Evolved/Ascended**: 30% reduction in training costs
- **Ascended**: Intelligence training 2x more effective

#### Treasure Finder (Dachshund - 140 Food)
- **Evolved**: 15% chance to find hidden Food
- **Ascended**: Daily treasure chest with random rewards

## Level-Up Rewards

### Rewards by Level
- **Level 5**: Basic Training Manual
- **Level 10**: 3x Energy Booster + 50 Food Pack
- **Level 15**: Advanced Training Manual
- **Level 20**: Evolution Stone + 100 Food Pack
- **Level 25**: Shiny Charm
- **Level 30**: Master Training Manual + Ascension Crystal
- **Level 40+**: Premium Food Pack (level × 5 Food)

### How It Works
1. **Train or feed your pet** on the Pet Detail page
2. When your pet levels up, rewards are **automatically calculated**
3. Items are **instantly added to your inventory**
4. A **beautiful modal appears** showing all your new items with rarity colors:
   - Common (gray)
   - Rare (blue)
   - Epic (purple)
   - Legendary (gold)
5. Click "Awesome! Collect Rewards" to close the modal
6. Check your **inventory** to use the items!

### Example
- Level up from 4 → 5: You get a modal showing "Basic Training Manual (Common) x1"
- Level up from 9 → 10: You get "Energy Booster (Common) x3" + "Food Pack (Common) x50"
- All items are already in your inventory when the modal shows

## Price Tiers

### Basic Tier (100-320 Food)
Basic abilities with stat bonuses:
- Golden Retriever: 100
- Chihuahua: 120
- Dachshund: 140
- Husky: 160
- Labrador: 180
- Shiba Inu: 200
- German Shepherd: 220
- Border Collie: 240
- Dalmatian: 260
- Poodle: 280
- Samoyed: 300
- Corgi: 320

### Passive Income Tier (450-550 Food)
Generates Food automatically:
- Beagle: 450
- Pomeranian: 480
- Mystical Wolf: 550

### Premium Tier (700-850 Food)
Game-changing abilities:
- Rottweiler: 700 (Protection)
- Bulldog: 750 (Multi-task)
- Akita Dragon: 800
- Doberman: 850 (No Cooldown)

### Legendary Tier (1200 Food)
Ultimate abilities:
- Celestial Hound: 1200 (Instant task completion)

## Technical Implementation

### Services
- `petAbilityService.ts`: Core ability logic
- `passiveIncomeService.ts`: Passive income collection and level-up rewards
- `usePassiveIncome.ts`: React hook for automatic collection

### Components
- `RewardModal`: Beautiful modal for showing rewards
- Integrated into `PetCollection` page

### Database Fields
- `lastPassiveIncomeCollectedAt`: Tracks when income was last collected
- `totalPassiveIncomeEarned`: Total lifetime earnings from passive income

## Usage Tips

1. **Visit Pet Collection Daily**: Check your pets regularly to collect passive income
2. **Invest in Passive Income Pets**: They pay for themselves over time
3. **Max 24 Hours**: Income caps at 24 hours, so collect at least once per day
4. **Level Up Pets**: Higher levels mean more rewards
5. **Evolve & Ascend**: Abilities become much more powerful at higher stages
