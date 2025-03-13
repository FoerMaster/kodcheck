import { Link } from "wouter";

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
      label: "Overview",
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>
      )
    },
    {
      id: "issues",
      label: "Bad Code Issues",
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
        </svg>
      )
    },
    {
      id: "exploits",
      label: "Potential Exploits",
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
        </svg>
      )
    },
    {
      id: "files",
      label: "Scanned Files",
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
        </svg>
      )
    },
    {
      id: "addons",
      label: "Addons",
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
        </svg>
      )
    }
  ];
  
  return (
    <div className="w-full lg:w-64 bg-slate-800 border-r border-slate-700 flex flex-col">
      {/* Logo area */}
      <div className="p-4 border-b border-slate-700 flex items-center">
        <div className="flex items-center space-x-2">
          <div className="bg-primary rounded-md p-1.5">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
            </svg>
          </div>
          <Link href="/">
            <span className="text-xl font-semibold cursor-pointer">CodeScan</span>
          </Link>
        </div>
      </div>

      {/* Navigation */}
      <nav className="py-4 flex-grow">
        <div className="px-4 mb-2 text-sm font-medium text-slate-400">REPORT</div>
        
        {navItems.map(item => (
          <a 
            key={item.id}
            href={`#${item.id}`}
            className={`flex items-center px-4 py-2 text-sm font-medium ${
              activeSection === item.id 
                ? 'text-white bg-slate-700' 
                : 'text-slate-300 hover:bg-slate-700 hover:text-white'
            } mb-1`}
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
        
        <div className="px-4 my-4 text-sm font-medium text-slate-400">ACTIONS</div>
        <a 
          href="#" 
          className="flex items-center px-4 py-2 text-sm font-medium text-slate-300 hover:bg-slate-700 hover:text-white mb-1"
          onClick={(e) => {
            e.preventDefault();
            const url = window.location.href;
            navigator.clipboard.writeText(url);
          }}
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
          </svg>
          Share Report
        </a>
        <a 
          href="#" 
          className="flex items-center px-4 py-2 text-sm font-medium text-slate-300 hover:bg-slate-700 hover:text-white mb-1"
          onClick={(e) => {
            e.preventDefault();
            // Handled in parent component
          }}
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
          </svg>
          Export Report
        </a>
      </nav>

      {/* Server info */}
      <div className="p-4 border-t border-slate-700">
        <div className="text-xs font-medium text-slate-400 mb-2">SERVER INFO</div>
        <div className="text-sm mb-1 flex justify-between">
          <span className="text-slate-400">IP:</span>
          <span>{serverInfo.ip}</span>
        </div>
        <div className="text-sm mb-1 flex justify-between">
          <span className="text-slate-400">GMod:</span>
          <span>{serverInfo.gmodVersion}</span>
        </div>
        <div className="text-sm mb-1 flex justify-between">
          <span className="text-slate-400">Scan Date:</span>
          <span>{serverInfo.scanDate}</span>
        </div>
      </div>
    </div>
  );
}
