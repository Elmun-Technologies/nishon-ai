import { Injectable, NotFoundException, BadRequestException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource, In, Between } from 'typeorm';
import { CreateCampaignDto, UpdateCampaignDto, CreateAdGroupDto, UpdateAdGroupDto, CampaignQueryDto, PerformanceQueryDto } from '../dto/campaign.dto';
import { Campaign, AdGroup, Keyword, Creative, Extension, PerformanceMetrics, CampaignPlatform, UTMParams, GeoTargeting, RetargetingRule, Interest } from '../entities';
import { CampaignObjective, Platform } from '../enums';
import { CampaignPublisher } from './campaign-publisher.service';
import { validateCampaignName, validateBudget } from '../dto/campaign.dto';

@Injectable()
export class CampaignService {
  constructor(
    @InjectRepository(Campaign)
    private campaignRepository: Repository<Campaign>,
    @InjectRepository(AdGroup)
    private adGroupRepository: Repository<AdGroup>,
    @InjectRepository(Keyword)
    private keywordRepository: Repository<Keyword>,
    @InjectRepository(Creative)
    private creativeRepository: Repository<Creative>,
    @InjectRepository(Extension)
    private extensionRepository: Repository<Extension>,
    @InjectRepository(PerformanceMetrics)
    private performanceRepository: Repository<PerformanceMetrics>,
    @InjectRepository(CampaignPlatform)
    private campaignPlatformRepository: Repository<CampaignPlatform>,
    @InjectRepository(UTMParams)
    private utmRepository: Repository<UTMParams>,
    @InjectRepository(GeoTargeting)
    private geoTargetingRepository: Repository<GeoTargeting>,
    @InjectRepository(RetargetingRule)
    private retargetingRuleRepository: Repository<RetargetingRule>,
    @InjectRepository(Interest)
    private interestRepository: Repository<Interest>,
    private dataSource: DataSource,
    private campaignPublisher: CampaignPublisher,
  ) {}

  // Campaign CRUD operations

  async createCampaign(createCampaignDto: CreateCampaignDto, workspaceId: string): Promise<Campaign> {
    const { name, objective, budget, budget_type, currency, start_date, end_date, always_on, 
            autopilot_mode, bidding_strategy, utm, platforms, creatives, extensions } = createCampaignDto;

    // Validation
    const nameErrors = validateCampaignName(name);
    if (nameErrors.length > 0) {
      throw new BadRequestException(nameErrors);
    }

    const budgetErrors = validateBudget(budget, currency);
    if (budgetErrors.length > 0) {
      throw new BadRequestException(budgetErrors);
    }

    // Check for duplicate campaign name
    const existingCampaign = await this.campaignRepository.findOne({
      where: { name, workspaceId }
    });

    if (existingCampaign) {
      throw new ConflictException('Campaign with this name already exists');
    }

    // Create campaign
    const campaign = this.campaignRepository.create({
      name,
      objective,
      budget,
      budget_type,
      currency,
      start_date,
      end_date,
      always_on,
      autopilot_mode,
      bidding_strategy,
      workspaceId
    });

    const savedCampaign = await this.campaignRepository.save(campaign);

    // Create UTM parameters if provided
    if (utm) {
      const utmParams = this.utmRepository.create({
        ...utm,
        campaignId: savedCampaign.id
      });
      await this.utmRepository.save(utmParams);
    }

    // Create platforms
    if (platforms && platforms.length > 0) {
      const platformEntities = platforms.map(platform => 
        this.campaignPlatformRepository.create({
          campaignId: savedCampaign.id,
          platform,
          platformStatus: 'draft'
        })
      );
      await this.campaignPlatformRepository.save(platformEntities);
    }

    // Create creatives if provided
    if (creatives && creatives.length > 0) {
      const creativeEntities = creatives.map(creative => 
        this.creativeRepository.create({
          ...creative,
          campaignId: savedCampaign.id
        })
      );
      await this.creativeRepository.save(creativeEntities);
    }

    // Create extensions if provided
    if (extensions && extensions.length > 0) {
      const extensionEntities = extensions.map(extension => 
        this.extensionRepository.create({
          ...extension,
          campaignId: savedCampaign.id
        })
      );
      await this.extensionRepository.save(extensionEntities);
    }

    return this.campaignRepository.findOne({
      where: { id: savedCampaign.id },
      relations: ['adGroups', 'platforms', 'creatives', 'extensions', 'utm']
    });
  }

