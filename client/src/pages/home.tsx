import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { Copy, Terminal } from "lucide-react";

export default function Home() {
  const [command, setCommand] = useState("");
  const [scanId, setScanId] = useState("");
  const [isScanning, setIsScanning] = useState(false);
  const { toast } = useToast();
  const [, setLocation] = useLocation();

  useEffect(() => {
    if (scanId) {
      // Always use secure WebSocket in production
      const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
      const secure = process.env.NODE_ENV === "production";
      const wsProtocol = secure ? "wss:" : protocol;

      const ws = new WebSocket(`${wsProtocol}//${window.location.host}/ws`);

      ws.onopen = () => {
        ws.send(JSON.stringify({ type: "scan_id", scanId }));
      };

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          if (data.type === "scan_complete" && data.reportId) {
            setIsScanning(false);
            setLocation(`/report/${data.reportId}`);
          }
        } catch (error) {
          console.error("WebSocket message error:", error);
        }
      };

      ws.onclose = () => {
        setIsScanning(false);
      };

      return () => {
        ws.close();
      };
    }
  }, [scanId, setLocation]);

  const generateCommand = async () => {
    try {
      const res = await apiRequest("GET", "/api/console-command");
      const data = await res.json();
      setCommand(data.command);
      setScanId(data.scanId);
      setIsScanning(true);

      toast({
        title: "Command generated",
        description: "Copy and paste this command into your server's console",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to generate command",
        variant: "destructive",
      });
    }
  };

  const copyCommand = () => {
    navigator.clipboard.writeText(command);
    toast({
      title: "Copied!",
      description: "Command copied to clipboard",
    });
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="w-full max-w-lg">
        <CardHeader>
          <CardTitle className="text-2xl flex items-center gap-2">
            <Terminal className="h-6 w-6" />
            Garry's Mod Server Scanner
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <Button
            className="w-full"
            onClick={generateCommand}
            disabled={isScanning}
          >
            {isScanning ? "Waiting for scan..." : "Generate Scan Command"}
          </Button>

          {command && (
            <div className="space-y-2">
              <div className="relative">
                <pre className="bg-muted p-4 rounded-lg text-sm overflow-x-auto">
                  {command}
                </pre>
                <Button
                  variant="outline"
                  size="icon"
                  className="absolute top-2 right-2"
                  onClick={copyCommand}
                >
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
              <p className="text-sm text-muted-foreground mt-2">
                Copy this command and paste it into your server's console. Once the
                scan is complete, you'll be redirected to the results page.
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}