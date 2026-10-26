import React, { useEffect, useRef } from 'react';
import { invoke } from '@tauri-apps/api/core';

interface SearchQueryState {
  keyword: string;
  item_type: string;
  size: string;
  start_tier: string;
  hero: string;
  tags: string;
  hidden_tags: string;
}

interface SearchFiltersPanelProps {
  isSearchFilterCollapsed: boolean;
  setIsSearchFilterCollapsed: (value: boolean) => void;
  matchMode: 'all' | 'any';
  setMatchMode: (value: 'all' | 'any') => void;
  searchFilterHeight: number;
  searchQuery: SearchQueryState;
  setSearchQuery: React.Dispatch<React.SetStateAction<SearchQueryState>>;
  setIsInputFocused: (value: boolean) => void;
  lastItemSize: string;
  setLastItemSize: (value: string) => void;
  selectedTags: string[];
  setSelectedTags: (value: string[]) => void;
  selectedHiddenTags: string[];
  setSelectedHiddenTags: (value: string[]) => void;
  hiddenTagIcons: Record<string, string>;
  isSearching: boolean;
  searchResultsCount: number;
  setResizeStartY: (value: number) => void;
  setResizeStartHeight: (value: number) => void;
  setIsResizingFilter: (value: boolean) => void;
  isResizingFilter: boolean;
}

