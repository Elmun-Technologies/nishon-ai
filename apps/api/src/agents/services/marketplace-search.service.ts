import {
  Injectable,
  Logger,
  BadRequestException,
  NotFoundException,
} from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import {
  Repository,
  SelectQueryBuilder,
  Between,
  In,
  IsNull,
  Not,
} from "typeorm";
import { Cron, CronExpression } from "@nestjs/schedule";
import { AgentProfile } from "../entities/agent-profile.entity";
import { AgentCertification } from "../entities/agent-certification.entity";
import { AgentLanguage } from "../entities/agent-language.entity";
import { AgentGeographicCoverage } from "../entities/agent-geographic-coverage.entity";
import { AgentPlatformMetrics } from "../entities/agent-platform-metrics.entity";
import { AgentReview } from "../entities/agent-review.entity";
import { AgentHistoricalPerformance } from "../entities/agent-historical-performance.entity";
import { MarketplaceCertification } from "../entities/marketplace-certification.entity";

/**
 * Filters for marketplace advanced search
 */
export interface MarketplaceFilters {
  query?: string; // Full-text search
  platforms?: string[]; // meta, google, yandex, tiktok, telegram
  niches?: string[]; // e-commerce, fashion, etc
  certifications?: string[]; // Certification IDs
  languages?: string[]; // Language codes (en, uz, ru, kk)
  countries?: string[]; // Country codes (US, UZ, KZ, etc)
  minRating?: number; // Minimum rating (0-5)
  minExperience?: number; // Minimum experience years
  minRoas?: number; // Minimum average ROAS
  minCpa?: number; // Minimum CPA threshold
  maxCpa?: number; // Maximum CPA threshold
  sortBy?: "rating" | "roas" | "price" | "experience" | "popularity" | "newest";
  page?: number;
  pageSize?: number;
  isVerified?: boolean;
  isFeatured?: boolean;
  priceRange?: { min: number; max: number }; // Monthly rate range
  languageProficiency?: "native" | "fluent" | "intermediate";
  coverageType?: "primary" | "secondary" | "all";
}

/**
 * Filter option with count
 */
export interface FilterOption {
  id: string;
  name: string;
  count: number;
  icon?: string;
}

/**
 * Price range filter
 */
export interface PriceRangeFilter {
  min: number;
  max: number;
  label: string;
  count: number;
}

/**
 * Experience level filter
 */
export interface ExperienceLevelFilter {
  level: string;
  label: string;
  count: number;
}

/**
 * Available filters response
 */
export interface AvailableFiltersResponse {
  platforms: FilterOption[];
  niches: FilterOption[];
  countries: FilterOption[];
  certifications: FilterOption[];
  priceRanges: PriceRangeFilter[];
  experienceLevels: ExperienceLevelFilter[];
  ratingRanges: FilterOption[];
}

/**
 * Marketplace search response
 */
export interface MarketplaceSearchResponse {
  specialists: AgentProfile[];
  total: number;
  page: number;
  pageSize: number;
  hasMore: boolean;
  filters: AvailableFiltersResponse;
}

/**
 * Performance chart data point
 */
export interface PerformanceDataPoint {
  month: string;
  roas: number;
  spend: number;
  campaigns: number;
}

/**
 * Specialist performance data
 */
export interface SpecialistPerformance {
  slug: string;
  avgRoas: number;
  avgCpa: number;
  totalCampaigns: number;
  activeCampaigns: number;
  successRate: number;
  totalSpendManaged: number;
  bestRoas: number;
  monthlyPerformance: PerformanceDataPoint[];
  platformMetrics: {
    platform: string;
    avgRoas: number;
    avgCpa: number;
    totalSpend: number;
    campaignsCount: number;
  }[];
}

/**
 * MarketplaceSearchService
 * Handles advanced search and filtering for Performa marketplace specialists
 */
@Injectable()
export class MarketplaceSearchService {
  private readonly logger = new Logger(MarketplaceSearchService.name);
  private readonly MAX_PAGE_SIZE = 100;
  private readonly DEFAULT_PAGE_SIZE = 20;

