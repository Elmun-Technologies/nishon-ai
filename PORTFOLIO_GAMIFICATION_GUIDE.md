# Portfolio Gamification System Guide

## 🎮 Overview

Nishon AI'ning user portfolio gamification sistema foydalanuvchilarning reytingini ko'tarish, badges yigish, level o'tish va specialization qayta tayin qilish uchun mo'ljallangan.

**Asosiy maqsad:** Markologlarni faolliglik bilan pul qilish, tatqiqotni sohalarga bo'lish va sertifikatsiyalar bilan ularni taqdim qilish.

---

## 📊 Level System (5 Levels)

### Novice (🌱)
- **Min Points:** 0
- **Description:** Journey started. Learning the basics.
- **Unlocks:** Basic badges, first certification
- **Features:**
  - Limited badge visibility
  - Basic profile analytics
  - Can earn first badges

### Apprentice (👨‍🎓)
- **Min Points:** 500
- **Description:** Growing skills. First campaigns running.
- **Unlocks:** Intermediate badges, multiple certifications, industry tracking
- **Features:**
  - Profile boost +1
  - Industry specialization tracking enabled
  - Can earn up to rare badges

### Expert (🎯)
- **Min Points:** 2,000
- **Description:** Proven track record. Consistent results.
- **Unlocks:** Expert badges, premium features, featured badge
- **Features:**
  - Profile boost +5
  - Featured in search results
  - Can display specializations
  - Expert-level badges available

### Master (👑)
- **Min Points:** 5,000
- **Description:** Mastery achieved. Industry leader.
- **Unlocks:** Master badges, exclusive tools, mentor badge
- **Features:**
  - Profile boost +12
  - Premium leaderboard placement
  - Can mentor others
  - Master-level badges available
  - Featured marketplace section

### Legend (⭐)
- **Min Points:** 10,000
- **Description:** Legendary performance. Platform icon.
- **Unlocks:** All badges, VIP features, hall of fame
- **Features:**
  - Profile boost +30
  - Hall of Fame listing
  - VIP marketplace badge
  - Custom profile badge
  - Community leader status

---

## 🏆 Badge System (28 Total)

### Badge Categories

#### 1. **MILESTONE BADGES** (10 badges)
Progress-based badges earned by reaching campaign and spending milestones.

| Badge | Icon | Rarity | Requirement | Points |
|-------|------|--------|-------------|--------|
| Launch Master's Debut | 🚀 | Common | 1st campaign | 100 |
| Campaign Architect | 🏗️ | Rare | 10+ campaigns | 300 |
| Campaign Legend | 🏛️ | Epic | 50+ campaigns | 1,000 |
| Million Dollar Manager | 💰 | Epic | $1M+ managed | 800 |
| Consistent Performer | 📈 | Rare | 5+ campaigns with 4x+ ROAS | 500 |
| Ten Million Club | 💎 | Epic | $10M+ managed | 1,500 |
| Hundred Campaign Master | 🎯 | Epic | 100+ campaigns | 1,200 |
| Infrastructure Expert | ⚡ | Rare | 3+ platform certifications | 600 |
| Scale Master | 🚀 | Epic | $50M+ managed | 2,000 |
| Market Dominance | 👑 | Legendary | 200+ campaigns, 4x+ ROAS | 3,000 |

#### 2. **SKILL BADGES** (6 badges)
Platform-specific expertise badges.

| Badge | Icon | Rarity | Requirement | Points |
|-------|------|--------|-------------|--------|
| Meta Master | 📘 | Rare | 5+ Meta campaigns, 3.5x+ ROAS | 400 |
| Google Guru | 🔵 | Rare | 5+ Google campaigns, 3.0x+ ROAS | 400 |
| TikTok Titan | 🎵 | Rare | 3+ TikTok campaigns, 3.5x+ ROAS | 350 |
| Automation Expert | ⚙️ | Epic | 10+ campaigns, 4x+ ROAS | 600 |
| Data Analyst | 📊 | Rare | 1,000 points | 300 |
| Budget Optimizer | 💵 | Rare | 8+ campaigns, 4.5x+ ROAS | 500 |

#### 3. **CERTIFICATION BADGES** (3 badges)
Official platform certifications.

| Badge | Icon | Rarity | Requirement | Points |
|-------|------|--------|-------------|--------|
| Meta Certified Partner | 🏆 | Epic | Official Meta certification | 750 |
| Google Certified Partner | 🏅 | Epic | Official Google certification | 750 |
| Platform Master | 🎖️ | Legendary | All platform certifications | 2,000 |

