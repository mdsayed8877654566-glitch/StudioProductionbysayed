import { getAccessToken } from '../lib/auth';

export interface DriveFile {
  id: string;
  name: string;
  mimeType: string;
  thumbnailLink?: string;
  webViewLink?: string;
  size?: string;
  modifiedTime?: string;
}

export const listDriveFiles = async (pageSize = 10): Promise<DriveFile[]> => {
  const token = await getAccessToken();
  if (!token) return [];

  try {
    const response = await fetch(`https://www.googleapis.com/drive/v3/files?pageSize=${pageSize}&fields=files(id,name,mimeType,thumbnailLink,webViewLink,size,modifiedTime)`, {
      headers: { 'Authorization': `Bearer ${token}` },
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('Drive API Error:', errorData);
      return [];
    }

    const data = await response.json();
    return data.files || [];
  } catch (error) {
    console.error('Error listing Drive files:', error);
    return [];
  }
};

export const uploadToGoogleDrive = async (file: File): Promise<DriveFile | null> => {
  const token = await getAccessToken();
  if (!token) {
    console.error('No access token available for Drive API');
    return null;
  }

  const metadata = {
    name: file.name,
    mimeType: file.type,
  };

  const formData = new FormData();
  formData.append('metadata', new Blob([JSON.stringify(metadata)], { type: 'application/json' }));
  formData.append('file', file);

  try {
    const response = await fetch('https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id,name,mimeType,thumbnailLink,webViewLink,size,modifiedTime', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`
      },
      body: formData,
    });

    if (!response.ok) {
      throw new Error(`Google Drive upload failed: ${response.statusText}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error uploading to Drive:', error);
    return null;
  }
};

export const deleteDriveFile = async (fileId: string): Promise<boolean> => {
  const token = await getAccessToken();
  if (!token) return false;

  try {
    const response = await fetch(`https://www.googleapis.com/drive/v3/files/${fileId}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${token}` },
    });

    return response.ok;
  } catch (error) {
    console.error('Error deleting Drive file:', error);
    return false;
  }
};
