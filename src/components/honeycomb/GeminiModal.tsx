import React, { useState, useEffect } from 'react';
import { X, Plus, Info } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { GoogleGenAI } from "@google/genai";
import type { HoneycombItem, TaskPriority } from './canvas/HoneycombTypes';

interface GeminiModalProps {
  isOpen: boolean;
  onClose: () => void;
  onGenerate: (items: HoneycombItem[]) => void;
}

interface Category {
  name: string;
  color: string;
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

// Predefined colors for categories
const DEFAULT_COLORS = [
  "#A7F3D0", // Green - Shopping/Personal
  "#93C5FD", // Blue - Work/Business
  "#FDE68A", // Yellow - Main goal
  "#FCA5A5", // Red - Urgent
  "#DDD6FE", // Purple - Learning
  "#C4B5FD", // Light Purple - Creative
  "#F9A8D4", // Pink - Social
  "#FBBF24", // Orange - Home
  "#6EE7B7", // Teal - Health
  "#BFDBFE"  // Light Blue - Travel
];

// Main goal is handled separately and always included
const MAIN_GOAL_CATEGORY = { name: "Main Goal", color: "#FDE68A" };

// User-editable categories (Main Goal is handled separately)
const DEFAULT_CATEGORIES: Category[] = [
  { name: "Work", color: "#93C5FD" }, 
  { name: "Personal", color: "#A7F3D0" },
  { name: "Urgent", color: "#FCA5A5" },
  { name: "Learning", color: "#DDD6FE" }
];

const GeminiModal: React.FC<GeminiModalProps> = ({ isOpen, onClose, onGenerate }) => {
  const { t } = useTranslation();
  const [prompt, setPrompt] = useState('');
  const [categories, setCategories] = useState<Category[]>(DEFAULT_CATEGORIES);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showCategoryEditor, setShowCategoryEditor] = useState(false);
  const [tempCategory, setTempCategory] = useState<Category>({ name: "", color: DEFAULT_COLORS[0] });
  const MAX_CHARS = 500;

  useEffect(() => {
    if (isOpen) {
      setPrompt('');
      setError(null);
      setCategories(DEFAULT_CATEGORIES);
    }
  }, [isOpen]);

  const handleAddCategory = () => {
    if (!tempCategory.name.trim()) return;
    
    setCategories([...categories, tempCategory]);
    setTempCategory({ name: "", color: DEFAULT_COLORS[Math.floor(Math.random() * DEFAULT_COLORS.length)] });
  };

  const handleRemoveCategory = (index: number) => {
    setCategories(categories.filter((_, i) => i !== index));
  };

  const prepareCategoriesForPrompt = () => {
    // Always include the Main Goal category
    const allCategories = [MAIN_GOAL_CATEGORY, ...categories];
    
    if (allCategories.length <= 1) {
      // If no user categories, let AI decide
      return `"${MAIN_GOAL_CATEGORY.name}": "${MAIN_GOAL_CATEGORY.color}"`;
    }
    
    return allCategories.map(cat => `"${cat.name}": "${cat.color}"`).join(", ");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!prompt.trim()) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      const apiKey = import.meta.env.VITE_AI_API_KEY;
      if (!apiKey) {
        throw new Error("API key not found. Please add VITE_AI_API_KEY to your .env file");
      }

      // Initialize the Google GenAI client
      const genAI = new GoogleGenAI({ apiKey });

      // Create a categories map for the prompt
      const categoriesMap = `{${prepareCategoriesForPrompt()}}`;
      const iconsList = AVAILABLE_ICONS.join(", ");

      // Check if we only have the Main Goal category
      const aiDecideCategories = categories.length === 0;

      // Prepare an enhanced prompt with categories
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
        - color: string - hex color code matching its category
        - category: string - which category the task belongs to
        - isMain: boolean - true only for the main/central node

        The first item should have id "main", be the central node (q:0, r:0) with isMain:true, and category "Main Goal".
        
        ${aiDecideCategories 
          ? `Create appropriate categories based on the task description and assign them suitable colors. Include the Main Goal category with color "${MAIN_GOAL_CATEGORY.color}".` 
          : `Organize tasks into these categories with their assigned colors: ${categoriesMap}`
        }
        
        Make sure each task's color matches its category's color.
        
        A well-structured honeycomb should have logical connections between nodes.
        Include 5-15 nodes total${aiDecideCategories ? '.' : ', with at least one task from each category.'} 
        Position nodes logically - tasks in the same category should be near each other if possible.

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
      
