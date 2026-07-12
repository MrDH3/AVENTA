/** Small typed accessor for environment variables (server only). */

function opt(name: string): string | undefined {
  const v = process.env[name]
  return v && v.length > 0 ? v : undefined
}

function req(name: string): string {
  const v = opt(name)
  if (!v) throw new Error(`Missing required env var: ${name}`)
  return v
}

export const env = {
  appUrl: opt('APP_URL') ?? 'http://localhost:3000',
  isProd: process.env.NODE_ENV === 'production',

  get sessionSecret() {
    return req('SESSION_SECRET')
  },
  get docKey() {
    return req('DOC_ENCRYPTION_KEY')
  },
  storageDir: opt('STORAGE_DIR') ?? './.storage',

  mail: {
    host: opt('SMTP_HOST'),
    port: Number(opt('SMTP_PORT') ?? 587),
    user: opt('SMTP_USER'),
    pass: opt('SMTP_PASS'),
    from: opt('MAIL_FROM') ?? 'AVENTA <no-reply@aventa.rent>',
    adminEmail: opt('ADMIN_EMAIL') ?? 'admin@aventa.rent',
  },

  telegram: {
    botToken: opt('TELEGRAM_BOT_TOKEN'),
    adminChatId: opt('TELEGRAM_ADMIN_CHAT_ID'),
  },

  whatsapp: {
    token: opt('WHATSAPP_TOKEN'),
    phoneId: opt('WHATSAPP_PHONE_ID'),
  },

  stripe: {
    secret: opt('STRIPE_SECRET_KEY'),
    webhookSecret: opt('STRIPE_WEBHOOK_SECRET'),
    publishable: opt('NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY'),
  },

  paypal: {
    clientId: opt('PAYPAL_CLIENT_ID'),
    clientSecret: opt('PAYPAL_CLIENT_SECRET'),
    envName: opt('PAYPAL_ENV') ?? 'sandbox',
  },

  crypto: {
    usdtTrc20: opt('CRYPTO_USDT_TRC20'),
    usdtErc20: opt('CRYPTO_USDT_ERC20'),
    usdtBep20: opt('CRYPTO_USDT_BEP20'),
    usdcErc20: opt('CRYPTO_USDC_ERC20'),
    usdcPolygon: opt('CRYPTO_USDC_POLYGON'),
  },
}
