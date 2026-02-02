# Netlify Build Error Fix

## Error Message
```
Error: Your publish directory cannot be the same as the base directory of your site.
```

## Solution

The issue is that in the Netlify UI, the **Publish directory** is set to `app`, which conflicts with the **Base directory** (also `app`).

### Fix Steps:

1. **Go to Netlify Dashboard**
   - Navigate to your site
   - Click on **"Site settings"**
   - Go to **"Build & deploy"** → **"Build settings"**

2. **Remove the Publish Directory**
   - Find the **"Publish directory"** field
   - **Clear it completely** (leave it empty)
   - The `@netlify/plugin-nextjs` will automatically handle the publish directory

3. **Verify Build Settings**
   - **Base directory**: `app` ✓
   - **Build command**: `npm install && npm run build` ✓
   - **Publish directory**: (empty) ✓

4. **Save and Redeploy**
   - Click **"Save"**
   - Go to **"Deploys"** tab
   - Click **"Trigger deploy"** → **"Deploy site"**

## Why This Happens

The `@netlify/plugin-nextjs` plugin automatically determines the correct publish directory for Next.js applications. When you manually set it in the UI, it can conflict with the plugin's automatic configuration.

## Alternative: Set via netlify.toml

If you prefer to set it in the config file, you can add this to `netlify.toml`:

```toml
[build]
  base = "app"
  command = "npm install && npm run build"
  publish = ".next"
```

However, it's recommended to let the plugin handle it automatically by leaving the publish directory empty in the UI.
