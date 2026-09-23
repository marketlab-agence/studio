import { config as loadEnv } from 'dotenv';
import { stdin } from 'node:process';
import { hashPassword, MIN_PASSWORD_LENGTH, MAX_PASSWORD_BYTES } from '../auth/password';
import { closePool, query } from './pool';

/**
 * Définit le mot de passe d'un compte existant.
 *
 * POURQUOI CE SCRIPT EXISTE
 * Les comptes repris de Firebase Auth n'ont **pas** de mot de passe local :
 * Firebase n'expose pas les hachages. Ils sont donc marqués
 * `must_reset_password`, et leur seule voie d'accès est le parcours « mot de
 * passe oublié ». Or en développement, `EMAIL_PROVIDER=memory` **ne délivre
 * aucun email** : personne ne peut terminer ce parcours, et l'application reste
 * inaccessible. Tout déploiement réel a par ailleurs besoin d'amorcer son
 * premier administrateur.
 *
 * Usage :
 *   npm run db:set-password -- admin@katalyst.com
 *
 * ⚠️ **Le mot de passe n'est jamais affiché**, et il n'existe pas d'option pour
 * le passer en argument : une valeur en ligne de commande finirait dans
 * l'historique du shell et dans la liste des processus. Il est demandé de façon
 * **masquée**, ou lu depuis `KATALYST_NEW_PASSWORD` (utile en script).
 *
 * ⚠️ Les arguments sont **positionnels** : `npm run` consomme les options
 * commençant par `--` (il les interprète comme sa propre configuration), si
 * bien qu'un `--email` n'atteindrait jamais ce script.
 */

loadEnv({ path: '.env.local' });
loadEnv({ path: '.env' });

/** Lit une saisie sans l'afficher à l'écran. */
function promptHidden(question: string): Promise<string> {
  return new Promise((resolve) => {
    process.stdout.write(question);

    const wasRaw = stdin.isRaw;
    if (stdin.isTTY) stdin.setRawMode(true);
    stdin.resume();
    stdin.setEncoding('utf8');

    let value = '';

    const onData = (chunk: string) => {
      for (const char of chunk) {
        // Entrée ou fin de flux : on rend la main.
        if (char === '\n' || char === '\r' || char === '\u0004') {
          if (stdin.isTTY) stdin.setRawMode(wasRaw);
          stdin.pause();
          stdin.removeListener('data', onData);
          process.stdout.write('\n');
          resolve(value);
          return;
        }

        // Ctrl+C : interrompre proprement.
        if (char === '\u0003') {
          process.stdout.write('\n');
          process.exit(130);
        }

        // Retour arrière.
        if (char === '\u007f' || char === '\b') {
          value = value.slice(0, -1);
          continue;
        }

        value += char;
      }
    };

    stdin.on('data', onData);
  });
}

async function main(): Promise<void> {
  // Argument **positionnel** : `npm run` mange les `--option`.
  const email = process.argv.slice(2).find((argument) => !argument.startsWith('-'))?.trim().toLowerCase();

  if (!email) {
    console.error(
      'Adresse manquante.\n' +
        '  Usage : npm run db:set-password -- admin@katalyst.com',
    );
    process.exit(1);
  }

  // Garde-fou : viser par erreur une base distante poserait un mot de passe sur
  // un compte de production.
  const databaseUrl = process.env.DATABASE_URL ?? '';
  const cibleLocale = /@(localhost|127\.0\.0\.1|host\.docker\.internal|postgres)[:/]/.test(databaseUrl);
  const force = process.argv.includes('--force');

  if (!cibleLocale && !force) {
    console.error(
      'DATABASE_URL ne pointe pas vers une base locale.\n' +
        '  Poser un mot de passe sur une base distante exige --force :\n' +
        `    npm run db:set-password -- ${email} --force`,
    );
    process.exit(1);
  }

  const existing = await query<{ id: string; name: string; role: string }>(
    'SELECT id, name, role FROM users WHERE lower(email) = $1',
    [email],
  );

  const user = existing.rows[0];
  if (!user) {
    console.error(`Aucun compte pour « ${email} ».`);
    process.exit(1);
  }

  console.log('');
  console.log(`  Compte : ${user.name} <${email}>`);
  console.log(`  Rôle   : ${user.role}`);
  console.log('');

  // Le mot de passe vient de l'environnement (script) ou d'une saisie masquée
  // (interactif). Jamais d'un argument de ligne de commande.
  let password = process.env.KATALYST_NEW_PASSWORD ?? '';

  if (!password) {
    password = await promptHidden('  Nouveau mot de passe (non affiché) : ');
    const confirmation = await promptHidden('  Confirmation                      : ');

    if (password !== confirmation) {
      console.error('\n  Les deux saisies diffèrent : rien n’a été modifié.');
      process.exit(1);
    }
  }

  // Politique vérifiée AVANT l'écriture : un mot de passe refusé ne doit pas
  // laisser le compte dans un état intermédiaire.
  if (password.length < MIN_PASSWORD_LENGTH || Buffer.byteLength(password, 'utf8') > MAX_PASSWORD_BYTES) {
    console.error(
      `\n  Mot de passe invalide : ${MIN_PASSWORD_LENGTH} caractères minimum, ` +
        `${MAX_PASSWORD_BYTES} octets maximum. Rien n’a été modifié.`,
    );
    process.exit(1);
  }

  const hash = await hashPassword(password);

  await query(
    `UPDATE users
     SET password_hash = $2, must_reset_password = false
     WHERE id = $1`,
    [user.id, hash],
  );

  console.log('');
  console.log('  Mot de passe défini. Réinitialisation obligatoire levée.');
  console.log('  La valeur n’est ni affichée, ni journalisée.');
  console.log('');
}

main()
  .then(() => closePool())
  .catch(async (error) => {
    console.error('Échec :', error instanceof Error ? error.message : error);
    await closePool();
    process.exit(1);
  });
