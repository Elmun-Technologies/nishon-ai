import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm'

export class AddMarketplaceColumnsToExisting1712281201000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Add columns to agent_profiles
    const agentProfileColumns = [
      new TableColumn({
        name: 'certification_level',
        type: 'enum',
        enum: ['unverified', 'self_declared', 'verified', 'premium'],
        default: "'unverified'",
        isNullable: false,
      }),
      new TableColumn({
        name: 'verification_level_updated_at',
        type: 'timestamp',
        isNullable: true,
      }),
      new TableColumn({
        name: 'verified_by_admin',
        type: 'uuid',
        isNullable: true,
      }),
      new TableColumn({
        name: 'primary_countries',
        type: 'text',
        isArray: true,
        isNullable: true,
        comment: 'e.g., ["UZ", "KZ", "TJ"]',
      }),
      new TableColumn({
        name: 'supported_languages',
        type: 'text',
        isArray: true,
        isNullable: true,
        comment: 'e.g., ["en", "uz", "ru"]',
      }),
      new TableColumn({
        name: 'timezone',
        type: 'varchar',
        isNullable: true,
      }),
      new TableColumn({
        name: 'last_performance_sync',
        type: 'timestamp',
        isNullable: true,
      }),
      new TableColumn({
        name: 'performance_sync_status',
        type: 'enum',
        enum: ['healthy', 'stale', 'failed', 'never_synced'],
        default: "'never_synced'",
      }),
      new TableColumn({
        name: 'is_performance_data_verified',
        type: 'boolean',
        default: false,
      }),
      new TableColumn({
        name: 'seo_slug',
        type: 'varchar',
        isUnique: true,
        isNullable: true,
      }),
      new TableColumn({
        name: 'is_indexable',
        type: 'boolean',
        default: true,
      }),
      new TableColumn({
        name: 'page_view_count',
        type: 'integer',
        default: 0,
      }),
      new TableColumn({
        name: 'specializations',
        type: 'jsonb',
        isNullable: true,
        comment: '{primary: ["e-commerce", "fashion"], secondary: [...]}',
      }),
      new TableColumn({
        name: 'industries_served',
        type: 'text',
        isArray: true,
        isNullable: true,
      }),
      new TableColumn({
        name: 'average_response_time_hours',
        type: 'decimal',
        precision: 5,
        scale: 1,
        isNullable: true,
      }),
      new TableColumn({
        name: 'communication_channels',
        type: 'text',
        isArray: true,
        isNullable: true,
        comment: 'email, telegram, whatsapp',
      }),
      new TableColumn({
        name: 'timezone_availability_start',
        type: 'time',
        isNullable: true,
      }),
      new TableColumn({
        name: 'timezone_availability_end',
        type: 'time',
        isNullable: true,
      }),
      new TableColumn({
        name: 'search_keywords',
        type: 'tsvector',
        isNullable: true,
        comment: 'Full-text search index',
      }),
      new TableColumn({
        name: 'popularity_score',
        type: 'decimal',
        precision: 8,
        scale: 2,
        default: 0,
      }),
      new TableColumn({
        name: 'fraud_risk_score',
        type: 'decimal',
        precision: 3,
        scale: 2,
        default: 0,
        comment: '0-1, 0=safe, 1=high risk',
      }),
      new TableColumn({
        name: 'cached_stats',
        type: 'jsonb',
        isNullable: true,
        comment: 'Cached aggregated statistics',
      }),
      new TableColumn({
        name: 'monthly_performance',
        type: 'jsonb',
        isNullable: true,
        comment: '[{month, roas, spend, campaigns}]',
      }),
    ]

    for (const column of agentProfileColumns) {
      await queryRunner.addColumn('agent_profiles', column)
    }

    // Add columns to service_engagements
    const engagementColumns = [
      new TableColumn({
        name: 'workspace_name',
        type: 'varchar',
        isNullable: true,
        comment: 'Denormalized for reporting',
      }),
      new TableColumn({
        name: 'specialist_name',
        type: 'varchar',
        isNullable: true,
        comment: 'Denormalized for reporting',
      }),
      new TableColumn({
        name: 'engagement_type',
        type: 'enum',
        enum: ['full_service', 'consultation', 'training'],
        default: "'full_service'",
      }),
      new TableColumn({
        name: 'kpi_targets',
        type: 'jsonb',
        isNullable: true,
        comment: '{roas: 4.0, cpa_max: 15}',
      }),
      new TableColumn({
        name: 'performance_achieved',
        type: 'jsonb',
        isNullable: true,
        comment: 'End-of-engagement results',
      }),
    ]

    for (const column of engagementColumns) {
      await queryRunner.addColumn('service_engagements', column)
    }

    // Add columns to agent_reviews
    const reviewColumns = [
      new TableColumn({
        name: 'verified_purchase',
        type: 'boolean',
        default: false,
        comment: 'Was this from a real ServiceEngagement?',
      }),
      new TableColumn({
        name: 'tags',
        type: 'text',
        isArray: true,
        isNullable: true,
        comment: 'responsive, creative, strategic, delivered_results',
      }),
      new TableColumn({
        name: 'review_helpful_count',
        type: 'integer',
        default: 0,
      }),
      new TableColumn({
        name: 'is_featured',
        type: 'boolean',
        default: false,
        comment: 'Admin can feature exceptional reviews',
      }),
      new TableColumn({
        name: 'country_engaged',
        type: 'varchar',
        isNullable: true,
        comment: 'UZ, KZ, etc.',
      }),
    ]

    for (const column of reviewColumns) {
      await queryRunner.addColumn('agent_reviews', column)
    }

    // Create indexes for full-text search on agent_profiles
    await queryRunner.query(`
      CREATE INDEX idx_agent_profiles_search_keywords
      ON agent_profiles USING gin(search_keywords)
    `)

    // Create indexes for performance queries
    await queryRunner.query(`
      CREATE INDEX idx_agent_profiles_performance_sync_status
      ON agent_profiles(performance_sync_status)
    `)

    await queryRunner.query(`
      CREATE INDEX idx_agent_profiles_certification_level
      ON agent_profiles(certification_level)
    `)

    await queryRunner.query(`
      CREATE INDEX idx_agent_profiles_is_indexable
      ON agent_profiles(is_indexable) WHERE is_indexable = true
    `)

    await queryRunner.query(`
      CREATE INDEX idx_agent_profiles_primary_countries
      ON agent_profiles USING gin(primary_countries)
    `)
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop indexes
    await queryRunner.query('DROP INDEX IF EXISTS idx_agent_profiles_search_keywords')
    await queryRunner.query('DROP INDEX IF EXISTS idx_agent_profiles_performance_sync_status')
    await queryRunner.query('DROP INDEX IF EXISTS idx_agent_profiles_certification_level')
    await queryRunner.query('DROP INDEX IF EXISTS idx_agent_profiles_is_indexable')
    await queryRunner.query('DROP INDEX IF EXISTS idx_agent_profiles_primary_countries')

    // Drop columns from agent_reviews
    const reviewColumns = [
      'verified_purchase',
      'tags',
      'review_helpful_count',
      'is_featured',
      'country_engaged',
    ]
    for (const col of reviewColumns) {
      await queryRunner.dropColumn('agent_reviews', col)
    }

    // Drop columns from service_engagements
    const engagementColumns = ['workspace_name', 'specialist_name', 'engagement_type', 'kpi_targets', 'performance_achieved']
    for (const col of engagementColumns) {
      await queryRunner.dropColumn('service_engagements', col)
    }

    // Drop columns from agent_profiles
    const agentProfileColumns = [
      'certification_level',
      'verification_level_updated_at',
      'verified_by_admin',
      'primary_countries',
      'supported_languages',
      'timezone',
      'last_performance_sync',
      'performance_sync_status',
      'is_performance_data_verified',
      'seo_slug',
      'is_indexable',
      'page_view_count',
      'specializations',
      'industries_served',
      'average_response_time_hours',
      'communication_channels',
      'timezone_availability_start',
      'timezone_availability_end',
      'search_keywords',
      'popularity_score',
      'fraud_risk_score',
      'cached_stats',
      'monthly_performance',
    ]
    for (const col of agentProfileColumns) {
      await queryRunner.dropColumn('agent_profiles', col)
    }
  }
}
