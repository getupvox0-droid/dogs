import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { createHash } from 'node:crypto';

const root = resolve(import.meta.dirname, '..');
const manifest = JSON.parse(readFileSync(resolve(root, 'scripts/github-asset-manifest.json'), 'utf8'));
const hash = bytes => createHash('sha1').update(Buffer.from('blob ' + bytes.length + '\0')).update(bytes).digest('hex');
let restored = 0;
for (const item of manifest) {
  const target = resolve(root, item.path);
  if (existsSync(target) && hash(readFileSync(target)) === item.sha) continue;
  if (!item.parts) throw new Error('Missing or damaged original image: ' + item.path);
  const bytes = Buffer.concat(item.parts.map(path => Buffer.from(readFileSync(resolve(root, path), 'ascii').trim(), 'base64')));
  if (bytes.length !== item.size || hash(bytes) !== item.sha) throw new Error('Image verification failed: ' + item.path);
  mkdirSync(dirname(target), { recursive: true });
  writeFileSync(target, bytes);
  restored++;
}
console.log('All ' + manifest.length + ' original images verified; ' + restored + ' restored.');
