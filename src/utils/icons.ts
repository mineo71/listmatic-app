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
  Sun, Moon, CloudRain, CloudSnow, Wind, Thermometer, Umbrella,
  
  // Development & Design
  Figma, GitBranch, GitMerge, GitPullRequest, Codesandbox, Codepen,
  
  // Security
  Lock, Unlock, Shield, ShieldAlert, ShieldCheck, Key, KeyRound, Fingerprint
} from 'lucide-react';

import type { TaskIcon } from '@/types';

export const ICONS_MAP = {
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
  Sun, Moon, CloudRain, CloudSnow, Wind, Thermometer, Umbrella,
  
  // Development & Design
  Figma, GitBranch, GitMerge, GitPullRequest, Codesandbox, Codepen,
  
  // Security
  Lock, Unlock, Shield, ShieldAlert, ShieldCheck, Key, KeyRound, Fingerprint
} as const;

export const ICONS = Object.keys(ICONS_MAP) as TaskIcon[];