# Auth Server

A TypeScript Express authentication service built around PostgreSQL + Prisma, JWTs, OTP email verification, and password reset flows.

This project currently implements:

- user signup with email verification OTP
- sign in with access/refresh tokens
- authenticated profile retrieval via middleware
- forgot password and reset password flows
- token refresh support
- sign out endpoint
- validation and secure password hashing

---

## Tech stack

- Node.js + Express 5
- TypeScript
- Prisma ORM with a contract-based Postgres configuration
- PostgreSQL connection via `@prisma/orm-postgres`
- JWTs via `jose`
- password hashing via `bcryptjs`
- schema validation via `zod`
- email delivery via `nodemailer`

---

## Project structure

```text
auth-server/
├── index.ts
├── package.json
├── pnpm-lock.yaml
├── pnpm-workspace.yaml
├── prisma.config.ts
├── prisma-8.md
├── tsconfig.json
├── README.md
├── src/
│   ├── config/
│   │   └── env.ts
│   ├── controllers/
│   │   ├── forget.controller.ts
│   │   ├── refresh.controller.ts
│   │   ├── signIn.controller.ts
│   │   ├── signOut.controller.ts
│   │   ├── signUp.controller.ts
│   │   └── verifyMe.controller.ts
│   ├── lib/
│   │   ├── jwt.ts
│   │   ├── mailer.ts
│   │   ├── tokens.ts
│   │   └── validations.ts
│   ├── middleware/
│   │   └── auth.ts
│   ├── prisma/
│   │   ├── contract.d.ts
│   │   ├── contract.json
│   │   ├── contract.prisma
│   │   └── db.ts
│   └── routes/
│       └── auth.route.ts
└── migrations/
    └── app/
        └── ...
```

Important note: this repo does not use a classic `prisma/schema.prisma` file. The Prisma setup is contract-driven and defined under `src/prisma/contract.prisma` with configuration in `prisma.config.ts`.

---

## Environment setup

Create a `.env` file in the project root:

```env
PORT=5000
NODE_ENV=development

JWT_SECRET=replace_with_a_long_secure_secret_minimum_32_chars
JWT_REFRESH_SECRET=replace_with_a_different_long_secure_secret_minimum_32_chars

DATABASE_URL=postgresql://user:password@localhost:5432/auth_db?schema=public

SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your_email@gmail.com
SMTP_PASS=your_app_password
SMTP_FROM=your_email@gmail.com
```

Notes:

- `PORT` is read as a string and used by the Express app
- `NODE_ENV` is restricted to `development`, `production`, or `test`
- `JWT_SECRET` and `JWT_REFRESH_SECRET` must be at least 32 characters
- `SMTP_FROM` is expected to be a valid email string in the current config validation

---

## Installation

Use your package manager of choice. The project includes `pnpm` lock files and the repo is set up for a modern TypeScript workflow.

```bash
pnpm install
pnpm dev
```

Alternative with npm:

```bash
npm install
npm run dev
```

Development mode starts the server with:

```bash
tsx watch index.ts
```

Production build:

```bash
pnpm build
pnpm start
```

---

## Database model

The active Prisma contract defines these tables:

```prisma
// src/prisma/contract.prisma

model User {
  id         Int      @id @default(autoincrement())
  email      String   @unique
  username   String?
  name       String?
  password   String
  isVerified Boolean
  createdAt  TimestamptzString @default(now())
  updatedAt  temporal.updatedAtString()

  @@map("user")
}

model UserOtp {
  id        Int      @id @default(autoincrement())
  otp       String
  otpExpiry DateTime
  user      User     @relation(fields: [userId], references: [id])
  userId    Int
  createdAt TimestamptzString @default(now())
  updatedAt temporal.updatedAtString()

  @@map("user_otp")
}
```

The app creates users and stores one OTP record per user for email verification or password reset flows.

---

## API routes

Base path: `/api/auth`

### 1) Sign up

- Method: `POST`
- Route: `/api/auth/signup`
- Public

Request body:

