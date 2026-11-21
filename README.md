# React + Vite

## Bookshelf admin setup

1. In the Supabase SQL Editor, run the [bookshelf admin migration](supabase/migrations/20261121000000_bookshelf_admin.sql), followed by the [delete permission migration](supabase/migrations/20261121000001_bookshelf_admin_delete.sql). Existing admin installations only need the second migration.
2. In **Authentication → Users**, create your owner account with a password you keep private, or use an existing email-and-password account from this project. Copy the account's User UID.
3. Run this in the SQL Editor with your own User UID.

   ```sql
   insert into public.stickylore67_admins (user_id)
   values ('YOUR-USER-UID'::uuid)
   on conflict (user_id) do nothing;
   ```

4. Deploy the app and sign in at `/admin`. Use the project's existing Supabase URL and publishable key in the Netlify build environment.
5. After the updated site is deployed, run the [publish flag removal migration](supabase/migrations/20261121000002_remove_book_publish_flag.sql) in Supabase SQL Editor. This step also applies to existing installations. Every saved book, including any existing draft, becomes visible on the public bookshelf.

Use **Add book** or **Edit** on the admin bookshelf to manage book details and set a Featured duration. **Save book** puts the book on the public shelf. **Delete book** permanently removes it after confirmation. For the daily visitor chart, open **Analytics** in the admin header.

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Oxc](https://oxc.rs)
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/)

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the ESLint configuration

If you are developing a production application, we recommend using TypeScript with type-aware lint rules enabled. Check out the [TS template](https://github.com/vitejs/vite/tree/main/packages/create-vite/template-react-ts) for information on how to integrate TypeScript and [`typescript-eslint`](https://typescript-eslint.io) in your project.
