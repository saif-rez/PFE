const transporter = require('../config/mailer');

const sendReminderEmail = async ({ chefNom, projetNom, deadline, chefEmail }) => {
  await transporter.sendMail({
    from: `"Green Impact" <${process.env.EMAIL_FROM}>`,
    to: chefEmail,
    subject: 'Rappel — Soumission rapport semestriel dans 3 jours',
    html: `
      <!DOCTYPE html>
      <html lang="fr">
      <head><meta charset="UTF-8"></head>
      <body style="margin:0;padding:0;background-color:#f4f7f4;font-family:Arial,sans-serif;">
        <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f4f7f4;padding:40px 0;">
          <tr><td align="center">
            <table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:8px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.08);">

              <!-- Header -->
              <tr>
                <td style="background-color:#0D4A2E;padding:32px 40px;text-align:center;">
                  <h1 style="color:#ffffff;margin:0;font-size:22px;font-weight:bold;">🌿 Green Impact</h1>
                  <p style="color:#A8E6CF;margin:8px 0 0;font-size:14px;">Plateforme de suivi des projets environnementaux</p>
                </td>
              </tr>

              <!-- Body -->
              <tr>
                <td style="padding:40px;">
                  <p style="font-size:16px;color:#333;margin:0 0 16px;">Bonjour <strong>${chefNom}</strong>,</p>
                  <p style="font-size:15px;color:#555;line-height:1.6;margin:0 0 24px;">
                    Nous vous rappelons que la deadline de soumission du rapport semestriel pour votre projet
                    <strong style="color:#0D4A2E;">${projetNom}</strong> approche dans <strong>3 jours</strong>.
                  </p>

                  <!-- Alert box -->
                  <table width="100%" cellpadding="0" cellspacing="0" style="background:#FFF8E1;border-left:4px solid #F59E0B;border-radius:4px;margin-bottom:24px;">
                    <tr>
                      <td style="padding:16px 20px;">
                        <p style="margin:0;font-size:15px;color:#92400E;">
                          ⚠️ <strong>Date limite :</strong> ${deadline}
                        </p>
                      </td>
                    </tr>
                  </table>

                  <p style="font-size:15px;color:#555;line-height:1.6;margin:0 0 32px;">
                    Merci de vous connecter à la plateforme et de soumettre votre rapport avant cette date
                    afin d'éviter tout retard dans le processus de validation.
                  </p>

                  <!-- CTA Button -->
                  <table cellpadding="0" cellspacing="0" style="margin:0 auto 32px;">
                    <tr>
                      <td style="background-color:#0D4A2E;border-radius:6px;padding:14px 32px;text-align:center;">
                        <a href="${process.env.FRONTEND_URL || '#'}" style="color:#ffffff;text-decoration:none;font-size:15px;font-weight:bold;">
                          Accéder à la plateforme →
                        </a>
                      </td>
                    </tr>
                  </table>

                  <p style="font-size:13px;color:#999;margin:0;">
                    Si vous avez déjà soumis votre rapport, veuillez ignorer ce message.
                  </p>
                </td>
              </tr>

              <!-- Footer -->
              <tr>
                <td style="background:#f4f7f4;padding:20px 40px;text-align:center;border-top:1px solid #e8e8e8;">
                  <p style="margin:0;font-size:12px;color:#999;">
                    © ${new Date().getFullYear()} Green Impact — ONG tunisienne de recherche environnementale
                  </p>
                </td>
              </tr>

            </table>
          </td></tr>
        </table>
      </body>
      </html>
    `
  });
};

