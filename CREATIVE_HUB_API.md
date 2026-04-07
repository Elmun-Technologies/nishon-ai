# Creative Hub API Documentation

## Overview

The Creative Hub API provides endpoints for generating, managing, and tracking AI-powered ad creatives across multiple platforms.

## Features

- 🎨 **Image Generation**: AI-powered image ad creation with style presets
- 🎬 **Video Generation**: AI avatar video creation with customizable settings
- ✨ **Text-to-Image**: Generate images from text descriptions
- 📚 **UGC Templates**: 6 native-style social ad templates
- 📊 **Performance Analytics**: Track creative performance across platforms
- 👥 **Collaboration**: Share creatives with team members
- 📝 **Versioning**: Track creative iterations and versions

## API Endpoints

### Image Creative Generation

```http
POST /api/creatives/generate/image
Content-Type: application/json

{
  "prompt": "luxury watch with gold lighting",
  "stylePreset": "Professional Product",
  "aspectRatio": "1:1",
  "headline": "Luxury Timepiece",
  "copy": "Experience timeless elegance"
}
```

**Response:**
```json
{
  "id": "uuid",
  "workspaceId": "uuid",
  "type": "image",
  "generatedUrl": "https://...",
  "metadata": {
    "stylePreset": "Professional Product",
    "aspectRatio": "1:1"
  },
  "createdAt": "2026-04-07T12:00:00Z"
}
```

### Video Creative Generation

```http
POST /api/creatives/generate/video
Content-Type: application/json

{
  "script": "Discover our new product today",
  "avatarStyle": "Professional Woman",
  "duration": "30",
  "background": "Office"
}
```

### Text-to-Image Generation

```http
POST /api/creatives/generate/text-to-image
Content-Type: application/json

{
  "prompt": "minimalist modern office setup",
  "artStyle": "Photorealistic",
  "quality": "High"
}
```

### UGC Template Selection

```http
POST /api/creatives/templates/ugc
Content-Type: application/json

{
  "templateId": 1,
  "productTitle": "Premium Smartwatch",
  "keyBenefit": "30-day battery life",
  "script": "This watch has changed my life..."
}
```

### List Creatives

```http
GET /api/creatives?type=image&campaignId=uuid&limit=50&offset=0

Response:
{
  "creatives": [...],
  "pagination": {
    "total": 150,
    "limit": 50,
    "offset": 0
  }
}
```

### Get Creative Detail

```http
GET /api/creatives/:id

Response:
{
  "id": "uuid",
  "type": "image",
  "generatedUrl": "https://...",
  "metadata": {...},
  "performance": {
    "impressions": 1500,
    "clicks": 45,
    "ctr": 3.0,
    "conversions": 5,
    "roas": 2.5
  }
}
```

### Update Creative

```http
PUT /api/creatives/:id
Content-Type: application/json

{
  "headline": "Updated Headline",
  "copy": "Updated copy text"
}
```

### Delete Creative

```http
DELETE /api/creatives/:id
```

### Create Creative Version

```http
POST /api/creatives/:id/versions

Response:
{
  "id": "new-uuid",
  "version": 2,
  "parentCreativeId": "original-uuid"
}
```

### Share Creative

```http
POST /api/creatives/:id/share
Content-Type: application/json

{
  "userId": "uuid",
  "permission": "edit"
}
```

Permissions: `view`, `edit`, `admin`

### Get Collaborators

```http
GET /api/creatives/:id/collaborators

Response:
[
  {
    "userId": "uuid",
    "permission": "edit",
    "sharedAt": "2026-04-07T12:00:00Z"
  }
]
```

### Get Performance Metrics

```http
GET /api/creatives/:id/performance?days=30

Response:
[
  {
    "date": "2026-04-07",
    "impressions": 1500,
    "clicks": 45,
    "ctr": 3.0,
    "conversions": 5,
    "spend": 150.00,
    "revenue": 375.00,
    "roas": 2.5,
    "platform": "meta"
  }
]
```

## Database Schema

### Creatives Table

