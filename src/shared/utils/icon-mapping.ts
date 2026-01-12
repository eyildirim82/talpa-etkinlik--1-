/**
 * Material Symbols → Lucide Icon Mapping
 * 
 * This file provides a mapping from Material Symbols icon names to Lucide React icons.
 * Used for migrating from Material Symbols (font-based) to Lucide (SVG-based).
 */

// Material Symbols icon names to Lucide icon component names
export const MATERIAL_TO_LUCIDE_MAP: Record<string, string> = {
  dashboard: 'LayoutDashboard',
  event: 'Calendar',
  confirmation_number: 'Ticket',
  group: 'Users',
  diamond: 'Gem',
  chevron_right: 'ChevronRight',
  chevron_left: 'ChevronLeft',
  logout: 'LogOut',
  event_available: 'CalendarCheck',
  search: 'Search',
  filter_list: 'Filter',
  calendar_month: 'Calendar',
  add: 'Plus',
  close: 'X',
  upload_file: 'Upload',
  trending_up: 'TrendingUp',
  notifications: 'Bell',
  // Add more mappings as needed
};

/**
 * Get Lucide icon name for a Material Symbols icon name
 */
export function getLucideIconName(materialIconName: string): string {
  return MATERIAL_TO_LUCIDE_MAP[materialIconName] || materialIconName;
}
