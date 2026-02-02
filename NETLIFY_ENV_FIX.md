# Fix "Mock" Response on Netlify Deployment

## Why You're Seeing "Mock"

The "Mock" label appears when the `RANGE_API_KEY` environment variable is not accessible to your Next.js API route in the Netlify deployment.

## How to Fix

### Step 1: Verify Environment Variable in Netlify

1. **Go to Netlify Dashboard**
   - Navigate to your site: `soltax.netlify.app`
   - Click on **"Site settings"**

2. **Check Environment Variables**
   - Go to **"Environment variables"** in the left sidebar
   - Look for `RANGE_API_KEY`
   - Verify:
     - ✅ Key name is exactly: `RANGE_API_KEY` (case-sensitive)
     - ✅ Value is your actual Range API key
     - ✅ Scope is set correctly (should be "All scopes" or at least "Production")

### Step 2: Add/Update Environment Variable

If `RANGE_API_KEY` is missing or incorrect:

1. Click **"Add variable"** (or edit existing)
2. **Key**: `RANGE_API_KEY`
3. **Value**: Your Range Protocol API key
4. **Scope**: Select **"All scopes"** (or at least "Production")
5. Click **"Save"**

### Step 3: Redeploy

**Important**: After adding/updating environment variables, you MUST redeploy:

1. Go to **"Deploys"** tab
2. Click **"Trigger deploy"** → **"Deploy site"**
   - Or push a new commit to trigger automatic deployment

**Why?** Environment variables are injected at build/deploy time, not runtime. A new deployment is required for changes to take effect.

### Step 4: Verify It's Working

1. After redeployment, test the wallet screening
2. The "Mock" label should disappear
3. You should see "✓ Range API" instead
4. Check Netlify function logs to see if the API key is being read:
   - Go to **"Functions"** tab
   - Click on a function execution
   - Look for logs showing "Calling Range API:" (not "Range API key not configured")

## Troubleshooting

### Still Showing "Mock" After Redeploy?

1. **Check the logs:**
   - Go to **"Functions"** → Click on a recent function execution
   - Look for console.warn messages
   - Check if it says "Range API key not configured"

2. **Verify variable name:**
   - Make sure it's exactly `RANGE_API_KEY` (not `RANGE_API_KEY_DEV` or similar)
   - Check for typos or extra spaces

3. **Check variable scope:**
   - If you set scope to "Production" only, make sure you're testing on the production URL
   - Try setting to "All scopes" to test

4. **Clear browser cache:**
   - Sometimes the UI might be cached
   - Try hard refresh (Ctrl+Shift+R or Cmd+Shift+R)

5. **Check Netlify build logs:**
   - Go to **"Deploys"** → Click on the latest deploy
   - Check if there are any errors during build
   - Environment variables should be available during build

### Environment Variable Not Available in Functions?

If the variable is set but still not accessible:

1. **For Next.js API routes**, environment variables should work automatically
2. **Make sure you're not using `NEXT_PUBLIC_` prefix** - that's only for client-side variables
3. **Server-side variables** (like `RANGE_API_KEY`) don't need any prefix

### Testing Locally vs Production

- **Localhost**: Uses `.env.local` file
- **Netlify**: Uses environment variables set in dashboard
- Make sure both have the same variable name: `RANGE_API_KEY`

## Quick Checklist

- [ ] `RANGE_API_KEY` is set in Netlify environment variables
- [ ] Variable name is exactly `RANGE_API_KEY` (case-sensitive)
- [ ] Scope includes "Production" or "All scopes"
- [ ] Site has been redeployed after adding/updating the variable
- [ ] Testing on the production URL (not a preview deploy)
- [ ] Check function logs to verify API key is being read

## After Fixing

Once the environment variable is properly set and the site is redeployed:
- ✅ "Mock" label will disappear
- ✅ "✓ Range API" will appear instead
- ✅ Real risk scores from Range API will be displayed
- ✅ Wallet screening will use actual Range Protocol data
