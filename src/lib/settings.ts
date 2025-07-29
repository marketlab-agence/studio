
import type { AppSettings } from '@/types/settings.types';
import { readData, writeData } from './file-system';

const FILE_PATH = 'src/data/settings.json';

// This function can be called from server components or actions
export async function getSettings(): Promise<AppSettings> {
    return readData<AppSettings>(FILE_PATH, { instructorName: 'Instructeur par défaut' });
}

// This function should only be called from server actions
export async function saveSettings(settings: AppSettings): Promise<void> {
    await writeData(FILE_PATH, settings);
}
