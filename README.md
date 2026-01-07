# Resume Analyzer Backend

A REST API built with NestJS for analyzing resumes and matching them with job descriptions using AI.

## Project Features and Goals

### Core Features

1. **User Authentication**
   - JWT-based authentication with email/password
   - OAuth integration (Google, GitHub)
   - Secure token refresh mechanism
   - Email verification
   - Password reset functionality

2. **Resume Management**
   - Upload PDF resumes (max 5MB)
   - Store and retrieve resumes via AWS S3
   - List and manage user's resumes
   - Automatic text extraction from PDFs

3. **Job Description Management**
   - Create and store job descriptions
   - Track job requirements, location, salary
   - Full CRUD operations

4. **AI-Powered Resume Analysis**
   - **Resume Quality Analysis**: Evaluates skill coverage, experience relevance, ATS compatibility, and clarity/structure
   - **Job Matching**: Compares resumes against job descriptions
   - **Gap Detection**: Identifies missing skills, underrepresented experience, and weak keywords
   - **Suggestions**: Provides actionable recommendations for improvement
   - Uses Google Gemini 2.5 Flash (free tier available)

5. **Email Notifications**
   - Account verification emails
   - Password reset emails
   - Analysis completion notifications

### Project Goals

- Provide a scalable backend for resume analysis
- Enable AI-driven insights for job seekers
- Support integration with any frontend framework
- Maintain security and performance best practices
- Offer free AI analysis using Google Gemini

---

## Frontend Development Guide

### API Base URL

```
Development: http://localhost:3000/api
Production:  https://your-api-domain.com/api
```

### Authentication Flow

1. **Register**: `POST /auth/register`

   ```json
   {
     "email": "user@example.com",
     "password": "SecurePass123",
     "firstName": "John",
     "lastName": "Doe"
   }
   ```

2. **Login**: `POST /auth/login`

   ```json
   {
     "email": "user@example.com",
     "password": "SecurePass123"
   }
   ```

3. **Use Access Token**: Include in headers for protected routes
   ```
   Authorization: Bearer <access_token>
   ```

### API Endpoints

#### Authentication

| Method | Endpoint         | Description               |
| ------ | ---------------- | ------------------------- |
| POST   | `/auth/register` | Register new user         |
| POST   | `/auth/login`    | Login with email/password |
| POST   | `/auth/refresh`  | Refresh access token      |
| GET    | `/auth/google`   | Initiate Google OAuth     |
| GET    | `/auth/github`   | Initiate GitHub OAuth     |
| GET    | `/auth/me`       | Get current user info     |

#### Users

| Method | Endpoint          | Description      |
| ------ | ----------------- | ---------------- |
| GET    | `/users/profile`  | Get user profile |
| PATCH  | `/users/profile`  | Update profile   |
| PATCH  | `/users/password` | Change password  |
| DELETE | `/users/account`  | Delete account   |

#### Resumes

| Method | Endpoint                | Description                                 |
| ------ | ----------------------- | ------------------------------------------- |
| POST   | `/resumes/upload`       | Upload resume (multipart/form-data)         |
| GET    | `/resumes`              | List resumes (pagination: ?page=1&limit=10) |
| GET    | `/resumes/:id`          | Get resume details                          |
| GET    | `/resumes/:id/download` | Get download URL                            |
| DELETE | `/resumes/:id`          | Delete resume                               |

#### Jobs

| Method | Endpoint    | Description                              |
| ------ | ----------- | ---------------------------------------- |
| POST   | `/jobs`     | Create job description                   |
| GET    | `/jobs`     | List jobs (pagination: ?page=1&limit=10) |
| GET    | `/jobs/:id` | Get job details                          |
| PATCH  | `/jobs/:id` | Update job                               |
| DELETE | `/jobs/:id` | Delete job                               |

#### Analysis

| Method | Endpoint            | Description                              |
| ------ | ------------------- | ---------------------------------------- |
| POST   | `/analysis/match`   | Match resume to job (returns result)     |
| POST   | `/analysis/quality` | Analyze resume quality (returns metrics) |

### Analysis Response Examples

#### Match Resume to Job (`POST /analysis/match`)