const sendOverdueEmail = async ({ chefNom, projetNom, chefEmail }) => {
  await transporter.sendMail({
    from: `"Green Impact" <${process.env.EMAIL_FROM}>`,
    to: chefEmail,
    subject: 'URGENT — Deadline de soumission dépassée',
    html: `
      <!DOCTYPE html>
      <html lang="fr">
      <head><meta charset="UTF-8"></head>
      <body style="margin:0;padding:0;background-color:#f4f7f4;font-family:Arial,sans-serif;">
        <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f4f7f4;padding:40px 0;">
          <tr><td align="center">
            <table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:8px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.08);">

              <!-- Header -->
              <tr>
                <td style="background-color:#B91C1C;padding:32px 40px;text-align:center;">
                  <h1 style="color:#ffffff;margin:0;font-size:22px;font-weight:bold;">🌿 Green Impact</h1>
                  <p style="color:#FCA5A5;margin:8px 0 0;font-size:14px;">Plateforme de suivi des projets environnementaux</p>
                </td>
              </tr>

              <!-- Body -->
              <tr>
                <td style="padding:40px;">
                  <p style="font-size:16px;color:#333;margin:0 0 16px;">Bonjour <strong>${chefNom}</strong>,</p>
                  <p style="font-size:15px;color:#555;line-height:1.6;margin:0 0 24px;">
                    La deadline de soumission du rapport semestriel pour votre projet
                    <strong style="color:#B91C1C;">${projetNom}</strong> est <strong>dépassée</strong>.
                  </p>

                  <!-- Alert box -->
                  <table width="100%" cellpadding="0" cellspacing="0" style="background:#FEF2F2;border-left:4px solid #B91C1C;border-radius:4px;margin-bottom:24px;">
                    <tr>
                      <td style="padding:16px 20px;">
                        <p style="margin:0;font-size:15px;color:#991B1B;">
                          🚨 <strong>Votre rapport n'a pas été soumis dans les délais impartis.</strong>
                        </p>
                        <p style="margin:8px 0 0;font-size:13px;color:#991B1B;">
                          Veuillez soumettre votre rapport dès que possible et contacter l'administration si nécessaire.
                        </p>
                      </td>
                    </tr>
                  </table>

                  <p style="font-size:15px;color:#555;line-height:1.6;margin:0 0 32px;">
                    Nous vous demandons de vous connecter immédiatement à la plateforme et de soumettre
                    votre rapport semestriel dans les plus brefs délais.
                  </p>

                  <!-- CTA Button -->
                  <table cellpadding="0" cellspacing="0" style="margin:0 auto 32px;">
                    <tr>
                      <td style="background-color:#B91C1C;border-radius:6px;padding:14px 32px;text-align:center;">
                        <a href="${process.env.FRONTEND_URL || '#'}" style="color:#ffffff;text-decoration:none;font-size:15px;font-weight:bold;">
                          Soumettre mon rapport →
                        </a>
                      </td>
                    </tr>
                  </table>

                  <p style="font-size:13px;color:#999;margin:0;">
                    Pour toute question, contactez l'administration Green Impact.
                  </p>
                </td>
              </tr>

              <!-- Footer -->
              <tr>
                <td style="background:#f4f7f4;padding:20px 40px;text-align:center;border-top:1px solid #e8e8e8;">
                  <p style="margin:0;font-size:12px;color:#999;">
                    © ${new Date().getFullYear()} Green Impact — ONG tunisienne de recherche environnementale
                  </p>
                </td>
              </tr>

            </table>
          </td></tr>
        </table>
      </body>
      </html>
    `
  });
};

