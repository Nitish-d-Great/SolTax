# Netlify Deployment Guide for ZK Payroll

This guide will walk you through deploying your ZK Payroll Next.js application to Netlify.

## Prerequisites

1. A GitHub account with your code pushed to the repository
2. A Netlify account (sign up at https://www.netlify.com)
3. Your Range API key (for wallet screening)

## Step-by-Step Deployment Instructions

### Step 1: Prepare Your Repository

1. Ensure all your code is committed and pushed to GitHub:
   ```bash
   git add .
   git commit -m "Add Netlify configuration"
   git push origin main
   ```

### Step 2: Create a Netlify Account

1. Go to https://www.netlify.com
2. Click "Sign up" and choose "Sign up with GitHub"
3. Authorize Netlify to access your GitHub repositories

### Step 3: Deploy from GitHub

1. **Log in to Netlify Dashboard**
   - Go to https://app.netlify.com
   - You should see the Netlify dashboard

2. **Add a New Site**
   - Click "Add new site" → "Import an existing project"
   - Choose "GitHub" as your Git provider
   - Authorize Netlify if prompted

3. **Select Your Repository**
   - Search for and select `SolTax` (or `Nitish-d-Great/SolTax`)
   - Click on the repository

4. **Configure Build Settings**
   - **Base directory**: `app`
   - **Build command**: `npm install && npm run build`
   - **Publish directory**: `.next` (or leave empty - Netlify plugin will handle it)
   - **Node version**: `20` (or leave default)

   > **Note**: The Netlify Next.js plugin (`@netlify/plugin-nextjs`) will be automatically installed and will handle most of the configuration.

### Step 4: Set Environment Variables

1. **In the Netlify Dashboard:**
   - Go to your site → "Site settings" → "Environment variables"
   - Click "Add variable"

2. **Add the following environment variable:**
   - **Key**: `RANGE_API_KEY`
   - **Value**: Your Range API key (the actual key value)
   - **Scopes**: Select "All scopes" (or "Production" if you only want it in production)

3. **Click "Save"**

### Step 5: Deploy

1. **Start Deployment**
   - Click "Deploy site" button
   - Netlify will:
     - Clone your repository
     - Install dependencies
     - Run the build command
     - Deploy your site

2. **Monitor the Build**
   - You'll see a build log in real-time
   - Wait for the build to complete (usually 2-5 minutes)

3. **Verify Deployment**
   - Once complete, you'll get a deployment URL (e.g., `https://random-name-123.netlify.app`)
   - Click the URL to view your deployed site

### Step 6: Configure Custom Domain (Optional)

1. **In Netlify Dashboard:**
   - Go to "Domain settings"
   - Click "Add custom domain"
   - Enter your domain name
   - Follow the DNS configuration instructions

### Step 7: Verify Deployment

1. **Test the Application:**
   - Visit your deployment URL
   - Test wallet connection
   - Test employee screening
   - Test payment flow

2. **Check API Routes:**
   - Ensure `/api/screen` is working (it should use the `RANGE_API_KEY` environment variable)

## Important Notes

### Environment Variables

Make sure these environment variables are set in Netlify:
- `RANGE_API_KEY` - Your Range Protocol API key for wallet screening

### Build Configuration

The `netlify.toml` file is already configured with:
- Base directory: `app`
- Build command: `npm install && npm run build`
- Next.js plugin for automatic routing and optimization
- Security headers
- WASM file support

### Troubleshooting

**Build Fails:**
- Check the build logs in Netlify dashboard
- Ensure Node version is 20
- Verify all dependencies are in `package.json`

**API Routes Not Working:**
- Verify `RANGE_API_KEY` is set in environment variables
- Check that the API route file is in `app/src/app/api/screen/route.ts`

**WASM Files Not Loading:**
- Ensure WASM files are in `app/public/wasm/` directory
- Check browser console for CORS or loading errors

**Environment Variables Not Available:**
- Go to Site settings → Environment variables
- Ensure variables are set for the correct scope (Production, Deploy previews, Branch deploys)
- Redeploy after adding new variables

### Continuous Deployment

Netlify automatically deploys when you push to your main branch:
1. Push changes to GitHub
2. Netlify detects the push
3. Automatically starts a new build
4. Deploys when build succeeds

### Manual Deploy Triggers

You can also trigger deploys manually:
- Go to "Deploys" tab
- Click "Trigger deploy" → "Deploy site"

## Additional Configuration

### Branch Deploys

Netlify can deploy previews for pull requests:
- Go to "Site settings" → "Build & deploy" → "Continuous Deployment"
- Enable "Deploy previews"

### Build Hooks

You can trigger builds via webhook:
- Go to "Site settings" → "Build & deploy" → "Build hooks"
- Create a new build hook
- Use the URL to trigger builds programmatically

## Support

If you encounter issues:
1. Check Netlify build logs
2. Review Next.js documentation
3. Check Netlify community forum
4. Review your `netlify.toml` configuration

---

**Your site should now be live on Netlify! 🚀**
