begin;

create table if not exists public.stickylore67_series (
  series_key text primary key check (btrim(series_key) <> ''),
  total_books integer check (total_books > 0)
);

alter table public.stickylore67_series enable row level security;
revoke all on public.stickylore67_series from public, anon, authenticated;
grant select on public.stickylore67_series to anon, authenticated;
grant insert, update on public.stickylore67_series to authenticated;

drop policy if exists "Anyone can read series totals" on public.stickylore67_series;
create policy "Anyone can read series totals"
  on public.stickylore67_series for select to anon, authenticated
  using (true);

drop policy if exists "Bookshelf admins can manage series totals" on public.stickylore67_series;
create policy "Bookshelf admins can manage series totals"
  on public.stickylore67_series for all to authenticated
  using ((select exists (
    select 1 from public.stickylore67_admins where user_id = (select auth.uid())
  )))
  with check ((select exists (
    select 1 from public.stickylore67_admins where user_id = (select auth.uid())
  )));

commit;