  constructor(
    @InjectRepository(AgentProfile)
    private readonly agentProfileRepository: Repository<AgentProfile>,
    @InjectRepository(AgentCertification)
    private readonly agentCertificationRepository: Repository<AgentCertification>,
    @InjectRepository(AgentLanguage)
    private readonly agentLanguageRepository: Repository<AgentLanguage>,
    @InjectRepository(AgentGeographicCoverage)
    private readonly agentGeographicCoverageRepository: Repository<AgentGeographicCoverage>,
    @InjectRepository(AgentPlatformMetrics)
    private readonly agentPlatformMetricsRepository: Repository<AgentPlatformMetrics>,
    @InjectRepository(AgentReview)
    private readonly agentReviewRepository: Repository<AgentReview>,
    @InjectRepository(AgentHistoricalPerformance)
    private readonly agentHistoricalPerformanceRepository: Repository<AgentHistoricalPerformance>,
    @InjectRepository(MarketplaceCertification)
    private readonly marketplaceCertificationRepository: Repository<MarketplaceCertification>,
  ) {}

  /**
   * Advanced search for specialists with filtering and sorting
   */
  async searchSpecialists(
    filters: MarketplaceFilters,
  ): Promise<MarketplaceSearchResponse> {
    try {
      // Validate and normalize pagination
      const page = Math.max(1, filters.page || 1);
      const pageSize = Math.min(
        Math.max(1, filters.pageSize || this.DEFAULT_PAGE_SIZE),
        this.MAX_PAGE_SIZE,
      );

      // Build the base query
      let query = this.agentProfileRepository
        .createQueryBuilder("ap")
        .where("ap.is_published = :isPublished", { isPublished: true })
        .andWhere("ap.is_indexable = :isIndexable", { isIndexable: true });

      // Apply text search
      if (filters.query && filters.query.trim()) {
        const searchQuery = filters.query.trim();
        query = query.andWhere(
          `ap.search_keywords @@ plainto_tsquery('english', :query)
           OR ap.display_name ILIKE :likeQuery
           OR ap.title ILIKE :likeQuery
           OR ap.bio ILIKE :likeQuery`,
          {
            query: searchQuery,
            likeQuery: `%${searchQuery}%`,
          },
        );
      }

      // Apply platform filter
      if (filters.platforms && filters.platforms.length > 0) {
        query = query.andWhere("ap.platforms && :platforms", {
          platforms: filters.platforms,
        });
      }

      // Apply niche filter
      if (filters.niches && filters.niches.length > 0) {
        query = query.andWhere("ap.niches && :niches", {
          niches: filters.niches,
        });
      }

      // Apply minimum rating filter
      if (filters.minRating !== undefined && filters.minRating > 0) {
        query = query.andWhere("ap.cached_rating >= :minRating", {
          minRating: filters.minRating,
        });
      }

      // Apply minimum ROAS filter
      if (filters.minRoas !== undefined && filters.minRoas > 0) {
        query = query.andWhere(
          "(ap.cached_stats->>'avgROAS')::decimal >= :minRoas",
          {
            minRoas: filters.minRoas,
          },
        );
      }

      // Apply minimum CPA filter
      if (filters.minCpa !== undefined && filters.minCpa > 0) {
        query = query.andWhere(
          "(ap.cached_stats->>'avgCPA')::decimal >= :minCpa",
          {
            minCpa: filters.minCpa,
          },
        );
      }

      // Apply maximum CPA filter
      if (filters.maxCpa !== undefined && filters.maxCpa > 0) {
        query = query.andWhere(
          "(ap.cached_stats->>'avgCPA')::decimal <= :maxCpa",
          {
            maxCpa: filters.maxCpa,
          },
        );
      }

      // Apply price range filter
      if (filters.priceRange) {
        query = query.andWhere("ap.monthly_rate BETWEEN :minPrice AND :maxPrice", {
          minPrice: filters.priceRange.min,
          maxPrice: filters.priceRange.max,
        });
      }

      // Apply verification filter
      if (filters.isVerified !== undefined) {
        query = query.andWhere("ap.is_verified = :isVerified", {
          isVerified: filters.isVerified,
        });
      }

      // Apply featured filter
      if (filters.isFeatured !== undefined) {
        query = query.andWhere("ap.is_featured = :isFeatured", {
          isFeatured: filters.isFeatured,
        });
      }

      // Apply language filter with JOIN
      if (filters.languages && filters.languages.length > 0) {
        query = query
          .leftJoinAndSelect(
            "ap.languages",
            "lang",
            "lang.language_code IN (:languages)",
            { languages: filters.languages },
          )
          .andWhere("lang.id IS NOT NULL");

        // If proficiency is specified, filter further
        if (filters.languageProficiency) {
          query = query.andWhere("lang.proficiency = :proficiency", {
            proficiency: filters.languageProficiency,
          });
        }
      }

      // Apply country filter with JOIN
      if (filters.countries && filters.countries.length > 0) {
        query = query
          .leftJoinAndSelect(
            "ap.geographicCoverage",
            "geo",
            "geo.country_code IN (:countries)",
            { countries: filters.countries },
          )
          .andWhere("geo.id IS NOT NULL");

        // If coverage type is specified, filter further
        if (filters.coverageType && filters.coverageType !== "all") {
          query = query.andWhere("geo.coverage_type = :coverageType", {
            coverageType: filters.coverageType,
          });
        }
      }

      // Apply certification filter with JOIN
      if (filters.certifications && filters.certifications.length > 0) {
        query = query
          .leftJoinAndSelect(
            "ap.certifications",
            "cert",
            "cert.certification_id IN (:certIds) AND cert.verification_status = :certStatus",
            {
              certIds: filters.certifications,
              certStatus: "approved",
            },
          )
          .andWhere("cert.id IS NOT NULL");
      }

      // Count total results before pagination
      const countQuery = query.clone();
      const total = await countQuery.getCount();

      // Apply sorting
      this.applySorting(query, filters.sortBy);

      // Apply pagination
      const skip = (page - 1) * pageSize;
      query = query.skip(skip).take(pageSize);

      // Execute main query
      const specialists = await query.getMany();

      // Get available filters for this result set
      const availableFilters = await this.getAvailableFiltersInternal(
        filters,
      );

      return {
        specialists,
        total,
        page,
        pageSize,
        hasMore: skip + pageSize < total,
        filters: availableFilters,
      };
    } catch (error) {
      this.logger.error(`Search failed: ${error.message}`, error.stack);
      throw new BadRequestException("Search operation failed");
    }
  }

