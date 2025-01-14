import {
  AlertCircle, Archive, Bell, Bookmark, Briefcase, CheckCircle,
  Code, FileText, Flag, Heart, Home, Mail, MessageCircle, Settings, 
  Star, Tag, Target, Timer, Trophy, Truck, Tv, Upload, User, Users, 
  Video, Wallet, Watch, Zap, Bug, Building, Camera, Car, BarChart, 
  PieChart, Cloud, Coffee, Database, Terminal, Gitlab, Webhook, FileCode, 
  Boxes, LayoutGrid, Component, Braces, FolderGit, Plus
} from 'lucide-react';
import type { TaskIcon } from '@/types';

export const ICONS_MAP = {
  AlertCircle, Archive, Bell, Bookmark, Briefcase, CheckCircle,
  Code, FileText, Flag, Heart, Home, Mail, MessageCircle, Settings, 
  Star, Tag, Target, Timer, Trophy, Truck, Tv, Upload, User, Users, 
  Video, Wallet, Watch, Zap, Bug, Building, Camera, Car, BarChart, 
  PieChart, Cloud, Coffee, Database, Terminal, Gitlab, Webhook, FileCode, 
  Boxes, LayoutGrid, Component, Braces, FolderGit, Plus
} as const;

export const ICONS = Object.keys(ICONS_MAP) as TaskIcon[];
