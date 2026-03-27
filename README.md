# ReelCraft – AI Instagram Reel Editor

Upload a video → choose a template → get AI music suggestions → download your reel. All free, no backend server needed (FFmpeg runs in your browser).

## Features
- **4 Reel Templates**: Clean 9:16 crop, Zoom Pulse, Glitch FX, Beat Sync
- **AI Video Analysis**: Claude reads your video's mood, energy, and vibe
- **5 Trending Song Matches**: Claude suggests songs that fit your video
- **Pixabay Music**: Free downloadable music tracks matched to your vibe
- **Hashtag Pack**: 10 trending hashtags auto-generated

## Tech Stack
- **Next.js 14** (App Router)
- **FFmpeg.wasm** – in-browser video editing, zero server cost
- **Anthropic Claude** – video analysis + music suggestions
- **Pixabay API** – free music library

---

## Deploy in 5 Minutes

### Step 1 – Get your API keys (free)

**Anthropic API Key:**
1. Go to https://console.anthropic.com
2. Click API Keys → Create Key
3. Copy it

**Pixabay API Key:**
1. Go to https://pixabay.com/api/docs/
2. Create a free account
3. Your API key is shown on that page

---

### Step 2 – Push to GitHub

```bash
# In your terminal:
git init
git add .
git commit -m "Initial commit"

# Create a new repo on github.com, then:
git remote add origin https://github.com/YOUR_USERNAME/insta-reel-agent.git
git push -u origin main
```

---

### Step 3 – Deploy on Vercel

1. Go to https://vercel.com → Sign in with GitHub
2. Click **"Add New Project"**
3. Import your `insta-reel-agent` repo
4. Before clicking Deploy, click **"Environment Variables"** and add:

| Name | Value |
|------|-------|
| `ANTHROPIC_API_KEY` | `sk-ant-...` |
| `PIXABAY_API_KEY` | `your-pixabay-key` |

5. Click **Deploy** → Done! ✅

Your app will be live at `https://your-project.vercel.app`

---

## Local Development (optional)

```bash
# Clone your repo
git clone https://github.com/YOUR_USERNAME/insta-reel-agent.git
cd insta-reel-agent

# Install dependencies
npm install

# Create environment file
cp .env.example .env.local
# Edit .env.local and add your API keys

# Run dev server
npm run dev
# Open http://localhost:3000
```

---

## How It Works

1. **Upload** any video (MP4, MOV, WEBM)
2. **Choose template**: Reels crop, Zoom Pulse, Glitch FX, or Beat Sync
3. **Click "AI Analyze"**: Claude extracts a frame, reads the vibe, returns song suggestions + hashtags
4. **Click a song** to search Pixabay for free matching tracks → preview & download
5. **Click "Apply & Export"**: FFmpeg processes the video in your browser → download your reel

## Architecture Notes

- FFmpeg runs entirely client-side via WebAssembly — no video data leaves the browser
- Only the extracted frame (1 JPEG) is sent to Claude for analysis
- Pixabay API calls go through a Next.js API route to keep your key secret
- Vercel free tier is sufficient for this app
