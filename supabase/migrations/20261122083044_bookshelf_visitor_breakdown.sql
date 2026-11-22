begin;

alter table public.stickylore67_visits
  add column country_code text check (country_code ~ '^[A-Z]{2}$'),
  add column traffic_source text check (traffic_source in (
    'instagram', 'youtube', 'tiktok', 'facebook', 'reddit', 'google', 'direct', 'other'
  ));

grant insert (country_code, traffic_source) on public.stickylore67_visits to anon;
grant select (country_code, traffic_source) on public.stickylore67_visits to authenticated;

-- The original one-argument function keeps older website deploys recording visits.
create function public.stickylore67_record_visit(browser_id uuid, country_code text, traffic_source text)
returns void
language sql
security invoker
set search_path = ''
as $$
  insert into public.stickylore67_visits (browser_id, country_code, traffic_source)
  values ($1, $2, $3)
  on conflict do nothing;
$$;

revoke all on function public.stickylore67_record_visit(uuid, text, text) from public, anon, authenticated;
grant execute on function public.stickylore67_record_visit(uuid, text, text) to anon;

create function public.stickylore67_visitor_breakdown()
returns table (dimension text, bucket text, visits bigint)
language sql
stable
security invoker
set search_path = ''
as $$
  with calendar as (
    select (statement_timestamp() at time zone 'Asia/Jakarta')::date as today
  ), recent as materialized (
    select visit.country_code, visit.traffic_source
    from public.stickylore67_visits as visit
    cross join calendar
    where visit.visit_date between calendar.today - 29 and calendar.today
      and exists (select 1 from public.stickylore67_admins where user_id = (select auth.uid()))
  )
  select 'country'::text, country_code, count(*)
  from recent
  group by country_code
  union all
  select 'source'::text, traffic_source, count(*)
  from recent
  group by traffic_source
  order by 1, 3 desc, 2;
$$;

revoke all on function public.stickylore67_visitor_breakdown() from public, anon, authenticated;
grant execute on function public.stickylore67_visitor_breakdown() to authenticated;

commit;
