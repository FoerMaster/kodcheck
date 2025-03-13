import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { scanDataSchema } from "@shared/schema";
import { z } from "zod";
import { ZodError } from "zod";
import { fromZodError } from "zod-validation-error";

export async function registerRoutes(app: Express): Promise<Server> {
  // API Routes - all prefixed with /api
  
  // Get a specific report by ID
  app.get("/api/reports/:reportId", async (req: Request, res: Response) => {
    try {
      const { reportId } = req.params;
      const report = await storage.getReport(reportId);
      
      if (!report) {
        return res.status(404).json({ message: "Report not found" });
      }
      
      return res.json(report);
    } catch (error) {
      console.error("Error fetching report:", error);
      return res.status(500).json({ message: "Failed to fetch report" });
    }
  });
  
  // List recent reports
  app.get("/api/reports", async (req: Request, res: Response) => {
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
  app.post("/api/analyze", async (req: Request, res: Response) => {
    try {
      // Validate the incoming scan data against our schema
      const scanData = scanDataSchema.parse(req.body);
      
      // Create the report
      const report = await storage.createReport(scanData);
      
      return res.status(201).json({
        message: "Report created successfully",
        reportId: report.reportId,
        url: `/report/${report.reportId}`
      });
    } catch (error) {
      console.error("Error creating report:", error);
      
      if (error instanceof ZodError) {
        const validationError = fromZodError(error);
        return res.status(400).json({ 
          message: "Invalid scan data", 
          details: validationError.message 
        });
      }
      
      return res.status(500).json({ message: "Failed to create report" });
    }
  });
  
  // Generate the console command for server owners
  app.get("/api/console-command", (req: Request, res: Response) => {
    try {
      const serverIp = req.query.serverIp || "your-server-ip";
      const baseUrl = process.env.BASE_URL || req.get("host") || "localhost:5000";
      const protocol = req.secure ? "https" : "http";
      
      const commandUrl = `${protocol}://${baseUrl}/api/scanner-code?server=${serverIp}`;
      
      const consoleCommand = `lua_run http.Fetch("${commandUrl}", function(body) RunString(body) end)`;
      
      return res.json({ command: consoleCommand });
    } catch (error) {
      console.error("Error generating command:", error);
      return res.status(500).json({ message: "Failed to generate console command" });
    }
  });
  
  // Endpoint that returns the Lua code to be executed on the server
  app.get("/api/scanner-code", (req: Request, res: Response) => {
    try {
      const serverIp = req.query.server as string || "unknown";
      const baseUrl = process.env.BASE_URL || req.get("host") || "localhost:5000";
      const protocol = req.secure ? "https" : "http";
      
      // This would be the Lua code that collects information about the server
      // In a real implementation, this would be a complex Lua script that analyzes the server
      const luaCode = `
local scannerVersion = "1.0.0"
local serverIp = "${serverIp}"
local baseUrl = "${protocol}://${baseUrl}"

-- Simple example of what the scanner would do
-- In a real implementation, this would use BadCoderz-like analysis
local function scanServer()
  print("[CodeScan] Starting server code analysis...")
  
  -- Collect server information
  local gmodVersion = GAMEMODE and GAMEMODE.Version or "unknown"
  
  -- Initialize results
  local issues = {}
  local exploits = {}
  local files = {}
  local addons = {}
  
  -- Example scan logic (this would be much more complex in reality)
  -- Scan for bad code patterns in hooks
  for hookName, hookTable in pairs(hook.GetTable()) do
    for addonName, hookFunc in pairs(hookTable) do
      local info = debug.getinfo(hookFunc)
      if info and info.short_src then
        -- Example check: Material.GetTexture in render hooks
        if hookName == "HUDPaint" and string.find(info.short_src, "bf4_hud") then
          table.insert(issues, {
            id = "issue_" .. #issues + 1,
            title = "Material.GetTexture() called in render hook",
            description = "Reading textures during rendering causes severe performance issues",
            severity = "critical",
            occurrences = 28,
            filePath = info.short_src,
            lineNumber = info.linedefined,
            code = "local health_icon = Material.GetTexture(\\\"materials/bf4_hud/health.png\\\")",
            recommendation = "Cache materials outside of rendering hooks"
          })
        end
        
        -- Track files
        if not table.HasValue(files, info.short_src) then
          table.insert(files, {
            path = info.short_src,
            addon = string.match(info.short_src, "addons/([^/]+)") or "unknown",
            type = "lua",
            size = 1024, -- Mock size
            issues = 1
          })
        end
      end
    end
  end
  
  -- Example: Check for potential RunString exploits
  for k, v in pairs(_G) do
    if type(v) == "function" and string.find(k, "RunString") then
      local refs = debug.getreferences(v)
      if refs then
        for _, ref in ipairs(refs) do
          if string.find(ref.source, "net.Receive") then
            table.insert(exploits, {
              id = "exploit_" .. #exploits + 1,
              title = "Unfiltered RunString in net message",
              description = "Code found that executes arbitrary strings received over the network without validation",
              severity = "critical",
              filePath = ref.source,
              lineNumber = ref.line,
              code = "net.Receive(\\\"SyncConfig\\\", function(len, ply)\\n  local configStr = net.ReadString()\\n  RunString(configStr, \\\"ConfigSync\\\")\\nend)",
              recommendation = "Remove immediately or implement strict validation"
            })
          end
        end
      end
    end
  end
  
  -- Build addon list
  local addonsTable = {}
  for _, file in ipairs(files) do
    local addon = file.addon
    if not addonsTable[addon] then
      addonsTable[addon] = { name = addon, files = 0, issues = 0 }
    end
    addonsTable[addon].files = addonsTable[addon].files + 1
    addonsTable[addon].issues = addonsTable[addon].issues + 1
  end
  
  for _, addon in pairs(addonsTable) do
    table.insert(addons, addon)
  end
  
  -- Send results to our web service
  local json = util.TableToJSON({
    serverIp = serverIp,
    gmodVersion = gmodVersion,
    issues = issues,
    exploits = exploits,
    files = files,
    addons = addons
  })
  
  http.Post(baseUrl .. "/api/analyze", json, function(body, size, headers, code)
    if code == 201 then
      local response = util.JSONToTable(body)
      if response and response.url then
        print("[CodeScan] Analysis complete! View your report at: " .. baseUrl .. response.url)
      else
        print("[CodeScan] Analysis complete! Report created successfully.")
      end
    else
      print("[CodeScan] Error submitting results: " .. code)
    end
  end, function(err)
    print("[CodeScan] Failed to submit results: " .. err)
  end, { ["Content-Type"] = "application/json" })
end

-- Run the scanner
scanServer()
      `;
      
      res.set('Content-Type', 'text/plain');
      return res.send(luaCode);
    } catch (error) {
      console.error("Error generating scanner code:", error);
      return res.status(500).json({ message: "Failed to generate scanner code" });
    }
  });

  const httpServer = createServer(app);

  return httpServer;
}
