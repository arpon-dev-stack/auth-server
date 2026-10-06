# Express Authentication & Authorization Server

A production-ready, highly secure Express.js authentication and authorization backend built with TypeScript, Node.js, Nodemailer, Zod, Jose, and Prisma ORM. 

This server provides complete authentication workflows—including OTP-based email verification, user sign-up/sign-in, JSON Web Token (JWT) management with refresh mechanics, password reset options, and protected user profile routes.

---

## 🛠 Tech Stack

* **Runtime & Framework:** Node.js, Express.js (TypeScript)
* **Database ORM:** Prisma ORM
* **JWT Management:** `jose` (Modern cryptographic utility for tokens)
* **Validation:** `zod`
* **Email Service:** `nodemailer`
* **Security:** `bcryptjs` for password hashing

---

## 📁 Project Structure

```text

auth-server/
├── .env
├── .env.example
├── .gitattributes
├── .gitignore
├── package.json
├── pnpm-lock.yaml
├── pnpm-workspace.yaml
├── prisma-8.md
├── prisma.config.ts
├── README.md
├── tsconfig.json
├── index.ts
└── src/
    ├── config/
    │   └── env.ts
    ├── controllers/
    │   ├── forget.controller.ts
    │   ├── refresh.controller.ts
    │   ├── signIn.controller.ts
    │   ├── signOut.controller.ts
    │   ├── signUp.controller.ts
    │   └── verifyMe.controller.ts
    ├── lib/
    │   ├── jwt.ts
    │   ├── mailer.ts
    │   ├── tokens.ts
    │   └── validations.ts
    ├── middleware/
    │   └── auth.ts
    ├── prisma/
    │   ├── contract.d.ts
    │   ├── contract.json
    │   ├── contract.prisma
    │   └── db.ts
    └── routes/
        └── auth.route.ts
```

---

## ⚙️ Prerequisites & Installation

### 1. Requirements
* **Node.js**: `v18.x` or higher
* **npm** / **yarn** / **pnpm**
* PostgreSQL, MySQL, or SQLite database configured with Prisma

### 2. Environment Setup

Create a `.env` file in the root directory and populate it with the required configuration key-value pairs:

```env
# Server Configuration
PORT=5000
NODE_ENV=development

# Secrets (Must be at least 32 characters)
JWT_SECRET=your_super_secret_jwt_access_key_min_32_chars
JWT_REFRESH_SECRET=your_super_secret_jwt_refresh_key_min_32_chars

# Database URL
DATABASE_URL=postgresql://user:password@localhost:5432/auth_db?schema=public

# Nodemailer / SMTP Config
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your_email@gmail.com
SMTP_PASS=your_smtp_app_password
SMTP_FROM="Auth Admin" <your_email@gmail.com>
```

### 3. Setup Commands

```bash
# Install dependencies
npm install

# Run database migrations with Prisma
npx prisma migrate dev --name init

# Start server in development mode
npm run dev
```

---

## 🗄️ Recommended Prisma Schema (`prisma/schema.prisma`)

```prisma

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

---

## 🔌 API Documentation

### Base URL
`/api/auth`

---

### 1. Sign Up
* **Endpoint:** `POST /api/auth/signup`
* **Access:** Public
* **Description:** Creates a new unverified user and emails a 6-digit OTP code for verification.
* **Request Body:**
  ```json
  {
    "email": "user@example.com",
    "password": "SecurePassword123!",
    "name": "John Doe"
  }
  ```
* **Response (201 Created):**
  ```json
  {
    "message": "Registration successful. OTP sent to email."
  }
  ```

---

### 2. Verify Email OTP
* **Endpoint:** `POST /api/auth/verify-otp`
* **Access:** Public
* **Description:** Verifies user email with the provided OTP.
* **Request Body:**
  ```json
  {
    "email": "user@example.com",
    "otp": "123456"
  }
  ```
* **Response (200 OK):**
  ```json
  {
    "message": "Email verified successfully"
  }
  ```

---

### 3. Sign In
* **Endpoint:** `POST /api/auth/signin`
* **Access:** Public
* **Description:** Validates user credentials and returns JWT Access and Refresh tokens.
* **Request Body:**
  ```json
  {
    "email": "user@example.com",
    "password": "SecurePassword123!"
  }
  ```
* **Response (200 OK):**
  ```json
  {
    "accessToken": "<JWT_ACCESS_TOKEN>",
    "refreshToken": "<JWT_REFRESH_TOKEN>"
  }
  ```

---

### 4. Forgot Password (Request OTP)
* **Endpoint:** `POST /api/auth/forgot-password`
* **Access:** Public
* **Description:** Sends a password reset OTP code to the requested email.
* **Request Body:**
  ```json
  {
    "email": "user@example.com"
  }
  ```
* **Response (200 OK):**
  ```json
  {
    "message": "If an account exists, an OTP has been sent."
  }
  ```

---

### 5. Reset Password
* **Endpoint:** `POST /api/auth/reset-password`
* **Access:** Public
* **Description:** Verifies OTP and updates the account password.
* **Request Body:**
  ```json
  {
    "email": "user@example.com",
    "otp": "123456",
    "newPassword": "NewSecurePassword123!"
  }
  ```
* **Response (200 OK):**
  ```json
  {
    "message": "Password updated successfully"
  }
  ```

---

### 6. Refresh Access Token
* **Endpoint:** `POST /api/auth/refresh`
* **Access:** Public
* **Description:** Exchanges a valid Refresh Token for a new Access Token.
* **Request Body:**
  ```json
  {
    "refreshToken": "<JWT_REFRESH_TOKEN>"
  }
  ```
* **Response (200 OK):**
  ```json
  {
    "accessToken": "<NEW_JWT_ACCESS_TOKEN>"
  }
  ```

---

### 7. Sign Out
* **Endpoint:** `POST /api/auth/signout`
* **Access:** Public
* **Description:** Informs the server of sign out (clears state/cookies on client side).
* **Response (200 OK):**
  ```json
  {
    "message": "Signed out successfully"
  }
  ```

---

### 8. Get Verified User Profile
* **Endpoint:** `GET /api/auth/me`
* **Access:** Protected (Requires `Authorization: Bearer <accessToken>`)
* **Headers:**
  ```http
  Authorization: Bearer <accessToken>
  ```
* **Response (200 OK):**
  ```json
  {
    "user": {
      "id": "uuid-v4-string",
      "email": "user@example.com",
      "name": "John Doe",
      "isVerified": true,
      "createdAt": "2026-10-06T15:00:00.000Z"
    }
  }
  ```

---

## 🔒 Security Best Practices Implemented

1. **Password Hashing:** Passwords are auto-hashed using `bcryptjs` with standard salt rounds (12).
2. **User Enumeration Defense:** Password reset requests return generic response messages to avoid revealing whether an email exists in the database.
3. **Token Lifespans:**
   * Access Token: `15 minutes`
   * Refresh Token: `7 days`
   * OTP Expiry: `10 minutes`
4. **Input Sanitization:** All incoming request parameters undergo strict type and structure validation via `zod`.