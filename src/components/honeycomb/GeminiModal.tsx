import React, { useState, useEffect } from 'react';
import { X, Clock, AlertCircle, Info } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { GoogleGenAI } from "@google/genai";
import type { HoneycombItem, TaskPriority } from './canvas/HoneycombTypes';
import { 
  getRecentAIRequests, 
  createAIRequest, 
  canMakeAIRequest,
  type AIRequest 
} from '@/services/database';

interface GeminiModalProps {
  isOpen: boolean;
  onClose: () => void;
  onGenerate: (items: HoneycombItem[]) => void;
}

// Expanded set of icons for better task visualization
const AVAILABLE_ICONS = [
// Main workflow icons
'Target', 'Star', 'Flag', 'Timer', 'CheckCircle', 
    
// Technical icons
'Code', 'Terminal', 'Database', 'Webhook', 'FileCode', 'Boxes', 'LayoutGrid', 'Component', 'Braces', 'FolderGit',
'GitBranch', 'GitMerge', 'GitPullRequest', 'Codesandbox', 'Codepen', 'Figma',
    
// Analytics icons
'BarChart', 'PieChart', 'FileText', 'ClipboardList', 'FilePlus', 'FileCheck', 'FileX',
    
// Business icons
'Briefcase', 'Building', 'Users', 'Mail', 'MessageCircle', 'MessageSquare',
    
// Life & Productivity icons
'Calendar', 'Clock', 'CalendarDays', 'CalendarClock', 'ShoppingCart', 'Coffee', 'Heart',
    
// Home & Lifestyle
'Home', 'Settings', 'DollarSign', 'CreditCard', 'Truck', 'Hammer', 'Wrench', 'Lightbulb', 'Bed', 'Bath',
    
// Education icons
'GraduationCap', 'BookOpen', 'PenTool', 'Book', 'Pencil',
    
// Health & Wellness
'Activity', 'Apple', 'Dumbbell',
    
// Travel & Transport
'Map', 'Compass', 'Car', 'Plane', 'Train', 'Bus', 'Globe', 'Mountain', 'Hotel',
    
// Shopping & Commerce
'ShoppingBag', 'Package', 'Gift', 'Store', 'Pizza',
    
// Communication & Social
'Camera', 'Video', 'Share', 'Send', 'Reply', 'AtSign', 'Hash',
    
// Weather & Environment
'Sun', 'Moon', 'CloudRain', 'CloudSnow', 'Wind', 'Thermometer', 'Umbrella', 'Cloud',
    
// Security
'Lock', 'Unlock', 'Shield', 'ShieldAlert', 'ShieldCheck', 'Key', 'KeyRound', 'Fingerprint',
    
// Devices & Hardware
'Laptop', 'Printer', 'Phone', 'Headphones', 'Monitor', 'Smartphone', 'Tablet',
    
// Misc
'Bell', 'Bookmark', 'Archive', 'Tag', 'Zap', 'Plus'
];

