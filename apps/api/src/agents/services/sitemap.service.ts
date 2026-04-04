import { Injectable, Logger } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import * as fs from 'fs'
import * as path from 'path'
import * as zlib from 'zlib'
import { AgentProfile } from '../entities/agent-profile.entity'

/**
 * URL entry for sitemap
 */
interface SitemapUrl {
  loc: string
  lastmod?: string
  changefreq?: 'always' | 'hourly' | 'daily' | 'weekly' | 'monthly' | 'yearly' | 'never'
  priority?: number
}

/**
 * Sitemap index entry
 */
interface SitemapIndexUrl {
  loc: string
  lastmod?: string
}

@Injectable()
export class SitemapService {
  private readonly logger = new Logger(SitemapService.name)
  private readonly baseUrl = process.env.FRONTEND_URL || 'https://performa.ai'
  private readonly publicDir = path.join(process.cwd(), 'public')
  private readonly sitemapDir = path.join(this.publicDir, 'sitemaps')
  private readonly maxUrlsPerSitemap = 50000

  constructor(
    @InjectRepository(AgentProfile)
    private readonly agentProfileRepository: Repository<AgentProfile>,
  ) {
    this.ensurePublicDir()
  }

  /**
   * Generate all sitemaps and sitemap index
   */
  async generateAllSitemaps(): Promise<void> {
    try {
      this.logger.log('Starting sitemap generation...')

      // Get all published specialists
      const specialists = await this.agentProfileRepository.find({
        where: { isPublished: true },
        order: { updatedAt: 'DESC' },
      })

      const urls: SitemapUrl[] = []

      // Add static pages
      urls.push(
        {
          loc: `${this.baseUrl}/marketplace`,
          changefreq: 'daily',
          priority: 1.0,
          lastmod: new Date().toISOString().split('T')[0],
        },
        {
          loc: `${this.baseUrl}/marketplace/specialists`,
          changefreq: 'daily',
          priority: 0.9,
          lastmod: new Date().toISOString().split('T')[0],
        },
      )

      // Add specialist profile URLs
      specialists.forEach((specialist) => {
        const slug = specialist.seoSlug || specialist.slug
        urls.push({
          loc: `${this.baseUrl}/marketplace/specialists/${slug}`,
          lastmod: specialist.updatedAt.toISOString().split('T')[0],
          changefreq: 'weekly',
          priority: 0.8,
        })
      })

      // Add common filter combinations
      const platforms = this.extractUnique(specialists, 'platforms')
      const niches = this.extractUnique(specialists, 'niches')

      platforms.slice(0, 10).forEach((platform) => {
        urls.push({
          loc: `${this.baseUrl}/marketplace/specialists?platforms=${encodeURIComponent(platform)}`,
          changefreq: 'weekly',
          priority: 0.7,
          lastmod: new Date().toISOString().split('T')[0],
        })
      })

      niches.slice(0, 10).forEach((niche) => {
        urls.push({
          loc: `${this.baseUrl}/marketplace/specialists?niches=${encodeURIComponent(niche)}`,
          changefreq: 'weekly',
          priority: 0.7,
          lastmod: new Date().toISOString().split('T')[0],
        })
      })

      // Generate sitemaps
      await this.generateSitemaps(urls)

      // Generate sitemap index
      await this.generateSitemapIndex()

      this.logger.log(`Successfully generated sitemaps with ${urls.length} URLs`)
    } catch (error) {
      this.logger.error('Failed to generate sitemaps', error)
      throw error
    }
  }

  /**
   * Generate individual sitemap files
   */
  private async generateSitemaps(urls: SitemapUrl[]): Promise<void> {
    const sitemapCount = Math.ceil(urls.length / this.maxUrlsPerSitemap)

    for (let i = 0; i < sitemapCount; i++) {
      const start = i * this.maxUrlsPerSitemap
      const end = Math.min(start + this.maxUrlsPerSitemap, urls.length)
      const sitemapUrls = urls.slice(start, end)

      const filename = sitemapCount === 1 ? 'sitemap.xml' : `sitemap-${i + 1}.xml`
      await this.writeSitemap(filename, sitemapUrls)
    }
  }

  /**
   * Write individual sitemap to file
   */
  private async writeSitemap(filename: string, urls: SitemapUrl[]): Promise<void> {
    const filePath = path.join(this.sitemapDir, filename)

    const xml = this.generateSitemapXml(urls)

    // Write uncompressed version
    fs.writeFileSync(filePath, xml, 'utf-8')

    // Write gzipped version
    const gzipPath = `${filePath}.gz`
    const gzipStream = fs.createWriteStream(gzipPath)
    gzipStream.end(xml)

    await new Promise((resolve, reject) => {
      gzipStream.on('finish', resolve)
      gzipStream.on('error', reject)
    })

    this.logger.debug(`Generated sitemap: ${filename} (${urls.length} URLs)`)
  }

