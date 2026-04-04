/**
 * CertificationService Integration Examples
 *
 * This file demonstrates how to use the CertificationService in various scenarios.
 */

import { Injectable } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { CertificationService } from './certification.service';

/**
 * Example 1: Initialize certifications on app startup
 */
export async function initializeCertifications(
  certService: CertificationService,
): Promise<void> {
  console.log('Initializing default certifications...');
  await certService.initializeDefaultCertifications();
  console.log('Certification initialization complete');
}

/**
 * Example 2: Agent workflow - Add certification
 */
export async function agentAddsCertification(
  certService: CertificationService,
  agentId: string,
): Promise<void> {
  console.log(`Agent ${agentId} is adding Google Partner certification...`);

  try {
    // Get available certifications first
    const certs = await certService.getCertificationsList();
    const googlePartner = certs.find((c) => c.slug === 'google-partner');

    if (!googlePartner) {
      console.error('Google Partner certification not found');
      return;
    }

    // Agent adds certification with proof URL
    const agentCert = await certService.addCertificationToAgent(
      agentId,
      googlePartner.id,
      'https://example.com/google-partner-certificate.png',
    );

    console.log(
      `✓ Certification added successfully. Status: ${agentCert.verificationStatus}`,
    );
    console.log(`  Waiting for admin review...`);
  } catch (error) {
    console.error('Failed to add certification:', error);
  }
}

/**
 * Example 3: Admin workflow - Review pending certifications
 */
export async function adminReviewsPending(
  certService: CertificationService,
  adminId: string,
): Promise<void> {
  console.log('Admin reviewing pending certifications...');

  try {
    // Get pending certifications
    const { items, total } = await certService.getPendingCertifications(10, 0);

    console.log(`Found ${total} pending certifications`);

    if (items.length === 0) {
      console.log('No pending certifications');
      return;
    }

    // Review first certification
    const cert = items[0];
    console.log(`\nReviewing: ${cert.certificationName}`);
    console.log(`  Agent: ${cert.id}`);
    console.log(`  Proof URL: ${cert.proofUrl}`);
    console.log(`  Submitted: ${cert.createdAt}`);

    // Approve certification (example)
    const futureDate = new Date();
    futureDate.setFullYear(futureDate.getFullYear() + 1);

    const verified = await certService.verifyCertification(
      cert.id,
      {
        verified: true,
        expiresAt: futureDate,
      },
      adminId,
    );

    console.log(
      `✓ Certification approved. Status: ${verified.verificationStatus}`,
    );
  } catch (error) {
    console.error('Failed to review certifications:', error);
  }
}

/**
 * Example 4: Get agent profile with certifications
 */
export async function displayAgentProfile(
  certService: CertificationService,
  agentId: string,
): Promise<void> {
  try {
    const certs = await certService.getUserCertifications(agentId);

    console.log(`Agent Certifications (${certs.length} total):`);

    const verifiedCerts = certs.filter((c) => c.verified);
    const pendingCerts = certs.filter(
      (c) => c.verificationStatus === 'pending_review',
    );

    if (verifiedCerts.length > 0) {
      console.log('\n✓ Verified Certifications:');
      verifiedCerts.forEach((cert) => {
        const expireInfo = cert.expiresAt
          ? ` (expires ${cert.expiresAt.toLocaleDateString()})`
          : ' (no expiration)';
        console.log(`  • ${cert.certificationName}${expireInfo}`);
      });
    }

    if (pendingCerts.length > 0) {
      console.log('\n⏳ Pending Review:');
      pendingCerts.forEach((cert) => {
        console.log(`  • ${cert.certificationName} (submitted ${cert.createdAt})`);
      });
    }
  } catch (error) {
    console.error('Failed to get agent certifications:', error);
  }
}

/**
 * Example 5: Search agents by certification
 */