const sendWelcomeEmail = async ({ chefNom, chefEmail, motDePasse, projetNom }) => {
  await transporter.sendMail({
    from: `"Green Impact" <${process.env.EMAIL_FROM}>`,
    to: chefEmail,
    subject: 'Bienvenue sur Green Impact — Vos identifiants de connexion',
    html: `
      <!DOCTYPE html>
      <html lang="fr">
      <head><meta charset="UTF-8"></head>
      <body style="margin:0;padding:0;background-color:#f4f7f4;font-family:Arial,sans-serif;">
        <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f4f7f4;padding:40px 0;">
          <tr><td align="center">
            <table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:8px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.08);">

              <!-- Header -->
              <tr>
                <td style="background-color:#0D4A2E;padding:32px 40px;text-align:center;">
                  <h1 style="color:#ffffff;margin:0;font-size:22px;font-weight:bold;">🌿 Green Impact</h1>
                  <p style="color:#A8E6CF;margin:8px 0 0;font-size:14px;">Plateforme de suivi des projets environnementaux</p>
                </td>
              </tr>

              <!-- Body -->
              <tr>
                <td style="padding:40px;">
                  <p style="font-size:16px;color:#333;margin:0 0 16px;">Bonjour <strong>${chefNom}</strong>,</p>
                  <p style="font-size:15px;color:#555;line-height:1.6;margin:0 0 24px;">
                    Votre compte chef de projet a été créé sur la plateforme <strong style="color:#0D4A2E;">Green Impact</strong>.
                    Vous êtes assigné(e) au projet suivant :
                  </p>

                  <!-- Project box -->
                  <table width="100%" cellpadding="0" cellspacing="0" style="background:#F0FDF4;border-left:4px solid #0D4A2E;border-radius:4px;margin-bottom:24px;">
                    <tr>
                      <td style="padding:16px 20px;">
                        <p style="margin:0;font-size:15px;color:#0D4A2E;">
                          📁 <strong>Projet assigné :</strong> ${projetNom || 'Non assigné pour le moment'}
                        </p>
                      </td>
                    </tr>
                  </table>

                  <p style="font-size:15px;color:#555;line-height:1.6;margin:0 0 16px;">
                    Voici vos identifiants de connexion :
                  </p>

                  <!-- Credentials box -->
                  <table width="100%" cellpadding="0" cellspacing="0" style="background:#F8FAFC;border:1px solid #E2E8F0;border-radius:6px;margin-bottom:24px;">
                    <tr>
                      <td style="padding:20px 24px;">
                        <p style="margin:0 0 10px;font-size:14px;color:#64748B;">Adresse email</p>
                        <p style="margin:0 0 20px;font-size:16px;color:#0F172A;font-weight:bold;">${chefEmail}</p>
                        <p style="margin:0 0 10px;font-size:14px;color:#64748B;">Mot de passe temporaire</p>
                        <p style="margin:0;font-size:20px;color:#0D4A2E;font-weight:bold;letter-spacing:2px;font-family:monospace;">${motDePasse}</p>
                      </td>
                    </tr>
                  </table>

                  <p style="font-size:13px;color:#EF4444;margin:0 0 24px;">
                    ⚠️ Pour des raisons de sécurité, nous vous recommandons de changer ce mot de passe dès votre première connexion.
                  </p>

                  <!-- CTA Button -->
                  <table cellpadding="0" cellspacing="0" style="margin:0 auto 32px;">
                    <tr>
                      <td style="background-color:#0D4A2E;border-radius:6px;padding:14px 32px;text-align:center;">
                        <a href="${process.env.FRONTEND_URL || '#'}" style="color:#ffffff;text-decoration:none;font-size:15px;font-weight:bold;">
                          Accéder à la plateforme →
                        </a>
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>

              <!-- Footer -->
              <tr>
                <td style="background:#f4f7f4;padding:20px 40px;text-align:center;border-top:1px solid #e8e8e8;">
                  <p style="margin:0;font-size:12px;color:#999;">
                    © ${new Date().getFullYear()} Green Impact — ONG tunisienne de recherche environnementale
                  </p>
                </td>
              </tr>

            </table>
          </td></tr>
        </table>
      </body>
      </html>
    `
  });
};

