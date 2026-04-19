import { Injectable, Logger } from '@nestjs/common'
import * as fs from 'fs'
import * as path from 'path'
import * as zlib from 'zlib'

/**
 * Robots.txt rule configuration
 */
interface RobotsRule {
  userAgent: string
  disallow: string[]
  allow?: string[]
  crawlDelay?: number
  requestRate?: {
    requests: number
    seconds: number
  }
}

@Injectable()
export class RobotsService {
  private readonly logger = new Logger(RobotsService.name)
  private readonly baseUrl = process.env.FRONTEND_URL || 'https://adspectr.com'
  private readonly publicDir = path.join(process.cwd(), 'public')

  /**
   * Generate robots.txt file
   */
  async generateRobotsTxt(): Promise<void> {
    try {
      const robotsContent = this.buildRobotsTxt()
      const robotsPath = path.join(this.publicDir, 'robots.txt')

      // Write uncompressed version
      fs.writeFileSync(robotsPath, robotsContent, 'utf-8')

      // Write gzipped version
      const gzipPath = `${robotsPath}.gz`
      const gzipStream = fs.createWriteStream(gzipPath)
      gzipStream.end(robotsContent)

      await new Promise((resolve, reject) => {
        gzipStream.on('finish', resolve)
        gzipStream.on('error', reject)
      })

      this.logger.log('Successfully generated robots.txt')
    } catch (error) {
      this.logger.error('Failed to generate robots.txt', error)
      throw error
    }
  }

  /**
   * Build robots.txt content
   */
  private buildRobotsTxt(): string {
    const rules = this.getRobotRules()

    let content = `# AdSpectr Marketplace robots.txt
# Generated: ${new Date().toISOString()}
# For more information, visit https://www.robotstxt.org/

`

    // Add rules for each user agent
    rules.forEach((rule, index) => {
      if (index > 0) {
        content += '\n'
      }

      content += `User-agent: ${rule.userAgent}\n`

      // Add allow rules first
      if (rule.allow && rule.allow.length > 0) {
        rule.allow.forEach((allow) => {
          content += `Allow: ${allow}\n`
        })
      }

      // Add disallow rules
      if (rule.disallow && rule.disallow.length > 0) {
        rule.disallow.forEach((disallow) => {
          content += `Disallow: ${disallow}\n`
        })
      }

      // Add crawl delay
      if (rule.crawlDelay !== undefined) {
        content += `Crawl-delay: ${rule.crawlDelay}\n`
      }

      // Add request rate
      if (rule.requestRate) {
        content += `Request-rate: ${rule.requestRate.requests}/${rule.requestRate.seconds}\n`
      }
    })

    // Add sitemap reference
    content += `\n# Sitemap location
Sitemap: ${this.baseUrl}/sitemaps/sitemap.xml
Sitemap: ${this.baseUrl}/sitemaps/sitemap-index.xml

`

    return content
  }

  /**
   * Get robot.txt rules for different user agents
   */
  private getRobotRules(): RobotsRule[] {
    return [
      {
        userAgent: '*',
        disallow: ['/admin', '/auth', '/api', '/admin-panel', '/dashboard', '/_next', '/.well-known'],
        allow: ['/marketplace', '/marketplace/specialists'],
        crawlDelay: 1,
      },
      {
        userAgent: 'Googlebot',
        disallow: ['/admin', '/auth', '/api', '/admin-panel', '/_next'],
        allow: ['/marketplace', '/marketplace/specialists', '/*.json'],
        crawlDelay: 1,
        requestRate: { requests: 1, seconds: 1 },
      },
      {
        userAgent: 'Googlebot-Image',
        disallow: ['/admin', '/auth', '/api'],
        allow: ['/marketplace', '/images', '/og'],
      },
      {
        userAgent: 'Bingbot',
        disallow: ['/admin', '/auth', '/api', '/admin-panel'],
        allow: ['/marketplace', '/marketplace/specialists'],
        crawlDelay: 1,
      },
      {
        userAgent: 'Yandexbot',
        disallow: ['/admin', '/auth', '/api', '/admin-panel'],
        allow: ['/marketplace', '/marketplace/specialists'],
        crawlDelay: 1,
      },
      {
        userAgent: 'DuckDuckGoBot',
        disallow: ['/admin', '/auth', '/api'],
        allow: ['/marketplace'],
      },
      {
        userAgent: 'ia_archiver',
        disallow: ['/'],
      },
      {
        userAgent: 'MJ12bot',
        disallow: ['/admin', '/auth', '/api'],
        allow: ['/marketplace'],
      },
      {
        userAgent: 'AhrefsBot',
        disallow: [],
        allow: ['/'],
      },
      {
        userAgent: 'SemrushBot',
        disallow: [],
        allow: ['/'],
      },
    ]
  }

