begin;

create table public.stickylore67_visits (
  visit_date date not null default ((statement_timestamp() at time zone 'Asia/Jakarta')::date),
  browser_id uuid not null,
  primary key (visit_date, browser_id)
);

alter table public.stickylore67_visits enable row level security;
revoke all on public.stickylore67_visits from public, anon, authenticated;
grant insert (browser_id) on public.stickylore67_visits to anon;
grant select (visit_date) on public.stickylore67_visits to authenticated;

create policy "Visitors can record a browser visit"
  on public.stickylore67_visits for insert to anon
  with check (true);

create policy "Bookshelf admins can read visit dates"
  on public.stickylore67_visits for select to authenticated
  using ((select exists (
    select 1 from public.stickylore67_admins where user_id = (select auth.uid())
  )));

create function public.stickylore67_record_visit(browser_id uuid)
returns void
language sql
security invoker
set search_path = ''
as $$
  insert into public.stickylore67_visits (browser_id) values ($1)
  on conflict do nothing;
$$;

revoke all on function public.stickylore67_record_visit(uuid) from public, anon, authenticated;
grant execute on function public.stickylore67_record_visit(uuid) to anon;

create function public.stickylore67_daily_visitors()
returns table (visit_date date, unique_browsers bigint)
language sql
stable
security invoker
set search_path = ''
as $$
  with calendar as (
    select (statement_timestamp() at time zone 'Asia/Jakarta')::date as today
  ), daily_counts as (
    select visits.visit_date, count(*) as browsers
    from public.stickylore67_visits as visits
    cross join calendar
    where visits.visit_date between calendar.today - 29 and calendar.today
    group by visits.visit_date
  )
  select calendar.today - day_offset.days_back, coalesce(daily_counts.browsers, 0)
  from calendar
  cross join generate_series(0, 29) as day_offset(days_back)
  left join daily_counts on daily_counts.visit_date = calendar.today - day_offset.days_back
  where exists (select 1 from public.stickylore67_admins where user_id = (select auth.uid()))
  order by 1;
$$;

revoke all on function public.stickylore67_daily_visitors() from public, anon, authenticated;
grant execute on function public.stickylore67_daily_visitors() to authenticated;

commit;