  async getCampaigns(workspaceId: string, query: CampaignQueryDto): Promise<{ campaigns: Campaign[], total: number }> {
    const {
      status,
      objective,
      autopilot_mode,
      start_date,
      end_date,
      search,
      page = 1,
      limit = 20,
      sort = 'created_at',
      order = 'DESC'
    } = query;

    const queryBuilder = this.campaignRepository.createQueryBuilder('campaign')
      .leftJoinAndSelect('campaign.adGroups', 'adGroups')
      .leftJoinAndSelect('campaign.platforms', 'platforms')
      .leftJoinAndSelect('campaign.creatives', 'creatives')
      .leftJoinAndSelect('campaign.extensions', 'extensions')
      .leftJoinAndSelect('campaign.utm', 'utm')
      .where('campaign.workspaceId = :workspaceId', { workspaceId });

    // Apply filters
    if (status) {
      queryBuilder.andWhere('campaign.status = :status', { status });
    }

    if (objective) {
      queryBuilder.andWhere('campaign.objective = :objective', { objective });
    }

    if (autopilot_mode) {
      queryBuilder.andWhere('campaign.autopilot_mode = :autopilot_mode', { autopilot_mode });
    }

    if (start_date) {
      queryBuilder.andWhere('campaign.start_date >= :start_date', { start_date });
    }

    if (end_date) {
      queryBuilder.andWhere('campaign.end_date <= :end_date', { end_date });
    }

    if (search) {
      queryBuilder.andWhere('(campaign.name ILIKE :search OR campaign.objective ILIKE :search)', {
        search: `%${search}%`
      });
    }

    // Apply sorting
    queryBuilder.orderBy(`campaign.${sort}`, order);

    // Apply pagination
    const offset = (page - 1) * limit;
    queryBuilder.skip(offset).take(limit);

    const [campaigns, total] = await queryBuilder.getManyAndCount();

    return { campaigns, total };
  }

  async getCampaignById(id: string, workspaceId: string): Promise<Campaign> {
    const campaign = await this.campaignRepository.findOne({
      where: { id, workspaceId },
      relations: [
        'adGroups',
        'adGroups.keywords',
        'adGroups.creatives',
        'adGroups.extensions',
        'adGroups.geoTargeting',
        'adGroups.retargetingRules',
        'adGroups.interests',
        'platforms',
        'creatives',
        'extensions',
        'utm'
      ]
    });

    if (!campaign) {
      throw new NotFoundException('Campaign not found');
    }

    return campaign;
  }

  async updateCampaign(id: string, updateCampaignDto: UpdateCampaignDto, workspaceId: string): Promise<Campaign> {
    const campaign = await this.getCampaignById(id, workspaceId);

    // Validation for name changes
    if (updateCampaignDto.name && updateCampaignDto.name !== campaign.name) {
      const nameErrors = validateCampaignName(updateCampaignDto.name);
      if (nameErrors.length > 0) {
        throw new BadRequestException(nameErrors);
      }

      // Check for duplicate name
      const existingCampaign = await this.campaignRepository.findOne({
        where: { name: updateCampaignDto.name, workspaceId, id: id }
      });

      if (existingCampaign) {
        throw new ConflictException('Campaign with this name already exists');
      }
    }

    // Update campaign
    Object.assign(campaign, updateCampaignDto);
    await this.campaignRepository.save(campaign);

    return this.getCampaignById(id, workspaceId);
  }

  async deleteCampaign(id: string, workspaceId: string): Promise<void> {
    const campaign = await this.getCampaignById(id, workspaceId);

    // Soft delete by setting deleted_at
    campaign.deletedAt = new Date();
    await this.campaignRepository.save(campaign);
  }

  // Ad Group operations

