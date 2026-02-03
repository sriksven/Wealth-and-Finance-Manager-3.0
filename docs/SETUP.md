# Setup Guide

This guide will help you set up the **Wealth and Finance Manager** locally. This project consists of a Next.js backend/wrapper and a Vite React frontend (in `vite-app`).

## Prerequisites

- [Node.js](https://nodejs.org/) (v18 or later recommended)
- [npm](https://www.npmjs.com/)
- A [Firebase Project](https://console.firebase.google.com/)
- (Optional) An [Auth0](https://auth0.com/) account if using Auth0 features
- (Optional) [MongoDB](https://www.mongodb.com/) if using the backend features requiring it

## Installation

1.  **Clone the repository:**
    ```bash
    git clone https://github.com/sriksven/Wealth-and-Finance-Manager-3.0.git
    cd Wealth-and-Finance-Manager-3.0
    ```

2.  **Install Root Dependencies:**
    ```bash
    npm install
    ```

3.  **Install Frontend Dependencies:**
    ```bash
    cd vite-app
    npm install
    cd ..
    ```

## Configuration

### 1. Environment Variables

You need to configure the environment variables for both the root and the Frontend application.

**Root Directory:**
Copy the example environment file:
```bash
cp .env.example .env.local
```
Fill in your Auth0 and MongoDB details in `.env.local` if you plan to use those features.

**Frontend (vite-app):**
Navigate to `vite-app` and copy the example file:
```bash
cd vite-app
cp .env.example .env.local
```
Open `.env.local` and fill in your Firebase details. You can find these in your Firebase Console under **Project Settings > General > Your Apps**.

### 2. Firebase Setup

1.  Go to the [Firebase Console](https://console.firebase.google.com/).
2.  Create a new project.
3.  Enable **Firestore Database** in test mode (or set secure rules later).
4.  Enable **Authentication** (e.g., Google Provider or Email/Password).
5.  Add a generic **Web App** to your project to get the configuration keys (API Key, App ID, etc.).

## Running the Application

### Development Mode

To run the full stack (if applicable) or the main development scripts:

**Run the Frontend (Vite):**
```bash
cd vite-app
npm run dev
```
The app will typically run at `http://localhost:5173`.

**Run the Root App (Next.js):**
```bash
npm run dev
```
The app will typically run at `http://localhost:3000`.

## Building for Production

To build the frontend for production:
```bash
cd vite-app
npm run build
```
The output will be in `vite-app/dist`.