  /**
   * Get current robots.txt content
   */
  async getRobotsTxt(): Promise<string | null> {
    const robotsPath = path.join(this.publicDir, 'robots.txt')

    try {
      if (fs.existsSync(robotsPath)) {
        return fs.readFileSync(robotsPath, 'utf-8')
      }
      return null
    } catch (error) {
      this.logger.error('Failed to read robots.txt', error)
      return null
    }
  }

  /**
   * Validate robots.txt syntax
   */
  validateRobotsTxt(content: string): {
    valid: boolean
    errors: string[]
  } {
    const errors: string[] = []
    const lines = content.split('\n')

    let currentUserAgent: string | null = null
    let lineNumber = 0

    for (const line of lines) {
      lineNumber++
      const trimmedLine = line.trim()

      // Skip comments and empty lines
      if (!trimmedLine || trimmedLine.startsWith('#')) {
        continue
      }

      const [key, ...valueParts] = trimmedLine.split(':')
      const keyLower = key.toLowerCase().trim()
      const value = valueParts.join(':').trim()

      // Validate key-value pairs
      if (!keyLower || !value) {
        errors.push(`Line ${lineNumber}: Invalid format. Expected "key: value"`)
        continue
      }

      // Track current user agent
      if (keyLower === 'user-agent') {
        currentUserAgent = value
      }

      // Validate specific rules
      if (keyLower === 'disallow' || keyLower === 'allow') {
        if (!value.startsWith('/') && value !== '*') {
          errors.push(`Line ${lineNumber}: ${keyLower} path should start with /`)
        }
      }

      if (keyLower === 'crawl-delay') {
        if (isNaN(parseFloat(value))) {
          errors.push(`Line ${lineNumber}: crawl-delay must be a number`)
        }
      }
    }

    return {
      valid: errors.length === 0,
      errors,
    }
  }

  /**
   * Get file size information
   */
  getFileSize(): {
    robots: string | null
    robotsGz: string | null
  } {
    const robotsPath = path.join(this.publicDir, 'robots.txt')
    const robotsGzPath = `${robotsPath}.gz`

    let robots = null
    let robotsGz = null

    try {
      if (fs.existsSync(robotsPath)) {
        const stats = fs.statSync(robotsPath)
        robots = this.formatFileSize(stats.size)
      }

      if (fs.existsSync(robotsGzPath)) {
        const stats = fs.statSync(robotsGzPath)
        robotsGz = this.formatFileSize(stats.size)
      }
    } catch (error) {
      this.logger.error('Failed to get file sizes', error)
    }

    return { robots, robotsGz }
  }

  /**
   * Format bytes to human readable size
   */
  private formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes'

    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))

    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i]
  }

  /**
   * Get robots.txt statistics
   */
  async getRobotsStats(): Promise<{
    exists: boolean
    lastGenerated: Date | null
    fileSize: string | null
    userAgentCount: number
    disallowCount: number
    allowCount: number
  }> {
    const robotsPath = path.join(this.publicDir, 'robots.txt')
    let lastGenerated = null
    let content = ''

    if (fs.existsSync(robotsPath)) {
      const stats = fs.statSync(robotsPath)
      lastGenerated = stats.mtime
      content = fs.readFileSync(robotsPath, 'utf-8')
    }

    const lines = content.split('\n')
    const userAgentCount = lines.filter((l) => l.toLowerCase().startsWith('user-agent:')).length
    const disallowCount = lines.filter((l) => l.toLowerCase().startsWith('disallow:')).length
    const allowCount = lines.filter((l) => l.toLowerCase().startsWith('allow:')).length

    return {
      exists: fs.existsSync(robotsPath),
      lastGenerated,
      fileSize: this.getFileSize().robots,
      userAgentCount,
      disallowCount,
      allowCount,
    }
  }
}
