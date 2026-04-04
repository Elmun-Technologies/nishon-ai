# 🚀 Performa Campaign Wizard - Backend Implementation

## 📋 Overview

This document provides a comprehensive overview of the backend implementation for the Performa Campaign Wizard, including database schema, API structure, DTOs, services, and controllers.

## 🗄️ Database Schema

### Core Entities

#### Campaigns
- **Primary entity** for advertising campaigns
- **Fields**: name, objective, budget, currency, dates, status, autopilot_mode
- **Relationships**: ad_groups, platforms, creatives, extensions, utm_params
- **Validation**: Budget constraints, name uniqueness, date validation

#### Ad Groups
- **Audience targeting layer** within campaigns
- **Fields**: name, scenario, bid_adjustments, geo_targeting
- **Relationships**: keywords, interests, retargeting_rules, creatives, extensions
- **Validation**: Scenario constraints, bid adjustment ranges

#### Keywords
- **Search targeting** with match types and negative keywords
- **Fields**: phrase, match_type, bid, is_negative, status
- **Validation**: Match type constraints, bid minimums

#### Performance Metrics
- **Analytics data** for campaign optimization
- **Fields**: spend, clicks, impressions, conversions, cpc, cpm, ctr, roas
- **Aggregation**: Daily, weekly, monthly grouping

### Schema Features

```sql
-- Production-ready with proper constraints
- UUID primary keys for security
- Foreign key relationships with CASCADE deletes
- Check constraints for data validation
- Indexes for query performance
- Triggers for automatic timestamps
- Views for common queries
```

## 📡 API Architecture

### RESTful Endpoints

#### Campaign Management
```
POST /api/campaigns - Create campaign
GET /api/campaigns - List campaigns (with filtering/pagination)
GET /api/campaigns/:id - Get campaign details
PUT /api/campaigns/:id - Update campaign
DELETE /api/campaigns/:id - Soft delete campaign
```

#### Ad Group Management
```
POST /api/campaigns/:id/ad-groups - Create ad group
PUT /api/ad-groups/:id - Update ad group
```

#### Performance Analytics
```
GET /api/campaigns/:id/performance - Get metrics
GET /api/campaigns/:id/analytics - Get insights
```

#### Campaign Operations
```
POST /api/campaigns/:id/publish - Publish to platforms
POST /api/campaigns/:id/pause - Pause campaign
```

#### AI Agent Services
```
POST /api/ai/ad-copy - Generate ad copy
POST /api/ai/keywords - Generate keywords
POST /api/ai/budget-optimization - Optimize budget
POST /api/ai/image-prompt - Generate image prompts
```

### API Features

- **Authentication**: JWT-based with workspace isolation
- **Validation**: Comprehensive DTO validation with class-validator
- **Error Handling**: Structured error responses with meaningful messages
- **Pagination**: Standardized pagination for list endpoints
- **Filtering**: Flexible query parameters for data filtering
- **Swagger**: Complete API documentation with OpenAPI

## 📦 DTOs and Validation

### Request DTOs

#### CreateCampaignDto
```typescript
{
  name: string (3-100 chars, alphanumeric)
  objective: CampaignObjective (leads, traffic, sales, awareness)
  budget: number (0.01-1,000,000)
  budget_type: BudgetType (daily, weekly)
  currency: string (USD, EUR, RUB, UZS)
  start_date: Date
  end_date?: Date
  always_on: boolean
  autopilot_mode: string (manual, ai_optimized)
  bidding_strategy: BiddingStrategy
  utm?: UTMParamsDto
  platforms?: Platform[]
  creatives?: CreativeDto[]
  extensions?: ExtensionDto[]
}
```

#### Platform-Specific Validation
- **Google**: Headline ≤30 chars, Description ≤90 chars
- **Yandex**: Headline ≤56 chars
- **Meta**: Primary text ≤125 chars

### Response DTOs

#### CampaignResponseDto
```typescript
{
  id: string
  name: string
  objective: CampaignObjective
  budget: number
  currency: string
  status: string
  ad_groups_count: number
  platforms_count: number
  total_spend?: number
  total_clicks?: number
  total_conversions?: number
  avg_roas?: number
}
```

## ⚙️ Service Layer

### CampaignService

#### Core Operations
- **CRUD Operations**: Create, read, update, delete campaigns
- **Validation**: Business rule validation and data integrity
- **Relationships**: Manage complex entity relationships
- **Publishing**: Coordinate platform-specific publishing

#### Key Methods
```typescript
createCampaign(dto, workspaceId) - Create campaign with validation
getCampaigns(query, workspaceId) - Filtered list with pagination
publishCampaign(id, workspaceId) - Publish to all platforms
pauseCampaign(id, workspaceId) - Pause on all platforms
getPerformanceMetrics(id, query) - Analytics aggregation
getCampaignAnalytics(id) - Comprehensive insights
```

#### Transaction Management
- **Database transactions** for complex operations
- **Error handling** with rollback on failures
- **Platform coordination** with partial success handling

### AI Agent Service

#### AdCopyAgent
- **Input**: Product name, benefits, audience, objective, platform
- **Output**: Platform-specific headlines, descriptions, CTAs
- **Constraints**: Respect platform character limits
- **Mock Implementation**: Realistic delays and responses

#### KeywordAgent
- **Input**: Product name, niche, platform, match type
- **Output**: Relevant keywords with match types
- **Features**: Negative keyword generation, quality scoring

