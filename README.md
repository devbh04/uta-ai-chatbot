# 🧭 North Star AI Chatbot — Quickstart & Setup Helper

Welcome to the North Star AI Chatbot setup guide. This document helps you configure, install, and run the complete system locally. The project consists of a FastAPI backend and a Next.js frontend, integrated with MongoDB Atlas, Qdrant Cloud, and Google Vertex AI (via GCP Service Account credentials).

---

## 🛠️ Step 1: Clone and Enter the Directory

Start by clone/downloading the repository and entering the project directory:

```bash
git clone <repository_url> uta-ai-chatbot
cd uta-ai-chatbot
```

---

## 🔑 Step 2: Google Cloud Platform (Vertex AI) Credentials

This application utilizes **Google Vertex AI** (for embeddings and language model operations) authenticated via a GCP Service Account. 

> [!NOTE]
> This system does **not** support or use AI Studio Google API Keys (`GEMINI_API_KEY`). Authentication is done strictly through GCP Service Account keys.

### 1. Create a GCP Service Account
1. Open the [Google Cloud Console](https://console.cloud.google.com/).
2. Select your Google Cloud project (or create one).
3. Navigate to **IAM & Admin > Service Accounts**.
4. Click **Create Service Account**, fill in a name, and proceed.
5. In the Roles selection step, grant the service account the **Vertex AI User** role.
6. Click **Done**.

### 2. Download the JSON Key
1. Select your newly created service account from the list.
2. Click the **Keys** tab.
3. Click **Add Key > Create new key**.
4. Choose **JSON** format and click **Create**.
5. Save the downloaded JSON file securely on your computer (e.g., at `/Users/username/gcp-keys/service-account.json`).

> [!WARNING]
> Keep your service account credentials key JSON file private. Do **not** commit this key file to GitHub or any public repository.

---

## 🗄️ Step 3: Database & Vector Search Preparation

Gather your credentials for the cloud databases:

### 🟢 A. MongoDB Atlas (Cloud Database)
1. Sign in or sign up at [MongoDB Atlas](https://www.mongodb.com/cloud/atlas).
2. Deploy a free cluster.
3. Under **Security > Database Access**, add a database user with read and write permissions.
4. Under **Security > Network Access**, whitelist your IP or allow access from anywhere (`0.0.0.0/0`) for development.
5. Under **Database > Clusters**, click **Connect > Drivers** and copy your Python driver connection URI:
   ```text
   mongodb+srv://<username>:<password>@cluster0.xxxx.mongodb.net/?retryWrites=true&w=majority
   ```

### 🟢 B. Qdrant Cloud (Vector Index)
1. Sign in or sign up at [Qdrant Cloud](https://cloud.qdrant.io/).
2. Create a free-tier cluster.
3. Under Cluster Details, copy your **Endpoint URL** (e.g., `https://xxx-xxx.gcp.cloud.qdrant.io` — *do not include a trailing slash*).
4. Under **API Keys**, create a new API key and copy it.

---

## ⚙️ Step 4: Environment Configurations

You need to define the environment variables for both the backend and client.

### 1. Backend Environment Setup (`backend/.env`)
1. Navigate to the backend directory:
   ```bash
   cd backend
   ```
2. Copy the example environment template:
   ```bash
   cp .env.example .env
   ```
3. Open `backend/.env` and configure the following variables:
   ```env
   # === GCP / Vertex AI ===
   GCP_CREDENTIALS_PATH=/absolute/path/to/your/service-account.json
   GCP_PROJECT=your-gcp-project-id
   GCP_LOCATION=us-central1

   # === MongoDB ===
   MONGODB_URI=mongodb+srv://your_user:your_password@cluster0.xxxx.mongodb.net/
   MONGODB_DB_NAME=northstar

   # === Qdrant ===
   QDRANT_URL=https://your-qdrant-cluster.gcp.cloud.qdrant.io
   QDRANT_API_KEY=your_qdrant_api_key_here
   QDRANT_COLLECTION=products

   # === App Settings ===
   CORS_ORIGINS=http://localhost:3000
   ```

### 2. Frontend Environment Setup (`client/.env.local`)
1. Navigate to the client directory:
   ```bash
   cd ../client
   ```
2. Copy the example client template:
   ```bash
   cp .env.example .env.local
   ```
3. Open `client/.env.local` and configure your API URL:
   ```env
   NEXT_PUBLIC_BACKEND_URL=http://localhost:8000
   ```

---

## 🚀 Step 5: Launching the Platform

Run the backend and frontend servers in separate terminal windows.

### 🐍 Window 1: Start the Backend FastAPI Server
1. From the project root, navigate to the backend folder:
   ```bash
   cd backend
   ```
2. Install dependencies with `uv`:
   ```bash
   uv sync
   ```
3. Start the server:
   ```bash
   uv run uvicorn main:app --reload --port 8000
   ```

> [!TIP]
> **Database Seeding on First Launch:**
> When the backend first starts, it automatically creates the Qdrant product vector collection (configured with 768 dimensions for Gemini embeddings) and populates the MongoDB database with standard products and test orders.

---

### ⚛️ Window 2: Start the Next.js Frontend
1. From the project root, navigate to the client folder:
   ```bash
   cd client
   ```
2. Install node modules:
   ```bash
   pnpm install
   ```
3. Launch the development server:
   ```bash
   pnpm dev
   ```

---

## 🎮 Step 6: Verifying Setup & Functionality

Open [http://localhost:3000](http://localhost:3000) in your web browser:

1. **Test Search and Chat**: Click **Start Chat Portal**, enter your name, and send a message like:
   `"What outdoor products do you have?"`
   Verify that the assistant queries Qdrant and displays interactive product cards.
2. **Test Order Tracking**: Send `"Track order ORD-001"` and verify the order timeline renders with data from MongoDB.
3. **Test Handoff & Support Dashboard**:
   - In the client chat, write `"I want to speak with a human agent"`.
   - In a new tab, open [http://localhost:3000/dashboard](http://localhost:3000/dashboard).
   - Verify that the support dashboard plays an audio chime, pops up a toast alert, and allows you to click **Take Over Chat** to chat in real-time.
