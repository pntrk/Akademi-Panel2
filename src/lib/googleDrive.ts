import { initializeApp, getApps, getApp } from 'firebase/app';
import { 
  getAuth, 
  signInWithPopup, 
  signInWithRedirect,
  getRedirectResult,
  GoogleAuthProvider, 
  onAuthStateChanged, 
  signOut,
  User 
} from 'firebase/auth';
import firebaseConfig from '../../firebase-applet-config.json';
import { DriveBackupFile } from '../types';

// Scopes required for Google Drive Backup integration
export const SCOPES = ['https://www.googleapis.com/auth/drive.file'];

// Initialize Firebase App safely
const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
export const auth = getAuth(app);

const provider = new GoogleAuthProvider();
provider.addScope('https://www.googleapis.com/auth/drive.file');
// Prompt user to select account or consent if needed
provider.setCustomParameters({
  prompt: 'select_account'
});

let isSigningIn = false;
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

// Initialize auth state listener and check for redirect result on return
export const initAuth = (
  onAuthSuccess?: (user: User, token: string) => void,
  onAuthFailure?: () => void
) => {
  // Check if returning from redirect sign-in (especially on mobile)
  getRedirectResult(auth)
    .then((result) => {
      if (result) {
        const credential = GoogleAuthProvider.credentialFromResult(result);
        if (credential?.accessToken) {
          setStoredAccessToken(credential.accessToken);
          if (onAuthSuccess) {
            onAuthSuccess(result.user, credential.accessToken);
          }
        }
      }
    })
    .catch((err) => {
      console.warn('Redirect result check:', err);
    });

  return onAuthStateChanged(auth, async (user: User | null) => {
    if (user) {
      const token = await getAccessToken();
      if (token) {
        if (onAuthSuccess) onAuthSuccess(user, token);
      } else {
        // Logged in via Firebase Auth, but token expired or not stored
        if (onAuthFailure) onAuthFailure();
      }
    } else {
      clearStoredAccessToken();
      if (onAuthFailure) onAuthFailure();
    }
  });
};

// Sign in with Google (Popup with fallback or Redirect)
export const googleSignIn = async (useRedirect: boolean = false): Promise<{ user: User; accessToken: string } | null> => {
  try {
    isSigningIn = true;
    
    if (useRedirect) {
      await signInWithRedirect(auth, provider);
      return null;
    }

    try {
      const result = await signInWithPopup(auth, provider);
      const credential = GoogleAuthProvider.credentialFromResult(result);
      if (!credential?.accessToken) {
        throw new Error('Google Drive erişim belirteci (Access Token) alınamadı. Lütfen tekrar deneyin.');
      }

      setStoredAccessToken(credential.accessToken);
      return { user: result.user, accessToken: credential.accessToken };
    } catch (popupErr: any) {
      // If popup was blocked (common on mobile), automatically try redirect
      if (popupErr.code === 'auth/popup-blocked' || popupErr.code === 'auth/cancelled-popup-request') {
        console.log('Popup engellendi, yönlendirme (redirect) ile deneniyor...');
        await signInWithRedirect(auth, provider);
        return null;
      }
      throw popupErr;
    }
  } catch (error: any) {
    console.error('Google Sign In Hatası:', error);
    throw error;
  } finally {
    isSigningIn = false;
  }
};

export const googleSignOut = async (): Promise<void> => {
  await signOut(auth);
  clearStoredAccessToken();
};

// --- Google Drive REST API Operations ---

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

  // Search for JSON files or files containing 'AkademiPanel'
  const query = encodeURIComponent("trashed = false and (name contains 'Akademi' or mimeType = 'application/json')");
  const url = `https://www.googleapis.com/drive/v3/files?q=${query}&fields=files(id,name,createdTime,modifiedTime,size)&orderBy=modifiedTime desc&pageSize=20`;

  const response = await fetch(url, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: 'application/json'
    }
  });

  if (!response.ok) {
    const errText = await response.text();
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
    throw new Error(`Google Drive dosyası silinemedi (${response.status}): ${errText}`);
  }
};
