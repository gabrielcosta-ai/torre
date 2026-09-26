// Aplica db/schema.sql no banco de DATABASE_URL (ou POSTGRES_URL). Idempotente.
// Uso: npm run db:migrate   (com a env exportada ou num .env.local na raiz)
import { readFileSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { neon } from '@neondatabase/serverless';

const raiz = join(dirname(fileURLToPath(import.meta.url)), '..');

// Lê .env.local/.env se existirem, sem sobrescrever o que já está no ambiente.
for (const nome of ['.env.local', '.env']) {
  const arq = join(raiz, nome);
  if (!existsSync(arq)) continue;
  for (const linha of readFileSync(arq, 'utf8').split('\n')) {
    const m = /^\s*([A-Z0-9_]+)\s*=\s*(.*?)\s*$/.exec(linha);
    if (!m || process.env[m[1]]) continue;
    process.env[m[1]] = m[2].replace(/^(['"])(.*)\1$/, '$2');
  }
}

const url = process.env.DATABASE_URL || process.env.POSTGRES_URL;
if (!url) {
  console.error('db:migrate: defina DATABASE_URL (ou POSTGRES_URL).');
  process.exit(1);
}

// Tira as linhas de comentário e separa por ";" no fim da linha.
const texto = readFileSync(join(raiz, 'db', 'schema.sql'), 'utf8')
  .split('\n')
  .filter((l) => !/^\s*--/.test(l))
  .join('\n');
const comandos = texto
  .split(/;\s*$/m)
  .map((c) => c.trim())
  .filter(Boolean);

const sql = neon(url);
let n = 0;
for (const c of comandos) {
  try {
    await sql.query(c);
    n++;
  } catch (e) {
    console.error(`db:migrate: falhou no comando ${n + 1}:\n${c.slice(0, 200)}\n-> ${e.message}`);
    process.exit(1);
  }
}
console.log(`db:migrate: ${n} comandos aplicados.`);
