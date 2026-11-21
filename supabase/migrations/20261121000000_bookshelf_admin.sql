begin;

alter table public.stickylore67_books enable row level security;
alter table public.stickylore67_books
  add column if not exists featured_until timestamptz;

create table if not exists public.stickylore67_admins (
  user_id uuid primary key references auth.users (id) on delete cascade
);

alter table public.stickylore67_admins enable row level security;
revoke all on public.stickylore67_admins from public, anon, authenticated;
grant select on public.stickylore67_admins to authenticated;

drop policy if exists "Admin can read own membership" on public.stickylore67_admins;
create policy "Admin can read own membership"
  on public.stickylore67_admins for select to authenticated
  using (user_id = (select auth.uid()));

revoke insert, update, delete, truncate on public.stickylore67_books from public, anon, authenticated;
grant insert, update on public.stickylore67_books to authenticated;

-- Restrict every existing or future INSERT and UPDATE policy to allowlisted accounts.
drop policy if exists "Only bookshelf admins can insert" on public.stickylore67_books;
create policy "Only bookshelf admins can insert"
  on public.stickylore67_books as restrictive for insert to authenticated
  with check ((select exists (
    select 1 from public.stickylore67_admins where user_id = (select auth.uid())
  )));

drop policy if exists "Only bookshelf admins can update" on public.stickylore67_books;
create policy "Only bookshelf admins can update"
  on public.stickylore67_books as restrictive for update to authenticated
  using ((select exists (
    select 1 from public.stickylore67_admins where user_id = (select auth.uid())
  )))
  with check ((select exists (
    select 1 from public.stickylore67_admins where user_id = (select auth.uid())
  )));

drop policy if exists "Bookshelf admins can manage books" on public.stickylore67_books;
create policy "Bookshelf admins can manage books"
  on public.stickylore67_books for all to authenticated
  using ((select exists (
    select 1 from public.stickylore67_admins where user_id = (select auth.uid())
  )))
  with check ((select exists (
    select 1 from public.stickylore67_admins where user_id = (select auth.uid())
  )));

commit;
