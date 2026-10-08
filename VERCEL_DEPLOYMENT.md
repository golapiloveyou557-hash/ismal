# Vercel deployment handoff

This archive contains the complete source project. It includes the React/Vite frontend, Express/tRPC backend, Drizzle schema and migrations, authentication integration, daily post editor, deposit review flow, member portal and supplied image assets.

## Daily predictions

An approved administrator opens `/admin/posts` or selects **Daily posts** from the Operations sidebar. The editor supports game selection, post date, title, daily content, optional prediction image URL, free/VIP visibility, draft/published status, edit, unpublish and delete. Server-side `adminProcedure` protection remains enabled.

## Vercel notes

1. Import this repository/project into Vercel.
2. Configure the production environment variables required by the Manus OAuth, database and storage integrations. Never upload `.env` or secrets to the repository.
3. Keep the MySQL/TiDB database reachable from the deployment and run the Drizzle migrations before using `/admin/posts`.
4. Configure the project build command from `package.json` and adapt the Express/tRPC server entry to Vercel Functions if your Vercel setup does not use a long-running Node server.
5. Set the production URL and OAuth callback values in the connected authentication provider.

The project deliberately does not bypass admin roles or turn incomplete provider feeds into fake live results. Those require real provider credentials and verified integrations.
