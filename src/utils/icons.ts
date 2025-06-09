import {
  // Original icons
  AlertCircle, Archive, Bell, Bookmark, Briefcase, CheckCircle,
  Code, FileText, Flag, Heart, Home, Mail, MessageCircle, Settings, 
  Star, Tag, Target, Timer, Trophy, Truck, Tv, Upload, User, Users, 
  Video, Wallet, Watch, Zap, Bug, Building, Camera, Car, BarChart, 
  PieChart, Cloud, Coffee, Database, Terminal, Gitlab, Webhook, FileCode, 
  Boxes, LayoutGrid, Component, Braces, FolderGit, Plus,
  
  // Additional icons for various categories
  // Education
  GraduationCap, BookOpen, PenTool, Book, Pencil,
  
  // Health & Wellness
  Activity, Apple, Dumbbell,
  
  // Travel & Transport
  Map, Compass, Plane, Train, Bus, Globe, Mountain, Hotel,
  
  // Food & Shopping
  ShoppingCart, ShoppingBag, Package, Gift, CreditCard, DollarSign, Store, Pizza,
  
  // Time & Planning
  Calendar, Clock, CalendarDays, CalendarClock,
  
  // Work & Productivity
  Laptop, Printer, Phone, Headphones, Monitor, Smartphone, Tablet, 
  ClipboardList, FilePlus, FileCheck, FileX,
  
  // Home & Lifestyle
  Hammer, Wrench, Lightbulb, Bed, Bath,
  
  // Communication & Social
  MessageSquare, Share, Send, Reply, AtSign, Hash,
  
  // Weather & Environment
  Sun, Moon, CloudRain, CloudSnow, Wind, Thermometer, Umbrella, Droplet,
  
  // Development & Design
  Figma, GitBranch, GitMerge, GitPullRequest, Codesandbox, Codepen,
  
  // Security
  Lock, Unlock, Shield, ShieldAlert, ShieldCheck, Key, KeyRound, Fingerprint,
  
  // Media & Information
  Newspaper, Radio, Tv as Tv2, Image, FileImage, Music, Volume2,
  
  // Additional Useful Icons
  Bookmark as Bookmark2, Calendar as Calendar2, Check, X, Edit, Trash2 as Trash, 
  Copy, Download, RefreshCw, Search, Filter, SortAsc as Sort, MoreHorizontal, MoreVertical,
  ChevronUp, ChevronDown, ChevronLeft, ChevronRight, ArrowUp, ArrowDown,
  ArrowLeft, ArrowRight, ExternalLink as External, Link, Paperclip, Save, Folder,
  FolderOpen, File, Files, HardDrive, Wifi, WifiOff, Power,
  Battery, BatteryLow, Signal, Bluetooth, Usb, Headphones as Headphones2,
  Mic, MicOff, Speaker, VolumeX, Play, Pause, Square as Stop,
  SkipBack, SkipForward, Rewind, FastForward, Repeat, Shuffle,
  Award, Medal, Crown, Gem, Sparkles, Zap as Zap2, Flame, Snowflake,
  Leaf, TreePine as Tree, Flower, Sun as Sun2, Moon as Moon2, Star as Star2, 
  CloudDrizzle as Cloudy, Rainbow, MapPin, Navigation, Compass as Compass2, 
  Route, Car as Car2, Bike, PersonStanding as Walk, ShoppingBasket, 
  ShoppingCart as ShoppingCart2, CreditCard as CreditCard2, Banknote, Receipt,
  Calculator, Clock as Clock2, Timer as Timer2, AlarmClock, Hourglass,
  
  // Default for None
  Circle
} from 'lucide-react';

import type { TaskIcon } from '@/types';

export const ICONS_MAP = {
  // Default None icon
  None: Circle,
  
  // Original icons
  AlertCircle, Archive, Bell, Bookmark, Briefcase, CheckCircle,
  Code, FileText, Flag, Heart, Home, Mail, MessageCircle, Settings, 
  Star, Tag, Target, Timer, Trophy, Truck, Tv, Upload, User, Users, 
  Video, Wallet, Watch, Zap, Bug, Building, Camera, Car, BarChart, 
  PieChart, Cloud, Coffee, Database, Terminal, Gitlab, Webhook, FileCode, 
  Boxes, LayoutGrid, Component, Braces, FolderGit, Plus,
  
  // Education
  GraduationCap, BookOpen, PenTool, Book, Pencil,
  
  // Health & Wellness
  Activity, Apple, Dumbbell,
  
  // Travel & Transport
  Map, Compass, Plane, Train, Bus, Globe, Mountain, Hotel,
  
  // Food & Shopping
  ShoppingCart, ShoppingBag, Package, Gift, CreditCard, DollarSign, Store, Pizza,
  
  // Time & Planning
  Calendar, Clock, CalendarDays, CalendarClock,
  
  // Work & Productivity
  Laptop, Printer, Phone, Headphones, Monitor, Smartphone, Tablet, 
  ClipboardList, FilePlus, FileCheck, FileX,
  
  // Home & Lifestyle
  Hammer, Wrench, Lightbulb, Bed, Bath,
  
  // Communication & Social
  MessageSquare, Share, Send, Reply, AtSign, Hash,
  
  // Weather & Environment
  Sun, Moon, CloudRain, CloudSnow, Wind, Thermometer, Umbrella, Droplet,
  
  // Development & Design
  Figma, GitBranch, GitMerge, GitPullRequest, Codesandbox, Codepen,
  
  // Security
  Lock, Unlock, Shield, ShieldAlert, ShieldCheck, Key, KeyRound, Fingerprint,
  
  // Media & Information
  Newspaper, Radio, Tv2, Image, FileImage, Music, Volume2,
  
  // Additional Useful Icons
  Bookmark2, Calendar2, Check, X, Edit, Trash, Copy, Download,
  RefreshCw, Search, Filter, Sort, MoreHorizontal, MoreVertical,
  ChevronUp, ChevronDown, ChevronLeft, ChevronRight, ArrowUp, ArrowDown,
  ArrowLeft, ArrowRight, External, Link, Paperclip, Save, Folder,
  FolderOpen, File, Files, HardDrive, Wifi, WifiOff, Power,
  Battery, BatteryLow, Signal, Bluetooth, Usb, Headphones2,
  Mic, MicOff, Speaker, VolumeX, Play, Pause, Stop,
  SkipBack, SkipForward, Rewind, FastForward, Repeat, Shuffle,
  Award, Medal, Crown, Gem, Sparkles, Zap2, Flame, Snowflake,
  Leaf, Tree, Flower, Sun2, Moon2, Star2, Cloudy, Rainbow,
  MapPin, Navigation, Compass2, Route, Car2, Bike, Walk,
  ShoppingBasket, ShoppingCart2, CreditCard2, Banknote, Receipt,
  Calculator, Clock2, Timer2, AlarmClock, Hourglass
} as const;

export const ICONS = Object.keys(ICONS_MAP) as TaskIcon[];