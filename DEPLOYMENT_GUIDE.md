# 🚀 Complete DevOps Production Deployment Guide

## Mindscope AI — Mental Health Score Predictor
**Architecture**: Cloudflare Pages (Frontend) + Hugging Face Spaces Docker (Backend API)

---

## 📐 System Architecture Overview

```mermaid
flowchart LR
    subgraph Client ["🌐 Client Layer"]
        User["👤 End User Browser"]
    end

    subgraph Cloudflare ["☁️ Cloudflare Pages (Global Edge CDN)"]
        CF_CDN["Cloudflare Global Network"]
        StaticAssets["Static Assets\n(index.html, style.css, script.js)"]
        SecurityHeaders["_headers\n(CSP, X-Frame-Options, Cache-Control)"]
    end

    subgraph HuggingFace ["🤗 Hugging Face Spaces (Backend Container)"]
        HF_Gateway["HF Edge Proxy / SSL Termination\n(https://<user>-<space>.hf.space)"]
        DockerContainer["🐳 Docker Container (Port 7860)\n- Non-Root User (UID 1000)\n- Python 3.10-slim"]
        FastAPI["⚡ FastAPI Server (Uvicorn)"]
        MLModel["🧠 Scikit-Learn Pipeline\n(Mental_Health_Model.pkl)"]
    end

    User -->|1. HTTPS Request| CF_CDN
    CF_CDN -->|2. Serves HTML/CSS/JS| User
    User -->|3. POST /predict (JSON)| HF_Gateway
    HF_Gateway --> DockerContainer
    DockerContainer --> FastAPI
    FastAPI --> MLModel
    MLModel -->|4. Prediction Score| FastAPI
    FastAPI -->|5. Response JSON| User
```

---

## 📁 Repository Structure for Deployment

| File | Purpose | Target Environment |
| :--- | :--- | :--- |
| `Dockerfile` | Multi-stage / optimized container recipe (Port 7860, UID 1000) | Hugging Face Spaces |
| `.dockerignore` | Excludes `.venv`, `.git`, `.csv`, `.ipynb` to keep image slim | Docker Build Engine |
| `requirements.txt` | Locked Python runtime dependencies | Docker / Backend |
| `main.py` | FastAPI server with `/predict`, `/health`, and CORS | Docker / Backend |
| `Mental_Health_Model.pkl` | Trained Scikit-Learn pipeline artifact | Docker / Backend |
| `index.html` | Semantic UI interface | Cloudflare Pages |
| `style.css` | Glassmorphism & responsive CSS | Cloudflare Pages |
| `script.js` | Frontend interaction & API fetch logic | Cloudflare Pages |
| `_headers` | HTTP security & caching headers | Cloudflare Pages |
| `README.md` | Space metadata header (`sdk: docker`, `app_port: 7860`) | Hugging Face Spaces |

---

## 🛠️ Step 1: Deploy Backend to Hugging Face Spaces (Docker)

