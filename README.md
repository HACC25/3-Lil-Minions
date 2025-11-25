# 3 Lil Minions - Hawaii AI Screening Platform

An AI-powered job application screening and interviewing platform built with Next.js for the Hawaii Annual Coding Challenge 2025.

## Table of Contents

- [Overview](#overview)
- [Prerequisites](#prerequisites)
- [Installation](#installation)
- [Configuration](#configuration)
- [Development](#development)
- [Project Structure](#project-structure)
- [Features](#features)
- [Technology Stack](#technology-stack)
- [Deployment](#deployment)
- [Troubleshooting](#troubleshooting)
- [Contributing](#contributing)
- [License](#license)
- [Support](#support)

## Overview

The Hawaii AI Screening Platform streamlines the recruitment process by leveraging artificial intelligence to conduct automated interviews, analyze resumes, and match candidates with job opportunities. Built for the State of Hawaii Department of Human Resources Development, this platform provides an efficient and accessible solution for both employers and job seekers.

## Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js** (v18.0.0 or higher)
- **npm** (v8.0.0 or higher) or **bun** (recommended)
- **Firebase CLI** (optional, for Firebase operations)

## Installation

### 1. Clone the Repository

```bash
git clone https://github.com/HACC25/3-Lil-Minions.git
cd 3-Lil-Minions
```

### 2. Install Dependencies

Using npm:

```bash
npm install
```

Or using bun (recommended for faster installation):

```bash
bun install
```

## Configuration

### Environment Variables

Create a `.env.local` file in the root directory with the following variables:

```env

# Firebase Admin (Server-side)
FIREBASE_PROJECT_ID=your_project_id
FIREBASE_CLIENT_EMAIL=your_client_email
FIREBASE_PRIVATE_KEY=your_private_key

# API Keys
ELEVENLABS_API_KEY=your_elevenlabs_key
HEYGEN_API_KEY=your_heygen_key
OPENAI_API_KEY=your_openai_key

# Other configurations
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

## Development

### Running the Development Server

Start the development server:

```bash
npm run dev
# or
bun dev
```

The application will be available at [http://localhost:3000](http://localhost:3000)

### Building for Production

To create an optimized production build:

```bash
npm run build
npm run start
# or
bun run build
bun run start
```

### Available Scripts

| Script               | Description                  |
| -------------------- | ---------------------------- |
| `npm run dev`        | Start development server     |
| `npm run build`      | Build for production         |
| `npm run start`      | Start production server      |
| `npm run lint`       | Run ESLint                   |
| `npm run type-check` | Run TypeScript type checking |

## Project Structure

```
3-Lil-Minions/
├── app/                          # Next.js App Router
│   ├── api/                     # API Routes
│   │   ├── analyze-interview/   # Interview analysis endpoints
│   │   ├── applications/        # Application management
│   │   ├── auth/               # Authentication endpoints
│   │   ├── avatar-config/      # HeyGen avatar configuration
│   │   ├── check-eligibility/  # Eligibility verification
│   │   ├── companies/          # Company data management
│   │   ├── did-agent-config/   # D-ID agent configuration
│   │   ├── extract-interview-data/ # Interview data extraction
│   │   ├── get-analysis/       # Analysis retrieval
│   │   ├── get-transcript/     # Transcript retrieval
│   │   ├── interview-bots/     # Interview bot management
│   │   ├── jobs/               # Job posting endpoints
│   │   ├── resume-prefill/     # Resume data prefill
│   │   ├── save-transcript/    # Transcript storage
│   │   ├── text-to-speech/     # TTS conversion
│   │   └── voice-preview/      # Voice preview generation
│   ├── dashboard/              # Company dashboard pages
│   │   └── companies/          # Company management UI
│   ├── interviews/             # Interview flow pages
│   │   ├── [id]/              # Dynamic interview sessions
│   │   ├── congrats/          # Success page
│   │   ├── end/               # Interview completion
│   │   ├── setup/             # Interview setup
│   │   └── start/             # Interview start
│   ├── jobs/                   # Job listing and details
│   │   ├── [jobId]/           # Dynamic job pages
│   │   └── company/           # Company-specific jobs
│   ├── sign-in/                # Sign in page
│   ├── sign-up/                # Sign up page
│   ├── layout.tsx              # Root layout
│   └── page.tsx                # Home page
│
├── components/                  # React Components
│   ├── application-details/    # Application detail views
│   ├── apply/                  # Application flow components
│   ├── auth/                   # Authentication components
│   ├── dashboard/              # Dashboard UI components
│   ├── HeyGenAvatar/           # HeyGen avatar integration
│   ├── home/                   # Home page components
│   ├── interview-bots/         # Interview bot components
│   ├── InterviewAnalytics/     # Analytics and reporting
│   ├── InterviewSession/       # Interview session UI
│   └── modals/                 # Modal dialogs
│
├── firebaseConfig/              # Firebase Configuration
│   ├── auth.ts                 # Firebase Auth setup
│   └── firebase.ts             # Firebase initialization
│
├── hooks/                       # Custom React Hooks
│   ├── useAllCompanies.ts      # Companies data hook
│   ├── useAuthRedirect.ts      # Auth redirect logic
│   ├── useCompanyData.ts       # Company data hook
│   ├── useJob.ts               # Single job hook
│   └── useJobs.ts              # Jobs list hook
│
├── lib/                         # Core Libraries
│   ├── applicant-auth.ts       # Applicant authentication
│   ├── AuthContext.tsx         # Auth context provider
│   ├── firebase-admin.ts       # Firebase Admin SDK
│   ├── formatters.ts           # Data formatters
│   ├── logger.ts               # Logging utility
│   └── email/                  # Email service utilities
│
├── types/                       # TypeScript Type Definitions
│   ├── application.ts          # Application types
│   ├── company.ts              # Company types
│   └── job.ts                  # Job types
│
├── utils/                       # Utility Functions
│   ├── adobe-pdf-extractor.ts  # PDF parsing
│   ├── application-processor.ts # Application processing
│   ├── format-application-data.ts # Data formatting
│   ├── matching-processor.ts   # Job matching logic
│   ├── resumeStorage.ts        # Resume storage
│   ├── styles.ts               # Style utilities
│   ├── agents/                 # AI agent utilities
│   ├── matching/               # Matching algorithms
│   ├── resume-parser/          # Resume parsing
│   └── scoring/                # Scoring algorithms
│
├── public/                      # Static Assets
│   ├── avatars/                # Avatar images
│   ├── *.svg                   # SVG icons
│   ├── *.glb                   # 3D models
│   └── *.png                   # Image assets
│
└── styles/                      # CSS Stylesheets
    ├── globals.css             # Global styles
    └── *.css                   # Component-specific styles
```

## Features

- **AI-Powered Interviews**: Automated video interviews using HeyGen avatars
- **Application Screening**: Intelligent resume analysis and matching
- **Job Matching**: Smart job recommendations based on qualifications
- **Company Dashboard**: Comprehensive applicant management
- **Voice Recognition**: Real-time speech-to-text transcription
- **Email Notifications**: Automated candidate communication
- **Secure Authentication**: Firebase-based user authentication

## Technology Stack

### Core Technologies

- **Framework**: Next.js 15 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS, Bootstrap
- **Animation**: Framer Motion

### Backend Services

- **Database**: Firebase Firestore
- **Storage**: Firebase Storage
- **Authentication**: Firebase Auth

### AI & Machine Learning

- **Language Model**: OpenAI (GPT-4)
- **Avatar Generation**: HeyGen
- **Text-to-Speech**: ElevenLabs

## Deployment

This application is optimized for deployment on Vercel.

### Deploying to Vercel

1. Push your code to GitHub
2. Import your repository in Vercel
3. Configure environment variables in Vercel project settings
4. Deploy

For other platforms, ensure you configure environment variables and build settings appropriately.

## Troubleshooting

### Common Issues

#### Port Already in Use

```bash
# Kill the process using port 3000
npx kill-port 3000

# Or use a different port
PORT=3001 npm run dev
```

#### Firebase Connection Errors

- Verify your Firebase credentials in `.env.local`
- Ensure Firebase project is properly configured
- Check Firebase console for any service issues

#### Build Errors

```bash
# Clear cache and rebuild
rm -rf .next node_modules
npm install
npm run build
```

## Contributing

This project was created for the Hawaii Annual Coding Challenge 2025. For contributions, please follow standard Git workflow:

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Open a Pull Request

## License

This project is part of the Hawaii Annual Coding Challenge 2025.

## Support

For questions or issues, please contact:

- GitHub Issues: [Create an issue](https://github.com/HACC25/3-Lil-Minions/issues)

## Acknowledgments

- Hawaii Annual Coding Challenge 2025
- State of Hawaii Department of Human Resources Development
- All contributing developers and mentors