  async createAdGroup(campaignId: string, createAdGroupDto: CreateAdGroupDto, workspaceId: string): Promise<AdGroup> {
    const campaign = await this.getCampaignById(campaignId, workspaceId);

    const adGroup = this.adGroupRepository.create({
      ...createAdGroupDto,
      campaignId: campaign.id
    });

    const savedAdGroup = await this.adGroupRepository.save(adGroup);

    // Create related entities
    if (createAdGroupDto.keywords) {
      const keywordEntities = createAdGroupDto.keywords.map(keyword =>
        this.keywordRepository.create({
          ...keyword,
          adGroupId: savedAdGroup.id
        })
      );
      await this.keywordRepository.save(keywordEntities);
    }

    if (createAdGroupDto.creatives) {
      const creativeEntities = createAdGroupDto.creatives.map(creative =>
        this.creativeRepository.create({
          ...creative,
          adGroupId: savedAdGroup.id
        })
      );
      await this.creativeRepository.save(creativeEntities);
    }

    if (createAdGroupDto.extensions) {
      const extensionEntities = createAdGroupDto.extensions.map(extension =>
        this.extensionRepository.create({
          ...extension,
          adGroupId: savedAdGroup.id
        })
      );
      await this.extensionRepository.save(extensionEntities);
    }

    if (createAdGroupDto.geo_targeting) {
      const geoTargeting = this.geoTargetingRepository.create({
        ...createAdGroupDto.geo_targeting,
        adGroupId: savedAdGroup.id
      });
      await this.geoTargetingRepository.save(geoTargeting);
    }

    if (createAdGroupDto.retargeting_rules) {
      const retargetingEntities = createAdGroupDto.retargeting_rules.map(rule =>
        this.retargetingRuleRepository.create({
          ...rule,
          adGroupId: savedAdGroup.id
        })
      );
      await this.retargetingRuleRepository.save(retargetingEntities);
    }

    if (createAdGroupDto.interests) {
      const interestEntities = createAdGroupDto.interests.map(interest =>
        this.interestRepository.create({
          ...interest,
          adGroupId: savedAdGroup.id
        })
      );
      await this.interestRepository.save(interestEntities);
    }

    return this.adGroupRepository.findOne({
      where: { id: savedAdGroup.id },
      relations: ['keywords', 'creatives', 'extensions', 'geoTargeting', 'retargetingRules', 'interests']
    });
  }

  async updateAdGroup(id: string, updateAdGroupDto: UpdateAdGroupDto, workspaceId: string): Promise<AdGroup> {
    const adGroup = await this.adGroupRepository.findOne({
      where: { id },
      relations: ['campaign']
    });

    if (!adGroup || adGroup.campaign.workspaceId !== workspaceId) {
      throw new NotFoundException('Ad Group not found');
    }

    Object.assign(adGroup, updateAdGroupDto);
    await this.adGroupRepository.save(adGroup);

    return this.adGroupRepository.findOne({
      where: { id },
      relations: ['keywords', 'creatives', 'extensions', 'geoTargeting', 'retargetingRules', 'interests']
    });
  }

  // Performance metrics

  async getPerformanceMetrics(campaignId: string, query: PerformanceQueryDto, workspaceId: string): Promise<PerformanceMetrics[]> {
    const { start_date, end_date, platform, group_by = 'day' } = query;

    const queryBuilder = this.performanceRepository.createQueryBuilder('metrics')
      .where('metrics.campaignId = :campaignId', { campaignId });

    if (start_date) {
      queryBuilder.andWhere('metrics.date >= :start_date', { start_date });
    }

    if (end_date) {
      queryBuilder.andWhere('metrics.date <= :end_date', { end_date });
    }

    if (platform) {
      queryBuilder.andWhere('metrics.platform = :platform', { platform });
    }

    // Group by date
    if (group_by === 'week') {
      queryBuilder.addSelect("DATE_TRUNC('week', metrics.date)", 'week_date')
        .groupBy('week_date')
        .addGroupBy('metrics.platform')
        .addOrderBy('week_date', 'ASC');
    } else if (group_by === 'month') {
      queryBuilder.addSelect("DATE_TRUNC('month', metrics.date)", 'month_date')
        .groupBy('month_date')
        .addGroupBy('metrics.platform')
        .addOrderBy('month_date', 'ASC');
    } else {
      queryBuilder.groupBy('metrics.date')
        .addGroupBy('metrics.platform')
        .addOrderBy('metrics.date', 'ASC');
    }

    // Aggregate metrics
    queryBuilder.addSelect([
      'SUM(metrics.spend) as total_spend',
      'SUM(metrics.clicks) as total_clicks',
      'SUM(metrics.impressions) as total_impressions',
      'SUM(metrics.conversions) as total_conversions',
      'AVG(metrics.cpc) as avg_cpc',
      'AVG(metrics.cpm) as avg_cpm',
      'AVG(metrics.ctr) as avg_ctr',
      'AVG(metrics.roas) as avg_roas'
    ]);

    return queryBuilder.getRawMany();
  }

