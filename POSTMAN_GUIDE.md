# Postman Collection - Quick Start Guide

## Import Files into Postman

1. Open Postman
2. Click **Import** button
3. Select `postman-collection.json`
4. Click **Import** again
5. Select `postman-environment.json`
6. Click **Import**

## Setup Environment

1. Click the **Environment** dropdown (top right)
2. Select "Resume Analyzer - Development"
3. Click the **eye icon** to view variables
4. Set `baseUrl` to your API URL (default: `http://localhost:3000/api`)

## Testing Workflow

### Step 1: Register a New User
```
POST /api/auth/register
Body: {
    "email": "test@example.com",
    "password": "SecurePass123",
    "firstName": "John",
    "lastName": "Doe"
}
```

### Step 2: Login
```
POST /api/auth/login
Body: {
    "email": "test@example.com",
    "password": "SecurePass123"
}
```

**After login, the response will include:**
- `accessToken` - Copy this to the `accessToken` variable
- `refreshToken` - Copy this to the `refreshToken` variable

### Step 3: Set Access Token
1. Click the environment dropdown
2. Click **Edit** next to "Resume Analyzer - Development"
3. Set `accessToken` to the token from login response
4. Click **Save**

### Step 4: Upload a Resume
```
POST /api/resumes/upload
Body: form-data
Key: file (select a PDF or DOCX file)
```

**After upload, copy the `id` from response to `resumeId` variable**

### Step 5: Create a Job Description
```
POST /api/jobs
Body: {
    "title": "Senior Software Engineer",
    "company": "Tech Corp",
    "description": "Looking for an experienced engineer...",
    "requirements": "5+ years, TypeScript, React",
    "location": "San Francisco, CA",
    "salary": "$150,000 - $200,000"
}
```

**After creation, copy the `id` from response to `jobId` variable**

### Step 6: Analyze Resume
```
POST /api/analysis/analyze
Body: {
    "resumeId": "{{resumeId}}"
}
```

### Step 7: Match Resume to Job
```
POST /api/analysis/match
Body: {
    "resumeId": "{{resumeId}}",
    "jobId": "{{jobId}}"
}
```

**Response includes:**
- `matchScore` - Percentage match (0-100)
- `matchedSkills` - Skills that match
- `missingSkills` - Skills missing from resume
- `experienceMatch` - Experience assessment
- `recommendations` - Suggestions for improvement
- `summary` - Overall summary

## Environment Variables

| Variable | Description | How to Set |
|----------|-------------|------------|
| `baseUrl` | API base URL | Edit environment |
| `accessToken` | JWT access token | From login response |
| `refreshToken` | JWT refresh token | From login response |
| `userId` | Current user ID | From profile response |
| `resumeId` | Uploaded resume ID | From upload response |
| `jobId` | Created job ID | From job creation response |
| `analysisId` | Analysis result ID | From analysis response |

## Collection Structure

```
Resume Analyzer API
├── Authentication
│   ├── Register User
│   ├── Login
│   ├── Refresh Token
│   ├── Verify Email
│   ├── Forgot Password
│   ├── Reset Password
│   ├── Google OAuth
│   ├── GitHub OAuth
│   └── Get Current User
├── Users
│   ├── Get Profile
│   ├── Update Profile
│   ├── Change Password
│   └── Delete Account
├── Resumes
│   ├── Upload Resume
│   ├── List Resumes
│   ├── Get Resume Details
│   ├── Get Resume Download URL
│   └── Delete Resume
├── Jobs
│   ├── Create Job Description
│   ├── List Job Descriptions
│   ├── Get Job Details
│   ├── Update Job Description
│   └── Delete Job Description
└── Analysis
    ├── Analyze Resume
    ├── Match Resume to Job
    ├── Get Analysis History
    └── Get Analysis Result
```

## Tips

1. **Use Tests for Automation**: The collection includes pre-request scripts
2. **Save Responses**: Use Postman's "Save Response" feature to compare results
3. **View Documentation**: Click "View Documentation" in collection for more details
4. **Export Collection**: Export to JSON to share with team members
