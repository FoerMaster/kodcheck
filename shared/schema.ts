import { pgTable, text, serial, integer, jsonb, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const scanDataSchema = z.object({
  serverIp: z.string(),
  gmodVersion: z.string(),
  issues: z.array(z.object({
    id: z.string(),
    title: z.string(),
    description: z.string(),
    severity: z.enum(["critical", "performance", "warning"]),
    occurrences: z.number(),
    filePath: z.string(),
    lineNumber: z.number(),
    code: z.string(),
    recommendation: z.string()
  })),
  exploits: z.array(z.object({
    name: z.string(),
    description: z.string(),
    severity: z.enum(["critical", "high", "medium", "low"]),
    path: z.string()
  })),
  files: z.array(z.object({
    path: z.string(),
    addon: z.string(),
    type: z.string(),
    size: z.number(),
    issues: z.number()
  })),
  addons: z.array(z.object({
    name: z.string(),
    files: z.number(),
    issues: z.number()
  }))
});

export type ScanData = z.infer<typeof scanDataSchema>;

export const reports = pgTable("reports", {
  reportId: text("report_id").primaryKey(),
  createdAt: timestamp("created_at").defaultNow(),
  data: jsonb("data").$type<ScanData>().notNull()
});

export type Report = typeof reports.$inferSelect;
export type InsertReport = typeof reports.$inferInsert;
