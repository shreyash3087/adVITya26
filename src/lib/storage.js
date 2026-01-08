import { storage } from './appwrite';
import { ID } from 'appwrite';

const BUCKET_ID = import.meta.env.VITE_APPWRITE_BUCKET_ID;

export const uploadImageFile = async (file) => {
    try {
        const response = await storage.createFile(
            BUCKET_ID,
            ID.unique(),
            file
        );

        // Get the view URL
        const result = storage.getFileView(BUCKET_ID, response.$id);

        // Handle cases where result is a URL object or a string
        if (result && result.href) {
            return result.href;
        }
        return result; // It's likely a string if .href doesn't exist

    } catch (error) {
        console.error("Appwrite Storage Upload Error:", error);
        throw error;
    }
};

export const transformGoogleDriveUrl = (url) => {
    if (!url) return '';
    return url;
};

export const getFilePreview = (fileId) => {
    const result = storage.getFilePreview(BUCKET_ID, fileId);
    return result.href ? result.href : result;
};
