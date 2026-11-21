begin;

-- Remove read policies that depend on the flag, regardless of their names.
do $$
declare
  old_policy name;
begin
  for old_policy in
    select distinct p.polname
    from pg_policy as p
    join pg_depend as d on d.classid = 'pg_policy'::regclass and d.objid = p.oid
    join pg_attribute as a on a.attrelid = d.refobjid and a.attnum = d.refobjsubid
    where p.polrelid = 'public.stickylore67_books'::regclass
      and p.polcmd = 'r'
      and d.refclassid = 'pg_class'::regclass
      and a.attrelid = p.polrelid
      and a.attname = 'is_published'
      and not a.attisdropped
  loop
    execute format('drop policy %I on public.stickylore67_books', old_policy);
  end loop;
end
$$;

alter table public.stickylore67_books drop column if exists is_published restrict;

drop policy if exists "Anyone can read bookshelf books" on public.stickylore67_books;
create policy "Anyone can read bookshelf books"
  on public.stickylore67_books for select to anon, authenticated
  using (true);

commit;