const sendPasswordResetEmail = async ({ nom, email, resetUrl, cancelUrl, ip, userAgent, expiresAt }) => {
  const expiresStr = expiresAt.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
  const expiresDateStr = expiresAt.toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' });

  await transporter.sendMail({
    from: `"Green Impact" <${process.env.EMAIL_FROM}>`,
    to: email,
    subject: 'Réinitialisation de votre mot de passe — Green Impact',
    html: `
      <!DOCTYPE html>
      <html lang="fr">
      <head><meta charset="UTF-8"></head>
      <body style="margin:0;padding:0;background-color:#f4f7f4;font-family:Arial,sans-serif;">
        <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f4f7f4;padding:40px 0;">
          <tr><td align="center">
            <table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:8px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.08);">

              <!-- Header -->
              <tr>
                <td style="background-color:#0D4A2E;padding:32px 40px;text-align:center;">
                  <h1 style="color:#ffffff;margin:0;font-size:22px;font-weight:bold;">🌿 Green Impact</h1>
                  <p style="color:#A8E6CF;margin:8px 0 0;font-size:14px;">Réinitialisation de mot de passe</p>
                </td>
              </tr>

              <!-- Body -->
              <tr>
                <td style="padding:40px;">
                  <p style="font-size:16px;color:#333;margin:0 0 16px;">Bonjour <strong>${nom}</strong>,</p>
                  <p style="font-size:15px;color:#555;line-height:1.6;margin:0 0 24px;">
                    Nous avons reçu une demande de réinitialisation du mot de passe pour votre compte.
                    Cliquez sur le bouton ci-dessous pour choisir un nouveau mot de passe.
                  </p>

                  <!-- CTA Button -->
                  <table cellpadding="0" cellspacing="0" style="margin:0 auto 24px;">
                    <tr>
                      <td style="background-color:#0D4A2E;border-radius:6px;padding:14px 32px;text-align:center;">
                        <a href="${resetUrl}" style="color:#ffffff;text-decoration:none;font-size:15px;font-weight:bold;">
                          Réinitialiser mon mot de passe →
                        </a>
                      </td>
                    </tr>
                  </table>

                  <!-- Expiry warning -->
                  <table width="100%" cellpadding="0" cellspacing="0" style="background:#FFF8E1;border-left:4px solid #F59E0B;border-radius:4px;margin-bottom:24px;">
                    <tr>
                      <td style="padding:14px 18px;">
                        <p style="margin:0;font-size:14px;color:#92400E;">
                          ⏱ Ce lien expire le <strong>${expiresDateStr} à ${expiresStr}</strong> (dans 15 minutes).
                        </p>
                      </td>
                    </tr>
                  </table>

                  <!-- Security info -->
                  <table width="100%" cellpadding="0" cellspacing="0" style="background:#F8FAFC;border:1px solid #E2E8F0;border-radius:6px;margin-bottom:24px;">
                    <tr>
                      <td style="padding:16px 20px;">
                        <p style="margin:0 0 6px;font-size:13px;color:#64748B;font-weight:bold;">🔐 Informations de sécurité</p>
                        <p style="margin:0 0 4px;font-size:13px;color:#475569;">Adresse IP : <strong>${ip}</strong></p>
                        <p style="margin:0;font-size:13px;color:#475569;">Navigateur : <strong>${userAgent.substring(0, 80)}</strong></p>
                      </td>
                    </tr>
                  </table>

                  <!-- Not me link -->
                  <table width="100%" cellpadding="0" cellspacing="0" style="background:#FEF2F2;border-left:4px solid #EF4444;border-radius:4px;margin-bottom:24px;">
                    <tr>
                      <td style="padding:14px 18px;">
                        <p style="margin:0;font-size:14px;color:#991B1B;">
                          🚨 Ce n'était pas vous ?
                          <a href="${cancelUrl}" style="color:#B91C1C;font-weight:bold;text-decoration:underline;">
                            Annuler ce lien immédiatement
                          </a>
                        </p>
                      </td>
                    </tr>
                  </table>

                  <p style="font-size:13px;color:#999;margin:0;">
                    Si vous n'avez pas demandé cette réinitialisation, ignorez cet email. Votre mot de passe ne sera pas modifié.
                  </p>
                </td>
              </tr>

              <!-- Footer -->
              <tr>
                <td style="background:#f4f7f4;padding:20px 40px;text-align:center;border-top:1px solid #e8e8e8;">
                  <p style="margin:0;font-size:12px;color:#999;">
                    © ${new Date().getFullYear()} Green Impact — ONG tunisienne de recherche environnementale
                  </p>
                </td>
              </tr>

            </table>
          </td></tr>
        </table>
      </body>
      </html>
    `
  });
};

