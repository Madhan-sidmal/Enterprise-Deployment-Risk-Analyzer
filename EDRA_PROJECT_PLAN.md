# Enterprise Deployment Risk Analyzer (EDRA)
## DevSecOps Intelligence Platform — Complete Project Plan

---

## Project Vision

A DevSecOps Intelligence Platform that analyzes deployment packages before production release and predicts deployment risks.

---

## User Roles

1. Developer
2. Release Manager
3. Admin

---

## Workflow

```
Login
 ↓
Upload Deployment Package
 ↓
Dependency Analysis
 ↓
Risk Analysis
 ↓
Rollback Simulation
 ↓
Approval Workflow
 ↓
Deployment Dashboard
 ↓
Audit Logs
```

---

## Tech Stack

- **Backend:** Java Spring Boot
- **Frontend:** React.js
- **Database:** PostgreSQL
- **Auth:** JWT
- **Containerization:** Docker + Docker Compose
- **CI/CD:** GitHub Actions

---

## Phase Tracker

| Phase | Feature                      | Status      |
|-------|------------------------------|-------------|
| 1     | Project Foundation + Auth    | [ ] Pending |
| 2     | Deployment Upload Module     | [ ] Pending |
| 3     | Risk Scoring Engine          | [ ] Pending |
| 4     | Dependency Conflict Analyzer | [ ] Pending |
| 5     | Rollback Simulator           | [ ] Pending |
| 6     | Approval Workflow            | [ ] Pending |
| 7     | Audit Logging                | [ ] Pending |
| 8     | Analytics Dashboard          | [ ] Pending |
| 9     | Dockerization                | [ ] Pending |
| 10    | GitHub Actions CI/CD         | [ ] Pending |
| B1    | AI Risk Prediction           | [ ] Pending |
| B2    | Dependency Graph (React Flow)| [ ] Pending |
| B3    | Notification System          | [ ] Pending |

---

## Phase 1 — Project Foundation

**Goal:** Full-stack skeleton with Authentication

### Backend
- Spring Boot REST APIs
- PostgreSQL integration
- JWT Security (Login, Register)
- Role Based Access Control

### Roles
- ADMIN
- RELEASE_MANAGER
- DEVELOPER

### Database Tables
- `users`
- `roles`

### Frontend Pages
1. Login
2. Register
3. Dashboard

---

## Phase 2 — Deployment Upload Module

**Goal:** Developers can create and manage deployments

### Deployment Fields
- deploymentId
- applicationName
- version
- environment
- deploymentDate
- deploymentDescription

### Status Values
- DRAFT
- PENDING_REVIEW
- APPROVED
- REJECTED
- DEPLOYED

### Database Table
- `deployments`

### Frontend Pages
- Create Deployment Form
- Deployment List Page
- Deployment Details Page

---

## Phase 3 — Risk Scoring Engine

**Goal:** Calculate risk score for each deployment

### Risk Factors & Scoring
| Factor                       | Score |
|------------------------------|-------|
| Modified files > 20          | +20   |
| Production deployment        | +25   |
| Critical config change       | +30   |
| Dependency conflict          | +15   |
| Previous deployment failure  | +10   |

### Risk Categories
| Score  | Category    |
|--------|-------------|
| 0–30   | Low Risk    |
| 31–60  | Medium Risk |
| 61–100 | High Risk   |

### Components
- `RiskScoreService` (Backend)
- Risk Score Widget (Frontend)
- Risk Dashboard Card (Frontend)

---

## Phase 4 — Dependency Conflict Analyzer

**Goal:** Analyze service dependencies and detect conflicts

### Detection
- Missing dependencies
- Circular dependencies
- Version mismatches

### Database Table
- `dependency_analysis`

### Frontend
- Dependency Analysis Dashboard
- Dependency graph
- Detected issues with severity levels

---

## Phase 5 — Rollback Simulator

**Goal:** Simulate rollback impact for each deployment

### Calculations
- Affected services
- Estimated downtime
- Rollback complexity (LOW / MEDIUM / HIGH)

### Database Table
- `rollback_reports`

### Frontend
- Rollback Report Page
- Affected systems view
- Rollback strategy recommendations

---

## Phase 6 — Approval Workflow

**Goal:** Manage deployment approvals

### Rules
- Only RELEASE_MANAGER and ADMIN can approve

### States
- PENDING_REVIEW
- APPROVED
- REJECTED

### Tracked Fields
- Approver
- Timestamp
- Comments

### Database Table
- `deployment_approvals`

### Frontend
- Approval Queue Dashboard

---

## Phase 7 — Audit Logging

**Goal:** Enterprise-grade audit trail

### Tracked Events
- Login
- Deployment creation
- Deployment approval
- Deployment rejection
- Risk analysis

### Stored Fields
- user
- action
- timestamp
- resource

### Database Table
- `audit_logs`

### Frontend
- Audit Dashboard with search and filtering

---

## Phase 8 — Analytics Dashboard

**Goal:** Executive-level insights

### Charts
1. Deployments per month
2. Approval Rate
3. Rejection Rate
4. Risk Distribution
5. Failure Trends

### Tech
- React Chart.js
- Analytics REST APIs (Backend)

---

## Phase 9 — Dockerization

**Goal:** Containerize entire application

### Files to Create
- `Dockerfile` (Frontend)
- `Dockerfile` (Backend)
- `docker-compose.yml`

### Services
- frontend
- backend
- postgres

---

## Phase 10 — GitHub Actions CI/CD

**Goal:** Automated build, test, and deploy pipeline

### Pipeline Steps
1. Build Spring Boot
2. Run Unit Tests
3. Build React App
4. Build Docker Images
5. Push Images
6. Deploy

### Files
- `.github/workflows/ci-cd.yml`

---

## Bonus Features

### B1 — AI Risk Prediction
- ML-based deployment failure probability
- Inputs: deployment history, risk scores, failure history
- Output: failure probability %
- Prediction Dashboard

### B2 — Dependency Graph Visualization
- Interactive graph using React Flow
- Visual service relationships
- Red highlights for conflicts

### B3 — Notification System
- Alerts for:
  - High Risk Deployment detected
  - Deployment approved
  - Deployment rejected
- Email + in-app notifications

---

## Notes
- Complete each phase fully before moving to the next
- Each phase builds on the previous
- Run and test after each phase