```json
{
  "resumeId": "550e8400-e29b-41d4-a716-446655440000",
  "fileName": "john_doe_resume.pdf",
  "jobId": "550e8400-e29b-41d4-a716-446655440001",
  "jobTitle": "Senior Software Engineer",
  "company": "Tech Corp",
  "matchScore": 85,
  "matchedSkills": ["TypeScript", "React", "Node.js", "PostgreSQL"],
  "missingSkills": ["Docker", "Kubernetes", "AWS"],
  "experienceMatch": "Strong experience matching 7 out of 10 requirements",
  "recommendations": "Add Docker and AWS experience to strengthen your application",
  "summary": "Strong candidate with excellent technical skills. Consider adding cloud and container experience.",
  "quality": {
    "skillCoverage": 85,
    "experienceRelevance": 82,
    "atsCompatibility": 90,
    "clarityStructure": 88,
    "overallScore": 86.25
  },
  "gaps": {
    "missingSkills": ["Docker", "Kubernetes", "AWS"],
    "underrepresentedExperience": [
      "Cloud architecture",
      "Container orchestration"
    ],
    "weakKeywords": ["microservices", "CI/CD", "DevOps"]
  },
  "suggestions": {
    "resumeImprovement": [
      "Add quantifiable achievements with metrics",
      "Include specific technologies in project descriptions"
    ],
    "skillRecommendations": ["Docker", "Kubernetes", "AWS", "Terraform"],
    "keywordEnhancement": [
      "microservices",
      "CI/CD pipeline",
      "DevOps",
      "containerization"
    ]
  }
}
```

#### Analyze Resume Quality (`POST /analysis/quality`)

```json
{
  "resumeId": "550e8400-e29b-41d4-a716-446655440000",
  "fileName": "john_doe_resume.pdf",
  "quality": {
    "skillCoverage": 85,
    "experienceRelevance": 78,
    "atsCompatibility": 92,
    "clarityStructure": 88,
    "overallScore": 85.75
  },
  "gaps": {
    "missingSkills": ["Docker", "Kubernetes", "GraphQL"],
    "underrepresentedExperience": ["Cloud architecture", "System design"],
    "weakKeywords": ["microservices", "CI/CD", "AWS"]
  },
  "suggestions": {
    "resumeImprovement": [
      "Add quantifiable achievements with metrics",
      "Include specific technologies in project descriptions",
      "Use action verbs at the start of bullet points"
    ],
    "skillRecommendations": ["Docker", "Kubernetes", "AWS", "GraphQL", "Redis"],
    "keywordEnhancement": [
      "microservices",
      "CI/CD",
      "REST API",
      "system design"
    ]
  }
}
```

### Quality Metrics Explained

| Metric                  | Description                                                        |
| ----------------------- | ------------------------------------------------------------------ |
| **skillCoverage**       | How well skills are documented and relevant (0-100)                |
| **experienceRelevance** | Experience clarity and job relevance (0-100)                       |
| **atsCompatibility**    | ATS-friendly structure and keywords (0-100)                        |
| **clarityStructure**    | Readability and organization (0-100)                               |
| **overallScore**        | Weighted average (skill 30%, experience 30%, ATS 20%, clarity 20%) |

### Frontend Integration Tips

1. **Handle Authentication**
   - Store tokens securely (localStorage or secure cookie)
   - Include Authorization header with Bearer token
   - Handle 401 responses by refreshing token or redirecting to login

2. **Upload Resumes**
   - Use `multipart/form-data` for file upload
   - Set `Content-Type: multipart/form-data`
   - Handle large files with progress indicator

3. **Analysis Display**
   - Show match score as progress bar or percentage
   - Display quality metrics as radar chart or progress bars
   - List gaps and suggestions in readable format
   - Allow sorting/filtering by job match score

4. **Error Handling**
   - Handle 400 Bad Request (validation errors)
   - Handle 401 Unauthorized (invalid/expired token)
   - Handle 403 Forbidden (not authorized)
   - Handle 404 Not Found (resource doesn't exist)
   - Handle 429 Too Many Requests (rate limiting)

### Environment Variables (for Frontend Reference)

| Variable       | Description                                             |
| -------------- | ------------------------------------------------------- |
| `FRONTEND_URL` | Frontend application URL (for CORS and OAuth callbacks) |

### Rate Limiting

- Default: 100 requests per 60 seconds
- Returns 429 status when exceeded

### API Documentation

Interactive API documentation available at:

- Development: `http://localhost:3000/api/docs`
- Production: `https://your-api-domain.com/api/docs`

### Tech Stack

- **Framework**: NestJS 10 + TypeScript
- **Database**: PostgreSQL + Prisma ORM
- **Storage**: AWS S3
- **AI**: Google Gemini 2.5 Flash (free tier)
- **Email**: Gmail SMTP
- **Deployment**: Docker, Railway

---

## Getting Started

### Prerequisites

- Node.js 20+
- PostgreSQL database
- AWS S3 bucket
- Google Gemini API key (free at aistudio.google.com)
- Google OAuth credentials (optional)
- GitHub OAuth credentials (optional)

### Installation

```bash
# Install dependencies
npm install

# Set up environment variables
cp .env.example .env
# Edit .env with your configuration

# Generate Prisma client
npx prisma generate

# Run database migrations
npx prisma migrate dev

# Start development server
npm run start:dev
```

### Docker

```bash
docker-compose up -d
```

---

## License

MIT
