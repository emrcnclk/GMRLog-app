export interface EmailMessage {
  to: string;
  subject: string;
  text: string;
  html?: string;
}

/**
 * Outbound email port (D3.19). SMTP in local/dev; noop in tests.
 */
export interface EmailPort {
  send(message: EmailMessage): Promise<void>;
}

export const EMAIL_PORT = Symbol('EMAIL_PORT');
