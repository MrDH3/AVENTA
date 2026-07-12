import QRCode from 'qrcode'

async function main() {
  const wallets: Record<string, string | undefined> = {
    'USDT/TRC20': process.env.CRYPTO_USDT_TRC20,
    'USDT/ERC20': process.env.CRYPTO_USDT_ERC20,
    'USDT/BEP20': process.env.CRYPTO_USDT_BEP20,
    'USDC/ERC20': process.env.CRYPTO_USDC_ERC20,
    'USDC/POLYGON': process.env.CRYPTO_USDC_POLYGON,
  }
  const configured = Object.entries(wallets).filter(([, v]) => v && v.length > 0)
  console.log('configured crypto options:', configured.length)
  for (const [k, v] of configured) console.log('  •', k, '→', v)
  const first = configured[0]?.[1]
  if (first) {
    const qr = await QRCode.toDataURL(first, { width: 240 })
    console.log('QR data-url generated:', qr.startsWith('data:image/png') ? 'OK (' + qr.length + ' bytes)' : 'FAIL')
  }
}
main().catch((e) => { console.error(e); process.exit(1) })
