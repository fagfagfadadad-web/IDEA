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
      <svg width="20" height="20" viewBox="0 0 200 300" fill="none">
        <path d="M50 300c27.6 0 50-22.4 50-50v-50H50c-27.6 0-50 22.4-50 50s22.4 50 50 50z" fill="#0acf83"/>
        <path d="M0 150c0-27.6 22.4-50 50-50h50v100H50c-27.6 0-50-22.4-50-50z" fill="#a259ff"/>
        <path d="M0 50C0 22.4 22.4 0 50 0h50v100H50C22.4 100 0 77.6 0 50z" fill="#f24e1e"/>
        <path d="M100 0h50c27.6 0 50 22.4 50 50s-22.4 50-50 50h-50V0z" fill="#ff7262"/>
        <path d="M200 150c0 27.6-22.4 50-50 50s-50-22.4-50-50 22.4-50 50-50 50 22.4 50 50z" fill="#1abcfe"/>
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
        <rect width="24" height="24" rx="3" fill="#00c4cc"/>
        <path d="M8.5 6.5c-1.1 0-2 .9-2 2v7c0 1.1.9 2 2 2h7c1.1 0 2-.9 2-2v-7c0-1.1-.9-2-2-2h-7z" fill="white"/>
        <path d="M12 9.5c-1.4 0-2.5 1.1-2.5 2.5s1.1 2.5 2.5 2.5 2.5-1.1 2.5-2.5-1.1-2.5-2.5-2.5z" fill="#00c4cc"/>
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
      <svg width="20" height="20" viewBox="0 0 256 256" fill="none">
        <rect width="256" height="256" rx="25" fill="#0079bf"/>
        <rect x="25" y="25" width="95" height="150" rx="12" fill="white"/>
        <rect x="135" y="25" width="95" height="95" rx="12" fill="white"/>
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
      <svg width="20" height="20" viewBox="0 0 100 100" fill="none">
        <rect width="100" height="100" rx="15" fill="#000000"/>
        <path d="M6.017 4.313l55.333 -4.087c6.797 -0.583 8.543 -0.19 12.817 2.917l17.663 12.443c2.913 2.14 3.883 2.723 3.883 5.053v68.243c0 4.277 -1.553 6.807 -6.99 7.193L24.467 99.967c-4.08 0.193 -6.023 -0.39 -8.16 -3.113L3.3 79.94c-2.333 -3.113 -3.3 -5.443 -3.3 -8.167V11.113c0 -3.497 1.553 -6.413 6.017 -6.8z" fill="#ffffff"/>
        <path d="M61.35 0.227l-55.333 4.087C1.553 4.7 0 7.617 0 11.113v60.66c0 2.723 0.967 5.053 3.3 8.167l13.007 16.913c2.137 2.723 4.08 3.307 8.16 3.113l63.257 -3.89c5.433 -0.387 6.99 -2.917 6.99 -7.193V20.64c0 -2.21 -0.873 -2.847 -3.443 -4.733L74.167 3.143c-4.273 -3.107 -6.02 -3.5 -12.817 -2.917z" fill="#000000"/>
        <path d="M25.053 45.417c0 -2.723 2.317 -4.077 6.99 -3.883L85.6 43.803c6.99 0.387 9.317 2.723 9.317 6.23v1.167c0 2.723 -2.317 4.077 -6.99 3.883L34.37 52.813c-6.99 -0.387 -9.317 -2.723 -9.317 -6.23v-1.167z" fill="#ffffff"/>
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
      <svg width="20" height="20" viewBox="0 0 98 96" fill="none">
        <path fillRule="evenodd" clipRule="evenodd" d="M48.854 0C21.839 0 0 22 0 49.217c0 21.756 13.993 40.172 33.405 46.69 2.427.49 3.316-1.059 3.316-2.362 0-1.141-.08-5.052-.08-9.127-13.59 2.934-16.42-5.867-16.42-5.867-2.184-5.704-5.42-7.17-5.42-7.17-4.448-3.015.324-3.015.324-3.015 4.934.326 7.523 5.052 7.523 5.052 4.367 7.496 11.404 5.378 14.235 4.074.404-3.178 1.699-5.378 3.074-6.6-10.839-1.141-22.243-5.378-22.243-24.283 0-5.378 1.94-9.778 5.014-13.2-.485-1.222-2.184-6.275.486-13.038 0 0 4.125-1.304 13.426 5.052a46.97 46.97 0 0 1 12.214-1.63c4.125 0 8.33.571 12.213 1.63 9.302-6.356 13.427-5.052 13.427-5.052 2.67 6.763.97 11.816.485 13.038 3.155 3.422 5.015 7.822 5.015 13.2 0 18.905-11.404 23.06-22.324 24.283 1.78 1.548 3.316 4.481 3.316 9.126 0 6.6-.08 11.897-.08 13.526 0 1.304.89 2.853 3.316 2.364 19.412-6.52 33.405-24.935 33.405-46.691C97.707 22 75.788 0 48.854 0z" fill="#24292f"/>
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
      <svg width="20" height="20" viewBox="0 0 127.14 96.36" fill="none">
        <path d="M107.7,8.07A105.15,105.15,0,0,0,81.47,0a72.06,72.06,0,0,0-3.36,6.83A97.68,97.68,0,0,0,49,6.83,72.37,72.37,0,0,0,45.64,0,105.89,105.89,0,0,0,19.39,8.09C2.79,32.65-1.71,56.6.54,80.21h0A105.73,105.73,0,0,0,32.71,96.36,77.7,77.7,0,0,0,39.6,85.25a68.42,68.42,0,0,1-10.85-5.18c.91-.66,1.8-1.34,2.66-2a75.57,75.57,0,0,0,64.32,0c.87.71,1.76,1.39,2.66,2a68.68,68.68,0,0,1-10.87,5.19,77,77,0,0,0,6.89,11.1A105.25,105.25,0,0,0,126.6,80.22h0C129.24,52.84,122.09,29.11,107.7,8.07ZM42.45,65.69C36.18,65.69,31,60,31,53s5-12.74,11.43-12.74S54,46,53.89,53,48.84,65.69,42.45,65.69Zm42.24,0C78.41,65.69,73.25,60,73.25,53s5-12.74,11.44-12.74S96.23,46,96.12,53,91.08,65.69,84.69,65.69Z" fill="#5865f2"/>
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