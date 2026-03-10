// Admin Panel Design System - Standardized styling constants

export const COLORS = {
  // Primary actions
  primary: {
    bg: 'bg-green-600',
    bgHover: 'hover:bg-green-700',
    text: 'text-green-600',
    border: 'border-green-600',
    ring: 'ring-green-500/30',
  },
  // Status colors
  status: {
    success: {
      bg: 'bg-green-100',
      text: 'text-green-700',
      icon: 'text-green-500',
    },
    warning: {
      bg: 'bg-amber-100',
      text: 'text-amber-700',
      icon: 'text-amber-500',
    },
    error: {
      bg: 'bg-red-100',
      text: 'text-red-700',
      icon: 'text-red-500',
    },
    info: {
      bg: 'bg-blue-100',
      text: 'text-blue-700',
      icon: 'text-blue-500',
    },
    neutral: {
      bg: 'bg-gray-100',
      text: 'text-gray-700',
      icon: 'text-gray-500',
    },
  },
  // Role badges
  roles: {
    Admin: 'bg-purple-100 text-purple-700',
    Client: 'bg-blue-100 text-blue-700',
    Freelancer: 'bg-green-100 text-green-700',
  },
  // Verification badges
  verification: {
    Unverified: 'bg-gray-100 text-gray-600',
    'ID-Verified': 'bg-blue-100 text-blue-700',
    'Skill-Tested': 'bg-green-100 text-green-700',
  },
}

export const SPACING = {
  // Card padding
  card: {
    sm: 'p-4',
    md: 'p-5',
    lg: 'p-6',
  },
  // Section gaps
  section: {
    sm: 'space-y-4',
    md: 'space-y-6',
    lg: 'space-y-8',
  },
  // Grid gaps
  grid: {
    sm: 'gap-3',
    md: 'gap-4',
    lg: 'gap-6',
  },
}

export const TYPOGRAPHY = {
  // Page headings
  h1: 'text-2xl font-bold text-gray-900',
  h2: 'text-xl font-semibold text-gray-900',
  h3: 'text-lg font-semibold text-gray-900',
  // Body text
  body: 'text-sm text-gray-700',
  bodySmall: 'text-xs text-gray-600',
  // Labels
  label: 'text-xs font-medium text-gray-500',
  // Muted text
  muted: 'text-sm text-gray-500',
}

export const BUTTONS = {
  // Primary button
  primary: 'px-4 py-2 text-sm bg-green-600 text-white rounded-lg hover:bg-green-700 transition disabled:opacity-50',
  // Secondary button
  secondary: 'px-4 py-2 text-sm border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition',
  // Danger button
  danger: 'px-4 py-2 text-sm bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition',
  // Icon button
  icon: 'p-2 hover:bg-gray-100 rounded-lg transition',
  // Small button
  small: 'px-3 py-1.5 text-xs rounded-lg transition',
}

export const INPUTS = {
  // Text input
  text: 'w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500/30 focus:border-green-500',
  // Select
  select: 'px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500/30',
  // Textarea
  textarea: 'w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500/30',
  // Search input
  search: 'w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500/30 focus:border-green-500',
}

export const CARDS = {
  // Standard card
  base: 'bg-white rounded-xl border border-gray-200',
  // Hover card
  hover: 'bg-white rounded-xl border border-gray-200 hover:shadow-md transition-shadow',
  // Stats card
  stats: 'bg-white rounded-xl border border-gray-200 p-4',
}

export const BADGES = {
  // Small badge
  sm: 'text-xs px-2 py-0.5 rounded-full',
  // Medium badge
  md: 'text-sm px-2.5 py-1 rounded-full',
  // With icon
  withIcon: 'text-xs px-2 py-0.5 rounded-full flex items-center gap-1 w-fit',
}

export const TABLES = {
  // Table wrapper
  wrapper: 'bg-white rounded-xl border border-gray-200 overflow-hidden',
  // Table header
  header: 'bg-gray-50 border-b border-gray-200',
  // Table header cell
  th: 'text-left px-4 py-3 font-medium text-gray-500',
  // Table body cell
  td: 'px-4 py-3',
  // Table row
  row: 'hover:bg-gray-50 transition',
}

export const MODALS = {
  // Modal overlay
  overlay: 'fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4',
  // Modal container
  container: 'bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto',
  // Modal header
  header: 'p-6 border-b border-gray-100 flex items-center justify-between',
  // Modal body
  body: 'p-6',
  // Modal footer
  footer: 'p-6 border-t border-gray-100 flex items-center justify-end gap-3',
}

export const PAGINATION = {
  // Pagination wrapper
  wrapper: 'flex items-center justify-between px-4 py-3 border-t border-gray-100',
  // Pagination button
  button: 'p-1.5 border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed',
  // Pagination text
  text: 'text-sm text-gray-500',
}

// Responsive breakpoints
export const BREAKPOINTS = {
  sm: '640px',
  md: '768px',
  lg: '1024px',
  xl: '1280px',
  '2xl': '1536px',
}

// Grid configurations
export const GRIDS = {
  // Stats grid
  stats: 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4',
  // Card grid
  cards: 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4',
  // Form grid
  form: 'grid grid-cols-1 md:grid-cols-2 gap-4',
}

// Animation classes
export const ANIMATIONS = {
  // Fade in
  fadeIn: 'animate-fade-in',
  // Slide in
  slideIn: 'animate-slide-in',
  // Pulse
  pulse: 'animate-pulse',
  // Spin
  spin: 'animate-spin',
}

// Helper function to combine classes
export function cn(...classes: (string | undefined | null | false)[]): string {
  return classes.filter(Boolean).join(' ')
}
