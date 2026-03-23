# 📋 Sprint Planning & Technical Implementation Guide

## 🎯 Sprint Breakdown

### 🚀 Sprint 1: MVP Core (Wizard UI + Meta Integration)
**Duration:** 2 weeks  
**Goal:** Complete wizard UI with Meta Ads integration

#### Week 1: Wizard UI Foundation
**Days 1-2: Platform Selection & Campaign Settings**
- [ ] Create platform selection component with multi-select
- [ ] Implement campaign settings form with validation
- [ ] Add UTM builder component
- [ ] Create form state management (React hooks)

**Days 3-4: Ad Group & Creative Assets**
- [ ] Build ad group configuration component
- [ ] Implement geo-targeting (list + map mode)
- [ ] Create keyword management with AI generation
- [ ] Build creative assets component (headlines, descriptions, media)

**Days 5: Preview & Publish**
- [ ] Create platform-specific preview components
- [ ] Implement publish workflow with progress UI
- [ ] Add save as draft functionality
- [ ] Create responsive design for mobile

#### Week 2: Meta Integration & AI
**Days 1-2: AdCopyAgent Implementation**
- [ ] Create AdCopyAgent service with platform constraints
- [ ] Implement AI generation with mock responses
- [ ] Add loading states and error handling
- [ ] Create validation for AI inputs

**Days 3-4: Meta Ads API Integration**
- [ ] Implement Meta Ads OAuth 2.0 authentication
- [ ] Create MetaAdapter with campaign creation
- [ ] Implement ad set and ad creation
- [ ] Add error handling and status sync

**Days 5: Testing & Polish**
- [ ] Unit tests for form validation
- [ ] Integration tests for Meta integration
- [ ] E2E tests for wizard flow
- [ ] Performance optimization and bug fixes

---

### 🚀 Sprint 2: Yandex + Keyword AI
**Duration:** 2 weeks  
**Goal:** Yandex Direct integration + KeywordAgent

#### Week 1: Yandex Integration
**Days 1-2: Yandex API Setup**
- [ ] Implement Yandex Direct OAuth token management
- [ ] Create JSON-RPC v5 client
- [ ] Implement campaign creation (TEXT_CAMPAIGN)
- [ ] Add geo-targeting support

**Days 3-4: Ad Group & Text Ads**
- [ ] Implement ad group creation with keyword management
- [ ] Create text ads with headline/text/display domain
- [ ] Add bid configuration
- [ ] Implement performance metrics sync

**Days 5: Error Handling & Testing**
- [ ] Platform-specific error mapping
- [ ] Retry logic for API calls
- [ ] Unit tests for Yandex adapter
- [ ] Integration tests with real API

#### Week 2: KeywordAgent & Advanced Features
**Days 1-2: KeywordAgent Implementation**
- [ ] Create KeywordAgent service
- [ ] Implement keyword suggestion algorithm
- [ ] Add negative keyword generation
- [ ] Create match type mapping

**Days 3-4: Advanced Features**
- [ ] Implement bid adjustments (device, audience, format)
- [ ] Add extensions (sitelinks, callouts, promo)
- [ ] Create AI optimization toggles
- [ ] Add advanced targeting options

**Days 5: Testing & Integration**
- [ ] Integration tests for KeywordAgent
- [ ] End-to-end tests for Yandex workflow
- [ ] Performance testing
- [ ] Bug fixes and polish

---

### 🚀 Sprint 3: Google Ads + Dashboard
**Duration:** 2 weeks  
**Goal:** Google Ads API + Unified dashboard

#### Week 1: Google Ads Integration
**Days 1-2: Google API Setup**
- [ ] Implement Google Ads OAuth 2.0 authentication
- [ ] Create GoogleAdapter with campaign creation
- [ ] Implement campaign types (SEARCH, SHOPPING, DISPLAY)
- [ ] Add budget delivery options

**Days 3-4: Ad Groups & Responsive Search Ads**
- [ ] Implement ad group creation with keyword management
- [ ] Create Responsive Search Ads with multiple headlines/descriptions
- [ ] Add pinning options for RSAs
- [ ] Implement bid adjustments

**Days 5: Performance & Testing**
- [ ] Performance optimization for Google API
- [ ] Error handling and retry logic
- [ ] Unit tests for Google adapter
- [ ] Integration tests

#### Week 2: Dashboard & BudgetOptimizer
**Days 1-2: BudgetOptimizer Implementation**
- [ ] Create BudgetOptimizer service
- [ ] Implement performance prediction algorithms
- [ ] Add budget allocation logic
- [ ] Create ROI optimization suggestions

**Days 3-4: Unified Dashboard**
- [ ] Create campaign overview component
- [ ] Implement platform breakdown charts
- [ ] Add AI recommendations engine
- [ ] Create real-time metrics display

**Days 5: Testing & Polish**
- [ ] Dashboard integration tests
- [ ] Performance testing for large datasets
- [ ] User acceptance testing
- [ ] Bug fixes and optimization

---

### 🚀 Sprint 4: Advanced AI + Enterprise Features
**Duration:** 2 weeks  
**Goal:** Advanced AI features + Enterprise capabilities

#### Week 1: Advanced AI
**Days 1-2: ImagePromptAgent**
- [ ] Create ImagePromptAgent service
- [ ] Implement style presets (minimalist, bold, professional)
- [ ] Add platform-specific guidelines
- [ ] Integrate with Midjourney/DALL·E APIs

**Days 3-4: A/B Testing Framework**
- [ ] Create A/B testing engine
- [ ] Implement creative variant testing
- [ ] Add audience segment testing
- [ ] Create budget allocation testing

