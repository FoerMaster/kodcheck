import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { scanDataSchema } from "@shared/schema";
import { z } from "zod";
import { ZodError } from "zod";
import { fromZodError } from "zod-validation-error";
import { nanoid } from "nanoid";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { WebSocketServer } from "ws";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Track active scans and their data
const activeScans = new Map<string, {
  ws: WebSocket | null;
  timeout: NodeJS.Timeout | null;
  issues: any[];
  isComplete: boolean;
}>();

// Force HTTPS for all requests
const enforceHttps = (req: Express.Request, res: Express.Response, next: Express.NextFunction) => {
  if (process.env.NODE_ENV === 'production' && !req.secure) {
    return res.redirect(`https://${req.headers.host}${req.url}`);
  }
  next();
};

export async function registerRoutes(app: Express): Promise<Server> {
  const httpServer = createServer(app);

  // Use HTTPS middleware
  //app.use(enforceHttps);

  // Setup WebSocket server with secure configuration
  const wss = new WebSocketServer({ 
    server: httpServer,
    path: "/ws",
    clientTracking: true
  });

  wss.on("connection", (ws) => {
    ws.on("message", (data) => {
      try {
        const message = JSON.parse(data.toString());
        if (message.type === "scan_id") {
          const scanId = message.scanId;

          // Store the connection
          activeScans.set(scanId, {
            ws,
            timeout: setTimeout(() => {
              ws.close();
              activeScans.delete(scanId);
            }, 5 * 60 * 1000), // 5 minute timeout
            issues: [],
            isComplete: false
          });
        }
      } catch (error) {
        console.error("WebSocket message error:", error);
      }
    });

    ws.on("close", () => {
      // Clean up any associated scan
      for (const [scanId, scan] of activeScans.entries()) {
        if (scan.ws === ws) {
          clearTimeout(scan.timeout!);
          activeScans.delete(scanId);
          break;
        }
      }
    });
  });

  // Get a specific report by ID
  app.get("/api/reports/:reportId", async (req, res) => {
    try {
      const { reportId } = req.params;
      const report = await storage.getReport(reportId);

      if (!report) {
        return res.status(404).json({ message: "Report not found" });
      }

      return res.json(report.data);
    } catch (error) {
      console.error("Error fetching report:", error);
      return res.status(500).json({ message: "Failed to fetch report" });
    }
  });

  // List recent reports
  app.get("/api/reports", async (req, res) => {
    try {
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 10;
      const reports = await storage.listReports(limit);
      return res.json(reports);
    } catch (error) {
      console.error("Error listing reports:", error);
      return res.status(500).json({ message: "Failed to list reports" });
    }
  });

  // Create a new report from scan data
  app.post("/api/analyze", async (req, res) => {
    try {
      // Handle both JSON and form data
      const formData = req.body;
      let parsedData;

      // Check if the data is already JSON (from Garry's Mod Lua HTTP)
      if (typeof formData === "object" && formData.serverIp) {
        parsedData = {
          serverIp: formData.serverIp,
          gmodVersion: formData.gmodVersion,
          issues: Array.isArray(formData.issues)
            ? formData.issues
            : typeof formData.issues === "string"
              ? JSON.parse(formData.issues)
              : [],
          exploits: Array.isArray(formData.exploits)
            ? formData.exploits
            : typeof formData.exploits === "string"
              ? JSON.parse(formData.exploits)
              : [],
          files: Array.isArray(formData.files)
            ? formData.files
            : typeof formData.files === "string"
              ? JSON.parse(formData.files)
              : [],
          addons: Array.isArray(formData.addons)
            ? formData.addons
            : typeof formData.addons === "string"
              ? JSON.parse(formData.addons)
              : [],
        };
      } else {
        // Parse nested JSON fields from form data
        parsedData = {
          serverIp: formData.serverIp,
          gmodVersion: formData.gmodVersion,
          issues: JSON.parse(formData.issues || "[]"),
          exploits: JSON.parse(formData.exploits || "[]"),
          files: JSON.parse(formData.files || "[]"),
          addons: JSON.parse(formData.addons || "[]"),
        };
      }

      // Validate the incoming scan data against our schema
      const scanData = scanDataSchema.parse(parsedData);

      // Create the report
      const report = await storage.createReport(scanData);

      // Notify the waiting WebSocket client if exists
      const scanId = req.query.scan as string;
      const activeScan = activeScans.get(scanId);
      if (activeScan) {
        const { ws, timeout } = activeScan;
        clearTimeout(timeout!);
        ws!.send(JSON.stringify({
          type: "scan_complete",
          reportId: report.reportId
        }));
        activeScans.delete(scanId);
      }

      return res.status(201).json({
        message: "Report created successfully",
        reportId: report.reportId,
        url: `/report/${report.reportId}`,
      });
    } catch (error) {
      console.error("Error creating report:", error);

      if (error instanceof ZodError) {
        const validationError = fromZodError(error);
        return res.status(400).json({
          message: "Invalid scan data",
          details: validationError.message,
        });
      }

      return res.status(500).json({ message: "Failed to create report" });
    }
  });

  // Receive chunks of issues
  app.post("/api/analyze/issues", async (req, res) => {
    try {
      const { scanId, totalChunks, currentChunk, data } = req.body;
      const issues = JSON.parse(data);

      if (!activeScans.has(scanId)) {
        activeScans.set(scanId, {
          ws: null,
          timeout: null,
          issues: [],
          isComplete: false
        });
      }

      const scanData = activeScans.get(scanId);
      scanData!.issues.push(...issues);

      console.log(`Received chunk ${currentChunk}/${totalChunks} for scan ${scanId}`);

      return res.status(200).json({ message: "Chunk received" });
    } catch (error) {
      console.error("Error processing issues chunk:", error);
      return res.status(500).json({ message: "Failed to process issues chunk" });
    }
  });

  // Complete the analysis and create report
  app.post("/api/analyze/complete", async (req, res) => {
    try {
      const { scanId, serverIp, gmodVersion } = req.body;
      const scanData = activeScans.get(scanId);

      if (!scanData) {
        return res.status(404).json({ message: "Scan not found" });
      }

      const reportData = {
        serverIp,
        gmodVersion,
        issues: scanData.issues,
        files: [],
        addons: [],
        exploits: []
      };

      // Create the report
      const report = await storage.createReport(reportData);

      // Notify WebSocket client if connected
      if (scanData.ws) {
        scanData.ws.send(JSON.stringify({
          type: "scan_complete",
          reportId: report.reportId
        }));
      }

      // Cleanup
      if (scanData.timeout) {
        clearTimeout(scanData.timeout!);
      }
      activeScans.delete(scanId);

      return res.status(201).json({
        message: "Report created successfully",
        reportId: report.reportId,
        url: `/report/${report.reportId}`
      });
    } catch (error) {
      console.error("Error completing analysis:", error);
      return res.status(500).json({ message: "Failed to complete analysis" });
    }
  });

  // Generate the console command for server owners
  app.get("/api/console-command", (req, res) => {
    try {
      const scanId = nanoid();
      const baseUrl = process.env.BASE_URL || req.get("host") || "localhost:5000";
      const protocol = "https"; // Always use HTTPS

      const commandUrl = `${protocol}://${baseUrl}/api/scanner-code?scan=${scanId}`;
      const consoleCommand = `lua_run http.Fetch("${commandUrl}", function(body) RunString(body) end)`;

      return res.json({ 
        command: consoleCommand,
        scanId: scanId
      });
    } catch (error) {
      console.error("Error generating command:", error);
      return res.status(500).json({ message: "Failed to generate console command" });
    }
  });

  // Endpoint that returns the Lua code to be executed on the server
  app.get("/api/scanner-code", (req, res) => {
    try {
      const scanId = (req.query.scan as string) || nanoid();
      const baseUrl = process.env.BASE_URL || req.get("host") || "localhost:5000";

      // Read the scanner code template
      const scannerCode = fs.readFileSync(
        path.join(__dirname, "scanner-code.lua"),
        "utf8"
      );

      // Replace placeholders with actual values
      const luaCode = scannerCode
        .replace(/\${baseUrl}/g, baseUrl)
        .replace(/\${scanId}/g, scanId);

      res.set("Content-Type", "text/plain");
      return res.send(luaCode);
    } catch (error) {
      console.error("Error generating scanner code:", error);
      return res.status(500).json({ message: "Failed to generate scanner code" });
    }
  });

  return httpServer;
}
