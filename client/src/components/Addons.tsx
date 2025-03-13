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
import { FaPuzzlePiece, FaSearch, FaExclamationTriangle, FaCheckCircle } from "react-icons/fa";

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
    <div className="space-y-6" id="addons">
      <div className="flex items-center space-x-2 mb-2">
        <FaPuzzlePiece className="text-purple-500 w-5 h-5" />
        <h2 className="text-2xl font-bold">Аддоны</h2>
      </div>
      
      <div className="bg-gray-800 rounded-lg border border-gray-700 p-6 shadow-md">
        <div className="mb-6">
          <div className="relative">
            <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
              <FaSearch className="h-4 w-4 text-gray-400" />
            </div>
            <Input 
              type="search"
              placeholder="Поиск аддонов по названию..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-gray-900 border-gray-700 text-gray-200 pl-10 py-2"
            />
          </div>
        </div>
        
        <div className="overflow-x-auto rounded-md border border-gray-700">
          <Table>
            <TableHeader className="bg-gradient-to-r from-purple-900/30 to-indigo-900/30">
              <TableRow className="hover:bg-gray-800 border-b border-gray-700">
                <TableHead className="text-gray-300 font-semibold">Название аддона</TableHead>
                <TableHead className="text-gray-300 text-center font-semibold">Файлов</TableHead>
                <TableHead className="text-gray-300 font-semibold">Распределение проблем</TableHead>
                <TableHead className="text-gray-300 text-right font-semibold">Проблем</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredAddons.length > 0 ? (
                filteredAddons
                  .sort((a, b) => b.issues - a.issues) // Sort by issues count (descending)
                  .map((addon, index) => (
                    <TableRow key={index} className="hover:bg-gray-750 border-b border-gray-700">
                      <TableCell className="font-medium text-gray-200">
                        <div className="flex items-center">
                          <FaPuzzlePiece className="h-4 w-4 mr-2 text-purple-400" />
                          {addon.name}
                        </div>
                      </TableCell>
                      <TableCell className="text-center text-gray-300">{addon.files}</TableCell>
                      <TableCell className="w-64">
                        <div className="flex items-center">
                          <div className="flex-1 mr-3">
                            <div className={`h-2 w-full rounded-full overflow-hidden ${addon.issues > 0 ? 'bg-gray-700' : 'bg-gray-800'}`}>
                              <div 
                                className={`h-full ${
                                  addon.issues > (maxIssues/2) 
                                    ? 'bg-gradient-to-r from-red-500 to-red-400' 
                                    : addon.issues > 0 
                                      ? 'bg-gradient-to-r from-amber-500 to-amber-400' 
                                      : 'bg-gradient-to-r from-green-500 to-green-400'
                                }`}
                                style={{ width: `${(addon.issues / maxIssues) * 100}%` }}
                              />
                            </div>
                          </div>
                          <span className="text-xs text-gray-400 w-12 text-right">
                            {((addon.issues / maxIssues) * 100).toFixed(0)}%
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        {addon.issues > 0 ? (
                          <div className="px-2 py-1 bg-red-500/10 border border-red-500/30 text-red-400 rounded text-xs inline-flex items-center">
                            <FaExclamationTriangle className="mr-1 h-3 w-3" />
                            {addon.issues}
                          </div>
                        ) : (
                          <div className="px-2 py-1 bg-green-500/10 border border-green-500/30 text-green-400 rounded text-xs inline-flex items-center">
                            <FaCheckCircle className="mr-1 h-3 w-3" />
                            0
                          </div>
                        )}
                      </TableCell>
                    </TableRow>
                  ))
              ) : (
                <TableRow>
                  <TableCell colSpan={4} className="h-24 text-center text-gray-400">
                    Аддонов, соответствующих запросу, не найдено.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
        
        <div className="mt-4 text-sm text-gray-400 text-right">
          Показано {filteredAddons.length} из {addons.length} аддонов
        </div>
      </div>
    </div>
  );
}