export async function findAgentsBySpecialization(
  certService: CertificationService,
): Promise<void> {
  try {
    // Get all certifications
    const certs = await certService.getCertificationsList(true);

    console.log('Agents by Certification:');
    console.log('=======================\n');

    for (const cert of certs) {
      const agents = await certService.searchByAgentCertification(
        cert.id,
        'approved',
      );
      console.log(`${cert.name}: ${agents.length} verified agents`);
    }
  } catch (error) {
    console.error('Failed to search by certification:', error);
  }
}

/**
 * Example 6: NestJS service with scheduled certification cleanup
 */
@Injectable()
export class CertificationMaintenanceService {
  constructor(private certService: CertificationService) {}

  /**
   * Run daily at 2 AM UTC to clean up expired certifications
   */
  @Cron(CronExpression.EVERY_DAY_AT_2AM)
  async handleExpirationCleanup(): Promise<void> {
    try {
      const cleaned = await this.certService.cleanupExpiredCertifications();
      console.log(
        `✓ Certification cleanup complete. Cleaned up ${cleaned} expired certs.`,
      );
    } catch (error) {
      console.error('Certification cleanup failed:', error);
    }
  }

  /**
   * Run weekly to generate certification statistics
   */
  @Cron('0 0 * * 0') // Every Sunday at midnight
  async generateStatistics(): Promise<void> {
    try {
      const certs = await this.certService.getCertificationsList(true);

      console.log('\n=== Weekly Certification Report ===');
      console.log(`Report Date: ${new Date().toISOString()}`);
      console.log(`Total Certification Types: ${certs.length}`);

      let totalAgents = 0;
      let totalVerified = 0;

      certs.forEach((cert) => {
        const agents = cert.agentCount || 0;
        const verified = cert.verifiedCount || 0;
        totalAgents += agents;
        totalVerified += verified;

        const percentage = agents > 0 ? ((verified / agents) * 100).toFixed(1) : 0;
        console.log(
          `  ${cert.name}: ${verified}/${agents} verified (${percentage}%)`,
        );
      });

      console.log(`\nTotal Agent Certifications: ${totalAgents}`);
      console.log(`Total Verified: ${totalVerified}`);
      console.log('====================================\n');
    } catch (error) {
      console.error('Failed to generate statistics:', error);
    }
  }
}

/**
 * Example 7: Bulk update certifications
 */
export async function bulkUpdateCertificationExpiry(
  certService: CertificationService,
  agentIds: string[],
  newExpiryDate: Date,
): Promise<void> {
  console.log(`Updating expiry for ${agentIds.length} agents...`);

  let updated = 0;
  let failed = 0;

  for (const agentId of agentIds) {
    try {
      const certs = await certService.getUserCertifications(agentId);

      for (const cert of certs) {
        if (cert.verified) {
          await certService.verifyCertification(
            cert.id,
            {
              verified: true,
              expiresAt: newExpiryDate,
            },
            'bulk-update-system',
          );
          updated++;
        }
      }
    } catch (error) {
      failed++;
      console.error(`Failed to update agent ${agentId}:`, error);
    }
  }

  console.log(`✓ Bulk update complete: ${updated} updated, ${failed} failed`);
}

/**
 * Example 8: Create custom certification type
 */
export async function createCustomCertification(
  certService: CertificationService,
): Promise<void> {
  try {
    const newCert = await certService.createCertification({
      name: 'TikTok Business Certified',
      slug: 'tiktok-business-certified',
      description:
        'Official TikTok Business certification for advanced shop and advertising features.',
      issuer: 'TikTok',
      iconUrl: 'https://cdn.performa.ai/certifications/tiktok-certified.png',
      badgeColor: '#000000',
    });

    console.log(`✓ Created new certification: ${newCert.name}`);
  } catch (error) {
    console.error('Failed to create certification:', error);
  }
}

/**
 * Example 9: Get audit trail for compliance
 */
