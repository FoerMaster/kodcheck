import { useState } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { useQuery } from "@tanstack/react-query";
import { getConsoleCommand } from "@/utils/consoleCommand";
import { FaDiscord, FaGithub } from "react-icons/fa";

export default function Home() {
  const [serverIp, setServerIp] = useState("");
  const [_, setLocation] = useLocation();
  const { toast } = useToast();
  
  const { data: recentReports } = useQuery({
    queryKey: ['/api/reports?limit=5'],
  });
  
  const { data: commandData, isLoading: commandLoading } = useQuery({
    queryKey: [`/api/console-command${serverIp ? `?serverIp=${encodeURIComponent(serverIp)}` : ''}`],
    enabled: !!serverIp,
  });
  
  const handleGenerateCommand = () => {
    if (!serverIp) {
      toast({
        title: "Server IP Required",
        description: "Please enter your server IP address to generate a command.",
        variant: "destructive"
      });
      return;
    }
  };
  
  const copyCommand = () => {
    if (commandData?.command) {
      navigator.clipboard.writeText(commandData.command);
      toast({
        title: "Command Copied",
        description: "Console command copied to clipboard",
      });
    }
  };
  
  return (
    <div className="min-h-screen bg-gray-900 text-white flex flex-col">
      <header className="bg-gradient-to-r from-blue-900 to-indigo-900 border-b border-blue-800 py-6 px-6 shadow-xl">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center space-x-3">
            <div className="bg-blue-600 rounded-md p-2">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
              </svg>
            </div>
            <div>
              <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-indigo-300">GMod CodeScan</h1>
              <p className="text-blue-200 text-sm">Найди плохой код, уничтожь разработчиков.</p>
            </div>
          </div>
        </div>
      </header>
      
      <main className="flex-1 py-12 px-6 bg-gray-900">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col lg:flex-row gap-8">
            <div className="flex-1">
              <div className="mb-8">
                <h2 className="text-4xl font-bold mb-2 bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-indigo-300">Найди плохой код и эксплойты на твоём GMod сервере</h2>
                <div className="h-1 w-32 bg-gradient-to-r from-blue-500 to-indigo-500 rounded mb-4"></div>
                <p className="text-gray-300 text-lg">
                  Анализирует ваш сервер, находит проблемы производительности, уязвимости безопасности и другие проблемы.
                  Получите подробный отчет и рекомендации по улучшению производительности и безопасности вашего сервера.
                </p>
              </div>
              
              <Card className="bg-gray-800 border-gray-700 shadow-lg overflow-hidden">
                <CardHeader className="bg-gradient-to-r from-blue-900/50 to-indigo-900/50 border-b border-gray-700">
                  <CardTitle className="text-xl font-bold flex items-center">
                    <svg className="w-5 h-5 mr-2 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path>
                    </svg>
                    Запустите эту команду в консоли GMod
                  </CardTitle>
                  <CardDescription className="text-gray-300">
                    Введите IP вашего сервера для генерации персонализированной команды
                  </CardDescription>
                </CardHeader>
                <CardContent className="p-6">
                  <div className="flex mb-4">
                    <Input 
                      type="text" 
                      placeholder="IP вашего сервера (например, 192.168.1.100:27015)"
                      value={serverIp}
                      onChange={(e) => setServerIp(e.target.value)}
                      className="bg-gray-900 border-gray-700 text-gray-100"
                    />
                    <Button 
                      onClick={handleGenerateCommand} 
                      className="ml-2 bg-blue-600 hover:bg-blue-700"
                      disabled={commandLoading}
                    >
                      Сгенерировать
                    </Button>
                  </div>
                  
                  {commandData?.command && (
                    <div className="bg-gray-900 p-4 rounded-md font-mono text-sm overflow-x-auto relative border border-gray-700">
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="absolute top-2 right-2 h-7 w-7 p-0 bg-blue-600/20 hover:bg-blue-600/40 text-blue-400" 
                        onClick={copyCommand}
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                        </svg>
                      </Button>
                      <code className="text-blue-300 whitespace-pre-wrap">{commandData.command}</code>
                    </div>
                  )}
                </CardContent>
                <CardFooter className="text-sm text-gray-400 bg-gray-800/50 border-t border-gray-700 py-3 px-6">
                  Эта команда проанализирует ваш сервер и сгенерирует подробный отчет.
                </CardFooter>
              </Card>
              
              <div className="mt-10 space-y-6">
                <h3 className="text-xl font-bold mb-4 text-gray-200">Что анализирует GMod CodeScan?</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-gray-800 p-5 rounded-lg border border-gray-700 shadow-md">
                    <div className="flex items-center space-x-3 mb-3">
                      <div className="bg-red-500/20 p-2 rounded-full">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      </div>
                      <h4 className="font-bold text-gray-200">Опасные функции в хуках</h4>
                    </div>
                    <p className="text-gray-400">Находит вызовы тяжелых функций в хуках рендеринга и других критических местах игрового цикла</p>
                  </div>
                  
                  <div className="bg-gray-800 p-5 rounded-lg border border-gray-700 shadow-md">
                    <div className="flex items-center space-x-3 mb-3">
                      <div className="bg-amber-500/20 p-2 rounded-full">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                        </svg>
                      </div>
                      <h4 className="font-bold text-gray-200">Уязвимости безопасности</h4>
                    </div>
                    <p className="text-gray-400">Обнаруживает RunString и CompileString в сетевом коде, что может привести к RCE</p>
                  </div>
                  
                  <div className="bg-gray-800 p-5 rounded-lg border border-gray-700 shadow-md">
                    <div className="flex items-center space-x-3 mb-3">
                      <div className="bg-blue-500/20 p-2 rounded-full">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                        </svg>
                      </div>
                      <h4 className="font-bold text-gray-200">Анализ аддонов</h4>
                    </div>
                    <p className="text-gray-400">Проверяет все установленные аддоны на наличие проблем и показывает, какие из них самые проблемные</p>
                  </div>
                  
                  <div className="bg-gray-800 p-5 rounded-lg border border-gray-700 shadow-md">
                    <div className="flex items-center space-x-3 mb-3">
                      <div className="bg-green-500/20 p-2 rounded-full">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      </div>
                      <h4 className="font-bold text-gray-200">Рекомендации по исправлению</h4>
                    </div>
                    <p className="text-gray-400">Предоставляет подробные примеры кода и рекомендации по устранению найденных проблем</p>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="lg:w-96">
              <Card className="bg-gray-800 border-gray-700 shadow-lg overflow-hidden">
                <CardHeader className="bg-gradient-to-r from-blue-900/50 to-indigo-900/50 border-b border-gray-700">
                  <CardTitle>Недавние отчеты</CardTitle>
                  <CardDescription className="text-gray-300">
                    Просмотр недавно проанализированных серверов
                  </CardDescription>
                </CardHeader>
                <CardContent className="p-0">
                  {recentReports?.length > 0 ? (
                    <ul className="divide-y divide-gray-700">
                      {recentReports.map((report: any) => (
                        <li 
                          key={report.reportId} 
                          className="p-4 hover:bg-gray-700 cursor-pointer transition-colors"
                          onClick={() => setLocation(`/report/${report.reportId}`)}
                        >
                          <div className="flex justify-between items-start">
                            <div>
                              <p className="font-medium text-gray-200">{report.serverIp}</p>
                              <p className="text-sm text-gray-400">
                                {new Date(report.scanDate).toLocaleDateString()}
                              </p>
                            </div>
                            <div className="flex items-center space-x-1">
                              <span className="px-2 py-1 bg-red-500/20 text-red-400 rounded text-xs">
                                {report.critical} критич.
                              </span>
                            </div>
                          </div>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <div className="text-center py-10 text-gray-400">
                      <svg className="w-12 h-12 mx-auto text-gray-600 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
                      </svg>
                      <p>Отчетов пока нет</p>
                      <p className="text-sm mt-1">Просканируйте ваш сервер, чтобы создать отчет</p>
                    </div>
                  )}
                </CardContent>
              </Card>
              
              <div className="mt-6 bg-gray-800 rounded-lg border border-gray-700 p-5 shadow-lg">
                <h3 className="text-lg font-bold mb-3 text-gray-200">О проекте</h3>
                <p className="text-gray-400 mb-4">
                  GMod CodeScan - это веб-версия BadCoderz, инструмента для анализа кода серверов Garry's Mod. 
                  Проект помогает находить проблемы производительности и безопасности в вашем коде и аддонах.
                </p>
                <div className="flex space-x-3">
                  <a 
                    href="https://github.com/ExtReMLapin/BadCoderz" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="flex items-center space-x-2 text-blue-400 hover:text-blue-300 transition-colors"
                  >
                    <FaGithub className="h-4 w-4" />
                    <span>GitHub</span>
                  </a>
                  <a 
                    href="https://steamcommunity.com/sharedfiles/filedetails/?id=1955436281" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="flex items-center space-x-2 text-blue-400 hover:text-blue-300 transition-colors"
                  >
                    <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path d="M11.979 0C5.678 0 .511 4.86.022 11.037l6.432 2.658c.545-.371 1.203-.59 1.912-.59.063 0 .125.004.188.006l2.861-4.142V8.91c0-2.495 2.028-4.524 4.524-4.524 2.494 0 4.524 2.031 4.524 4.527s-2.03 4.525-4.524 4.525h-.105l-4.076 2.911c0 .052.004.105.004.159 0 1.875-1.515 3.396-3.39 3.396-1.635 0-3.016-1.173-3.331-2.727L.436 15.27C1.862 20.307 6.486 24 11.979 24c6.627 0 11.999-5.373 11.999-12S18.605 0 11.979 0zM7.54 18.21l-1.473-.61c.262.543.714.999 1.314 1.25 1.297.539 2.793-.076 3.332-1.375.263-.63.264-1.319.005-1.949s-.75-1.121-1.377-1.383c-.624-.26-1.29-.249-1.878-.03l1.523.63c.956.4 1.409 1.5 1.009 2.455-.397.957-1.497 1.41-2.454 1.012H7.54zm11.415-9.303c0-1.662-1.353-3.015-3.015-3.015-1.665 0-3.015 1.353-3.015 3.015 0 1.665 1.35 3.015 3.015 3.015 1.663 0 3.015-1.35 3.015-3.015zm-5.273-.005c0-1.252 1.013-2.266 2.265-2.266 1.249 0 2.266 1.014 2.266 2.266 0 1.251-1.017 2.265-2.266 2.265-1.253 0-2.265-1.014-2.265-2.265z"/>
                    </svg>
                    <span>Workshop</span>
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
      
      <footer className="bg-gradient-to-r from-blue-900 to-indigo-900 border-t border-blue-800 py-6 px-6">
        <div className="max-w-7xl mx-auto text-center">
          <p className="text-gray-300">
            Основано на <a href="https://github.com/ExtReMLapin/BadCoderz" className="text-blue-300 hover:underline" target="_blank" rel="noopener noreferrer">BadCoderz</a> от ExtReMLapin
          </p>
        </div>
      </footer>
    </div>
  );
}