  async updatePerformanceMetrics(campaignId: string, platform: Platform, date: Date, metrics: Partial<PerformanceMetrics>): Promise<void> {
    const existingMetrics = await this.performanceRepository.findOne({
      where: { campaignId, platform, date }
    });

    if (existingMetrics) {
      Object.assign(existingMetrics, metrics);
      await this.performanceRepository.save(existingMetrics);
    } else {
      const newMetrics = this.performanceRepository.create({
        campaignId,
        platform,
        date,
        ...metrics
      });
      await this.performanceRepository.save(newMetrics);
    }
  }

  // Campaign publishing

  async publishCampaign(id: string, workspaceId: string): Promise<{ success: boolean; platforms: { platform: string; status: string; error?: string }[] }> {
    const campaign = await this.getCampaignById(id, workspaceId);

    if (campaign.status === 'active') {
      throw new BadRequestException('Campaign is already active');
    }

    const platforms = await this.campaignPlatformRepository.find({
      where: { campaignId: campaign.id }
    });

    const results = [];

    for (const platform of platforms) {
      try {
        const result = await this.campaignPublisher.publishCampaign(campaign, platform.platform);
        results.push({
          platform: platform.platform,
          status: result.success ? 'success' : 'failed',
          error: result.error
        });

        // Update platform status
        platform.platformStatus = result.success ? 'active' : 'error';
        platform.syncAt = new Date();
        await this.campaignPlatformRepository.save(platform);

      } catch (error) {
        results.push({
          platform: platform.platform,
          status: 'error',
          error: error.message
        });
      }
    }

    // Update campaign status
    campaign.status = 'active';
    campaign.publishedAt = new Date();
    await this.campaignRepository.save(campaign);

    return {
      success: results.every(r => r.status === 'success'),
      platforms: results
    };
  }

  async pauseCampaign(id: string, workspaceId: string): Promise<void> {
    const campaign = await this.getCampaignById(id, workspaceId);

    if (campaign.status !== 'active') {
      throw new BadRequestException('Campaign is not active');
    }

    const platforms = await this.campaignPlatformRepository.find({
      where: { campaignId: campaign.id }
    });

    for (const platform of platforms) {
      try {
        await this.campaignPublisher.pauseCampaign(campaign, platform.platform);
        platform.platformStatus = 'paused';
        platform.syncAt = new Date();
        await this.campaignPlatformRepository.save(platform);
      } catch (error) {
        // Log error but continue with other platforms
        console.error(`Failed to pause campaign on ${platform.platform}:`, error);
      }
    }

    campaign.status = 'paused';
    await this.campaignRepository.save(campaign);
  }

  // Analytics and insights

  async getCampaignAnalytics(id: string, workspaceId: string): Promise<any> {
    const campaign = await this.getCampaignById(id, workspaceId);

    // Get performance summary
    const performanceSummary = await this.performanceRepository
      .createQueryBuilder('metrics')
      .select([
        'SUM(metrics.spend) as total_spend',
        'SUM(metrics.clicks) as total_clicks',
        'SUM(metrics.conversions) as total_conversions',
        'AVG(metrics.roas) as avg_roas',
        'COUNT(DISTINCT metrics.platform) as platforms_count'
      ])
      .where('metrics.campaignId = :campaignId', { campaignId: campaign.id })
      .getRawOne();

    // Get ad group summary
    const adGroupSummary = await this.adGroupRepository
      .createQueryBuilder('adGroup')
      .select([
        'COUNT(adGroup.id) as total_ad_groups',
        'COUNT(CASE WHEN adGroup.status = \'active\' THEN 1 END) as active_ad_groups'
      ])
      .where('adGroup.campaignId = :campaignId', { campaignId: campaign.id })
      .getRawOne();

    // Get keyword summary
    const keywordSummary = await this.keywordRepository
      .createQueryBuilder('keyword')
      .select([
        'COUNT(keyword.id) as total_keywords',
        'COUNT(CASE WHEN keyword.is_negative = true THEN 1 END) as negative_keywords',
        'COUNT(CASE WHEN keyword.status = \'active\' THEN 1 END) as active_keywords'
      ])
      .innerJoin('keyword.adGroup', 'adGroup')
      .where('adGroup.campaignId = :campaignId', { campaignId: campaign.id })
      .getRawOne();

    return {
      campaign: {
        id: campaign.id,
        name: campaign.name,
        status: campaign.status,
        objective: campaign.objective,
        budget: campaign.budget,
        currency: campaign.currency,
        startDate: campaign.start_date,
        endDate: campaign.end_date
      },
      performance: performanceSummary,
      adGroups: adGroupSummary,
      keywords: keywordSummary
    };
  }
}