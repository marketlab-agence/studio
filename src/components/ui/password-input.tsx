'use client';

import * as React from 'react';
import { Eye, EyeOff } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

/**
 * Champ de mot de passe avec bouton d'affichage.
 *
 * **Pourquoi ce bouton est utile, et pas un simple confort.** Saisir un mot de
 * passe long à l'aveugle sur un clavier de téléphone conduit à des échecs
 * répétés, puis à des mots de passe plus courts — c'est-à-dire moins sûrs. La
 * possibilité de vérifier sa saisie **améliore** la sécurité réelle plutôt que
 * de la dégrader.
 *
 * Le bouton est un vrai contrôle accessible :
 * - `type="button"` : sans cela, il soumettrait le formulaire ;
 * - `aria-label` explicite et `aria-pressed` : un lecteur d'écran annonce l'état
 *   (« mot de passe affiché » / « masqué »), pas seulement « bouton » ;
 * - `tabIndex={-1}` : il ne s'interpose pas dans la tabulation du formulaire.
 *   On passe du champ au bouton suivant sans traverser un contrôle secondaire ;
 * - `onMouseDown` avec `preventDefault` : le clic ne retire pas le focus du
 *   champ, donc la position du curseur est conservée.
 */
export interface PasswordInputProps
  extends Omit<React.ComponentProps<typeof Input>, 'type'> {
  /** Affiché par défaut. `new-password` en création, `current-password` sinon. */
  autoComplete?: string;
}

const PasswordInput = React.forwardRef<HTMLInputElement, PasswordInputProps>(
  ({ className, autoComplete = 'current-password', ...props }, ref) => {
    const [visible, setVisible] = React.useState(false);

    return (
      <div className="relative">
        <Input
          {...props}
          ref={ref}
          type={visible ? 'text' : 'password'}
          autoComplete={autoComplete}
          // Réserve la place du bouton : sans cela, un mot de passe long
          // passerait sous l'icône et deviendrait illisible en fin de champ.
          className={cn('pr-10', className)}
        />
        <Button
          type="button"
          variant="ghost"
          size="icon"
          // Hors du parcours de tabulation : le bouton est secondaire.
          tabIndex={-1}
          aria-label={visible ? 'Masquer le mot de passe' : 'Afficher le mot de passe'}
          aria-pressed={visible}
          onClick={() => setVisible((previous) => !previous)}
          // Conserve le focus et la position du curseur dans le champ.
          onMouseDown={(event) => event.preventDefault()}
          className="absolute right-0 top-0 h-full w-10 px-0 text-muted-foreground hover:bg-transparent hover:text-foreground"
        >
          {visible ? (
            <EyeOff className="h-4 w-4" aria-hidden="true" />
          ) : (
            <Eye className="h-4 w-4" aria-hidden="true" />
          )}
        </Button>
      </div>
    );
  },
);

PasswordInput.displayName = 'PasswordInput';

export { PasswordInput };
