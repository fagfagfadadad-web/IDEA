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
    icon: <Palette size={20} />,
    url: 'https://www.figma.com',
    description: 'Design and prototype',
    color: 'bg-purple-500'
  },
  {
    id: 'canva',
    name: 'Canva',
    icon: <Image size={20} />,
    url: 'https://www.canva.com',
    description: 'Create graphics and designs',
    color: 'bg-blue-500'
  },
  {
    id: 'trello',
    name: 'Trello',
    icon: <Trello size={20} />,
    url: 'https://trello.com',
    description: 'Project management',
    color: 'bg-blue-600'
  },
  {
    id: 'notion',
    name: 'Notion',
    icon: <FileText size={20} />,
    url: 'https://www.notion.so',
    description: 'Notes and documentation',
    color: 'bg-gray-800'
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
          <h3 className="text-lg font-bold text-gray-800">External Tools</h3>
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