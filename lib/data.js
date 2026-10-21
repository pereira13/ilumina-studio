import { BUCKET } from './constants';
import { supabase } from './supabase';

export async function loadWorkspace(userId) {
  const [p, j, f, l] = await Promise.all([
    supabase.from('products').select('*').order('updated_at', { ascending: false }).limit(150),
    supabase.from('image_jobs').select('*').order('image_number', { ascending: true }).limit(750),
    supabase.from('product_files').select('*').order('created_at', { ascending: false }).limit(800),
    supabase.from('activity_logs').select('*').order('created_at', { ascending: false }).limit(150),
  ]);
  for (const res of [p,j,f,l]) if (res.error) throw res.error;
  const products = (p.data || []).filter((item) => item.owner_id === userId).map((item) => ({
    ...item,
    jobs: (j.data || []).filter((job) => job.product_id === item.id),
    files: (f.data || []).filter((file) => file.product_id === item.id),
  }));
  const allPaths = new Set();
  for (const product of products) {
    product.files.forEach((file) => allPaths.add(file.storage_path));
    product.jobs.forEach((job) => job.storage_path && allPaths.add(job.storage_path));
  }
  const signed = {};
  await Promise.all(Array.from(allPaths).map(async (path) => {
    const { data, error } = await supabase.storage.from(BUCKET).createSignedUrl(path, 3600);
    if (!error && data?.signedUrl) signed[path] = data.signedUrl;
  }));
  return { products, logs: l.data || [], signed };
}

export async function logActivity(userId, productId, imageNumber, action, details = '') {
  const { error } = await supabase.from('activity_logs').insert({
    owner_id: userId, product_id: productId, image_number: imageNumber || null, action, details,
  });
  if (error) console.warn('Registro de atividade não gravado:', error.message);
}

export function newStoragePath(userId, productId, folder, file) {
  const accepted = {
    'image/jpeg': 'jpg',
    'image/png': 'png',
    'image/webp': 'webp',
    'application/pdf': 'pdf',
  };
  const ext = accepted[file.type];
  if (!ext) throw new Error('Formato não permitido. Use JPG, PNG, WebP ou PDF.');
  if (file.size > 15 * 1024 * 1024) throw new Error('Cada arquivo deve ter até 15 MB.');
  return `${userId}/${productId}/${folder}/${crypto.randomUUID()}.${ext}`;
}

export async function saveSourceFiles({ userId, productId, kind, inputFiles }) {
  const saved = [];
  for (const file of Array.from(inputFiles)) {
    if (kind === 'reference' && !file.type.startsWith('image/')) throw new Error('Fotos de referência devem ser JPG, PNG ou WebP.');
    const path = newStoragePath(userId, productId, kind === 'reference' ? 'references' : 'datasheets', file);
    const upload = await supabase.storage.from(BUCKET).upload(path, file, { contentType: file.type, upsert: false });
    if (upload.error) throw upload.error;
    const result = await supabase.from('product_files').insert({
      owner_id: userId, product_id: productId, kind, filename: file.name,
      storage_path: path, content_type: file.type, byte_size: file.size,
    });
    if (result.error) {
      await supabase.storage.from(BUCKET).remove([path]);
      throw result.error;
    }
    saved.push(file.name);
  }
  return saved;
}

export async function saveResultImage({ userId, product, job, file }) {
  if (!file.type.startsWith('image/')) throw new Error('Envie uma imagem JPG, PNG ou WebP.');
  const path = newStoragePath(userId, product.id, `outputs/${String(job.image_number).padStart(2,'0')}`, file);
  const upload = await supabase.storage.from(BUCKET).upload(path, file, { contentType: file.type, upsert: false });
  if (upload.error) throw upload.error;
  const update = await supabase.from('image_jobs')
    .update({ storage_path: path, status: 'needs_review', review_notes: '' })
    .eq('id', job.id);
  if (update.error) {
    await supabase.storage.from(BUCKET).remove([path]);
    throw update.error;
  }
  if (job.storage_path && job.storage_path !== path) {
    await supabase.storage.from(BUCKET).remove([job.storage_path]);
  }
  return path;
}

export async function downloadPrivateFile(path, filename) {
  const { data, error } = await supabase.storage.from(BUCKET).download(path);
  if (error) throw error;
  const url = URL.createObjectURL(data);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1200);
}
