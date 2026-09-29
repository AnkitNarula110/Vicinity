# Vicinity

## Getting Started

Follow these steps to run the Vicinity project locally.

### Prerequisites

Make sure the following are installed:

- Rust
- Node.js
- npm
- PostgreSQL
- Redis
- Xcode (for iOS development)

---

## Backend Setup

Navigate to the backend folder:

```bash
cd vicinity_backend
```

Install/build the Rust dependencies:

```bash
cargo build
```

### Start Redis

The backend requires Redis to be running on `127.0.0.1:6379`.

If Redis is installed as a Windows service, open **Command Prompt as Administrator** and run:

```cmd
sc config Redis start= auto
```

Start the Redis service:

```cmd
net start Redis
```

Verify that the Redis service is running:

```cmd
sc query Redis
```

The service should show:

```text
STATE : 4  RUNNING
```

Test the Redis connection:

```cmd
redis-cli ping
```

The expected response is:

```text
PONG
```

> If `redis-cli ping` returns `PONG`, Redis is running correctly and the backend can connect to Redis.

Make sure PostgreSQL is also running.

Then start the backend:

```bash
cargo run
```

The backend will run on:

```text
http://localhost:3000
```

> The backend uses the `DATABASE_URL` and Redis configuration from the `.env` file.

---

## Frontend Setup

Open another terminal and navigate to the frontend:

```bash
cd vicinity_frontend
```

Install the Node.js dependencies:

```bash
npm install
```

Install the Expo development client if required:

```bash
npx expo install expo-dev-client
```

Start the Expo development server:

```bash
npx expo start --dev-client
```

### Run on iOS

To build and run the iOS application:

```bash
npm run ios
```

### Run on Android

To build and run the Android application:

```bash
npm run android
```

### Run on Web

To run the frontend in a browser:

```bash
npm run web
```

---

## Project Structure

```text
Vicinity/

├── vicinity_backend/
│   ├── src/
│   ├── Cargo.toml
│   └── .env
│
└── vicinity_frontend/
    ├── src/
    ├── package.json
    └── ...
```

## Running the Project

You need to run the **backend and frontend separately**.

### Terminal 1 — Backend

```bash
cd vicinity_backend
cargo run
```

Before running the backend, make sure **PostgreSQL and Redis are running**.

### Terminal 2 — Frontend

```bash
cd vicinity_frontend
npm install
npx expo start --dev-client
```

Once both services are running, the Vicinity application can connect to the backend.
