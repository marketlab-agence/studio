import { getEmailProvider, resetProviders } from '@/lib/providers';
import { MemoryEmailProvider } from '@/lib/providers/email/memory';
import { ResendEmailProvider } from '@/lib/providers/email/resend';
import { SmtpEmailProvider } from '@/lib/providers/email/smtp';

/**
 * EmailProvider (T3.5).
 *
 * Le gate G3 (choix du fournisseur) reste ouvert : ces tests vérifient que le
 * **repli SMTP** est opérationnel et que la sélection par `EMAIL_PROVIDER`
 * fonctionne — donc qu'aucun appelant ne dépend d'un fournisseur précis.
 */
describe('EmailProvider', () => {
  const originalEnv = { ...process.env };

  beforeEach(() => {
    resetProviders();
    delete process.env.EMAIL_PROVIDER;
    delete process.env.SMTP_HOST;
    delete process.env.RESEND_API_KEY;
    delete process.env.EMAIL_FROM;
  });

  afterAll(() => {
    process.env = { ...originalEnv };
    resetProviders();
  });

  describe('sélection par EMAIL_PROVIDER', () => {
    it('utilise SMTP par défaut', () => {
      expect(getEmailProvider()).toBeInstanceOf(SmtpEmailProvider);
    });

    it('utilise memory quand demandé', () => {
      process.env.EMAIL_PROVIDER = 'memory';
      resetProviders();
      expect(getEmailProvider()).toBeInstanceOf(MemoryEmailProvider);
    });

    it('utilise Resend quand demandé', () => {
      process.env.EMAIL_PROVIDER = 'resend';
      resetProviders();
      expect(getEmailProvider()).toBeInstanceOf(ResendEmailProvider);
    });

    it('rejette un transport inconnu en nommant les valeurs valides', () => {
      process.env.EMAIL_PROVIDER = 'sendgrid';
      resetProviders();
      expect(() => getEmailProvider()).toThrow(/EMAIL_PROVIDER inconnu[\s\S]*smtp, resend, memory/);
    });

    it('mémorise l’instance choisie', () => {
      process.env.EMAIL_PROVIDER = 'memory';
      resetProviders();
      expect(getEmailProvider()).toBe(getEmailProvider());
    });
  });

  describe('MemoryEmailProvider', () => {
    it('retient les messages au lieu de les envoyer', async () => {
      const provider = new MemoryEmailProvider();

      await provider.send({ to: 'a@example.com', subject: 'Un', text: 'corps 1' });
      await provider.send({ to: 'b@example.com', subject: 'Deux', text: 'corps 2' });

      expect(provider.sent).toHaveLength(2);
      expect(provider.last()?.subject).toBe('Deux');
      expect(provider.sent[0].to).toBe('a@example.com');

      provider.clear();
      expect(provider.sent).toHaveLength(0);
      expect(provider.last()).toBeNull();
    });

    it('se déclare utilisable', async () => {
      await expect(new MemoryEmailProvider().verify?.()).resolves.toBe(true);
    });
  });

  describe('SmtpEmailProvider', () => {
    it('échoue avec un message actionnable quand SMTP_HOST manque', async () => {
      const provider = new SmtpEmailProvider();

      await expect(
        provider.send({ to: 'a@example.com', subject: 'Test', text: 'corps' }),
      ).rejects.toThrow(/SMTP_HOST manquant/);

      // Le message doit indiquer la marche à suivre, pas seulement constater.
      await expect(
        provider.send({ to: 'a@example.com', subject: 'Test', text: 'corps' }),
      ).rejects.toThrow(/EMAIL_PROVIDER=memory/);
    });

    it('se déclare inutilisable (sans lever) quand la configuration manque', async () => {
      await expect(new SmtpEmailProvider().verify?.()).resolves.toBe(false);
    });
  });

  describe('ResendEmailProvider', () => {
    it('échoue clairement quand RESEND_API_KEY manque', async () => {
      await expect(
        new ResendEmailProvider().send({ to: 'a@example.com', subject: 'Test', text: 'corps' }),
      ).rejects.toThrow(/RESEND_API_KEY manquant/);
    });

    it('poste le message sur l’API Resend', async () => {
      process.env.RESEND_API_KEY = 'cle-de-test';
      process.env.EMAIL_FROM = 'Katalyst <no-reply@katalyst.test>';

      const fetchMock = jest.fn().mockResolvedValue({ ok: true, status: 200 });
      const originalFetch = global.fetch;
      global.fetch = fetchMock as unknown as typeof fetch;

      try {
        await new ResendEmailProvider().send({
          to: 'apprenant@example.com',
          subject: 'Réinitialisation',
          text: 'Version texte',
          html: '<p>Version HTML</p>',
        });
      } finally {
        global.fetch = originalFetch;
      }

      expect(fetchMock).toHaveBeenCalledTimes(1);
      const [url, init] = fetchMock.mock.calls[0];
      expect(url).toBe('https://api.resend.com/emails');
      expect(init.method).toBe('POST');
      expect(init.headers.Authorization).toBe('Bearer cle-de-test');

      const body = JSON.parse(init.body);
      expect(body.to).toEqual(['apprenant@example.com']);
      expect(body.subject).toBe('Réinitialisation');
      expect(body.html).toBe('<p>Version HTML</p>');
      expect(body.from).toContain('no-reply@katalyst.test');
    });

    it('expose le motif de refus de l’API', async () => {
      process.env.RESEND_API_KEY = 'cle-de-test';

      const originalFetch = global.fetch;
      global.fetch = jest.fn().mockResolvedValue({
        ok: false,
        status: 422,
        text: async () => '{"message":"adresse invalide"}',
      }) as unknown as typeof fetch;

      try {
        await expect(
          new ResendEmailProvider().send({ to: 'x', subject: 'S', text: 'c' }),
        ).rejects.toThrow(/HTTP 422[\s\S]*adresse invalide/);
      } finally {
        global.fetch = originalFetch;
      }
    });
  });
});
