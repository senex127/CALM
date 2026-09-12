const Mailjet = require('node-mailjet');

function getClient() {
  return Mailjet.apiConnect(process.env.MJ_APIKEY_PUBLIC, process.env.MJ_APIKEY_PRIVATE);
}

/**
 * Envoi d'un email transactionnel simple. N'échoue jamais bruyamment :
 * une erreur d'envoi est loguée mais ne doit pas casser la requête HTTP en cours
 * (la réservation reste valide même si l'email part en retard ou échoue).
 */
async function sendMail({ to, subject, html }) {
  if (!process.env.MJ_APIKEY_PUBLIC) {
    console.warn('[mailer] MJ_APIKEY_PUBLIC absent — email non envoyé (dev ?):', subject);
    return;
  }
  try {
    await getClient().post('send', { version: 'v3.1' }).request({
      Messages: [
        {
          From: { Email: process.env.MJ_SENDER_EMAIL, Name: 'Reservator' },
          To: [{ Email: to }],
          Subject: subject,
          HTMLPart: html,
        },
      ],
    });
  } catch (err) {
    console.error('[mailer] Échec envoi email:', err.message);
  }
}

module.exports = { sendMail };
