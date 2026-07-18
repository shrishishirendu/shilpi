-- ============================================================
-- SHILPI — Phase 1 schema (Agent mode)
-- PostgreSQL / Supabase · Sydney region
-- Run this in the Supabase SQL Editor.
-- ============================================================
-- Notes for the build session:
--  * Every table carries agency_id for multi-tenancy.
--  * Row Level Security (RLS) is enabled so an agency only
--    ever sees its own rows. The policies use a helper that
--    reads the logged-in user's agency_id.
--  * UUIDs via gen_random_uuid() (pgcrypto, on by default in Supabase).
-- ============================================================

-- ---------- AGENCIES (tenants) ----------
create table agencies (
  id                 uuid primary key default gen_random_uuid(),
  name               text not null,
  licence_number     text,
  address            text,
  phone              text,
  subscription_tier  text not null default 'professional'
                       check (subscription_tier in ('starter','professional','enterprise')),
  created_at         timestamptz not null default now()
);

-- ---------- USERS (agents/staff; mirrors Supabase Auth) ----------
create table users (
  id                    uuid primary key,          -- same id as auth.users
  agency_id             uuid not null references agencies(id) on delete cascade,
  full_name             text not null,
  email                 text not null,
  role                  text not null default 'agent'
                          check (role in ('principal','agent','admin')),
  agent_licence_number  text,
  created_at            timestamptz not null default now()
);

-- Helper: the agency_id of the currently logged-in user.
-- Used by every RLS policy below.
create or replace function current_agency_id()
returns uuid
language sql stable
as $$
  select agency_id from users where id = auth.uid()
$$;

-- ---------- CONTACTS (one row per person) ----------
create table contacts (
  id                 uuid primary key default gen_random_uuid(),
  agency_id          uuid not null references agencies(id) on delete cascade,
  full_name          text not null,
  email              text,
  phone              text,
  address            text,
  notes              text,
  identity_verified  boolean not null default false,
  created_at         timestamptz not null default now()
);

-- ---------- PROPERTIES ----------
create table properties (
  id                uuid primary key default gen_random_uuid(),
  agency_id         uuid not null references agencies(id) on delete cascade,
  address           text not null,
  suburb            text,
  postcode          text,
  state             text not null default 'NSW',
  property_type     text check (property_type in ('house','unit','townhouse','land')),
  bedrooms          int,
  bathrooms         int,
  parking           int,
  land_size_sqm     numeric,
  zoning            text,
  floor_area_ratio  numeric,
  created_at        timestamptz not null default now()
);

-- ---------- DEAL STAGES (reference data, shared) ----------
create table deal_stages (
  stage_number              int primary key,
  name                      text not null,
  category                  text not null,
  requires_compliance_gate  boolean not null default false
);

-- ---------- DEALS (the spine) ----------
create table deals (
  id             uuid primary key default gen_random_uuid(),
  agency_id      uuid not null references agencies(id) on delete cascade,
  property_id    uuid references properties(id) on delete set null,
  owner_user_id  uuid references users(id) on delete set null,
  current_stage  int not null default 1 references deal_stages(stage_number),
  status         text not null default 'active'
                   check (status in ('active','settled','withdrawn','lost')),
  listing_price  numeric,
  sale_price     numeric,
  sale_method    text check (sale_method in ('private_treaty','auction','eoi')),
  mode           text not null default 'agent',  -- DTO hook for later
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);

-- ---------- DEAL_CONTACTS (person <-> deal, with a role) ----------
create table deal_contacts (
  id          uuid primary key default gen_random_uuid(),
  deal_id     uuid not null references deals(id) on delete cascade,
  contact_id  uuid not null references contacts(id) on delete cascade,
  role        text not null
                check (role in ('buyer','vendor','buyer_solicitor','vendor_solicitor')),
  is_primary  boolean not null default true,
  created_at  timestamptz not null default now()
);

-- ---------- STAGE_HISTORY (audit trail) ----------
create table stage_history (
  id          uuid primary key default gen_random_uuid(),
  deal_id     uuid not null references deals(id) on delete cascade,
  from_stage  int,
  to_stage    int not null,
  changed_by  uuid references users(id) on delete set null,
  changed_at  timestamptz not null default now(),
  note        text
);

-- ---------- COMPLIANCE_ITEMS (the safety layer) ----------
create table compliance_items (
  id                   uuid primary key default gen_random_uuid(),
  deal_id              uuid not null references deals(id) on delete cascade,
  type                 text not null
                         check (type in ('cooling_off','finance_clause','agency_agreement','deposit','voi')),
  due_date             date,
  status               text not null default 'pending'
                         check (status in ('pending','cleared','breached','waived')),
  blocks_stage_advance boolean not null default false,
  detail               jsonb,
  created_at           timestamptz not null default now()
);