export async function generateComplianceReport(
  certService: CertificationService,
  agentCertId: string,
): Promise<void> {
  try {
    const trail = await certService.getCertificationAuditTrail(agentCertId);

    console.log('\n=== Certification Audit Trail ===');
    console.log(`Certification: ${trail.certificationName}`);
    console.log(`Agent: ${trail.agentId}`);
    console.log(`Status: ${trail.status}`);
    console.log(`Created: ${trail.createdAt}`);

    if (trail.verifiedAt) {
      console.log(`Verified: ${trail.verifiedAt}`);
      console.log(`Verified By: ${trail.verifiedBy}`);
    }

    if (trail.expiresAt) {
      console.log(`Expires: ${trail.expiresAt}`);
    }

    console.log('===================================\n');
  } catch (error) {
    console.error('Failed to generate audit trail:', error);
  }
}

/**
 * Example 10: Agent profile enrichment for marketplace listing
 */
export async function enrichAgentProfileForListing(
  certService: CertificationService,
  agentId: string,
): Promise<{
  certifications: Array<{
    name: string;
    issuer: string;
    badgeColor: string;
    iconUrl: string;
    verified: boolean;
  }>;
  certificationLevel: string;
}> {
  try {
    const certs = await certService.getUserCertifications(agentId);

    // Only include verified certifications for public display
    const verifiedCerts = certs
      .filter((c) => c.verified && !c.isExpired)
      .map((c) => ({
        name: c.certificationName,
        issuer: c.issuer,
        badgeColor: c.badgeColor,
        iconUrl: c.iconUrl,
        verified: true,
      }));

    // Determine certification level
    let certificationLevel = 'unverified';
    if (verifiedCerts.length >= 2) {
      certificationLevel = 'premium';
    } else if (verifiedCerts.length === 1) {
      certificationLevel = 'verified';
    } else if (certs.some((c) => c.verificationStatus === 'pending_review')) {
      certificationLevel = 'self_declared';
    }

    return {
      certifications: verifiedCerts,
      certificationLevel,
    };
  } catch (error) {
    console.error('Failed to enrich agent profile:', error);
    return {
      certifications: [],
      certificationLevel: 'unverified',
    };
  }
}

/**
 * Example 11: Marketplace filtering by certification
 */
export async function getAgentsByMarketplaceFilters(
  certService: CertificationService,
  filters: {
    certifications?: string[];
    verificationStatus?: 'verified' | 'self_declared' | 'premium';
  },
): Promise<{
  agents: any[];
  filters: any;
}> {
  try {
    const results = [];

    if (filters.certifications && filters.certifications.length > 0) {
      // For each requested certification, get verified agents
      for (const certSlug of filters.certifications) {
        const certs = await certService.getCertificationsList();
        const cert = certs.find((c) => c.slug === certSlug);

        if (cert) {
          const agents = await certService.searchByAgentCertification(
            cert.id,
            'approved',
          );
          results.push(...agents);
        }
      }
    }

    // Remove duplicates
    const uniqueAgents = Array.from(
      new Map(results.map((item) => [item.id, item])).values(),
    );

    return {
      agents: uniqueAgents,
      filters,
    };
  } catch (error) {
    console.error('Failed to filter agents by certification:', error);
    return {
      agents: [],
      filters,
    };
  }
}

/**
 * Example 12: Export certification data for analytics
 */
export async function exportCertificationData(
  certService: CertificationService,
): Promise<string> {
  try {
    const certs = await certService.getCertificationsList(true);

    const csv = [
      'Certification,Issuer,Total Agents,Verified,Percentage',
      ...certs.map((c) => {
        const total = c.agentCount || 0;
        const verified = c.verifiedCount || 0;
        const percentage = total > 0 ? ((verified / total) * 100).toFixed(1) : 0;
        return `"${c.name}","${c.issuer}",${total},${verified},${percentage}%`;
      }),
    ].join('\n');

    return csv;
  } catch (error) {
    console.error('Failed to export certification data:', error);
    return '';
  }
}
