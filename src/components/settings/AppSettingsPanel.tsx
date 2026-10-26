import { memo } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { SettingGroup } from '../SettingsPanel';
import { SponsorSection } from './SponsorSection';
import { HotkeyCaptureOverlay } from './HotkeyCaptureOverlay';
import { ResetHotkeysConfirmModal } from './ResetHotkeysConfirmModal';
import { getHotkeyLabel } from '../../utils/helpers';

interface SettingsExpandedState {
  ui: boolean;
  yolo: boolean;
  hotkeys: boolean;
  debug: boolean;
}

import type { Dispatch, SetStateAction } from 'react';

interface AppSettingsPanelProps {
  visible: boolean;
  inline?: boolean;
  onClose: () => void;
  settingsExpanded: SettingsExpandedState;
  setSettingsExpanded: Dispatch<SetStateAction<SettingsExpandedState>>;
  fontSize: number;
  setFontSize: Dispatch<SetStateAction<number>>;
  setExpandedWidth: Dispatch<SetStateAction<number>>;
  setExpandedHeight: Dispatch<SetStateAction<number>>;
  setHasCustomPosition: Dispatch<SetStateAction<boolean>>;
  showToast: (message: string, type?: 'success' | 'error' | 'warning' | 'info') => void;
  enableYoloAuto: boolean;
  setEnableYoloAuto: Dispatch<SetStateAction<boolean>>;
  useGpuAcceleration: boolean;
  setUseGpuAcceleration: Dispatch<SetStateAction<boolean>>;
  yoloScanInterval: number;
  setYoloScanInterval: Dispatch<SetStateAction<number>>;
  showYoloMonitor: boolean;
  setShowYoloMonitor: Dispatch<SetStateAction<boolean>>;
  yoloHotkey: number | null;
  setYoloHotkey: Dispatch<SetStateAction<number | null>>;
  isRecordingYoloHotkey: boolean;
  setIsRecordingYoloHotkey: Dispatch<SetStateAction<boolean>>;
  detailDisplayHotkey: number | null;
  setDetailDisplayHotkey: Dispatch<SetStateAction<number | null>>;
  isRecordingDetailHotkey: boolean;
  setIsRecordingDetailHotkey: Dispatch<SetStateAction<boolean>>;
  detectionHotkey: number | null;
  setDetectionHotkey: Dispatch<SetStateAction<number | null>>;
  isRecordingHotkey: boolean;
  setIsRecordingHotkey: Dispatch<SetStateAction<boolean>>;
  cardDetectionHotkey: number | null;
  setCardDetectionHotkey: Dispatch<SetStateAction<number | null>>;
  isRecordingCardHotkey: boolean;
  setIsRecordingCardHotkey: Dispatch<SetStateAction<boolean>>;
  toggleCollapseHotkey: number | null;
  setToggleCollapseHotkey: Dispatch<SetStateAction<number | null>>;
  isRecordingToggleHotkey: boolean;
  setIsRecordingToggleHotkey: Dispatch<SetStateAction<boolean>>;
  showResetHotkeysConfirm: boolean;
  setShowResetHotkeysConfirm: Dispatch<SetStateAction<boolean>>;
  onConfirmResetHotkeys: () => Promise<void>;
  currentVersion: string;
  updateStatus: string;
  downloadProgress: number;
  updateAvailableVersion?: string;
  onManualCheckUpdate: () => Promise<void>;
  onStartUpdateDownload: () => void;
  onInstallReady: () => void;
  announcement: string;
  sponsorIcons: { vx: string; zfb: string };
}

