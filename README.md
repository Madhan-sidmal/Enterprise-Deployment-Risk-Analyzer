<div align="center">

<img src="https://img.shields.io/badge/EDRA-Enterprise%20Deployment%20Risk%20Analyzer-6366f1?style=for-the-badge&logo=shield&logoColor=white" />

<br/><br/>

[![CI/CD](https://github.com/Madhan-sidmal/Enterprise-Deployment-Risk-Analyzer/actions/workflows/ci-cd.yml/badge.svg)](https://github.com/Madhan-sidmal/Enterprise-Deployment-Risk-Analyzer/actions/workflows/ci-cd.yml)
[![Java](https://img.shields.io/badge/Java-21-ED8B00?style=flat&logo=openjdk&logoColor=white)](https://openjdk.org/projects/jdk/21/)
[![Spring Boot](https://img.shields.io/badge/Spring%20Boot-3.2-6DB33F?style=flat&logo=springboot&logoColor=white)](https://spring.io/projects/spring-boot)
[![React](https://img.shields.io/badge/React-18-61DAFB?style=flat&logo=react&logoColor=black)](https://react.dev)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-4169E1?style=flat&logo=postgresql&logoColor=white)](https://postgresql.org)
[![Docker](https://img.shields.io/badge/Docker-Compose-2496ED?style=flat&logo=docker&logoColor=white)](https://docs.docker.com/compose/)
[![License](https://img.shields.io/badge/License-MIT-green?style=flat)](LICENSE)

<br/>

> **A full-stack DevSecOps Intelligence Platform that analyzes deployment packages before production release,  
> scores risk, detects dependency conflicts, simulates rollbacks, and enforces approval workflows.**

</div>

---

## 📋 Table of Contents

- [Overview](#-overview)
- [Features](#-features)
- [Tech Stack](#-tech-stack)
- [Architecture](#-architecture)
- [Quick Start](#-quick-start)
- [Docker Setup](#-docker-setup)
- [API Reference](#-api-reference)
- [User Roles](#-user-roles)
- [Project Structure](#-project-structure)
- [CI/CD Pipeline](#-cicd-pipeline)
- [Phase Progress](#-phase-progress)
- [Screenshots](#-screenshots)

---

## 🌟 Overview

**EDRA (Enterprise Deployment Risk Analyzer)** is a production-grade DevSecOps platform built to give engineering teams **full visibility and control** before any deployment reaches production.

It combines risk intelligence, dependency analysis, rollback planning, and approval governance into a single unified dashboard — designed for **Developers**, **Release Managers**, and **Administrators**.

---

## ✨ Features

| Feature | Description |
|---------|------------|
| 🔐 **JWT Auth + RBAC** | Secure login with role-based access (Admin, Release Manager, Developer) |
| 📦 **Deployment Management** | Create, track, and manage deployments through their full lifecycle |
| ⚠️ **Risk Scoring Engine** | 5-factor weighted algorithm scores deployment risk 0–100 |
| 🌐 **Dependency Analyzer** | DFS-based cycle detection, version mismatch and missing dependency detection with canvas graph |
| 🔁 **Rollback Simulator** | Auto-generates 11-step runbooks with feasibility scores and downtime estimates |
| ✅ **Approval Workflow** | Release Managers approve/reject deployments with mandatory comment trail |
| 📜 **Audit Logs** | Immutable, paginated, searchable audit trail of every system event |
| 📊 **Analytics Dashboard** | Real-time SVG charts for deployment, risk, and approval metrics |
| 🐳 **Docker** | Multi-stage builds for backend and frontend, full docker-compose orchestration |
| 🚀 **GitHub Actions CI/CD** | 4-job pipeline with test, build, Docker push, and Trivy security scan |

---

## 🛠️ Tech Stack

### Backend
| Technology | Version | Purpose |
|-----------|---------|---------|
| Java | 21 | Core language |
| Spring Boot | 3.2 | REST API framework |
| Spring Security | 6 | Authentication & authorization |
| Spring Data JPA | 3.2 | ORM & database access |
| PostgreSQL | 16 | Primary database |
| JWT (jjwt) | 0.11.5 | Stateless authentication tokens |
| Lombok | Latest | Boilerplate reduction |
| Spring Actuator | 3.2 | Health checks & monitoring |

### Frontend
| Technology | Version | Purpose |
|-----------|---------|---------|
| React | 18 | UI framework |
| Vite | 5 | Build tool & dev server |
| React Router | v6 | Client-side routing |
| Axios | Latest | HTTP client |
| Vanilla CSS | — | Custom design system (no Tailwind) |

### DevOps
| Technology | Purpose |
|-----------|---------|
| Docker + Compose | Containerization & orchestration |
| GitHub Actions | CI/CD pipeline |
| Nginx | Frontend serving & API proxy |
| Trivy | Container vulnerability scanning |
| H2 | In-memory DB for CI tests |

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                        Browser                              │
│                   React 18 + Vite (SPA)                     │
│              http://localhost:3000 (or 5173 dev)            │
└──────────────────────────┬──────────────────────────────────┘
                           │ HTTP / JSON
                           ▼
┌─────────────────────────────────────────────────────────────┐
│                    Nginx (Docker)                           │
│   • Serves React static files                              │
│   • Proxies /api/* → edra-backend:8080                     │
└──────────────────────────┬──────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────┐
│              Spring Boot REST API (Port 8080)               │
│                                                             │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐  │
│  │   Auth   │  │ Deploy   │  │   Risk   │  │  Audit   │  │
│  │Controller│  │Controller│  │Controller│  │Controller│  │
│  └────┬─────┘  └────┬─────┘  └────┬─────┘  └────┬─────┘  │
│       │              │              │              │        │
│  ┌────▼──────────────▼──────────────▼──────────────▼─────┐ │
│  │           Spring Security + JWT Filter                 │ │
│  └────────────────────────┬───────────────────────────────┘ │
│                           │                                  │
│  ┌────────────────────────▼───────────────────────────────┐ │
│  │              Spring Data JPA (Hibernate)               │ │
│  └────────────────────────┬───────────────────────────────┘ │
└───────────────────────────┼──────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                  PostgreSQL 16 (Port 5432)                  │
│  Tables: users, deployments, risk_scores, audit_logs,      │
│          dependency_analyses, rollback_plans, approval_     │
│          records                                            │
└─────────────────────────────────────────────────────────────┘
```

---

## 🚀 Quick Start

### Prerequisites
- Java 21+
- Node.js 20+
- PostgreSQL 16+
- Maven 3.9+

### 1. Clone the repository
```bash
git clone https://github.com/Madhan-sidmal/Enterprise-Deployment-Risk-Analyzer.git
cd Enterprise-Deployment-Risk-Analyzer
```

### 2. Setup PostgreSQL database
```bash
psql -U postgres -c "CREATE DATABASE edra_db;"
```

### 3. Start the Backend
```bash
cd edra-backend
mvn spring-boot:run
# API runs at: http://localhost:8080
```

### 4. Start the Frontend
```bash
cd edra-frontend
npm install
npm run dev
# App runs at: http://localhost:5173
```

### 5. Default Login Credentials
| Role | Username | Password |
|------|---------|----------|
| Admin | `admin` | `Admin@123` |
| Release Manager | `manager` | `Manager@123` |
| Developer | `developer` | `Developer@123` |

---

## 🐳 Docker Setup

The easiest way to run the complete stack:

```bash
# Clone and run everything in one command
git clone https://github.com/Madhan-sidmal/Enterprise-Deployment-Risk-Analyzer.git
cd Enterprise-Deployment-Risk-Analyzer
docker-compose up --build
```

| Service | URL |
|---------|-----|
| 🌐 Frontend | http://localhost:3000 |
| ⚙️ Backend API | http://localhost:8080 |
| 🗄️ PostgreSQL | localhost:5432 |
| ❤️ Health Check | http://localhost:8080/actuator/health |

### Environment Variables (optional overrides)
```env
JWT_SECRET=your-super-secret-key
JWT_EXPIRATION_MS=86400000
SPRING_DATASOURCE_URL=jdbc:postgresql://edra-db:5432/edra_db
SPRING_DATASOURCE_USERNAME=edra_user
SPRING_DATASOURCE_PASSWORD=edra_secret
```

---

## 📡 API Reference

### Authentication
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| `POST` | `/api/auth/register` | Public | Register new user |
| `POST` | `/api/auth/login` | Public | Login → returns JWT token |
| `GET` | `/api/auth/me` | 🔒 Bearer | Get current user info |

### Deployments
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| `GET` | `/api/deployments` | 🔒 Bearer | List all deployments |
| `POST` | `/api/deployments` | 🔒 Bearer | Create deployment |
| `GET` | `/api/deployments/{id}` | 🔒 Bearer | Get deployment details |
| `PUT` | `/api/deployments/{id}` | 🔒 Bearer | Update deployment |
| `DELETE` | `/api/deployments/{id}` | 🔒 Bearer | Delete deployment |
| `PATCH` | `/api/deployments/{id}/submit` | 🔒 Bearer | Submit for review |

### Risk Analysis
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| `POST` | `/api/risk/analyze/{deploymentId}` | 🔒 Bearer | Run risk analysis |
| `GET` | `/api/risk/{deploymentId}` | 🔒 Bearer | Get risk score |
| `GET` | `/api/risk` | 🔒 Bearer | All risk scores |
| `GET` | `/api/risk/stats` | 🔒 Bearer | Risk statistics |

### Dependency Analysis
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| `POST` | `/api/dependencies/analyze` | 🔒 Bearer | Run dependency analysis |
| `GET` | `/api/dependencies/{deploymentId}` | 🔒 Bearer | Get analysis result |
| `GET` | `/api/dependencies` | 🔒 Bearer | All analyses |

### Rollback Simulator
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| `POST` | `/api/rollback/simulate` | 🔒 Bearer | Simulate rollback plan |
| `PATCH` | `/api/rollback/{id}/initiate` | 🔒 Bearer | Initiate rollback |
| `GET` | `/api/rollback` | 🔒 Bearer | All rollback plans |
| `GET` | `/api/rollback/stats` | 🔒 Bearer | Rollback statistics |

### Approvals
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| `GET` | `/api/approvals/pending` | 🔒 RM/Admin | Pending review queue |
| `POST` | `/api/approvals/{id}/approve` | 🔒 RM/Admin | Approve deployment |
| `POST` | `/api/approvals/{id}/reject` | 🔒 RM/Admin | Reject deployment |
| `PATCH` | `/api/approvals/{id}/deploy` | 🔒 RM/Admin | Mark as deployed |
| `GET` | `/api/approvals/history` | 🔒 Bearer | Review history |

### Audit Logs
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| `GET` | `/api/audit` | 🔒 Bearer | Paginated audit logs |
| `GET` | `/api/audit/recent` | 🔒 Bearer | Latest 10 events |
| `GET` | `/api/audit/stats` | 🔒 Bearer | Action statistics |
| `GET` | `/api/audit/search?q=` | 🔒 Bearer | Search by entity name |

### Analytics
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| `GET` | `/api/analytics/overview` | 🔒 Bearer | Full analytics overview |

---

## 👥 User Roles

```
ADMIN
├── Full access to all features
├── User management
├── Can approve/reject deployments
└── Sees all deployments

RELEASE_MANAGER
├── Can approve/reject deployments
├── Views pending approval queue
├── Can mark deployments as DEPLOYED
└── Sees all deployments

DEVELOPER
├── Creates and manages own deployments
├── Runs risk analysis and dependency checks
├── Simulates rollback plans
└── Views own deployments only (read-only approval page)
```

---

## 📁 Project Structure

```
Enterprise-Deployment-Risk-Analyzer/
│
├── .github/
│   └── workflows/
│       └── ci-cd.yml                 # GitHub Actions CI/CD pipeline
│
├── docker-compose.yml                # Full-stack Docker orchestration
│
├── edra-backend/                     # Spring Boot REST API
│   ├── Dockerfile                    # Multi-stage Java build
│   ├── pom.xml
│   └── src/
│       ├── main/java/com/edra/
│       │   ├── EdraApplication.java
│       │   ├── config/
│       │   │   └── SecurityConfig.java
│       │   ├── controller/           # 8 REST controllers
│       │   │   ├── AuthController.java
│       │   │   ├── DeploymentController.java
│       │   │   ├── RiskAnalysisController.java
│       │   │   ├── DependencyController.java
│       │   │   ├── RollbackController.java
│       │   │   ├── ApprovalController.java
│       │   │   ├── AuditLogController.java
│       │   │   └── AnalyticsController.java
│       │   ├── model/                # 12 JPA entities + enums
│       │   ├── repository/           # 7 JPA repositories
│       │   ├── service/              # 8 business services
│       │   ├── security/             # JWT filter + utils
│       │   └── payload/              # Request/Response DTOs
│       ├── main/resources/
│       │   └── application.properties
│       └── test/
│           ├── java/com/edra/
│           │   └── EdraApplicationTests.java
│           └── resources/
│               └── application.properties  # H2 in-memory for CI
│
└── edra-frontend/                    # React + Vite SPA
    ├── Dockerfile                    # Multi-stage React + Nginx build
    ├── nginx.conf                    # SPA routing + API proxy
    ├── package.json
    └── src/
        ├── pages/                    # 10 full pages
        │   ├── Login.jsx
        │   ├── Register.jsx
        │   ├── Dashboard.jsx
        │   ├── Deployments.jsx
        │   ├── CreateDeployment.jsx
        │   ├── DeploymentDetails.jsx
        │   ├── RiskAnalysis.jsx
        │   ├── Dependencies.jsx
        │   ├── Rollback.jsx
        │   ├── Approvals.jsx
        │   ├── AuditLogs.jsx
        │   └── Analytics.jsx
        ├── components/               # Sidebar, guards, widgets
        ├── services/                 # 8 Axios API service files
        ├── context/                  # AuthContext (JWT management)
        └── styles/                   # Design system CSS variables
```

---

## 🚀 CI/CD Pipeline

The GitHub Actions pipeline runs automatically on every push to `main`:

```
Push to main
     │
     ├──► 🔧 Backend Build & Test
     │         Java 21, Maven, H2 in-memory tests
     │         ~1 min
     │
     └──► 🎨 Frontend Build & Lint
               Node 20, npm ci, Vite build
               ~30 sec
                    │
                    ▼ (both pass)
          🐳 Docker Build & Push
               Multi-stage builds → GHCR
               Layer caching (GHA cache)
                    │
                    ▼
          🔒 Security Scan (Trivy)
               CRITICAL/HIGH CVE detection
               SARIF → GitHub Security tab
```

**Pull the Docker images:**
```bash
docker pull ghcr.io/madhan-sidmal/enterprise-deployment-risk-analyzer/edra-backend:latest
docker pull ghcr.io/madhan-sidmal/enterprise-deployment-risk-analyzer/edra-frontend:latest
```

---

## 📊 Phase Progress

| Phase | Feature | Status | Commit |
|-------|---------|--------|--------|
| **1** | Foundation — JWT Auth, RBAC, User management | ✅ Complete | `Phase 1` |
| **2** | Deployment Module — CRUD, submit workflow | ✅ Complete | `Phase 2` |
| **3** | Risk Scoring Engine — 5-factor analysis, SVG gauge | ✅ Complete | `Phase 3` |
| **4** | Dependency Conflict Analyzer — DFS, canvas graph | ✅ Complete | `Phase 4` |
| **5** | Rollback Simulator — runbook generator, feasibility | ✅ Complete | `Phase 5` |
| **6** | Approval Workflow — approve/reject, comment modal | ✅ Complete | `Phase 6` |
| **7** | Audit Logs — async write, search, paginated | ✅ Complete | `Phase 7-10` |
| **8** | Analytics Dashboard — SVG charts, KPIs | ✅ Complete | `Phase 7-10` |
| **9** | Dockerization — multi-stage builds, compose | ✅ Complete | `Phase 7-10` |
| **10** | GitHub Actions CI/CD + Trivy scan | ✅ Complete | `Phase 7-10` |

---

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/your-feature-name`
3. Commit your changes: `git commit -m "feat: add your feature"`
4. Push to the branch: `git push origin feature/your-feature-name`
5. Open a Pull Request

---

## 📄 License

This project is licensed under the MIT License.

---

<div align="center">

Built with ❤️ as a complete DevSecOps Intelligence Platform

⭐ **Star this repo** if you found it useful!

[![GitHub](https://img.shields.io/badge/GitHub-Madhan--sidmal-181717?style=flat&logo=github)](https://github.com/Madhan-sidmal/Enterprise-Deployment-Risk-Analyzer)

</div>
