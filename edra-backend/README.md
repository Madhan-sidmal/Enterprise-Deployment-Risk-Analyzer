# Enterprise Deployment Risk Analyzer — Backend

## Phase 1 — Project Foundation
Java Spring Boot backend with JWT Authentication, Role-Based Access Control, and PostgreSQL.

---

## Prerequisites

- Java 17+
- Maven 3.8+
- PostgreSQL 14+

---

## Setup

### 1. Create PostgreSQL Database

```sql
CREATE DATABASE edra_db;
```

### 2. Configure `application.properties`

Update credentials if needed:
```properties
spring.datasource.username=postgres
spring.datasource.password=postgres
```

### 3. Run the Application

```bash
mvn spring-boot:run
```

The app starts at **http://localhost:8080**

---

## API Endpoints

| Method | Endpoint | Access | Description |
|--------|----------|--------|-------------|
| POST | `/api/auth/register` | Public | Register user |
| POST | `/api/auth/login` | Public | Login, returns JWT |
| GET | `/api/auth/me` | Authenticated | Get current user |
| GET | `/api/users` | ADMIN only | List all users |
| GET | `/api/users/profile` | Authenticated | Get own profile |
| GET | `/api/users/dashboard-stats` | Authenticated | Dashboard stats |

---

## Roles

- `ROLE_DEVELOPER` — Default role
- `ROLE_RELEASE_MANAGER` — Can approve deployments
- `ROLE_ADMIN` — Full access

---

## Database Schema

```
users       — id, username, email, password, fullName, createdAt, isActive
roles       — id, name
user_roles  — user_id, role_id
```
