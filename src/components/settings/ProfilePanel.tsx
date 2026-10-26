import { useCallback, useEffect, useMemo, useState } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { openCommunityWithAutoLogin } from '../../utils/communityAuth';

interface ProfilePanelProps {
  visible: boolean;
  inline?: boolean;
  onClose: () => void;
  showToast: (message: string, type?: 'success' | 'error' | 'warning' | 'info') => void;
}

interface GameIdentityInfo {
  username: string;
  account_id: string;
  steam_id?: string | null;
}

interface GeneratedLoginKey {
  key: string;
  username: string;
  account_id: string;
}

const maskAccountId = (value: string) => {
  if (!value) return '***';
  if (value.length <= 8) return `${value.slice(0, 2)}***${value.slice(-2)}`;
  return `${value.slice(0, 4)}***${value.slice(-4)}`;
};

export function ProfilePanel({ visible, inline = false, onClose, showToast }: ProfilePanelProps) {
  const [loading, setLoading] = useState(false);
  const [identity, setIdentity] = useState<GameIdentityInfo | null>(null);
  const [showAccountId, setShowAccountId] = useState(false);
  const [keyLoading, setKeyLoading] = useState(false);
  const [openCommunityLoading, setOpenCommunityLoading] = useState(false);
  const [loginKey, setLoginKey] = useState('');

  const loadIdentity = useCallback(async () => {
    setLoading(true);
    try {
      const data = await invoke<GameIdentityInfo>('get_game_identity');
      setIdentity(data);
    } catch (error) {
      const message = typeof error === 'string' ? error : String(error);
      showToast(`Could not read account info: ${message}`, 'error');
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    if (!visible) return;
    void loadIdentity();
  }, [loadIdentity, visible]);

  const accountText = useMemo(() => {
    if (!identity?.account_id) return '***';
    return showAccountId ? identity.account_id : maskAccountId(identity.account_id);
  }, [identity?.account_id, showAccountId]);

  const handleGenerateKey = useCallback(async () => {
    setKeyLoading(true);
    try {
      const result = await invoke<GeneratedLoginKey>('generate_game_login_key');
      setLoginKey(result.key);
      showToast('Key generated', 'success');
    } catch (error) {
      const message = typeof error === 'string' ? error : String(error);
      showToast(`Could not generate key: ${message}`, 'error');
    } finally {
      setKeyLoading(false);
    }
  }, [showToast]);

  const handleCopy = useCallback(async (value: string, label: string) => {
    if (!value) {
      showToast(`${label} is empty`, 'warning');
      return;
    }
    try {
      await navigator.clipboard.writeText(value);
      showToast(`${label} copied`, 'success');
    } catch {
      showToast(`Could not copy ${label}`, 'error');
    }
  }, [showToast]);

  const handleOpenCommunity = useCallback(async () => {
    setOpenCommunityLoading(true);
    try {
      await openCommunityWithAutoLogin();
      showToast('Opened the website and signed you in', 'success');
    } catch (error) {
      const message = typeof error === 'string' ? error : String(error);
      showToast(`Could not open the website: ${message}`, 'error');
    } finally {
      setOpenCommunityLoading(false);
    }
  }, [showToast]);

  if (!visible) return null;

  return (
    <div className={`settings-panel ${inline ? 'inline' : ''}`} onClick={(e) => e.stopPropagation()}>
      <div className="settings-header">
        <h3>Profile</h3>
        {!inline ? <button className="close-panel-btn" onClick={onClose}>×</button> : null}
      </div>

      <div className="settings-content" data-no-drag>
        <div className="setting-item">
          <div className="profile-row-header">
            <label>Game username</label>
            <button className="bulk-btn" style={{ padding: '4px 10px' }} onClick={() => void loadIdentity()}>
              {loading ? 'Loading...' : 'Refresh'}
            </button>
          </div>
          <div className="profile-identity-card">
            <div className="profile-identity-title">Current account</div>
            <div className="profile-identity-name">{identity?.username || '--'}</div>
            <div className="profile-identity-meta">
              AccountId: {accountText}
            </div>
          </div>
        </div>

        <div className="setting-item">
          <div className="profile-row-header">
            <label>AccountId</label>
            <div className="profile-btn-row">
              <button
                className="bulk-btn"
                style={{ padding: '4px 10px' }}
                onClick={() => setShowAccountId((prev) => !prev)}
                title={showAccountId ? 'Hide' : 'Show'}
              >
                {showAccountId ? '🙈' : '👁️'}
              </button>
              <button
                className="bulk-btn"
                style={{ padding: '4px 10px' }}
                onClick={() => void handleCopy(identity?.account_id || '', 'AccountId')}
              >
                Copy
              </button>
            </div>
          </div>
          <div className="profile-account-value">
            {accountText}
          </div>
          <div className="setting-tip">Hidden by default. Click the eye icon to show the full ID.</div>
        </div>

        <div className="setting-item">
          <div className="profile-row-header">
            <label>Login key</label>
            <div className="profile-btn-row">
              <button className="bulk-btn" style={{ padding: '4px 10px' }} onClick={() => void handleGenerateKey()}>
                {keyLoading ? 'Generating...' : 'Generate key'}
              </button>
              <button className="bulk-btn" style={{ padding: '4px 10px' }} onClick={() => void handleCopy(loginKey, 'Key')}>
                Copy
              </button>
            </div>
          </div>
          <div className="profile-login-key-box">
            {loginKey || 'Your key appears here after you click "Generate key"'}
          </div>
          <div className="setting-tip">Note from the developer: this key is a reversible encoding made by the app, not a strong security credential. Keep it private.</div>
        </div>

        <div className="setting-item">
          <div className="profile-row-header">
            <label>Community site</label>
            <button className="bulk-btn" style={{ padding: '4px 12px' }} onClick={() => void handleOpenCommunity()}>
              {openCommunityLoading ? 'Opening...' : 'Open site and sign in'}
            </button>
          </div>
          <div className="setting-tip">Creates a one-time sign-in link from your game account and opens duang.work.</div>
        </div>
      </div>
    </div>
  );
}
