# North Star AI Chatbot — Cloud API Setup & Quickstart Guide

This guide walks you through setting up and running the North Star Outfitters AI Chatbot using fully hosted cloud APIs for all services: **MongoDB Atlas**, **Qdrant Cloud**, and the **Google Gemini API**.

---

## 🛠️ 1. Cloud Credentials Checklist

Before starting, make sure you have gathered the following API details:

### 🟢 A. Google Gemini API
- Get an API key from the [Google AI Studio](https://aistudio.google.com/).
- Key name: `GEMINI_API_KEY`

### 🟢 B. MongoDB Atlas (Cloud database)
1. Sign in to your [MongoDB Atlas](https://www.mongodb.com/cloud/atlas) account.
2. Create a free cluster.
3. In **Security -> Database Access**, create a user with read/write credentials.
4. In **Security -> Network Access**, whitelist IP address `0.0.0.0/30` (or your current IP) to allow connections.
5. In **Database -> Clusters**, click **Connect** -> **Drivers** (Python).
6. Copy the connection URI:
   `mongodb+srv://<username>:<password>@cluster0.xxxx.mongodb.net/?retryWrites=true&w=majority`
   *(Replace `<username>` and `<password>` with your database user credentials)*.

### 🟢 C. Qdrant Cloud (Cloud vector index)
1. Sign in to [Qdrant Cloud Console](https://cloud.qdrant.io/).
2. Create a cluster (free tier is sufficient).
3. Click on the Cluster to view its details. Copy the **Endpoint URL** (should end with `:6333` or look like a secure HTTPS endpoint: `https://xxx-xxx.gcp.cloud.qdrant.io`).
4. Navigate to **API Keys** in the Qdrant Cloud sidebar, create an API key, and copy it.

---

## ⚙️ 2. Environment Configuration

1. **Navigate to the backend folder:**
   ```bash
   cd backend
   ```

2. **Copy the example configuration to create the live environment file:**
   ```bash
   cp .env.example .env
   ```

3. **Open `backend/.env` and replace placeholders with your cloud API credentials:**
   ```env
   # === Gemini API ===
   GEMINI_API_KEY=AIzaSyA_example_gemini_key

   # === MongoDB Atlas (Cloud) ===
   MONGODB_URI=mongodb+srv://myusername:mypassword@cluster0.abcde.mongodb.net/?retryWrites=true&w=majority
   MONGODB_DB_NAME=northstar

   # === Qdrant Cloud (Cloud) ===
   QDRANT_URL=https://e84c98f9-4b21-4203-b06f-xxxx.us-east-1.gcp.cloud.qdrant.io
   QDRANT_API_KEY=your_qdrant_cloud_api_key_here
   QDRANT_COLLECTION=products

   # === App Settings ===
   CORS_ORIGINS=http://localhost:3000
   ```

   > [!IMPORTANT]
   > Ensure you remove any trailing slash `/` at the end of the `QDRANT_URL`. The backend uses the standard HTTP protocol (secure TLS) to query the cloud endpoint.

---

## 🚀 3. Starting the Platform

Open two separate terminal windows to run both services.

### 🐍 Step A: Launch the Backend (Port 8000)
1. **Navigate to the backend directory:**
   ```bash
   cd backend
   ```
2. **Install virtual environment packages (using uv):**
   ```bash
   uv sync
   ```
3. **Start the FastAPI server:**
   ```bash
   uv run uvicorn main:app --reload --port 8000
   ```

   > [!TIP]
   > **First Launch Behavior:** 
   > When the FastAPI server starts, it connects to your MongoDB Atlas cluster and Qdrant Cloud instance. It will automatically check if the `products` collection exists in Qdrant (if not, it creates it with 768 dimensions for Gemini embeddings) and seeds **12 default outdoor products** and **6 mockup orders** with pre-computed Gemini vector embeddings directly into your cloud databases.

---

### ⚛️ Step B: Launch the Next.js Frontend (Port 3000)
1. **Navigate to the client directory:**
   ```bash
   cd client
   ```
2. **Install Node.js packages:**
   ```bash
   pnpm install
   ```
3. **Run the developer local server:**
   ```bash
   pnpm dev
   ```

---

## 🎮 4. Verification Check

Open [http://localhost:3000](http://localhost:3000) in your browser:

1. Click **Start Chat Portal**, enter your guest name, and send:
   `"What outdoor products do you have?"`
   *(Verify the assistant fetches semantic matches from Qdrant Cloud and renders product cards)*
2. Send: `"Track order ORD-001"`
   *(Verify the status progress timeline renders from MongoDB Atlas)*
3. Send: `"Can I talk to a human agent?"`
   *(Verify handoff status card loads)*
4. Open [http://localhost:3000/dashboard](http://localhost:3000/dashboard) in a separate tab.
   - Verify you hear the synthesised chime and see a persistent handoff toast alert.
   - Click **Take Over Chat** to open the live chat console and chat between pages in real-time.
