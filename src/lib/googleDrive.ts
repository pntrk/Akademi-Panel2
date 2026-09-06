import { DriveBackupFile } from '../types';

// Scopes required for Google Drive Backup integration
export const SCOPES = [
  'https://www.googleapis.com/auth/drive.file',
  'https://www.googleapis.com/auth/drive.appdata'
];

let cachedAccessToken: string | null = null;

export const getDeviceType = (): 'Bilgisayar' | 'Telefon' | 'Tablet' => {
  if (typeof window === 'undefined') return 'Bilgisayar';
  const ua = navigator.userAgent.toLowerCase();
  if (/(ipad|tablet|(android(?!.*mobile))|(windows(?!.*phone)(.*touch))|kindle|playbook|silk|(puffin(?!.*(IP|AP|WP))))/.test(ua)) {
    return 'Tablet';
  }
  if (/mobi|android|touch|mini|windows\sce|palm/i.test(ua) || (window.innerWidth < 768)) {
    return 'Telefon';
  }
  return 'Bilgisayar';
};

export const getAccessToken = async (): Promise<string | null> => {
  if (cachedAccessToken) return cachedAccessToken;
  
  try {
    const savedToken = localStorage.getItem('gdrive_access_token');
    const savedTime = localStorage.getItem('gdrive_token_timestamp');
    if (savedToken && savedTime) {
      const elapsed = Date.now() - parseInt(savedTime, 10);
      // Google access tokens are valid for 1 hour. We use 55 mins window.
      if (elapsed < 55 * 60 * 1000) {
        cachedAccessToken = savedToken;
        return cachedAccessToken;
      } else {
        localStorage.removeItem('gdrive_access_token');
        localStorage.removeItem('gdrive_token_timestamp');
      }
    }
  } catch (e) {}

  return null;
};

export const setStoredAccessToken = (token: string) => {
  cachedAccessToken = token;
  try {
    localStorage.setItem('gdrive_access_token', token);
    localStorage.setItem('gdrive_token_timestamp', Date.now().toString());
  } catch (e) {}
};

export const clearStoredAccessToken = () => {
  cachedAccessToken = null;
  try {
    localStorage.removeItem('gdrive_access_token');
    localStorage.removeItem('gdrive_token_timestamp');
  } catch (e) {}
};

export const googleSignOut = async (): Promise<void> => {
  clearStoredAccessToken();
};

export const fetchGoogleUserInfo = async (token: string): Promise<{ email: string; name: string; picture: string } | null> => {
  try {
    const response = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
      headers: { Authorization: `Bearer ${token}` }
    });
    if (!response.ok) return null;
    return await response.json();
  } catch (err) {
    console.error('Failed to fetch user info', err);
    return null;
  }
};

// Auto-sync preference management
export const getAutoSyncEnabled = (): boolean => {
  try {
    const saved = localStorage.getItem('gdrive_auto_sync_enabled');
    // Default to true (auto-sync enabled) unless user explicitly turned it off ('false')
    return saved !== 'false';
  } catch (e) {
    return true;
  }
};

export const setAutoSyncEnabled = (enabled: boolean) => {
  try {
    localStorage.setItem('gdrive_auto_sync_enabled', enabled ? 'true' : 'false');
  } catch (e) {}
};

export const getLastSyncTime = (): string | null => {
  try {
    return localStorage.getItem('gdrive_last_sync_timestamp');
  } catch (e) {
    return null;
  }
};

export const setLastSyncTime = (timestampStr: string) => {
  try {
    localStorage.setItem('gdrive_last_sync_timestamp', timestampStr);
  } catch (e) {}
};

export const autoSyncToDrive = async (backupData: any): Promise<boolean> => {
  try {
    const token = await getAccessToken();
    if (!token) return false;

    const now = new Date();
    const dateStr = now.toLocaleDateString('tr-TR').replace(/\./g, '-');
    const timeStr = now.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' }).replace(':', '-');
    const deviceTag = getDeviceType() === 'Telefon' ? 'Telefon' : getDeviceType() === 'Tablet' ? 'Tablet' : 'PC';
    const filename = `AkademiPanel_OtoYedek_${dateStr}_${timeStr}_(${deviceTag}).json`;

    await saveBackupToDrive(backupData, filename);
    setLastSyncTime(now.toISOString());
    return true;
  } catch (err) {
    console.warn('Otomatik Drive senkronizasyonu atlandı:', err);
    return false;
  }
};

/**
 * Upload a backup file to Google Drive using multipart upload
 */
