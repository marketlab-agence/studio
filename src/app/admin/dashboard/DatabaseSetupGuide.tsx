
'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, AlertTriangle, CheckCircle, Database } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { initializeDatabase } from '@/actions/adminActions';
import { CodeBlock } from '@/components/ui/CodeBlock';
import { useToast } from '@/hooks/use-toast';

export function DatabaseSetupGuide() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const { toast } = useToast();

  const handleInitialize = async () => {
    setIsLoading(true);
    setError(null);
    setSuccess(null);
    try {
      const result = await initializeDatabase();
      if (result.success) {
        setSuccess(result.message);
        toast({
            title: "Succès !",
            description: "La base de données a été peuplée. La page va être rechargée."
        });
        // Reload the page to reflect the new data
        window.location.reload();
      } else {
        setError(result.message || "Une erreur inconnue est survenue.");
      }
    } catch (e: any) {
      setError(e.message || "Une erreur inconnue est survenue.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="mt-6 border-primary/30">
      <CardHeader>
        <div className="flex items-center gap-4">
            <div className="p-3 bg-primary/10 rounded-lg">
                <Database className="h-8 w-8 text-primary" />
            </div>
            <div>
                <CardTitle>Initialisation de la Base de Données</CardTitle>
                <CardDescription>
                Votre application est prête à être connectée à une base de données Firestore.
                </CardDescription>
            </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        <Alert>
          <CheckCircle className="h-4 w-4" />
          <AlertTitle>État Actuel</AlertTitle>
          <AlertDescription>
            Aucune formation n'a été trouvée dans votre base de données. Suivez les étapes ci-dessous pour la configurer et la peupler avec les données de démonstration.
          </AlertDescription>
        </Alert>

        <div className="prose dark:prose-invert max-w-none">
            <h3 className="text-lg font-semibold">Guide de Configuration Firestore</h3>
            <ol className="list-decimal pl-5 space-y-4">
                <li>
                    <strong>Allez sur votre Console Firebase :</strong>
                    <p>Ouvrez votre projet dans la <a href="https://console.firebase.google.com/" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">console Firebase</a>.</p>
                </li>
                <li>
                    <strong>Créez une base de données Firestore :</strong>
                    <p>Dans le menu de gauche, sous "Build", cliquez sur "Firestore Database" puis sur "Créer une base de données". Choisissez le mode <strong>Production</strong> et sélectionnez un emplacement (ex: `eur3`).</p>
                </li>
                 <li>
                    <strong>Générez une clé de service :</strong>
                    <p>Allez dans les "Paramètres du projet" (icône d'engrenage en haut à gauche), puis dans l'onglet "Comptes de service". Cliquez sur "Générer une nouvelle clé privée" et téléchargez le fichier JSON.</p>
                </li>
                 <li>
                    <strong>Configurez vos variables d'environnement :</strong>
                    <p>Créez un fichier nommé <code>.env.local</code> à la racine de votre projet (au même niveau que <code>package.json</code>). Ouvrez le fichier JSON téléchargé et copiez-collez les valeurs comme ceci :</p>
                    <CodeBlock>
{`FIREBASE_PROJECT_ID="<votre_project_id>"
FIREBASE_CLIENT_EMAIL="<votre_client_email>"
FIREBASE_PRIVATE_KEY="<votre_private_key>"`}
                    </CodeBlock>
                    <p className="text-sm text-muted-foreground">Assurez-vous que la `private_key` est bien entre guillemets. Vous n'avez pas besoin de gérer les sauts de ligne `\\n`, ils seront interprétés correctement.</p>
                </li>
                 <li>
                    <strong>Redémarrez votre serveur :</strong>
                    <p>Très important ! Après avoir modifié le fichier <code>.env.local</code>, vous devez arrêter et redémarrer complètement votre serveur de développement pour que les nouvelles variables soient prises en compte.</p>
                </li>
            </ol>
        </div>

        <div className="pt-4 border-t">
          <h3 className="font-semibold text-lg mb-2">Peupler la Base de Données</h3>
          <p className="text-sm text-muted-foreground mb-4">
            Une fois la configuration terminée et le serveur redémarré, cliquez sur ce bouton. Cela créera les collections (`courses`, `tutorials`, etc.) et les remplira avec les données de démonstration du cours.
          </p>
          <Button onClick={handleInitialize} disabled={isLoading} size="lg">
            {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Database className="mr-2 h-4 w-4" />}
            Initialiser les Données
          </Button>
        </div>
        
        {error && (
            <Alert variant="destructive" className="mt-4">
                <AlertTriangle className="h-4 w-4" />
                <AlertTitle>Échec de l'Initialisation</AlertTitle>
                <AlertDescription>
                    <p>Impossible de peupler la base de données. Voici l'erreur reçue :</p>
                    <pre className="mt-2 whitespace-pre-wrap text-xs bg-destructive/20 p-2 rounded-md">
                        {error}
                    </pre>
                </AlertDescription>
            </Alert>
        )}
        {success && (
             <Alert variant="default" className="mt-4 bg-green-500/10 border-green-500/50">
                <CheckCircle className="h-4 w-4 text-green-500"/>
                <AlertTitle>Succès !</AlertTitle>
                <AlertDescription>
                    {success}
                </AlertDescription>
            </Alert>
        )}
      </CardContent>
    </Card>
  );
}
