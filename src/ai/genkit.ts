import {genkit} from 'genkit';
import {googleAI} from '@genkit-ai/googleai';

/**
 * Modèle par défaut des flux IA.
 *
 * ⚠️ **Google RETIRE ses modèles** : `gemini-2.0-flash` répond désormais
 * `404 NOT_FOUND` (« no longer available »), ce qui faisait échouer
 * silencieusement tous les flux (le message d'erreur affiché était le
 * catch-all générique de `AiHelper`). Vérifier ce nom contre l'API avant
 * toute mise à jour : `@genkit-ai/googleai` transmet le nom tel quel.
 */
export const ai = genkit({
  plugins: [googleAI()],
  model: 'googleai/gemini-3.8-flash',
});
