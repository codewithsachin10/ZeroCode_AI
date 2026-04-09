# ZeroCode AI

ZeroCode AI is a premium, high-performance web application designed for the VibeCode Academy. It features a real-time chat assistant, learning tracks, and a robust admin system.

## 🚀 Features

- **AI Chat Assistant**: DeepSeek-powered assistant integrated via OpenRouter.
- **Learning Hub**: Structured curriculum with video categories, lessons, and quizzes.
- **Real-time Sync**: Firebase-powered data synchronization.
- **Premium UI**: Cinematic glassmorphism design with smooth animations.

## 🛠️ Technology Stack

- **Frontend**: React, Vite, Tailwind CSS, Shadcn UI, Framer Motion.
- **Backend**: Express (Node.js) serving as an API proxy and static file host.
- **Database/Auth**: Firebase & Firestore.
- **AI**: OpenRouter API.

## 📦 Setup & Installation

1. **Clone the repository**:
   ```bash
   git clone https://github.com/codewithsachin10/ZeroCode_AI.git
   cd ZeroCode_AI
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Configure Environment Variables**:
   Create a `.env.local` file in the root directory and fill in the values from `.env.example`.
   ```bash
   cp .env.example .env.local
   ```

4. **Initialize Database**:
   Run the seed script to populate the curriculum data.
   ```bash
   npm run seed:study-plan
   ```

5. **Run Locally**:
   To run both the frontend and the chat backend:
   ```bash
   npm run dev:all
   ```

## 🚀 Deployment

The project is structured to be deployed as a single unit where the Node.js server serves the static Vite build.

1. **Build the project**:
   ```bash
   npm run build
   ```

2. **Start the production server**:
   ```bash
   npm start
   ```

### Deployment Platforms

- **Railway / Render / Fly.io**: These platforms will automatically detect the `package.json` and run `npm install`, `npm run build`, and `npm start`.
- **Vercel**: You may need to configure the project as a Vite app, but since it has a custom Express backend, a platform that supports Node.js servers is recommended.

## 📜 Scripts

- `npm run dev`: Start the Vite development server.
- `npm run dev:chat`: Start the Express backend for AI chat.
- `npm run dev:all`: Start both development servers concurrently.
- `npm run build`: Build the project for production.
- `npm start`: Start the production server.
- `npm run seed:study-plan`: Seed the database with curriculum data.

## 📄 License

MIT