#### 4. **ACHIEVEMENT BADGES** (5 badges)
Special achievements and performance milestones.

| Badge | Icon | Rarity | Requirement | Points |
|-------|------|--------|-------------|--------|
| Perfect Score | ⭐ | Legendary | 5.0★ rating with 10+ reviews | 1,500 |
| Top 1% Performer | 🏆 | Legendary | 5x+ ROAS, 20+ campaigns | 2,000 |
| Consistent Excellence | ✨ | Epic | 10+ consecutive successful campaigns | 1,000 |
| Rapid Learner | 🚀 | Rare | 3+ certifications in 6 months | 600 |
| Community Champion | 💪 | Epic | 50+ positive client reviews | 900 |

#### 4. **INDUSTRY BADGES** (5 badges)
Industry specialization badges.

| Badge | Icon | Rarity | Requirement | Points |
|-------|------|--------|-------------|--------|
| E-commerce Expert | 🛍️ | Rare | 10+ e-commerce campaigns | 500 |
| SaaS Specialist | 💻 | Rare | 8+ SaaS campaigns | 450 |
| Lead Gen Legend | 📋 | Epic | 10K+ leads generated | 800 |
| Brand Builder | 🎨 | Rare | 6+ brand awareness campaigns | 400 |
| Multi-Industry Master | 🌍 | Epic | Success in 5+ industries | 1,200 |

---

## 👤 User Portfolio Components

### 1. **Profile Section**
```
┌─────────────────────────────────┐
│  Avatar  │  Name                │
│          │  Headline            │
│          │  Bio                 │
│          │  Rating ⭐           │
│          │  Level 👑            │
│          │  [Hire Button]       │
└─────────────────────────────────┘
```

**Elements:**
- User avatar (emoji or image)
- Name and headline
- Professional bio
- Star rating (1-5)
- Current level with icon
- "Hire" call-to-action button

### 2. **Statistics Grid**
```
Rating          Level           Avg ROAS        Experience
4.9⭐          Master 👑       4.8x 📈         7+ years 📅
127 reviews     7,250 points    94% success     7,250 pts to next
```

**Key Stats:**
- Rating with review count
- Current level with points/next level
- Average ROAS across all campaigns
- Years of experience since joining

### 3. **Level Progress Bar**
```
┌─────────────────────────────────────┐
│ Master  ███████████░░░░░░ Legend   │
│ 7,250 points  |  2,750 to next     │
│ 72.5% complete                     │
└─────────────────────────────────────┘
```

**Features:**
- Visual progress bar
- Current/next level labels
- Points to next level
- Percentage completion

### 4. **Certifications Section**
```
Verified Certifications
┌──────────────────────┐
│ 📘 Meta Blueprint    │ ✓ Verified
│ Google • 2022-06-15  │
├──────────────────────┤
│ 🔵 Google Ads Search │ ✓ Verified
│ Google • 2022-09-20  │
├──────────────────────┤
│ 🔵 Google Ads Display│ ✓ Verified
│ Google • 2022-10-10  │
└──────────────────────┘
```

**Display:**
- Platform icon
- Certification name
- Issuer name
- Earned date
- Verified badge

### 5. **Badges Section**
```
UNLOCKED BADGES (18/28)
┌──┐ ┌──┐ ┌──┐ ┌──┐ ┌──┐ ┌──┐
│🚀│ │🏗│ │📘│ │🎵│ │🛍│ │⭐│
│  │ │  │ │  │ │  │ │  │ │  │
└──┘ └──┘ └──┘ └──┘ └──┘ └──┘

LOCKED BADGES (10/28)
┌──┐ ┌──┐ ┌──┐ ┌──┐ ┌──┐
│🔒│ │🔒│ │🔒│ │🔒│ │🔒│
│  │ │  │ │  │ │  │ │  │
└──┘ └──┘ └──┘ └──┘ └──┘
```

**Badge Display:**
- Large icon (3-5 size)
- Name and description
- Rarity color coding
- Unlock status (locked/unlocked)
- Hover tooltip with details
- Points reward value

