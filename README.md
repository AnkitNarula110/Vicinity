# Vicinity

## Getting Started

Follow these steps to run the Vicinity project locally.

### Prerequisites

Make sure the following are installed:

* Rust
* Node.js
* npm
* PostgreSQL
* Redis
* Xcode (for iOS development)

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

Make sure PostgreSQL and Redis are running.

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

### Terminal 2 — Frontend

```bash
cd vicinity_frontend
npm install
npx expo start --dev-client
```

Once both services are running, the Vicinity application can connect to the backend.
