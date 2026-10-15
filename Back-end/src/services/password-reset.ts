import axios from 'axios';
import { config } from '../config.js';

export async function notifyPasswordReset(email: string, token: string) {
  if (!config.PASSWORD_RESET_WEBHOOK_URL) {
    console.info(`[password-reset] token gerado para ${email}: ${token}`);
    return;
  }

  await axios.post(config.PASSWORD_RESET_WEBHOOK_URL, {
    email,
    token,
    expiresInMinutes: config.PASSWORD_RESET_EXPIRES_IN_MINUTES
  }, { timeout: 5000 });
}