function AppSettingsPanelImpl(props: AppSettingsPanelProps) {
  const {
    visible,
    inline = false,
    onClose,
    settingsExpanded,
    setSettingsExpanded,
    fontSize,
    setFontSize,
    setExpandedWidth,
    setExpandedHeight,
    setHasCustomPosition,
    showToast,
    enableYoloAuto,
    setEnableYoloAuto,
    useGpuAcceleration,
    setUseGpuAcceleration,
    yoloScanInterval,
    setYoloScanInterval,
    showYoloMonitor: _showYoloMonitor,
    setShowYoloMonitor: _setShowYoloMonitor,
    yoloHotkey,
    setYoloHotkey,
    isRecordingYoloHotkey,
    setIsRecordingYoloHotkey,
    detailDisplayHotkey,
    setDetailDisplayHotkey,
    isRecordingDetailHotkey,
    setIsRecordingDetailHotkey,
    detectionHotkey,
    setDetectionHotkey,
    isRecordingHotkey,
    setIsRecordingHotkey,
    cardDetectionHotkey,
    setCardDetectionHotkey,
    isRecordingCardHotkey,
    setIsRecordingCardHotkey,
    toggleCollapseHotkey,
    setToggleCollapseHotkey,
    isRecordingToggleHotkey,
    setIsRecordingToggleHotkey,
    showResetHotkeysConfirm,
    setShowResetHotkeysConfirm,
    onConfirmResetHotkeys,
    currentVersion,
    updateStatus,
    downloadProgress,
    updateAvailableVersion,
    onManualCheckUpdate,
    onStartUpdateDownload,
    onInstallReady,
    announcement,
    sponsorIcons,
  } = props;

  if (!visible) return null;

  const panel = (
    <div className={`settings-panel ${inline ? 'inline' : ''}`} onClick={(e) => e.stopPropagation()}>
        <div className="settings-header">
          <h3>Settings</h3>
          {!inline ? <button className="close-panel-btn" onClick={onClose}>×</button> : null}
        </div>

        <div className="settings-content" data-no-drag>
          <SettingGroup
            title="⚙️ Interface"
            expanded={settingsExpanded.ui}
            onToggle={() => setSettingsExpanded((prev) => ({ ...prev, ui: !prev.ui }))}
          >
            <div className="setting-item">
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <label>Font size: {fontSize}px</label>
                <button className="bulk-btn" style={{ padding: '2px 8px' }} onClick={() => {
                  setFontSize(16);
                  localStorage.setItem('user-font-size', '16');
                  showToast('Font size reset', 'success');
                }}>Reset</button>
              </div>
              <input
                type="range"
                min="10"
                max="32"
                value={fontSize}
                onChange={(e) => {
                  const val = parseInt(e.target.value, 10);
                  setFontSize(val);
                  localStorage.setItem('user-font-size', val.toString());
                }}
              />
            </div>

            <div className="setting-item">
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <label>Window layout</label>
                <button className="bulk-btn" style={{ padding: '2px 8px' }} onClick={() => {
                  localStorage.removeItem('plugin-width');
                  localStorage.removeItem('plugin-height');
                  setExpandedWidth(400);
                  setExpandedHeight(700);
                  setHasCustomPosition(false);
                  showToast('Window layout reset', 'success');
                }}>Reset size and position</button>
              </div>
              <div className="setting-tip">Changes apply to all text immediately</div>
            </div>

            <div className="setting-item">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <label>Detail popup position</label>
                <button className="bulk-btn" style={{ padding: '4px 12px' }} onClick={async () => {
                  try {
                    await invoke('reset_detail_popup_position');
                    showToast('Detail popup position reset', 'success');
                  } catch (e) {
                    console.error('Failed to reset detail popup position:', e);
                    showToast('Reset failed', 'error');
                  }
                }}>Reset position</button>
              </div>
              <div style={{ fontSize: '11px', color: '#888', marginTop: '8px' }}>
                Moves the detail popup back to its default position (the center of the screen your mouse is on)
              </div>
            </div>
          </SettingGroup>

          <SettingGroup
            title="🔍 YOLO (AI scanner)"
            expanded={settingsExpanded.yolo}
            onToggle={() => setSettingsExpanded((prev) => ({ ...prev, yolo: !prev.yolo }))}
          >
            <div className="setting-item">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <label>YOLO auto-scan</label>
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                  {enableYoloAuto && (
                    <button
                      className="bulk-btn"
                      style={{
                        padding: '4px 12px',
                        background: useGpuAcceleration ? 'rgba(76, 175, 80, 0.2)' : 'rgba(244, 67, 54, 0.2)',
                        borderColor: useGpuAcceleration ? '#4CAF50' : '#f44336',
                        color: useGpuAcceleration ? '#4CAF50' : '#f44336',
                      }}
                      onClick={() => {
                        const newVal = !useGpuAcceleration;
                        setUseGpuAcceleration(newVal);
                        localStorage.setItem('use-gpu-acceleration', newVal.toString());
                        showToast(`GPU acceleration ${newVal ? 'on' : 'off'}`, 'info');
                      }}
                    >
                      GPU acceleration: {useGpuAcceleration ? 'On' : 'Off'}
                    </button>
                  )}
                  <button
                    className="bulk-btn"
                    style={{
                      padding: '4px 12px',
                      background: enableYoloAuto ? 'rgba(76, 175, 80, 0.2)' : 'rgba(244, 67, 54, 0.2)',
                      borderColor: enableYoloAuto ? '#4CAF50' : '#f44336',
                      color: enableYoloAuto ? '#4CAF50' : '#f44336',
                    }}
                    onClick={() => {
                      const newVal = !enableYoloAuto;
                      setEnableYoloAuto(newVal);
                      localStorage.setItem('enable-yolo-auto', newVal.toString());
                      showToast(`YOLO auto-scan ${newVal ? 'on' : 'off'}`, 'info');
                    }}
                  >
                    {enableYoloAuto ? 'On' : 'Off'}
                  </button>
                </div>
              </div>
              <div style={{ fontSize: '11px', color: '#888', marginTop: '4px' }}>
                When on, scans your screen for cards on a timer (set how often below)
              </div>
            </div>

            <div className="setting-item" style={{ opacity: enableYoloAuto ? 1 : 0.5 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <label>YOLO scan interval</label>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <input
                    type="range"
                    min="0.5"
                    max="2"
                    step="0.1"
                    value={yoloScanInterval}
                    disabled={!enableYoloAuto}
                    onChange={(e) => {
                      const newVal = parseFloat(e.target.value);
                      setYoloScanInterval(newVal);
                      localStorage.setItem('yolo-scan-interval', newVal.toString());
                    }}
                    style={{ width: '120px', accentColor: '#ffcd19' }}
                  />
                  <span style={{ fontSize: '13px', color: '#ffcd19', fontWeight: 'bold', minWidth: '50px' }}>
                    {yoloScanInterval.toFixed(1)}s
                  </span>
                </div>
              </div>
              <div style={{ fontSize: '11px', color: '#888', marginTop: '4px' }}>
                Time between automatic scans (0.5 to 2 seconds)
              </div>
            </div>

            <div className="setting-item">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <label>YOLO results</label>
                <span style={{ fontSize: '12px', color: '#ffcd19', fontWeight: 600 }}>Island overview</span>
              </div>
              <div style={{ fontSize: '11px', color: '#888', marginTop: '4px' }}>
                The separate YOLO monitor window has been retired. Results from manual and automatic scans show in the collapsed island bar.
              </div>
            </div>

            <div className="setting-item">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <label>Image cache</label>
                <button
                  className="bulk-btn"
                  style={{ padding: '4px 12px' }}
                  onClick={async () => {
                    try {
                      const report = await invoke<{
                        removed_dirs: number;
                        removed_files: number;
                        removed_bytes: number;
                      }>('clear_generated_image_caches');
                      const mb = report.removed_bytes / (1024 * 1024);
                      showToast(
                        `Removed ${report.removed_files} file(s) (${mb.toFixed(2)} MB)`,
                        'success',
                      );
                    } catch (e) {
                      console.error('Failed to clear generated image caches:', e);
                      showToast('Cleanup failed. Check the logs.', 'error');
                    }
                  }}
                >
                  Clear cached images
                </button>
              </div>
              <div style={{ fontSize: '11px', color: '#888', marginTop: '4px' }}>
                Deletes cached search thumbnails and debug screenshots so they do not pile up and use disk space.
              </div>
            </div>

            <div className="setting-item">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <label>YOLO manual scan hotkey</label>
                <button className="bulk-btn" style={{ padding: '2px 8px' }} onClick={(e) => { e.preventDefault(); setIsRecordingYoloHotkey(true); }}>
                  {isRecordingYoloHotkey ? 'Press a key...' : (yoloHotkey ? getHotkeyLabel(yoloHotkey) : 'Not set')}
                </button>
              </div>
              <HotkeyCaptureOverlay
                visible={isRecordingYoloHotkey}
                description="Supports: keyboard keys, middle/side mouse buttons (not left or right click)"
                allowMouseButtons={[1, 3, 4]}
                onCapture={(vk) => {
                  setYoloHotkey(vk);
                  localStorage.setItem('yolo-hotkey', vk.toString());
                  setIsRecordingYoloHotkey(false);
                }}
                onCancel={() => setIsRecordingYoloHotkey(false)}
              />
              <div style={{ fontSize: '11px', color: '#888', marginTop: '4px' }}>
                Press this key to run a YOLO scan right away (default: not set)
              </div>
            </div>

            <div className="setting-item">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <label>Card details key</label>
                <button className="bulk-btn" style={{ padding: '2px 8px' }} onClick={(e) => { e.preventDefault(); setIsRecordingDetailHotkey(true); }}>
                  {isRecordingDetailHotkey ? 'Press a key...' : (detailDisplayHotkey ? getHotkeyLabel(detailDisplayHotkey) : 'Not set')}
                </button>
              </div>
              <HotkeyCaptureOverlay
                visible={isRecordingDetailHotkey}
                description="Supports: keyboard keys, left/middle/right/side mouse buttons"
                onCapture={(vk) => {
                  setDetailDisplayHotkey(vk);
                  invoke('set_detail_display_hotkey', { hotkey: vk });
                  setIsRecordingDetailHotkey(false);
                }}
                onCancel={() => setIsRecordingDetailHotkey(false)}
              />
              <div style={{ fontSize: '11px', color: '#888', marginTop: '4px' }}>
                Press this key to show details for the card, monster or event under the mouse (default: not set)
              </div>
            </div>
          </SettingGroup>

          <SettingGroup
            title="⌨️ Hotkeys"
            expanded={settingsExpanded.hotkeys}
            onToggle={() => setSettingsExpanded((prev) => ({ ...prev, hotkeys: !prev.hotkeys }))}
          >
            <div className="setting-item">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                <label>Monster scan key</label>
                <button className="bulk-btn" style={{ padding: '2px 8px' }} onClick={(e) => { e.preventDefault(); setIsRecordingHotkey(true); }}>
                  {isRecordingHotkey ? 'Press a key...' : (detectionHotkey ? getHotkeyLabel(detectionHotkey) : 'Not set')}
                </button>
              </div>
              <HotkeyCaptureOverlay
                visible={isRecordingHotkey}
                description="Supports: keyboard keys, left/middle/right/side mouse buttons"
                onCapture={(vk) => {
                  setDetectionHotkey(vk);
                  invoke('set_detection_hotkey', { hotkey: vk });
                  setIsRecordingHotkey(false);
                }}
                onCancel={() => setIsRecordingHotkey(false)}
              />
              <div className="setting-tip">Default: not set</div>
            </div>

            <div className="setting-item">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                <label>Card scan key</label>
                <button className="bulk-btn" style={{ padding: '2px 8px' }} onClick={(e) => { e.preventDefault(); setIsRecordingCardHotkey(true); }}>
                  {isRecordingCardHotkey ? 'Press a key...' : (cardDetectionHotkey ? getHotkeyLabel(cardDetectionHotkey) : 'Not set')}
                </button>
              </div>
              <HotkeyCaptureOverlay
                visible={isRecordingCardHotkey}
                description="Supports: keyboard keys, left/middle/right/side mouse buttons"
                onCapture={(vk) => {
                  setCardDetectionHotkey(vk);
                  invoke('set_card_detection_hotkey', { hotkey: vk });
                  setIsRecordingCardHotkey(false);
                }}
                onCancel={() => setIsRecordingCardHotkey(false)}
              />
              <div className="setting-tip">Default: not set</div>
            </div>

            <div className="setting-item">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                <label>Collapse/expand app</label>
                <button className="bulk-btn" style={{ padding: '2px 8px' }} onClick={(e) => { e.preventDefault(); setIsRecordingToggleHotkey(true); }}>
                  {isRecordingToggleHotkey ? 'Press a key...' : (toggleCollapseHotkey ? getHotkeyLabel(toggleCollapseHotkey) : 'Not set')}
                </button>
              </div>
              <HotkeyCaptureOverlay
                visible={isRecordingToggleHotkey}
                description="Supports: keyboard keys, middle/side mouse buttons (not left or right click)"
                allowMouseButtons={[1, 3, 4]}
                onCapture={(vk) => {
                  setToggleCollapseHotkey(vk);
                  invoke('set_toggle_collapse_hotkey', { hotkey: vk });
                  setIsRecordingToggleHotkey(false);
                }}
                onCancel={() => setIsRecordingToggleHotkey(false)}
              />
              <div className="setting-tip">Default: not set</div>
            </div>

            <div className="setting-divider" style={{ borderTop: '1px solid rgba(255,255,255,0.1)', margin: '15px 0' }}></div>

            <div className="setting-item">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <label>Hotkey management</label>
                <button className="bulk-btn" style={{ padding: '4px 12px', background: 'rgba(255, 69, 58, 0.15)', borderColor: 'rgba(255, 69, 58, 0.4)' }} onClick={() => {
                  setShowResetHotkeysConfirm(true);
                }}>Reset all hotkeys</button>
              </div>
              <div style={{ fontSize: '11px', color: '#888', marginTop: '8px' }}>
                Resets every hotkey to "Not set", which turns all hotkeys off
              </div>
            </div>

            <ResetHotkeysConfirmModal
              visible={showResetHotkeysConfirm}
              onCancel={() => setShowResetHotkeysConfirm(false)}
              onConfirm={onConfirmResetHotkeys}
            />
          </SettingGroup>

          <div className="setting-divider" style={{ borderTop: '1px solid rgba(255,255,255,0.1)', margin: '15px 0' }}></div>

          <div className="setting-item">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
              <label>Version: v{currentVersion}</label>
              <button
                className="bulk-btn"
                style={{
                  padding: '2px 8px',
                  opacity: updateStatus === 'checking' ? 0.5 : 1,
                  cursor: updateStatus === 'checking' ? 'not-allowed' : 'pointer',
                }}
                disabled={updateStatus === 'checking' || updateStatus === 'downloading'}
                onClick={() => void onManualCheckUpdate()}
              >
                {updateStatus === 'checking' ? 'Checking...' : 'Check for updates'}
              </button>
            </div>

            {updateStatus === 'checking' && <div style={{ fontSize: 'calc(12px * var(--font-scale, 1))', color: '#999' }}>Checking for updates...</div>}
            {updateStatus === 'none' && <div style={{ fontSize: 'calc(12px * var(--font-scale, 1))', color: '#238636' }}>You're on the latest version</div>}

            {(updateStatus === 'available' || updateStatus === 'downloading' || updateStatus === 'ready') && (
              <div style={{ background: 'rgba(56, 139, 253, 0.15)', border: '1px solid rgba(56, 139, 253, 0.4)', padding: '10px', borderRadius: '6px' }}>
                <div style={{ fontSize: 'calc(13px * var(--font-scale, 1))', fontWeight: 'bold', marginBottom: '8px', color: '#58a6ff' }}>
                  New version available: v{updateAvailableVersion}
                </div>

                {updateStatus === 'available' && (
                  <button className="bulk-btn" style={{ width: '100%', padding: '6px', background: '#238636', border: 'none' }} onClick={onStartUpdateDownload}>
                    Download update now
                  </button>
                )}

                {updateStatus === 'downloading' && (
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', marginBottom: '4px' }}>
                      <span>Downloading update in the background...</span>
                      <span>{downloadProgress}%</span>
                    </div>
                    <div style={{ background: 'rgba(255,255,255,0.1)', height: '4px', borderRadius: '2px' }}>
                      <div style={{ background: '#58a6ff', width: `${downloadProgress}%`, height: '100%', borderRadius: '2px', transition: 'width 0.3s' }}></div>
                    </div>
                  </div>
                )}

                {updateStatus === 'ready' && (
                  <button className="bulk-btn" style={{ width: '100%', padding: '6px', background: '#238636', border: 'none' }} onClick={onInstallReady}>
                    Download complete. Click to restart and install
                  </button>
                )}
              </div>
            )}
          </div>

          {announcement && (
            <div className="setting-item" style={{ marginTop: '20px' }}>
              <label style={{ display: 'block', marginBottom: '8px', color: '#8b949e' }}>Announcement</label>
              <div className="settings-announcement-text">{announcement}</div>
            </div>
          )}

          <div className="setting-divider" style={{ borderTop: '1px solid rgba(255,255,255,0.1)', margin: '15px 0' }}></div>

          <div className="setting-item">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '8px' }}>
              <label>App</label>
              <button
                className="bulk-btn"
                style={{
                  padding: '4px 12px',
                  background: 'rgba(244, 67, 54, 0.2)',
                  borderColor: '#f44336',
                  color: '#ff8a80',
                }}
                onClick={() => {
                  showToast('Closing the app...', 'info');
                  setTimeout(() => {
                    void invoke('request_app_exit');
                  }, 120);
                }}
              >
                Quit app
              </button>
            </div>
          </div>

          <SponsorSection sponsorIcons={sponsorIcons} />
        </div>
      </div>
  );

  if (inline) {
    return <div className="settings-panel-inline-host">{panel}</div>;
  }

  return (
    <div className="settings-panel-overlay" onClick={onClose}>
      {panel}
    </div>
  );
}

export const AppSettingsPanel = memo(AppSettingsPanelImpl);
