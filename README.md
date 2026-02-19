# Mindelta - Professional Learning Platform

## Overview
Mindelta is a next-generation, self-paced professional-learning platform that combines cinematic course production with AI-driven micro-pacing, verifiable blockchain credentials, and deep analytics to maximize learner completion and on-the-job impact.

## Architecture
- **Frontend**: React + Next.js (SSR), Tailwind UI, PWA
- **Backend**: Node.js (NestJS) microservices, MySQL, Redis cache, Bull queues
- **Video**: AWS Elemental MediaConvert (HLS adaptive), CloudFront CDN
- **AI**: OpenAI GPT-4o via Azure, vector store in Pinecone
- **Blockchain**: Solidity contract on Polygon, metadata stored on IPFS
- **Infrastructure**: Terraform, Kubernetes (EKS), GitHub Actions CI/CD

## Project Structure
```
mindelta/
├── frontend/           # Next.js React application
├── backend/           # NestJS API services
├── shared/            # Shared types and utilities
├── infrastructure/    # Terraform IaC
├── contracts/         # Solidity smart contracts
└── docs/             # Documentation
```

## Quick Start

### Prerequisites
- Node.js 18+
- MySQL
- Redis 6+
- Docker & Docker Compose

### Development Setup
1. Clone the repository
2. Install dependencies: `npm run install:all`
3. Start services: `docker-compose up -d`
4. Run migrations: `npm run db:migrate`
5. Start development: `npm run dev`

## Goals & Metrics
- **G1**: ≥ 50,000 learner accounts with ≥ 70% monthly active
- **G2**: ≥ 90% of learners who start a course reach the final exam
- **G3**: ≥ 85% of certificates are successfully verified by external recruiters
- **G4**: Net Promoter Score ≥ 65
- **G5**: Instructor-side GM ≥ 40% revenue share

## Target Audiences
- **Primary**: Mid-career tech professionals (25-45) seeking reskilling & micro-certs
- **Secondary**: Enterprise L&D departments (team licenses)
- **Tertiary**: Independent subject-matter experts monetizing courses

## License
MIT License - See LICENSE file for details
