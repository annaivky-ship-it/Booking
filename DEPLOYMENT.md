# Deployment Guide

This guide will help you deploy the Flavor Entertainers Booking Platform.

## 🚀 Quick Deploy Options

### Option 1: Deploy to Vercel (Recommended)

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/annaivky-ship-it/Booking)

**Steps:**
1. Visit [Vercel](https://vercel.com)
2. Click "Add New Project"
3. Import your GitHub repository: `annaivky-ship-it/Booking`
4. Select the branch: `claude/assess-thos-011CV4BihaGcuQFXL72u7gKT`
5. Vercel will auto-detect the Vite configuration
6. Click "Deploy"
7. Your app will be live in ~2 minutes!

**Configuration:**
- Build Command: `npm run build` (auto-detected)
- Output Directory: `dist` (auto-detected)
- Install Command: `npm install` (auto-detected)

### Option 2: Deploy to Netlify

[![Deploy to Netlify](https://www.netlify.com/img/deploy/button.svg)](https://app.netlify.com/start/deploy?repository=https://github.com/annaivky-ship-it/Booking)

**Steps:**
1. Visit [Netlify](https://app.netlify.com)
2. Click "Add new site" → "Import an existing project"
3. Connect to GitHub and select `annaivky-ship-it/Booking`
4. Select the branch: `claude/assess-thos-011CV4BihaGcuQFXL72u7gKT`
5. Netlify will detect the `netlify.toml` configuration
6. Click "Deploy site"
7. Your app will be live in ~2 minutes!

**Configuration:**
- Build command: `npm run build`
- Publish directory: `dist`
- All settings are in `netlify.toml`

### Option 3: Deploy to GitHub Pages

**Steps:**
1. Go to your GitHub repository settings
2. Navigate to "Pages" in the sidebar
3. Set source to "GitHub Actions"
4. Create `.github/workflows/deploy.yml` (see below)
5. Push changes and GitHub will auto-deploy

**Workflow file (`.github/workflows/deploy.yml`):**
```yaml
name: Deploy to GitHub Pages

on:
  push:
    branches: [ claude/assess-thos-011CV4BihaGcuQFXL72u7gKT ]

jobs:
  build-and-deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3

      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '20'

      - name: Install dependencies
        run: npm install

      - name: Build
        run: npm run build

      - name: Deploy to GitHub Pages
        uses: peaceiris/actions-gh-pages@v3
        with:
          github_token: ${{ secrets.GITHUB_TOKEN }}
          publish_dir: ./dist
```

## 📋 Pre-Deployment Checklist

- [x] ✅ Dependencies installed
- [x] ✅ Build successful (`npm run build`)
- [x] ✅ No TypeScript errors
- [x] ✅ Environment variables documented in `.env.example`
- [x] ✅ Demo mode working (no backend required for initial deployment)

## 🔧 Environment Variables (Optional)

For production deployment with Supabase backend, configure these environment variables in your hosting platform:

```bash
# Supabase Configuration (Optional - app works in demo mode without these)
SUPABASE_URL=https://your-project-id.supabase.co
SUPABASE_ANON_KEY=your-anon-public-key-here

# Google Gemini API (Optional - for AI features)
GEMINI_API_KEY=your-gemini-api-key-here

# Application Mode
MODE=production  # or 'demo' for demo mode
```

### How to add environment variables:

**Vercel:**
1. Go to Project Settings → Environment Variables
2. Add each variable with its value
3. Redeploy the project

**Netlify:**
1. Go to Site Settings → Environment Variables
2. Add each variable with its value
3. Trigger a new deploy

**Note:** The app works perfectly in **demo mode** without any environment variables. It uses in-memory mock data for demonstration purposes.

## 🎯 Post-Deployment

After deployment, your app will be accessible at:
- **Vercel**: `https://your-project-name.vercel.app`
- **Netlify**: `https://your-site-name.netlify.app`
- **GitHub Pages**: `https://annaivky-ship-it.github.io/Booking/`

### Testing Deployment

1. **Age Verification**: You should see the age gate on first visit
2. **Demo Mode Badge**: Orange "Demo Mode" badge in the header
3. **Browse Performers**: All performers should load and be browsable
4. **Make a Booking**: Test the complete booking flow
5. **Login as Different Roles**:
   - Admin: Full dashboard access
   - Performer: View and manage bookings
   - Client: Track own bookings

### Login Credentials (Demo Mode)

**Admin:**
- Name: Admin
- Role: admin

**Performers:**
- Name: Any performer name (e.g., "Sophia Blaze")
- Role: performer
- ID: Performer ID from the list

**Client:**
- Email: any@example.com
- Role: user

## 🔄 Continuous Deployment

Both Vercel and Netlify support automatic deployments:

1. Every push to your branch triggers a new deployment
2. Pull requests get preview deployments
3. Main branch deploys to production

## 📊 Monitoring

**Vercel:**
- Analytics built-in (free tier)
- View deployment logs
- Monitor performance

**Netlify:**
- Analytics available (paid addon)
- View deploy logs
- Monitor build performance

## 🐛 Troubleshooting

### Build Failures

1. **Check build logs** in your hosting platform
2. **Verify Node version**: Should be 18.x or 20.x
3. **Clear cache and redeploy**:
   - Vercel: Redeploy with "Clear Cache"
   - Netlify: "Clear cache and deploy site"

### Routing Issues (404 errors)

- **Vercel**: Check `vercel.json` rewrites are configured
- **Netlify**: Check `netlify.toml` redirects are configured
- Both configs are already included in the repository ✓

### Environment Variables Not Working

1. Ensure variables are set in the hosting platform (not just `.env.example`)
2. Redeploy after adding variables
3. Check variable names match exactly (case-sensitive)

## 📞 Support

If you encounter issues:
1. Check the deployment logs in your hosting platform
2. Verify all configuration files are committed to git
3. Test the build locally: `npm run build && npm run preview`

## 🎉 Success!

Once deployed, share your app:
- 🔗 Copy the deployment URL
- 📱 Test on mobile devices
- 👥 Share with users
- 🎊 Celebrate!

---

**Current Status:** ✅ Ready to Deploy

Your application has been:
- ✅ Built successfully
- ✅ Configured for Vercel
- ✅ Configured for Netlify
- ✅ Optimized for production
- ✅ Type-safe and tested