const SearchFiltersPanelImpl: React.FC<SearchFiltersPanelProps> = ({
  isSearchFilterCollapsed,
  setIsSearchFilterCollapsed,
  matchMode,
  setMatchMode,
  searchFilterHeight,
  searchQuery,
  setSearchQuery,
  setIsInputFocused,
  lastItemSize,
  setLastItemSize,
  selectedTags,
  setSelectedTags,
  selectedHiddenTags,
  setSelectedHiddenTags,
  hiddenTagIcons,
  isSearching,
  searchResultsCount,
  setResizeStartY,
  setResizeStartHeight,
  setIsResizingFilter,
  isResizingFilter,
}) => {
  const isComposingRef = useRef(false);
  const unlockTimerRef = useRef<number | null>(null);

  const pushNoCollapseGrace = (ms = 700) => {
    document.body.setAttribute('data-no-collapse-until', String(Date.now() + ms));
  };

  const clearUnlockTimer = () => {
    if (unlockTimerRef.current !== null) {
      window.clearTimeout(unlockTimerRef.current);
      unlockTimerRef.current = null;
    }
  };

  const scheduleUnlockCollapseByInput = (ms = 280) => {
    clearUnlockTimer();
    unlockTimerRef.current = window.setTimeout(() => {
      unlockTimerRef.current = null;
      document.body.removeAttribute('data-input-focus-lock');
      document.body.removeAttribute('data-search-input-active');
      if (!isComposingRef.current) {
        document.body.removeAttribute('data-ime-composing');
      }
      setIsInputFocused(false);
    }, ms);
  };

  const lockCollapseByInput = () => {
    clearUnlockTimer();
    document.body.setAttribute('data-input-focus-lock', '1');
    document.body.setAttribute('data-search-input-active', '1');
    setIsInputFocused(true);
    pushNoCollapseGrace(900);
  };

  const unlockCollapseByInput = () => {
    clearUnlockTimer();
    document.body.removeAttribute('data-input-focus-lock');
    document.body.removeAttribute('data-search-input-active');
    document.body.removeAttribute('data-ime-composing');
    setIsInputFocused(false);
  };

  useEffect(() => {
    const onPointerDown = (event: MouseEvent) => {
      const target = event.target as HTMLElement | null;
      if (!target) return;
      const stillInTyping = Boolean(
        target.closest('input, textarea, [contenteditable="true"], .search-input'),
      );
      if (stillInTyping) {
        lockCollapseByInput();
        return;
      }
      unlockCollapseByInput();
    };

    document.addEventListener('mousedown', onPointerDown, true);

    return () => {
      document.removeEventListener('mousedown', onPointerDown, true);
      clearUnlockTimer();
      document.body.removeAttribute('data-ime-composing');
      document.body.removeAttribute('data-search-input-active');
      document.body.removeAttribute('data-no-collapse-until');
      document.body.removeAttribute('data-input-focus-lock');
    };
  }, []);

  return (
    <div className="search-box-container" data-no-drag style={{
      zIndex: 10,
      borderBottom: '1px solid rgba(255,255,255,0.1)',
      background: '#2b2621',
      boxShadow: '0 4px 6px rgba(0,0,0,0.3)',
      display: 'flex',
      flexDirection: 'column',
      height: isSearchFilterCollapsed ? 'auto' : `${searchFilterHeight}px`,
      position: 'relative',
    }}>
      <div data-no-drag style={{
        padding: '12px',
        display: 'flex',
        flexDirection: 'column',
        gap: '8px',
        overflowY: 'auto',
        flex: 1,
        scrollbarWidth: 'thin',
        scrollbarColor: '#ffcd19 rgba(0,0,0,0.3)',
      }} className="custom-scrollbar">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            <div style={{ fontSize: '12px', color: '#ffcd19', fontWeight: 'bold' }}>Search filters</div>
            <div style={{ display: 'flex', gap: '4px' }}>
              <button
                onClick={() => setMatchMode('all')}
                className={`toggle-btn ${matchMode === 'all' ? 'active' : ''}`}
                style={{
                  padding: '4px 8px',
                  fontSize: '11px',
                  borderRadius: '4px',
                  background: matchMode === 'all' ? '#ffcd19' : 'transparent',
                  color: matchMode === 'all' ? '#1e1b18' : '#ffcd19',
                  border: '1px solid #ffcd19',
                  cursor: 'pointer',
                }}
                title="Every selected filter must match"
              >
                Match all
              </button>
              <button
                onClick={() => setMatchMode('any')}
                className={`toggle-btn ${matchMode === 'any' ? 'active' : ''}`}
                style={{
                  padding: '4px 8px',
                  fontSize: '11px',
                  borderRadius: '4px',
                  background: matchMode === 'any' ? '#ffcd19' : 'transparent',
                  color: matchMode === 'any' ? '#1e1b18' : '#ffcd19',
                  border: '1px solid #ffcd19',
                  cursor: 'pointer',
                }}
                title="Any selected filter can match"
              >
                Match any
              </button>
            </div>
          </div>
          <button
            onClick={() => setIsSearchFilterCollapsed(!isSearchFilterCollapsed)}
            style={{
              background: 'transparent',
              border: '1px solid rgba(255,205,25,0.3)',
              color: '#ffcd19',
              padding: '4px 8px',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '11px',
            }}
          >
            {isSearchFilterCollapsed ? 'Expand ▼' : 'Collapse ▲'}
          </button>
        </div>

        {!isSearchFilterCollapsed && (
          <>
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              <input
                className="search-input"
                placeholder="Search name / description..."
                value={searchQuery.keyword}
                onChange={(e) => setSearchQuery({ ...searchQuery, keyword: e.target.value })}
                onInput={() => {
                  pushNoCollapseGrace(900);
                }}
                onKeyDown={() => {
                  pushNoCollapseGrace(900);
                }}
                onFocus={() => {
                  lockCollapseByInput();
                  pushNoCollapseGrace(1200);
                  invoke('set_overlay_ignore_cursor', { ignore: false }).catch(() => {});
                }}
                onBlur={() => {
                  window.setTimeout(() => {
                    pushNoCollapseGrace(900);
                    if (isComposingRef.current || document.body.getAttribute('data-ime-composing') === '1') {
                      lockCollapseByInput();
                      return;
                    }
                    const active = document.activeElement as HTMLElement | null;
                    const tag = active?.tagName?.toLowerCase();
                    const stillTyping = Boolean(
                      active
                      && (tag === 'input' || tag === 'textarea' || active.isContentEditable),
                    );
                    if (stillTyping) {
                      lockCollapseByInput();
                    } else {
                      scheduleUnlockCollapseByInput(260);
                    }
                  }, 120);
                }}
                onCompositionStart={() => {
                  isComposingRef.current = true;
                  document.body.setAttribute('data-ime-composing', '1');
                  lockCollapseByInput();
                  pushNoCollapseGrace(1400);
                }}
                onCompositionEnd={() => {
                  isComposingRef.current = false;
                  document.body.removeAttribute('data-ime-composing');
                  lockCollapseByInput();
                  pushNoCollapseGrace(1200);

                  window.setTimeout(() => {
                    const active = document.activeElement as HTMLElement | null;
                    const tag = active?.tagName?.toLowerCase();
                    const stillTyping = Boolean(
                      active
                      && (tag === 'input' || tag === 'textarea' || active.isContentEditable),
                    );
                    if (!stillTyping) {
                      scheduleUnlockCollapseByInput(260);
                    }
                  }, 120);
                }}
                style={{
                  flex: 1,
                  minWidth: '200px',
                  background: '#1e1b18',
                  border: '1px solid #48413a',
                  color: '#eee',
                  padding: '8px 12px',
                  borderRadius: '4px',
                  fontSize: '14px',
                }}
              />
            </div>

            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                {[
                  { val: 'item', label: 'Item' },
                  { val: 'skill', label: 'Skill' },
                ].map((opt) => (
                  <button
                    key={opt.val}
                    className={`toggle-btn ${searchQuery.item_type === opt.val ? 'active' : ''}`}
                    onClick={() => {
                      if (searchQuery.item_type === opt.val) {
                        setSearchQuery({ ...searchQuery, item_type: 'all', size: opt.val === 'skill' ? lastItemSize : searchQuery.size });
                      } else if (opt.val === 'skill') {
                        setLastItemSize(searchQuery.size);
                        setSearchQuery({ ...searchQuery, item_type: opt.val, size: '' });
                      } else {
                        const restoredSize = searchQuery.item_type === 'skill' ? lastItemSize : searchQuery.size;
                        setSearchQuery({ ...searchQuery, item_type: opt.val, size: restoredSize });
                      }
                    }}
                    style={{ padding: '6px 10px', borderRadius: 6 }}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>

              {searchQuery.item_type !== 'skill' && (
                <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                  {[
                    { val: 'small', label: 'Small' },
                    { val: 'medium', label: 'Medium' },
                    { val: 'large', label: 'Large' },
                  ].map((opt) => (
                    <button
                      key={opt.val}
                      className={`toggle-btn ${searchQuery.size === opt.val ? 'active' : ''}`}
                      onClick={() => setSearchQuery({ ...searchQuery, size: searchQuery.size === opt.val ? '' : opt.val })}
                      style={{ padding: '6px 10px', borderRadius: 6 }}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                {[
                  { val: 'bronze', label: 'Bronze', color: '#cd7f32' },
                  { val: 'silver', label: 'Silver', color: '#c0c0c0' },
                  { val: 'gold', label: 'Gold', color: '#ffd700' },
                  { val: 'diamond', label: 'Diamond', color: '#b9f2ff' },
                  { val: 'legendary', label: 'Legendary', color: '#ff4500' },
                ].map((opt) => (
                  <button
                    key={opt.val}
                    className={`toggle-btn ${searchQuery.start_tier === opt.val ? 'active' : ''}`}
                    onClick={() => setSearchQuery({ ...searchQuery, start_tier: searchQuery.start_tier === opt.val ? '' : opt.val })}
                    style={{ padding: '6px 10px', borderRadius: 6, color: opt.color }}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>

              <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                {[
                  { val: 'Common', label: 'Neutral', avatar: '' },
                  { val: 'Pygmalien', label: 'Pygmalien', avatar: '/images/heroes/pygmalien.webp' },
                  { val: 'Jules', label: 'Jules', avatar: '/images/heroes/jules.webp' },
                  { val: 'Vanessa', label: 'Vanessa', avatar: '/images/heroes/vanessa.webp' },
                  { val: 'Mak', label: 'Mak', avatar: '/images/heroes/mak.webp' },
                  { val: 'Dooley', label: 'Dooley', avatar: '/images/heroes/dooley.webp' },
                  { val: 'Stelle', label: 'Stelle', avatar: '/images/heroes/stelle.webp' },
                  { val: 'Karnok', label: 'K', avatar: '' },
                ].map((opt) => (
                  <button
                    key={opt.val}
                    className={`toggle-btn ${opt.avatar ? 'hero-btn' : ''} ${searchQuery.hero === opt.val ? 'active' : ''}`}
                    onClick={() => setSearchQuery({ ...searchQuery, hero: searchQuery.hero === opt.val ? '' : opt.val })}
                    title={opt.label}
                  >
                    {opt.avatar ? <img src={opt.avatar} alt={opt.label} /> : opt.label}
                  </button>
                ))}
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <div style={{ fontSize: '11px', color: '#888' }}>Tags (multi-select)</div>
              <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                {[
                  ['Drone', 'Drone'],
                  ['Property', 'Property'],
                  ['Ray', 'Ray'],
                  ['Tool', 'Tool'],
                  ['Dinosaur', 'Dinosaur'],
                  ['Loot', 'Loot'],
                  ['Apparel', 'Apparel'],
                  ['Core', 'Core'],
                  ['Weapon', 'Weapon'],
                  ['Aquatic', 'Aquatic'],
                  ['Toy', 'Toy'],
                  ['Tech', 'Tech'],
                  ['Potion', 'Potion'],
                  ['Reagent', 'Reagent'],
                  ['Vehicle', 'Vehicle'],
                  ['Relic', 'Relic'],
                  ['Food', 'Food'],
                  ['Dragon', 'Dragon'],
                  ['Friend', 'Friend'],
                ].sort((a, b) => a[1].localeCompare(b[1], 'zh-CN')).map(([val, label]) => (
                  <button
                    key={val}
                    className={`toggle-btn ${selectedTags.includes(val) ? 'active' : ''}`}
                    onClick={() => {
                      if (selectedTags.includes(val)) {
                        setSelectedTags(selectedTags.filter((t) => t !== val));
                      } else {
                        setSelectedTags([...selectedTags, val]);
                      }
                    }}
                    style={{ padding: '6px 10px', borderRadius: 6, fontSize: '12px' }}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <div style={{ fontSize: '11px', color: '#888' }}>Hidden tags (multi-select)</div>
              <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                {(() => {
                  const tagGroups = [
                    { tags: [['Ammo', 'Ammo'], ['AmmoRef', 'Ammo-related']], icon: 'Ammo', color: 'var(--c-ammo)' },
                    { tags: [['Burn', 'Burn'], ['BurnRef', 'Burn-related']], icon: 'Burn', color: 'var(--c-burn)' },
                    { tags: [['Charge', 'Charge']], icon: 'Charge', color: 'var(--c-charge)' },
                    { tags: [['Cooldown', 'Cooldown'], ['CooldownReference', 'Cooldown-related']], icon: 'Cooldown', color: 'var(--c-cooldown)' },
                    { tags: [['Crit', 'Crit'], ['CritRef', 'Crit-related']], icon: 'CritChance', color: 'var(--c-crit)' },
                    { tags: [['Damage', 'Damage'], ['DamageRef', 'Damage-related']], icon: 'Damage', color: 'var(--c-damage)' },
                    { tags: [['EconomyRef', 'Economy-related'], ['Gold', 'Gold']], icon: 'Income', color: 'var(--c-golden)' },
                    { tags: [['Flying', 'Flying'], ['FlyingRef', 'Flying-related']], icon: 'Flying', color: 'var(--c-fly)' },
                    { tags: [['Freeze', 'Freeze'], ['FreezeRef', 'Freeze-related']], icon: 'Freeze', color: 'var(--c-freeze)' },
                    { tags: [['Haste', 'Haste'], ['HasteRef', 'Haste-related']], icon: 'Haste', color: 'var(--c-haste)' },
                    { tags: [['Heal', 'Heal'], ['HealRef', 'Heal-related']], icon: 'Health', color: 'var(--c-heal)' },
                    { tags: [['Health', 'Health'], ['HealthRef', 'Health-related']], icon: 'MaxHPHeart', color: 'var(--c-heal)' },
                    { tags: [['Lifesteal', 'Lifesteal']], icon: 'Lifesteal', color: 'var(--c-lifesteal)' },
                    { tags: [['Poison', 'Poison'], ['PoisonRef', 'Poison-related']], icon: 'Poison', color: 'var(--c-poison)' },
                    { tags: [['Quest', 'Quest']], icon: null, color: '#9098fe' },
                    { tags: [['Regen', 'Regen'], ['RegenRef', 'Regen-related']], icon: 'Regen', color: 'var(--c-regen)' },
                    { tags: [['Shield', 'Shield'], ['ShieldRef', 'Shield-related']], icon: 'Shield', color: 'var(--c-shield)' },
                    { tags: [['Slow', 'Slow'], ['SlowRef', 'Slow-related']], icon: 'Slowness', color: 'var(--c-slow)' },
                  ];

                  return tagGroups.map((group, groupIndex) => (
                    <div key={groupIndex} style={{ display: 'flex', gap: '2px', alignItems: 'center' }}>
                      {group.tags.map(([val, label], index) => (
                        <button
                          key={val}
                          className={`toggle-btn ${selectedHiddenTags.includes(val) ? 'active' : ''}`}
                          onClick={() => {
                            if (selectedHiddenTags.includes(val)) {
                              setSelectedHiddenTags(selectedHiddenTags.filter((t) => t !== val));
                            } else {
                              setSelectedHiddenTags([...selectedHiddenTags, val]);
                            }
                          }}
                          style={{
                            padding: '6px 10px',
                            borderRadius: 6,
                            fontSize: '12px',
                            color: group.color,
                            display: 'flex',
                            alignItems: 'center',
                            gap: '4px',
                          }}
                        >
                          {index === 0 && group.icon && hiddenTagIcons[group.icon] && (
                            <img
                              src={hiddenTagIcons[group.icon]}
                              alt=""
                              style={{ width: '14px', height: '14px', display: 'inline-block' }}
                            />
                          )}
                          {label}
                        </button>
                      ))}
                    </div>
                  ));
                })()}
              </div>
            </div>
          </>
        )}
      </div>

      <div style={{
        padding: '8px 12px',
        borderTop: '1px solid rgba(255,255,255,0.05)',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        background: 'rgba(0,0,0,0.2)',
      }}>
        <div style={{ fontSize: '13px', color: '#a0937d' }}>
          {isSearching ? (
            <><span style={{ color: '#d4af37' }}>🔍</span> Searching...</>
          ) : (
            <>Found <span style={{ color: '#ffcc00', fontWeight: 'bold' }}>{searchResultsCount}</span> result(s)</>
          )}
        </div>
        <button
          className="bulk-btn"
          style={{ fontSize: '11px', padding: '4px 8px' }}
          onClick={() => {
            setSearchQuery({ keyword: '', item_type: 'all', size: '', start_tier: '', hero: '', tags: '', hidden_tags: '' });
            setSelectedTags([]);
            setSelectedHiddenTags([]);
          }}
        >
          Reset
        </button>
      </div>

      {!isSearchFilterCollapsed && (
        <div
          onMouseDown={(e) => {
            e.preventDefault();
            setResizeStartY(e.clientY);
            setResizeStartHeight(searchFilterHeight);
            setIsResizingFilter(true);
          }}
          style={{
            position: 'absolute',
            bottom: '0',
            left: '0',
            right: '0',
            height: '8px',
            cursor: 'ns-resize',
            background: 'linear-gradient(to bottom, transparent, rgba(255,205,25,0.1))',
            borderTop: '1px solid rgba(255,205,25,0.2)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'background 0.2s',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = 'linear-gradient(to bottom, transparent, rgba(255,205,25,0.2))';
          }}
          onMouseLeave={(e) => {
            if (!isResizingFilter) {
              e.currentTarget.style.background = 'linear-gradient(to bottom, transparent, rgba(255,205,25,0.1))';
            }
          }}
        >
          <div style={{
            width: '40px',
            height: '3px',
            borderRadius: '2px',
            background: 'rgba(255,205,25,0.4)',
          }} />
        </div>
      )}
    </div>
  );
};

export const SearchFiltersPanel = React.memo(SearchFiltersPanelImpl);