      onGenerate(processedItems);
      onClose();
    } catch (err) {
      console.error('Error generating honeycomb:', err);
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

  if (!isOpen) return null;

  return (
    <>
      <div className="fixed inset-0 bg-black/50 z-[100]" onClick={onClose} />

      <div className="fixed inset-0 flex items-center justify-center z-[101]">
        <div
          className="bg-white rounded-lg w-full max-w-lg p-6 relative shadow-xl mx-4 max-h-[90vh] overflow-y-auto"
          onClick={e => e.stopPropagation()}
        >
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors"
            disabled={isLoading}
          >
            <X size={24} />
          </button>

          <h2 className="text-xl font-semibold mb-4">
            {t('modals.aiGenerate')}
          </h2>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Prompt input */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t('ai.promptLabel')}
              </label>
              <div className="relative">
                <textarea
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value.slice(0, MAX_CHARS))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none
                    focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-shadow
                    resize-y min-h-[120px] max-h-[300px]"
                  placeholder={t('ai.promptPlaceholder')}
                  disabled={isLoading}
                  autoFocus
                />
                <div className="absolute bottom-2 right-2 text-xs text-gray-500">
                  {prompt.length}/{MAX_CHARS}
                </div>
              </div>
            </div>

            {/* Categories section */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-sm font-medium text-gray-700">
                  {t('ai.categories')}
                </label>
                <button
                  type="button"
                  onClick={() => setShowCategoryEditor(!showCategoryEditor)}
                  className="text-sm text-amber-600 hover:text-amber-700"
                >
                  {showCategoryEditor ? t('ai.hideCategoryEditor') : t('ai.showCategoryEditor')}
                </button>
              </div>

              {/* Main Goal category - always shown, not editable */}
              <div className="mb-2">
                <div 
                  className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-sm"
                  style={{ backgroundColor: `${MAIN_GOAL_CATEGORY.color}30` }}
                >
                  <div 
                    className="w-3 h-3 rounded-full" 
                    style={{ backgroundColor: MAIN_GOAL_CATEGORY.color }}
                  />
                  <span>{MAIN_GOAL_CATEGORY.name}</span>
                  <div className="w-4 h-4 flex items-center justify-center rounded-full bg-amber-100">
                    <Info size={10} className="text-amber-700" />
                  </div>
                </div>
                <div className="text-xs text-gray-500 mt-1 ml-2">
                  {t('ai.mainGoalInfo')}
                </div>
              </div>

              {/* User-defined categories list */}
              <div className="flex flex-wrap gap-2 mb-4">
                {categories.map((category, index) => (
                  <div 
                    key={index} 
                    className="flex items-center gap-2 px-3 py-1.5 rounded-full text-sm"
                    style={{ backgroundColor: `${category.color}30` }}
                  >
                    <div 
                      className="w-3 h-3 rounded-full" 
                      style={{ backgroundColor: category.color }}
                    />
                    <span>{category.name}</span>
                    {showCategoryEditor && (
                      <button 
                        type="button"
                        onClick={() => handleRemoveCategory(index)}
                        className="p-0.5 rounded-full hover:bg-white/50"
                      >
                        <X size={12} />
                      </button>
                    )}
                  </div>
                ))}

                {categories.length === 0 && (
                  <div className="text-sm text-gray-500 italic">
                    {t('ai.noCategories')}
                  </div>
                )}
              </div>

              {/* Category editor */}
              {showCategoryEditor && (
                <div className="mt-3 p-4 bg-gray-50 rounded-md">
                  <div className="flex gap-2 mb-2">
                    <input
                      type="text"
                      value={tempCategory.name}
                      onChange={(e) => setTempCategory({ ...tempCategory, name: e.target.value })}
                      placeholder={t('ai.categoryName')}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none
                        focus:ring-1 focus:ring-amber-500 focus:border-transparent"
                    />
                    <div className="relative">
                      <input
                        type="color"
                        value={tempCategory.color}
                        onChange={(e) => setTempCategory({ ...tempCategory, color: e.target.value })}
                        className="sr-only"
                        id="category-color"
                      />
                      <label
                        htmlFor="category-color"
                        className="flex items-center justify-center w-10 h-10 border border-gray-300 rounded-md cursor-pointer"
                        style={{ backgroundColor: tempCategory.color }}
                      />
                    </div>
                    <button
                      type="button"
                      onClick={handleAddCategory}
                      disabled={!tempCategory.name.trim()}
                      className="px-3 py-2 bg-amber-600 text-white rounded-md hover:bg-amber-700 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <Plus size={16} />
                    </button>
                  </div>

                  {/* Preset colors */}
                  <div className="flex flex-wrap gap-2 mt-2">
                    {DEFAULT_COLORS.map((color, index) => (
                      <button
                        key={index}
                        type="button"
                        className={`w-6 h-6 rounded-full transition-transform ${
                          tempCategory.color === color ? 'ring-2 ring-offset-2 ring-amber-500 scale-110' : ''
                        }`}
                        style={{ backgroundColor: color }}
                        onClick={() => setTempCategory({ ...tempCategory, color })}
                      />
                    ))}
                  </div>
                </div>
              )}
            </div>

            {error && (
              <div className="p-3 bg-red-50 text-red-700 rounded-md text-sm">
                {error}
              </div>
            )}

            <div className="flex justify-end pt-4">
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md
                    hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-offset-2
                    focus:ring-amber-500 transition-colors"
                  disabled={isLoading}
                >
                  {t('actions.cancel')}
                </button>

                <button
                  type="submit"
                  disabled={isLoading || !prompt.trim()}
                  className="px-4 py-2 text-sm font-medium text-white bg-amber-600 rounded-md
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
                  ) : (
                    t('ai.generate')
                  )}
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </>
  );
};

export default GeminiModal;