### 1.1 Create a New Hugging Face Space
1. Log in to [Hugging Face](https://huggingface.co/).
2. Click on your profile icon in the top right and select **New Space** (or navigate to `https://huggingface.co/new-space`).
3. Fill in the Space settings:
   - **Space name**: `mental-health-score-predictor` (or your preferred name)
   - **License**: `MIT` (or open source of choice)
   - **Space SDK**: Select **Docker** 🐳
   - **Docker template**: Select **Blank**
   - **Space hardware**: **CPU Basic (Free - 2 vCPU, 16GB RAM)**
   - **Visibility**: **Public** (required so Cloudflare Pages can make unauthenticated API calls)
4. Click **Create Space**.

---

### 1.2 Push the Code to Hugging Face Spaces

You can push using **Git CLI** (recommended) or direct upload:

#### Option A: Using Git CLI (Recommended)
```bash
# 1. Add your Hugging Face Space as a remote
git remote add hf https://huggingface.co/spaces/<YOUR_HF_USERNAME>/mental-health-score-predictor

# 2. Authenticate using your Hugging Face Access Token (Write permissions)
# Generate token at: https://huggingface.co/settings/tokens

# 3. Push your main branch to Hugging Face
git push hf main --force
```

#### Option B: Using Hugging Face Web UI
1. In your newly created Space, navigate to the **Files** tab.
2. Click **Add file** -> **Upload files**.
3. Upload:
   - `Dockerfile`
   - `.dockerignore`
   - `requirements.txt`
   - `main.py`
   - `Mental_Health_Model.pkl`
   - `README.md`
4. Click **Commit changes to main**.

---

### 1.3 Obtain the Direct API URL

> [!IMPORTANT]
> Hugging Face Spaces has two URLs:
> - **Space View URL (Web UI)**: `https://huggingface.co/spaces/<USERNAME>/<SPACE_NAME>`
> - **Direct Backend API URL (Direct Container)**: `https://<USERNAME>-<SPACE_NAME>.hf.space`
>
> ⚠️ **Always use the Direct Backend API URL** (`.hf.space`) for your frontend API calls.

To find your direct URL in Hugging Face:
1. In your Space, click the **three dots (`...`)** in the upper right.
2. Click **Embed this Space**.
3. Look for **Direct URL**: It will look like:
   `https://<username>-<spacename>.hf.space`

---

### 1.4 Test Backend Health & API

Run these commands in your terminal or Postman to confirm your API is live:

#### Health Check:
```bash
curl -X GET https://<YOUR_HF_USERNAME>-mental-health-score-predictor.hf.space/health
```
*Expected output:* `{"status":"healthy","model_loaded":true}`

#### Test Prediction:
```bash
curl -X POST https://<YOUR_HF_USERNAME>-mental-health-score-predictor.hf.space/predict \
     -H "Content-Type: application/json" \
     -d '{
       "age": 20,
       "gender": "Female",
       "country": "USA",
       "academic_level": "Undergraduate",
       "most_used_platform": "Instagram",
       "purpose_of_use": "Entertainment",
       "avg_daily_usage_hours": 6.0,
       "daily_unlocks": 80,
       "study_hours": 4.0,
       "physical_activity_hours": 1.0,
       "sleep_hours_per_night": 7.0,
       "stress_level": "Medium"
     }'
```
*Expected output:* `{"predicted_mental_health_score":68.45}`

#### Interactive Swagger Documentation:
Open `https://<YOUR_HF_USERNAME>-mental-health-score-predictor.hf.space/docs` in your browser.

---

## 🌐 Step 2: Deploy Frontend to Cloudflare Pages

### 2.1 Update the Frontend API Endpoint

In [script.js](file:///c:/Users/Zaheer%20Ahmed/Desktop/GenAI_Project/Machine%20Learning/script.js#L14-L18), verify or update the `API_BASE` constant with your Hugging Face Space direct URL:

```javascript
const API_BASE = window.API_BASE_URL || (
  window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1"
    ? "http://127.0.0.1:7860"
    : "https://<YOUR_HF_USERNAME>-mental-health-score-predictor.hf.space"
);
```

---

### 2.2 Choose Deployment Method for Cloudflare Pages

#### Method A: Git Integration (Continuous Deployment — Recommended)
1. Push your project to **GitHub** or **GitLab**:
   ```bash
   git add .
   git commit -m "feat: configure cloudflare pages and hugging face docker"
   git push origin main
   ```
2. Log in to the [Cloudflare Dashboard](https://dash.cloudflare.com/).
3. Navigate to **Compute (Workers & Pages)** -> **Pages**.
4. Click **Create Application** -> **Pages** -> **Connect to Git**.
5. Select your repository: `mental-health-score-predictor`.
6. Configure the build settings:
   - **Project name**: `mindscope-ai` (or `mental-health-predictor`)
   - **Production branch**: `main`
   - **Framework preset**: `None`
   - **Build command**: *(Leave blank — static vanilla files do not require a build step)*
   - **Build output directory**: `/` (or root `.`)
7. Click **Save and Deploy**.
8. Cloudflare will provision a global SSL certificate and deploy to `https://mindscope-ai.pages.dev`.

---

#### Method B: Cloudflare Wrangler CLI (1-Command Instant Deploy)
If you have NodeJS installed, you can deploy directly from your terminal:

```bash
# 1. Run direct deployment with wrangler
npx wrangler pages deploy . --project-name mindscope-ai

# Wrangler will prompt you to log into Cloudflare via browser on first run.
```

---

#### Method C: Direct Drag-and-Drop (No Git Required)
1. In Cloudflare Dashboard, go to **Workers & Pages** -> **Create application** -> **Pages** -> **Upload assets**.
2. Create a project name.
3. Drag and drop your project folder containing `index.html`, `style.css`, `script.js`, and `_headers`.
4. Click **Deploy Site**.

---

## 🔒 Step 3: Production Security & Performance Best Practices

### 3.1 CORS (Cross-Origin Resource Sharing)
In [main.py](file:///c:/Users/Zaheer%20Ahmed/Desktop/GenAI_Project/Machine%20Learning/main.py#L20-L26), CORS is enabled for all origins by default. For strict production locking, you can restrict allowed origins to your Cloudflare Pages domain:

```python
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "https://mindscope-ai.pages.dev",
        "https://yourcustomdomain.com",
        "http://localhost:7860",
        "http://127.0.0.1:5500",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

### 3.2 Hugging Face Free Tier "Cold Starts" (Sleep Mode)
Hugging Face Spaces on the free tier enter sleep mode after 48 hours of inactivity.
- **Cold Boot Time**: When asleep, the first request takes ~10–25 seconds to spin up the container.
- **Handling in Frontend**: The frontend in `script.js` has error handling and loading indicators.
- **Uptime Monitoring / Keep-Alive**:
  To prevent sleep mode, you can configure a free cron monitor (such as [UptimeRobot](https://uptimerobot.com/) or [Cron-Job.org](https://cron-job.org/)) to ping `https://<YOUR_SPACE>.hf.space/health` every 15 minutes.

---

## 🧪 Local Testing with Docker

Before pushing changes to Hugging Face Spaces, you can test the Docker build locally:

```bash
# 1. Build Docker image
docker build -t mental-health-backend .

# 2. Run container on port 7860
docker run -d -p 7860:7860 --name mental-health-api mental-health-backend

# 3. Check logs
docker logs -f mental-health-api

# 4. Stop and remove container
docker stop mental-health-api && docker rm mental-health-api
```

---

## 🔄 Automated CI/CD (Sync GitHub to Hugging Face Spaces)

If your primary codebase is hosted on GitHub, you can create a GitHub Actions workflow to automatically mirror every push to your Hugging Face Space.

Create `.github/workflows/deploy_hf.yml`:

```yaml
name: Sync to Hugging Face Spaces

on:
  push:
    branches: [main]
  workflow_dispatch:

jobs:
  sync-to-hub:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
        with:
          fetch-depth: 0
          lfs: true
      - name: Push to Hugging Face Spaces
        env:
          HF_TOKEN: ${{ secrets.HF_TOKEN }}
        run: |
          git push https://<HF_USERNAME>:$HF_TOKEN@huggingface.co/spaces/<HF_USERNAME>/mental-health-score-predictor main:main --force
```

> **Note**: Add `HF_TOKEN` in your GitHub Repository Settings -> Secrets and Variables -> Actions (generate token at `huggingface.co/settings/tokens` with **write** permission).

---

## 🚨 Troubleshooting & Diagnostic Checklist

| Issue | Root Cause | Solution |
| :--- | :--- | :--- |
| **`Failed to fetch` / CORS Error in Browser** | Calling `huggingface.co/spaces/...` instead of direct `.hf.space` domain | Ensure `API_BASE` uses `https://<username>-<spacename>.hf.space` |
| **Space Status: "Building" fails** | Missing dependency in `requirements.txt` or non-root user permission issue | Check Docker build logs in Hugging Face Space "Logs" tab. Ensure `requirements.txt` has exact versions |
| **Port Not Accessible** | Hugging Face expects port `7860` | Ensure `EXPOSE 7860` and `uvicorn ... --port 7860` are configured in `Dockerfile` |
| **Model loading error** | `scikit-learn` version mismatch between training and inference | `requirements.txt` specifies `scikit-learn==1.6.1` which matches the model pickle version |
| **Cloudflare Pages 404 on subpaths** | Missing routing configuration | For Single Page Apps, static HTML root `./` serves `index.html` natively |
