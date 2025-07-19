# React + TypeScript + Vite

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

## Firebase Setup

This project uses Firebase for authentication and secure credential storage.

### 1. Create a Firebase Project

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Create a new project or select an existing one
3. Enable Authentication with Email/Password provider
4. Get your Firebase configuration

### 2. Configure Environment Variables

Create a `.env` file in the project root with your Firebase configuration:

```env
# Backend Configuration
VITE_BACKEND_URL=http://localhost:3000

# Firebase Configuration
VITE_FIREBASE_API_KEY=your_firebase_api_key_here
VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id_here
VITE_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id_here
VITE_FIREBASE_APP_ID=your_app_id_here
```

### 3. Security Features

- **AES-256 Encryption**: All exchange credentials are encrypted using AES-256-CBC
- **PBKDF2 Key Derivation**: Master passwords are processed with 100,000 iterations
- **User-Specific Storage**: Credentials are stored per user in localStorage
- **Secure Error Handling**: No sensitive data is exposed in error messages

## Backend API Configuration

This project uses a backend API for real-time and historical trading data. The backend URL is configured via an environment variable for flexibility between development and production.

### Setting the Backend URL

Create a `.env` file in the project root (same directory as `package.json`) with the following content:

```

```
