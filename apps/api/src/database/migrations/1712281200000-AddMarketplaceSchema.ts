import { MigrationInterface, QueryRunner, Table, TableColumn, TableForeignKey, TableIndex } from 'typeorm'

export class AddMarketplaceSchema1712281200000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // 1. marketplace_certifications table
    await queryRunner.createTable(
      new Table({
        name: 'marketplace_certifications',
        columns: [
          { name: 'id', type: 'uuid', isPrimary: true, default: 'uuid_generate_v4()' },
          { name: 'name', type: 'varchar', isUnique: true },
          { name: 'slug', type: 'varchar', isUnique: true },
          { name: 'description', type: 'text', isNullable: true },
          { name: 'issuer', type: 'varchar', comment: 'Google, Meta, Yandex, etc' },
          { name: 'icon_url', type: 'varchar', isNullable: true },
          { name: 'badge_color', type: 'varchar', isNullable: true },
          { name: 'is_active', type: 'boolean', default: true },
          { name: 'created_at', type: 'timestamp', default: 'CURRENT_TIMESTAMP' },
          { name: 'updated_at', type: 'timestamp', default: 'CURRENT_TIMESTAMP' },
        ],
      }),
      true
    )

    // 2. agent_certifications (junction table)
    await queryRunner.createTable(
      new Table({
        name: 'agent_certifications',
        columns: [
          { name: 'id', type: 'uuid', isPrimary: true, default: 'uuid_generate_v4()' },
          { name: 'agent_profile_id', type: 'uuid' },
          { name: 'certification_id', type: 'uuid' },
          { name: 'proof_url', type: 'varchar', isNullable: true },
          { name: 'verified', type: 'boolean', default: false },
          { name: 'verification_status', type: 'enum', enum: ['pending_review', 'approved', 'rejected'], default: 'pending_review' },
          { name: 'verified_at', type: 'timestamp', isNullable: true },
          { name: 'verified_by', type: 'uuid', isNullable: true },
          { name: 'expires_at', type: 'timestamp', isNullable: true },
          { name: 'created_at', type: 'timestamp', default: 'CURRENT_TIMESTAMP' },
        ],
      }),
      true
    )

    await queryRunner.createForeignKey(
      'agent_certifications',
      new TableForeignKey({
        columnNames: ['agent_profile_id'],
        referencedColumnNames: ['id'],
        referencedTableName: 'agent_profiles',
        onDelete: 'CASCADE',
      })
    )

    await queryRunner.createForeignKey(
      'agent_certifications',
      new TableForeignKey({
        columnNames: ['certification_id'],
        referencedColumnNames: ['id'],
        referencedTableName: 'marketplace_certifications',
        onDelete: 'CASCADE',
      })
    )

    // 3. agent_case_studies
    await queryRunner.createTable(
      new Table({
        name: 'agent_case_studies',
        columns: [
          { name: 'id', type: 'uuid', isPrimary: true, default: 'uuid_generate_v4()' },
          { name: 'agent_profile_id', type: 'uuid' },
          { name: 'title', type: 'varchar' },
          { name: 'description', type: 'text', isNullable: true },
          { name: 'industry', type: 'varchar', isNullable: true },
          { name: 'client_name', type: 'varchar', isNullable: true },
          { name: 'platform', type: 'varchar', comment: 'meta, google, yandex' },
          { name: 'duration_months', type: 'integer', isNullable: true },
          { name: 'metrics', type: 'jsonb', isNullable: true, comment: '{roas: 4.2, cpa: 12.5, conversions: 100}' },
          { name: 'before_screenshot_url', type: 'varchar', isNullable: true },
          { name: 'after_screenshot_url', type: 'varchar', isNullable: true },
          { name: 'proof_url', type: 'varchar', isNullable: true },
          { name: 'is_verified', type: 'boolean', default: false },
          { name: 'is_public', type: 'boolean', default: false },
          { name: 'order_index', type: 'integer', default: 0 },
          { name: 'created_at', type: 'timestamp', default: 'CURRENT_TIMESTAMP' },
          { name: 'updated_at', type: 'timestamp', default: 'CURRENT_TIMESTAMP' },
        ],
      }),
      true
    )

    await queryRunner.createForeignKey(
      'agent_case_studies',
      new TableForeignKey({
        columnNames: ['agent_profile_id'],
        referencedColumnNames: ['id'],
        referencedTableName: 'agent_profiles',
        onDelete: 'CASCADE',
      })
    )

    await queryRunner.createIndex('agent_case_studies', new TableIndex({ columnNames: ['agent_profile_id'] }))
    await queryRunner.createIndex('agent_case_studies', new TableIndex({ columnNames: ['is_public', 'is_verified'] }))

    // 4. agent_languages
    await queryRunner.createTable(
      new Table({
        name: 'agent_languages',
        columns: [
          { name: 'id', type: 'uuid', isPrimary: true, default: 'uuid_generate_v4()' },
          { name: 'agent_profile_id', type: 'uuid' },
          { name: 'language_code', type: 'varchar', comment: 'en, uz, ru, kk' },
          { name: 'proficiency', type: 'enum', enum: ['native', 'fluent', 'intermediate'], default: 'fluent' },
          { name: 'created_at', type: 'timestamp', default: 'CURRENT_TIMESTAMP' },
        ],
      }),
      true
    )

    await queryRunner.createForeignKey(
      'agent_languages',
      new TableForeignKey({
        columnNames: ['agent_profile_id'],
        referencedColumnNames: ['id'],
        referencedTableName: 'agent_profiles',
        onDelete: 'CASCADE',
      })
    )

    // 5. agent_geographic_coverage
    await queryRunner.createTable(
      new Table({
        name: 'agent_geographic_coverage',
        columns: [
          { name: 'id', type: 'uuid', isPrimary: true, default: 'uuid_generate_v4()' },
          { name: 'agent_profile_id', type: 'uuid' },
          { name: 'country_code', type: 'varchar', comment: 'UZ, KZ, TJ, AF' },
          { name: 'region', type: 'varchar', isNullable: true },
          { name: 'cities', type: 'text', isArray: true, isNullable: true },
          { name: 'coverage_type', type: 'enum', enum: ['primary', 'secondary'], default: 'primary' },
          { name: 'is_verified', type: 'boolean', default: false },
          { name: 'created_at', type: 'timestamp', default: 'CURRENT_TIMESTAMP' },
        ],
      }),
      true
    )

    await queryRunner.createForeignKey(
      'agent_geographic_coverage',
      new TableForeignKey({
        columnNames: ['agent_profile_id'],
        referencedColumnNames: ['id'],
        referencedTableName: 'agent_profiles',
        onDelete: 'CASCADE',
      })
    )

    // 6. agent_platform_metrics
    await queryRunner.createTable(
      new Table({
        name: 'agent_platform_metrics',
        columns: [
          { name: 'id', type: 'uuid', isPrimary: true, default: 'uuid_generate_v4()' },
          { name: 'agent_profile_id', type: 'uuid' },
          { name: 'platform', type: 'varchar', comment: 'meta, google, yandex, tiktok' },
          { name: 'aggregation_period', type: 'date', comment: 'YYYY-MM-01 for monthly' },
          { name: 'total_spend', type: 'decimal', precision: 15, scale: 2, default: 0 },
          { name: 'campaigns_count', type: 'integer', default: 0 },
          { name: 'avg_roas', type: 'decimal', precision: 8, scale: 2, isNullable: true },
          { name: 'avg_cpa', type: 'decimal', precision: 10, scale: 2, isNullable: true },
          { name: 'avg_ctr', type: 'decimal', precision: 5, scale: 3, isNullable: true },
          { name: 'conversion_count', type: 'integer', default: 0 },
          { name: 'total_revenue', type: 'decimal', precision: 15, scale: 2, default: 0 },
          { name: 'source_type', type: 'enum', enum: ['api_pull', 'manual_upload', 'case_study'], default: 'api_pull' },
          { name: 'is_verified', type: 'boolean', default: true },
          { name: 'created_at', type: 'timestamp', default: 'CURRENT_TIMESTAMP' },
          { name: 'synced_at', type: 'timestamp', default: 'CURRENT_TIMESTAMP' },
        ],
      }),
      true
    )

    await queryRunner.createForeignKey(
      'agent_platform_metrics',
      new TableForeignKey({
        columnNames: ['agent_profile_id'],
        referencedColumnNames: ['id'],
        referencedTableName: 'agent_profiles',
        onDelete: 'CASCADE',
      })
    )

    await queryRunner.createIndex('agent_platform_metrics', new TableIndex({ columnNames: ['agent_profile_id', 'platform', 'aggregation_period'] }))
    await queryRunner.createIndex('agent_platform_metrics', new TableIndex({ columnNames: ['synced_at'] }))

    // 7. agent_historical_performance
    await queryRunner.createTable(
      new Table({
        name: 'agent_historical_performance',
        columns: [
          { name: 'id', type: 'uuid', isPrimary: true, default: 'uuid_generate_v4()' },
          { name: 'agent_profile_id', type: 'uuid' },
          { name: 'year_month', type: 'varchar', comment: 'YYYY-MM format' },
          { name: 'platforms', type: 'text', isArray: true, isNullable: true },
          { name: 'total_campaigns', type: 'integer', default: 0 },
          { name: 'total_spend', type: 'decimal', precision: 15, scale: 2, default: 0 },
          { name: 'avg_roas', type: 'decimal', precision: 8, scale: 2, isNullable: true },
          { name: 'avg_cpa', type: 'decimal', precision: 10, scale: 2, isNullable: true },
          { name: 'avg_ctr', type: 'decimal', precision: 5, scale: 3, isNullable: true },
          { name: 'best_roas', type: 'decimal', precision: 8, scale: 2, isNullable: true },
          { name: 'success_rate', type: 'decimal', precision: 5, scale: 2, isNullable: true },
          { name: 'created_at', type: 'timestamp', default: 'CURRENT_TIMESTAMP' },
        ],
      }),
      true
    )

    await queryRunner.createForeignKey(
      'agent_historical_performance',
      new TableForeignKey({
        columnNames: ['agent_profile_id'],
        referencedColumnNames: ['id'],
        referencedTableName: 'agent_profiles',
        onDelete: 'CASCADE',
      })
    )

    // 8. agent_performance_sync_logs
    await queryRunner.createTable(
      new Table({
        name: 'agent_performance_sync_logs',
        columns: [
          { name: 'id', type: 'uuid', isPrimary: true, default: 'uuid_generate_v4()' },
          { name: 'agent_profile_id', type: 'uuid' },
          { name: 'sync_type', type: 'enum', enum: ['meta', 'google', 'yandex', 'manual'] },
          { name: 'status', type: 'enum', enum: ['pending', 'in_progress', 'completed', 'failed'], default: 'pending' },
          { name: 'records_synced', type: 'integer', default: 0 },
          { name: 'error_message', type: 'text', isNullable: true },
          { name: 'next_sync_at', type: 'timestamp', isNullable: true },
          { name: 'started_at', type: 'timestamp', isNullable: true },
          { name: 'completed_at', type: 'timestamp', isNullable: true },
          { name: 'created_at', type: 'timestamp', default: 'CURRENT_TIMESTAMP' },
        ],
      }),
      true
    )

    await queryRunner.createForeignKey(
      'agent_performance_sync_logs',
      new TableForeignKey({
        columnNames: ['agent_profile_id'],
        referencedColumnNames: ['id'],
        referencedTableName: 'agent_profiles',
        onDelete: 'CASCADE',
      })
    )

    // 9. marketplace_seo_metadata
    await queryRunner.createTable(
      new Table({
        name: 'marketplace_seo_metadata',
        columns: [
          { name: 'id', type: 'uuid', isPrimary: true, default: 'uuid_generate_v4()' },
          { name: 'slug', type: 'varchar', isUnique: true },
          { name: 'page_type', type: 'enum', enum: ['marketplace', 'specialist_profile', 'filter_results'] },
          { name: 'resource_id', type: 'varchar', isNullable: true },
          { name: 'meta_title', type: 'varchar' },
          { name: 'meta_description', type: 'varchar' },
          { name: 'keywords', type: 'text', isArray: true, isNullable: true },
          { name: 'canonical_url', type: 'varchar', isNullable: true },
          { name: 'og_image_url', type: 'varchar', isNullable: true },
          { name: 'og_title', type: 'varchar', isNullable: true },
          { name: 'og_description', type: 'varchar', isNullable: true },
          { name: 'structured_data', type: 'jsonb', isNullable: true },
          { name: 'is_public', type: 'boolean', default: true },
          { name: 'created_at', type: 'timestamp', default: 'CURRENT_TIMESTAMP' },
          { name: 'updated_at', type: 'timestamp', default: 'CURRENT_TIMESTAMP' },
        ],
      }),
      true
    )
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable('marketplace_seo_metadata')
    await queryRunner.dropTable('agent_performance_sync_logs')
    await queryRunner.dropTable('agent_historical_performance')
    await queryRunner.dropTable('agent_platform_metrics')
    await queryRunner.dropTable('agent_geographic_coverage')
    await queryRunner.dropTable('agent_languages')
    await queryRunner.dropTable('agent_case_studies')
    await queryRunner.dropTable('agent_certifications')
    await queryRunner.dropTable('marketplace_certifications')
  }
}