const sendPasswordChangedEmail = async ({ nom, email }) => {
  const changedAt = new Date().toLocaleString('fr-FR', {
    day: '2-digit', month: 'long', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });

  await transporter.sendMail({
    from: `"Green Impact" <${process.env.EMAIL_FROM}>`,
    to: email,
    subject: 'Votre mot de passe a été modifié — Green Impact',
    html: `
      <!DOCTYPE html>
      <html lang="fr">
      <head><meta charset="UTF-8"></head>
      <body style="margin:0;padding:0;background-color:#f4f7f4;font-family:Arial,sans-serif;">
        <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f4f7f4;padding:40px 0;">
          <tr><td align="center">
            <table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:8px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.08);">

              <!-- Header -->
              <tr>
                <td style="background-color:#0D4A2E;padding:32px 40px;text-align:center;">
                  <h1 style="color:#ffffff;margin:0;font-size:22px;font-weight:bold;">🌿 Green Impact</h1>
                  <p style="color:#A8E6CF;margin:8px 0 0;font-size:14px;">Confirmation de sécurité</p>
                </td>
              </tr>

              <!-- Body -->
              <tr>
                <td style="padding:40px;">
                  <p style="font-size:16px;color:#333;margin:0 0 16px;">Bonjour <strong>${nom}</strong>,</p>

                  <!-- Success box -->
                  <table width="100%" cellpadding="0" cellspacing="0" style="background:#F0FDF4;border-left:4px solid #0D4A2E;border-radius:4px;margin-bottom:24px;">
                    <tr>
                      <td style="padding:16px 20px;">
                        <p style="margin:0;font-size:15px;color:#0D4A2E;font-weight:bold;">
                          ✅ Votre mot de passe a été modifié avec succès.
                        </p>
                        <p style="margin:6px 0 0;font-size:13px;color:#166534;">
                          Le ${changedAt}
                        </p>
                      </td>
                    </tr>
                  </table>

                  <p style="font-size:15px;color:#555;line-height:1.6;margin:0 0 24px;">
                    Toutes vos sessions actives ont été déconnectées. Connectez-vous avec votre nouveau mot de passe.
                  </p>

                  <!-- Security warning -->
                  <table width="100%" cellpadding="0" cellspacing="0" style="background:#FEF2F2;border-left:4px solid #EF4444;border-radius:4px;margin-bottom:32px;">
                    <tr>
                      <td style="padding:14px 18px;">
                        <p style="margin:0;font-size:14px;color:#991B1B;">
                          🚨 Si vous n'avez pas effectué ce changement, contactez immédiatement l'administration Green Impact.
                        </p>
                      </td>
                    </tr>
                  </table>

                  <!-- CTA -->
                  <table cellpadding="0" cellspacing="0" style="margin:0 auto 24px;">
                    <tr>
                      <td style="background-color:#0D4A2E;border-radius:6px;padding:14px 32px;text-align:center;">
                        <a href="${process.env.FRONTEND_URL || '#'}" style="color:#ffffff;text-decoration:none;font-size:15px;font-weight:bold;">
                          Se connecter →
                        </a>
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>

              <!-- Footer -->
              <tr>
                <td style="background:#f4f7f4;padding:20px 40px;text-align:center;border-top:1px solid #e8e8e8;">
                  <p style="margin:0;font-size:12px;color:#999;">
                    © ${new Date().getFullYear()} Green Impact — ONG tunisienne de recherche environnementale
                  </p>
                </td>
              </tr>

            </table>
          </td></tr>
        </table>
      </body>
      </html>
    `
  });
};

const sendReportApprovedEmail = async ({ chefNom, chefEmail, projetNom, periode }) => {
  await transporter.sendMail({
    from: `"Green Impact" <${process.env.EMAIL_FROM}>`,
    to: chefEmail,
    subject: `Rapport approuvé — ${projetNom}`,
    html: `
      <!DOCTYPE html>
      <html lang="fr">
      <head><meta charset="UTF-8"></head>
      <body style="margin:0;padding:0;background-color:#f4f7f4;font-family:Arial,sans-serif;">
        <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f4f7f4;padding:40px 0;">
          <tr><td align="center">
            <table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:8px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.08);">

              <!-- Header -->
              <tr>
                <td style="background-color:#0D4A2E;padding:32px 40px;text-align:center;">
                  <h1 style="color:#ffffff;margin:0;font-size:22px;font-weight:bold;">🌿 Green Impact</h1>
                  <p style="color:#A8E6CF;margin:8px 0 0;font-size:14px;">Plateforme de suivi des projets environnementaux</p>
                </td>
              </tr>

              <!-- Body -->
              <tr>
                <td style="padding:40px;">
                  <p style="font-size:16px;color:#333;margin:0 0 16px;">Bonjour <strong>${chefNom}</strong>,</p>

                  <!-- Success box -->
                  <table width="100%" cellpadding="0" cellspacing="0" style="background:#F0FDF4;border-left:4px solid #0D4A2E;border-radius:4px;margin-bottom:24px;">
                    <tr>
                      <td style="padding:16px 20px;">
                        <p style="margin:0;font-size:15px;color:#0D4A2E;font-weight:bold;">
                          ✅ Votre rapport a été approuvé.
                        </p>
                        <p style="margin:6px 0 0;font-size:13px;color:#166534;">
                          Projet : ${projetNom} — Période : ${periode}
                        </p>
                      </td>
                    </tr>
                  </table>

                  <p style="font-size:15px;color:#555;line-height:1.6;margin:0 0 32px;">
                    Merci pour la qualité de votre suivi. Vous pouvez consulter le rapport approuvé directement sur la plateforme.
                  </p>

                  <!-- CTA Button -->
                  <table cellpadding="0" cellspacing="0" style="margin:0 auto 24px;">
                    <tr>
                      <td style="background-color:#0D4A2E;border-radius:6px;padding:14px 32px;text-align:center;">
                        <a href="${process.env.FRONTEND_URL || '#'}" style="color:#ffffff;text-decoration:none;font-size:15px;font-weight:bold;">
                          Accéder à la plateforme →
                        </a>
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>

              <!-- Footer -->
              <tr>
                <td style="background:#f4f7f4;padding:20px 40px;text-align:center;border-top:1px solid #e8e8e8;">
                  <p style="margin:0;font-size:12px;color:#999;">
                    © ${new Date().getFullYear()} Green Impact — ONG tunisienne de recherche environnementale
                  </p>
                </td>
              </tr>

            </table>
          </td></tr>
        </table>
      </body>
      </html>
    `
  });
};

