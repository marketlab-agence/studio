
import { AppSettings } from '@/types/settings.types';
import { db } from './firebase-admin'; // Assurez-vous que ce chemin est correct

const SETTINGS_COLLECTION = 'settings';
const DEFAULT_SETTINGS_ID = 'default';

const defaultSettings: AppSettings = {
  instructorName: 'Instructeur par défaut',
  // Ajoutez d'autres valeurs par défaut ici
};

/**
 * Retrieves the application settings from Firestore.
 * If no settings document exists, it will return default settings.
 * @returns {Promise<AppSettings>} A promise that resolves to the application settings.
 */
export async function getSettings(): Promise<AppSettings> {
  try {
    const docRef = db.collection(SETTINGS_COLLECTION).doc(DEFAULT_SETTINGS_ID);
    const doc = await docRef.get();

    if (!doc.exists) {
      console.log('No settings document found, returning default settings.');
      return defaultSettings;
    }

    return doc.data() as AppSettings;
  } catch (error) {
    console.error("Error getting settings: ", error);
    // En cas d'erreur, il est plus sûr de retourner les paramètres par défaut
    return defaultSettings;
  }
}

/**
 * Saves the application settings to Firestore.
 * This will overwrite the existing settings.
 * @param {AppSettings} settings - The settings object to save.
 * @returns {Promise<void>}
 */
export async function saveSettings(settings: AppSettings): Promise<void> {
  try {
    const docRef = db.collection(SETTINGS_COLLECTION).doc(DEFAULT_SETTINGS_ID);
    await docRef.set(settings);
  } catch (error) {
    console.error("Error saving settings: ", error);
    throw new Error("Could not save settings to Firestore.");
  }
}