```sql
CREATE TABLE creatives (
  id UUID PRIMARY KEY,
  workspaceId UUID NOT NULL,
  campaignId UUID,
  type ENUM('image', 'video', 'text-to-image', 'ugc') NOT NULL,
  createdBy UUID NOT NULL,
  prompt TEXT NOT NULL,
  generatedUrl VARCHAR,
  generatedUrls JSONB DEFAULT '[]',
  headline VARCHAR,
  copy TEXT,
  metadata JSONB DEFAULT '{}',
  performance JSONB,
  isActive BOOLEAN DEFAULT true,
  sharedWith JSONB DEFAULT '[]',
  version INT DEFAULT 1,
  parentCreativeId UUID,
  tags JSONB DEFAULT '[]',
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_creatives_workspaceId_createdAt ON creatives(workspaceId, createdAt);
CREATE INDEX idx_creatives_campaignId ON creatives(campaignId);
CREATE INDEX idx_creatives_type ON creatives(type);
CREATE INDEX idx_creatives_createdBy ON creatives(createdBy);
```

### Creative Performance Table

```sql
CREATE TABLE creative_performance (
  id UUID PRIMARY KEY,
  creativeId UUID NOT NULL,
  campaignId UUID,
  workspaceId UUID NOT NULL,
  platform ENUM('meta', 'google', 'tiktok', 'yandex', 'internal'),
  date DATE NOT NULL,
  impressions INT DEFAULT 0,
  clicks INT DEFAULT 0,
  ctr DECIMAL(5,2) DEFAULT 0,
  conversions INT DEFAULT 0,
  cpc DECIMAL(10,2) DEFAULT 0,
  cpa DECIMAL(10,2) DEFAULT 0,
  spend DECIMAL(12,2) DEFAULT 0,
  revenue DECIMAL(12,2) DEFAULT 0,
  roas DECIMAL(10,2) DEFAULT 0,
  conversionRate DECIMAL(5,2) DEFAULT 0,
  metadata JSONB,
  syncedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_creative_performance_creativeId_date ON creative_performance(creativeId, date);
CREATE INDEX idx_creative_performance_campaignId ON creative_performance(campaignId);
CREATE INDEX idx_creative_performance_workspaceId ON creative_performance(workspaceId);
```

## Multi-Workspace Support

All creatives are scoped to a workspace:

```typescript
// Automatically filtered by workspace
GET /api/creatives  // Only returns creatives in current workspace
POST /api/creatives/generate/image  // Creates in current workspace
```

## Collaboration Features

### Share Creative

```typescript
// Share with specific permission
POST /api/creatives/:id/share
{
  "userId": "team-member-id",
  "permission": "edit"
}
```

### Permissions

- `view`: Read-only access
- `edit`: Can modify creative
- `admin`: Full control including sharing

## Integration with Campaigns

Link creatives to campaigns for performance tracking:

```typescript
POST /api/creatives/generate/image
{
  "prompt": "...",
  "campaignId": "meta-campaign-123"
}
```

Performance will be automatically tracked and aggregated by campaign.

## AI Model Integration

### Supported Models

#### Image Generation
- Stability AI (Stable Diffusion)
- DALL-E 3 (OpenAI)
- Midjourney API

#### Video Generation
- HeyGen (AI Avatars)
- Synthesia
- D-ID

#### Text-to-Image
- Stability AI
- DALL-E 3

### Environment Variables

```bash
# Stability AI
STABILITY_API_KEY=...
STABILITY_API_HOST=...

# OpenAI
OPENAI_API_KEY=...

# HeyGen
HEYGEN_API_KEY=...

# Midjourney
MIDJOURNEY_API_KEY=...
```

## Rate Limiting

- Free tier: 10 generations per day
- Pro tier: 100 generations per day
- Enterprise: Unlimited

## Error Handling

```json
{
  "statusCode": 400,
  "message": "Invalid prompt",
  "error": "BadRequestException"
}
```

Common errors:
- 400: Invalid input
- 401: Unauthorized
- 403: Forbidden (no workspace access)
- 429: Rate limit exceeded
- 500: Generation failed

## Examples

### Generate and Use Creative

```typescript
// 1. Generate image
const creative = await fetch('/api/creatives/generate/image', {
  method: 'POST',
  body: JSON.stringify({
    prompt: 'luxury product shot',
    stylePreset: 'Professional Product',
    aspectRatio: '1:1'
  })
})

// 2. Link to campaign
await fetch(`/api/creatives/${creative.id}`, {
  method: 'PUT',
  body: JSON.stringify({
    campaignId: 'meta-campaign-123'
  })
})

// 3. Share with team
await fetch(`/api/creatives/${creative.id}/share`, {
  method: 'POST',
  body: JSON.stringify({
    userId: 'team-member-id',
    permission: 'view'
  })
})

// 4. Track performance
const perf = await fetch(`/api/creatives/${creative.id}/performance?days=30`)
```

---

**Last Updated:** April 7, 2026  
**Version:** 1.0.0