export const saveBackupToDrive = async (
  backupData: any,
  filename?: string
): Promise<{ id: string; name: string }> => {
  const token = await getAccessToken();
  if (!token) {
    throw new Error('Google Drive bağlantısı bulunamadı. Lütfen önce Google ile giriş yapın.');
  }

  const dateStr = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
  const actualFilename = filename || `AkademiPanel_Yedek_${dateStr}.json`;

  const metadata = {
    name: actualFilename,
    mimeType: 'application/json',
    description: 'AkademiPanel Tam Sistem Yedeği (Kırklareli Atatürk Ortaokulu)'
  };

  const fileContent = JSON.stringify(backupData, null, 2);
  const boundary = '-------314159265358979323846';
  const delimiter = `\r\n--${boundary}\r\n`;
  const closeDelimiter = `\r\n--${boundary}--`;

  const multipartRequestBody =
    delimiter +
    'Content-Type: application/json; charset=UTF-8\r\n\r\n' +
    JSON.stringify(metadata) +
    delimiter +
    'Content-Type: application/json\r\n\r\n' +
    fileContent +
    closeDelimiter;

  const response = await fetch('https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': `multipart/related; boundary=${boundary}`
    },
    body: multipartRequestBody
  });

  if (!response.ok) {
    const errText = await response.text();
    if (response.status === 401 || response.status === 403) {
      clearStoredAccessToken();
      throw new Error(`Google Drive izin hatası (${response.status}): Erişim izniniz yetersiz veya süresi dolmuş. Lütfen "Google ile Yeniden Bağlan" butonuna tıklayıp Drive izinlerini onaylayın.`);
    }
    throw new Error(`Google Drive yükleme hatası (${response.status}): ${errText}`);
  }

  const result = await response.json();
  return { id: result.id, name: result.name };
};

/**
 * List backups saved by the app in Google Drive
 */
export const listDriveBackups = async (): Promise<DriveBackupFile[]> => {
  const token = await getAccessToken();
  if (!token) {
    throw new Error('Google Drive bağlantısı bulunamadı. Lütfen önce Google ile giriş yapın.');
  }

  // Search for JSON files or files containing 'Akademi'
  const query = encodeURIComponent("trashed = false and (name contains 'Akademi' or mimeType = 'application/json')");
  const url = `https://www.googleapis.com/drive/v3/files?spaces=drive&q=${query}&fields=files(id,name,createdTime,modifiedTime,size)&orderBy=modifiedTime desc&pageSize=30`;

  const response = await fetch(url, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: 'application/json'
    }
  });

  if (!response.ok) {
    const errText = await response.text();
    if (response.status === 401 || response.status === 403 || errText.includes('ACCESS_TOKEN_SCOPE_INSUFFICIENT')) {
      clearStoredAccessToken();
      throw new Error(`Google Drive erişim izni yetersiz (403). Google hesabınızla ilk giriş yaparken Drive izni onaylanmamış olabilir. Lütfen "Google ile Tekrar Giriş Yap" butonuna tıklayıp açılan onay ekranında Drive iznine izin verin.`);
    }
    throw new Error(`Google Drive dosyaları listelenirken hata oluştu (${response.status}): ${errText}`);
  }

  const data = await response.json();
  return data.files || [];
};

/**
 * Download and parse backup JSON content from Google Drive
 */
export const getDriveBackupContent = async (fileId: string): Promise<any> => {
  const token = await getAccessToken();
  if (!token) {
    throw new Error('Google Drive bağlantısı bulunamadı. Lütfen önce Google ile giriş yapın.');
  }

  const url = `https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`;

  const response = await fetch(url, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${token}`
    }
  });

  if (!response.ok) {
    const errText = await response.text();
    if (response.status === 401 || response.status === 403) {
      clearStoredAccessToken();
      throw new Error(`Google Drive erişim izni yetersiz (${response.status}). Lütfen tekrar giriş yapın.`);
    }
    throw new Error(`Google Drive dosyası indirilemedi (${response.status}): ${errText}`);
  }

  const jsonContent = await response.json();
  return jsonContent;
};

/**
 * Delete a backup file from Google Drive (Requires explicit confirmation in UI)
 */
export const deleteDriveBackup = async (fileId: string): Promise<void> => {
  const token = await getAccessToken();
  if (!token) {
    throw new Error('Google Drive bağlantısı bulunamadı.');
  }

  const response = await fetch(`https://www.googleapis.com/drive/v3/files/${fileId}`, {
    method: 'DELETE',
    headers: {
      Authorization: `Bearer ${token}`
    }
  });

  if (!response.ok && response.status !== 204) {
    const errText = await response.text();
    if (response.status === 401 || response.status === 403) {
      clearStoredAccessToken();
      throw new Error(`Google Drive erişim izni yetersiz (${response.status}). Lütfen tekrar giriş yapın.`);
    }
    throw new Error(`Google Drive dosyası silinemedi (${response.status}): ${errText}`);
  }
};
