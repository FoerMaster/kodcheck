/**
 * Utility function to get the console command for GMod servers
 */
export function getConsoleCommand(serverIp: string): string {
  // Get the base URL of the current app
  const baseUrl = window.location.origin;
  
  // Create the command URL
  const commandUrl = `${baseUrl}/api/scanner-code?server=${encodeURIComponent(serverIp)}`;
  
  // Create the full Lua command
  return `lua_run http.Fetch("${commandUrl}", function(body) RunString(body) end)`;
}
