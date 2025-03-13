import { useState } from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { highlightCode } from "@/utils/codeHighlight";
import { FaExclamationTriangle, FaCopy, FaLightbulb, FaExternalLinkAlt, FaCode, FaCheck } from "react-icons/fa";

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
      title: "Скопировано в буфер обмена",
      description: "Фрагмент кода успешно скопирован",
    });
  };
  
  const filteredIssues = issues.filter(issue => {
    if (filter === "all") return true;
    if (filter === "critical") return issue.severity === "critical";
    if (filter === "performance") return issue.severity === "performance";
    return true;
  });
  
  const getSeverityColor = (severity: string) => {
    switch (severity.toLowerCase()) {
      case 'critical':
        return 'bg-red-500/20 text-red-400 border-red-600/50';
      case 'high':
        return 'bg-orange-500/20 text-orange-400 border-orange-600/50';
      case 'medium':
        return 'bg-yellow-500/20 text-yellow-400 border-yellow-600/50';
      case 'low':
        return 'bg-blue-500/20 text-blue-400 border-blue-600/50';
      case 'performance':
        return 'bg-purple-500/20 text-purple-400 border-purple-600/50';
      default:
        return 'bg-gray-500/20 text-gray-400 border-gray-600/50';
    }
  };
  
  const getSeverityIcon = (severity: string) => {
    switch (severity.toLowerCase()) {
      case 'critical':
      case 'high':
        return <FaExclamationTriangle className="text-red-500" />;
      case 'performance':
        return <FaLightbulb className="text-purple-400" />;
      default:
        return <FaExclamationTriangle className="text-amber-500" />;
    }
  };
  
  return (
    <div className="space-y-6" id="issues">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-2">
        <div className="flex items-center space-x-2">
          <FaExclamationTriangle className="text-red-500 w-5 h-5" />
          <h2 className="text-2xl font-bold">Проблемы в коде</h2>
        </div>
        <div className="flex items-center space-x-2">
          <span className="text-sm text-gray-400">Фильтр:</span>
          <Select value={filter} onValueChange={setFilter}>
            <SelectTrigger className="w-[180px] bg-gray-800 border-gray-700 text-gray-200">
              <SelectValue placeholder="Все проблемы" />
            </SelectTrigger>
            <SelectContent className="bg-gray-800 border-gray-700 text-gray-200">
              <SelectItem value="all">Все проблемы</SelectItem>
              <SelectItem value="critical">Только критические</SelectItem>
              <SelectItem value="performance">Проблемы производительности</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Issues list */}
      <div className="space-y-6">
        {filteredIssues.length > 0 ? (
          filteredIssues.map(issue => (
            <div key={issue.id} className="bg-gray-800 rounded-lg border border-gray-700 overflow-hidden shadow-md">
              {/* Issue header */}
              <div className="bg-gradient-to-r from-blue-900/50 to-indigo-900/50 p-4 flex flex-col md:flex-row md:items-center md:justify-between border-b border-gray-700">
                <div className="flex items-start space-x-3">
                  <div className={`${getSeverityColor(issue.severity)} p-2 rounded-full border`}>
                    {getSeverityIcon(issue.severity)}
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-100">{issue.title}</h3>
                    <p className="text-sm text-gray-300">{issue.description}</p>
                  </div>
                </div>
                <div className="flex items-center space-x-2 mt-3 md:mt-0">
                  <span className={`px-2 py-1 ${getSeverityColor(issue.severity)} rounded text-xs font-medium border`}>
                    {issue.severity.toUpperCase()}
                  </span>
                  <span className="px-2 py-1 bg-gray-700 rounded text-xs font-medium text-gray-300">
                    {issue.occurrences} найдено
                  </span>
                </div>
              </div>
              
              {/* Issue body */}
              <div className="p-6">
                <div className="mb-6">
                  <h4 className="text-sm font-medium text-blue-400 uppercase tracking-wider mb-2 flex items-center">
                    <FaExclamationTriangle className="mr-2 h-3 w-3" />
                    Описание проблемы
                  </h4>
                  <div className="bg-gray-900 rounded-lg p-4 text-sm border border-gray-700">
                    <p className="text-gray-300">
                      {issue.description}
                    </p>
                  </div>
                </div>
                
                {/* Code preview */}
                <div className="mb-6">
                  <div className="flex justify-between items-center mb-2">
                    <h4 className="text-sm font-medium text-blue-400 uppercase tracking-wider flex items-center">
                      <FaCode className="mr-2 h-3 w-3" />
                      Предпросмотр кода
                    </h4>
                    <span className="text-xs text-gray-500 font-mono bg-gray-700/50 px-2 py-1 rounded">
                      {issue.filePath}:{issue.lineNumber}
                    </span>
                  </div>
                  <div className="bg-gray-900 rounded-lg p-4 font-mono text-sm overflow-x-auto relative border border-gray-700">
                    <button 
                      className="absolute top-2 right-2 text-blue-400 hover:text-blue-300 bg-blue-600/20 hover:bg-blue-600/30 p-1.5 rounded"
                      onClick={() => copyToClipboard(issue.code)}
                      title="Копировать код"
                    >
                      <FaCopy className="h-3 w-3" />
                    </button>
                    <pre className="text-blue-300">
                      {issue.code}
                    </pre>
                  </div>
                </div>
                
                {/* Recommendation */}
                <div className="mb-6">
                  <h4 className="text-sm font-medium text-blue-400 uppercase tracking-wider mb-2 flex items-center">
                    <FaLightbulb className="mr-2 h-3 w-3" />
                    Рекомендация
                  </h4>
                  <div className="bg-green-900/10 border border-green-700/20 rounded-lg p-4 text-sm">
                    <p className="text-gray-300">{issue.recommendation}</p>
                  </div>
                </div>
                
                {/* Documentation link */}
                {issue.documentationUrl && (
                  <div className="flex items-center">
                    <a 
                      href={issue.documentationUrl} 
                      className="text-blue-400 text-sm flex items-center hover:text-blue-300 transition-colors" 
                      target="_blank" 
                      rel="noopener noreferrer"
                    >
                      <FaExternalLinkAlt className="h-3 w-3 mr-2" />
                      Документация по функциям {issue.title.split(' ')[0]}
                    </a>
                  </div>
                )}
              </div>
            </div>
          ))
        ) : (
          <div className="bg-gray-800 rounded-lg border border-gray-700 p-8 text-center shadow-md">
            <div className="bg-green-500/20 h-16 w-16 rounded-full flex items-center justify-center mx-auto mb-4 border border-green-500/30">
              <FaCheck className="h-8 w-8 text-green-500" />
            </div>
            <h3 className="text-xl font-medium mb-2">Проблем не найдено!</h3>
            <p className="text-gray-400">Проблем, соответствующих выбранному фильтру, не найдено.</p>
          </div>
        )}
      </div>
    </div>
  );
}
