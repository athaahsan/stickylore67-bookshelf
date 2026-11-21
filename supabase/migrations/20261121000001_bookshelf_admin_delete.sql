begin;

-- The existing admin management policy grants allowlisted users access to their catalog.
-- Keep DELETE owner-only even if other permissive policies are added later.
revoke delete on public.stickylore67_books from public, anon;
grant delete on public.stickylore67_books to authenticated;

drop policy if exists "Only bookshelf admins can delete" on public.stickylore67_books;
create policy "Only bookshelf admins can delete"
  on public.stickylore67_books as restrictive for delete to authenticated
  using ((select exists (
    select 1 from public.stickylore67_admins where user_id = (select auth.uid())
  )));

commit;
