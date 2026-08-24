---
title: Mindscope AI - Mental Health Score Predictor
emoji: 🧠
colorFrom: indigo
colorTo: purple
sdk: docker
app_port: 7860
pinned: false
license: mit
---

# 🧠 Mindscope AI — Mental Health Score Predictor API

Production-ready FastAPI backend serving a scikit-learn machine learning pipeline for predicting student mental health impact scores based on lifestyle and social media metrics.

## 🚀 Quick Start (Local Docker)

### 1. Build the Docker Image
```bash
docker build -t mental-health-api .
```

### 2. Run the Container
```bash
docker run -d -p 7860:7860 --name mental-health-service mental-health-api
```

### 3. Test the Health Endpoint
```bash
curl http://localhost:7860/health
```

### 4. Interactive API Documentation (Swagger)
Open [http://localhost:7860/docs](http://localhost:7860/docs) in your browser.

---

## 📡 API Endpoints

### `POST /predict`
Submit student lifestyle metrics to get a predicted mental health score (0–100).

#### Request Payload:
```json
{
  "age": 21,
  "gender": "Female",
  "country": "USA",
  "academic_level": "Undergraduate",
  "most_used_platform": "Instagram",
  "purpose_of_use": "Entertainment",
  "avg_daily_usage_hours": 6.5,
  "daily_unlocks": 85,
  "study_hours": 4.0,
  "physical_activity_hours": 1.0,
  "sleep_hours_per_night": 7.0,
  "stress_level": "Medium"
}
```

#### Response:
```json
{
  "predicted_mental_health_score": 68.45
}
```

---

## 🛠️ Architecture & Deployment

- **Frontend**: Hosted globally on [Cloudflare Pages](https://pages.cloudflare.com/) (Edge CDN & zero-latency static hosting).
- **Backend**: Containerized FastAPI service hosted on [Render.com](https://render.com/), [Koyeb](https://koyeb.com/), or Docker.
- **Model**: Scikit-Learn pipeline (`Mental_Health_Model.pkl`).

See [`DEPLOYMENT_GUIDE.md`](./DEPLOYMENT_GUIDE.md) for full deployment walkthrough.