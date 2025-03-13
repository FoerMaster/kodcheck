import { Link } from "wouter";
import { FaHome, FaExclamationTriangle, FaLock, FaFolder, FaPuzzlePiece, FaShare, FaFileExport } from "react-icons/fa";

interface ServerInfo {
  ip: string;
  gmodVersion: string;
  scanDate: string;
}

interface SidebarProps {
  serverInfo: ServerInfo;
  activeSection: string;
  onSectionChange: (section: string) => void;
}

export default function Sidebar({ serverInfo, activeSection, onSectionChange }: SidebarProps) {
  const navItems = [
    {
      id: "overview",
      label: "Обзор",
      icon: <FaHome className="h-4 w-4 mr-3 text-blue-400" />
    },
    {
      id: "issues",
      label: "Проблемы кода",
      icon: <FaExclamationTriangle className="h-4 w-4 mr-3 text-red-400" />
    },
    {
      id: "exploits",
      label: "Потенциальные эксплойты",
      icon: <FaLock className="h-4 w-4 mr-3 text-amber-400" />
    },
    {
      id: "files",
      label: "Просканированные файлы",
      icon: <FaFolder className="h-4 w-4 mr-3 text-green-400" />
    },
    {
      id: "addons",
      label: "Аддоны",
      icon: <FaPuzzlePiece className="h-4 w-4 mr-3 text-purple-400" />
    }
  ];
  
  return (
    <div className="w-full lg:w-64 bg-gray-900 border-r border-gray-800 flex flex-col shadow-xl">
      {/* Logo area */}
      <div className="p-4 border-b border-gray-800 bg-gradient-to-r from-blue-900 to-indigo-900">
        <div className="flex items-center space-x-2">
          <div className="bg-blue-600 rounded-md p-1.5">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
            </svg>
          </div>
          <Link href="/">
            <div className="cursor-pointer">
              <span className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-indigo-300">CodeScan</span>
              <div className="text-xs text-blue-300">BadCoderz Web Edition</div>
            </div>
          </Link>
        </div>
      </div>

      {/* Navigation */}
      <nav className="py-4 flex-grow">
        <div className="px-4 mb-2 text-sm font-medium text-blue-300 uppercase tracking-wider">Отчет</div>
        
        {navItems.map(item => (
          <a 
            key={item.id}
            href={`#${item.id}`}
            className={`flex items-center px-4 py-2 text-sm font-medium ${
              activeSection === item.id 
                ? 'text-white bg-gray-800 border-l-2 border-blue-500' 
                : 'text-gray-300 hover:bg-gray-800 hover:text-white border-l-2 border-transparent'
            } mb-1 transition-all duration-150`}
            onClick={(e) => {
              e.preventDefault();
              onSectionChange(item.id);
              document.getElementById(item.id)?.scrollIntoView({ behavior: 'smooth' });
              window.history.pushState(null, '', `#${item.id}`);
            }}
          >
            {item.icon}
            {item.label}
          </a>
        ))}
        
        <div className="px-4 my-4 text-sm font-medium text-blue-300 uppercase tracking-wider">Действия</div>
        <a 
          href="#" 
          className="flex items-center px-4 py-2 text-sm font-medium text-gray-300 hover:bg-gray-800 hover:text-white mb-1 border-l-2 border-transparent transition-all duration-150"
          onClick={(e) => {
            e.preventDefault();
            const url = window.location.href;
            navigator.clipboard.writeText(url);
          }}
        >
          <FaShare className="h-4 w-4 mr-3 text-blue-400" />
          Поделиться отчетом
        </a>
        <a 
          href="#" 
          className="flex items-center px-4 py-2 text-sm font-medium text-gray-300 hover:bg-gray-800 hover:text-white mb-1 border-l-2 border-transparent transition-all duration-150"
          onClick={(e) => {
            e.preventDefault();
            // Handled in parent component
          }}
        >
          <FaFileExport className="h-4 w-4 mr-3 text-blue-400" />
          Экспорт отчета
        </a>
      </nav>

      {/* Server info */}
      <div className="p-4 border-t border-gray-800 bg-gray-800">
        <div className="text-xs font-medium text-blue-300 uppercase tracking-wider mb-3">Информация о сервере</div>
        <div className="bg-gray-900 rounded-lg p-3 border border-gray-700 text-sm space-y-2">
          <div className="flex justify-between items-center">
            <span className="text-gray-400">IP:</span>
            <span className="text-gray-200 font-mono">{serverInfo.ip}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-gray-400">GMod:</span>
            <span className="text-gray-200">{serverInfo.gmodVersion}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-gray-400">Дата сканирования:</span>
            <span className="text-gray-200">{serverInfo.scanDate}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
