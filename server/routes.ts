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
      const scannerCode = `
-- GMod Server Scanner v2.0
-- A standalone performance and security analyzer

local Scanner = {
  version = "2.0.0",
  baseUrl = "${baseUrl}",
  scanId = "${scanId}",
  issues = {},
  files = {},
  addons = {},
  chunkSize = 5
}

-- Configuration
local HOOK_TYPES = {
  performance_critical = {
    ["Think"] = true,
    ["Tick"] = true,
    ["PlayerThink"] = true,
    ["PlayerTick"] = true,
    ["HUDPaint"] = true,
    ["HUDPaintBackground"] = true,
    ["PostDrawHUD"] = true,
    ["PreDrawHUD"] = true,
    ["DrawOverlay"] = true,
    ["Move"] = true,
    ["VehicleMove"] = true,
    ["Draw"] = true,
    ["DrawTranslucent"] = true,
    ["CalcAbsolutePosition"] = true,
    ["CalcMainActivity"] = true,
    ["CalcVehicleView"] = true,
    ["CalcView"] = true,
    ["CalcViewModelView"] = true
  }
}

local HEAVY_FUNCTIONS = {
  ["player.GetAll"] = {
    severity = "warning",
    description = "Gets all players - expensive in loops",
    recommendation = "Cache result outside loop or hook"
  },
  ["ents.GetAll"] = {
    severity = "warning", 
    description = "Gets all entities - very expensive",
    recommendation = "Use ents.FindByClass() or cache results"
  },
  ["http.Fetch"] = {
    severity = "warning",
    description = "Network request in frequent code",
    recommendation = "Use timers or cache responses"
  },
  ["file.Append"] = {
    severity = "warning",
    description = "File operations are slow in frequent code",
    recommendation = "Use timers for file operations"
  },
  ["file.Write"] = {
    severity = "warning",
    description = "File operations are slow in frequent code",
    recommendation = "Use timers for file operations"
  },
  ["file.Read"] = {
    severity = "warning",
    description = "File operations are slow in frequent code",
    recommendation = "Cache file contents outside of frequently called functions"
  }
}

local OBJECT_PATTERNS = {
  {
    match = "Color%s*%(%s*%d+%s*,%s*%d+%s*,%s*%d+",
    severity = "warning",
    description = "Color object creation in frequent code",
    recommendation = "Cache color objects outside of frequently called functions"
  },
  {
    match = "Vector%s*%(%s*%d+%s*,%s*%d+%s*,%s*%d+",
    severity = "warning",
    description = "Vector object creation in frequent code",
    recommendation = "Cache vectors or use Vector methods for math"
  },
  {
    match = "Angle%s*%(%s*%d+%s*,%s*%d+%s*,%s*%d+",
    severity = "warning",
    description = "Angle object creation in frequent code",
    recommendation = "Cache angles or use Angle methods for math"
  }
}

if CLIENT then
  HEAVY_FUNCTIONS["surface.CreateFont"] = {
    severity = "critical",
    description = "Font creation - very expensive",
    recommendation = "Create fonts once at initialization"
  }
  HEAVY_FUNCTIONS["surface.GetTextureID"] = {
    severity = "warning",
    description = "Texture loading from disk",
    recommendation = "Cache texture IDs on load"
  }
  HEAVY_FUNCTIONS["Material"] = {
    severity = "warning",
    description = "Material creation",
    recommendation = "Cache materials, don't create per frame"
  }
  HEAVY_FUNCTIONS["vgui.Create"] = {
    severity = "warning",
    description = "Creating UI elements in render hooks",
    recommendation = "Create UI elements once, not per frame"
  }
end

-- Utility functions
local function log(msg, level)
  level = level or "INFO"
  print(string.format("[Scanner:%s] %s", level, msg))
end

local function isCommentedCode(line)
  return string.match(line, "^%s*%-%-") or string.match(line, "^%s*//")
end

local function getCodeContext(filePath, lineNum, context)
  if not file.Exists(filePath, "GAME") then return "File not found" end

  local content = file.Read(filePath, "GAME")
  if not content then return "Could not read file" end

  local lines = string.Split(content:gsub("\\r\\n", "\\n"):gsub("\\r", "\\n"), "\\n")
  local start = math.max(1, lineNum - context)
  local finish = math.min(#lines, lineNum + context)
  local result = {}

  for i = start, finish do
    local linePrefix = string.format("%5d: ", i)
    table.insert(result, (i == lineNum and ">> " or "   ") .. linePrefix .. lines[i])
  end

  return table.concat(result, "\\n")
end

local function getAddonName(path)
  return string.match(path, "addons/([^/]+)") or "unknown"
end

local function addIssue(filePath, line, title, description, severity, recommendation, code)
  -- Add to file and addon statistics
  local addonName = getAddonName(filePath)

  -- Initialize file info if it doesn't exist
  Scanner.files[filePath] = Scanner.files[filePath] or {
    path = filePath,
    addon = addonName,
    type = "lua",
    size = file.Size(filePath, "GAME") or 0,
    issues = 0
  }
  Scanner.files[filePath].issues = Scanner.files[filePath].issues + 1

  -- Initialize addon info if it doesn't exist
  Scanner.addons[addonName] = Scanner.addons[addonName] or {
    name = addonName,
    files = 0,
    issues = 0
  }
  Scanner.addons[addonName].issues = Scanner.addons[addonName].issues + 1

  table.insert(Scanner.issues, {
    id = string.format("ISSUE_%04d", #Scanner.issues + 1),
    title = title,
    description = description,
    severity = severity,
    filePath = filePath,
    lineNumber = line,
    code = code or getCodeContext(filePath, line, 3),
    recommendation = recommendation,
    occurrences = 1
  })
end

-- Analyzers
local function analyzeHookFunction(hookName, func)
  local info = debug.getinfo(func, "S")
  if not info or info.what == "C" then return end

  local filePath = info.source:sub(2)
  local source = file.Read(filePath, "GAME")
  if not source then return end

  -- Get function content
  local funcContent = string.match(source, "function%s*%(.-%)(.-)end", info.linedefined)
  if not funcContent then return end

  -- Check for empty function
  if string.match(funcContent, "^%s*$") then
    addIssue(
      filePath,
      info.linedefined,
      "Empty hook function",
      string.format("Hook '%s' contains an empty function", hookName),
      "warning",
      "Remove empty hook or implement required functionality",
      getCodeContext(filePath, info.linedefined, 3)
    )
    return
  end

  -- Check hook type
  if HOOK_TYPES.performance_critical[hookName] then
    -- For critical hooks, check heavy functions
    for pattern, data in pairs(HEAVY_FUNCTIONS) do
      local libName, funcName = string.match(pattern, "([^.]+)%.([^.]+)")
      if libName and funcName then
        -- Check each line of the function
        local lineNumber = info.linedefined
        for line in string.gmatch(funcContent, "[^\\n]+") do
          lineNumber = lineNumber + 1
          if not isCommentedCode(line) and string.find(line, libName .. "%." .. funcName) then
            addIssue(
              filePath,
              lineNumber,
              string.format("%s() in %s hook", pattern, hookName),
              string.format("Using %s in %s can cause performance issues at line %d. %s", pattern, hookName, lineNumber, data.description),
              data.severity,
              data.recommendation
            )
          end
        end
      end
    end

    -- Check object creation
    for _, pattern in ipairs(OBJECT_PATTERNS) do
      local lineNumber = info.linedefined
      for line in string.gmatch(funcContent, "[^\\n]+") do
        lineNumber = lineNumber + 1
        if not isCommentedCode(line) and string.find(line, pattern.match) then
          addIssue(
            filePath,
            lineNumber,
            string.format("Object creation in %s", hookName),
            string.format("%s at line %d", pattern.description, lineNumber),
            pattern.severity,
            pattern.recommendation
          )
        end
      end
    end
  end
end

local function scanHooks()
  log("Scanning hooks...")

  local hookTable = hook.GetTable()
  for hookName, hooks in pairs(hookTable) do
    for addonFunc, func in pairs(hooks) do
      analyzeHookFunction(hookName, func)
    end
  end
end

local function scanFile(filePath)
  if not file.Exists(filePath, "GAME") then return end

  local content = file.Read(filePath, "GAME")
  if not content then return end

  local issues_found = false
  
  -- Analyze hook definitions
  for hookName, _ in pairs(HOOK_TYPES.performance_critical) do
    local pattern = string.format("hook.Add[^\\"']*[\\"\\']%s[\\"\\']", hookName)
    local startPos = 1

    while true do
      local matchStart, matchEnd = string.find(content, pattern, startPos)
      if not matchStart then break end

      -- Check if the line is commented
      local lineStart = select(2, string.gsub(content:sub(1, matchStart), "\\n", ""))
      local line = string.match(content:sub(lineStart), "[^\\n]+")

      if not isCommentedCode(line) then
        local lineNum = select(2, string.gsub(content:sub(1, matchStart), "\\n", "")) + 1
        
        -- Check for color/vector/angle object creation patterns in hook blocks
        local blockStart = matchEnd
        local blockEnd = string.find(content, "end", blockStart)
        
        if blockEnd then
          local hookBlock = content:sub(blockStart, blockEnd)
          
          for _, pattern in ipairs(OBJECT_PATTERNS) do
            local blockLines = string.Split(hookBlock, "\\n")
            for i, line in ipairs(blockLines) do
              if not isCommentedCode(line) and string.find(line, pattern.match) then
                local actualLineNumber = lineNum + i - 1
                addIssue(
                  filePath,
                  actualLineNumber,
                  string.format("Object creation in %s hook", hookName),
                  string.format("%s at line %d", pattern.description, actualLineNumber),
                  "warning",
                  pattern.recommendation
                )
                issues_found = true
              end
            end
          end
          
          -- Check for heavy functions in hook blocks
          for pattern, data in pairs(HEAVY_FUNCTIONS) do
            local libName, funcName = string.match(pattern, "([^.]+)%.([^.]+)")
            if libName and funcName then
              -- Find all occurrences of the function with line numbers
              local blockLines = string.Split(hookBlock, "\\n")
              for i, line in ipairs(blockLines) do
                if not isCommentedCode(line) and string.find(line, libName .. "%." .. funcName) then
                  local actualLineNumber = lineNum + i - 1
                  addIssue(
                    filePath,
                    actualLineNumber,
                    string.format("%s in %s hook", pattern, hookName),
                    string.format("Using %s in %s hook can impact performance at line %d", pattern, hookName, actualLineNumber),
                    data.severity,
                    data.recommendation
                  )
                  issues_found = true
                end
              end
            end
          end
        end
      end

      startPos = matchEnd + 1
    end
  end
  
  -- Only add file to report if issues were found
  if issues_found then
    local addonName = getAddonName(filePath)
    
    -- Add file to statistics
    Scanner.files[filePath] = Scanner.files[filePath] or {
      path = filePath,
      addon = addonName,
      type = "lua",
      size = #content,
      issues = 0
    }

    Scanner.addons[addonName] = Scanner.addons[addonName] or {
      name = addonName,
      files = 0,
      issues = 0
    }
    Scanner.addons[addonName].files = Scanner.addons[addonName].files + 1
  end
end

local function scanDirectory(dir)
  local files, dirs = file.Find(dir .. "/*", "GAME")

  for _, f in ipairs(files) do
    if string.EndsWith(f, ".lua") then
      scanFile(dir .. "/" .. f)
    end
  end

  for _, d in ipairs(dirs) do
    if d ~= "." and d ~= ".." then
      scanDirectory(dir .. "/" .. d)
    end
  end
end

function Scanner:sendChunkedData(data, endpoint, onComplete)
  local chunks = {}
  local currentChunk = {}
  local chunkIndex = 1

  -- Split data into chunks
  for i, item in ipairs(data) do
    table.insert(currentChunk, item)
    if #currentChunk >= self.chunkSize or i == #data then
      chunks[chunkIndex] = currentChunk
      currentChunk = {}
      chunkIndex = chunkIndex + 1
    end
  end

  -- Send chunks sequentially
  local function sendNextChunk(index)
    if index > #chunks then
      if onComplete then onComplete() end
      return
    end

    local chunk = chunks[index]
    local payload = {
      scanId = self.scanId,
      totalChunks = #chunks,
      currentChunk = index,
      data = util.TableToJSON(chunk)
    }

    http.Post(
      "https://" .. self.baseUrl .. endpoint,
      payload,
      function(body, size, headers, code)
        if code >= 200 and code < 300 then
          log(string.format("Chunk %d/%d sent successfully", index, #chunks))
          sendNextChunk(index + 1)
        else
          log("❌ Error sending chunk: " .. code, "ERROR")
        end
      end,
      function(err)
        log("❌ Failed to send chunk: " .. err, "ERROR")
      end
    )
  end

  sendNextChunk(1)
end

function Scanner:start()
  log("Starting analysis...")

  -- Scan active hooks
  scanHooks()

  -- Scan lua files
  log("Scanning Lua files...")
  scanDirectory("lua")
  scanDirectory("addons")

  -- Convert files and addons maps to arrays, only including files with issues
  local filesArray = {}
  for _, file in pairs(self.files) do
    if file.issues > 0 then
      table.insert(filesArray, file)
    end
  end

  local addonsArray = {}
  for _, addon in pairs(self.addons) do
    if addon.issues > 0 then
      table.insert(addonsArray, addon)
    end
  end

  -- Filter issues to remove duplicates
  local uniqueIssues = {}
  local seen = {}
  
  for _, issue in ipairs(self.issues) do
    local key = issue.filePath .. ":" .. issue.lineNumber .. ":" .. issue.title
    if not seen[key] then
      seen[key] = true
      table.insert(uniqueIssues, issue)
    else
      -- Find and update the existing issue
      for _, existingIssue in ipairs(uniqueIssues) do
        local existingKey = existingIssue.filePath .. ":" .. existingIssue.lineNumber .. ":" .. existingIssue.title
        if existingKey == key then
          existingIssue.occurrences = existingIssue.occurrences + 1
          break
        end
      end
    end
  end
  
  self.issues = uniqueIssues

  -- First send issues
  self:sendChunkedData(
    self.issues,
    "/api/analyze/issues",
    function()
      -- Then send server info with files and addons
      local serverInfo = {
        serverIp = game.GetIPAddress(),
        gmodVersion = GAMEMODE and GAMEMODE.Version or tostring(VERSION),
        scanId = self.scanId,
        files = util.TableToJSON(filesArray),
        addons = util.TableToJSON(addonsArray)
      }

      http.Post(
        "https://" .. self.baseUrl .. "/api/analyze/complete",
        serverInfo,
        function(body, size, headers, code)
          if code >= 200 and code < 300 then
            local response = util.JSONToTable(body)
            if response and response.url then
              log("✅ Analysis complete! View results at: https://" .. self.baseUrl .. response.url)
            else
              log("✅ Analysis complete!")
            end
          else
            log("❌ Error completing analysis: " .. code, "ERROR")
          end
        end,
        function(err)
          log("❌ Failed to complete analysis: " .. err, "ERROR")
        end
      )
    end
  )
end

-- Start the scan
Scanner:start()
`;

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
