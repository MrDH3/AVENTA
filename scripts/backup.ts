/**
 * Database backup — runs `pg_dump` inside the Docker Postgres container and
 * writes a timestamped, gzipped SQL dump to BACKUP_DIR.
 *
 *   npm run backup
 *
 * Restore (example):
 *   gunzip -c backups/aventa-YYYY-MM-DDTHH-MM-SS.sql.gz | \
 *     docker exec -i aventa-db psql -U aventa -d aventa
 */
import { execFile } from 'node:child_process'
import { createWriteStream, mkdirSync } from 'node:fs'
import { createGzip } from 'node:zlib'
import path from 'node:path'

const BACKUP_DIR = process.env.BACKUP_DIR ?? './backups'
const CONTAINER = 'aventa-db'
const DB = 'aventa'
const USER = 'aventa'

function timestamp(): string {
  return new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19)
}

async function main() {
  mkdirSync(BACKUP_DIR, { recursive: true })
  const outFile = path.join(BACKUP_DIR, `aventa-${timestamp()}.sql.gz`)
  const out = createWriteStream(outFile)
  const gzip = createGzip()
  gzip.pipe(out)

  console.log(`📦 Backing up ${DB} → ${outFile}`)
  const child = execFile('docker', ['exec', CONTAINER, 'pg_dump', '-U', USER, '-d', DB, '--no-owner', '--clean', '--if-exists'])
  child.stdout?.pipe(gzip)
  let err = ''
  child.stderr?.on('data', (d) => (err += d))

  child.on('close', (code) => {
    gzip.end()
    if (code === 0) {
      out.on('close', () => console.log('✅ Backup complete'))
    } else {
      console.error(`❌ pg_dump exited ${code}\n${err}`)
      process.exit(1)
    }
  })
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
