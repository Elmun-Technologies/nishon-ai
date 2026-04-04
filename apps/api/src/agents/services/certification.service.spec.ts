import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { NotFoundException, ConflictException, BadRequestException } from '@nestjs/common';
import { CertificationService } from './certification.service';
import { AgentCertification } from '../entities/agent-certification.entity';
import { MarketplaceCertification } from '../entities/marketplace-certification.entity';
import { AgentProfile } from '../entities/agent-profile.entity';

describe('CertificationService', () => {
  let service: CertificationService;
  let agentCertRepository: Repository<AgentCertification>;
  let certRepository: Repository<MarketplaceCertification>;
  let agentProfileRepository: Repository<AgentProfile>;

  // Mock data
  const mockCertification: MarketplaceCertification = {
    id: 'cert-1',
    name: 'Google Partner',
    slug: 'google-partner',
    description: 'Certified Google Partner',
    issuer: 'Google',
    iconUrl: 'https://example.com/google.png',
    badgeColor: '#4285F4',
    isActive: true,
    agentCertifications: [],
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockAgentProfile: AgentProfile = {
    id: 'agent-1',
    slug: 'test-agent',
    agentType: 'human',
    ownerId: null,
    displayName: 'Test Agent',
    title: 'Marketing Expert',
    bio: 'Test bio',
    avatar: '🤖',
    avatarColor: '#FF0000',
    location: 'Test City',
    responseTime: '1 hour',
    monthlyRate: 100,
    commissionRate: 5,
    pricingModel: 'fixed',
    currency: 'USD',
    platformCommissionPct: 15,
    isVerified: true,
    isPublished: true,
    isProMember: false,
    isFeatured: false,
    niches: [],
    platforms: [],
    aiConfig: null,
    cachedStats: null,
    cachedRating: 0,
    cachedReviewCount: 0,
    monthlyPerformance: null,
    certificationLevel: 'unverified',
    verificationLevelUpdatedAt: null,
    verifiedByAdmin: null,
    primaryCountries: null,
    supportedLanguages: null,
    timezone: 'UTC',
    lastPerformanceSync: null,
    performanceSyncStatus: 'never_synced',
    isPerformanceDataVerified: false,
    seoSlug: null,
    isIndexable: true,
    pageViewCount: 0,
    specializations: null,
    industriesServed: null,
    averageResponseTimeHours: null,
    communicationChannels: null,
    timezoneAvailabilityStart: null,
    timezoneAvailabilityEnd: null,
    searchKeywords: null,
    popularityScore: 0,
    fraudRiskScore: 0,
    createdAt: new Date(),
    updatedAt: new Date(),
    owner: null,
    engagements: [],
    reviews: [],
    certifications: [],
    caseStudies: [],
    languages: [],
    geographicCoverage: [],
    platformMetrics: [],
    historicalPerformance: [],
    syncLogs: [],
  };

  const mockAgentCertification: AgentCertification = {
    id: 'agent-cert-1',
    agentProfileId: 'agent-1',
    certificationId: 'cert-1',
    proofUrl: 'https://example.com/proof.png',
    verified: false,
    verificationStatus: 'pending_review',
    verifiedAt: null,
    verifiedBy: null,
    expiresAt: null,
    agentProfile: mockAgentProfile,
    certification: mockCertification,
    createdAt: new Date(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CertificationService,
        {
          provide: getRepositoryToken(AgentCertification),
          useValue: {
            find: jest.fn(),
            findOne: jest.fn(),
            findAndCount: jest.fn(),
            create: jest.fn(),
            save: jest.fn(),
            remove: jest.fn(),
            count: jest.fn(),
            createQueryBuilder: jest.fn(),
          },
        },
        {
          provide: getRepositoryToken(MarketplaceCertification),
          useValue: {
            find: jest.fn(),
            findOne: jest.fn(),
            create: jest.fn(),
            save: jest.fn(),
            count: jest.fn(),
          },
        },
        {
          provide: getRepositoryToken(AgentProfile),
          useValue: {
            find: jest.fn(),
            findOne: jest.fn(),
            save: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<CertificationService>(CertificationService);
    agentCertRepository = module.get<Repository<AgentCertification>>(
      getRepositoryToken(AgentCertification),
    );
    certRepository = module.get<Repository<MarketplaceCertification>>(
      getRepositoryToken(MarketplaceCertification),
    );
    agentProfileRepository = module.get<Repository<AgentProfile>>(
      getRepositoryToken(AgentProfile),
    );
  });

  describe('getCertificationsList', () => {
    it('should return list of active certifications', async () => {
      jest.spyOn(certRepository, 'find').mockResolvedValue([mockCertification]);

      const result = await service.getCertificationsList(false);

      expect(result).toHaveLength(1);
      expect(result[0].name).toBe('Google Partner');
      expect(result[0].isActive).toBe(true);
    });

    it('should include stats when requested', async () => {
      jest.spyOn(certRepository, 'find').mockResolvedValue([mockCertification]);
      jest.spyOn(agentCertRepository, 'count').mockResolvedValue(5);

      const result = await service.getCertificationsList(true);

      expect(result).toHaveLength(1);
      expect(result[0].agentCount).toBe(5);
    });
  });

  describe('addCertificationToAgent', () => {
    it('should successfully add certification to agent', async () => {
      jest
        .spyOn(agentProfileRepository, 'findOne')
        .mockResolvedValue(mockAgentProfile);
      jest
        .spyOn(certRepository, 'findOne')
        .mockResolvedValue(mockCertification);
      jest
        .spyOn(agentCertRepository, 'findOne')
        .mockResolvedValue(null); // No existing cert
      jest
        .spyOn(agentCertRepository, 'create')
        .mockReturnValue(mockAgentCertification);
      jest
        .spyOn(agentCertRepository, 'save')
        .mockResolvedValue(mockAgentCertification);
      jest
        .spyOn(agentProfileRepository, 'save')
        .mockResolvedValue(mockAgentProfile);

      const result = await service.addCertificationToAgent(
        'agent-1',
        'cert-1',
        'https://example.com/proof.png',
      );

      expect(result.certificationName).toBe('Google Partner');
      expect(result.verificationStatus).toBe('pending_review');
    });

    it('should throw ConflictException when agent already has certification', async () => {
      jest
        .spyOn(agentProfileRepository, 'findOne')
        .mockResolvedValue(mockAgentProfile);
      jest
        .spyOn(certRepository, 'findOne')
        .mockResolvedValue(mockCertification);
      jest
        .spyOn(agentCertRepository, 'findOne')
        .mockResolvedValue(mockAgentCertification); // Cert already exists

      await expect(
        service.addCertificationToAgent('agent-1', 'cert-1'),
      ).rejects.toThrow(ConflictException);
    });

    it('should throw NotFoundException when agent does not exist', async () => {
      jest.spyOn(agentProfileRepository, 'findOne').mockResolvedValue(null);

      await expect(
        service.addCertificationToAgent('agent-1', 'cert-1'),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw NotFoundException when certification does not exist', async () => {
      jest
        .spyOn(agentProfileRepository, 'findOne')
        .mockResolvedValue(mockAgentProfile);
      jest.spyOn(certRepository, 'findOne').mockResolvedValue(null);

      await expect(
        service.addCertificationToAgent('agent-1', 'cert-1'),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw BadRequestException for invalid proof URL', async () => {
      jest
        .spyOn(agentProfileRepository, 'findOne')
        .mockResolvedValue(mockAgentProfile);
      jest
        .spyOn(certRepository, 'findOne')
        .mockResolvedValue(mockCertification);
      jest
        .spyOn(agentCertRepository, 'findOne')
        .mockResolvedValue(null);

      await expect(
        service.addCertificationToAgent('agent-1', 'cert-1', 'not-a-url'),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('verifyCertification', () => {
    it('should successfully approve certification', async () => {
      const approvedCert = { ...mockAgentCertification };
      jest
        .spyOn(agentCertRepository, 'findOne')
        .mockResolvedValue(mockAgentCertification);
      jest
        .spyOn(agentCertRepository, 'save')
        .mockResolvedValue(approvedCert);
      jest
        .spyOn(agentProfileRepository, 'findOne')
        .mockResolvedValue(mockAgentProfile);
      jest
        .spyOn(agentProfileRepository, 'save')
        .mockResolvedValue(mockAgentProfile);

      const result = await service.verifyCertification(
        'agent-cert-1',
        { verified: true },
        'admin-1',
      );

      expect(result.verified).toBe(true);
      expect(result.verificationStatus).toBe('approved');
    });

    it('should successfully reject certification', async () => {
      const rejectedCert = { ...mockAgentCertification };
      jest
        .spyOn(agentCertRepository, 'findOne')
        .mockResolvedValue(mockAgentCertification);
      jest
        .spyOn(agentCertRepository, 'save')
        .mockResolvedValue(rejectedCert);
      jest
        .spyOn(agentProfileRepository, 'findOne')
        .mockResolvedValue(mockAgentProfile);
      jest
        .spyOn(agentProfileRepository, 'save')
        .mockResolvedValue(mockAgentProfile);

      const result = await service.verifyCertification(
        'agent-cert-1',
        { verified: false },
        'admin-1',
      );

      expect(result.verified).toBe(false);
      expect(result.verificationStatus).toBe('rejected');
    });

    it('should throw BadRequestException for past expiration date', async () => {
      const pastDate = new Date();
      pastDate.setFullYear(pastDate.getFullYear() - 1);

      jest
        .spyOn(agentCertRepository, 'findOne')
        .mockResolvedValue(mockAgentCertification);

      await expect(
        service.verifyCertification(
          'agent-cert-1',
          { verified: true, expiresAt: pastDate },
          'admin-1',
        ),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('getUserCertifications', () => {
    it('should return all certifications for an agent', async () => {
      jest
        .spyOn(agentProfileRepository, 'findOne')
        .mockResolvedValue(mockAgentProfile);
      jest
        .spyOn(agentCertRepository, 'find')
        .mockResolvedValue([mockAgentCertification]);

      const result = await service.getUserCertifications('agent-1');

      expect(result).toHaveLength(1);
      expect(result[0].certificationName).toBe('Google Partner');
    });

    it('should throw NotFoundException when agent does not exist', async () => {
      jest.spyOn(agentProfileRepository, 'findOne').mockResolvedValue(null);

      await expect(
        service.getUserCertifications('agent-1'),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('updateCertificationLevel', () => {
    it('should set level to unverified when no certifications', async () => {
      jest
        .spyOn(agentProfileRepository, 'findOne')
        .mockResolvedValue(mockAgentProfile);
      jest.spyOn(agentCertRepository, 'find').mockResolvedValue([]);
      jest
        .spyOn(agentProfileRepository, 'save')
        .mockResolvedValue(mockAgentProfile);

      await service.updateCertificationLevel('agent-1');

      expect(agentProfileRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({ certificationLevel: 'unverified' }),
      );
    });

    it('should set level to verified with 1 verified cert', async () => {
      const verifiedCert = { ...mockAgentCertification, verified: true };
      jest
        .spyOn(agentProfileRepository, 'findOne')
        .mockResolvedValue(mockAgentProfile);
      jest
        .spyOn(agentCertRepository, 'find')
        .mockResolvedValue([verifiedCert]);
      jest
        .spyOn(agentProfileRepository, 'save')
        .mockResolvedValue(mockAgentProfile);

      await service.updateCertificationLevel('agent-1');

      expect(agentProfileRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({ certificationLevel: 'verified' }),
      );
    });

    it('should set level to premium with 2+ verified certs and pro member', async () => {
      const proAgent = { ...mockAgentProfile, isProMember: true };
      const verifiedCert1 = { ...mockAgentCertification, verified: true };
      const verifiedCert2 = {
        ...mockAgentCertification,
        id: 'agent-cert-2',
        verified: true,
      };

      jest.spyOn(agentProfileRepository, 'findOne').mockResolvedValue(proAgent);
      jest
        .spyOn(agentCertRepository, 'find')
        .mockResolvedValue([verifiedCert1, verifiedCert2]);
      jest
        .spyOn(agentProfileRepository, 'save')
        .mockResolvedValue(proAgent);

      await service.updateCertificationLevel('agent-1');

      expect(agentProfileRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({ certificationLevel: 'premium' }),
      );
    });
  });

  describe('createCertification', () => {
    it('should create new certification type', async () => {
      jest.spyOn(certRepository, 'findOne').mockResolvedValue(null);
      jest
        .spyOn(certRepository, 'create')
        .mockReturnValue(mockCertification);
      jest
        .spyOn(certRepository, 'save')
        .mockResolvedValue(mockCertification);

      const result = await service.createCertification({
        name: 'Google Partner',
        slug: 'google-partner',
        description: 'Google Partner certification',
        issuer: 'Google',
        iconUrl: 'https://example.com/google.png',
        badgeColor: '#4285F4',
      });

      expect(result.name).toBe('Google Partner');
      expect(result.isActive).toBe(true);
    });

    it('should throw ConflictException when certification slug exists', async () => {
      jest
        .spyOn(certRepository, 'findOne')
        .mockResolvedValue(mockCertification);

      await expect(
        service.createCertification({
          name: 'Google Partner',
          slug: 'google-partner',
          description: 'Google Partner certification',
          issuer: 'Google',
        }),
      ).rejects.toThrow(ConflictException);
    });
  });

  describe('getPendingCertifications', () => {
    it('should return pending certifications with pagination', async () => {
      jest
        .spyOn(agentCertRepository, 'findAndCount')
        .mockResolvedValue([[mockAgentCertification], 1]);

      const result = await service.getPendingCertifications(50, 0);

      expect(result.items).toHaveLength(1);
      expect(result.total).toBe(1);
    });
  });

  describe('cleanupExpiredCertifications', () => {
    it('should mark expired certifications as unverified', async () => {
      const pastDate = new Date();
      pastDate.setFullYear(pastDate.getFullYear() - 1);
      const expiredCert = {
        ...mockAgentCertification,
        verified: true,
        expiresAt: pastDate,
      };

      jest
        .spyOn(agentCertRepository, 'find')
        .mockResolvedValue([expiredCert]);
      jest
        .spyOn(agentCertRepository, 'save')
        .mockResolvedValue(expiredCert);
      jest
        .spyOn(agentProfileRepository, 'findOne')
        .mockResolvedValue(mockAgentProfile);
      jest
        .spyOn(agentProfileRepository, 'save')
        .mockResolvedValue(mockAgentProfile);

      const cleaned = await service.cleanupExpiredCertifications();

      expect(cleaned).toBe(1);
    });
  });
});
