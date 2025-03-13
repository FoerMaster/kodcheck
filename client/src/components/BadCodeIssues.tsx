import { useState } from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { highlightCode } from "@/utils/codeHighlight";

interface Issue {
  id: string;
  title: string;
  description: string;
  severity: string;
  occurrences: number;
  filePath: string;
  lineNumber: number;
  code: string;
  recommendation: string;
  documentationUrl?: string;
}

interface BadCodeIssuesProps {
  issues: Issue[];
}

export default function BadCodeIssues({ issues }: BadCodeIssuesProps) {
  const [filter, setFilter] = useState("all");
  const { toast } = useToast();
  
  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Copied to clipboard",
      description: "Code snippet copied successfully",
    });
  };
  
  const filteredIssues = issues.filter(issue => {
    if (filter === "all") return true;
    if (filter === "critical") return issue.severity === "critical";
    if (filter === "performance") return issue.severity === "performance";
    return true;
  });
  
  return (
    <>
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold">Bad Code Issues</h2>
        <div className="flex items-center space-x-2">
          <span className="text-sm text-slate-400">Filter by:</span>
          <Select value={filter} onValueChange={setFilter}>
            <SelectTrigger className="w-[180px] bg-slate-700 border-none">
              <SelectValue placeholder="All Issues" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Issues</SelectItem>
              <SelectItem value="critical">Critical Only</SelectItem>
              <SelectItem value="performance">Performance Issues</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Issues list */}
      <div className="space-y-4">
        {filteredIssues.length > 0 ? (
          filteredIssues.map(issue => (
            <div key={issue.id} className="bg-slate-800 rounded-lg border border-slate-700 overflow-hidden">
              {/* Issue header */}
              <div className="bg-slate-700 p-4 flex flex-col md:flex-row md:items-center md:justify-between">
                <div className="flex items-start space-x-3">
                  <div className={`${issue.severity === 'critical' ? 'bg-red-500/20' : 'bg-amber-500/20'} p-2 rounded`}>
                    <svg xmlns="http://www.w3.org/2000/svg" className={`h-5 w-5 ${issue.severity === 'critical' ? 'text-red-500' : 'text-amber-500'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="font-semibold">{issue.title}</h3>
                    <p className="text-sm text-slate-400">{issue.description}</p>
                  </div>
                </div>
                <div className="flex items-center space-x-2 mt-3 md:mt-0">
                  <span className={`px-2 py-1 ${
                    issue.severity === 'critical' 
                      ? 'bg-red-500/20 text-red-400' 
                      : 'bg-amber-500/20 text-amber-400'
                  } rounded text-xs font-medium`}>
                    {issue.severity === 'critical' ? 'Critical' : 'Performance'}
                  </span>
                  <span className="px-2 py-1 bg-slate-600 rounded text-xs font-medium">
                    {issue.occurrences} occurrences
                  </span>
                </div>
              </div>
              
              {/* Issue body */}
              <div className="p-4">
                <div className="mb-4">
                  <h4 className="text-sm font-medium text-slate-300 mb-2">Problem Description</h4>
                  <p className="text-sm text-slate-400">
                    {issue.description}
                  </p>
                </div>
                
                {/* Code preview */}
                <div className="mb-4">
                  <div className="flex justify-between items-center mb-2">
                    <h4 className="text-sm font-medium text-slate-300">Code Preview</h4>
                    <span className="text-xs text-slate-500">{issue.filePath}:{issue.lineNumber}</span>
                  </div>
                  <div className="bg-slate-900 rounded-md p-4 font-mono text-sm overflow-x-auto relative">
                    <button 
                      className="absolute top-2 right-2 text-slate-500 hover:text-white"
                      onClick={() => copyToClipboard(issue.code)}
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                      </svg>
                    </button>
                    <pre
                      className="text-slate-300"
                      dangerouslySetInnerHTML={{ __html: highlightCode(issue.code) }}
                    ></pre>
                  </div>
                </div>
                
                {/* Recommendation */}
                <div className="mb-4">
                  <h4 className="text-sm font-medium text-slate-300 mb-2">Recommendation</h4>
                  <div className="bg-slate-700/50 rounded-md p-4 text-sm">
                    <p className="text-slate-300 mb-2">{issue.recommendation}</p>
                  </div>
                </div>
                
                {/* Documentation link */}
                {issue.documentationUrl && (
                  <div className="flex items-center">
                    <a href={issue.documentationUrl} className="text-primary text-sm flex items-center hover:underline" target="_blank" rel="noopener noreferrer">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                      </svg>
                      Documentation for {issue.title.split(' ')[0]} functions
                    </a>
                  </div>
                )}
              </div>
            </div>
          ))
        ) : (
          <div className="bg-slate-800 rounded-lg border border-slate-700 p-8 text-center">
            <p className="text-slate-400">No issues found matching the selected filter.</p>
          </div>
        )}
      </div>
    </>
  );
}
