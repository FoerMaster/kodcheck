import { useState } from "react";
import { Input } from "@/components/ui/input";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";

interface ScannedFile {
  path: string;
  addon: string;
  type: string;
  size: number;
  issues: number;
}

interface ScannedFilesProps {
  files: ScannedFile[];
}

export default function ScannedFiles({ files }: ScannedFilesProps) {
  const [searchQuery, setSearchQuery] = useState("");
  
  const filteredFiles = files.filter(file => 
    file.path.toLowerCase().includes(searchQuery.toLowerCase()) ||
    file.addon.toLowerCase().includes(searchQuery.toLowerCase())
  );
  
  return (
    <>
      <h2 className="text-xl font-bold mb-4">Scanned Files</h2>
      
      <div className="bg-slate-800 rounded-lg border border-slate-700 p-4">
        <div className="mb-4">
          <Input 
            type="search"
            placeholder="Search files by path or addon name..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="bg-slate-700 border-slate-600"
          />
        </div>
        
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-slate-800">
                <TableHead className="text-slate-300">File Path</TableHead>
                <TableHead className="text-slate-300">Addon</TableHead>
                <TableHead className="text-slate-300">Type</TableHead>
                <TableHead className="text-slate-300 text-right">Size</TableHead>
                <TableHead className="text-slate-300 text-right">Issues</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredFiles.length > 0 ? (
                filteredFiles.map((file, index) => (
                  <TableRow key={index} className="hover:bg-slate-700">
                    <TableCell className="font-mono text-sm">{file.path}</TableCell>
                    <TableCell>{file.addon}</TableCell>
                    <TableCell>{file.type}</TableCell>
                    <TableCell className="text-right">{formatFileSize(file.size)}</TableCell>
                    <TableCell className="text-right">
                      {file.issues > 0 ? (
                        <span className="px-2 py-1 bg-red-500/20 text-red-400 rounded text-xs">
                          {file.issues}
                        </span>
                      ) : (
                        <span className="px-2 py-1 bg-green-500/20 text-green-400 rounded text-xs">
                          0
                        </span>
                      )}
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={5} className="h-24 text-center">
                    No files found matching your search.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
        
        <div className="mt-4 text-sm text-slate-400 text-right">
          Showing {filteredFiles.length} of {files.length} files
        </div>
      </div>
    </>
  );
}

// Helper function to format file size
function formatFileSize(bytes: number): string {
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
}
