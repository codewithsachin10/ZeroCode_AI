import dotenv from "dotenv";
import { initializeApp } from "firebase/app";
import { getFirestore, doc, setDoc, serverTimestamp } from "firebase/firestore";

dotenv.config({ path: ".env.local" });

const firebaseConfig = {
  apiKey: process.env.VITE_FIREBASE_API_KEY,
  authDomain: process.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: process.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.VITE_FIREBASE_APP_ID,
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

const tracks = [
  {
    id: "track_backend_prompt_engineer",
    name: "Backend Prompt Engineer",
    learningPath: "beginner",
    lessons: [
      "How the web works, HTTP methods, APIs, JSON, status codes",
      "Authentication and authorization, JWT, OAuth, bcrypt",
      "Databases: SQL vs NoSQL, schema, ORM basics",
      "Node.js/Express REST APIs, middleware, error handling",
      "Frontend-backend integration, CORS, headers, Postman",
      "Vibe coding for backend: clear prompts and iterative debugging",
    ],
  },
  {
    id: "track_tester_debugger",
    name: "Tester and Debugger",
    learningPath: "beginner",
    lessons: [
      "Chrome DevTools workflow: console, network, elements, application",
      "Bug types and error diagnosis: frontend, backend, DB, CORS",
      "Testing techniques: happy path, edge cases, negative testing",
      "Postman API testing and request validation",
      "Bug report writing with severity and reproducible steps",
      "Final QA workflow across local and production environments",
    ],
  },
  {
    id: "track_uiux_frontend_support",
    name: "UI UX and Frontend Support",
    learningPath: "beginner",
    lessons: [
      "UI/UX fundamentals, hierarchy, consistency, feedback",
      "Design principles: color, typography, spacing, contrast",
      "Figma workflow: frames, auto-layout, components, prototypes",
      "Common UI components and states (loading, empty, error)",
      "Responsive design and mobile-first implementation",
      "Accessibility essentials and prompting AI for UI generation",
    ],
  },
  {
    id: "track_shared_team_skills",
    name: "Shared Team Skills",
    learningPath: "beginner",
    lessons: [
      "Git and GitHub basics: branch workflow and pull requests",
      "Effective AI prompting with context and iteration",
      "Project management: task breakdown and definition of done",
      "Team communication and blockers reporting",
      "Quick Git cheat sheet and collaboration habits",
      "Best free learning resources and self-study strategy",
    ],
  },
];

const weeklyRoadmap = [
  { week: 1, focus: "Foundations", task: "Learn core concepts and tool basics." },
  { week: 2, focus: "Core Workflow", task: "Practice end-to-end flow for your role." },
  { week: 3, focus: "Hands-on Practice", task: "Implement and test mini tasks daily." },
  { week: 4, focus: "Integration", task: "Collaborate across tracks and fix issues together." },
  { week: 5, focus: "Project Sprint", task: "Build role-specific project outputs and polish." },
  { week: 6, focus: "Final Review", task: "Run final QA, retrospective, and publish outputs." },
];

const quizBank = {
  track_backend_prompt_engineer: [
    [
      {
        question: "Which HTTP method should you use to create new data?",
        options: ["GET", "POST", "PUT", "DELETE"],
        correctIndex: 1,
      },
      {
        question: "Which response code usually means unauthorized access?",
        options: ["200", "201", "401", "500"],
        correctIndex: 2,
      },
    ],
    [
      {
        question: "What is the main purpose of bcrypt?",
        options: ["Compress files", "Hash passwords", "Encrypt videos", "Generate IDs"],
        correctIndex: 1,
      },
      {
        question: "Authentication answers which question?",
        options: ["What can you do?", "Who are you?", "Where is data stored?", "How fast is API?"],
        correctIndex: 1,
      },
    ],
    [
      {
        question: "Which is a SQL database?",
        options: ["MongoDB", "PostgreSQL", "Redis", "Firebase Storage"],
        correctIndex: 1,
      },
      {
        question: "What is ORM mainly used for?",
        options: ["UI design", "Sending emails", "DB access through models", "CDN caching"],
        correctIndex: 2,
      },
    ],
    [
      {
        question: "Middleware in Express is mainly used for:",
        options: ["Image editing", "Request processing", "CSS styling", "Video rendering"],
        correctIndex: 1,
      },
      {
        question: "Where should secrets like JWT secret be stored?",
        options: ["Frontend code", ".env", "README", "LocalStorage"],
        correctIndex: 1,
      },
    ],
    [
      {
        question: "Authorization token is usually sent in:",
        options: ["URL hash", "Cookie name", "Request header", "HTML title"],
        correctIndex: 2,
      },
      {
        question: "CORS issues happen due to:",
        options: ["Wrong CSS", "Cross-origin restrictions", "DB schema", "Markdown"],
        correctIndex: 1,
      },
    ],
    [
      {
        question: "Best way to prompt AI for backend endpoint generation?",
        options: [
          "Give vague request",
          "Specify framework, endpoint behavior, and response shape",
          "Only ask for random code",
          "Skip context completely",
        ],
        correctIndex: 1,
      },
      {
        question: "When debugging AI-generated code, you should:",
        options: ["Deploy directly", "Read error and iterate", "Delete logs", "Ignore tests"],
        correctIndex: 1,
      },
    ],
  ],
  track_tester_debugger: [
    [
      {
        question: "Which DevTools tab helps inspect API failures?",
        options: ["Elements", "Network", "Sources", "Rendering"],
        correctIndex: 1,
      },
      {
        question: "Where do JavaScript runtime errors appear first?",
        options: ["Console", "Styles", "History", "Bookmarks"],
        correctIndex: 0,
      },
    ],
    [
      {
        question: "Edge case testing means:",
        options: ["Only test valid input", "Test unusual/boundary inputs", "Skip forms", "Only test UI colors"],
        correctIndex: 1,
      },
      {
        question: "A 500 status indicates:",
        options: ["Not found", "Unauthorized", "Server-side failure", "Created"],
        correctIndex: 2,
      },
    ],
    [
      {
        question: "Postman is used for:",
        options: ["Design mockups", "Manual API testing", "Bundling frontend", "Database migration"],
        correctIndex: 1,
      },
      {
        question: "Bearer token belongs in:",
        options: ["Request body", "Authorization header", "URL path", "Image alt text"],
        correctIndex: 1,
      },
    ],
    [
      {
        question: "A strong bug report includes:",
        options: ["Only screenshot", "Steps, expected, actual, evidence", "Only bug title", "No reproduction steps"],
        correctIndex: 1,
      },
      {
        question: "Critical bug usually means:",
        options: ["Minor spacing issue", "App crash/core flow blocked", "Text typo", "Small icon mismatch"],
        correctIndex: 1,
      },
    ],
    [
      {
        question: "Cross-browser testing should include:",
        options: ["Only Chrome", "Chrome + Firefox + mobile checks", "Only Safari", "No responsive checks"],
        correctIndex: 1,
      },
      {
        question: "Negative testing is about:",
        options: ["Only happy path", "Intentionally trying invalid inputs", "Only snapshots", "Skipping auth"],
        correctIndex: 1,
      },
    ],
    [
      {
        question: "Final QA before release should include:",
        options: ["Skip regressions", "Retest fixed bugs and full flows", "Only homepage check", "Only database cleanup"],
        correctIndex: 1,
      },
      {
        question: "If stuck on bug >30 mins, best action:",
        options: ["Stay silent", "Ask with context and logs", "Force merge", "Ignore bug"],
        correctIndex: 1,
      },
    ],
  ],
  track_uiux_frontend_support: [
    [
      {
        question: "UX mainly focuses on:",
        options: ["Only color palette", "How product feels and flows", "Only code style", "Only icon size"],
        correctIndex: 1,
      },
      {
        question: "Good hierarchy means:",
        options: ["Everything equally visible", "Most important info is most prominent", "Hide CTA", "No spacing"],
        correctIndex: 1,
      },
    ],
    [
      {
        question: "Strong UI consistency uses:",
        options: ["Random spacing", "Same patterns for similar actions", "Different fonts per page", "No design tokens"],
        correctIndex: 1,
      },
      {
        question: "Recommended body text accessibility minimum:",
        options: ["10px", "12px", "16px", "24px"],
        correctIndex: 2,
      },
    ],
    [
      {
        question: "Figma Auto Layout helps with:",
        options: ["Database queries", "Responsive component behavior", "API auth", "Backend routing"],
        correctIndex: 1,
      },
      {
        question: "Reusable Figma components improve:",
        options: ["Inconsistency", "Design speed and consistency", "Build errors", "Server memory"],
        correctIndex: 1,
      },
    ],
    [
      {
        question: "Empty states should:",
        options: ["Be blank", "Explain and guide next action", "Hide all controls", "Only show loader"],
        correctIndex: 1,
      },
      {
        question: "Loading states are important because:",
        options: ["They reduce trust", "They provide user feedback", "They increase errors", "They replace validation"],
        correctIndex: 1,
      },
    ],
    [
      {
        question: "Mobile-first means:",
        options: ["Desktop first only", "Start for small screens, then scale up", "Ignore tablet", "Use hover interactions always"],
        correctIndex: 1,
      },
      {
        question: "Recommended touch target size:",
        options: ["20x20", "30x30", "44x44 or above", "12x12"],
        correctIndex: 2,
      },
    ],
    [
      {
        question: "Good AI UI prompt should include:",
        options: ["Only page name", "Layout, components, style, and behavior", "No context", "No constraints"],
        correctIndex: 1,
      },
      {
        question: "Accessibility contrast target is primarily:",
        options: ["1:1", "2:1", "4.5:1 for normal text", "10:1 only"],
        correctIndex: 2,
      },
    ],
  ],
  track_shared_team_skills: [
    [
      {
        question: "Best Git practice for team work:",
        options: ["Commit directly to main", "Use branches and PRs", "Avoid pull", "No commit messages"],
        correctIndex: 1,
      },
      {
        question: "git pull is used to:",
        options: ["Delete branch", "Get latest remote changes", "Create release", "Reset auth"],
        correctIndex: 1,
      },
    ],
    [
      {
        question: "Effective AI prompting starts with:",
        options: ["No stack details", "Specific stack and clear task", "Only one word", "No context"],
        correctIndex: 1,
      },
      {
        question: "One task per prompt helps:",
        options: ["Reduce clarity", "Improve output quality", "Increase confusion", "Break codebase"],
        correctIndex: 1,
      },
    ],
    [
      {
        question: "Definition of done should include:",
        options: ["Only coding", "Tested and working behavior", "Only screenshots", "No review"],
        correctIndex: 1,
      },
      {
        question: "Task planning should be:",
        options: ["Large and vague", "Small and specific", "No owner", "No timeline"],
        correctIndex: 1,
      },
    ],
    [
      {
        question: "If blocked for too long, you should:",
        options: ["Hide blocker", "Communicate blocker early", "Delete task", "Skip feature"],
        correctIndex: 1,
      },
      {
        question: "Good help request includes:",
        options: ["Only 'not working'", "Error, what tried, expected result", "No logs", "No context"],
        correctIndex: 1,
      },
    ],
    [
      {
        question: "Quick Git cheat sheet is useful for:",
        options: ["UI theming", "Faster consistent collaboration", "Video compression", "DB indexing"],
        correctIndex: 1,
      },
      {
        question: "Reviewing code before merge helps:",
        options: ["Add bugs", "Catch issues early", "Reduce accountability", "Remove tests"],
        correctIndex: 1,
      },
    ],
    [
      {
        question: "Best learning approach in 6-week plan:",
        options: ["Random topics daily", "Structured weekly focus + practice", "No project work", "Skip reflection"],
        correctIndex: 1,
      },
      {
        question: "Team growth is strongest with:",
        options: ["Solo work only", "Shared docs and daily updates", "No communication", "No retrospectives"],
        correctIndex: 1,
      },
    ],
  ],
};

async function seed() {
  console.log("Seeding VibeCoding study plan...");

  for (const track of tracks) {
    await setDoc(doc(db, "video_categories", track.id), {
      name: track.name,
      learningPath: track.learningPath,
      isCertificationEnabled: true,
      updatedAt: serverTimestamp(),
      createdAt: serverTimestamp(),
    }, { merge: true });

    for (let i = 0; i < track.lessons.length; i += 1) {
      const lessonId = `${track.id}_week_${i + 1}`;
      const roadmap = weeklyRoadmap[i];
      await setDoc(doc(db, "videos", lessonId), {
        title: `Week ${i + 1}: ${roadmap.focus}`,
        description: `${track.lessons[i]}\n\nWeekly task: ${roadmap.task}`,
        youtubeEmbedUrl: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
        categoryId: track.id,
        order: i + 1,
        isLocked: i !== 0,
        isPublished: true,
        weeklyChecklist: [
          "Understand the core topic clearly",
          "Complete one practical task",
          "Validate your output with test/review",
          "Document key learnings and blockers",
        ],
        quiz: quizBank[track.id][i],
        updatedAt: serverTimestamp(),
        createdAt: serverTimestamp(),
      }, { merge: true });
    }
  }

  await setDoc(doc(db, "academy_files", "resource_git_cheatsheet"), {
    name: "Git Quick Cheat Sheet",
    type: "PDF",
    size: "Guide",
    url: "https://education.github.com/git-cheat-sheet-education.pdf",
    updatedAt: serverTimestamp(),
    createdAt: serverTimestamp(),
  }, { merge: true });

  await setDoc(doc(db, "academy_files", "resource_backend_basics"), {
    name: "Backend API Basics Reference",
    type: "WEB",
    size: "Guide",
    url: "https://developer.mozilla.org/en-US/docs/Learn/Server-side/First_steps",
    updatedAt: serverTimestamp(),
    createdAt: serverTimestamp(),
  }, { merge: true });

  await setDoc(doc(db, "academy_files", "resource_uiux_foundations"), {
    name: "UI UX Fundamentals and Figma",
    type: "WEB",
    size: "Guide",
    url: "https://help.figma.com/hc/en-us/categories/360002051613-Learn-design",
    updatedAt: serverTimestamp(),
    createdAt: serverTimestamp(),
  }, { merge: true });

  console.log("VibeCoding study plan seeded successfully.");
}

seed()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("Failed to seed study plan:", error);
    process.exit(1);
  });
