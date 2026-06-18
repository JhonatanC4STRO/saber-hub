'use client';
import React from 'react';
import {
  PartyPopper,
  Trophy,
  Award,
  MessageSquare,
  Hand,
  Video,
  FileText,
  FileSpreadsheet,
  Rocket,
  GraduationCap,
  Mail,
  Users,
  AlertTriangle,
  XCircle,
  Ban,
  CheckCircle2,
  BookOpen,
  Landmark,
  Star,
  BarChart3,
  Upload,
  Lightbulb,
  Check,
  X,
  Folder,
  Circle,
  Octagon,
  ShieldAlert,
  Calendar,
  Globe,
  File,
  Image,
  Settings,
  Search,
  Plus,
  Pencil,
  Trash2,
  Package,
  Target,
  RefreshCw,
  Clock,
  Paperclip,
  Film,
  Music,
  Layers,
  MapPin,
  Pin,
  Megaphone,
  Key,
  Lock,
  Unlock,
  Save,
  Send,
  FolderOpen,
  ArrowLeft,
  Menu,
  Tag,
  Eye,
  Heart,
  User,
  School,
  Laptop,
  Bot
} from 'lucide-react';

const emojiToIconMap = {
  '🎉': PartyPopper,
  '🏆': Trophy,
  '🏅': Award,
  '💬': MessageSquare,
  '👋': Hand,
  '🎥': Video,
  '📝': FileText,
  '🚀': Rocket,
  '🎓': GraduationCap,
  '✉️': Mail,
  '✉': Mail,
  '👥': Users,
  '⚠️': AlertTriangle,
  '⚠': AlertTriangle,
  '❌': XCircle,
  '🚫': Ban,
  '✅': CheckCircle2,
  '📖': BookOpen,
  '🏛': Landmark,
  '★': Star,
  '📊': BarChart3,
  '📤': Upload,
  '💡': Lightbulb,
  '✓': Check,
  '✕': X,
  '✖': X,
  '📁': Folder,
  '🟢': Circle,
  '🟡': Circle,
  '🔴': Circle,
  '🛑': Octagon,
  '🛡️': ShieldAlert,
  '🛡': ShieldAlert,
  '📅': Calendar,
  '🌐': Globe,
  '📄': File,
  '🖼️': Image,
  '🖼': Image,
  '⚙': Settings,
  '🔍': Search,
  '➕': Plus,
  '✏️': Pencil,
  '✏': Pencil,
  '🗑️': Trash2,
  '🗑': Trash2,
  '📦': Package,
  '🎯': Target,
  '🔄': RefreshCw,
  '⏳': Clock,
  '⏱': Clock,
  '⏱️': Clock,
  '📎': Paperclip,
  '🎬': Film,
  '🎵': Music,
  '🧩': Layers,
  '⭕': Circle,
  '📍': MapPin,
  '📌': Pin,
  '📢': Megaphone,
  '🔑': Key,
  '🔒': Lock,
  '🔓': Unlock,
  '💾': Save,
  '📨': Send,
  '📂': FolderOpen,
  '🥇': Award,
  '🥈': Award,
  '🥉': Award,
  '📼': Video,
  '🕐': Clock,
  '👈': ArrowLeft,
  '☰': Menu,
  '👁': Eye,
  '👁️': Eye,
  '❤': Heart,
  '❤️': Heart,
  '👨': User,
  '🏫': School,
  '💻': Laptop,
  '🤖': Bot,
  '🏷': Tag,
  '🗂': FolderOpen
};

// Extra custom styling maps for specific emojis to match their natural context if color is not specified
const emojiColorMap = {
  '✅': '#10B981', // green
  '🟢': '#10B981',
  '❌': '#EF4444', // red
  '🔴': '#EF4444',
  '🛑': '#EF4444',
  '⚠️': '#F59E0B', // amber
  '⚠': '#F59E0B',
  '🟡': '#F59E0B',
  '💡': '#F59E0B',
  '★': '#F59E0B',
  '🏆': '#F59E0B',
  '🥇': '#F59E0B',
  '🥈': '#9CA3AF', // silver
  '🥉': '#B45309', // bronze
  '💙': '#1D4ED8', // blue
  '🎓': '#1E40AF',
  '🎬': '#1E40AF',
  '📖': '#1E40AF',
  '🎥': '#EF4444'
};

export default function EmojiIcon({ emoji, size = 16, className = '', color, style }) {
  const IconComponent = emojiToIconMap[emoji];
  
  if (!IconComponent) {
    // If not found in map, render the emoji as fallback
    return <span className={className} style={{ display: 'inline-block', ...style }}>{emoji}</span>;
  }
  
  const defaultColor = emojiColorMap[emoji] || 'currentColor';
  const iconColor = color || defaultColor;

  return (
    <span className={`inline-flex items-center justify-center shrink-0 ${className}`} style={{ verticalAlign: 'middle', ...style }}>
      <IconComponent size={size} color={iconColor} />
    </span>
  );
}
