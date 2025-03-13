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
import { FaFolder, FaSearch, FaExclamationTriangle, FaCheckCircle, FaFile, FaPuzzlePiece } from "react-icons/fa";

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
    <div className="space-y-6" id="files">
      <div className="flex items-center space-x-2 mb-2">
        <FaFolder className="text-green-500 w-5 h-5" />
        <h2 className="text-2xl font-bold">Просканированные файлы</h2>
      </div>
      
      <div className="bg-gray-800 rounded-lg border border-gray-700 p-6 shadow-md">
        <div className="mb-6">
          <div className="relative">
            <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
              <FaSearch className="h-4 w-4 text-gray-400" />
            </div>
            <Input 
              type="search"
              placeholder="Поиск файлов по пути или названию аддона..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-gray-900 border-gray-700 text-gray-200 pl-10 py-2"
            />
          </div>
        </div>
        
        <div className="overflow-x-auto rounded-md border border-gray-700">
          <Table>
            <TableHeader className="bg-gradient-to-r from-green-900/30 to-blue-900/30">
              <TableRow className="hover:bg-gray-800 border-b border-gray-700">
                <TableHead className="text-gray-300 font-semibold">Путь к файлу</TableHead>
                <TableHead className="text-gray-300 font-semibold">Аддон</TableHead>
                <TableHead className="text-gray-300 font-semibold">Тип</TableHead>
                <TableHead className="text-gray-300 text-right font-semibold">Размер</TableHead>
                <TableHead className="text-gray-300 text-right font-semibold">Проблемы</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredFiles.length > 0 ? (
                filteredFiles.map((file, index) => (
                  <TableRow key={index} className="hover:bg-gray-750 border-b border-gray-700">
                    <TableCell className="font-mono text-sm text-gray-300">
                      <div className="flex items-start">
                        <FaFile className="h-4 w-4 mr-2 text-blue-400 mt-0.5 flex-shrink-0" />
                        <span className="truncate max-w-md">{file.path}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-gray-300">
                      <div className="flex items-center">
                        <FaPuzzlePiece className="h-3 w-3 mr-2 text-purple-400" />
                        {file.addon}
                      </div>
                    </TableCell>
                    <TableCell className="text-gray-300">
                      <span className="px-2 py-1 bg-blue-500/10 border border-blue-500/30 text-blue-400 rounded text-xs">
                        {file.type}
                      </span>
                    </TableCell>
                    <TableCell className="text-right text-gray-300 font-mono">{formatFileSize(file.size)}</TableCell>
                    <TableCell className="text-right">
                      {file.issues > 0 ? (
                        <div className="px-2 py-1 bg-red-500/10 border border-red-500/30 text-red-400 rounded text-xs inline-flex items-center">
                          <FaExclamationTriangle className="mr-1 h-3 w-3" />
                          {file.issues}
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
                  <TableCell colSpan={5} className="h-24 text-center text-gray-400">
                    Файлов, соответствующих запросу, не найдено.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
        
        <div className="mt-4 text-sm text-gray-400 flex justify-between items-center">
          <div>
            <span className="font-mono bg-gray-700/50 px-2 py-1 rounded">
              {files.reduce((total, file) => total + file.size, 0)} байт
            </span>
            <span className="ml-2">всего просканировано</span>
          </div>
          <div>
            Показано {filteredFiles.length} из {files.length} файлов
          </div>
        </div>
      </div>
    </div>
  );
}

// Helper function to format file size
function formatFileSize(bytes: number): string {
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
}