### 6. **Industry Specializations**
```
E-commerce 🛍️
├─ Campaigns: 87
├─ Avg ROAS: 5.2x
├─ Total Spend: $125K
└─ Expertise: Master

SaaS 💻
├─ Campaigns: 34
├─ Avg ROAS: 3.8x
├─ Total Spend: $52K
└─ Expertise: Expert

Lead Gen 📋
├─ Campaigns: 23
├─ Avg ROAS: 3.2x
├─ Total Spend: $28K
└─ Expertise: Expert
```

**Per Industry:**
- Icon and name
- Campaign count
- Average ROAS
- Total spend managed
- Expertise level badge

### 7. **Testimonials Section**
```
⭐⭐⭐⭐⭐
"Dilshod took our business from 2x to 5.2x ROAS in 4 months!"
— Farida M., CEO • Fashion Store

⭐⭐⭐⭐⭐
"Professional, responsive, and strategic."
— Rustam K. • Online Retail

⭐⭐⭐⭐
"Helped launch our SaaS successfully."
— Akmal T., Founder • Tech Startup
```

**Testimonial Elements:**
- Star rating (1-5)
- Quote text
- Author name and title
- Company/industry
- Link to their campaign

---

## 🏅 Leaderboard

### Leaderboard Pages

#### 1. **Overall Rankings**
Specialists ranked by total points.

#### 2. **Rising Stars**
Specialists ranked by recent point gains (trending).

#### 3. **ROAS Leaders**
Specialists ranked by highest average ROAS.

#### 4. **Top Rated**
Specialists ranked by average rating.

### Leaderboard Features

**Top 3 Featured Section:**
- 🥇 Gold: #1 specialist (Rank 1)
- 🥈 Silver: #2 specialist (Rank 2)
- 🥉 Bronze: #3 specialist (Rank 3)
- Featured cards with large avatar
- Full statistics display
- Specialty badge
- Badge count

**Rankings Table:**
| Rank | Name | Level | Rating | ROAS | Campaigns | Specialty | Badges | Points |
|------|------|-------|--------|------|-----------|-----------|--------|--------|
| #1 | Dilshod | Master | 4.9⭐ | 4.8x | 187 | E-commerce | 18 | 7,250 |
| #2 | Saida | Expert | 4.85⭐ | 5.2x | 145 | TikTok | 14 | 5,800 |
| #3 | Akmal | Expert | 4.75⭐ | 3.8x | 128 | Lead Gen | 12 | 5,200 |

---

## 🎯 Points System

### How to Earn Points

| Action | Points | Frequency |
|--------|--------|-----------|
| Complete first campaign | 100 | Once |
| Each successful campaign | 50-200 | Per campaign |
| Maintain 4x+ ROAS streak | 500 | Per 5 campaigns |
| Get 5-star review | 25 | Per review |
| Earn certification | 500-1,000 | Per cert |
| Unlock badge | 100-3,000 | Per badge |
| Industry milestone (10 campaigns) | 500 | Per industry |
| Hit $1M managed | 800 | Once per $1M |

### Point Thresholds

- **500 pts** → Apprentice level unlocked
- **1,000 pts** → Intermediate badges available
- **2,000 pts** → Expert level unlocked
- **5,000 pts** → Master level unlocked
- **10,000 pts** → Legend level unlocked

---

## 🔒 Badge Unlock Conditions

### Condition Types

1. **Min Points Required**
   - Total accumulated points threshold
   - Example: Data Analyst (1,000 points)

2. **Min Rating**
   - Minimum star rating from clients
   - Example: Perfect Score (5.0★)

3. **Min Campaigns**
   - Number of completed campaigns
   - Example: Campaign Architect (10+ campaigns)

4. **Min ROAS**
   - Minimum average ROAS across qualifying campaigns
   - Example: Consistent Performer (4x+ ROAS)

5. **Specific Achievement**
   - Custom logic (certification earned, streak, etc.)
   - Example: Platform Master (all certifications)

### Badge Unlock Flow

```
User completes campaign
    ↓
System checks all badge conditions
    ↓
Match? No  → Badge remains locked
    ↓
Match? Yes → Badge unlocked!
    ↓
Add badge to profile
Notify user
Add reward points
Boost profile
```

---

## 🎨 Rarity System

### Rarity Colors & Meanings

```
Common    (Gray)      - Basic achievements, easy to unlock
Rare      (Blue)      - Some effort required, decent rewards
Epic      (Purple)    - Significant accomplishment, big rewards
Legendary (Gold)      - Top-tier achievement, maximum rewards
```

### Rarity Distribution

