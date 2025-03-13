import { useState } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { useQuery } from "@tanstack/react-query";
import { getConsoleCommand } from "@/utils/consoleCommand";

export default function Home() {
  const [serverIp, setServerIp] = useState("");
  const [_, setLocation] = useLocation();
  const { toast } = useToast();
  
  const { data: recentReports } = useQuery({
    queryKey: ['/api/reports?limit=5'],
  });
  
  const { data: commandData, isLoading: commandLoading } = useQuery({
    queryKey: [`/api/console-command${serverIp ? `?serverIp=${encodeURIComponent(serverIp)}` : ''}`],
    enabled: !!serverIp,
  });
  
  const handleGenerateCommand = () => {
    if (!serverIp) {
      toast({
        title: "Server IP Required",
        description: "Please enter your server IP address to generate a command.",
        variant: "destructive"
      });
      return;
    }
  };
  
  const copyCommand = () => {
    if (commandData?.command) {
      navigator.clipboard.writeText(commandData.command);
      toast({
        title: "Command Copied",
        description: "Console command copied to clipboard",
      });
    }
  };
  
  return (
    <div className="min-h-screen bg-slate-900 text-slate-50 flex flex-col">
      <header className="bg-slate-800 border-b border-slate-700 py-6 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center space-x-3">
            <div className="bg-primary rounded-md p-1.5">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
              </svg>
            </div>
            <h1 className="text-2xl font-bold">GMod CodeScan</h1>
          </div>
        </div>
      </header>
      
      <main className="flex-1 py-12 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col lg:flex-row gap-8">
            <div className="flex-1">
              <h2 className="text-3xl font-bold mb-4">Find bad code and exploits in your Garry's Mod server</h2>
              <p className="text-slate-400 mb-8 text-lg">
                Analyze your server to find performance issues, security vulnerabilities, and other problems.
                Get a detailed report and recommendations to improve your server's performance and security.
              </p>
              
              <Card className="bg-slate-800 border-slate-700">
                <CardHeader>
                  <CardTitle>Run this command in your GMod console</CardTitle>
                  <CardDescription className="text-slate-400">
                    Enter your server IP to generate a custom command
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex mb-4">
                    <Input 
                      type="text" 
                      placeholder="Your server IP (e.g. 192.168.1.100:27015)"
                      value={serverIp}
                      onChange={(e) => setServerIp(e.target.value)}
                      className="bg-slate-900 border-slate-700 text-slate-100"
                    />
                    <Button 
                      onClick={handleGenerateCommand} 
                      className="ml-2"
                      disabled={commandLoading}
                    >
                      Generate
                    </Button>
                  </div>
                  
                  {commandData?.command && (
                    <div className="bg-slate-900 p-3 rounded-md font-mono text-sm overflow-x-auto relative">
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="absolute top-2 right-2 h-6 w-6 p-0" 
                        onClick={copyCommand}
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                        </svg>
                      </Button>
                      <code className="text-slate-300 whitespace-pre-wrap">{commandData.command}</code>
                    </div>
                  )}
                </CardContent>
                <CardFooter className="text-sm text-slate-400">
                  This command will analyze your server and generate a detailed report.
                </CardFooter>
              </Card>
              
              <div className="mt-8 space-y-6">
                <div className="flex items-center space-x-3">
                  <div className="bg-green-500/20 p-2 rounded-full">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="font-semibold">Find performance bottlenecks</h3>
                    <p className="text-slate-400">Identify code that's causing lag and FPS drops</p>
                  </div>
                </div>
                
                <div className="flex items-center space-x-3">
                  <div className="bg-amber-500/20 p-2 rounded-full">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="font-semibold">Detect security vulnerabilities</h3>
                    <p className="text-slate-400">Find exploits before hackers do</p>
                  </div>
                </div>
                
                <div className="flex items-center space-x-3">
                  <div className="bg-blue-500/20 p-2 rounded-full">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="font-semibold">Get detailed recommendations</h3>
                    <p className="text-slate-400">Learn how to fix issues with real code examples</p>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="lg:w-96">
              <Card className="bg-slate-800 border-slate-700">
                <CardHeader>
                  <CardTitle>Recent Reports</CardTitle>
                  <CardDescription className="text-slate-400">
                    View recent server analysis reports
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {recentReports?.length > 0 ? (
                    <ul className="space-y-3">
                      {recentReports.map((report: any) => (
                        <li 
                          key={report.reportId} 
                          className="p-3 bg-slate-900 rounded-md hover:bg-slate-950 cursor-pointer"
                          onClick={() => setLocation(`/report/${report.reportId}`)}
                        >
                          <div className="flex justify-between items-start">
                            <div>
                              <p className="font-medium">{report.serverIp}</p>
                              <p className="text-sm text-slate-400">
                                {new Date(report.scanDate).toLocaleDateString()}
                              </p>
                            </div>
                            <div className="flex items-center space-x-1">
                              <span className="px-2 py-1 bg-red-500/20 text-red-400 rounded text-xs">
                                {report.critical} critical
                              </span>
                            </div>
                          </div>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <div className="text-center py-6 text-slate-400">
                      <p>No reports available yet</p>
                      <p className="text-sm mt-1">Scan your server to create a report</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </main>
      
      <footer className="bg-slate-800 border-t border-slate-700 py-6 px-6">
        <div className="max-w-7xl mx-auto text-center">
          <p className="text-slate-400">
            Based on <a href="https://github.com/ExtReMLapin/BadCoderz" className="text-primary hover:underline" target="_blank" rel="noopener noreferrer">BadCoderz</a> by ExtReMLapin
          </p>
        </div>
      </footer>
    </div>
  );
}
