# Setup Range API on Netlify - Quick Guide

## Problem
Range API works on localhost but shows "Mock" on Netlify deployment.

## Solution - 3 Simple Steps

### Step 1: Add Environment Variable in Netlify

1. Go to **Netlify Dashboard**: https://app.netlify.com
2. Select your site: **soltax.netlify.app**
3. Go to: **Site settings** → **Environment variables**
4. Click **"Add variable"**
5. Enter:
   - **Key**: `RANGE_API_KEY`
   - **Value**: Your Range Protocol API key (paste the actual key)
   - **Scope**: Select **"All scopes"** (or at least "Production")
6. Click **"Save"**

### Step 2: Redeploy (CRITICAL!)

**⚠️ IMPORTANT**: Environment variables are only available after a new deployment.

1. Go to **"Deploys"** tab
2. Click **"Trigger deploy"** → **"Deploy site"**
3. Wait for deployment to complete (2-5 minutes)

**OR** push a new commit to trigger automatic deployment:
```bash
git commit --allow-empty -m "Trigger Netlify redeploy for env vars"
git push origin main
```

### Step 3: Verify It's Working

1. After deployment completes, test wallet screening
2. Check the result:
   - ✅ Should show **"✓ Range API"** (not "⚠️ Mock")
   - ✅ Should show real risk scores from Range API
   - ✅ Risk scores should be in 1-10 format

## Verify in Netlify Logs

To confirm the API key is being read:

1. Go to **"Functions"** tab in Netlify
2. Click on a recent function execution (from `/api/screen`)
3. Check the logs:
   - ✅ Should see: `"✅ Range API key found, using real API"`
   - ✅ Should see: `"Calling Range API: https://api.range.org/v1/risk/address?..."`
   - ❌ Should NOT see: `"❌ Range API key not configured!"`

## Troubleshooting

### Still showing "Mock"?

1. **Check variable name**: Must be exactly `RANGE_API_KEY` (case-sensitive, no spaces)
2. **Check variable value**: Make sure the full API key was pasted (no truncation)
3. **Check scope**: Should be "All scopes" or at least "Production"
4. **Redeploy**: Did you redeploy after adding the variable? (This is required!)
5. **Check logs**: Look at function logs to see what error message appears

### API Key Format

- Should be a long string (usually 40+ characters)
- No quotes needed when pasting
- No spaces before/after
- Example format: `sk_live_abc123xyz...` (your actual key will be different)

### Common Mistakes

❌ **Wrong variable name**: `RANGE_API_KEY_DEV`, `RANGEKEY`, etc.
✅ **Correct**: `RANGE_API_KEY`

❌ **Not redeploying after adding variable**
✅ **Correct**: Must redeploy for env vars to be available

❌ **Setting scope to "Deploy previews" only**
✅ **Correct**: Use "All scopes" or at least "Production"

## Quick Checklist

- [ ] `RANGE_API_KEY` added in Netlify environment variables
- [ ] Variable name is exactly `RANGE_API_KEY` (case-sensitive)
- [ ] Full API key value is pasted (no truncation)
- [ ] Scope is set to "All scopes" or "Production"
- [ ] Site has been redeployed after adding variable
- [ ] Testing on production URL (soltax.netlify.app)
- [ ] Function logs show "✅ Range API key found"

## After Setup

Once configured correctly:
- ✅ No more "Mock" responses
- ✅ Real risk scores from Range Protocol
- ✅ Proper wallet screening with actual data
- ✅ Risk scores displayed as X/10 format

---

**Need help?** Check the function logs in Netlify to see detailed error messages about what's wrong.
