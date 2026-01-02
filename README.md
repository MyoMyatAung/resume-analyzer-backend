# Resume Analyzer Backend

A REST API built with NestJS for analyzing resumes and matching them with job descriptions.

## Features

- **User Authentication**: JWT-based authentication with email/password and OAuth (Google, GitHub)
- **Resume Management**: Upload, store, and manage resumes (max 5MB, PDF/DOCX)
- **Job Descriptions**: Create and manage job descriptions
- **AI-Powered Analysis**: Uses OpenAI GPT-3.5-turbo to analyze resumes and match with jobs
- **Email Notifications**: Verification emails, password reset, analysis completion
- **Rate Limiting**: Configurable rate limiting to prevent abuse
- **API Documentation**: Swagger/OpenAPI documentation

## Tech Stack

- **Framework**: NestJS 10 + TypeScript
- **Database**: PostgreSQL + Prisma ORM
- **Storage**: AWS S3
- **AI**: OpenAI GPT-3.5-turbo
- **Email**: Gmail SMTP
- **Deployment**: Docker + Railway

## Getting Started

### Prerequisites

- Node.js 20+
- PostgreSQL
- AWS S3 Bucket
- OpenAI API Key
- Google OAuth Credentials (optional)
- GitHub OAuth Credentials (optional)

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd resume-analyzer-backend
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
```bash
cp .env.example .env
# Edit .env with your configuration
```

4. Run database migrations:
```bash
npx prisma migrate dev
```

5. Start the development server:
```bash
npm run start:dev
```

The API will be available at `http://localhost:3000`
API documentation at `http://localhost:3000/api/docs`

### Docker Deployment

```bash
docker-compose up -d
```

### Railway Deployment

1. Push to GitHub
2. Connect repository to Railway
3. Add PostgreSQL plugin
4. Set environment variables
5. Deploy

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login
- `POST /api/auth/refresh` - Refresh token
- `GET /api/auth/google` - Google OAuth
- `GET /api/auth/github` - GitHub OAuth

### Users
- `GET /api/users/profile` - Get profile
- `PATCH /api/users/profile` - Update profile
- `PATCH /api/users/password` - Change password
- `DELETE /api/users/account` - Delete account

### Resumes
- `POST /api/resumes/upload` - Upload resume
- `GET /api/resumes` - List resumes
- `GET /api/resumes/:id` - Get resume details
- `GET /api/resumes/:id/download` - Get download URL
- `DELETE /api/resumes/:id` - Delete resume

### Jobs
- `POST /api/jobs` - Create job description
- `GET /api/jobs` - List job descriptions
- `GET /api/jobs/:id` - Get job details
- `PATCH /api/jobs/:id` - Update job
- `DELETE /api/jobs/:id` - Delete job

### Analysis
- `POST /api/analysis/analyze` - Analyze resume
- `POST /api/analysis/match` - Match resume to job
- `GET /api/analysis/history` - Get analysis history
- `GET /api/analysis/:id` - Get analysis result

## Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| NODE_ENV | Environment (development/production) | No |
| PORT | Server port | No |
| FRONTEND_URL | Frontend application URL | Yes |
| DATABASE_URL | PostgreSQL connection string | Yes |
| JWT_SECRET | JWT signing secret | Yes |
| JWT_REFRESH_SECRET | JWT refresh token secret | Yes |
| GOOGLE_CLIENT_ID | Google OAuth client ID | No |
| GOOGLE_CLIENT_SECRET | Google OAuth client secret | No |
| GITHUB_CLIENT_ID | GitHub OAuth client ID | No |
| GITHUB_CLIENT_SECRET | GitHub OAuth client secret | No |
| AWS_ACCESS_KEY_ID | AWS access key | Yes |
| AWS_SECRET_ACCESS_KEY | AWS secret key | Yes |
| AWS_REGION | AWS region | Yes |
| AWS_S3_BUCKET | S3 bucket name | Yes |
| OPENAI_API_KEY | OpenAI API key | Yes |
| SMTP_HOST | SMTP host | Yes |
| SMTP_PORT | SMTP port | Yes |
| SMTP_USER | SMTP username | Yes |
| SMTP_PASSWORD | SMTP password | Yes |
| EMAIL_FROM | From email address | Yes |

## License

MIT
