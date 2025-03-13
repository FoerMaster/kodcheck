import { nanoid } from "nanoid";
import type { Report, InsertReport, ScanData } from "@shared/schema";

export interface IStorage {
  createReport(data: ScanData): Promise<Report>;
  getReport(reportId: string): Promise<Report | undefined>;
  listReports(limit: number): Promise<Report[]>;
}

export class MemStorage implements IStorage {
  private reports: Map<string, Report>;

  constructor() {
    this.reports = new Map();
  }

  async createReport(data: ScanData): Promise<Report> {
    const reportId = nanoid();
    const report: Report = {
      reportId,
      createdAt: new Date(),
      data,
    };
    this.reports.set(reportId, report);
    return report;
  }

  async getReport(reportId: string): Promise<Report | undefined> {
    return this.reports.get(reportId);
  }

  async listReports(limit: number): Promise<Report[]> {
    return Array.from(this.reports.values())
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
      .slice(0, limit);
  }
}

export const storage = new MemStorage();
