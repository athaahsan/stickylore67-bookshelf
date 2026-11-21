begin;

alter table public.stickylore67_books
  add column if not exists bookshelf_visibility boolean not null default true;

alter table public.stickylore67_books enable row level security;

-- Restrict public reads even if the table has a broader read policy.
create policy "Visitors can only read visible bookshelf books"
  on public.stickylore67_books as restrictive for select to anon
  using (bookshelf_visibility);

create policy "Members can read visible books or manage the bookshelf"
  on public.stickylore67_books as restrictive for select to authenticated
  using (bookshelf_visibility or (select exists (
    select 1 from public.stickylore67_admins where user_id = (select auth.uid())
  )));

commit;
