import type { TabType } from '../../types';

import iconHistory from '../../assets/icons/sidebar/history.svg';
import iconBattle from '../../assets/icons/sidebar/battle.svg';
import iconScanner from '../../assets/icons/sidebar/scanner.svg';
import iconChest from '../../assets/icons/sidebar/chest.svg';
import iconSearch from '../../assets/icons/sidebar/search.svg';

export interface SidebarNavItem {
  id: TabType;
  label: string;
  icon: string;
}

export const SIDEBAR_NAV_ITEMS: SidebarNavItem[] = [
  { id: 'history', label: 'Match History', icon: iconHistory },
  { id: 'monster', label: 'Monsters', icon: iconBattle },
  { id: 'card', label: 'Card Scanner', icon: iconScanner },
  { id: 'items', label: 'My Items', icon: iconChest },
  { id: 'search', label: 'Wiki Search', icon: iconSearch },
];
