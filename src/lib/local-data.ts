import coursesData from '@/data/courses.json';
import tutorialsData from '@/data/tutorials.json';
import quizzesData from '@/data/quizzes.json';
import plansData from '@/data/plans.json';
import settingsData from '@/data/settings.json';

export type LocalDataName = 'courses' | 'tutorials' | 'quizzes' | 'plans' | 'settings';

const LOCAL_DATA: Record<LocalDataName, unknown> = {
  courses: coursesData,
  tutorials: tutorialsData,
  quizzes: quizzesData,
  plans: plansData,
  settings: settingsData,
};

/**
 * Le repli sur les données locales (src/data/*.json) est actif en développement,
 * ou si la variable d'environnement USE_LOCAL_DATA vaut "true".
 * En production il est désactivé par défaut, afin de ne jamais masquer une
 * panne Firestore derrière des données de seed périmées.
 */
export function isLocalFallbackEnabled(): boolean {
  return process.env.NODE_ENV !== 'production' || process.env.USE_LOCAL_DATA === 'true';
}

/**
 * Tente une lecture Firestore ; en cas d'échec, se rabat sur le fichier
 * src/data/<name>.json correspondant (uniquement si le repli est autorisé).
 *
 * @param name - Nom du jeu de données local (donc du fichier JSON).
 * @param fetchFromFirestore - La lecture Firestore à tenter.
 * @param projectLocal - Transforme les données locales brutes vers le type attendu.
 */
export async function withLocalFallback<T>(
  name: LocalDataName,
  fetchFromFirestore: () => Promise<T>,
  projectLocal: (local: unknown) => T,
): Promise<T> {
  try {
    return await fetchFromFirestore();
  } catch (error) {
    if (!isLocalFallbackEnabled()) {
      throw error;
    }
    const reason = error instanceof Error ? error.message : String(error);
    console.warn(
      `[local-data] Firestore indisponible pour "${name}" — repli sur src/data/${name}.json (cause: ${reason})`,
    );
    return projectLocal(LOCAL_DATA[name]);
  }
}