#### BudgetOptimizer
- **Input**: Objective, industry, audience, budget, currency
- **Output**: Performance predictions and allocation recommendations
- **Features**: Multiplier-based calculations, platform-specific logic

## 🎯 Controller Layer

### CampaignController

#### HTTP Methods
- **GET**: Read operations with query parameter filtering
- **POST**: Create operations with request body validation
- **PUT**: Update operations with partial updates
- **DELETE**: Soft delete operations

#### Security Features
- **JWT Authentication**: Secure token-based authentication
- **Workspace Isolation**: Users can only access their workspace data
- **Input Validation**: Comprehensive request validation
- **Error Handling**: Structured error responses

#### API Documentation
- **Swagger Integration**: Complete API documentation
- **Operation Descriptions**: Clear endpoint descriptions
- **Response Examples**: Sample response structures
- **Parameter Documentation**: Detailed parameter descriptions

## 🔌 Platform Integration

### Adapter Pattern

#### MetaAdsAdapter
```typescript
interface ICampaignAdapter {
  createCampaign(campaign): Promise<PlatformResult>
  updateCampaign(id, campaign): Promise<PlatformResult>
  pauseCampaign(id): Promise<PlatformResult>
  syncCampaign(id): Promise<PlatformResult>
}
```

#### Platform-Specific Features
- **Meta Ads**: OAuth 2.0, Campaign/AdSet/Ad structure
- **Google Ads**: OAuth 2.0, Responsive Search Ads
- **Yandex Direct**: JSON-RPC v5, Text Ads
- **Telegram Ads**: Manual flow (future implementation)

### CampaignPublisher Service

#### Publishing Workflow
1. **Validation**: Check campaign readiness
2. **Platform Iteration**: Process each selected platform
3. **Error Handling**: Continue on platform failures
4. **Status Tracking**: Update platform and campaign status
5. **Result Aggregation**: Return success/failure summary

#### Error Recovery
- **Partial Success**: Continue with other platforms on failure
- **Detailed Logging**: Track specific platform errors
- **Status Updates**: Update database with platform-specific status
- **User Feedback**: Return clear success/failure information

## 📊 Analytics and Monitoring

### Performance Metrics

#### Data Collection
- **Daily Aggregation**: Platform-specific daily metrics
- **Real-time Updates**: Live performance tracking
- **Historical Data**: Long-term trend analysis
- **Cross-platform**: Unified metrics view

#### Metrics Available
- **Spend**: Total advertising spend
- **Clicks**: Total clicks across platforms
- **Conversions**: Conversion tracking and attribution
- **ROAS**: Return on ad spend calculation
- **CPC/CPM**: Cost per click/cost per mille
- **CTR**: Click-through rate

### Analytics Features

#### Campaign Analytics
- **Performance Summary**: High-level campaign metrics
- **Platform Breakdown**: Per-platform performance
- **Ad Group Analysis**: Ad group-level insights
- **Keyword Performance**: Keyword effectiveness analysis

#### AI Recommendations
- **Budget Optimization**: AI-driven budget allocation
- **Creative Optimization**: Suggestions for creative improvements
- **Targeting Optimization**: Audience and targeting recommendations
- **Bidding Optimization**: Bid strategy recommendations

## 🔧 Development Features

### Testing Strategy

#### Unit Tests
- **Service Layer**: Business logic testing
- **Validation**: DTO validation testing
- **Error Handling**: Error scenario testing

#### Integration Tests
- **Database**: Entity and relationship testing
- **API Endpoints**: HTTP endpoint testing
- **Platform Integration**: Mock platform testing

#### E2E Tests
- **User Workflows**: Complete user journey testing
- **Cross-platform**: Multi-platform workflow testing
- **Error Scenarios**: Error handling workflow testing

### Performance Optimization

#### Database Optimization
- **Indexing**: Strategic index placement
- **Query Optimization**: Efficient query patterns
- **Connection Pooling**: Database connection management
- **Caching**: Strategic caching for frequently accessed data

#### API Optimization
- **Pagination**: Efficient data retrieval
- **Filtering**: Optimized query parameters
- **Response Compression**: Reduced payload sizes
- **Rate Limiting**: API usage protection

### Security Features

#### Authentication & Authorization
- **JWT Tokens**: Secure authentication
- **Role-based Access**: User permission management
- **Workspace Isolation**: Data separation by workspace
- **Input Sanitization**: Protection against injection attacks

#### Data Protection
- **Encryption**: Sensitive data encryption
- **Audit Logging**: Security event logging
- **Access Control**: Granular permission control
- **Data Validation**: Comprehensive input validation

## 🚀 Deployment Ready

### Production Features

#### Configuration Management
- **Environment Variables**: Secure configuration management
- **Feature Flags**: Gradual feature rollout
- **Database Migrations**: Schema version management
- **Health Checks**: Service health monitoring

#### Monitoring & Logging
- **Structured Logging**: Comprehensive application logging
- **Performance Monitoring**: Application performance tracking
- **Error Tracking**: Error monitoring and alerting
- **Metrics Collection**: Business and technical metrics

#### Scalability
- **Horizontal Scaling**: Multi-instance deployment
- **Database Scaling**: Read replicas and sharding
- **Caching Strategy**: Multi-level caching
- **Load Balancing**: Traffic distribution

This backend implementation provides a solid foundation for the Performa Campaign Wizard, with production-ready features, comprehensive testing, and scalable architecture.