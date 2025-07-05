
import type { AppSettings } from '@/types/settings.types';

// Data is now inlined to ensure a single source of truth in memory.
const settingsData: AppSettings = {
  "instructorName": "Alex Dubois"
};

// This is a mutable export, allowing in-memory modifications for the prototype.
// In a real production app, this would be handled by a database.
export let SETTINGS: AppSettings = settingsData;

    