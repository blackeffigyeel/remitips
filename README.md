# Remitips

**Remitips** is a full-stack remittance comparison platform that helps users find the best exchange rates and lowest fees across multiple money transfer services. This repository contains both the **frontend** (Next.js) and **backend** (Node.js + Express + PostgreSQL) projects.

## 🚀 Features

* Compare real-time exchange rates across 9+ major remittance platforms
* View historical trends and platform performance metrics
* Automatic scheduling for data cleanup and reports
* Robust security and validation
* Full Docker and Docker Compose setup for development and production

## 📁 Project Structure

```
/frontend        # Next.js frontend application
/backend         # Node.js backend API
/backend/docs    # API docs, integration guides, and README
```

## 🏗️ Tech Stack

* **Frontend**: Next.js, React, TypeScript
* **Backend**: Node.js, Express, TypeScript, PostgreSQL, Prisma
* **External APIs**: 9 remittance platforms (Wise, Remitly, MoneyGram, etc.)
* **DevOps**: Docker, Docker Compose
* **Testing**: Jest, Supertest
* **Monitoring & Logging**: Winston

## ⚡ Getting Started

### Prerequisites

* Node.js 18+
* PostgreSQL 14+ (cloud-hosted recommended)
* Docker & Docker Compose (optional for containerized setup)

### Run Locally (Docker)

1. Copy environment files:

```bash
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env
```

2. Build and run with Docker Compose:

```bash
docker compose up --build
```

* Backend will be available at `http://localhost:9101`
* Frontend will be available at `http://localhost:3000`

### Run Locally (without Docker)

**Backend**:

```bash
cd backend
npm install
npm run dev
```

**Frontend**:

```bash
cd frontend
npm install
npm run dev
```

## 📚 Documentation

* Backend API docs: [`/backend/docs/README.md`](./backend/docs/README.md)
* Frontend docs: [`/frontend/README.md`](./frontend/README.md)

## 📦 Deployment

* Frontend can be deployed on **Vercel**
* Backend can be deployed on **Render** or similar cloud providers

## 🤝 Contributing

* Fork the repo
* Create a feature branch
* Commit your changes with meaningful messages
* Push and open a Pull Request

---

**This README is a general overview for visitors.** For detailed setup, configuration, and API usage, please refer to the respective `/backend` and `/frontend` READMEs.