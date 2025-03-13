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
import { Progress } from "@/components/ui/progress";

interface Addon {
  name: string;
  files: number;
  issues: number;
}

interface AddonsProps {
  addons: Addon[];
}

export default function Addons({ addons }: AddonsProps) {
  const [searchQuery, setSearchQuery] = useState("");
  
  const filteredAddons = addons.filter(addon => 
    addon.name.toLowerCase().includes(searchQuery.toLowerCase())
  );
  
  // Calculate the max issues for progress bar scaling
  const maxIssues = Math.max(...addons.map(addon => addon.issues), 1);
  
  return (
    <>
      <h2 className="text-xl font-bold mb-4">Addons</h2>
      
      <div className="bg-slate-800 rounded-lg border border-slate-700 p-4">
        <div className="mb-4">
          <Input 
            type="search"
            placeholder="Search addons by name..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="bg-slate-700 border-slate-600"
          />
        </div>
        
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-slate-800">
                <TableHead className="text-slate-300">Addon Name</TableHead>
                <TableHead className="text-slate-300 text-right">Files</TableHead>
                <TableHead className="text-slate-300">Issues Distribution</TableHead>
                <TableHead className="text-slate-300 text-right">Issues Count</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredAddons.length > 0 ? (
                filteredAddons
                  .sort((a, b) => b.issues - a.issues) // Sort by issues count (descending)
                  .map((addon, index) => (
                    <TableRow key={index} className="hover:bg-slate-700">
                      <TableCell className="font-medium">{addon.name}</TableCell>
                      <TableCell className="text-right">{addon.files}</TableCell>
                      <TableCell>
                        <div className="flex items-center">
                          <Progress 
                            value={(addon.issues / maxIssues) * 100} 
                            className="h-2"
                          />
                          <span className="ml-2 text-xs text-slate-400">
                            {((addon.issues / maxIssues) * 100).toFixed(1)}%
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        {addon.issues > 0 ? (
                          <span className="px-2 py-1 bg-red-500/20 text-red-400 rounded text-xs">
                            {addon.issues}
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
                  <TableCell colSpan={4} className="h-24 text-center">
                    No addons found matching your search.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
        
        <div className="mt-4 text-sm text-slate-400 text-right">
          Showing {filteredAddons.length} of {addons.length} addons
        </div>
      </div>
    </>
  );
}
