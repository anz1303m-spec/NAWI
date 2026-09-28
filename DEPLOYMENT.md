# NAWI Platform Deployment Guide

This document provides step-by-step instructions for deploying the **NAWI (Non-Automatic Weighing Instrument)** Testing & Certification Platform to production cloud environments.

---

## 🚀 Recommended Deployment Options

### Option 1: Render / Railway / Heroku (Easiest)

1. Push your repository to **GitHub / GitLab**.
2. Create a new Web Service on **[Render](https://render.com)** or **[Railway](https://railway.app)**.
3. Connect your Git repository.
4. Set the following build and start commands:
   - **Build Command:** `npm install && npm run build`
   - **Start Command:** `NODE_ENV=production node server/server.js`
5. Configure Environment Variables in your platform dashboard:
   - `NODE_ENV`: `production`
   - `PORT`: `5000` (or leave default assigned by platform)
   - `MONGODB_URI`: Your MongoDB Atlas connection string (`mongodb+srv://...`)
   - `JWT_ACCESS_SECRET`: Secure random string
   - `JWT_REFRESH_SECRET`: Secure random string
   - `CLOUDINARY_CLOUD_NAME` (optional for photo evidence)
   - `CLOUDINARY_API_KEY` (optional)
   - `CLOUDINARY_API_SECRET` (optional)

---

### Option 2: Docker Container Deployment (Cloud Run / AWS ECS / DigitalOcean)

A multi-stage `Dockerfile` is included in the project root.

#### Build Docker Image Locally
```bash
docker build -t nawi-platform:latest .
```

#### Run Container Locally
```bash
docker run -p 5000:5000 \
  -e NODE_ENV=production \
  -e MONGODB_URI="mongodb+srv://<user>:<password>@cluster.mongodb.net/nawi_db" \
  -e JWT_ACCESS_SECRET="your_access_secret" \
  -e JWT_REFRESH_SECRET="your_refresh_secret" \
  nawi-platform:latest
```

---

### Option 3: VPS / Ubuntu Server (PM2 + Nginx)

1. Clone the repository on your server:
   ```bash
   git clone <your-repo-url>
   cd NAWI
   ```
2. Install dependencies & build client:
   ```bash
   npm install
   npm run build
   ```
3. Configure `.env`:
   ```bash
   cp .env.example .env
   nano .env # update values
   ```
4. Start with PM2:
   ```bash
   npm install -g pm2
   NODE_ENV=production pm2 start server/server.js --name "nawi-backend"
   pm2 save
   ```

---

## 🧪 Database Seeding (First-time Deployment)

To seed initial default metrological rulesets and admin accounts on production:

```bash
NODE_ENV=production npm run seed
```

---

## ✅ Deployment Checklist

- [x] Production build generated cleanly (`npm run build --prefix client`).
- [x] Static assets served by Express backend when `NODE_ENV=production`.
- [x] Environment variable template created (`.env.example`).
- [x] Docker container manifest created (`Dockerfile` & `.dockerignore`).
- [x] Automated deployment config created (`render.yaml`).
- [x] Security secrets separated from source code.
