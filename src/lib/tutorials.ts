
import type { Tutorial } from '@/types/tutorial.types';
import tutorialsData from '@/data/tutorials.json';

// Initialize with data from the JSON file. This is client-safe.
export let TUTORIALS: Tutorial[] = tutorialsData as Tutorial[];
