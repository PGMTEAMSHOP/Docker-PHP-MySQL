# Local development: Next.js + PHP + MySQL

The browser uses http://localhost:3000. Next.js proxies PHP requests to
http://127.0.0.1:8000/osx.in.th/api/. PHP connects to `mysql:3306/osxhub_db`
over the Docker network. Native Next.js API routes take precedence over the proxy.

## Start the services

From `C:\Users\jadsa\OneDrive\Documents\Docker-MySQL`:

```powershell
docker compose up -d
```

From `src\osx.in.th`:

```powershell
# Copy only if .env.local does not already exist.
Copy-Item .env.example .env.local
npm install
npm run dev
```

Keep `.env.local` private. Restart Next.js after changing its environment settings.
If port 3000 is already serving this project, use the existing development server.

| Service | URL |
| --- | --- |
| Frontend | http://localhost:3000 |
| PHP API example | http://localhost:8000/osx.in.th/api/scripts.php?action=list |
| API through Frontend | http://localhost:3000/api/scripts.php?action=list |
| phpMyAdmin | http://localhost:8080 |
| MySQL from Windows | 127.0.0.1:3306 |

## Configuration

Next.js reads the server-only `PHP_BACKEND_URL`. The local value is
`http://127.0.0.1:8000/osx.in.th`. Without this variable, the existing production
backend URL defaults to `http://127.0.0.1`.

The PHP service in the parent `docker-compose.yml` supplies `DB_HOST`, `DB_PORT`,
`DB_NAME`, `DB_USER`, `DB_PASS`, and `DB_AUTO_MIGRATE`. It uses the existing local
Docker credentials. MySQL accounts and privileges are not changed by this setup.
Changing Compose environment settings requires recreating the PHP service:

```powershell
docker compose up -d --no-deps php-apache
```

`DB_AUTO_MIGRATE=false` disables automatic schema changes and data repairs in PHP.
The existing database must already have the required tables and columns. The
default remains enabled when the variable is absent, for compatibility with the
existing deployment. Back up the database before explicitly enabling migrations.

The MySQL initialization setting `MYSQL_DATABASE` in Compose applies only to an
empty volume. This project uses the existing `osxhub_db` in `mysql_data`.
Use `docker compose stop` to stop services while retaining database data.

## Checks and troubleshooting

- A database error: confirm MySQL is running and PHP's DB variables match it.
- A PHP 404: confirm the URL includes `/osx.in.th/api/` and `./src` is mounted
  at `/var/www/html`.
- A frontend API 404: confirm `.env.local`, restart Next.js, and compare the two
  API example URLs above.
- Frontend requests remain relative `/api/...`; session cookies pass through the
  Next.js proxy, including login, logout and administrator authorization.
- Images and downloads are served from Next.js `public/`. PHP uploads use the
  same bind-mounted `public/uploads/slips` directory.
- Discord OAuth and Turnstile still require their provider's configured domains.
  Stripe/Crypto remain controlled by their existing flags and credentials, and
  their webhooks do not yet credit the database. This setup does not enable real
  payment processing.
