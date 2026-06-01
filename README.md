# Enterprise Deployment Risk Analyzer (EDRA)

> A DevSecOps Intelligence Platform that analyzes deployment packages before production release and predicts deployment risks.

[![Phase](https://img.shields.io/badge/Phase-1%20Complete-brightgreen)](./EDRA_PROJECT_PLAN.md)
[![Stack](https://img.shields.io/badge/Stack-Spring%20Boot%20%7C%20React%20%7C%20PostgreSQL-blue)](.)
[![Auth](https://img.shields.io/badge/Auth-JWT%20%2B%20RBAC-orange)](.)

---

## 🏗️ Architecture

```
edra-backend/    — Java Spring Boot REST API (Port 8080)
edra-frontend/   — React.js + Vite (Port 5173)
PostgreSQL        — Database (Port 5432)
```

---

## 🚀 Quick Start

### Backend
```bash
# Create PostgreSQL database
psql -U postgres -c "CREATE DATABASE edra_db;"

# Run Spring Boot
cd edra-backend
mvn spring-boot:run
```

### Frontend
```bash
cd edra-frontend
npm run dev
```

Visit: **http://localhost:5173**

---

## 📋 Phase Progress

| Phase | Feature | Status |
|-------|---------|--------|
| **1** | Foundation + JWT Auth + RBAC | ✅ Complete |
| **2** | Deployment Upload Module | 🔜 Next |
| **3** | Risk Scoring Engine | ⏳ Pending |
| **4** | Dependency Analyzer | ⏳ Pending |
| **5** | Rollback Simulator | ⏳ Pending |
| **6** | Approval Workflow | ⏳ Pending |
| **7** | Audit Logging | ⏳ Pending |
| **8** | Analytics Dashboard | ⏳ Pending |
| **9** | Dockerization | ⏳ Pending |
| **10** | GitHub Actions CI/CD | ⏳ Pending |

---

## 👥 Roles

- **DEVELOPER** — Creates deployments
- **RELEASE_MANAGER** — Approves deployments  
- **ADMIN** — Full access

---

## 🔐 API Endpoints

| Method | Endpoint | Auth |
|--------|----------|------|
| POST | `/api/auth/register` | Public |
| POST | `/api/auth/login` | Public |
| GET | `/api/auth/me` | Bearer Token |
| GET | `/api/users/profile` | Bearer Token |
| GET | `/api/users` | ADMIN only |

---

## 🛠️ Tech Stack

- **Backend**: Java 17, Spring Boot 3.2, Spring Security, JWT
- **Frontend**: React 18, Vite, React Router v6, Axios
- **Database**: PostgreSQL 14
- **Auth**: JWT + Role-Based Access Control
