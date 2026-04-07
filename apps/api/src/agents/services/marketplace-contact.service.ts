import {
  Injectable,
  Logger,
  NotFoundException,
} from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { AgentProfile } from "../entities/agent-profile.entity";
import { SpecialistContact } from "../entities/specialist-contact.entity";

@Injectable()
export class MarketplaceContactService {
  private readonly logger = new Logger(MarketplaceContactService.name);

  constructor(
    @InjectRepository(AgentProfile)
    private readonly agentProfileRepository: Repository<AgentProfile>,
    @InjectRepository(SpecialistContact)
    private readonly contactRepository: Repository<SpecialistContact>,
  ) {}

  /**
   * Send contact message to specialist
   */
  async contactSpecialist(
    slug: string,
    dto: {
      email: string;
      phone?: string;
      message: string;
      preferredContactMethod?: "email" | "phone" | "message";
    },
    userId?: string,
  ) {
    const specialist = await this.agentProfileRepository.findOne({
      where: { slug },
      relations: ["owner"],
    });

    if (!specialist) {
      throw new NotFoundException(
        `Specialist with slug "${slug}" not found`,
      );
    }

    const contact = this.contactRepository.create({
      specialistId: specialist.id,
      userId: userId || null,
      email: dto.email,
      phone: dto.phone || null,
      message: dto.message,
      preferredContactMethod: dto.preferredContactMethod || "email",
      status: "new",
    });

    const saved = await this.contactRepository.save(contact);

    this.logger.log(
      `Contact created: ${saved.id} for specialist ${specialist.id}`,
    );

    // TODO: Send email to specialist
    // TODO: Send confirmation email to sender
    // TODO: Send notification to support team

    return {
      id: saved.id,
      success: true,
      status: "success",
      message: "Your message has been sent to the specialist",
    };
  }

  /**
   * Get contacts for a specialist (admin)
   */
  async getSpecialistContacts(specialistId: string, userId: string) {
    const specialist = await this.agentProfileRepository.findOne({
      where: { id: specialistId },
    });

    if (!specialist) {
      throw new NotFoundException("Specialist not found");
    }

    // TODO: Add ownership check
    if (specialist.ownerId !== userId) {
      throw new Error("Unauthorized");
    }

    const contacts = await this.contactRepository.find({
      where: { specialistId },
      order: { createdAt: "DESC" },
    });

    return contacts;
  }

  /**
   * Mark contact as responded
   */
  async respondToContact(
    contactId: string,
    specialistId: string,
    response: string,
  ) {
    const contact = await this.contactRepository.findOne({
      where: { id: contactId },
    });

    if (!contact) {
      throw new NotFoundException("Contact not found");
    }

    if (contact.specialistId !== specialistId) {
      throw new Error("Unauthorized");
    }

    contact.status = "responded";
    contact.specialistResponse = response;
    contact.respondedAt = new Date();

    const updated = await this.contactRepository.save(contact);

    this.logger.log(`Contact ${contactId} marked as responded`);

    // TODO: Send response email to original contact

    return updated;
  }
}
