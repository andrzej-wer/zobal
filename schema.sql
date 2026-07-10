create extension if not exists pgcrypto;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null default '',
  role text not null default 'sales' check (role in ('admin','sales','warehouse')),
  active boolean not null default true,
  created_at timestamptz not null default now()
);
create table if not exists public.customers (
  id uuid primary key default gen_random_uuid(), name text not null, company_name text,
  email text, phone text, nip text, address text, city text, zip text,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table if not exists public.quote_requests (
  id uuid primary key default gen_random_uuid(), request_number text unique,
  customer_id uuid not null references public.customers(id),
  status text not null default 'new' check (status in ('new','pricing','ready','sent','revision','accepted','rejected','ordered','completed')),
  source text not null default 'web_form', global_notes text, internal_notes text,
  assigned_to uuid references public.profiles(id), created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table if not exists public.quote_items (
  id uuid primary key default gen_random_uuid(), request_id uuid not null references public.quote_requests(id) on delete cascade,
  position integer not null, item_name text, quantity integer not null default 1,
  height_mm numeric, width_mm numeric, profile_code text, finish text, filling text,
  hinges_type text, hinge_side text, hinge_brand text, hinge_quantity integer, hinge_positions jsonb,
  stiffener_type text, stiffener_quantity integer, stiffener_positions jsonb, customer_notes text,
  sale_unit_net numeric(12,2), sale_discount_percent numeric(5,2) default 0,
  created_at timestamptz not null default now()
);
create table if not exists public.zobal_calculations (
  id uuid primary key default gen_random_uuid(), request_id uuid not null references public.quote_requests(id) on delete cascade,
  zobal_number text not null unique, document_path text, purchase_net numeric(12,2), purchase_gross numeric(12,2), calculation_date date,
  status text not null default 'calculation' check (status in ('calculation','accepted_by_customer','ordered_in_zobal','in_production','delivered','cancelled')),
  description text, internal_notes text, created_by uuid references public.profiles(id), created_at timestamptz not null default now()
);
create table if not exists public.client_quotes (
  id uuid primary key default gen_random_uuid(), request_id uuid not null references public.quote_requests(id) on delete cascade,
  quote_number text not null, version integer not null default 1, status text not null default 'draft', valid_until date,
  delivery_time text, payment_terms text, delivery_net numeric(12,2) default 0, discount_net numeric(12,2) default 0,
  vat_rate numeric(5,2) default 23, net_total numeric(12,2) default 0, vat_total numeric(12,2) default 0,
  gross_total numeric(12,2) default 0, client_pdf_path text, created_by uuid references public.profiles(id), created_at timestamptz not null default now()
);

create or replace view public.quote_requests_view as
select qr.id, qr.request_number, qr.status, qr.created_at, c.name customer_name, c.company_name,
  coalesce(string_agg(distinct z.zobal_number, ', '),'') zobal_numbers,
  max(cq.gross_total) gross_total
from public.quote_requests qr join public.customers c on c.id=qr.customer_id
left join public.zobal_calculations z on z.request_id=qr.id
left join public.client_quotes cq on cq.request_id=qr.id
group by qr.id,c.name,c.company_name;

alter table public.profiles enable row level security;
alter table public.customers enable row level security;
alter table public.quote_requests enable row level security;
alter table public.quote_items enable row level security;
alter table public.zobal_calculations enable row level security;
alter table public.client_quotes enable row level security;

create or replace function public.is_active_staff() returns boolean language sql stable security definer set search_path=public as $$
  select exists(select 1 from public.profiles p where p.id=auth.uid() and p.active=true)
$$;

do $$ declare t text; begin
  foreach t in array array['profiles','customers','quote_requests','quote_items','zobal_calculations','client_quotes'] loop
    execute format('drop policy if exists "staff_all_%s" on public.%I',t,t);
    execute format('create policy "staff_all_%s" on public.%I for all to authenticated using (public.is_active_staff()) with check (public.is_active_staff())',t,t);
  end loop;
end $$;

insert into storage.buckets (id,name,public) values ('zobal-internal','zobal-internal',false) on conflict (id) do nothing;
insert into storage.buckets (id,name,public) values ('client-documents','client-documents',false) on conflict (id) do nothing;

drop policy if exists "staff zobal files" on storage.objects;
create policy "staff zobal files" on storage.objects for all to authenticated
using (bucket_id='zobal-internal' and public.is_active_staff())
with check (bucket_id='zobal-internal' and public.is_active_staff());

drop policy if exists "staff client files" on storage.objects;
create policy "staff client files" on storage.objects for all to authenticated
using (bucket_id='client-documents' and public.is_active_staff())
with check (bucket_id='client-documents' and public.is_active_staff());

-- Po utworzeniu użytkownika w Authentication > Users dodaj go tutaj:
-- insert into public.profiles(id,full_name,role) values ('UUID_UZYTKOWNIKA','Imię Nazwisko','admin');

-- Dane testowe opcjonalne:
-- insert into public.customers(name,company_name,email,phone) values ('Jan Kowalski','Meble Kowalski','jan@example.pl','600000000') returning id;
