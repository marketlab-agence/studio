import type { FileNode } from '@/types/git.types';

// État global simulé du dépôt
type GitState = {
  files: FileNode[];
  initialized: boolean;
};

// Fonction principale pour exécuter une commande
export function executeCommand(commandStr: string, currentFiles: FileNode[]): { newState: FileNode[], output: string } {
  const [command, ...args] = commandStr.trim().split(' ');
  const state: GitState = { files: JSON.parse(JSON.stringify(currentFiles)), initialized: true }; // Assume initialized for now

  let output = '';

  switch (command) {
    case 'ls':
      if (state.files.length === 0) {
        output = 'Le répertoire est vide.';
      } else {
        output = state.files.map(f => f.path).join('\n');
      }
      break;

    case 'touch':
      const fileName = args[0];
      if (!fileName) {
        output = 'usage: touch <nom_du_fichier>';
      } else if (state.files.find(f => f.path === fileName)) {
        // La commande touch met à jour le timestamp, mais ici on ne fait rien pour simplifier
      } else {
        state.files.push({
          path: fileName,
          type: 'file',
          status: 'untracked',
          content: ''
        });
        output = ''; // touch ne produit pas de sortie
      }
      break;

    case 'git':
      const gitSubCommand = args[0];
      const gitArgs = args.slice(1);
      
      switch (gitSubCommand) {
        case 'add':
          const fileToAdd = gitArgs[0];
          if (!fileToAdd) {
            output = 'Rien spécifié, rien d\'ajouté.\nPeut-être vouliez-vous dire \'git add .\'?';
          } else if (fileToAdd === '.') {
            let filesAdded = false;
            state.files.forEach(f => {
              if (f.status === 'untracked' || f.status === 'modified') {
                f.status = 'staged';
                filesAdded = true;
              }
            });
            if(!filesAdded) output = 'Aucun changement à ajouter';
          } else {
            const file = state.files.find(f => f.path === fileToAdd);
            if (file) {
              if (file.status === 'untracked' || file.status === 'modified') {
                file.status = 'staged';
              }
            } else {
              output = `fatal: chemin '${fileToAdd}' non trouvé dans l'arbre de travail.`;
            }
          }
          break;
        
        case 'commit':
            if (gitArgs[0] === '-m') {
                const message = gitArgs.slice(1).join(' ');
                if (!message) {
                    output = "fatal: l'option -m requiert un argument";
                } else {
                    let filesCommitted = false;
                    state.files.forEach(f => {
                        if (f.status === 'staged') {
                            f.status = 'committed';
                            filesCommitted = true;
                        }
                    });
                    if (filesCommitted) {
                        output = `[main (commit racine) 1234567] ${message}\n 1 fichier changé, 0 insertions(+), 0 suppressions(-)\n créer le mode 100644 ${state.files.find(f => f.status==='committed')?.path}`;
                    } else {
                        output = "Rien à valider, l'arbre de travail est propre";
                    }
                }
            } else {
                output = "Option de commit non supportée dans cette simulation.";
            }
            break;

        case 'status':
          const stagedFiles = state.files.filter(f => f.status === 'staged');
          const untrackedFiles = state.files.filter(f => f.status === 'untracked');
          const modifiedFiles = state.files.filter(f => f.status === 'modified');
          
          let statusOutput = "Sur la branche main\nAucun commit pour l'instant\n\n";

          if (stagedFiles.length > 0) {
            statusOutput += 'Changements à valider:\n  (utilisez "git rm --cached <fichier>..." pour désindexer)\n';
            stagedFiles.forEach(f => statusOutput += `\tnouveau fichier:   ${f.path}\n`);
            statusOutput += '\n';
          }
          
          if (untrackedFiles.length > 0) {
            statusOutput += 'Fichiers non suivis:\n  (utilisez "git add <fichier>..." pour inclure dans ce qui sera validé)\n';
            untrackedFiles.forEach(f => statusOutput += `\t${f.path}\n`);
            statusOutput += '\n';
          }
          
          if(stagedFiles.length === 0 && untrackedFiles.length === 0 && modifiedFiles.length === 0){
             statusOutput = "Sur la branche main\nVotre branche est à jour avec 'origin/main'.\n\nrien à valider, l'arbre de travail est propre";
          }

          output = statusOutput.trim();
          break;

        default:
          output = `git: '${gitSubCommand}' n'est pas une commande git. Voir 'git --help'.`;
      }
      break;

    default:
      if (command) {
        output = `commande non trouvée: ${command}`;
      }
  }

  return { newState: state.files, output };
}
