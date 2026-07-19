-- ============================================================
-- 005_stage_history — automatic, append-only stage history (D-04/D-06/D-07)
-- ============================================================
-- Every deal's stage timeline is recorded by the database, not the app:
--   * on INSERT of a deal -> stage_history (from = null, to = current_stage)   [D-04]
--   * on UPDATE that changes current_stage -> stage_history (from old, to new) [D-06]
--
-- Doing this in a trigger makes it atomic with the deal write and means the app
-- never writes stage_history directly. We then REVOKE write access so the table
-- is genuinely append-only — there is no update/delete path (D-07). Reads stay
-- allowed (RLS still scopes them to the agency).
--
-- SECURITY DEFINER so the trigger can insert past the revoke/RLS; changed_by is
-- the acting user (auth.uid(), which equals users.id).
-- ============================================================

create or replace function public.record_stage_change()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if tg_op = 'INSERT' then
    insert into public.stage_history (deal_id, from_stage, to_stage, changed_by)
    values (new.id, null, new.current_stage, auth.uid());
  elsif tg_op = 'UPDATE'
        and new.current_stage is distinct from old.current_stage then
    insert into public.stage_history (deal_id, from_stage, to_stage, changed_by)
    values (new.id, old.current_stage, new.current_stage, auth.uid());
  end if;
  return new;
end;
$$;

drop trigger if exists on_deal_stage_change on public.deals;
create trigger on_deal_stage_change
  after insert or update on public.deals
  for each row execute function public.record_stage_change();

-- Append-only: only the SECURITY DEFINER trigger writes stage_history.
-- (003 granted all; here we take back the write privileges for the API roles.)
revoke insert, update, delete on public.stage_history from anon, authenticated;
