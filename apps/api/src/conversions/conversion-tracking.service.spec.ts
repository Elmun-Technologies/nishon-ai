import { Test, TestingModule } from "@nestjs/testing";
import { getRepositoryToken } from "@nestjs/typeorm";
import { BadRequestException } from "@nestjs/common";
import { ConversionTrackingService } from "./conversion-tracking.service";
import {
  ConversionEvent,
  ConversionEventType,
  ConversionSource,
} from "./entities/conversion-event.entity";

describe("ConversionTrackingService", () => {
  let service: ConversionTrackingService;
  let repo: {
    find: jest.Mock;
    findAndCount: jest.Mock;
    create: jest.Mock;
    save: jest.Mock;
    delete: jest.Mock;
  };

  beforeEach(async () => {
    repo = {
      find: jest.fn().mockResolvedValue([]),
      findAndCount: jest.fn().mockResolvedValue([[], 0]),
      create: jest.fn((d: any) => d),
      save: jest.fn((d: any) => Promise.resolve({ id: "ev-1", ...d })),
      delete: jest.fn().mockResolvedValue({ affected: 0 }),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ConversionTrackingService,
        { provide: getRepositoryToken(ConversionEvent), useValue: repo },
      ],
    }).compile();

    service = module.get(ConversionTrackingService);
  });

  describe("ingestConversionEvent — input validation & defaults", () => {
    it("rejects missing workspaceId", async () => {
      await expect(
        service.ingestConversionEvent("", {
          campaignId: "c-1",
          eventType: ConversionEventType.PURCHASE,
          source: ConversionSource.PIXEL,
          timestamp: new Date(),
        }),
      ).rejects.toBeInstanceOf(BadRequestException);
      expect(repo.save).not.toHaveBeenCalled();
    });

    it("rejects missing campaignId", async () => {
      await expect(
        service.ingestConversionEvent("ws-1", {
          campaignId: "",
          eventType: ConversionEventType.PURCHASE,
          source: ConversionSource.PIXEL,
          timestamp: new Date(),
        } as any),
      ).rejects.toBeInstanceOf(BadRequestException);
    });

    it("defaults currency to USD when omitted", async () => {
      await service.ingestConversionEvent("ws-1", {
        campaignId: "c-1",
        eventType: ConversionEventType.PURCHASE,
        source: ConversionSource.CAPI,
        timestamp: new Date("2026-06-01"),
      });
      const saved = repo.save.mock.calls.at(-1)?.[0];
      expect(saved.currency).toBe("USD");
      expect(saved.value).toBeNull();
      expect(saved.userId).toBeNull();
      expect(saved.metadata).toBeNull();
    });

    it("coerces the timestamp into a Date — accepts ISO strings", async () => {
      await service.ingestConversionEvent("ws-1", {
        campaignId: "c-1",
        eventType: ConversionEventType.LEAD,
        source: ConversionSource.MANUAL,
        timestamp: "2026-06-01T12:00:00Z" as any,
      });
      const saved = repo.save.mock.calls.at(-1)?.[0];
      expect(saved.timestamp).toBeInstanceOf(Date);
    });
  });

  describe("getConversionMetrics", () => {
    it("rejects missing IDs", async () => {
      await expect(
        service.getConversionMetrics("", "c-1", new Date(), new Date()),
      ).rejects.toBeInstanceOf(BadRequestException);
    });

    it("returns zeros + empty buckets when there are no events", async () => {
      repo.find.mockResolvedValue([]);
      const out = await service.getConversionMetrics(
        "ws-1",
        "c-1",
        new Date("2026-06-01"),
        new Date("2026-06-30"),
      );
      expect(out.totalConversions).toBe(0);
      expect(out.totalValue).toBe(0);
      expect(out.avgValue).toBe(0);
      expect(out.conversionsByType).toEqual({});
      expect(out.valueByType).toEqual({});
      expect(out.costPerConversion).toBeUndefined();
      expect(out.conversionRate).toBeUndefined();
    });

    it("aggregates by event type, computing avg + per-type totals", async () => {
      repo.find.mockResolvedValue([
        { eventType: ConversionEventType.PURCHASE, value: 100 },
        { eventType: ConversionEventType.PURCHASE, value: 50 },
        { eventType: ConversionEventType.LEAD, value: null },
      ]);
      const out = await service.getConversionMetrics(
        "ws-1",
        "c-1",
        new Date(),
        new Date(),
      );
      expect(out.totalConversions).toBe(3);
      expect(out.totalValue).toBe(150);
      expect(out.avgValue).toBe(50);
      expect(out.conversionsByType.Purchase).toBe(2);
      expect(out.conversionsByType.Lead).toBe(1);
      expect(out.valueByType.Purchase).toBe(150);
      expect(out.valueByType.Lead).toBe(0); // null counted as 0
    });

    it("derives costPerConversion when spend > 0 AND conversions > 0", async () => {
      repo.find.mockResolvedValue([
        { eventType: ConversionEventType.PURCHASE, value: 100 },
        { eventType: ConversionEventType.PURCHASE, value: 50 },
      ]);
      const out = await service.getConversionMetrics(
        "ws-1",
        "c-1",
        new Date(),
        new Date(),
        200, // spend
      );
      expect(out.costPerConversion).toBe(100); // 200 / 2
    });

    it("does NOT derive costPerConversion when conversions=0 (avoids divide-by-zero)", async () => {
      repo.find.mockResolvedValue([]);
      const out = await service.getConversionMetrics(
        "ws-1",
        "c-1",
        new Date(),
        new Date(),
        200,
      );
      expect(out.costPerConversion).toBeUndefined();
    });

    it("conversionRate is a percentage (conversions / impressions * 100)", async () => {
      repo.find.mockResolvedValue([
        { eventType: ConversionEventType.PURCHASE, value: 0 },
      ]);
      const out = await service.getConversionMetrics(
        "ws-1",
        "c-1",
        new Date(),
        new Date(),
        undefined,
        100, // impressions
      );
      expect(out.conversionRate).toBe(1); // 1/100*100 = 1%
    });
  });

  describe("getConversionEvents", () => {
    it("requires both IDs", async () => {
      await expect(
        service.getConversionEvents("", "c-1", new Date(), new Date()),
      ).rejects.toBeInstanceOf(BadRequestException);
    });

    it("returns events + total from findAndCount with the default limit/offset", async () => {
      repo.findAndCount.mockResolvedValue([[{ id: "ev-1" }], 1]);
      const out = await service.getConversionEvents(
        "ws-1",
        "c-1",
        new Date("2026-06-01"),
        new Date("2026-06-30"),
      );
      expect(out.events).toHaveLength(1);
      expect(out.total).toBe(1);
      const args = repo.findAndCount.mock.calls.at(-1)?.[0];
      expect(args.order).toEqual({ timestamp: "DESC" });
      expect(args.take).toBe(100);
      expect(args.skip).toBe(0);
    });

    it("honors custom limit + offset", async () => {
      repo.findAndCount.mockResolvedValue([[], 0]);
      await service.getConversionEvents(
        "ws-1",
        "c-1",
        new Date(),
        new Date(),
        25,
        50,
      );
      const args = repo.findAndCount.mock.calls.at(-1)?.[0];
      expect(args.take).toBe(25);
      expect(args.skip).toBe(50);
    });
  });

  describe("deleteOldEvents", () => {
    it("calls delete with the LessThanOrEqual filter and returns affected count", async () => {
      repo.delete.mockResolvedValue({ affected: 42 });
      const out = await service.deleteOldEvents("ws-1", new Date("2026-01-01"));
      expect(out).toBe(42);
      // affected=null safety: undefined still returns 0
    });

    it("returns 0 when affected is null", async () => {
      repo.delete.mockResolvedValue({ affected: null });
      const out = await service.deleteOldEvents("ws-1", new Date());
      expect(out).toBe(0);
    });
  });

  describe("getConversionTrend — daily backfill", () => {
    it("returns one entry per day with conversions=0 when there is no data", async () => {
      repo.find.mockResolvedValue([]);
      const trend = await service.getConversionTrend("ws-1", "c-1", 7);
      expect(trend).toHaveLength(7);
      expect(trend.every((d) => d.conversions === 0)).toBe(true);
      expect(trend.every((d) => d.value === 0)).toBe(true);
    });

    it("buckets two events from the same day into a single trend entry", async () => {
      // Place events 3 days ago — comfortably inside the 7-day trend window
      // (which spans today-7..today-1, since the backfill loop's last entry
      // is startDate + days-1 = today-1).
      const threeDaysAgo = new Date();
      threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);
      threeDaysAgo.setUTCHours(10, 0, 0, 0);
      const sameDayLater = new Date(threeDaysAgo);
      sameDayLater.setUTCHours(15, 0, 0, 0);

      repo.find.mockResolvedValue([
        { timestamp: threeDaysAgo, value: 100 },
        { timestamp: sameDayLater, value: 50 },
      ]);

      const trend = await service.getConversionTrend("ws-1", "c-1", 7);
      const bucketKey = threeDaysAgo.toISOString().split("T")[0];
      const bucket = trend.find((t) => t.date === bucketKey);
      expect(bucket).toBeDefined();
      expect(bucket!.conversions).toBe(2);
      expect(bucket!.value).toBe(150);
      // And the other 6 buckets are empty.
      const empties = trend.filter((t) => t.date !== bucketKey);
      expect(empties.every((d) => d.conversions === 0 && d.value === 0)).toBe(
        true,
      );
    });
  });
});
