import { 
  users, 
  reports, 
  type User, 
  type InsertUser, 
  type Report, 
  type InsertReport,
  type ScanData
} from "@shared/schema";
import { nanoid } from "nanoid";

export interface IStorage {
  // User operations
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  // Report operations
  getReport(reportId: string): Promise<Report | undefined>;
  createReport(scanData: ScanData): Promise<Report>;
  listReports(limit?: number): Promise<Report[]>;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private reports: Map<string, Report>;
  currentUserId: number;

  constructor() {
    this.users = new Map();
    this.reports = new Map();
    this.currentUserId = 1;
  }

  // User operations
  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.currentUserId++;
    const user: User = { ...insertUser, id };
    this.users.set(id, user);
    return user;
  }

  // Report operations
  async getReport(reportId: string): Promise<Report | undefined> {
    return this.reports.get(reportId);
  }

  async createReport(scanData: ScanData): Promise<Report> {
    // Generate a unique report ID for URL
    const reportId = nanoid(10);
    
    // Count issues by category for the chart
    const issuesByCategory = {
      performance: 0,
      memory: 0,
      security: 0,
      networking: 0,
      hooks: 0,
      rendering: 0
    };

    // Count critical and performance issues
    let criticalCount = 0;
    let performanceCount = 0;
    
    scanData.issues.forEach(issue => {
      if (issue.severity === "critical") {
        criticalCount++;
      } else if (issue.severity === "performance") {
        performanceCount++;
      }
      
      // Categorize issues for the chart
      // This is a simple mapping - in a real app we'd have more sophisticated categorization
      if (issue.title.toLowerCase().includes("performance")) {
        issuesByCategory.performance++;
      } else if (issue.title.toLowerCase().includes("memory")) {
        issuesByCategory.memory++;
      } else if (issue.title.toLowerCase().includes("hook")) {
        issuesByCategory.hooks++;
      } else if (issue.title.toLowerCase().includes("net") || issue.title.toLowerCase().includes("http")) {
        issuesByCategory.networking++;
      } else if (issue.title.toLowerCase().includes("render") || issue.title.toLowerCase().includes("draw")) {
        issuesByCategory.rendering++;
      }
    });
    
    // Count security issues from exploits
    scanData.exploits.forEach(exploit => {
      if (exploit.severity === "critical") {
        criticalCount++;
      }
      issuesByCategory.security++;
    });
    
    // Create the report
    const report: Report = {
      id: this.reports.size + 1,
      reportId,
      serverIp: scanData.serverIp,
      gmodVersion: scanData.gmodVersion,
      scanDate: new Date(),
      critical: criticalCount,
      performance: performanceCount,
      scannedFiles: scanData.files.length,
      addonsAnalyzed: scanData.addons.length,
      issuesByCategory,
      badCodeIssues: scanData.issues,
      potentialExploits: scanData.exploits,
      scannedFilesList: scanData.files,
      addonsList: scanData.addons
    };
    
    this.reports.set(reportId, report);
    return report;
  }

  async listReports(limit: number = 10): Promise<Report[]> {
    return Array.from(this.reports.values())
      .sort((a, b) => b.scanDate.getTime() - a.scanDate.getTime())
      .slice(0, limit);
  }
}

export const storage = new MemStorage();
