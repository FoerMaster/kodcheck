import React from "react";
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, CheckCircle } from "lucide-react";

interface ConVarIssue {
  id: string;
  title: string;
  description: string;
  severity: string;
  code: string;
  recommendation: string;
}

interface ConVarAnalysisProps {
  issues: ConVarIssue[];
}

export default function ConVarAnalysis({ issues }: ConVarAnalysisProps) {
  // Filter issues that are related to ConVars (their IDs should start with 'convar_')
  const convarIssues = issues.filter((issue) => 
    issue.id.startsWith("convar_")
  );

  if (convarIssues.length === 0) {
    return (
      <div className="rounded-lg border p-6 bg-card text-center">
        <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
        <h3 className="text-xl font-semibold mb-2">All ConVars Secure</h3>
        <p className="text-muted-foreground">
          No dangerous ConVar settings were detected on this server.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <AlertTriangle className="h-6 w-6 text-amber-500" />
        <h3 className="text-xl font-semibold">Dangerous ConVar Settings</h3>
      </div>
      
      <div className="bg-card rounded-lg border">
        <Table>
          <TableCaption>
            List of potentially dangerous ConVar settings detected on the server
          </TableCaption>
          <TableHeader>
            <TableRow>
              <TableHead>ConVar</TableHead>
              <TableHead>Current Value</TableHead>
              <TableHead>Recommendation</TableHead>
              <TableHead>Risk</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {convarIssues.map((issue) => {
              // Extract values from the code string: "convar_name value // Default: default_value"
              const codeMatch = issue.code.match(/^(\S+)\s+(\S+)\s+\/\/\s+Default:\s+(.+)$/);
              const convarName = codeMatch ? codeMatch[1] : "Unknown";
              const currentValue = codeMatch ? codeMatch[2] : "Unknown";
              
              // Extract recommended value from recommendation
              const recommendedMatch = issue.recommendation.match(/setting this ConVar to (\S+)/);
              const recommendedValue = recommendedMatch ? recommendedMatch[1] : "Default";
              
              return (
                <TableRow key={issue.id}>
                  <TableCell className="font-medium">{convarName}</TableCell>
                  <TableCell className="text-red-500 font-medium">{currentValue}</TableCell>
                  <TableCell>{recommendedValue}</TableCell>
                  <TableCell>
                    <Badge variant={issue.severity === "security" ? "destructive" : "warning"}>
                      {issue.severity === "security" ? "Security" : "Performance"}
                    </Badge>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>

      <Accordion type="single" collapsible className="w-full">
        <AccordionItem value="details">
          <AccordionTrigger>ConVar Details & Recommendations</AccordionTrigger>
          <AccordionContent>
            <div className="space-y-4 mt-4">
              {convarIssues.map((issue) => (
                <div key={issue.id} className="p-4 border rounded-md bg-background">
                  <h4 className="font-semibold text-lg mb-1">{issue.title}</h4>
                  <p className="text-muted-foreground mb-2">{issue.description}</p>
                  <div className="bg-zinc-900 p-3 rounded-md font-mono text-sm mb-2">
                    {issue.code}
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <span className="font-semibold">Recommendation:</span>
                    <span>{issue.recommendation}</span>
                  </div>
                </div>
              ))}
            </div>
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </div>
  );
}