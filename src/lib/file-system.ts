
'use server';

import fs from 'fs/promises';
import path from 'path';

/**
 * Reads data from a JSON file.
 * @param filePath The path to the JSON file, relative to the project root.
 * @param defaultValue The default value to return if the file doesn't exist or is empty.
 * @returns The parsed JSON data or the default value.
 */
export async function readData<T>(filePath: string, defaultValue: T): Promise<T> {
  try {
    const fullPath = path.join(process.cwd(), filePath);
    const data = await fs.readFile(fullPath, 'utf-8');
    return JSON.parse(data) as T;
  } catch (error: any) {
    // If the file does not exist, it's okay, we'll return the default value.
    if (error.code === 'ENOENT') {
      return defaultValue;
    }
    console.error(`Could not read data file at ${filePath}:`, error);
    return defaultValue;
  }
}

/**
 * Writes data to a JSON file.
 * @param filePath The path to the JSON file, relative to the project root.
 * @param data The data to write to the file.
 */
export async function writeData<T>(filePath: string, data: T): Promise<void> {
  try {
    const fullPath = path.join(process.cwd(), filePath);
    // Ensure the directory exists
    await fs.mkdir(path.dirname(fullPath), { recursive: true });
    await fs.writeFile(fullPath, JSON.stringify(data, null, 2), 'utf-8');
  } catch (error) {
    console.error(`Could not write data file at ${filePath}:`, error);
  }
}