const sendReportRejectedEmail = async ({ chefNom, chefEmail, projetNom, periode, raison }) => {
  await transporter.sendMail({
    from: `"Green Impact" <${process.env.EMAIL_FROM}>`,
    to: chefEmail,
    subject: `Rapport rejeté — ${projetNom}`,
    html: `
      <!DOCTYPE html>
      <html lang="fr">
      <head><meta charset="UTF-8"></head>
      <body style="margin:0;padding:0;background-color:#f4f7f4;font-family:Arial,sans-serif;">
        <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f4f7f4;padding:40px 0;">
          <tr><td align="center">
            <table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:8px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.08);">

              <!-- Header -->
              <tr>
                <td style="background-color:#B91C1C;padding:32px 40px;text-align:center;">
                  <h1 style="color:#ffffff;margin:0;font-size:22px;font-weight:bold;">🌿 Green Impact</h1>
                  <p style="color:#FCA5A5;margin:8px 0 0;font-size:14px;">Plateforme de suivi des projets environnementaux</p>
                </td>
              </tr>

              <!-- Body -->
              <tr>
                <td style="padding:40px;">
                  <p style="font-size:16px;color:#333;margin:0 0 16px;">Bonjour <strong>${chefNom}</strong>,</p>
                  <p style="font-size:15px;color:#555;line-height:1.6;margin:0 0 24px;">
                    Votre rapport pour le projet <strong style="color:#B91C1C;">${projetNom}</strong>
                    (période : ${periode}) a été <strong>rejeté</strong> par l'administration.
                  </p>

                  <!-- Reason box -->
                  <table width="100%" cellpadding="0" cellspacing="0" style="background:#FEF2F2;border-left:4px solid #B91C1C;border-radius:4px;margin-bottom:24px;">
                    <tr>
                      <td style="padding:16px 20px;">
                        <p style="margin:0 0 6px;font-size:13px;color:#991B1B;font-weight:bold;">Motif du rejet :</p>
                        <p style="margin:0;font-size:14px;color:#991B1B;">${raison}</p>
                      </td>
                    </tr>
                  </table>

                  <p style="font-size:15px;color:#555;line-height:1.6;margin:0 0 32px;">
                    Merci de corriger votre rapport et de le resoumettre depuis la plateforme dès que possible.
                  </p>

                  <!-- CTA Button -->
                  <table cellpadding="0" cellspacing="0" style="margin:0 auto 24px;">
                    <tr>
                      <td style="background-color:#B91C1C;border-radius:6px;padding:14px 32px;text-align:center;">
                        <a href="${process.env.FRONTEND_URL || '#'}" style="color:#ffffff;text-decoration:none;font-size:15px;font-weight:bold;">
                          Resoumettre mon rapport →
                        </a>
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>

              <!-- Footer -->
              <tr>
                <td style="background:#f4f7f4;padding:20px 40px;text-align:center;border-top:1px solid #e8e8e8;">
                  <p style="margin:0;font-size:12px;color:#999;">
                    © ${new Date().getFullYear()} Green Impact — ONG tunisienne de recherche environnementale
                  </p>
                </td>
              </tr>

            </table>
          </td></tr>
        </table>
      </body>
      </html>
    `
  });
};

module.exports = {
  sendReminderEmail,
  sendOverdueEmail,
  sendWelcomeEmail,
  sendPasswordResetEmail,
  sendPasswordChangedEmail,
  sendReportApprovedEmail,
  sendReportRejectedEmail,
};
