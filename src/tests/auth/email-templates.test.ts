/**
 * @jest-environment node
 */
import { escapeHtml, passwordResetEmail } from '@/lib/email/templates';
import { absoluteUrl, appUrl } from '@/lib/email/urls';

/**
 * Gabarits d'emails (T4.8).
 *
 * Deux propriétés comptent : le message doit être **lisible en texte seul**, et
 * aucune donnée utilisateur ne doit être insérée sans échappement.
 */

describe('passwordResetEmail', () => {
  const base = {
    name: 'Alex Dubois',
    resetUrl: 'https://katalyst.test/reset-password?token=abc123',
    expiresInMinutes: 60,
  };

  it('produit un objet et un corps HTML', () => {
    const email = passwordResetEmail(base);

    expect(email.subject).toContain('Réinitialisation');
    expect(email.subject).toContain('Katalyst');
    expect(email.text).toContain(base.resetUrl);
    expect(email.html).toContain(base.resetUrl);
  });

  it('reste lisible en texte seul', () => {
    const email = passwordResetEmail(base);

    // Pas de balise HTML dans la version texte, et le lien y figure en clair :
    // c'est ce que lit un client configuré en mode texte.
    expect(email.text).not.toMatch(/<[a-z]/i);
    expect(email.text).toContain('Alex Dubois');
    expect(email.text).toContain('60 minutes');
  });

  it('annonce la durée de validité et l’usage unique', () => {
    const email = passwordResetEmail(base);

    expect(email.text).toContain('60 minutes');
    expect(email.text).toMatch(/une seule fois/);
    expect(email.html).toMatch(/une seule fois/);
  });

  it('invite à ignorer le message si la demande n’est pas de l’utilisateur', () => {
    // Un email de réinitialisation reçu sans demande doit alerter sans inquiéter.
    const email = passwordResetEmail(base);

    expect(email.text).toMatch(/n'êtes pas à l'origine/);
    expect(email.text).toMatch(/reste inchangé/);
  });

  it('accorde la durée au singulier', () => {
    expect(passwordResetEmail({ ...base, expiresInMinutes: 1 }).text).toContain('1 minute ');
  });

  it('retombe sur un nom d’organisation par défaut', () => {
    const email = passwordResetEmail({ ...base, organizationName: '   ' });

    expect(email.subject).toContain('Katalyst');
  });

  it('utilise le nom de l’organisation quand il est fourni', () => {
    const email = passwordResetEmail({ ...base, organizationName: 'Institut Formation IA' });

    expect(email.subject).toContain('Institut Formation IA');
    expect(email.text).toContain('Institut Formation IA');
  });

  it('échappe les données utilisateur insérées dans le HTML', () => {
    // Un nom de compte peut contenir des caractères HTML : sans échappement, il
    // injecterait du balisage dans l'email.
    const email = passwordResetEmail({
      ...base,
      name: '<script>alert(1)</script>',
      organizationName: 'A & B <test>',
    });

    expect(email.html).not.toContain('<script>');
    expect(email.html).toContain('&lt;script&gt;');
    expect(email.html).toContain('A &amp; B &lt;test&gt;');
  });

  it('échappe le lien sans le casser', () => {
    const url = 'https://katalyst.test/reset-password?token=a&b=c';
    const email = passwordResetEmail({ ...base, resetUrl: url });

    // Le « & » est échappé dans le HTML, ce qui est correct : le navigateur le
    // relira comme « & ».
    expect(email.html).toContain('token=a&amp;b=c');
  });
});

describe('escapeHtml', () => {
  it('neutralise les cinq caractères dangereux', () => {
    expect(escapeHtml('&<>"\'')).toBe('&amp;&lt;&gt;&quot;&#39;');
  });

  it('laisse intact un texte ordinaire', () => {
    expect(escapeHtml('Alex Dubois — formateur')).toBe('Alex Dubois — formateur');
  });
});

describe('appUrl', () => {
  const original = { url: process.env.APP_URL, nodeEnv: process.env.NODE_ENV };

  function setNodeEnv(value: string): void {
    (process.env as Record<string, string>).NODE_ENV = value;
  }

  afterEach(() => {
    if (original.url === undefined) delete process.env.APP_URL;
    else process.env.APP_URL = original.url;
    setNodeEnv(original.nodeEnv);
  });

  it('utilise APP_URL quand elle est définie, sans barre oblique finale', () => {
    process.env.APP_URL = 'https://katalyst.test/';
    expect(appUrl()).toBe('https://katalyst.test');
  });

  it('retombe sur localhost hors production', () => {
    delete process.env.APP_URL;
    delete process.env.NEXT_PUBLIC_APP_URL;
    setNodeEnv('development');

    expect(appUrl()).toBe('http://localhost:3000');
  });

  it('refuse de deviner une URL en production', () => {
    // Un lien erroné dans un email est difficile à diagnostiquer : l'utilisateur
    // reçoit le message, clique, et rien ne se passe. Mieux vaut échouer.
    delete process.env.APP_URL;
    delete process.env.NEXT_PUBLIC_APP_URL;
    setNodeEnv('production');

    expect(() => appUrl()).toThrow(/APP_URL est absent/);
  });

  it('construit un lien absolu', () => {
    process.env.APP_URL = 'https://katalyst.test';

    expect(absoluteUrl('/reset-password')).toBe('https://katalyst.test/reset-password');
    expect(absoluteUrl('reset-password')).toBe('https://katalyst.test/reset-password');
  });
});
