import React, { useState } from 'react';
import { ExternalLink, Palette, Image, Trello, FileText, X } from 'lucide-react';
import { Button } from 'components';

interface ExternalTool {
  id: string;
  name: string;
  icon: React.ReactNode;
  url: string;
  description: string;
  color: string;
}

const externalTools: ExternalTool[] = [
  {
    id: 'figma',
    name: 'Figma',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
        <path d="M8 24C12.4183 24 16 20.4183 16 16V12H8C3.58172 12 0 15.5817 0 20C0 22.2091 1.79086 24 4 24H8Z" fill="#0ACF83"/>
        <path d="M0 12C0 7.58172 3.58172 4 8 4H16V12H8C3.58172 12 0 16.4183 0 12Z" fill="#A259FF"/>
        <path d="M0 4C0 1.79086 1.79086 0 4 0H8C12.4183 0 16 3.58172 16 8V12H8C3.58172 12 0 8.41828 0 4Z" fill="#F24E1E"/>
        <path d="M16 0H20C22.2091 0 24 1.79086 24 4C24 8.41828 20.4183 12 16 12V0Z" fill="#FF7262"/>
        <path d="M24 16C24 20.4183 20.4183 24 16 24C11.5817 24 8 20.4183 8 16C8 11.5817 11.5817 8 16 8C20.4183 8 24 11.5817 24 16Z" fill="#1ABCFE"/>
      </svg>
    ),
    url: 'https://www.figma.com',
    description: 'Design and prototype',
    color: 'bg-purple-500'
  },
  {
    id: 'canva',
    name: 'Canva',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
        <rect width="24" height="24" rx="4" fill="#00C4CC"/>
        <path d="M7.5 12C7.5 9.51472 9.51472 7.5 12 7.5C14.4853 7.5 16.5 9.51472 16.5 12C16.5 14.4853 14.4853 16.5 12 16.5C9.51472 16.5 7.5 14.4853 7.5 12Z" fill="white"/>
        <path d="M12 10.5C11.1716 10.5 10.5 11.1716 10.5 12C10.5 12.8284 11.1716 13.5 12 13.5C12.8284 13.5 13.5 12.8284 13.5 12C13.5 11.1716 12.8284 10.5 12 10.5Z" fill="#00C4CC"/>
      </svg>
    ),
    url: 'https://www.canva.com',
    description: 'Create graphics and designs',
    color: 'bg-blue-500'
  },
  {
    id: 'trello',
    name: 'Trello',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
        <rect width="24" height="24" rx="3" fill="#0079BF"/>
        <rect x="4" y="4" width="6" height="12" rx="1" fill="white"/>
        <rect x="14" y="4" width="6" height="8" rx="1" fill="white"/>
      </svg>
    ),
    url: 'https://trello.com',
    description: 'Project management',
    color: 'bg-blue-600'
  },
  {
    id: 'notion',
    name: 'Notion',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
        <rect width="24" height="24" rx="3" fill="#000000"/>
        <path d="M4 6L20 6L18 18L6 18L4 6Z" fill="white"/>
        <path d="M8 10L16 10" stroke="#000000" strokeWidth="1"/>
        <path d="M8 12L16 12" stroke="#000000" strokeWidth="1"/>
        <path d="M8 14L14 14" stroke="#000000" strokeWidth="1"/>
      </svg>
    ),
    url: 'https://www.notion.so',
    description: 'Notes and documentation',
    color: 'bg-gray-800'
  },
  {
    id: 'github',
    name: 'GitHub',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
        <path fillRule="evenodd" clipRule="evenodd" d="M12 0C5.37 0 0 5.37 0 12C0 17.31 3.435 21.795 8.205 23.385C8.805 23.49 9.03 23.13 9.03 22.815C9.03 22.53 9.015 21.585 9.015 20.58C6 21.135 5.22 19.845 4.98 19.17C4.845 18.825 4.26 17.76 3.75 17.475C3.33 17.25 2.73 16.695 3.735 16.68C4.68 16.665 5.355 17.55 5.58 17.91C6.66 19.725 8.385 19.215 9.075 18.9C9.18 18.12 9.495 17.595 9.84 17.295C7.17 16.995 4.38 15.96 4.38 11.37C4.38 10.065 4.845 8.985 5.61 8.145C5.49 7.845 5.07 6.615 5.73 4.965C5.73 4.965 6.735 4.65 9.03 6.195C9.99 5.925 11.01 5.79 12.03 5.79C13.05 5.79 14.07 5.925 15.03 6.195C17.325 4.635 18.33 4.965 18.33 4.965C18.99 6.615 18.57 7.845 18.45 8.145C19.215 8.985 19.68 10.05 19.68 11.37C19.68 15.975 16.875 16.995 14.205 17.295C14.64 17.67 15.015 18.39 15.015 19.515C15.015 21.12 15 22.41 15 22.815C15 23.13 15.225 23.505 15.825 23.385C18.2072 22.5807 20.2772 21.0497 21.7437 19.0074C23.2101 16.965 23.9993 14.5143 24 12C24 5.37 18.63 0 12 0Z" fill="#181717"/>
      </svg>
    ),
    url: 'https://github.com',
    description: 'Code repositories',
    color: 'bg-gray-900'
  },
  {
    id: 'discord',
    name: 'Discord',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
        <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028c.462-.63.874-1.295 1.226-1.994a.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z" fill="#5865F2"/>
      </svg>
    ),
    url: 'https://discord.com',
    description: 'Team communication',
    color: 'bg-indigo-600'
  }
];