const GeminiModal: React.FC<GeminiModalProps> = ({ isOpen, onClose, onGenerate }) => {
  const { t } = useTranslation();
  const [prompt, setPrompt] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // AI request tracking state
  const [dailyRequestInfo, setDailyRequestInfo] = useState({
    canMake: true,
    remaining: 3,
    used: 0,
    limit: 3
  });
  const [recentRequests, setRecentRequests] = useState<AIRequest[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  
  const MAX_CHARS = 500;

  useEffect(() => {
    if (isOpen) {
      setPrompt('');
      setError(null);
      loadDailyRequestInfo();
      loadRecentRequests();
    }
  }, [isOpen]);

  const loadDailyRequestInfo = async () => {
    try {
      const { data, error } = await canMakeAIRequest();
      if (!error && data) {
        setDailyRequestInfo(data);
      }
    } catch (error) {
      console.error('Error loading daily request info:', error);
    }
  };

  const loadRecentRequests = async () => {
    setHistoryLoading(true);
    try {
      const { data, error } = await getRecentAIRequests(5);
      if (!error && data) {
        setRecentRequests(data);
      }
    } catch (error) {
      console.error('Error loading recent requests:', error);
    } finally {
      setHistoryLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!prompt.trim()) return;
    
    // Check if user can make AI request
    if (!dailyRequestInfo.canMake) {
      setError(`You have reached your daily limit of ${dailyRequestInfo.limit} AI requests. Try again tomorrow.`);
      return;
    }
    
    setIsLoading(true);
    setError(null);
    
    try {
      const apiKey = import.meta.env.VITE_AI_API_KEY;
      if (!apiKey) {
        throw new Error("API key not found. Please add VITE_AI_API_KEY to your .env file");
      }

      // Initialize the Google GenAI client
      const genAI = new GoogleGenAI({ apiKey });
      const iconsList = AVAILABLE_ICONS.join(", ");

      // Prepare an enhanced prompt
      const fullPrompt = `
        Generate a honeycomb structure for a task planning app based on this description:
        "${prompt}"
        
        The structure should be a valid JSON array where each item represents a task node with the following properties:
        - id: string - unique identifier
        - q, r: number - axial coordinates for hexagon grid positioning
        - x, y: number - calculated pixel positions (will be recalculated)
        - title: string - short title of the task (max 15 chars)
        - description: string - longer description
        - icon: string - one of: ${iconsList}
        - priority: string - "low", "medium", or "high"
        - completed: boolean - always false initially
        - connections: string[] - array of IDs this node connects to
        - color: string - hex color code (choose appropriate colors)
        - isMain: boolean - true only for the main/central node

        The first item should have id "main", be the central node (q:0, r:0) with isMain:true.
        
        Create a well-structured honeycomb with logical connections between nodes.
        Include 5-15 nodes total. Position nodes logically around the main goal.
        Use varied colors to distinguish different types of tasks or phases.

        Only respond with the valid JSON array, nothing else.
      `;

      // Make the API call
      const response = await genAI.models.generateContent({
        model: "gemini-2.0-flash-lite",
        contents: fullPrompt,
      });

      // Extract and parse the JSON response
      const responseText = response.text;
      if (!responseText) {
        throw new Error("Empty response from the API");
      }
      
      // Clean up the response - remove any markdown code blocks or extra text
      const jsonString = responseText.replace(/```json|```/g, '').trim();
      
      // Parse the JSON
      const parsedItems = JSON.parse(jsonString) as HoneycombItem[];
      
      // Process the items
      const processedItems = processHoneycombItems(parsedItems);
      
      // Save the AI request to database
      try {
        await createAIRequest({
          prompt: prompt.trim(),
          categories: [], // No categories anymore
          generatedItems: processedItems,
          status: 'completed'
        });
        
        // Refresh the daily request info and history
        await loadDailyRequestInfo();
        await loadRecentRequests();
      } catch (dbError) {
        console.error('Error saving AI request to database:', dbError);
        // Don't fail the entire request if database save fails
      }
      
      onGenerate(processedItems);
      onClose();
    } catch (err) {
      console.error('Error generating honeycomb:', err);
      
      // Save failed request to database
      try {
        await createAIRequest({
          prompt: prompt.trim(),
          categories: [],
          generatedItems: [],
          status: 'failed',
          errorMessage: err instanceof Error ? err.message : 'Unknown error'
        });
        
        // Refresh the daily request info and history
        await loadDailyRequestInfo();
        await loadRecentRequests();
      } catch (dbError) {
        console.error('Error saving failed AI request to database:', dbError);
      }
      
      setError(err instanceof Error ? err.message : 'Failed to generate honeycomb structure');
    } finally {
      setIsLoading(false);
    }
  };

  // Helper function to process and validate the generated items
  function processHoneycombItems(items: HoneycombItem[]): HoneycombItem[] {
    // Ensure all items have required properties
    return items.map((item, index) => {
      // Make sure the main item is properly set
      if (index === 0 && !item.isMain) {
        item.isMain = true;
        item.q = 0;
        item.r = 0;
      }
      
      // Calculate pixel positions based on q,r coordinates
      const x = item.q * 90; // Using simple calculation for demo
      const y = (item.r * 52) + (item.q * 26); // Approximate hexagon geometry
      
      // Ensure connections exist
      if (!item.connections) {
        item.connections = [];
      }
      
      // Ensure priority is valid
      if (!item.priority || !['low', 'medium', 'high'].includes(item.priority)) {
        item.priority = 'medium';
      }
      
      // Set timestamps
      const now = new Date();
      
      return {
        ...item,
        x,
        y,
        completed: false,
        priority: item.priority as TaskPriority,
        createdAt: now,
        updatedAt: now,
      };
    });
  }

  const formatTimeAgo = (date: Date) => {
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    
    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) return `${diffInHours}h ago`;
    
    const diffInDays = Math.floor(diffInHours / 24);
    return `${diffInDays}d ago`;
  };

  const applyHistoryPrompt = (request: AIRequest) => {
    setPrompt(request.prompt);
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Background overlay with no click-through */}
      <div 
        className="fixed inset-0 bg-black/50 z-[100]" 
        style={{ pointerEvents: 'all' }}
      />

      <div className="fixed inset-0 flex items-center justify-center z-[101] p-2 sm:p-4">
        <div
          className="bg-white rounded-lg w-full max-w-4xl h-[75vh] sm:h-[55vh] relative shadow-xl flex flex-col sm:flex-row overflow-hidden"
          onClick={e => e.stopPropagation()}
        >
          {/* History Sidebar - Hidden on mobile, shows on desktop */}
          <div className="hidden sm:flex w-72 bg-gray-50 border-r border-gray-200 flex-col">
            <div className="p-3 border-b border-gray-200">
              <h3 className="text-base font-medium text-gray-900">{t('ai.recentRequests')}</h3>
              <p className="text-xs text-gray-500 mt-1">Click any request to reuse it</p>
            </div>
            
            <div className="flex-1 overflow-y-auto p-3">
              {historyLoading ? (
                <div className="flex items-center justify-center py-6">
                  <div className="w-5 h-5 border-2 border-gray-300 border-t-blue-600 rounded-full animate-spin" />
                </div>
              ) : recentRequests.length === 0 ? (
                <div className="text-center py-6">
                  <div className="text-gray-400 mb-2">
                    <Clock size={24} className="mx-auto" />
                  </div>
                  <p className="text-xs text-gray-500">{t('ai.noPreviousRequests')}</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {recentRequests.map((request) => (
                    <div
                      key={request.id}
                      className="p-2 bg-white rounded border hover:bg-blue-50 cursor-pointer transition-all duration-200 hover:shadow-sm"
                      onClick={() => applyHistoryPrompt(request)}
                      title={t('ai.useThisPrompt')}
                    >
                      <div className="flex items-start justify-between mb-1">
                        <span className={`px-1.5 py-0.5 text-xs rounded ${
                          request.status === 'completed' ? 'bg-green-100 text-green-700' :
                          request.status === 'failed' ? 'bg-red-100 text-red-700' :
                          'bg-yellow-100 text-yellow-700'
                        }`}>
                          {request.status}
                        </span>
                        <div className="flex items-center gap-1 text-xs text-gray-500">
                          <Clock size={10} />
                          {formatTimeAgo(request.createdAt)}
                        </div>
                      </div>
                      
                      <p className="text-xs text-gray-900 font-medium leading-relaxed">
                        {request.prompt.slice(0, 80)}{request.prompt.length > 80 ? '...' : ''}
                      </p>
                      
                      {request.honeycombName && (
                        <p className="text-xs text-gray-500 mt-1">
                          Used in: {request.honeycombName}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Main Content */}
          <div className="flex-1 flex flex-col min-h-0">
            {/* Header */}
            <div className="p-4 sm:p-5 border-b border-gray-200 flex-shrink-0">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-lg sm:text-xl font-semibold text-gray-900">
                    {t('modals.aiGenerate')}
                  </h2>
                  {/* Mobile history info */}
                  <p className="text-xs text-gray-500 mt-1 sm:hidden">
                    Create AI-powered honeycomb structures
                  </p>
                </div>
                <button
                  onClick={onClose}
                  className="text-gray-400 hover:text-gray-600 transition-colors p-1"
                  disabled={isLoading}
                >
                  <X size={20} className="sm:w-6 sm:h-6" />
                </button>
              </div>

              {/* Daily limit info */}
              <div className="mt-3 p-2.5 sm:p-3 bg-blue-50 border border-blue-200 rounded-md">
                <div className="flex items-center gap-2 text-blue-800">
                  <Info size={14} className="flex-shrink-0" />
                  <span className="text-xs sm:text-sm font-medium">
                    {t('ai.dailyLimit')}: {dailyRequestInfo.used}/{dailyRequestInfo.limit}
                  </span>
                </div>
                {dailyRequestInfo.remaining > 0 ? (
                  <p className="text-xs text-blue-600 mt-1">
                    {t('ai.requestsRemaining', { count: dailyRequestInfo.remaining })}
                  </p>
                ) : (
                  <div className="flex items-center gap-2 mt-1">
                    <AlertCircle size={12} className="text-red-500 flex-shrink-0" />
                    <p className="text-xs text-red-600">
                      {t('ai.limitReached')}
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Mobile History Section */}
            <div className="sm:hidden border-b border-gray-200 bg-gray-50">
              <div className="p-3">
                <h3 className="text-sm font-medium text-gray-900 mb-2">{t('ai.recentRequests')}</h3>
                <div className="max-h-32 overflow-y-auto">
                  {historyLoading ? (
                    <div className="flex items-center justify-center py-2">
                      <div className="w-4 h-4 border-2 border-gray-300 border-t-blue-600 rounded-full animate-spin" />
                    </div>
                  ) : recentRequests.length === 0 ? (
                    <p className="text-xs text-gray-500 text-center py-2">{t('ai.noPreviousRequests')}</p>
                  ) : (
                    <div className="space-y-1">
                      {recentRequests.slice(0, 2).map((request) => (
                        <div
                          key={request.id}
                          className="p-2 bg-white rounded border hover:bg-blue-50 cursor-pointer transition-colors"
                          onClick={() => applyHistoryPrompt(request)}
                        >
                          <p className="text-xs text-gray-900 font-medium">
                            {request.prompt.slice(0, 60)}{request.prompt.length > 60 ? '...' : ''}
                          </p>
                          <div className="flex items-center justify-between mt-1">
                            <span className={`px-1.5 py-0.5 text-xs rounded ${
                              request.status === 'completed' ? 'bg-green-100 text-green-700' :
                              request.status === 'failed' ? 'bg-red-100 text-red-700' :
                              'bg-yellow-100 text-yellow-700'
                            }`}>
                              {request.status}
                            </span>
                            <span className="text-xs text-gray-500">{formatTimeAgo(request.createdAt)}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Form */}
            <div className="flex-1 p-4 sm:p-5 overflow-y-auto min-h-0">
              <form onSubmit={handleSubmit} className="h-full flex flex-col">
                {/* Prompt input */}
                <div className="flex-shrink-0">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {t('ai.promptLabel')}
                  </label>
                  <div className="relative">
                    <textarea
                      value={prompt}
                      onChange={(e) => setPrompt(e.target.value.slice(0, MAX_CHARS))}
                      className="w-full h-36 sm:h-48 px-3 py-2.5 border border-gray-300 rounded-md focus:outline-none
                        focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-shadow
                        resize-none text-sm"
                      placeholder={t('ai.promptPlaceholder')}
                      disabled={isLoading}
                      autoFocus
                    />
                    <div className="absolute bottom-2 right-2 text-xs text-gray-500 bg-white/90 px-1.5 py-0.5 rounded">
                      {prompt.length}/{MAX_CHARS}
                    </div>
                  </div>
                </div>

                {error && (
                  <div className="mt-3 p-2.5 bg-red-50 text-red-700 rounded-md text-xs sm:text-sm">
                    {error}
                  </div>
                )}

                {/* Submit button */}
                <div className="mt-4 sm:mt-6 flex justify-end">
                  <button
                    type="submit"
                    disabled={isLoading || !prompt.trim() || !dailyRequestInfo.canMake}
                    className="px-4 sm:px-6 py-2.5 sm:py-3 text-sm font-medium text-white bg-amber-600 rounded-md
                      hover:bg-amber-700 focus:outline-none focus:ring-2 focus:ring-offset-2
                      focus:ring-amber-500 disabled:opacity-50 disabled:cursor-not-allowed
                      transition-colors flex items-center gap-2"
                  >
                    {isLoading ? (
                      <>
                        <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        {t('ai.generating')}
                      </>
                    ) : !dailyRequestInfo.canMake ? (
                      t('ai.limitReachedButton')
                    ) : (
                      t('ai.generate')
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default GeminiModal;