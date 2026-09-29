# Deployment — VPS + subdomains + CI/CD

How the four apps end up live on your own VPS, each on its own subdomain, with
`git push` to `main` deploying automatically. Two phases: a **one-time VPS
setup** you do by hand once, and **CI/CD** (already wired in
`.github/workflows/deploy.yml`) that takes over after that.

## 1. Target layout

| Subdomain | Service | Container |
|---|---|---|
| `www.wenotifyafrica.com` (+ `www`) | Website | `website` |
| `console.wenotifyafrica.com` | Console | `console` |
| `backoffice.wenotifyafrica.com` | Admin | `admin` |
| `api.wenotifyafrica.com` | Core API | `core-api` |

A Caddy reverse proxy (`infra/proxy/Caddyfile`) routes each domain to its
container and gets free HTTPS certificates automatically (Let's Encrypt) —
nothing to configure for TLS beyond pointing DNS at the VPS.

## 2. DNS — add these records with your domain's DNS provider

Wherever your domain is registered (or wherever you've delegated its
nameservers — e.g. Cloudflare), add four **A records**, all pointing at your
VPS's public IPv4 address:

| Type | Host | Value |
|---|---|---|
| A | `www` | `<VPS_IP>` |
| A | `console` | `<VPS_IP>` |
| A | `backoffice` | `<VPS_IP>` |
| A | `api` | `<VPS_IP>` |

If your DNS host is Cloudflare: keep the orange "proxy" cloud **off** (grey,
DNS-only) until everything works — Cloudflare's proxy can interfere with
Caddy's certificate issuance on first setup. You can turn it on afterwards.

DNS propagation can take a few minutes to a few hours. You can check with
`dig +short console.wenotifyafrica.com` — once it returns your VPS IP, it's live.

## 3. Find your VPS's IP and enable SSH

You said you access the VPS through your hosting provider's panel rather than
SSH directly so far. In virtually every VPS panel (Hostinger, Contabo, OVH,
DigitalOcean, Vultr...) there is a server detail page that shows:

- the **public IPv4 address**
- a **root password** (or the option to upload/generate an SSH key)
- sometimes a **browser-based console** ("VNC console", "recovery console")
  you can use even before SSH works

SSH (port 22) is enabled by default on essentially every VPS image. If you
tell me the provider name and what that server detail page shows, I can give
exact next steps — otherwise, grab the IP and root password/key from the
panel and continue below.

From your own machine:

```bash
ssh root@<VPS_IP>
```

If that connects (accept the host key prompt), you're in.

## 4. One-time VPS setup

Run these once, over SSH, as root (or a sudo user).

### 4.1 Install Docker

```bash
curl -fsSL https://get.docker.com | sh
```

Verify:

```bash
docker --version
docker compose version
```

### 4.2 Open the firewall

```bash
ufw allow 22/tcp
ufw allow 80/tcp
ufw allow 443/tcp
ufw enable
```

(Skip if your provider firewalls at the network level instead — check your
panel's "Firewall"/"Security groups" section either way; port 80/443 must be
reachable for Let's Encrypt to issue certificates.)

### 4.3 Create a non-root deploy user (recommended)

Running CI/CD as root works but a scoped user is safer:

```bash
adduser --disabled-password --gecos "" deploy
usermod -aG docker deploy
mkdir -p /home/deploy/.ssh
```

### 4.4 Generate a dedicated SSH key for GitHub Actions

**On your own laptop**, not the VPS:

```bash
ssh-keygen -t ed25519 -C "github-actions-deploy" -f ./notifyafrica_deploy_key -N ""
```

This creates `notifyafrica_deploy_key` (private) and
`notifyafrica_deploy_key.pub` (public). Copy the **public** key onto the VPS:

```bash
ssh root@<VPS_IP> "mkdir -p /home/deploy/.ssh && echo '<paste .pub file contents>' >> /home/deploy/.ssh/authorized_keys && chown -R deploy:deploy /home/deploy/.ssh && chmod 700 /home/deploy/.ssh && chmod 600 /home/deploy/.ssh/authorized_keys"
```

Test it: `ssh -i ./notifyafrica_deploy_key deploy@<VPS_IP>` should log in with
no password.

### 4.5 Create the deploy directory and production `.env`

```bash
mkdir -p /opt/notifyafrica
chown deploy:deploy /opt/notifyafrica
```

As the `deploy` user, create `/opt/notifyafrica/.env` (this file **never**
goes through git — it's created once, by hand, on the server):

```bash
cat > /opt/notifyafrica/.env <<'EOF'
PUBLIC_SITE_URL=https://www.wenotifyafrica.com
CONSOLE_URL=https://console.wenotifyafrica.com
ADMIN_URL=https://backoffice.wenotifyafrica.com
CORE_API_URL=https://api.wenotifyafrica.com
DOCS_URL=https://www.wenotifyafrica.com/docs
STATUS_URL=https://www.wenotifyafrica.com/status

PUBLIC_SITE_DOMAIN=www.wenotifyafrica.com
CONSOLE_DOMAIN=console.wenotifyafrica.com
ADMIN_DOMAIN=backoffice.wenotifyafrica.com
API_DOMAIN=api.wenotifyafrica.com
ACME_EMAIL=easi.shop.tg@gmail.com

POSTGRES_USER=notifyafrica
POSTGRES_PASSWORD=CHANGE_ME_STRONG_RANDOM
POSTGRES_DB=notifyafrica
DATABASE_URL=postgresql://notifyafrica:CHANGE_ME_STRONG_RANDOM@postgres:5432/notifyafrica?schema=public

REDIS_URL=redis://redis:6379

AUTH_SECRET=CHANGE_ME_LONG_RANDOM_VALUE
AUTH_URL=https://console.wenotifyafrica.com

NOTIFYAFRICA_ENV=production
EOF
```

Generate strong values instead of the placeholders, e.g.:

```bash
openssl rand -hex 32   # use one output for POSTGRES_PASSWORD, another for AUTH_SECRET
```

(Note `DATABASE_URL`/`REDIS_URL` use the Docker Compose **service names**
`postgres`/`redis` as hostnames, not `localhost` — that's how containers on
the same compose network reach each other.)

## 5. GitHub repo secrets (for CI/CD)

In the GitHub repo → **Settings → Secrets and variables → Actions**, add:

| Secret | Value |
|---|---|
| `VPS_HOST` | your VPS's IP or hostname |
| `VPS_USER` | `deploy` (or `root` if you skipped 4.3) |
| `VPS_SSH_KEY` | contents of the **private** key file (`notifyafrica_deploy_key`) from step 4.4 |
| `VPS_SSH_PORT` | only if SSH isn't on port 22 |

`GITHUB_TOKEN` (used to push images to GHCR) is automatic — nothing to add.

## 6. Make the GHCR images pullable from the VPS

The workflow pushes images to `ghcr.io/wenotifyafrica/notifyafrica-*`. The
simplest option: after the first successful build, go to the repo's
**Packages** tab on GitHub, open each `notifyafrica-*` package →
**Package settings** → change visibility to **Public**. Then `docker compose
pull` on the VPS needs no authentication at all.

(If you'd rather keep them private: create a GitHub PAT with `read:packages`,
then on the VPS run `docker login ghcr.io -u <github-username> -p <pat>`
once — the credential persists in `/home/deploy/.docker/config.json`.)

## 7. First deploy

Push to `main` (or re-run this session's earlier commit by pushing an empty
commit, or use **Actions → Build and deploy → Run workflow** in GitHub for a
manual trigger). The workflow:

1. Builds all 5 images and pushes them to GHCR.
2. Copies `docker-compose.prod.yml` and `Caddyfile` to `/opt/notifyafrica` on
   the VPS.
3. SSHes in and runs `docker compose pull && docker compose up -d`.

The `core-api` container runs `prisma migrate deploy` automatically on every
start (see `apps/core-api/Dockerfile`), so the schema is always in sync
before it starts serving.

Watch it run under the repo's **Actions** tab. First run also triggers
Caddy's first certificate request — give it a minute after containers are up.

## 8. Verify

```bash
curl -I https://api.wenotifyafrica.com/api/health
```

Then open `https://www.wenotifyafrica.com`, `https://console.wenotifyafrica.com`,
`https://backoffice.wenotifyafrica.com` in a browser. Log into Admin with the dev
super-admin unless you've changed it (`docs/ARCHITECTURE.md` /
`apps/core-api/prisma/seed.ts`) — **change that password** once you're able
to log in, this is a placeholder credential, not something to leave on a
public server. Note also that the seed import (which creates the initial
super-admin) only runs via `pnpm db:seed`, which the Docker image doesn't run
automatically — run it once by hand after first deploy:

```bash
ssh deploy@<VPS_IP> "cd /opt/notifyafrica && docker compose -f docker-compose.prod.yml --env-file .env exec core-api npx tsx prisma/seed.ts"
```

## 9. Troubleshooting

- **Certificate not issuing / "connection refused" on 443**: DNS hasn't
  propagated yet, or ports 80/443 aren't open — recheck steps 2 and 4.2.
- **`docker compose pull` fails with "unauthorized"**: the GHCR package is
  still private — see step 6.
- **Containers up but 502 from Caddy**: check `docker compose -f
  docker-compose.prod.yml --env-file .env logs core-api` (or `website`/
  `console`/`admin`) on the VPS.
- **Migration errors on deploy**: `docker compose ... logs core-api` will
  show the Prisma error; the container will keep restarting until it's
  fixed (`prisma migrate deploy && next start` — the second command never
  runs if the first fails).
