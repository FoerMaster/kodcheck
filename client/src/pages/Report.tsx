import { useParams } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Skeleton } from "@/components/ui/skeleton";
import Sidebar from "@/components/Sidebar";
import ReportOverview from "@/components/ReportOverview";
import BadCodeIssues from "@/components/BadCodeIssues";
// PotentialExploits component removed
import ScannedFiles from "@/components/ScannedFiles";
import Addons from "@/components/Addons";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useState, useRef, useEffect } from "react";
import type { Report as ReportType } from "@shared/schema";

export default function Report() {
  const { reportId } = useParams();
  const { toast } = useToast();
  const [activeSection, setActiveSection] = useState("overview");
  const sectionRefs = {
    overview: useRef<HTMLElement>(null),
    issues: useRef<HTMLElement>(null),
    // exploits section removed
    files: useRef<HTMLElement>(null),
    addons: useRef<HTMLElement>(null)
  };
  
  const { data: report, isLoading, error } = useQuery<ReportType>({
    queryKey: [`/api/reports/${reportId}`],
  });
  
  const copyReportUrl = () => {
    const url = window.location.href;
    navigator.clipboard.writeText(url);
    toast({
      title: "URL Copied",
      description: "Report URL copied to clipboard",
    });
  };
  
  const exportReport = () => {
    if (!report) return;
    
    // Create a text version of the report
    let reportText = `GMOD CODE ANALYSIS REPORT\n`;
    reportText += `=======================\n\n`;
    reportText += `Server IP: ${report.serverIp}\n`;
    reportText += `GMod Version: ${report.gmodVersion}\n`;
    reportText += `Scan Date: ${new Date(report.scanDate).toLocaleString()}\n\n`;
    
    reportText += `SUMMARY\n`;
    reportText += `-------\n`;
    reportText += `Critical Issues: ${report.critical}\n`;
    reportText += `Performance Issues: ${report.performance}\n`;
    reportText += `Files Scanned: ${report.scannedFiles}\n`;
    reportText += `Addons Analyzed: ${report.addonsAnalyzed}\n\n`;
    
    reportText += `BAD CODE ISSUES\n`;
    reportText += `--------------\n`;
    report.badCodeIssues.forEach((issue: any, index: number) => {
      reportText += `${index + 1}. ${issue.title} (${issue.severity})\n`;
      reportText += `   File: ${issue.filePath}:${issue.lineNumber}\n`;
      reportText += `   Description: ${issue.description}\n`;
      reportText += `   Recommendation: ${issue.recommendation}\n\n`;
    });
    
    // Exploit section removed as per new requirements
    
    // Create a download link
    const blob = new Blob([reportText], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `gmod-scan-report-${reportId}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    toast({
      title: "Report Exported",
      description: "Report has been downloaded as a text file",
    });
  };
  
  // Handle scrolling to sections
  useEffect(() => {
    const hash = window.location.hash.substring(1);
    if (hash && sectionRefs[hash as keyof typeof sectionRefs]?.current) {
      setActiveSection(hash);
      sectionRefs[hash as keyof typeof sectionRefs].current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [report]);
  
  if (isLoading) {
    return (
      <div className="flex flex-col lg:flex-row min-h-screen bg-slate-900 text-slate-50">
        <div className="w-full lg:w-64 bg-slate-800 border-r border-slate-700">
          <Skeleton className="h-screen w-full" />
        </div>
        <div className="flex-1 overflow-hidden flex flex-col">
          <Skeleton className="h-20 w-full" />
          <Skeleton className="h-screen w-full mt-2" />
        </div>
      </div>
    );
  }
  
  if (error || !report) {
    return (
      <div className="min-h-screen bg-slate-900 text-slate-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Report Not Found</h1>
          <p className="text-slate-400 mb-6">
            The report you're looking for doesn't exist or there was an error loading it.
          </p>
          <Button variant="default" onClick={() => window.location.href = "/"}>
            Return Home
          </Button>
        </div>
      </div>
    );
  }
  
  return (
    <div className="flex flex-col lg:flex-row min-h-screen bg-slate-900 text-slate-50">
      <Sidebar 
        serverInfo={{
          ip: report.serverIp,
          gmodVersion: report.gmodVersion,
          scanDate: new Date(report.scanDate).toLocaleDateString()
        }}
        activeSection={activeSection}
        onSectionChange={setActiveSection}
      />
      
      <div className="flex-1 overflow-hidden flex flex-col">
        <header className="bg-slate-800 border-b border-slate-700 py-4 px-6 flex flex-col md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-2xl font-bold">Server Code Analysis Report</h1>
            <p className="text-slate-400">
              Scan completed on {new Date(report.scanDate).toLocaleString()}
            </p>
          </div>
          <div className="mt-4 md:mt-0 flex space-x-3">
            <Button 
              variant="outline" 
              onClick={copyReportUrl}
              className="bg-slate-700 hover:bg-slate-600 text-white border-slate-600"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
              </svg>
              Share Report
            </Button>
            <Button 
              variant="default" 
              onClick={exportReport}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
              </svg>
              Export Report
            </Button>
          </div>
        </header>
        
        <main className="flex-1 overflow-auto p-6">
          <section ref={sectionRefs.overview} id="overview" className="mb-10">
            <ReportOverview report={report} />
          </section>
          
          <section ref={sectionRefs.issues} id="issues" className="mb-10">
            <BadCodeIssues issues={report.badCodeIssues} />
          </section>
          
          {/* Exploit section hidden as per new requirements */}
          
          <section ref={sectionRefs.files} id="files" className="mb-10">
            <ScannedFiles files={report.scannedFilesList} />
          </section>
          
          <section ref={sectionRefs.addons} id="addons" className="mb-10">
            <Addons addons={report.addonsList} />
          </section>
        </main>
      </div>
    </div>
  );
}