export const ExternalToolsWidget: React.FC = () => {
  const [selectedTool, setSelectedTool] = useState<ExternalTool | null>(null);
  const [showIframe, setShowIframe] = useState(false);

  const handleToolClick = (tool: ExternalTool) => {
    // For now, we'll open in a new tab since iframe has limitations
    // In the future, this could be enhanced with proper API integrations
    window.open(tool.url, '_blank', 'noopener,noreferrer');
  };

  const handleIframeOpen = (tool: ExternalTool) => {
    setSelectedTool(tool);
    setShowIframe(true);
  };

  return (
    <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h3 className="text-lg font-bold text-gray-800">Workspace Tools</h3>
          <p className="text-gray-600 text-sm">Quick access to your favorite design and productivity tools</p>
        </div>

        {/* Tools Grid */}
        <div className="grid grid-cols-2 gap-4">
          {externalTools.map((tool) => (
            <div
              key={tool.id}
              onClick={() => handleToolClick(tool)}
              className="p-4 border border-gray-200 rounded-lg hover:shadow-md transition-all duration-200 cursor-pointer group"
            >
              <div className="flex flex-col items-center text-center space-y-3">
                <div className={`w-12 h-12 ${tool.color} rounded-lg flex items-center justify-center text-white group-hover:scale-110 transition-transform duration-200`}>
                  {tool.icon}
                </div>
                <div>
                  <h4 className="font-semibold text-gray-800">{tool.name}</h4>
                  <p className="text-gray-600 text-xs">{tool.description}</p>
                </div>
                <ExternalLink size={14} className="text-gray-400 group-hover:text-indigo-600 transition-colors" />
              </div>
            </div>
          ))}
        </div>

        {/* Info Note */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-start gap-2">
            <div className="text-blue-600 mt-0.5">ℹ️</div>
            <div>
              <p className="text-blue-800 font-medium text-sm">External Tools</p>
              <p className="text-blue-700 text-xs">
                These tools will open in a new tab. For deeper integration with API access, 
                additional setup and authentication would be required.
              </p>
            </div>
          </div>
        </div>

        {/* Future Enhancement Note */}
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
          <h4 className="font-semibold text-gray-700 mb-2">Coming Soon</h4>
          <ul className="text-gray-600 text-sm space-y-1">
            <li>• Direct Figma project integration</li>
            <li>• Canva design templates</li>
            <li>• Trello board synchronization</li>
            <li>• Google Drive file access</li>
          </ul>
        </div>
      </div>

      {/* Iframe Modal (for future use) */}
      {showIframe && selectedTool && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl w-full max-w-6xl h-[80vh] overflow-hidden">
            <div className="bg-gray-50 border-b border-gray-200 p-4">
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-3">
                  <div className={`w-8 h-8 ${selectedTool.color} rounded-lg flex items-center justify-center text-white`}>
                    {selectedTool.icon}
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-gray-800">{selectedTool.name}</h3>
                    <p className="text-gray-600 text-sm">{selectedTool.description}</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowIframe(false)}
                  className="text-gray-400 hover:text-gray-600 p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <X size={20} />
                </button>
              </div>
            </div>
            <div className="h-full">
              <iframe
                src={selectedTool.url}
                className="w-full h-full border-0"
                title={selectedTool.name}
                sandbox="allow-same-origin allow-scripts allow-forms"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};