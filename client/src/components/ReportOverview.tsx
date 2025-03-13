import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useQuery } from "@tanstack/react-query";

interface ReportOverviewProps {
  report: any;
}

export default function ReportOverview({ report }: ReportOverviewProps) {
  const { toast } = useToast();
  
  const { data: commandData } = useQuery({
    queryKey: [`/api/console-command?serverIp=${encodeURIComponent(report.serverIp)}`],
  });
  
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
    <>
      <h2 className="text-xl font-bold mb-4">Overview</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {/* Card 1 */}
        <div className="bg-slate-800 rounded-lg border border-slate-700 p-4">
          <div className="flex items-start">
            <div className="bg-red-500/20 p-3 rounded-md mr-4">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <p className="text-slate-400 text-sm">Critical Issues</p>
              <p className="text-2xl font-bold">{report.critical}</p>
            </div>
          </div>
        </div>
        
        {/* Card 2 */}
        <div className="bg-slate-800 rounded-lg border border-slate-700 p-4">
          <div className="flex items-start">
            <div className="bg-amber-500/20 p-3 rounded-md mr-4">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <div>
              <p className="text-slate-400 text-sm">Performance Issues</p>
              <p className="text-2xl font-bold">{report.performance}</p>
            </div>
          </div>
        </div>
        
        {/* Card 3 */}
        <div className="bg-slate-800 rounded-lg border border-slate-700 p-4">
          <div className="flex items-start">
            <div className="bg-blue-500/20 p-3 rounded-md mr-4">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
              </svg>
            </div>
            <div>
              <p className="text-slate-400 text-sm">Scanned Files</p>
              <p className="text-2xl font-bold">{report.scannedFiles}</p>
            </div>
          </div>
        </div>
        
        {/* Card 4 */}
        <div className="bg-slate-800 rounded-lg border border-slate-700 p-4">
          <div className="flex items-start">
            <div className="bg-secondary/20 p-3 rounded-md mr-4">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-secondary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 4a2 2 0 114 0v1a1 1 0 001 1h3a1 1 0 011 1v3a1 1 0 01-1 1h-1a2 2 0 100 4h1a1 1 0 011 1v3a1 1 0 01-1 1h-3a1 1 0 01-1-1v-1a2 2 0 10-4 0v1a1 1 0 01-1 1H7a1 1 0 01-1-1v-3a1 1 0 00-1-1H4a2 2 0 110-4h1a1 1 0 001-1V7a1 1 0 011-1h3a1 1 0 001-1V4z" />
              </svg>
            </div>
            <div>
              <p className="text-slate-400 text-sm">Addons Analyzed</p>
              <p className="text-2xl font-bold">{report.addonsAnalyzed}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Console Command */}
      <div className="bg-slate-800 rounded-lg border border-slate-700 p-4 mb-6">
        <div className="flex justify-between items-center mb-2">
          <h3 className="font-semibold">Run this command in your GMod console to update this report:</h3>
          <Button 
            variant="ghost" 
            size="sm" 
            className="h-6 w-6 p-0" 
            onClick={copyCommand}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
            </svg>
          </Button>
        </div>
        <div className="bg-slate-900 p-3 rounded font-mono text-sm overflow-x-auto">
          {commandData?.command || "Loading command..."}
        </div>
      </div>

      {/* Issues summary chart */}
      <div className="bg-slate-800 rounded-lg border border-slate-700 p-4">
        <h3 className="font-semibold mb-4">Issues by Category</h3>
        <div className="h-80 flex items-center justify-center">
          {report.issuesByCategory ? (
            <div className="w-full h-full flex items-end space-x-4 px-4">
              <div className="flex flex-col items-center">
                <div 
                  className="w-16 bg-red-500 rounded-t-sm" 
                  style={{ height: `${(report.issuesByCategory.performance / getMaxCategoryValue(report.issuesByCategory)) * 100}%` }}
                ></div>
                <span className="text-xs mt-2">Performance</span>
              </div>
              <div className="flex flex-col items-center">
                <div 
                  className="w-16 bg-amber-500 rounded-t-sm" 
                  style={{ height: `${(report.issuesByCategory.memory / getMaxCategoryValue(report.issuesByCategory)) * 100}%` }}
                ></div>
                <span className="text-xs mt-2">Memory</span>
              </div>
              <div className="flex flex-col items-center">
                <div 
                  className="w-16 bg-blue-500 rounded-t-sm" 
                  style={{ height: `${(report.issuesByCategory.security / getMaxCategoryValue(report.issuesByCategory)) * 100}%` }}
                ></div>
                <span className="text-xs mt-2">Security</span>
              </div>
              <div className="flex flex-col items-center">
                <div 
                  className="w-16 bg-primary rounded-t-sm" 
                  style={{ height: `${(report.issuesByCategory.networking / getMaxCategoryValue(report.issuesByCategory)) * 100}%` }}
                ></div>
                <span className="text-xs mt-2">Networking</span>
              </div>
              <div className="flex flex-col items-center">
                <div 
                  className="w-16 bg-purple-500 rounded-t-sm" 
                  style={{ height: `${(report.issuesByCategory.hooks / getMaxCategoryValue(report.issuesByCategory)) * 100}%` }}
                ></div>
                <span className="text-xs mt-2">Hooks</span>
              </div>
              <div className="flex flex-col items-center">
                <div 
                  className="w-16 bg-green-500 rounded-t-sm" 
                  style={{ height: `${(report.issuesByCategory.rendering / getMaxCategoryValue(report.issuesByCategory)) * 100}%` }}
                ></div>
                <span className="text-xs mt-2">Rendering</span>
              </div>
            </div>
          ) : (
            <div className="text-slate-400">No category data available</div>
          )}
        </div>
      </div>
    </>
  );
}

// Helper function to get the maximum value for scaling the chart
function getMaxCategoryValue(categories: Record<string, number>): number {
  if (!categories) return 1;
  
  const values = Object.values(categories);
  const max = Math.max(...values);
  return max > 0 ? max : 1; // Avoid division by zero
}