  /**
   * Get available filter options with counts based on current filters
   */
  async getAvailableFilters(
    currentFilters?: MarketplaceFilters,
  ): Promise<AvailableFiltersResponse> {
    return this.getAvailableFiltersInternal(currentFilters || {});
  }

  /**
   * Internal method to get available filters
   */
  private async getAvailableFiltersInternal(
    filters: MarketplaceFilters,
  ): Promise<AvailableFiltersResponse> {
    try {
      // Base query for counting filters
      let baseQuery = this.agentProfileRepository
        .createQueryBuilder("ap")
        .where("ap.is_published = :isPublished", { isPublished: true })
        .andWhere("ap.is_indexable = :isIndexable", { isIndexable: true });

      // Apply existing filters to base query
      if (filters.query && filters.query.trim()) {
        const searchQuery = filters.query.trim();
        baseQuery = baseQuery.andWhere(
          `ap.search_keywords @@ plainto_tsquery('english', :query)
           OR ap.display_name ILIKE :likeQuery
           OR ap.title ILIKE :likeQuery`,
          {
            query: searchQuery,
            likeQuery: `%${searchQuery}%`,
          },
        );
      }

      if (filters.minRating !== undefined && filters.minRating > 0) {
        baseQuery = baseQuery.andWhere("ap.cached_rating >= :minRating", {
          minRating: filters.minRating,
        });
      }

      // Get all distinct platforms with counts
      const platformsResult = await baseQuery
        .clone()
        .select("DISTINCT unnest(ap.platforms) as platform")
        .getRawMany();

      const platformCounts = await Promise.all(
        platformsResult.map(async (row) => {
          const count = await baseQuery
            .clone()
            .andWhere("ap.platforms && :platforms", {
              platforms: [row.platform],
            })
            .getCount();
          return {
            id: row.platform,
            name: this.getPlatformName(row.platform),
            count,
            icon: this.getPlatformIcon(row.platform),
          };
        }),
      );

      // Get all distinct niches with counts
      const nichesResult = await baseQuery
        .clone()
        .select("DISTINCT unnest(ap.niches) as niche")
        .getRawMany();

      const nicheCounts = await Promise.all(
        nichesResult.map(async (row) => {
          const count = await baseQuery
            .clone()
            .andWhere("ap.niches && :niches", { niches: [row.niche] })
            .getCount();
          return {
            id: row.niche,
            name: row.niche,
            count,
          };
        }),
      );

      // Get all countries with counts
      const countriesResult = await this.agentGeographicCoverageRepository
        .createQueryBuilder("geo")
        .select("DISTINCT geo.country_code")
        .innerJoinAndSelect(
          "geo.agentProfile",
          "ap",
          "ap.is_published = :isPublished AND ap.is_indexable = :isIndexable",
          { isPublished: true, isIndexable: true },
        )
        .getRawMany();

      const countryCounts = await Promise.all(
        countriesResult.map(async (row) => {
          const count = await this.agentGeographicCoverageRepository
            .createQueryBuilder("geo")
            .innerJoinAndSelect(
              "geo.agentProfile",
              "ap",
              "ap.is_published = :isPublished AND ap.is_indexable = :isIndexable",
              { isPublished: true, isIndexable: true },
            )
            .where("geo.country_code = :code", { code: row.country_code })
            .getCount();
          return {
            id: row.country_code,
            name: this.getCountryName(row.country_code),
            count,
          };
        }),
      );

      // Get certifications with counts
      const certificationsResult =
        await this.marketplaceCertificationRepository
          .createQueryBuilder("mc")
          .select("mc.id, mc.name, mc.issuer")
          .innerJoinAndSelect(
            "mc.agentCertifications",
            "ac",
            "ac.verification_status = :status",
            { status: "approved" },
          )
          .innerJoinAndSelect(
            "ac.agentProfile",
            "ap",
            "ap.is_published = :isPublished AND ap.is_indexable = :isIndexable",
            { isPublished: true, isIndexable: true },
          )
          .getRawMany();

      const certificationCounts = await Promise.all(
        certificationsResult
          .filter((v, i, a) => a.findIndex((t) => t.id === v.id) === i)
          .map(async (row) => {
            const count = await this.agentCertificationRepository
              .createQueryBuilder("ac")
              .innerJoinAndSelect(
                "ac.agentProfile",
                "ap",
                "ap.is_published = :isPublished AND ap.is_indexable = :isIndexable",
                { isPublished: true, isIndexable: true },
              )
              .where(
                "ac.certification_id = :certId AND ac.verification_status = :status",
                {
                  certId: row.id,
                  status: "approved",
                },
              )
              .getCount();
            return {
              id: row.id,
              name: row.name,
              count,
              issuer: row.issuer,
            };
          }),
      );

      // Get price ranges with counts
      const priceRanges: PriceRangeFilter[] = [
        { min: 0, max: 50, label: "Under $50", count: 0 },
        { min: 50, max: 150, label: "$50 - $150", count: 0 },
        { min: 150, max: 300, label: "$150 - $300", count: 0 },
        { min: 300, max: 1000, label: "$300 - $1000", count: 0 },
        { min: 1000, max: Infinity, label: "$1000+", count: 0 },
      ];

      for (const range of priceRanges) {
        const maxPrice =
          range.max === Infinity ? 999999 : range.max;
        range.count = await baseQuery
          .clone()
          .andWhere("ap.monthly_rate BETWEEN :min AND :max", {
            min: range.min,
            max: maxPrice,
          })
          .getCount();
      }

      // Get experience levels (inferred from created date and campaign count)
      const experienceLevels: ExperienceLevelFilter[] = [
        {
          level: "beginner",
          label: "0-1 years",
          count: 0,
        },
        {
          level: "intermediate",
          label: "1-3 years",
          count: 0,
        },
        {
          level: "experienced",
          label: "3-5 years",
          count: 0,
        },
        {
          level: "expert",
          label: "5+ years",
          count: 0,
        },
      ];

      const oneYearAgo = new Date();
      oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);
      const threeYearsAgo = new Date();
      threeYearsAgo.setFullYear(threeYearsAgo.getFullYear() - 3);
      const fiveYearsAgo = new Date();
      fiveYearsAgo.setFullYear(fiveYearsAgo.getFullYear() - 5);

      experienceLevels[0].count = await baseQuery
        .clone()
        .andWhere("ap.created_at >= :date", { date: oneYearAgo })
        .getCount();

      experienceLevels[1].count = await baseQuery
        .clone()
        .andWhere("ap.created_at >= :date1 AND ap.created_at < :date2", {
          date1: threeYearsAgo,
          date2: oneYearAgo,
        })
        .getCount();

      experienceLevels[2].count = await baseQuery
        .clone()
        .andWhere("ap.created_at >= :date1 AND ap.created_at < :date2", {
          date1: fiveYearsAgo,
          date2: threeYearsAgo,
        })
        .getCount();

      experienceLevels[3].count = await baseQuery
        .clone()
        .andWhere("ap.created_at < :date", { date: fiveYearsAgo })
        .getCount();

      // Get rating ranges
      const ratingRanges: FilterOption[] = [
        {
          id: "4.5_5",
          name: "4.5 ★ and above",
          count: await baseQuery
            .clone()
            .andWhere("ap.cached_rating >= 4.5")
            .getCount(),
        },
        {
          id: "4_4.5",
          name: "4 ★ - 4.5 ★",
          count: await baseQuery
            .clone()
            .andWhere("ap.cached_rating >= 4 AND ap.cached_rating < 4.5")
            .getCount(),
        },
        {
          id: "3_4",
          name: "3 ★ - 4 ★",
          count: await baseQuery
            .clone()
            .andWhere("ap.cached_rating >= 3 AND ap.cached_rating < 4")
            .getCount(),
        },
        {
          id: "under_3",
          name: "Under 3 ★",
          count: await baseQuery
            .clone()
            .andWhere("ap.cached_rating < 3")
            .getCount(),
        },
      ];

      return {
        platforms: platformCounts.filter((p) => p.count > 0),
        niches: nicheCounts.filter((n) => n.count > 0),
        countries: countryCounts.filter((c) => c.count > 0),
        certifications: certificationCounts.filter((c) => c.count > 0),
        priceRanges: priceRanges.filter((p) => p.count > 0),
        experienceLevels: experienceLevels.filter((e) => e.count > 0),
        ratingRanges,
      };
    } catch (error) {
      this.logger.error(
        `Failed to get available filters: ${error.message}`,
        error.stack,
      );
      return {
        platforms: [],
        niches: [],
        countries: [],
        certifications: [],
        priceRanges: [],
        experienceLevels: [],
        ratingRanges: [],
      };
    }
  }

  /**
   * Get complete specialist profile by slug
   */
  async getSpecialistDetail(slug: string): Promise<AgentProfile> {
    const specialist = await this.agentProfileRepository
      .createQueryBuilder("ap")
      .where("ap.slug = :slug", { slug })
      .andWhere("ap.is_published = :isPublished", { isPublished: true })
      .leftJoinAndSelect("ap.certifications", "cert")
      .leftJoinAndSelect("cert.certification", "certification")
      .leftJoinAndSelect("ap.languages", "lang")
      .leftJoinAndSelect("ap.geographicCoverage", "geo")
      .leftJoinAndSelect("ap.reviews", "review")
      .leftJoinAndSelect("ap.platformMetrics", "metrics")
      .leftJoinAndSelect("ap.historicalPerformance", "hist")
      .leftJoinAndSelect("ap.caseStudies", "caseStudy")
      .orderBy("review.created_at", "DESC")
      .addOrderBy("metrics.aggregation_period", "DESC")
      .addOrderBy("hist.year_month", "DESC")
      .getOne();

    if (!specialist) {
      throw new NotFoundException(
        `Specialist with slug '${slug}' not found`,
      );
    }

    return specialist;
  }

  /**
   * Get specialist performance data and charts
   */
  async getSpecialistPerformance(
    slug: string,
    period: "month" | "quarter" | "year" = "year",
  ): Promise<SpecialistPerformance> {
    const specialist = await this.agentProfileRepository.findOne({
      where: { slug, isPublished: true },
    });

    if (!specialist) {
      throw new NotFoundException(
        `Specialist with slug '${slug}' not found`,
      );
    }

    // Get monthly performance data
    const monthlyPerformance = specialist.monthlyPerformance || [];

    // Get platform-specific metrics (latest period)
    const platformMetrics = await this.agentPlatformMetricsRepository
      .createQueryBuilder("apm")
      .where("apm.agent_profile_id = :agentId", { agentId: specialist.id })
      .orderBy("apm.aggregation_period", "DESC")
      .limit(12)
      .getMany();

    const aggregatedPlatformMetrics = this.aggregatePlatformMetrics(
      platformMetrics,
    );

    return {
      slug,
      avgRoas: specialist.cachedStats?.avgROAS || 0,
      avgCpa: specialist.cachedStats?.avgCPA || 0,
      totalCampaigns: specialist.cachedStats?.totalCampaigns || 0,
      activeCampaigns: specialist.cachedStats?.activeCampaigns || 0,
      successRate: specialist.cachedStats?.successRate || 0,
      totalSpendManaged: specialist.cachedStats?.totalSpendManaged || 0,
      bestRoas: specialist.cachedStats?.bestROAS || 0,
      monthlyPerformance: monthlyPerformance as PerformanceDataPoint[],
      platformMetrics: aggregatedPlatformMetrics,
    };
  }

  /**
   * Update full-text search index for a specialist
   */
  async updateSearchKeywords(agentId: string): Promise<void> {
    try {
      const specialist = await this.agentProfileRepository.findOne({
        where: { id: agentId },
        relations: ["certifications", "languages", "geographicCoverage"],
      });

      if (!specialist) {
        throw new NotFoundException(`Agent with ID '${agentId}' not found`);
      }

      // Build comprehensive search keywords
      const keywords: string[] = [];

      // Add basic profile info
      if (specialist.displayName)
        keywords.push(specialist.displayName);
      if (specialist.title) keywords.push(specialist.title);
      if (specialist.bio) keywords.push(specialist.bio);

      // Add platforms
      if (specialist.platforms && specialist.platforms.length > 0) {
        keywords.push(...specialist.platforms);
      }

      // Add niches
      if (specialist.niches && specialist.niches.length > 0) {
        keywords.push(...specialist.niches);
      }

      // Add certifications
      if (
        specialist.certifications &&
        specialist.certifications.length > 0
      ) {
        for (const cert of specialist.certifications) {
          if (cert.certification) {
            keywords.push(cert.certification.name);
            keywords.push(cert.certification.issuer);
          }
        }
      }

      // Add languages
      if (specialist.languages && specialist.languages.length > 0) {
        for (const lang of specialist.languages) {
          keywords.push(lang.languageCode);
          keywords.push(lang.proficiency);
        }
      }

      // Add countries
      if (
        specialist.geographicCoverage &&
        specialist.geographicCoverage.length > 0
      ) {
        for (const geo of specialist.geographicCoverage) {
          keywords.push(geo.countryCode);
          if (geo.region) keywords.push(geo.region);
        }
      }

      // Add industries
      if (
        specialist.industriesServed &&
        specialist.industriesServed.length > 0
      ) {
        keywords.push(...specialist.industriesServed);
      }

      // Create full-text search string
      const searchKeywords = keywords
        .filter((k) => k && k.trim())
        .join(" ");

      // Update the search keywords field
      await this.agentProfileRepository.update(
        { id: agentId },
        {
          searchKeywords: searchKeywords || null,
        },
      );

      this.logger.log(
        `Updated search keywords for agent ${agentId}`,
      );
    } catch (error) {
      this.logger.error(
        `Failed to update search keywords for agent ${agentId}: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }

  /**
   * Update search keywords for all agents (batch)
   */
  @Cron(CronExpression.EVERY_DAY_AT_2AM)
  async updateAllSearchKeywords(): Promise<void> {
    try {
      this.logger.log(
        "Starting batch update of search keywords...",
      );

      const agents = await this.agentProfileRepository
        .createQueryBuilder("ap")
        .select("ap.id")
        .where("ap.is_published = :isPublished", {
          isPublished: true,
        })
        .getMany();

      let processed = 0;
      let failed = 0;

      for (const agent of agents) {
        try {
          await this.updateSearchKeywords(agent.id);
          processed++;
        } catch (error) {
          this.logger.error(
            `Failed to update search keywords for agent ${agent.id}`,
          );
          failed++;
        }
      }

      this.logger.log(
        `Completed batch search keywords update: ${processed} processed, ${failed} failed`,
      );
    } catch (error) {
      this.logger.error(
        `Batch search keywords update failed: ${error.message}`,
        error.stack,
      );
    }
  }

  /**
   * Private helper: Apply sorting to query
   */
  private applySorting(
    query: SelectQueryBuilder<AgentProfile>,
    sortBy?: "rating" | "roas" | "price" | "experience" | "popularity" | "newest",
  ): void {
    switch (sortBy) {
      case "rating":
        query.orderBy("ap.cached_rating", "DESC").addOrderBy(
          "ap.cached_review_count",
          "DESC",
        );
        break;
      case "roas":
        query.orderBy(
          "(ap.cached_stats->>'avgROAS')::decimal",
          "DESC",
        );
        break;
      case "price":
        query.orderBy("ap.monthly_rate", "ASC");
        break;
      case "experience":
        query.orderBy("ap.created_at", "ASC");
        break;
      case "popularity":
        query.orderBy("ap.popularity_score", "DESC").addOrderBy(
          "ap.cached_review_count",
          "DESC",
        );
        break;
      case "newest":
        query.orderBy("ap.created_at", "DESC");
        break;
      default:
        // Default: relevant + featured + rating
        query
          .orderBy("ap.is_featured", "DESC")
          .addOrderBy("ap.cached_rating", "DESC")
          .addOrderBy("ap.popularity_score", "DESC");
    }
  }

  /**
   * Private helper: Get platform display name
   */
  private getPlatformName(platform: string): string {
    const platformNames: Record<string, string> = {
      meta: "Meta",
      google: "Google Ads",
      yandex: "Yandex Direct",
      tiktok: "TikTok",
      telegram: "Telegram",
    };
    return platformNames[platform] || platform;
  }

  /**
   * Private helper: Get platform icon
   */
  private getPlatformIcon(platform: string): string {
    const platformIcons: Record<string, string> = {
      meta: "📘",
      google: "🔍",
      yandex: "🔴",
      tiktok: "🎵",
      telegram: "✈️",
    };
    return platformIcons[platform] || "📱";
  }

  /**
   * Private helper: Get country name from code
   */
  private getCountryName(code: string): string {
    const countryNames: Record<string, string> = {
      US: "United States",
      UZ: "Uzbekistan",
      KZ: "Kazakhstan",
      TJ: "Tajikistan",
      KG: "Kyrgyzstan",
      AF: "Afghanistan",
      RU: "Russia",
      TR: "Turkey",
      GB: "United Kingdom",
      DE: "Germany",
      FR: "France",
      IN: "India",
      CN: "China",
    };
    return countryNames[code] || code;
  }

  /**
   * Private helper: Aggregate platform metrics
   */
  private aggregatePlatformMetrics(
    metrics: AgentPlatformMetrics[],
  ): SpecialistPerformance["platformMetrics"] {
    const aggregated: Record<string, any> = {};

    for (const metric of metrics) {
      if (!aggregated[metric.platform]) {
        aggregated[metric.platform] = {
          platform: metric.platform,
          avgRoas: 0,
          avgCpa: 0,
          totalSpend: 0,
          campaignsCount: 0,
        };
      }

      aggregated[metric.platform].avgRoas += metric.avgRoas || 0;
      aggregated[metric.platform].avgCpa += metric.avgCpa || 0;
      aggregated[metric.platform].totalSpend += Number(
        metric.totalSpend,
      ) || 0;
      aggregated[metric.platform].campaignsCount +=
        metric.campaignsCount || 0;
    }

    // Calculate averages
    return Object.values(aggregated).map((agg: any) => {
      const count = metrics.filter((m) => m.platform === agg.platform)
        .length;
      return {
        platform: agg.platform,
        avgRoas: count > 0 ? agg.avgRoas / count : 0,
        avgCpa: count > 0 ? agg.avgCpa / count : 0,
        totalSpend: agg.totalSpend,
        campaignsCount: agg.campaignsCount,
      };
    });
  }
}
