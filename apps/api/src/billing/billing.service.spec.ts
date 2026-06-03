import { Test, TestingModule } from "@nestjs/testing";
import { getRepositoryToken } from "@nestjs/typeorm";
import { ForbiddenException, NotFoundException } from "@nestjs/common";
import { BillingService } from "./billing.service";
import { BillingInvoice } from "./entities/billing-invoice.entity";
import { PaymentMethod } from "./entities/payment-method.entity";
import { Workspace } from "../workspaces/entities/workspace.entity";
import { WorkspaceMember } from "../workspace-members/entities/workspace-member.entity";
import { IntegrationConfigEntity } from "../integrations/entities/integration-config.entity";

const OWNER = "owner-1";
const ADMIN = "admin-2";
const ADVERTISER = "adv-3";
const OUTSIDER = "outsider-4";
const WORKSPACE_ID = "ws-1";

describe("BillingService", () => {
  let service: BillingService;
  let invoiceRepo: { find: jest.Mock; create: jest.Mock; save: jest.Mock };
  let paymentMethodRepo: {
    find: jest.Mock;
    findOne: jest.Mock;
    create: jest.Mock;
    save: jest.Mock;
    update: jest.Mock;
  };
  let workspaceRepo: { findOne: jest.Mock };
  let memberRepo: { findOne: jest.Mock };
  let integrationConfigRepo: {
    findOne: jest.Mock;
    create: jest.Mock;
    save: jest.Mock;
  };

  beforeEach(async () => {
    invoiceRepo = {
      find: jest.fn().mockResolvedValue([]),
      create: jest.fn((d: any) => d),
      save: jest.fn((d: any) => Promise.resolve({ id: "inv-1", ...d })),
    };
    paymentMethodRepo = {
      find: jest.fn().mockResolvedValue([]),
      findOne: jest.fn(),
      create: jest.fn((d: any) => d),
      save: jest.fn((d: any) => Promise.resolve({ id: "pm-1", ...d })),
      update: jest.fn().mockResolvedValue(undefined),
    };
    workspaceRepo = { findOne: jest.fn() };
    memberRepo = { findOne: jest.fn() };
    integrationConfigRepo = {
      findOne: jest.fn(),
      create: jest.fn((d: any) => d),
      save: jest.fn((d: any) => Promise.resolve(d)),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        BillingService,
        { provide: getRepositoryToken(BillingInvoice), useValue: invoiceRepo },
        {
          provide: getRepositoryToken(PaymentMethod),
          useValue: paymentMethodRepo,
        },
        { provide: getRepositoryToken(Workspace), useValue: workspaceRepo },
        {
          provide: getRepositoryToken(WorkspaceMember),
          useValue: memberRepo,
        },
        {
          provide: getRepositoryToken(IntegrationConfigEntity),
          useValue: integrationConfigRepo,
        },
      ],
    }).compile();

    service = module.get(BillingService);
  });

  const givenOwnerWorkspace = () =>
    workspaceRepo.findOne.mockResolvedValue({
      id: WORKSPACE_ID,
      userId: OWNER,
    });

  describe("listInvoices — ownership", () => {
    it("owner gets the workspace invoices DESC", async () => {
      givenOwnerWorkspace();
      invoiceRepo.find.mockResolvedValue([{ id: "inv-1" }]);
      const out = await service.listInvoices(WORKSPACE_ID, OWNER);
      expect(out).toHaveLength(1);
      expect(invoiceRepo.find).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { workspaceId: WORKSPACE_ID },
          order: { createdAt: "DESC" },
        }),
      );
    });

    it("any workspace member (even advertiser) can read", async () => {
      givenOwnerWorkspace();
      memberRepo.findOne.mockResolvedValue({
        workspaceId: WORKSPACE_ID,
        userId: ADVERTISER,
        role: "advertiser",
      });
      await expect(
        service.listInvoices(WORKSPACE_ID, ADVERTISER),
      ).resolves.toBeDefined();
    });

    it("outsider is Forbidden — invoices never queried", async () => {
      givenOwnerWorkspace();
      memberRepo.findOne.mockResolvedValue(null);
      await expect(
        service.listInvoices(WORKSPACE_ID, OUTSIDER),
      ).rejects.toBeInstanceOf(ForbiddenException);
      expect(invoiceRepo.find).not.toHaveBeenCalled();
    });

    it("404 when the workspace doesn't exist", async () => {
      workspaceRepo.findOne.mockResolvedValue(null);
      await expect(
        service.listInvoices(WORKSPACE_ID, OWNER),
      ).rejects.toBeInstanceOf(NotFoundException);
    });
  });

  describe("createInvoice — write gate", () => {
    it("owner can create; persisted as 'processed' with workspaceId", async () => {
      givenOwnerWorkspace();
      const out = await service.createInvoice(
        {
          workspaceId: WORKSPACE_ID,
          invoiceNo: "INV-001",
          amount: 100,
        } as any,
        OWNER,
      );
      expect(out.status).toBe("processed");
      expect(out.workspaceId).toBe(WORKSPACE_ID);
      expect(out.pdfUrl).toBeNull();
    });

    it("advertiser member cannot create an invoice (admin/owner only)", async () => {
      givenOwnerWorkspace();
      memberRepo.findOne.mockResolvedValue({
        workspaceId: WORKSPACE_ID,
        userId: ADVERTISER,
        role: "advertiser",
      });
      await expect(
        service.createInvoice(
          {
            workspaceId: WORKSPACE_ID,
            invoiceNo: "INV-001",
            amount: 100,
          } as any,
          ADVERTISER,
        ),
      ).rejects.toBeInstanceOf(ForbiddenException);
      expect(invoiceRepo.save).not.toHaveBeenCalled();
    });

    it("admin member can create an invoice", async () => {
      givenOwnerWorkspace();
      memberRepo.findOne.mockResolvedValue({
        workspaceId: WORKSPACE_ID,
        userId: ADMIN,
        role: "admin",
      });
      const out = await service.createInvoice(
        {
          workspaceId: WORKSPACE_ID,
          invoiceNo: "INV-002",
          amount: 50,
        } as any,
        ADMIN,
      );
      expect(out.status).toBe("processed");
    });
  });

  describe("addPaymentMethod — default-card invariant", () => {
    it("setting isDefault=true unsets the previous default first", async () => {
      givenOwnerWorkspace();
      await service.addPaymentMethod(
        {
          workspaceId: WORKSPACE_ID,
          brand: "visa",
          last4: "4242",
          isDefault: true,
        } as any,
        OWNER,
      );
      // Verifies the bulk-update to clear the old default ran BEFORE save.
      expect(paymentMethodRepo.update).toHaveBeenCalledWith(
        { workspaceId: WORKSPACE_ID, isDefault: true },
        { isDefault: false },
      );
      const saved = paymentMethodRepo.save.mock.calls.at(-1)?.[0];
      expect(saved.isDefault).toBe(true);
      expect(saved.brand).toBe("visa");
      expect(saved.last4).toBe("4242");
    });

    it("non-default add skips the bulk clear", async () => {
      givenOwnerWorkspace();
      await service.addPaymentMethod(
        {
          workspaceId: WORKSPACE_ID,
          brand: "mastercard",
          last4: "1111",
          isDefault: false,
        } as any,
        OWNER,
      );
      expect(paymentMethodRepo.update).not.toHaveBeenCalled();
    });

    it("outsider cannot add a payment method", async () => {
      givenOwnerWorkspace();
      memberRepo.findOne.mockResolvedValue(null);
      await expect(
        service.addPaymentMethod(
          {
            workspaceId: WORKSPACE_ID,
            brand: "visa",
            last4: "0000",
          } as any,
          OUTSIDER,
        ),
      ).rejects.toBeInstanceOf(ForbiddenException);
    });
  });

  describe("setDefaultPaymentMethod", () => {
    it("404 when the method isn't on this workspace", async () => {
      givenOwnerWorkspace();
      paymentMethodRepo.findOne.mockResolvedValue(null);
      await expect(
        service.setDefaultPaymentMethod(WORKSPACE_ID, "ghost", OWNER),
      ).rejects.toBeInstanceOf(NotFoundException);
    });

    it("clears all other defaults on the workspace before flipping the target", async () => {
      givenOwnerWorkspace();
      paymentMethodRepo.findOne.mockResolvedValue({
        id: "pm-1",
        workspaceId: WORKSPACE_ID,
        isDefault: false,
      });
      paymentMethodRepo.save.mockImplementation((d: any) => Promise.resolve(d));
      const out = await service.setDefaultPaymentMethod(
        WORKSPACE_ID,
        "pm-1",
        OWNER,
      );
      expect(paymentMethodRepo.update).toHaveBeenCalledWith(
        { workspaceId: WORKSPACE_ID, isDefault: true },
        { isDefault: false },
      );
      expect(out.isDefault).toBe(true);
    });
  });

  describe("getBillingContact / updateBillingContact", () => {
    it("getBillingContact returns {} when no integration row exists yet", async () => {
      givenOwnerWorkspace();
      integrationConfigRepo.findOne.mockResolvedValue(null);
      integrationConfigRepo.save.mockImplementation((d: any) =>
        Promise.resolve({ id: "cfg-1", ...d }),
      );
      const out = await service.getBillingContact(WORKSPACE_ID, OWNER);
      expect(out).toEqual({});
    });

    it("updateBillingContact patches existing contact (preserves untouched keys)", async () => {
      givenOwnerWorkspace();
      integrationConfigRepo.findOne.mockResolvedValue({
        id: "cfg-1",
        connectionId: `billing:${WORKSPACE_ID}`,
        customFields: {
          contact: {
            companyName: "Old Co",
            country: "UZ",
          },
        },
      });
      const out = await service.updateBillingContact(WORKSPACE_ID, OWNER, {
        companyName: "New Co",
        taxId: "12345",
      } as any);
      // companyName replaced, taxId added, country preserved.
      expect(out.companyName).toBe("New Co");
      expect(out.taxId).toBe("12345");
      expect(out.country).toBe("UZ");
    });

    it("advertiser cannot update billing contact (write gate)", async () => {
      givenOwnerWorkspace();
      memberRepo.findOne.mockResolvedValue({
        workspaceId: WORKSPACE_ID,
        userId: ADVERTISER,
        role: "advertiser",
      });
      await expect(
        service.updateBillingContact(WORKSPACE_ID, ADVERTISER, {} as any),
      ).rejects.toBeInstanceOf(ForbiddenException);
      expect(integrationConfigRepo.save).not.toHaveBeenCalled();
    });
  });
});
