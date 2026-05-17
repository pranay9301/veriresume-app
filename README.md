# VeriResume - AI Resume Extraction

A full-stack application that uses Google Gemini AI to extract information from resumes.

## Features

- Upload resume files (PDF, DOCX, TXT formats)
- AI-powered extraction of Name, Email, Skills, Education, and Experience
- Clean, responsive React frontend
- Serverless API backend for Vercel
- Supabase integration for data storage (optional)

## Tech Stack

- **Frontend**: React 18
- **Backend**: Vercel Serverless Functions (Node.js)
- **AI**: Google Gemini API
- **Database**: Supabase (PostgreSQL)
- **Deployment**: Vercel

## Quick Start

### 1. Clone and Install

```bash
git clone <your-repo-url>
cd veriresume-app
npm install
```

### 2. Environment Setup

```bash
cp .env.example .env.local
```

Edit `.env.local` and add your keys:

```
GEMINI_API_KEY=your_gemini_api_key_here
SUPABASE_URL=https://your-project-id.supabase.co
SUPABASE_ANON_KEY=your_supabase_anon_key_here
```

### File Format Support

The application supports the following resume formats:
- **PDF** - Portable Document Format
- **DOCX** - Microsoft Word Document
- **TXT** - Plain Text File

### 3. Run Locally

```bash
npm start
```

The app will be available at `http://localhost:3000`

## Deployment to Vercel

### Step 1: Push to GitHub

```bash
git init
git add .
git commit -m "Initial commit"
git remote add origin <your-github-repo-url>
git push -u origin main
```

### Step 2: Connect to Vercel

1. Go to [vercel.com](https://vercel.com) and sign in
2. Click "Add New Project"
3. Import your GitHub repository
4. In **Environment Variables**, add:
   - `GEMINI_API_KEY` = your Google AI Studio API key
   - `SUPABASE_URL` = your Supabase project URL
   - `SUPABASE_ANON_KEY` = your Supabase anon key
5. Click **Deploy**

### Step 3: Set Up Supabase (Optional)

1. Go to [supabase.com](https://supabase.com) and create a project
2. Run the SQL in `supabase-setup.sql` in the SQL Editor
3. Create a storage bucket named `resume-files` (make it public)

## API Endpoints

### POST /api/extract

Extracts information from resume text using Google Gemini AI.

**Request Body:**
```json
{
  "resumeText": "Full text content of the resume..."
}
```

**Response:**
```json
{
  "success": true,
  "data": "Extracted information...",
  "modelUsed": "gemini-1.5-flash-latest"
}
```

## Troubleshooting

### "An internal error has occurred"

This usually means the environment variable name is wrong. Make sure it's exactly:
- `GEMINI_API_KEY` (not `Gemini_API_Key` or any other variation)

### "All AI models failed"

1. Verify your API key starts with `AIza`
2. Create a new API key in [Google AI Studio](https://aistudio.google.com/app/apikey)
3. Make sure the key has access to Gemini models
4. Redeploy after updating the environment variable

### Build Failures

Make sure you have the correct Node.js version (18.x or higher):
```bash
node --version
```

## File Structure

```
veriresume-app/
├── api/
│   └── extract.js          # Serverless API endpoint
├── public/
│   └── index.html          # HTML template
├── src/
│   ├── App.css             # App styles
│   ├── App.js              # Main React component
│   ├── index.css           # Global styles
│   └── index.js            # React entry point
├── .env.example            # Environment variables template
├── package.json            # Dependencies and scripts
├── supabase-setup.sql      # Database setup script
├── vercel.json             # Vercel configuration
└── README.md               # This file
```

## License

MIT
