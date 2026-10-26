import React from 'react';
import type { TabType } from '../../types';

import iconSetting from '../../assets/icons/sidebar/setting.svg';
import iconUser from '../../assets/icons/sidebar/user.svg';
import { SIDEBAR_NAV_ITEMS } from './sidebarConfig';

interface SidebarNavProps {
  activeTab: TabType;
  onTabChange: (tab: TabType) => void;
  onOpenProfile?: () => void;
  onOpenSettings: () => void;
}

export const SidebarNav: React.FC<SidebarNavProps> = ({
  activeTab,
  onTabChange,
  onOpenProfile,
  onOpenSettings,
}) => {
  return (
    <aside className="sidebar-nav">
      <div className="sidebar-nav-surface">
        <div className="sidebar-brand" title="Bazaar Cheat Sheet" data-tauri-drag-region>
          <span className="sidebar-brand-short">B</span>
          <span className="sidebar-brand-full">Bazaar Cheat Sheet</span>
        </div>

        <div className="sidebar-nav-list">
          {SIDEBAR_NAV_ITEMS.map((item) => (
            <button
              key={item.id}
              className={`sidebar-nav-btn ${activeTab === item.id ? 'active' : ''}`}
              onClick={() => onTabChange(item.id)}
              title={item.label}
            >
              <img src={item.icon} alt="" className="sidebar-nav-icon" />
              <span className="sidebar-nav-label">{item.label}</span>
            </button>
          ))}
        </div>

        <div className="sidebar-bottom-actions">
          {onOpenProfile ? (
            <button className="sidebar-profile-btn" onClick={onOpenProfile} title="Profile">
              <img src={iconUser} alt="" className="sidebar-nav-icon" />
              <span className="sidebar-nav-label">Profile</span>
            </button>
          ) : null}
          <button className="sidebar-settings-btn" onClick={onOpenSettings} title="Settings">
            <img src={iconSetting} alt="" className="sidebar-nav-icon" />
            <span className="sidebar-nav-label">Settings</span>
          </button>
        </div>
      </div>
    </aside>
  );
};
