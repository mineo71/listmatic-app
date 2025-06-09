// src/types/index.ts

// Available icons from lucide-react that can be used for tasks
export interface Task {
  id: string;
  title: string;
  description: string;
  icon: TaskIcon;
  priority: TaskPriority;
  completed: boolean;
  deadline?: Date;
  color?: string;
  createdAt: Date;
  updatedAt: Date;
}

export type TaskIcon = 
  | 'None'
  // Original Icons
  | 'AlertCircle' | 'Archive' | 'Bell' | 'Bookmark' | 'Briefcase' | 'CheckCircle'
  | 'Code' | 'FileText' | 'Flag' | 'Heart' | 'Home' | 'Mail' | 'MessageCircle' | 'Settings'
  | 'Star' | 'Tag' | 'Target' | 'Timer' | 'Trophy' | 'Truck' | 'Tv' | 'Upload' | 'User' | 'Users'
  | 'Video' | 'Wallet' | 'Watch' | 'Zap' | 'Bug' | 'Building' | 'Camera' | 'Car' | 'BarChart'
  | 'PieChart' | 'Cloud' | 'Coffee' | 'Database' | 'Terminal' | 'Gitlab' | 'Webhook' | 'FileCode'
  | 'Boxes' | 'LayoutGrid' | 'Component' | 'Braces' | 'FolderGit' | 'Plus'
  
  // Education
  | 'GraduationCap' | 'BookOpen' | 'PenTool' | 'Book' | 'Pencil'
  
  // Health & Wellness
  | 'Activity' | 'Apple' | 'Dumbbell'
  
  // Travel & Transport
  | 'Map' | 'Compass' | 'Plane' | 'Train' | 'Bus' | 'Globe' | 'Mountain' | 'Hotel'
  
  // Food & Shopping
  | 'ShoppingCart' | 'ShoppingBag' | 'Package' | 'Gift' | 'CreditCard' | 'DollarSign' | 'Store' | 'Pizza'
  
  // Time & Planning
  | 'Calendar' | 'Clock' | 'CalendarDays' | 'CalendarClock'
  
  // Work & Productivity
  | 'Laptop' | 'Printer' | 'Phone' | 'Headphones' | 'Monitor' | 'Smartphone' | 'Tablet'
  | 'ClipboardList' | 'FilePlus' | 'FileCheck' | 'FileX'
  
  // Home & Lifestyle
  | 'Hammer' | 'Wrench' | 'Lightbulb' | 'Bed' | 'Bath'
  
  // Communication & Social
  | 'MessageSquare' | 'Share' | 'Send' | 'Reply' | 'AtSign' | 'Hash'
  
  // Weather & Environment
  | 'Sun' | 'Moon' | 'CloudRain' | 'CloudSnow' | 'Wind' | 'Thermometer' | 'Umbrella'
  | 'Droplet'
  
  // Development & Design
  | 'Figma' | 'GitBranch' | 'GitMerge' | 'GitPullRequest' | 'Codesandbox' | 'Codepen'
  
  // Security
  | 'Lock' | 'Unlock' | 'Shield' | 'ShieldAlert' | 'ShieldCheck' | 'Key' | 'KeyRound' | 'Fingerprint'
  
  // Media & Information
  | 'Newspaper' | 'Radio' | 'Tv2' | 'Image' | 'FileImage' | 'Music' | 'Volume2'
  
  // Additional Useful Icons
  | 'Bookmark2' | 'Calendar2' | 'Check' | 'X' | 'Edit' | 'Trash' | 'Copy' | 'Download'
  | 'RefreshCw' | 'Search' | 'Filter' | 'Sort' | 'MoreHorizontal' | 'MoreVertical'
  | 'ChevronUp' | 'ChevronDown' | 'ChevronLeft' | 'ChevronRight' | 'ArrowUp' | 'ArrowDown'
  | 'ArrowLeft' | 'ArrowRight' | 'External' | 'Link' | 'Paperclip' | 'Save' | 'Folder'
  | 'FolderOpen' | 'File' | 'Files' | 'HardDrive' | 'Wifi' | 'WifiOff' | 'Power'
  | 'Battery' | 'BatteryLow' | 'Signal' | 'Bluetooth' | 'Usb' | 'Headphones2'
  | 'Mic' | 'MicOff' | 'Speaker' | 'VolumeX' | 'Play' | 'Pause' | 'Stop'
  | 'SkipBack' | 'SkipForward' | 'Rewind' | 'FastForward' | 'Repeat' | 'Shuffle'
  | 'Award' | 'Medal' | 'Crown' | 'Gem' | 'Sparkles' | 'Zap2' | 'Flame' | 'Snowflake'
  | 'Leaf' | 'Tree' | 'Flower' | 'Sun2' | 'Moon2' | 'Star2' | 'Cloudy' | 'Rainbow'
  | 'MapPin' | 'Navigation' | 'Compass2' | 'Route' | 'Car2' | 'Bike' | 'Walk'
  | 'ShoppingBasket' | 'ShoppingCart2' | 'CreditCard2' | 'Banknote' | 'Receipt'
  | 'Calculator' | 'Clock2' | 'Timer2' | 'AlarmClock' | 'Hourglass';

// Task priority levels
export type TaskPriority = 'low' | 'medium' | 'high';

export interface Task {
  id: string;
  title: string;
  description: string;
  icon: TaskIcon;
  priority: TaskPriority;
  completed: boolean;
  deadline?: Date;
  color?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface HoneycombItem {
  id: string;
  x: number;
  y: number;
  title: string;
  description: string;
  icon: TaskIcon;
  priority: TaskPriority;
  deadline?: Date;
  color: string;
  connections: string[];
  completed: boolean;
  isMain?: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface Honeycomb {
  id: string;
  name: string;
  description: string;
  icon: TaskIcon;
  tasks: Task[];
  canvasItems?: HoneycombItem[];
  color: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Hive {
  id: string;
  name: string;
  description: string;
  icon: TaskIcon;
  color: string;
  honeycombs: Honeycomb[];
  subHives: Hive[];
  createdAt: Date;
  updatedAt: Date;
}

// For sidebar tree view
export type TreeItem = {
  id: string;
  name: string;
  description: string;
  icon: TaskIcon;
  color: string;
  type: 'hive' | 'honeycomb';
  children?: TreeItem[];
  parentId?: string;
};