```json
{
  "email": "user@example.com",
  "password": "SecurePassword123!",
  "name": "John Doe"
}
```

Success response:

```json
{
  "message": "Registration successful. OTP sent to email."
}
```

Behavior:

- checks if the email already exists
- hashes the password with `bcryptjs`
- creates the user with `isVerified: false`
- generates a 6-digit OTP
- stores the OTP with a 10-minute expiry
- sends the OTP email

---

### 2) Verify OTP

- Method: `POST`
- Route: `/api/auth/verify-otp`
- Public

Request body:

```json
{
  "email": "user@example.com",
  "otp": "123456"
}
```

Success response:

```json
{
  "message": "Email verified successfully"
}
```

---

### 3) Sign in

- Method: `POST`
- Route: `/api/auth/signin`
- Public

Request body:

```json
{
  "email": "user@example.com",
  "password": "SecurePassword123!"
}
```

Success response:

```json
{
  "accessToken": "<JWT_ACCESS_TOKEN>",
  "refreshToken": "<JWT_REFRESH_TOKEN>"
}
```

Behavior:

- validates the credentials
- checks `isVerified`
- issues an access token valid for 15 minutes
- issues a refresh token valid for 7 days

---

### 4) Forgot password

- Method: `POST`
- Route: `/api/auth/forgot-password`
- Public

Request body:

```json
{
  "email": "user@example.com"
}
```

Success response:

```json
{
  "message": "Password reset OTP sent to email."
}
```

When the email is not found, the server returns a generic message to reduce user enumeration risk:

```json
{
  "message": "If an account exists, an OTP has been sent."
}
```

---

### 5) Reset password

- Method: `POST`
- Route: `/api/auth/reset-password`
- Public

Request body:

```json
{
  "email": "user@example.com",
  "otp": "123456",
  "newPassword": "NewSecurePassword123!"
}
```

Success response:

```json
{
  "message": "Password updated successfully"
}
```

Behavior:

- verifies the OTP and expiry time
- hashes the new password
- updates the user password
- deletes the used OTP record

---

### 6) Refresh access token

- Method: `POST`
- Route: `/api/auth/refresh`
- Public

Request body:

```json
{
  "refreshToken": "<JWT_REFRESH_TOKEN>"
}
```

Success response:

```json
{
  "accessToken": "<NEW_JWT_ACCESS_TOKEN>"
}
```

---

### 7) Sign out

- Method: `POST`
- Route: `/api/auth/signout`
- Public

Success response:

```json
{
  "message": "Signed out successfully"
}
```

This endpoint currently acts as a client-facing sign-out acknowledgement. It does not revoke tokens on the server side.

---

### 8) Get authenticated user

- Method: `GET`
- Route: `/api/auth/me`
- Protected

Headers:

```http
Authorization: Bearer <accessToken>
```

Success response:

```json
{
  "user": {
    "id": 1,
    "email": "user@example.com",
    "name": "John Doe",
    "isVerified": true,
    "createdAt": "2026-10-06T15:00:00.000Z",
    "updatedAt": "2026-10-06T15:00:00.000Z"
  }
}
```

The response removes the password field before returning the user object.

---

## Authentication and security details

The current implementation includes:

- bcrypt password hashing with 12 salt rounds
- JWT access tokens valid for 15 minutes
- JWT refresh tokens valid for 7 days
- OTP expiry set to 10 minutes
- strict input validation using `zod`
- user-enumeration protection for password reset requests
- token verification middleware for protected routes

---

## Notes for development

- The app listens on `env.PORT` in `index.ts`
- The main router is mounted at `/api/auth`
- The `signOut` route is informational; client-side token cleanup is expected
- Email sending depends on valid SMTP credentials in `.env`
- The project expects a Postgres database connection string in `DATABASE_URL`

---

## Useful scripts

```bash
pnpm dev
pnpm build
pnpm start
pnpm lint
pnpm format
```

If you are adding a new schema or database model, you will likely need to work with the Prisma contract files under `src/prisma/`, not a conventional `schema.prisma` at the root.
