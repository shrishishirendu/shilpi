-- ============================================================
-- Sample test data — MANUAL seed (run in the Supabase SQL editor).
-- ============================================================
-- NOT named seed.sql on purpose: the CLI's seed.sql auto-runs on `db reset`
-- against a fresh DB with no agencies/users, which can't work for agency-scoped
-- data. Run THIS by hand, once, against a project that already has an agency.
--
-- It inserts 5 contacts, 4 properties, 3 deals (with linked contacts + roles),
-- and 2 offers — all scoped to ONE agency. Change the agency name below if
-- yours differs. Re-running adds another copy, so run it once.
-- ============================================================

do $$
declare
  v_agency uuid;
  v_owner  uuid;
  p1 uuid; p2 uuid; p3 uuid;
  c1 uuid; c2 uuid; c3 uuid; c4 uuid; c5 uuid;
  d1 uuid; d2 uuid; d3 uuid;
begin
  -- >>> change 'Sk Agency' if your agency is named differently <<<
  select id into v_agency
  from public.agencies where name = 'Sk Agency'
  order by created_at limit 1;

  if v_agency is null then
    raise exception 'No agency named "Sk Agency" found — edit the name in this script.';
  end if;

  select id into v_owner
  from public.users where agency_id = v_agency
  order by created_at limit 1;

  -- ---------- Contacts ----------
  insert into public.contacts (agency_id, full_name, email, phone)
  values (v_agency, 'Sarah Thompson', 'sarah.thompson@example.com', '0412 345 678')
  returning id into c1;
  insert into public.contacts (agency_id, full_name, email, phone)
  values (v_agency, 'James Chen', 'james.chen@example.com', '0423 456 789')
  returning id into c2;
  insert into public.contacts (agency_id, full_name, email, phone)
  values (v_agency, 'Priya Nair', 'priya.nair@example.com', '0434 567 890')
  returning id into c3;
  insert into public.contacts (agency_id, full_name, email, phone)
  values (v_agency, 'Michael O''Brien', 'michael.obrien@example.com', '0445 678 901')
  returning id into c4;
  insert into public.contacts (agency_id, full_name, email, phone)
  values (v_agency, 'Emma Wilson', 'emma.wilson@example.com', '0456 789 012')
  returning id into c5;

  -- ---------- Properties ----------
  insert into public.properties
    (agency_id, address, suburb, postcode, property_type, bedrooms, bathrooms, parking, land_size_sqm, zoning)
  values (v_agency, '12 Harbour View Rd', 'Mosman', '2088', 'house', 4, 2, 2, 650, 'R2')
  returning id into p1;
  insert into public.properties
    (agency_id, address, suburb, postcode, property_type, bedrooms, bathrooms, parking, land_size_sqm, zoning)
  values (v_agency, '8/45 Bondi Rd', 'Bondi', '2026', 'unit', 2, 1, 1, null, 'R3')
  returning id into p2;
  insert into public.properties
    (agency_id, address, suburb, postcode, property_type, bedrooms, bathrooms, parking, land_size_sqm, zoning)
  values (v_agency, '27 Wattle St', 'Newtown', '2042', 'townhouse', 3, 2, 1, 180, 'R2')
  returning id into p3;
  insert into public.properties
    (agency_id, address, suburb, postcode, property_type, bedrooms, bathrooms, parking, land_size_sqm, zoning)
  values (v_agency, 'Lot 5 Ridge Rd', 'Kellyville', '2155', 'land', null, null, null, 720, 'R2');

  -- ---------- Deals (the 005 trigger records stage_history automatically) ----------
  insert into public.deals (agency_id, owner_user_id, property_id, current_stage, listing_price)
  values (v_agency, v_owner, p1, 4, 2650000) returning id into d1;   -- Open homes
  insert into public.deals (agency_id, owner_user_id, property_id, current_stage, listing_price)
  values (v_agency, v_owner, p2, 6, 1400000) returning id into d2;   -- Offer management
  insert into public.deals (agency_id, owner_user_id, property_id, current_stage, listing_price)
  values (v_agency, v_owner, p3, 2, 1850000) returning id into d3;   -- Appraisal

  -- ---------- Link contacts with roles (note Sarah is vendor on d1, buyer on d2 — D2) ----------
  insert into public.deal_contacts (deal_id, contact_id, role, is_primary) values
    (d1, c1, 'vendor', true),
    (d1, c2, 'buyer',  false),
    (d2, c3, 'vendor', true),
    (d2, c1, 'buyer',  false),
    (d3, c4, 'vendor', true);

  -- ---------- Offers on the stage-6 deal ----------
  insert into public.offers (deal_id, buyer_contact_id, amount, status, is_conditional, conditions, settlement_days) values
    (d2, c1, 1450000, 'submitted', true,  'Subject to finance approval', 42),
    (d2, c5, 1420000, 'rejected',  false, null, 30);

  raise notice 'Seeded sample data for agency %', v_agency;
end $$;

-- Verify:
-- select count(*) from public.contacts;
-- select count(*) from public.properties;
-- select count(*) from public.deals;
