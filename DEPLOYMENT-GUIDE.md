# VeriResume - Complete Deployment Guide

This guide walks you through deploying the VeriResume application step by step.

---

## Phase 1: Push Code to GitHub

### Step 1.1: Create a GitHub Repository

1. Go to [github.com](https://github.com) and sign in to your account
2. Click the **+** icon in the top right corner → **New repository**
3. Fill in the details:
   - **Repository name**: `veriresume-app` (or any name you prefer)
   - **Description**: AI-powered resume extraction app
   - **Visibility**: Public (or Private if you prefer)
   - **Initialize**: Do NOT check "Add a README file" (we already have one)
4. Click **Create repository**

### Step 1.2: Initialize Git and Push Code

Open your terminal/command prompt and run these commands:

```bash
# Navigate to your project folder
cd veriresume-app

# Initialize Git repository
git init

# Add all files to staging
git add .

# Commit the files
git commit -m "Initial commit - VeriResume app"

# Add the remote repository (replace YOUR_USERNAME with your GitHub username)
git remote add origin https://github.com/YOUR_USERNAME/veriresume-app.git

# Push to GitHub
git push -u origin main
```

**Note**: If your default branch is `master` instead of `main`, use:
```bash
git push -u origin master
```

---

## Phase 2: Set Up Supabase

### Step 2.1: Create a Supabase Project

1. Go to [supabase.com](https://supabase.com) and sign in (or create an account)
2. Click **New Project**
3. Fill in the details:
   - **Organization**: Select or create one
   - **Project name**: `veriresume-db`
   - **Database Password**: Create a strong password (save it somewhere safe!)
   - **Region**: Choose the closest to your users (e.g., `Asia Pacific (Mumbai)` for India)
4. Click **Create new project**
5. Wait for the project to be created (this takes a few minutes)

### Step 2.2: Get Your Supabase Credentials

1. Once the project is ready, click on the **Settings** icon (gear icon) in the left sidebar
2. Click on **API** in the settings menu
3. You will see two important values:
   - **Project URL**: Looks like `https://xyzabc123def456ghij.supabase.co`
   - **Project API keys (anon public)**: A long string starting with `eyJhbGciOiJIUzI1NiIs...`
4. Copy both values and save them in a text file - you'll need them later

### Step 2.3: Set Up the Database

1. In the left sidebar, click on **SQL Editor** (looks like `>_`)
2. Click **+ New query**
3. Copy and paste the entire contents of the `supabase-setup.sql` file from your project
4. Click **Run** at the bottom right
5. You should see a success message

### Step 2.4: Create Storage Bucket

1. In the left sidebar, click on **Storage**
2. Click **New Bucket**
3. Name it: `resume-files`
4. **Important**: Toggle the switch for **Public bucket** to ON
5. Click **Save**

---

## Phase 3: Deploy to Vercel

### Step 3.1: Connect GitHub to Vercel

1. Go to [vercel.com](https://vercel.com) and sign in (or create an account)
2. Click **Add New Project**
3. Under **Import Git Repository**, find and select your `veriresume-app` repository
4. Click **Import**

### Step 3.2: Configure Project Settings

1. **Project Name**: `veriresume-app` (or your preferred name)
2. **Framework Preset**: Select `Create React App`
3. **Root Directory**: Leave as `./` (or set to `veriresume-app` if your code is in a subdirectory)

### Step 3.3: Add Environment Variables

This is the **most critical step**. Click on **Environment Variables** and add:

| Variable Name | Value | Example |
|--------------|-------|---------|
| `GEMINI_API_KEY` | Your Google AI Studio API key | `AIzaSyC...` |
| `SUPABASE_URL` | Your Supabase Project URL | `https://xyzabc123def456ghij.supabase.co` |
| `SUPABASE_ANON_KEY` | Your Supabase Anon Key | `eyJhbGciOiJIUzI1NiIs...` |

**Important Notes:**
- The variable name must be exactly `GEMINI_API_KEY` (all caps, underscores)
- Do NOT use `Gemini_API_Key` or any other variation
- The API key must start with `AIza`

### Step 3.4: Deploy

1. Click **Deploy**
2. Wait for the build to complete (usually takes 1-2 minutes)
3. Once done, Vercel will provide you with a live URL (e.g., `https://veriresume-app.vercel.app`)

---

## Phase 4: Get Google Gemini API Key

If you don't have a Gemini API key yet:

1. Go to [Google AI Studio](https://aistudio.google.com/app/apikey)
2. Sign in with your Google account
3. Click **Create API Key**
4. Copy the key (it starts with `AIza`)
5. Go back to Vercel Dashboard → Your Project → Settings → Environment Variables
6. Add or update `GEMINI_API_KEY` with this new key
7. **Redeploy**: Go to Deployments → Click the three dots on the latest deployment → **Redeploy**

---

## Phase 5: Verify Everything Works

### Test the Frontend
1. Visit your Vercel live URL
2. Try uploading a `.txt`, `.pdf`, or `.docx` resume file
3. Click "Extract Information"
4. You should see extracted information or a clear error message

### Common Issues and Fixes

#### "An internal error has occurred"
- **Cause**: Environment variable name is wrong
- **Fix**: Make sure it's `GEMINI_API_KEY` (not `Gemini_API_Key`)
- **Action**: Update in Vercel → Redeploy

#### "All AI models failed"
- **Cause**: Invalid or inactive API key
- **Fix**: Create a new API key in Google AI Studio
- **Action**: Update `GEMINI_API_KEY` in Vercel → Redeploy

#### "Could not extract text from file"
- **Cause**: File is corrupted or password-protected
- **Fix**: Try a different file or convert to plain text

---

## Phase 6: Update Your Project (Future Changes)

Whenever you make changes to your code:

```bash
# Navigate to project folder
cd veriresume-app

# Stage changes
git add .

# Commit
git commit -m "Description of changes"

# Push to GitHub
git push origin main
```

Vercel will automatically detect the push and redeploy your application!

---

## Summary of What You Need

| Service | What You Need | Where to Get It |
|---------|--------------|-----------------|
| **GitHub** | Repository URL | Created in Phase 1 |
| **Supabase** | Project URL + Anon Key | Phase 2.2 |
| **Google AI** | Gemini API Key | Phase 4 |
| **Vercel** | Live URL | Phase 3.4 |

---

## Need Help?

If you encounter any issues:
1. Check the browser console for error messages
2. Check Vercel deployment logs (Dashboard → Deployments → Latest → Logs)
3. Verify all environment variables are set correctly
4. Make sure your API key is active and has access to Gemini models
