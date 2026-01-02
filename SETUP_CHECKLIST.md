# Backend Setup Verification Checklist

## 1. Project Structure Verification
```
resume-analyzer-backend/
├── src/
│   ├── auth/
│   │   ├── auth.module.ts ✓
│   │   ├── controllers/auth.controller.ts ✓
│   │   ├── services/auth.service.ts ✓
│   │   ├── strategies/
│   │   │   ├── jwt.strategy.ts ✓
│   │   │   ├── google.strategy.ts ✓
│   │   │   └── github.strategy.ts ✓
│   │   ├── guards/jwt-auth.guard.ts ✓
│   │   └── dto/
│   │       ├── register.dto.ts ✓
│   │       ├── login.dto.ts ✓
│   │       ├── forgot-password.dto.ts ✓
│   │       └── reset-password.dto.ts ✓
│   ├── users/
│   │   ├── users.module.ts ✓
│   │   ├── controllers/users.controller.ts ✓
│   │   ├── services/users.service.ts ✓
│   │   └── dto/
│   │       ├── update-profile.dto.ts ✓
│   │       └── change-password.dto.ts ✓
│   ├── resumes/
│   │   ├── resumes.module.ts ✓
│   │   ├── controllers/resumes.controller.ts ✓
│   │   └── services/resumes.service.ts ✓
│   ├── jobs/
│   │   ├── jobs.module.ts ✓
│   │   ├── controllers/jobs.controller.ts ✓
│   │   ├── services/jobs.service.ts ✓
│   │   └── dto/create-job.dto.ts ✓
│   ├── analysis/
│   │   ├── analysis.module.ts ✓
│   │   ├── controllers/analysis.controller.ts ✓
│   │   └── services/
│   │       ├── analysis.service.ts ✓
│   │       └── openai.service.ts ✓
│   ├── storage/
│   │   ├── storage.module.ts ✓
│   │   └── services/storage.service.ts ✓
│   ├── email/
│   │   ├── email.module.ts ✓
│   │   └── services/email.service.ts ✓
│   ├── config/
│   │   ├── prisma.module.ts ✓
│   │   └── prisma.service.ts ✓
│   ├── common/
│   │   └── decorators/current-user.decorator.ts ✓
│   ├── app.module.ts ✓
│   └── main.ts ✓
├── prisma/schema.prisma ✓
├── Dockerfile ✓
├── docker-compose.yml ✓
├── railway.json ✓
├── .env.example ✓
├── package.json ✓
├── tsconfig.json ✓
└── README.md ✓
```

## 2. Import Path Verification

### Correct Patterns:
- `../../config/` - From submodules to config
- `../../email/` - From submodules to email
- `../../storage/` - From submodules to storage
- `../services/` - From controller to sibling service
- `../dto/` - From controller/service to sibling dto
- `../strategies/` - From module to strategies
- `../guards/` - From controller to guards
- `../../common/` - From controller to common decorators

### All Verified ✓

## 3. Required Environment Variables

```env
# Required
DATABASE_URL=postgresql://...
JWT_SECRET=your-secret
JWT_REFRESH_SECRET=your-refresh-secret
AWS_ACCESS_KEY_ID=your-key
AWS_SECRET_ACCESS_KEY=your-secret
AWS_REGION=us-east-1
AWS_S3_BUCKET=your-bucket
OPENAI_API_KEY=your-key
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email
SMTP_PASSWORD=your-password
EMAIL_FROM=noreply@example.com

# Optional (with defaults)
NODE_ENV=development
PORT=3000
FRONTEND_URL=http://localhost:3001
JWT_EXPIRATION=3600
JWT_REFRESH_EXPIRATION=604800
```

## 4. Setup Commands (Run in Order)

```bash
# 1. Navigate to project
cd resume-analyzer-backend

# 2. Install dependencies
npm install

# 3. Generate Prisma client
npx prisma generate

# 4. Copy and edit environment file
cp .env.example .env
# Edit .env with your credentials

# 5. Run migrations (requires PostgreSQL)
npx prisma migrate dev

# 6. Start development server
npm run start:dev
```

## 5. API Endpoints

### Auth
- `POST /api/auth/register` - Register
- `POST /api/auth/login` - Login
- `POST /api/auth/refresh` - Refresh token
- `GET /api/auth/google` - Google OAuth
- `GET /api/auth/github` - GitHub OAuth
- `GET /api/auth/verify-email/:token` - Verify email

### Users
- `GET /api/users/profile` - Get profile
- `PATCH /api/users/profile` - Update profile
- `PATCH /api/users/password` - Change password
- `DELETE /api/users/account` - Delete account

### Resumes
- `POST /api/resumes/upload` - Upload resume (5MB max, PDF/DOCX)
- `GET /api/resumes` - List resumes
- `GET /api/resumes/:id` - Get details
- `GET /api/resumes/:id/download` - Get download URL
- `DELETE /api/resumes/:id` - Delete resume

### Jobs
- `POST /api/jobs` - Create job
- `GET /api/jobs` - List jobs
- `GET /api/jobs/:id` - Get details
- `PATCH /api/jobs/:id` - Update job
- `DELETE /api/jobs/:id` - Delete job

### Analysis
- `POST /api/analysis/analyze` - Analyze resume
- `POST /api/analysis/match` - Match resume to job
- `GET /api/analysis/history` - Get history
- `GET /api/analysis/:id` - Get result

## 6. Testing the API

After starting the server:
1. Open http://localhost:3000/api/docs
2. Use Swagger UI to test endpoints
3. First register a user: `POST /api/auth/register`
4. Then login: `POST /api/auth/login`
5. Use the JWT token in Authorization header

## 7. Common Issues

### Issue: TypeScript errors
```bash
# Ensure TypeScript is installed
npm install typescript@5.1.3 --save-dev

# Regenerate Prisma client
npx prisma generate
```

### Issue: Database connection
```bash
# Check PostgreSQL is running
# Verify DATABASE_URL is correct in .env
# Test connection
npx prisma db push
```

### Issue: AWS S3 upload fails
```bash
# Ensure bucket exists
# Verify AWS credentials have S3 permissions
# Check bucket region matches AWS_REGION
```

### Issue: OpenAI API errors
```bash
# Verify API key is correct
# Check account has credits
# Ensure model gpt-3.5-turbo is available
```
