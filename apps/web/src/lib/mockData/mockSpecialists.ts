export interface Specialist {
  id: string
  slug: string
  name: string
  title: string
  avatar: string
  coverImage: string
  bio: string
  location: string
  languages: string[]
  responseTime: string
  platforms: string[]
  niches: string[]
  certifications: Certification[]
  rating: number
  reviewCount: number
  averageROAS: number
  monthlyRate: number
  minBudget: number
  verifiedSince: string
  caseStudies: CaseStudy[]
  reviews: Review[]
  performanceMetrics: PerformanceMetric[]
  experience: number
  totalClientsServed: number
  successRate: number
  platformBreakdown: Record<string, number>
}

export interface Certification {
  id: string
  name: string
  issuer: string
  icon: string
  verifiedAt: string
  expiresAt?: string
}

export interface CaseStudy {
  id: string
  title: string
  industry: string
  clientName?: string
  description: string
  beforeMetric: number
  afterMetric: number
  metricLabel: string
  duration: string
  spend: number
  screenshots: string[]
  tags: string[]
}

export interface Review {
  id: string
  author: string
  authorAvatar: string
  rating: number
  title: string
  content: string
  date: string
  verified: boolean
  helpful: number
  tags: string[]
}

export interface PerformanceMetric {
  date: string
  roas: number
  cpa: number
  clicks: number
  conversions: number
}

