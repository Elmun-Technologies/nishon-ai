import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, Index } from 'typeorm'

@Entity('marketplace_seo_metadata')
@Index(['slug'])
export class MarketplaceSeoMetadata {
  @PrimaryGeneratedColumn('uuid')
  id: string

  @Column({ unique: true })
  slug: string

  @Column({
    type: 'enum',
    enum: ['marketplace', 'specialist_profile', 'filter_results'],
  })
  pageType: 'marketplace' | 'specialist_profile' | 'filter_results'

  @Column({ nullable: true })
  resourceId: string

  @Column()
  metaTitle: string

  @Column()
  metaDescription: string

  @Column({ type: 'simple-array', nullable: true })
  keywords: string[]

  @Column({ nullable: true })
  canonicalUrl: string

  @Column({ nullable: true })
  ogImageUrl: string

  @Column({ nullable: true })
  ogTitle: string

  @Column({ nullable: true })
  ogDescription: string

  @Column({ type: 'jsonb', nullable: true })
  structuredData: Record<string, any>

  @Column({ default: true })
  isPublic: boolean

  @CreateDateColumn()
  createdAt: Date

  @UpdateDateColumn()
  updatedAt: Date
}
