-- ILUMINA STUDIO · SQL revisado v1.1
-- INSTRUCOES: Supabase > SQL Editor > New Query. Cole TODO este arquivo, do inicio ao fim.
-- Nao selecione apenas a linha END ou $function$; pressione Run com o script completo.
-- Se uma tentativa anterior criou algumas tabelas, pode executar o script inteiro novamente.

-- ILUMINA STUDIO · Execute uma vez no SQL Editor do Supabase.
-- Usuários devem estar autenticados. A chave pública ANON é segura SOMENTE com RLS habilitado.

create extension if not exists pgcrypto;

create table if not exists public.products (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  name text not null check (char_length(trim(name)) between 2 and 180),
  sku text not null default '',
  category text not null default 'Outro',
  specifications text not null default '',
  dimensions text not null default '',
  package_contents text not null default '',
  applications text not null default '',
  notes text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.image_jobs (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  product_id uuid not null references public.products(id) on delete cascade,
  image_number integer not null check (image_number between 1 and 5),
  status text not null default 'pending' check (status in ('pending','in_progress','needs_review','approved','changes_requested')),
  storage_path text,
  review_notes text not null default '',
  updated_at timestamptz not null default now(),
  unique(product_id, image_number)
);

create table if not exists public.product_files (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  product_id uuid not null references public.products(id) on delete cascade,
  kind text not null check (kind in ('reference','datasheet')),
  storage_path text not null unique,
  filename text not null,
  content_type text not null,
  byte_size bigint not null default 0 check (byte_size >= 0),
  created_at timestamptz not null default now()
);

create table if not exists public.activity_logs (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  product_id uuid not null references public.products(id) on delete cascade,
  image_number integer check (image_number between 1 and 5),
  action text not null,
  details text not null default '',
  created_at timestamptz not null default now()
);

create index if not exists products_owner_updated_idx on public.products(owner_id, updated_at desc);
create index if not exists jobs_product_idx on public.image_jobs(product_id);
create index if not exists files_product_idx on public.product_files(product_id);
create index if not exists logs_owner_created_idx on public.activity_logs(owner_id, created_at desc);

create or replace function public.touch_updated_at()
returns trigger language plpgsql set search_path = '' as $function$
begin
  new.updated_at := now();
  return new;
end;
$function$;

create or replace function public.create_five_image_jobs()
returns trigger language plpgsql security definer set search_path = '' as $function$
begin
  insert into public.image_jobs(owner_id, product_id, image_number)
  select new.owner_id, new.id, generate_series(1,5);
  return new;
end;
$function$;

drop trigger if exists products_touch_updated on public.products;
create trigger products_touch_updated before update on public.products
for each row execute function public.touch_updated_at();

drop trigger if exists jobs_touch_updated on public.image_jobs;
create trigger jobs_touch_updated before update on public.image_jobs
for each row execute function public.touch_updated_at();

drop trigger if exists products_make_jobs on public.products;
create trigger products_make_jobs after insert on public.products
for each row execute function public.create_five_image_jobs();

-- Permissões: cada usuário acessa somente seus produtos e materiais.
alter table public.products enable row level security;
alter table public.image_jobs enable row level security;
alter table public.product_files enable row level security;
alter table public.activity_logs enable row level security;

-- O script é reexecutável.
drop policy if exists "products_select_own" on public.products;
drop policy if exists "products_insert_own" on public.products;
drop policy if exists "products_update_own" on public.products;
drop policy if exists "products_delete_own" on public.products;
create policy "products_select_own" on public.products for select to authenticated using (owner_id = (select auth.uid()));
create policy "products_insert_own" on public.products for insert to authenticated with check (owner_id = (select auth.uid()));
create policy "products_update_own" on public.products for update to authenticated using (owner_id = (select auth.uid())) with check (owner_id = (select auth.uid()));
create policy "products_delete_own" on public.products for delete to authenticated using (owner_id = (select auth.uid()));

drop policy if exists "jobs_select_own" on public.image_jobs;
drop policy if exists "jobs_insert_own" on public.image_jobs;
drop policy if exists "jobs_update_own" on public.image_jobs;
drop policy if exists "jobs_delete_own" on public.image_jobs;
create policy "jobs_select_own" on public.image_jobs for select to authenticated
  using (owner_id = (select auth.uid()) and exists (select 1 from public.products p where p.id=product_id and p.owner_id=(select auth.uid())));
create policy "jobs_insert_own" on public.image_jobs for insert to authenticated
  with check (owner_id = (select auth.uid()) and exists (select 1 from public.products p where p.id=product_id and p.owner_id=(select auth.uid())));
create policy "jobs_update_own" on public.image_jobs for update to authenticated
  using (owner_id = (select auth.uid()) and exists (select 1 from public.products p where p.id=product_id and p.owner_id=(select auth.uid())))
  with check (owner_id = (select auth.uid()) and exists (select 1 from public.products p where p.id=product_id and p.owner_id=(select auth.uid())));
create policy "jobs_delete_own" on public.image_jobs for delete to authenticated
  using (owner_id = (select auth.uid()));

drop policy if exists "files_select_own" on public.product_files;
drop policy if exists "files_insert_own" on public.product_files;
drop policy if exists "files_delete_own" on public.product_files;
create policy "files_select_own" on public.product_files for select to authenticated
  using (owner_id = (select auth.uid()) and exists (select 1 from public.products p where p.id=product_id and p.owner_id=(select auth.uid())));
create policy "files_insert_own" on public.product_files for insert to authenticated
  with check (
    owner_id = (select auth.uid())
    and split_part(storage_path, '/', 1) = (select auth.uid())::text
    and split_part(storage_path, '/', 2) = product_id::text
    and exists (select 1 from public.products p where p.id=product_id and p.owner_id=(select auth.uid()))
  );
create policy "files_delete_own" on public.product_files for delete to authenticated using (owner_id = (select auth.uid()));

drop policy if exists "logs_select_own" on public.activity_logs;
drop policy if exists "logs_insert_own" on public.activity_logs;
create policy "logs_select_own" on public.activity_logs for select to authenticated
  using (owner_id = (select auth.uid()));
create policy "logs_insert_own" on public.activity_logs for insert to authenticated
  with check (owner_id = (select auth.uid()) and exists (select 1 from public.products p where p.id=product_id and p.owner_id=(select auth.uid())));
-- Logs são somente inseridos e lidos; não podem ser editados pelo cliente.

-- Bucket privado com máximo de 15 MiB por arquivo (PDF/JPEG/PNG/WebP).
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('ilumina-media', 'ilumina-media', false, 15728640, array['image/jpeg','image/png','image/webp','application/pdf'])
on conflict (id) do update set
  public = false,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "illuminamedia_read" on storage.objects;
drop policy if exists "illuminamedia_insert" on storage.objects;
drop policy if exists "illuminamedia_update" on storage.objects;
drop policy if exists "illuminamedia_delete" on storage.objects;
create policy "illuminamedia_read" on storage.objects for select to authenticated
using (bucket_id='ilumina-media'
  and split_part(name, '/', 1) = (select auth.uid())::text
  and exists (select 1 from public.products p where p.id::text=split_part(name, '/', 2) and p.owner_id=(select auth.uid())));
create policy "illuminamedia_insert" on storage.objects for insert to authenticated
with check (bucket_id='ilumina-media'
  and split_part(name, '/', 1) = (select auth.uid())::text
  and exists (select 1 from public.products p where p.id::text=split_part(name, '/', 2) and p.owner_id=(select auth.uid())));
create policy "illuminamedia_update" on storage.objects for update to authenticated
using (bucket_id='ilumina-media'
  and split_part(name, '/', 1) = (select auth.uid())::text
  and exists (select 1 from public.products p where p.id::text=split_part(name, '/', 2) and p.owner_id=(select auth.uid())))
with check (bucket_id='ilumina-media'
  and split_part(name, '/', 1) = (select auth.uid())::text
  and exists (select 1 from public.products p where p.id::text=split_part(name, '/', 2) and p.owner_id=(select auth.uid())));
create policy "illuminamedia_delete" on storage.objects for delete to authenticated
using (bucket_id='ilumina-media'
  and split_part(name, '/', 1) = (select auth.uid())::text
  and exists (select 1 from public.products p where p.id::text=split_part(name, '/', 2) and p.owner_id=(select auth.uid())));

-- Final. A aplicação funciona sem service_role, sem IA por API e sem função privilegiada no navegador.