export const mockSpecialists: Specialist[] = [
  {
    id: '1',
    slug: 'alex-chen',
    name: 'Alex Chen',
    title: 'Meta & Google Ads Specialist',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400',
    coverImage: 'https://images.unsplash.com/photo-1557821552-17105176677c?w=1200',
    bio: 'Specialized in scaling e-commerce brands with Meta and Google Ads. 7+ years of experience managing $50M+ in ad spend.',
    location: 'San Francisco, CA',
    languages: ['English', 'Mandarin'],
    responseTime: '< 2 hours',
    platforms: ['Facebook Ads', 'Instagram Ads', 'Google Ads', 'TikTok Ads'],
    niches: ['E-commerce', 'Fashion', 'Beauty'],
    certifications: [
      {
        id: 'c1',
        name: 'Google Ads Certified',
        issuer: 'Google',
        icon: 'google',
        verifiedAt: '2023-01-15',
        expiresAt: '2025-01-15',
      },
      {
        id: 'c2',
        name: 'Meta Blueprint Certified',
        issuer: 'Meta',
        icon: 'meta',
        verifiedAt: '2023-06-20',
        expiresAt: '2025-06-20',
      },
    ],
    rating: 4.9,
    reviewCount: 156,
    averageROAS: 4.2,
    monthlyRate: 5000,
    minBudget: 15000,
    verifiedSince: '2017-03-12',
    experience: 7,
    totalClientsServed: 48,
    successRate: 94,
    platformBreakdown: {
      'Facebook Ads': 35,
      'Instagram Ads': 25,
      'Google Ads': 30,
      'TikTok Ads': 10,
    },
    caseStudies: [
      {
        id: 'cs1',
        title: 'Luxury Fashion Brand Scaling',
        industry: 'Fashion',
        clientName: 'VestiaireCollective',
        description: 'Scaled a luxury fashion marketplace from $50K/month to $500K/month in 8 months',
        beforeMetric: 50000,
        afterMetric: 500000,
        metricLabel: 'Monthly Revenue',
        duration: '8 months',
        spend: 120000,
        screenshots: ['https://images.unsplash.com/photo-1460925895917-adf4e565db12?w=600'],
        tags: ['Scaling', 'Luxury', 'High AOV'],
      },
    ],
    reviews: [
      {
        id: 'r1',
        author: 'Sarah Johnson',
        authorAvatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200',
        rating: 5,
        title: 'Exceptional results and communication',
        content:
          'Alex helped us scale our campaign from $20K/month to $150K/month. The attention to detail and constant optimization was impressive.',
        date: '2024-02-15',
        verified: true,
        helpful: 24,
        tags: ['Scaling', 'Communication', 'Results'],
      },
    ],
    performanceMetrics: [
      { date: '2024-01-01', roas: 3.8, cpa: 45, clicks: 12000, conversions: 420 },
      { date: '2024-02-01', roas: 4.1, cpa: 42, clicks: 15000, conversions: 530 },
      { date: '2024-03-01', roas: 4.2, cpa: 41, clicks: 18000, conversions: 620 },
    ],
  },
  {
    id: '2',
    slug: 'jessica-martinez',
    name: 'Jessica Martinez',
    title: 'TikTok & YouTube Ads Expert',
    avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=400',
    coverImage: 'https://images.unsplash.com/photo-1556075798-4825dfaaf498?w=1200',
    bio: 'Creator economy specialist with focus on viral content and influencer partnerships. Helped 50+ creators monetize their audiences.',
    location: 'Los Angeles, CA',
    languages: ['English', 'Spanish'],
    responseTime: '< 1 hour',
    platforms: ['TikTok Ads', 'YouTube Ads', 'Instagram Ads', 'Pinterest Ads'],
    niches: ['Creator Economy', 'Entertainment', 'Lifestyle'],
    certifications: [
      {
        id: 'c3',
        name: 'TikTok Marketing Partner',
        issuer: 'TikTok',
        icon: 'tiktok',
        verifiedAt: '2023-09-01',
        expiresAt: '2025-09-01',
      },
    ],
    rating: 4.8,
    reviewCount: 124,
    averageROAS: 3.8,
    monthlyRate: 4500,
    minBudget: 10000,
    verifiedSince: '2018-07-20',
    experience: 6,
    totalClientsServed: 52,
    successRate: 91,
    platformBreakdown: {
      'TikTok Ads': 45,
      'YouTube Ads': 35,
      'Instagram Ads': 15,
      'Pinterest Ads': 5,
    },
    caseStudies: [
      {
        id: 'cs2',
        title: 'Creator Monetization Strategy',
        industry: 'Entertainment',
        clientName: 'TikTok Creator Network',
        description: 'Helped 50 creators generate $2M+ in collective revenue through product placement and sponsorships',
        beforeMetric: 0,
        afterMetric: 2000000,
        metricLabel: 'Creator Revenue Generated',
        duration: '12 months',
        spend: 50000,
        screenshots: ['https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=600'],
        tags: ['Creator Economy', 'Partnerships', 'Growth'],
      },
    ],
    reviews: [
      {
        id: 'r2',
        author: 'Marcus Lee',
        authorAvatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200',
        rating: 5,
        title: 'Perfect for creator-focused campaigns',
        content:
          'Jessica knows the creator space inside and out. Her strategy helped us reach the right audiences with authentic partnerships.',
        date: '2024-01-20',
        verified: true,
        helpful: 18,
        tags: ['Authenticity', 'Creators', 'Partnerships'],
      },
    ],
    performanceMetrics: [
      { date: '2024-01-01', roas: 3.5, cpa: 52, clicks: 25000, conversions: 380 },
      { date: '2024-02-01', roas: 3.8, cpa: 48, clicks: 30000, conversions: 480 },
      { date: '2024-03-01', roas: 3.8, cpa: 50, clicks: 28000, conversions: 450 },
    ],
  },
  {
    id: '3',
    slug: 'david-kumar',
    name: 'David Kumar',
    title: 'Conversion Rate Optimization Specialist',
    avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400',
    coverImage: 'https://images.unsplash.com/photo-1552664730-d307ca884978?w=1200',
    bio: 'Data-driven CRO expert. Increased conversion rates by 150%+ for SaaS companies through systematic testing.',
    location: 'Austin, TX',
    languages: ['English'],
    responseTime: '< 4 hours',
    platforms: ['Google Ads', 'Facebook Ads', 'Conversion Tools'],
    niches: ['SaaS', 'B2B', 'Technology'],
    certifications: [
      {
        id: 'c4',
        name: 'CRO Certified Professional',
        issuer: 'Conversion Rate Experts',
        icon: 'cro',
        verifiedAt: '2022-05-10',
      },
      {
        id: 'c5',
        name: 'Google Analytics 4 Certified',
        issuer: 'Google',
        icon: 'google',
        verifiedAt: '2023-08-15',
        expiresAt: '2025-08-15',
      },
    ],
    rating: 4.95,
    reviewCount: 89,
    averageROAS: 5.2,
    monthlyRate: 6000,
    minBudget: 20000,
    verifiedSince: '2016-11-05',
    experience: 8,
    totalClientsServed: 35,
    successRate: 96,
    platformBreakdown: {
      'Google Ads': 50,
      'Facebook Ads': 30,
      'Conversion Tools': 20,
    },
    caseStudies: [
      {
        id: 'cs3',
        title: 'SaaS Conversion Optimization',
        industry: 'SaaS',
        clientName: 'TechStack Pro',
        description: 'Increased signup conversion rate from 2.1% to 5.3% through systematic A/B testing',
        beforeMetric: 2.1,
        afterMetric: 5.3,
        metricLabel: 'Conversion Rate (%)',
        duration: '6 months',
        spend: 85000,
        screenshots: ['https://images.unsplash.com/photo-1516321497487-e288fb19713f?w=600'],
        tags: ['CRO', 'Testing', 'SaaS'],
      },
    ],
    reviews: [
      {
        id: 'r3',
        author: 'Emily Rodriguez',
        authorAvatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200',
        rating: 5,
        title: 'Data-driven approach that works',
        content:
          'David took a methodical approach to improving our conversion rate. Every recommendation was backed by data and testing.',
        date: '2024-02-10',
        verified: true,
        helpful: 22,
        tags: ['Data-Driven', 'Testing', 'Results'],
      },
    ],
    performanceMetrics: [
      { date: '2024-01-01', roas: 4.8, cpa: 38, clicks: 8000, conversions: 380 },
      { date: '2024-02-01', roas: 5.1, cpa: 35, clicks: 9500, conversions: 480 },
      { date: '2024-03-01', roas: 5.2, cpa: 34, clicks: 10000, conversions: 520 },
    ],
  },
  {
    id: '4',
    slug: 'amelia-watson',
    name: 'Amelia Watson',
    title: 'LinkedIn B2B Lead Generation Expert',
    avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=400',
    coverImage: 'https://images.unsplash.com/photo-1552664730-d307ca884978?w=1200',
    bio: 'B2B lead generation specialist generating 200+ qualified leads monthly for enterprise clients.',
    location: 'New York, NY',
    languages: ['English', 'French'],
    responseTime: '< 3 hours',
    platforms: ['LinkedIn Ads', 'Google Ads', 'Email Marketing'],
    niches: ['B2B', 'SaaS', 'Consulting'],
    certifications: [
      {
        id: 'c6',
        name: 'LinkedIn Marketing Partner',
        issuer: 'LinkedIn',
        icon: 'linkedin',
        verifiedAt: '2023-02-14',
        expiresAt: '2025-02-14',
      },
    ],
    rating: 4.87,
    reviewCount: 102,
    averageROAS: 3.5,
    monthlyRate: 5500,
    minBudget: 18000,
    verifiedSince: '2017-04-10',
    experience: 7,
    totalClientsServed: 42,
    successRate: 92,
    platformBreakdown: {
      'LinkedIn Ads': 60,
      'Google Ads': 25,
      'Email Marketing': 15,
    },
    caseStudies: [
      {
        id: 'cs4',
        title: 'Enterprise B2B Lead Generation',
        industry: 'B2B',
        clientName: 'EnterpriseFlow',
        description: 'Generated 200+ qualified leads per month at $85 CAC, reducing CAC by 40%',
        beforeMetric: 140,
        afterMetric: 200,
        metricLabel: 'Monthly Qualified Leads',
        duration: '9 months',
        spend: 95000,
        screenshots: ['https://images.unsplash.com/photo-1552664730-d307ca884978?w=600'],
        tags: ['B2B', 'Lead Generation', 'Enterprise'],
      },
    ],
    reviews: [
      {
        id: 'r4',
        author: 'Robert Chang',
        authorAvatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200',
        rating: 5,
        title: 'Best B2B specialist we have worked with',
        content: 'Amelia understood our enterprise sales process and delivered highly qualified leads consistently.',
        date: '2024-02-05',
        verified: true,
        helpful: 21,
        tags: ['B2B', 'Quality Leads', 'Professional'],
      },
    ],
    performanceMetrics: [
      { date: '2024-01-01', roas: 3.2, cpa: 85, clicks: 5000, conversions: 200 },
      { date: '2024-02-01', roas: 3.5, cpa: 81, clicks: 5500, conversions: 220 },
      { date: '2024-03-01', roas: 3.5, cpa: 82, clicks: 5200, conversions: 210 },
    ],
  },
  {
    id: '5',
    slug: 'thomas-schmidt',
    name: 'Thomas Schmidt',
    title: 'Amazon Ads & E-Commerce Expert',
    avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400',
    coverImage: 'https://images.unsplash.com/photo-1556075798-4825dfaaf498?w=1200',
    bio: 'Amazon advertising specialist with expertise in sponsored products, brands, and display. Managed 40+ successful Amazon stores.',
    location: 'Seattle, WA',
    languages: ['English', 'German'],
    responseTime: '< 2 hours',
    platforms: ['Amazon Ads', 'Sponsored Products', 'Sponsored Brands'],
    niches: ['E-Commerce', 'Amazon FBA', 'Physical Products'],
    certifications: [
      {
        id: 'c7',
        name: 'Amazon Ads Certified',
        issuer: 'Amazon',
        icon: 'amazon',
        verifiedAt: '2023-03-20',
        expiresAt: '2025-03-20',
      },
    ],
    rating: 4.92,
    reviewCount: 118,
    averageROAS: 4.5,
    monthlyRate: 4800,
    minBudget: 12000,
    verifiedSince: '2017-09-15',
    experience: 7,
    totalClientsServed: 41,
    successRate: 95,
    platformBreakdown: {
      'Amazon Ads': 100,
    },
    caseStudies: [
      {
        id: 'cs5',
        title: 'Amazon FBA Product Launch',
        industry: 'E-Commerce',
        clientName: 'Premium Home Goods Co',
        description: 'Scaled a new product to $100K/month in revenue within 6 months using targeted Amazon Ads strategy',
        beforeMetric: 0,
        afterMetric: 100000,
        metricLabel: 'Monthly Revenue',
        duration: '6 months',
        spend: 60000,
        screenshots: ['https://images.unsplash.com/photo-1552664730-d307ca884978?w=600'],
        tags: ['Product Launch', 'FBA', 'Scaling'],
      },
    ],
    reviews: [
      {
        id: 'r5',
        author: 'Lisa Thompson',
        authorAvatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200',
        rating: 5,
        title: 'Amazon expert who delivers results',
        content: 'Thomas helped us reach profitability on Amazon. His product research and bidding strategies are top-notch.',
        date: '2024-01-28',
        verified: true,
        helpful: 19,
        tags: ['Amazon', 'FBA', 'Profitable'],
      },
    ],
    performanceMetrics: [
      { date: '2024-01-01', roas: 4.2, cpa: 48, clicks: 7000, conversions: 350 },
      { date: '2024-02-01', roas: 4.4, cpa: 46, clicks: 8000, conversions: 400 },
      { date: '2024-03-01', roas: 4.5, cpa: 45, clicks: 8500, conversions: 425 },
    ],
  },
];
