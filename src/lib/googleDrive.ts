import { initializeApp, getApps, getApp } from 'firebase/app';
import { 
  getAuth, 
  signInWithPopup, 
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

let isSigningIn = false;
let cachedAccessToken: string | null = null;

// Initialize auth state listener
export const initAuth = (
  onAuthSuccess?: (user: User, token: string) => void,
  onAuthFailure?: () => void
) => {
  return onAuthStateChanged(auth, async (user: User | null) => {
    if (user) {
      if (cachedAccessToken) {
        if (onAuthSuccess) onAuthSuccess(user, cachedAccessToken);
      } else if (!isSigningIn) {
        // If user is logged into Firebase but we don't have OAuth token in memory yet
        if (onAuthFailure) onAuthFailure();
      }
    } else {
      cachedAccessToken = null;
      if (onAuthFailure) onAuthFailure();
    }
  });
};

export const getAccessToken = async (): Promise<string | null> => {
  return cachedAccessToken;
};

// Sign in with Google Popup
export const googleSignIn = async (): Promise<{ user: User; accessToken: string } | null> => {
  try {
    isSigningIn = true;
    const result = await signInWithPopup(auth, provider);
    const credential = GoogleAuthProvider.credentialFromResult(result);
    if (!credential?.accessToken) {
      throw new Error('Google Drive erişim belirteci (Access Token) alınamadı.');
    }

    cachedAccessToken = credential.accessToken;
    return { user: result.user, accessToken: cachedAccessToken };
  } catch (error: any) {
    console.error('Google Sign In Hatası:', error);
    throw error;
  } finally {
    isSigningIn = false;
  }
};

export const googleSignOut = async (): Promise<void> => {
  await signOut(auth);
  cachedAccessToken = null;
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
