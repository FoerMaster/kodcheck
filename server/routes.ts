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
      // Parse nested JSON fields from form data
      const formData = req.body;
      const parsedData = {
        serverIp: formData.serverIp,
        gmodVersion: formData.gmodVersion,
        issues: JSON.parse(formData.issues || "[]"),
        exploits: JSON.parse(formData.exploits || "[]"),
        files: JSON.parse(formData.files || "[]"),
        addons: JSON.parse(formData.addons || "[]")
      };
      
      // Validate the incoming scan data against our schema
      const scanData = scanDataSchema.parse(parsedData);

      // Create the report
      const report = await storage.createReport(scanData);

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

  // Generate the console command for server owners
  app.get("/api/console-command", (req: Request, res: Response) => {
    try {
      const serverIp = req.query.serverIp || "your-server-ip";
      const baseUrl =
        process.env.BASE_URL || req.get("host") || "localhost:5000";
      const protocol = req.secure ? "https" : "http";

      const commandUrl = `${protocol}://${baseUrl}/api/scanner-code?server=${serverIp}`;

      const consoleCommand = `lua_run http.Fetch("${commandUrl}", function(body) RunString(body) end)`;

      return res.json({ command: consoleCommand });
    } catch (error) {
      console.error("Error generating command:", error);
      return res
        .status(500)
        .json({ message: "Failed to generate console command" });
    }
  });

  // Endpoint that returns the Lua code to be executed on the server
  app.get("/api/scanner-code", (req: Request, res: Response) => {
    try {
      const serverIp = (req.query.server as string) || "unknown";
      const baseUrl =
        process.env.BASE_URL || req.get("host") || "localhost:5000";
      const protocol = req.secure ? "https" : "http";

      // This is the Lua code that will be executed on the GMod server to analyze it
      // Based on BadCoderz library but simplified for web integration
      const luaCode = `
-- GMod Code Scanner based on BadCoderz by ExtReMLapin
-- Web adaptation version 1.0.0

local scannerVersion = "1.0.0"
local serverIp = "${serverIp}"
local baseUrl = "${protocol}://${baseUrl}"

print("[CodeScan] Starting GMod server code analysis...")
print("[CodeScan] This might take a few seconds...")

-- Initialize BadCoderz-like definitions
local dangerous_hooks = {
  ["Tick"] = true,
  ["Think"] = true,
  ["PlayerTick"] = true,
  ["HUDAmmoPickedUp"] = true,
  ["HUDPaint"] = true,
  ["HUDPaintBackground"] = true,
  ["Paint"] = true,
  ["DrawOverlay"] = true,
  ["DrawPhysgunBeam"] = true,
  ["PostDrawEffects"] = true,
  ["PostDrawHUD"] = true,
  ["PostDrawOpaqueRenderables"] = true,
  ["PostDrawSkyBox"] = true,
  ["PostDrawTranslucentRenderables"] = true,
  ["PreDrawEffects"] = true,
  ["PreDrawHalos"] = true,
  ["PreDrawHUD"] = true,
  ["PreDrawOpaqueRenderables"] = true,
  ["PreDrawSkyBox"] = true,
  ["PreDrawTranslucentRenderables"] = true,
  ["Move"] = true,
  ["Draw"] = true,
  ["DrawTranslucent"] = true,
  ["CalcView"] = true,
  ["DrawWorldModel"] = true,
  ["DrawWorldModelTranslucent"] = true,
  ["ViewModelDrawn"] = true
}

local heavy_funcs = {
  ["player.GetAll"] = "Gets all players on the server",
  ["ents.GetAll"] = "Gets all entities on the server",
  ["file.Append"] = "Appends to a file (I/O operation)",
  ["file.CreateDir"] = "Creates a directory (I/O operation)",
  ["file.Delete"] = "Deletes a file (I/O operation)",
  ["file.Exists"] = "Checks if a file exists (I/O operation)",
  ["file.Find"] = "Finds files (I/O operation)",
  ["file.Read"] = "Reads a file (I/O operation)",
  ["file.Write"] = "Writes to a file (I/O operation)",
  ["Color"] = "Creates a color object",
  ["Vector"] = "Creates a vector object",
  ["Angle"] = "Creates an angle object",
  ["CompileString"] = "Compiles a string into a function",
  ["RunString"] = "Executes Lua code from a string",
  ["RunStringEx"] = "Executes Lua code from a string with environment",
  ["table.HasValue"] = "Checks if a table contains a value (inefficient for large tables)"
}

-- Client-specific concerns
if CLIENT then
  heavy_funcs["surface.CreateFont"] = "Creates a font"
  heavy_funcs["surface.GetTextureID"] = "Gets a texture ID from disk"
  heavy_funcs["Material"] = "Creates a material object"
  heavy_funcs["vgui.Create"] = "Creates a VGUI element"
end

-- Initialize results
local issues = {}
local exploits = {}
local files = {}
local addons = {}
local addonsTable = {}

-- Scan for bad patterns in hooks
print("[CodeScan] Scanning hooks...")
for hookName, hookTable in pairs(hook.GetTable()) do
  local isDangerousHook = dangerous_hooks[hookName] or false
  
  for addonName, hookFunc in pairs(hookTable) do
    local info = debug.getinfo(hookFunc)
    if info and info.short_src then
      -- Track this file
      local filePath = info.short_src
      local addonName = string.match(filePath, "addons/([^/]+)") or "unknown"
      
      if not addonsTable[addonName] then
        addonsTable[addonName] = { name = addonName, files = 0, issues = 0 }
      end
      
      local fileSize = 0
      if file.Exists(filePath, "GAME") then
        fileSize = file.Size(filePath, "GAME")
      end
      
      -- Add to files list if not present
      local fileExists = false
      for _, f in ipairs(files) do
        if f.path == filePath then
          fileExists = true
          break
        end
      end
      
      if not fileExists then
        table.insert(files, {
          path = filePath,
          addon = addonName,
          type = "lua",
          size = fileSize,
          issues = 0
        })
        addonsTable[addonName].files = addonsTable[addonName].files + 1
      end
      
      -- Check the function source code if possible
      local source = ""
      if file.Exists(filePath, "GAME") then
        source = file.Read(filePath, "GAME") or ""
      end
      
      -- Check for heavy functions in dangerous hooks
      if isDangerousHook then
        -- We can't decompile the function easily, so we'll scan the source code
        -- for known problematic patterns
        for funcName, description in pairs(heavy_funcs) do
          if string.find(funcName, "%.") then
            -- It's a library function like player.GetAll
            local lib, func = string.match(funcName, "([^.]+)%.([^.]+)")
            if lib and func and string.find(source, lib .. "%." .. func) then
              local issueId = "issue_" .. #issues + 1
              table.insert(issues, {
                id = issueId,
                title = funcName .. "() called in " .. hookName .. " hook",
                description = "Using " .. funcName .. " in " .. hookName .. " can cause performance issues. " .. description,
                severity = "performance",
                occurrences = 1,
                filePath = filePath,
                lineNumber = info.linedefined,
                code = lib .. "." .. func .. "()",
                recommendation = "Cache results outside of the hook or use a less frequent hook"
              })
              
              -- Update issue count
              addonsTable[addonName].issues = addonsTable[addonName].issues + 1
              for i, f in ipairs(files) do
                if f.path == filePath then
                  files[i].issues = files[i].issues + 1
                  break
                end
              end
            end
          else
            -- It's a global function like Color or Vector
            if string.find(source, funcName .. "%(") then
              local issueId = "issue_" .. #issues + 1
              table.insert(issues, {
                id = issueId,
                title = funcName .. "() with static arguments in " .. hookName,
                description = "Creating " .. funcName .. " objects in " .. hookName .. " hook can cause performance issues.",
                severity = "performance",
                occurrences = 1,
                filePath = filePath,
                lineNumber = info.linedefined,
                code = "local obj = " .. funcName .. "(255, 255, 255, 255)",
                recommendation = "Cache the " .. funcName .. " object outside of the hook"
              })
              
              -- Update issue count
              addonsTable[addonName].issues = addonsTable[addonName].issues + 1
              for i, f in ipairs(files) do
                if f.path == filePath then
                  files[i].issues = files[i].issues + 1
                  break
                end
              end
            end
          end
        end
      end
    end
  end
end

-- Skip security exploits scan
print("[CodeScan] Analysis of hooks and functions complete!")

-- Finalize addon list
for _, addon in pairs(addonsTable) do
  table.insert(addons, addon)
end

print("[CodeScan] Analysis complete! Sending results...")

-- Convert data to string parameters (http.Post requires string keys and values)
local scan_data = {
  serverIp = serverIp,
  gmodVersion = GAMEMODE and GAMEMODE.Version or tostring(VERSION) or "unknown",
  issues = util.TableToJSON(issues),
  exploits = util.TableToJSON(exploits),
  files = util.TableToJSON(files),
  addons = util.TableToJSON(addons)
}

http.Post(baseUrl .. "/api/analyze", scan_data, function(body, size, headers, code)
  if code == 201 then
    local response = util.JSONToTable(body)
    if response and response.url then
      print("[CodeScan] 🎉 Analysis complete! View your report at: " .. baseUrl .. response.url)
    else
      print("[CodeScan] ✅ Analysis complete! Report created successfully.")
    end
  else
    print("[CodeScan] ❌ Error submitting results: " .. code)
    print("[CodeScan] Response: " .. body)
  end
end, function(err)
  print("[CodeScan] ❌ Failed to submit results: " .. err)
end)
      `;

      res.set("Content-Type", "text/plain");
      return res.send(luaCode);
    } catch (error) {
      console.error("Error generating scanner code:", error);
      return res
        .status(500)
        .json({ message: "Failed to generate scanner code" });
    }
  });

  const httpServer = createServer(app);

  return httpServer;
}