- **Common (8 badges):** Basic milestones, first actions
- **Rare (10 badges):** Consistent performance, platform mastery
- **Epic (8 badges):** High achievements, advanced skills
- **Legendary (2 badges):** Top 1% performers, platform icons

---

## 👥 Profile Types

### Public Portfolio Page: `/portfolio/[username]`
- **Access:** Public (no login required)
- **Shows:**
  - All unlocked badges
  - Industry specializations
  - Client testimonials
  - Certifications
  - Statistics summary
- **CTAs:** Contact/Hire buttons

### Dashboard Portfolio: `/(dashboard)/portfolio/[username]`
- **Access:** Dashboard users only
- **Shows:** Everything + 
  - Locked badges with unlock conditions
  - Detailed achievement tracking
  - Point history
  - Progress to next level
  - Private notes

### Leaderboard: `/leaderboard`
- **Access:** Public
- **Shows:**
  - Rankings by different metrics
  - Top 3 featured specialists
  - Full comparison table
  - How system works

---

## 📱 Design & UX

### Color Scheme

```
Level Icons:        Platform Icons:
🌱 Novice          📘 Meta
👨‍🎓 Apprentice       🔵 Google
🎯 Expert          🎵 TikTok
👑 Master          🔴 Yandex
⭐ Legend
```

### Badge Hover States

**Unlocked:**
- Highlight rarity color
- Show reward points
- Enlarge on hover
- Display tooltip

**Locked:**
- Dim opacity (50%)
- Show lock icon
- Display unlock conditions on hover
- Show progress toward unlock

### Responsive Layout

- **Mobile:** Single column, stacked badges
- **Tablet:** 2-column grid, 3-4 badges per row
- **Desktop:** 4-6 badges per row, side-by-side stats

---

## 🔄 User Journey

### New User (0 points)
```
Sign up
  ↓
Complete first campaign
  ↓
Get "Launch Master's Debut" 🚀 badge (100 pts)
  ↓
Earn positive review
  ↓
See profile on marketplace
  ↓
View leaderboard
  ↓
Get motivated to earn more badges
```

### Growing User (500-2,000 points)
```
Complete 10 campaigns
  ↓
Unlock "Campaign Architect" 🏗️ badge
  ↓
Reach Apprentice level
  ↓
Specialize in industry
  ↓
Get industry badge
  ↓
Featured in marketplace
```

### Advanced User (5,000+ points)
```
Accumulate expertise
  ↓
Unlock Master level
  ↓
Get multiple certifications
  ↓
Earn "Platform Master" 🎖️ badge
  ↓
Featured on leaderboard
  ↓
Potential Hall of Fame
```

---

## 📊 Analytics

### Tracked Metrics

Per User:
- Total points earned
- Badges unlocked (count & list)
- Current level
- Specializations
- Rating average
- Campaign success rate
- Certification count

Per Badge:
- Unlock rate (% of users who have it)
- Most common unlocks
- Rarest badges

---

## 🚀 Next Steps

### Phase 1: Current Implementation
- ✅ Badge system with 28 templates
- ✅ Level progression (0-10,000 points)
- ✅ Public portfolio page
- ✅ Leaderboard with 4 views
- ✅ Mock data for 6 specialists

### Phase 2: Backend Integration
- [ ] Real achievement tracking
- [ ] Automated badge unlock notifications
- [ ] Point calculation system
- [ ] Historical data storage
- [ ] Email notifications on badge unlocks

### Phase 3: Advanced Features
- [ ] Achievement challenges (time-limited)
- [ ] Seasonal leaderboards
- [ ] Badge progression paths
- [ ] Mentor/mentee system
- [ ] Community forums by expertise
- [ ] Badge trading/gifting
- [ ] Custom profile colors for Legend tier

### Phase 4: Gamification Extensions
- [ ] Daily login streaks
- [ ] Weekly challenges
- [ ] Team leaderboards
- [ ] Sponsor badges
- [ ] Achievement milestones
- [ ] Profile customization for high tiers

---

## 📖 API Integration Points

When backend ready, connect to:

```typescript
// Get user portfolio
GET /api/portfolio/:userId

// Update portfolio stats
PUT /api/portfolio/:userId

// Check badge eligibility
POST /api/badges/check

// Unlock badge
POST /api/badges/unlock/:badgeId

// Get leaderboard
GET /api/leaderboard?tab=overall|rising|roas|rating

// Award points
POST /api/points/award
```

---

**Last Updated:** 2024-04-06
**Status:** Ready for User Testing
