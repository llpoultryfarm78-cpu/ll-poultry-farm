# L&L Poultry Farm admin dashboard

This package keeps the existing website files and adds a phone-friendly `/admin/` dashboard plus a Cloudflare Worker API starter. **It is not deployed or connected to Cloudflare yet.** Your current live website has not been changed.

Allowed admin email: `llpoultryfarm78@gmail.com`.

## Files
- Existing site, photos, SEO files, sitemap and robots.txt
- `admin/`: dashboard UI
- `worker/`: API, D1 schema and Wrangler configuration

## Setup — keep the current live site untouched
1. Put all ZIP contents into the GitHub repository so `index.html`, `images/`, `admin/` and `worker/` are at repository root.
2. Create Cloudflare D1 database `ll-poultry-farm-db`; execute `worker/schema.sql`; copy the database ID into `worker/wrangler.toml`.
3. Create R2 bucket `ll-poultry-farm-images`; configure a public image hostname and set `PUBLIC_IMAGE_BASE_URL`.
4. Configure Cloudflare Access One-time PIN to allow only `llpoultryfarm78@gmail.com` on both the admin site path `/admin/*` and API path `/api/admin/*`.
5. Copy the Access application AUD into `ACCESS_AUD`. Set `ACCESS_CERTS_URL` to `https://YOUR-TEAM.cloudflareaccess.com/cdn-cgi/access/certs`.
6. Deploy the Worker from the `worker` folder using Wrangler after replacing all placeholders in `wrangler.toml`.
7. Deploy the website to a **new test Pages project** connected to GitHub. Do not replace or delete `ll-poultry-farm.pages.dev` until the test is working.
8. Replace `SET_YOUR_WORKER_URL_HERE` in the new site's `index.html` with the deployed Worker URL, then commit and redeploy.
9. Visit `/admin/`, enter the Worker URL and save it on the phone. Sign in through Cloudflare Access.

The dashboard supports listings, prices, availability, descriptions, photos (5 MB maximum), and announcements. Use real farm photos and accurate information.

This package does not create Cloudflare resources, connect GitHub, deploy the Worker, or configure Access automatically. Those account actions still require your approval.
