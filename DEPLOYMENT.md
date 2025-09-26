# 🚀 ShiftBalance Deployment Guide

This guide will walk you through deploying ShiftBalance to production using:
- **Backend**: Render or Railway
- **Frontend**: Vercel
- **Database**: PostgreSQL (provided by backend platform)
- **Redis**: Redis addon (optional but recommended)

## 📋 Prerequisites

Before deploying, ensure you have:
1. GitHub repository with the code
2. Accounts on your chosen platforms (Render/Railway + Vercel)
3. Generated strong secrets for JWT tokens
4. VAPID keys for push notifications (optional)

## 🎯 Deployment Options

### Option 1: Deploy to Render (Recommended)

#### Step 1: Deploy Backend to Render

1. **Connect GitHub Repository**
   - Go to [Render Dashboard](https://dashboard.render.com)
   - Click "New +" → "Blueprint"
   - Connect your GitHub repository
   - Select the `render.yaml` file (already configured)

2. **Configure Environment Variables**
   Navigate to your service settings and add:
   ```env
   NODE_ENV=production
   CLIENT_URL=https://your-app.vercel.app
   JWT_SECRET=<generate-with-openssl-rand-base64-32>
   JWT_REFRESH_SECRET=<generate-with-openssl-rand-base64-32>
   ADMIN_PHONE=0501234567
   ADMIN_PASSWORD=YourStrongPassword123!
   ```

3. **Deploy**
   - Render will automatically create database and Redis services
   - Initial deployment will run migrations and start the server
   - Note the backend URL (e.g., `https://shiftbalance-backend.onrender.com`)

#### Step 2: Deploy Frontend to Vercel

1. **Import Project**
   - Go to [Vercel Dashboard](https://vercel.com/dashboard)
   - Click "Add New..." → "Project"
   - Import your GitHub repository

2. **Configure Build Settings**
   - Framework Preset: `Vite`
   - Root Directory: `./` (leave as is)
   - Build Command: `cd frontend && npm run build`
   - Output Directory: `frontend/dist`

3. **Set Environment Variables**
   ```env
   VITE_API_URL=https://shiftbalance-backend.onrender.com/api
   ```
   (Replace with your actual backend URL from Step 1)

4. **Deploy**
   - Click "Deploy"
   - Note your frontend URL (e.g., `https://shiftbalance.vercel.app`)

5. **Update Backend CORS**
   - Go back to Render dashboard
   - Update `CLIENT_URL` environment variable with your Vercel URL
   - Redeploy the backend service

### Option 2: Deploy to Railway

#### Step 1: Deploy Backend to Railway

1. **Create New Project**
   - Go to [Railway](https://railway.app)
   - Click "New Project"
   - Select "Deploy from GitHub repo"
   - Choose your repository

2. **Add PostgreSQL**
   - Click "New" → "Database" → "PostgreSQL"
   - Railway will automatically inject `DATABASE_URL`

3. **Add Redis (Optional)**
   - Click "New" → "Database" → "Redis"
   - Note the `REDIS_URL` for environment variables

4. **Configure Service**
   - Click on your service
   - Go to "Settings" tab
   - Set Root Directory: `/backend`
   - Set Build Command: `npm ci && npm run prisma:generate && npm run build`
   - Set Start Command: `npm run db:migrate:deploy && npm run start`

5. **Set Environment Variables**
   ```env
   NODE_ENV=production
   PORT=5001
   CLIENT_URL=https://your-app.vercel.app
   JWT_SECRET=<generate-strong-secret>
   JWT_REFRESH_SECRET=<generate-strong-secret>
   ADMIN_PHONE=0501234567
   ADMIN_PASSWORD=YourStrongPassword123!
   ```

6. **Deploy**
   - Click "Deploy"
   - Note your backend URL from Railway's provided domain

#### Step 2: Deploy Frontend to Vercel
(Same as Option 1, Step 2)

## 🔐 Security Checklist

Before going live:

- [ ] Generate strong JWT secrets (min 32 characters)
- [ ] Change default admin password
- [ ] Set up proper CORS origins
- [ ] Enable HTTPS (automatic on Vercel/Render/Railway)
- [ ] Configure rate limiting (already in code)
- [ ] Set up monitoring (Sentry recommended)
- [ ] Enable automatic backups (database)

## 🛠️ Post-Deployment Setup

### 1. Initial Admin Setup

After deployment, create the first admin user:

```bash
# SSH into your backend or use the console
npm run db:seed
```

Or manually through the API:
```bash
curl -X POST https://your-backend.onrender.com/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "phone": "0501234567",
    "password": "YourPassword123!",
    "fullName": "מנהל מערכת",
    "registrationToken": "admin-setup-token"
  }'
```

### 2. Configure Push Notifications (Optional)

1. Generate VAPID keys at [vapidkeys.com](https://vapidkeys.com)
2. Add to backend environment:
   ```env
   VAPID_PUBLIC_KEY=<your-public-key>
   VAPID_PRIVATE_KEY=<your-private-key>
   VAPID_EMAIL=mailto:admin@yourdomain.com
   ```

### 3. Set Up Custom Domain (Optional)

#### For Frontend (Vercel):
1. Go to project settings → Domains
2. Add your custom domain
3. Follow DNS configuration instructions

#### For Backend (Render):
1. Go to service settings → Custom Domains
2. Add your API subdomain (e.g., `api.yourdomain.com`)
3. Update frontend's `VITE_API_URL`

## 📊 Monitoring & Maintenance

### Health Checks
- Backend: `https://your-backend.onrender.com/api/health`
- Frontend: Check Vercel dashboard

### Logs
- **Render**: Service → Logs tab
- **Railway**: Service → Logs
- **Vercel**: Functions → Logs

### Database Management
- **Render**: Use integrated PostgreSQL dashboard
- **Railway**: Use provided database credentials with pgAdmin
- Or use Prisma Studio locally:
  ```bash
  DATABASE_URL=your-prod-db-url npx prisma studio
  ```

## 🔄 Continuous Deployment

The included GitHub Actions workflow (`ci-cd.yml`) will:
1. Run tests on every push
2. Build and type-check the code
3. Auto-deploy to production on merge to `main`

To enable:
1. Add these secrets to your GitHub repository:
   - `RENDER_API_KEY` (from Render account settings)
   - `RENDER_SERVICE_ID` (from Render service settings)
   - `VERCEL_TOKEN` (from Vercel account settings)
   - `VERCEL_ORG_ID` (from Vercel project settings)
   - `VERCEL_PROJECT_ID` (from Vercel project settings)
   - `VITE_API_URL` (your backend URL)

## 🚨 Troubleshooting

### Common Issues

1. **Database connection failed**
   - Check `DATABASE_URL` format
   - Ensure database is running
   - Check firewall/network settings

2. **CORS errors**
   - Verify `CLIENT_URL` matches your frontend URL exactly
   - Include protocol (https://)
   - No trailing slash

3. **WebSocket connection failed**
   - Ensure backend supports WebSocket upgrade
   - Check if platform requires specific configuration

4. **Build failures**
   - Clear cache and redeploy
   - Check Node.js version (must be 20+)
   - Verify all dependencies are installed

### Platform-Specific Issues

**Render:**
- Free tier spins down after 15 minutes of inactivity
- First request after spin-down will be slow
- Consider upgrading for production use

**Railway:**
- Check usage limits on free tier
- Database connection might need explicit SSL mode

**Vercel:**
- API routes have 10-second timeout on hobby plan
- Static files cached aggressively (use versioning)

## 📞 Support

For deployment issues:
- Check platform documentation
- Review error logs
- Open issue on GitHub repository
- Contact platform support

## 🎉 Success Checklist

Your deployment is successful when:
- [ ] Backend health check returns 200 OK
- [ ] Frontend loads without errors
- [ ] Users can register and login
- [ ] WebSocket connections work (real-time updates)
- [ ] Database operations succeed
- [ ] Push notifications work (if configured)
- [ ] All API endpoints respond correctly

Congratulations! Your ShiftBalance app is now live! 🚀