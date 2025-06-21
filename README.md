# Mining Stock Analysis App

A full-stack application for analyzing gold and silver mining stocks using value investing principles.

## Features
- Real-time stock metrics
- Value investing analysis (Ben Graham methodology)
- Mining-specific metrics (AISC, production ounces)
- User watchlists
- Comparative analysis

## Tech Stack
- **Frontend**: React, Tailwind CSS, AWS Amplify
- **Backend**: AWS Lambda, API Gateway, DynamoDB
- **Infrastructure**: AWS SAM, CloudFormation
- **CI/CD**: GitHub Actions

## Getting Started

### Prerequisites
- Node.js v16+
- AWS SAM CLI
- AWS account

### Installation
```bash
# Clone repository
git clone https://github.com/alex-whitehouse/mining-stock-app.git
cd mining-stock-app

# Install backend dependencies
cd backend
npm install

# Install frontend dependencies
cd ../frontend
npm install