**Days 5: Attribution Modeling**
- [ ] Implement attribution models (first touch, last touch, linear)
- [ ] Create cross-platform attribution
- [ ] Add conversion tracking
- [ ] Create attribution reports

#### Week 2: Enterprise Features
**Days 1-2: Campaign Control**
- [ ] Implement global campaign controls
- [ ] Add real-time sync status
- [ ] Create platform-specific controls
- [ ] Add bulk operations

**Days 3-4: Predictive Analytics**
- [ ] Create performance forecasting
- [ ] Implement seasonal adjustment algorithms
- [ ] Add predictive budget optimization
- [ ] Create trend analysis

**Days 5: Final Testing & Deployment**
- [ ] Full system integration testing
- [ ] Performance testing under load
- [ ] Security audit and fixes
- [ ] Production deployment preparation

---

## 🔧 Technical Implementation Details

### Database Schema (TypeORM)
```typescript
// Campaign entity
@Entity()
export class Campaign {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column({ type: 'enum', enum: CampaignObjective })
  objective: CampaignObjective;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  budget: number;

  @Column({ type: 'enum', enum: BudgetType })
  budgetType: BudgetType;

  @Column({ type: 'date' })
  startDate: Date;

  @Column({ type: 'date', nullable: true })
  endDate: Date;

  @Column({ type: 'jsonb' })
  platforms: Platform[];

  @Column({ type: 'jsonb' })
  utm: UTMParams;

  @OneToMany(() => AdGroup, adGroup => adGroup.campaign)
  adGroups: AdGroup[];
}

// AdGroup entity
@Entity()
export class AdGroup {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column({ type: 'enum', enum: Scenario })
  scenario: Scenario;

  @Column({ type: 'jsonb' })
  geoTargeting: GeoTargeting;

  @Column({ type: 'jsonb' })
  keywords: Keyword[];

  @Column({ type: 'jsonb' })
  negativeKeywords: string[];

  @Column({ type: 'jsonb' })
  interests: string[];

  @ManyToOne(() => Campaign, campaign => campaign.adGroups)
  campaign: Campaign;

  @OneToMany(() => Ad, ad => ad.adGroup)
  ads: Ad[];
}
```

### API Endpoints Structure
```typescript
// Campaign endpoints
POST /api/campaigns - Create campaign
GET /api/campaigns - List campaigns
GET /api/campaigns/:id - Get campaign
PUT /api/campaigns/:id - Update campaign
DELETE /api/campaigns/:id - Delete campaign

// Platform endpoints
POST /api/platforms/auth/:platform - OAuth redirect
GET /api/platforms/callback/:platform - OAuth callback
GET /api/platforms/status/:platform - Check connection status

// AI endpoints
POST /api/ai/ad-copy - Generate ad copy
POST /api/ai/keywords - Generate keywords
POST /api/ai/budget - Optimize budget
POST /api/ai/image-prompt - Generate image prompt

// Analytics endpoints
GET /api/analytics/campaigns - Campaign analytics
GET /api/analytics/platforms - Platform breakdown
GET /api/analytics/recommendations - AI recommendations
```

### Error Handling Strategy
```typescript
// Global error handler
export class GlobalExceptionFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    if (exception instanceof PlatformError) {
      // Platform-specific error mapping
      const platformError = this.mapPlatformError(exception);
      response.status(platformError.status).json({
        error: platformError.message,
        platform: exception.platform,
        code: exception.code
      });
    } else {
      // Generic error handling
      response.status(500).json({
        error: 'Internal server error',
        timestamp: new Date().toISOString(),
        path: request.url
      });
    }
  }
}
```

### Testing Strategy
```typescript
// Unit tests structure
describe('CampaignService', () => {
  let service: CampaignService;
  let repository: Repository<Campaign>;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [CampaignService, { provide: getRepositoryToken(Campaign), useValue: mockRepository }]
    }).compile();

    service = module.get<CampaignService>(CampaignService);
    repository = module.get<Repository<Campaign>>(getRepositoryToken(Campaign));
  });

  describe('create', () => {
    it('should create a campaign', async () => {
      const createCampaignDto = { name: 'Test Campaign', objective: 'leads' };
      const result = await service.create(createCampaignDto);
      expect(result).toBeDefined();
      expect(result.name).toBe(createCampaignDto.name);
    });
  });
});

// Integration tests structure
describe('CampaignController (e2e)', () => {
  let app: INestApplication;

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [CampaignModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  it('/POST campaigns (e2e)', () => {
    return request(app.getHttpServer())
      .post('/campaigns')
      .send({ name: 'Test Campaign', objective: 'leads' })
      .expect(201)
      .expect((res) => {
        expect(res.body.name).toBe('Test Campaign');
      });
  });
});
```

### Performance Optimization
```typescript
// Caching strategy
@Cacheable({
  ttl: 300000, // 5 minutes
  keyGenerator: (args) => `campaign:${args[0]}`
})
async getCampaign(id: string): Promise<Campaign> {
  return this.campaignRepository.findOne(id);
}

// Database optimization
@Entity()
export class Campaign {
  @Index('idx_campaign_status') // Database index
  @Column({ default: 'active' })
  status: string;

  @Index(['createdAt', 'updatedAt']) // Composite index
  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}

// Lazy loading for heavy relationships
@OneToMany(() => AdGroup, adGroup => adGroup.campaign, { lazy: true })
@LazyRelations(['adGroups'])
adGroups: Promise<AdGroup[]>;
```

Bu sprint planning va technical implementation guide asosida har bir sprintda nima qilish kerakligi aniq ko'rinadi. Har bir sprint oxirida MVP tayyor bo'lib, keyingi sprintga o'tishdan oldin foydalanuvchilardan feedback olish mumkin.