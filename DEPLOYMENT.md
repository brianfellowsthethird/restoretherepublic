# Deployment Guide

## Deploying to Vercel

### First Time Deployment

1. **Login to Vercel:**
   ```bash
   vercel login
   ```

2. **Deploy:**
   ```bash
   vercel
   ```
   - Follow the prompts
   - Choose your scope (personal or team)
   - Link to existing project or create new
   - Confirm settings

3. **Production Deployment:**
   ```bash
   vercel --prod
   ```

### Connecting Your Squarespace Domain

1. **In Vercel Dashboard:**
   - Go to your project → Settings → Domains
   - Add your domain (e.g., `yourdomain.com`)

2. **In Squarespace:**
   - Go to Settings → Domains
   - Find your domain and click "Manage"
   - Go to DNS Settings
   - Add these DNS records:
     - **Type:** CNAME
     - **Host:** www (or @)
     - **Points to:** cname.vercel-dns.com
     - **Type:** A
     - **Host:** @
     - **Points to:** 76.76.21.21 (Vercel's IP)

3. **Wait for DNS propagation** (can take up to 48 hours, usually faster)

4. **SSL Certificate:** Vercel will automatically provision SSL once DNS is configured

### Future Updates

Simply run:
```bash
vercel --prod
```

Or connect to GitHub for automatic deployments on push.

