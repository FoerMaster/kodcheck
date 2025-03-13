import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { useToast } from "@/hooks/use-toast";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { AlertCircle, FileCode, Package } from "lucide-react";
import type { ScanData } from "@shared/schema";

export default function Report() {
  const [location] = useLocation();
  const reportId = location.split("/").pop();
  const { toast } = useToast();

  const { data: report, isLoading } = useQuery<ScanData>({
    queryKey: [`/api/reports/${reportId}`]
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background p-6">
        <Card>
          <CardContent className="p-6">Loading report...</CardContent>
        </Card>
      </div>
    );
  }

  if (!report) {
    return (
      <div className="min-h-screen bg-background p-6">
        <Card>
          <CardContent className="p-6">Report not found</CardContent>
        </Card>
      </div>
    );
  }

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case "critical":
        return "bg-red-500/10 text-red-500 border-red-500/20";
      case "performance":
        return "bg-yellow-500/10 text-yellow-500 border-yellow-500/20";
      case "warning":
        return "bg-orange-500/10 text-orange-500 border-orange-500/20";
      default:
        return "bg-blue-500/10 text-blue-500 border-blue-500/20";
    }
  };

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case "critical":
        return "🚨";
      case "performance":
        return "⚠️";
      case "warning":
        return "⚡";
      default:
        return "ℹ️";
    }
  };

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-[1400px] mx-auto space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl flex items-center gap-2">
              Server Scan Report
            </CardTitle>
            <CardDescription>
              Server: {report.serverIp} | GMod Version: {report.gmodVersion}
            </CardDescription>
          </CardHeader>
        </Card>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertCircle className="h-5 w-5" />
                Issues ({report.issues.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[800px] pr-4">
                <div className="space-y-4">
                  {report.issues.map((issue) => (
                    <Card
                      key={issue.id}
                      className={`border-2 ${getSeverityColor(issue.severity)}`}
                    >
                      <CardHeader>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className="text-2xl">
                              {getSeverityIcon(issue.severity)}
                            </span>
                            <div>
                              <CardTitle>{issue.title}</CardTitle>
                              <CardDescription className="mt-1">
                                {issue.description}
                              </CardDescription>
                            </div>
                          </div>
                          <Badge className={getSeverityColor(issue.severity)}>
                            {issue.severity}
                          </Badge>
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div>
                          <h4 className="text-sm font-medium mb-2">Code Location</h4>
                          <p className="text-sm text-muted-foreground">
                            {issue.filePath}:{issue.lineNumber}
                          </p>
                        </div>
                        <div>
                          <h4 className="text-sm font-medium mb-2">Code Context</h4>
                          <pre className="bg-muted p-4 rounded-lg text-sm overflow-x-auto whitespace-pre">
                            {issue.code}
                          </pre>
                        </div>
                        <div>
                          <h4 className="text-sm font-medium mb-2">Recommendation</h4>
                          <p className="text-sm text-muted-foreground">
                            {issue.recommendation}
                          </p>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Package className="h-5 w-5" />
                  Addons ({report.addons.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[400px]">
                  {report.addons.map((addon) => (
                    <div
                      key={addon.name}
                      className="p-4 border-b last:border-0 space-y-2"
                    >
                      <div className="flex justify-between items-center">
                        <h3 className="font-medium">{addon.name}</h3>
                        {addon.issues > 0 && (
                          <Badge variant="destructive">{addon.issues} issues</Badge>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {addon.files} files
                      </p>
                    </div>
                  ))}
                </ScrollArea>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileCode className="h-5 w-5" />
                  Files ({report.files.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[400px]">
                  <div className="space-y-4">
                    {report.files.map((file) => (
                      <div
                        key={file.path}
                        className="p-4 border rounded-lg space-y-2"
                      >
                        <div className="flex justify-between items-center">
                          <h3 className="font-medium">{file.path}</h3>
                          {file.issues > 0 && (
                            <Badge variant="destructive">
                              {file.issues} issues
                            </Badge>
                          )}
                        </div>
                        <div className="flex gap-4 text-sm text-muted-foreground">
                          <span>Type: {file.type}</span>
                          <span>Size: {(file.size / 1024).toFixed(2)} KB</span>
                          <span>Addon: {file.addon}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}