import { pgTable, text, serial, integer, boolean, timestamp, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// User model from the template - keeping it as it might be useful for authentication later
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});

// Report model for storing scan results
export const reports = pgTable("reports", {
  id: serial("id").primaryKey(),
  reportId: text("report_id").notNull().unique(), // Unique URL-friendly ID for accessing the report
  serverIp: text("server_ip").notNull(),
  gmodVersion: text("gmod_version"),
  scanDate: timestamp("scan_date").notNull().defaultNow(),
  critical: integer("critical").notNull().default(0),
  performance: integer("performance").notNull().default(0),
  scannedFiles: integer("scanned_files").notNull().default(0),
  addonsAnalyzed: integer("addons_analyzed").notNull().default(0),
  issuesByCategory: jsonb("issues_by_category"), // Stores the count for each category for charts
  badCodeIssues: jsonb("bad_code_issues"), // Detailed issues found
  potentialExploits: jsonb("potential_exploits"), // Security vulnerabilities
  scannedFilesList: jsonb("scanned_files_list"), // List of files scanned
  addonsList: jsonb("addons_list"), // List of addons analyzed
});

export const insertReportSchema = createInsertSchema(reports).omit({
  id: true,
  scanDate: true,
});

// Type for issue entries
export const issueSchema = z.object({
  id: z.string(),
  title: z.string(),
  description: z.string(),
  severity: z.enum(["critical", "performance", "warning", "info"]),
  occurrences: z.number(),
  filePath: z.string(),
  lineNumber: z.number(),
  code: z.string(),
  recommendation: z.string(),
  documentationUrl: z.string().optional(),
});

// Type for exploit entries
export const exploitSchema = z.object({
  id: z.string(),
  title: z.string(),
  description: z.string(), 
  severity: z.enum(["critical", "warning"]),
  filePath: z.string(),
  lineNumber: z.number(),
  code: z.string(),
  recommendation: z.string(),
});

// Type for file entries
export const fileSchema = z.object({
  path: z.string(),
  addon: z.string(),
  type: z.string(),
  size: z.number(),
  issues: z.number(),
});

// Type for addon entries
export const addonSchema = z.object({
  name: z.string(),
  files: z.number(),
  issues: z.number(),
});

// Type for performance profile entries
export const profileEntrySchema = z.object({
  func: z.string(),
  name: z.string().optional(),
  source: z.string(),
  total_called: z.number(),
  total_time: z.number(),
  average_time: z.number(),
  line_defined: z.number(),
  line_last: z.number().optional(),
  is_c_func: z.boolean().optional(),
});

// Type for performance data
export const performanceDataSchema = z.object({
  most_time: z.array(profileEntrySchema),
  most_called: z.array(profileEntrySchema),
  most_avg_time: z.array(profileEntrySchema),
  scan_duration: z.number(),
  timestamp: z.string()
});

// Schema for the scan data coming from a GMod server
export const scanDataSchema = z.object({
  serverIp: z.string(),
  gmodVersion: z.string(),
  issues: z.array(issueSchema),
  exploits: z.array(exploitSchema),
  files: z.array(fileSchema),
  addons: z.array(addonSchema),
  performance: performanceDataSchema.optional(),
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
export type Report = typeof reports.$inferSelect;
export type InsertReport = z.infer<typeof insertReportSchema>;
export type ScanData = z.infer<typeof scanDataSchema>;
export type Issue = z.infer<typeof issueSchema>;
export type Exploit = z.infer<typeof exploitSchema>;
export type ScannedFile = z.infer<typeof fileSchema>;
export type Addon = z.infer<typeof addonSchema>;