-- ---------- OFFERS ----------
create table offers (
  id                uuid primary key default gen_random_uuid(),
  deal_id           uuid not null references deals(id) on delete cascade,
  buyer_contact_id  uuid references contacts(id) on delete set null,
  amount            numeric not null,
  status            text not null default 'submitted'
                      check (status in ('submitted','countered','accepted','rejected','withdrawn')),
  is_conditional    boolean not null default false,
  conditions        text,
  settlement_days   int,
  created_at        timestamptz not null default now()
);

-- ---------- TASKS ----------
create table tasks (
  id           uuid primary key default gen_random_uuid(),
  agency_id    uuid not null references agencies(id) on delete cascade,
  deal_id      uuid references deals(id) on delete cascade,
  assigned_to  uuid references users(id) on delete set null,
  title        text not null,
  due_date     date,
  status       text not null default 'open' check (status in ('open','done')),
  created_at   timestamptz not null default now()
);

-- ---------- ACTIVITIES (timeline feed) ----------
create table activities (
  id           uuid primary key default gen_random_uuid(),
  agency_id    uuid not null references agencies(id) on delete cascade,
  deal_id      uuid references deals(id) on delete cascade,
  contact_id   uuid references contacts(id) on delete set null,
  user_id      uuid references users(id) on delete set null,
  type         text not null
                 check (type in ('call','email','note','open_home','inspection','stage_change')),
  summary      text not null,
  occurred_at  timestamptz not null default now()
);

-- ============================================================
-- SEED: the 13 stages
-- ============================================================
insert into deal_stages (stage_number, name, category, requires_compliance_gate) values
  (1,  'Enquiry & qualification',     'lead',       false),
  (2,  'Appraisal & listing agreement','listing',   true),
  (3,  'Marketing campaign',          'listing',    false),
  (4,  'Open homes & inspections',    'listing',    false),
  (5,  'Buyer follow-up',             'lead',       false),
  (6,  'Offer management',            'offer',      false),
  (7,  'Contract exchange',           'exchange',   true),
  (8,  'Cooling-off period',          'exchange',   true),
  (9,  'Finance approval',            'settlement', true),
  (10, 'Pre-settlement inspection',   'settlement', false),
  (11, 'Settlement & handover',       'settlement', true),
  (12, 'Post-sale follow-up',         'post_sale',  false),
  (13, 'Referral & repeat business',  'post_sale',  false);

-- ============================================================
-- ROW LEVEL SECURITY
-- Enable RLS on every tenant table, then allow access only to
-- rows belonging to the logged-in user's agency.
-- ============================================================
alter table agencies         enable row level security;
alter table users            enable row level security;
alter table contacts         enable row level security;
alter table properties       enable row level security;
alter table deals            enable row level security;
alter table deal_contacts    enable row level security;
alter table stage_history    enable row level security;
alter table compliance_items enable row level security;
alter table offers           enable row level security;
alter table tasks            enable row level security;
alter table activities       enable row level security;
-- deal_stages is shared reference data: readable by all authed users, no agency scoping.
alter table deal_stages      enable row level security;

-- Agencies: a user sees only their own agency row.
create policy agency_isolation on agencies
  for all using (id = current_agency_id());

-- Users: see only colleagues in the same agency.
create policy users_isolation on users
  for all using (agency_id = current_agency_id());

-- Straightforward agency_id scoping for the rest.
create policy contacts_isolation   on contacts   for all using (agency_id = current_agency_id());
create policy properties_isolation on properties for all using (agency_id = current_agency_id());
create policy deals_isolation      on deals      for all using (agency_id = current_agency_id());
create policy tasks_isolation      on tasks      for all using (agency_id = current_agency_id());
create policy activities_isolation on activities for all using (agency_id = current_agency_id());

-- Child tables scope via their parent deal's agency.
create policy deal_contacts_isolation on deal_contacts
  for all using (deal_id in (select id from deals where agency_id = current_agency_id()));
create policy stage_history_isolation on stage_history
  for all using (deal_id in (select id from deals where agency_id = current_agency_id()));
create policy compliance_isolation on compliance_items
  for all using (deal_id in (select id from deals where agency_id = current_agency_id()));
create policy offers_isolation on offers
  for all using (deal_id in (select id from deals where agency_id = current_agency_id()));

-- Reference data: any authenticated user may read the stage list.
create policy stages_readable on deal_stages
  for select using (auth.role() = 'authenticated');

-- ============================================================
-- Helpful indexes for the common queries the UI will run.
-- ============================================================
create index idx_deals_agency_stage   on deals(agency_id, current_stage);
create index idx_deal_contacts_deal    on deal_contacts(deal_id);
create index idx_deal_contacts_contact on deal_contacts(contact_id);
create index idx_compliance_deal       on compliance_items(deal_id, status);
create index idx_activities_agency     on activities(agency_id, occurred_at desc);
create index idx_tasks_assigned        on tasks(assigned_to, status, due_date);