  /**
   * Generate sitemap index XML
   */
  private async generateSitemapIndex(): Promise<void> {
    const files = fs.readdirSync(this.sitemapDir).filter((f) => f.startsWith('sitemap-') && f.endsWith('.xml'))

    const indexUrls: SitemapIndexUrl[] = []

    if (files.length === 0) {
      // Only single sitemap
      indexUrls.push({
        loc: `${this.baseUrl}/sitemaps/sitemap.xml`,
        lastmod: new Date().toISOString().split('T')[0],
      })
    } else {
      files.forEach((file) => {
        indexUrls.push({
          loc: `${this.baseUrl}/sitemaps/${file}`,
          lastmod: new Date().toISOString().split('T')[0],
        })
      })
    }

    const indexXml = this.generateSitemapIndexXml(indexUrls)
    const indexPath = path.join(this.sitemapDir, 'sitemap-index.xml')

    fs.writeFileSync(indexPath, indexXml, 'utf-8')

    // Also write as sitemap.xml if single file
    if (files.length === 0) {
      fs.writeFileSync(path.join(this.sitemapDir, 'sitemap.xml'), indexXml, 'utf-8')
    }

    this.logger.debug('Generated sitemap index')
  }

  /**
   * Get count of indexable specialists
   */
  async getIndexableSpecialistCount(): Promise<number> {
    return this.agentProfileRepository.count({
      where: { isPublished: true, isIndexable: true },
    })
  }

  /**
   * Generate sitemap XML content
   */
  private generateSitemapXml(urls: SitemapUrl[]): string {
    const xmlUrls = urls
      .map((url) => {
        let xml = `  <url>\n    <loc>${this.escapeXml(url.loc)}</loc>`

        if (url.lastmod) {
          xml += `\n    <lastmod>${url.lastmod}</lastmod>`
        }

        if (url.changefreq) {
          xml += `\n    <changefreq>${url.changefreq}</changefreq>`
        }

        if (url.priority !== undefined) {
          xml += `\n    <priority>${url.priority.toFixed(1)}</priority>`
        }

        xml += `\n  </url>`
        return xml
      })
      .join('\n')

    return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:image="http://www.google.com/schemas/sitemap-image/1.1"
        xmlns:mobile="http://www.google.com/schemas/sitemap-mobile/1.0">
${xmlUrls}
</urlset>`
  }

  /**
   * Generate sitemap index XML content
   */
  private generateSitemapIndexXml(urls: SitemapIndexUrl[]): string {
    const xmlUrls = urls
      .map((url) => {
        let xml = `  <sitemap>\n    <loc>${this.escapeXml(url.loc)}</loc>`

        if (url.lastmod) {
          xml += `\n    <lastmod>${url.lastmod}</lastmod>`
        }

        xml += `\n  </sitemap>`
        return xml
      })
      .join('\n')

    return `<?xml version="1.0" encoding="UTF-8"?>
<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${xmlUrls}
</sitemapindex>`
  }

  /**
   * Escape XML special characters
   */
  private escapeXml(str: string): string {
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&apos;')
  }

  /**
   * Extract unique values from array field in entity
   */
  private extractUnique(entities: any[], fieldName: string): string[] {
    const values = new Set<string>()

    entities.forEach((entity) => {
      const field = entity[fieldName]
      if (Array.isArray(field)) {
        field.forEach((v) => values.add(v))
      }
    })

    return Array.from(values)
  }

  /**
   * Ensure public/sitemaps directory exists
   */
  private ensurePublicDir(): void {
    if (!fs.existsSync(this.sitemapDir)) {
      fs.mkdirSync(this.sitemapDir, { recursive: true })
    }
  }

  /**
   * Get sitemap statistics
   */
  async getSitemapStats(): Promise<{
    totalUrls: number
    specialistUrls: number
    lastGenerated: Date | null
  }> {
    const specialistCount = await this.getIndexableSpecialistCount()
    const indexPath = path.join(this.sitemapDir, 'sitemap-index.xml')

    let lastGenerated = null
    if (fs.existsSync(indexPath)) {
      const stats = fs.statSync(indexPath)
      lastGenerated = stats.mtime
    }

    // Estimate total URLs: 2 static + specialists + filter combinations
    const estimatedFilterUrls = 20
    const totalUrls = 2 + specialistCount + estimatedFilterUrls

    return {
      totalUrls,
      specialistUrls: specialistCount,
      lastGenerated,
    }
  }

  /**
   * Cleanup old sitemaps
   */
  async cleanupOldSitemaps(): Promise<void> {
    try {
      const files = fs.readdirSync(this.sitemapDir)
      files.forEach((file) => {
        const filePath = path.join(this.sitemapDir, file)
        fs.unlinkSync(filePath)
      })
      this.logger.log('Cleaned up old sitemaps')
    } catch (error) {
      this.logger.error('Failed to cleanup old sitemaps', error)
    }
  }
}
