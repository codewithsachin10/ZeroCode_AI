export type QuickQuestion = {
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string;
};

export type MiniTask = {
  title: string;
  instruction: string;
  actionLabel: string;
  actionUrl?: string;
  actionPrompt?: string;
};

export type InteractiveLessonPack = {
  unitLabel: string;
  animationTitle: string;
  animationFlow: string[];
  howItWorks: string[];
  script: string[];
  quickQuestions: QuickQuestion[];
  miniTask: MiniTask;
  buildNowLabel: string;
  fullQuiz: {
    question: string;
    options: string[];
    correctIndex: number;
  }[];
};

export type InteractiveLessonOverride = Partial<InteractiveLessonPack>;

const UNIT_PACKS: Record<string, Omit<InteractiveLessonPack, "unitLabel">> = {
  api_basics: {
    animationTitle: "Request -> Server -> Response",
    animationFlow: ["Browser sends request", "Server processes", "Response returns", "UI shows JSON"],
    howItWorks: [
      "Browser starts the request.",
      "API endpoint receives it.",
      "Server sends data back.",
      "Frontend reads and shows data."
    ],
    script: [
      "Your browser sends a request to a server.",
      "The server processes it and sends back data.",
      "This request-response flow powers APIs between frontend and backend."
    ],
    quickQuestions: [
      {
        question: "Which method is commonly used to fetch data?",
        options: ["GET", "POST", "DELETE"],
        correctIndex: 0,
        explanation: "GET is typically used for reading data from an API."
      },
      {
        question: "What is JSON?",
        options: ["A data format", "A database", "A CSS framework"],
        correctIndex: 0,
        explanation: "JSON is a data format used for structured data exchange."
      }
    ],
    miniTask: {
      title: "Call an API now",
      instruction: "Open the endpoint and inspect the JSON response shape.",
      actionLabel: "Open Cat Fact API",
      actionUrl: "https://catfact.ninja/fact"
    },
    buildNowLabel: "Build a small API fetch UI",
    fullQuiz: [
      { question: "GET is used to:", options: ["Fetch data", "Delete data", "Stop server"], correctIndex: 0 },
      { question: "POST is used to:", options: ["Send data", "Read only", "Clear cache"], correctIndex: 0 },
      { question: "PUT is used to:", options: ["Update data", "Play video", "Compile code"], correctIndex: 0 },
      { question: "DELETE is used to:", options: ["Remove data", "Create route", "Login user"], correctIndex: 0 },
      { question: "JSON is:", options: ["Data format", "Database", "Browser"], correctIndex: 0 },
      { question: "Status 200 means:", options: ["Success", "Not found", "Crash"], correctIndex: 0 },
      { question: "Status 404 means:", options: ["Not found", "Success", "Secure"], correctIndex: 0 },
      { question: "API helps:", options: ["Frontend talk to backend", "Change font", "Install app"], correctIndex: 0 },
      { question: "Server does:", options: ["Process request", "Draw UI", "Play music"], correctIndex: 0 },
      { question: "Client does:", options: ["Send request", "Store DB table", "Hash password"], correctIndex: 0 }
    ]
  },
  auth: {
    animationTitle: "Login -> Token -> Authorized Request",
    animationFlow: ["User logs in", "Server verifies user", "Token is created", "Token sent with requests"],
    howItWorks: [
      "Login checks user identity.",
      "Server creates auth token.",
      "Browser stores token safely.",
      "Protected APIs accept token."
    ],
    script: [
      "Authentication verifies who the user is.",
      "After login, the server issues a token.",
      "Future requests include the token for protected access."
    ],
    quickQuestions: [
      {
        question: "Authentication means:",
        options: ["Who you are", "What you can access", "How UI looks"],
        correctIndex: 0,
        explanation: "Authentication identifies the user; authorization controls permissions."
      },
      {
        question: "JWT is mostly used for:",
        options: ["Authentication", "Styling", "Database schema"],
        correctIndex: 0,
        explanation: "JWT tokens are commonly used to represent authenticated sessions."
      }
    ],
    miniTask: {
      title: "Generate a JWT login flow",
      instruction: "Ask AI for login + token issue + protected route middleware.",
      actionLabel: "Open AI Prompt",
      actionPrompt: "Create a secure login API using JWT, bcrypt, and route middleware."
    },
    buildNowLabel: "Build login + protected route",
    fullQuiz: [
      { question: "JWT stands for:", options: ["JSON Web Token", "Java Web Tool", "Job Work Token"], correctIndex: 0 },
      { question: "bcrypt is for:", options: ["Hash password", "Style page", "Query DB"], correctIndex: 0 },
      { question: "OAuth is for:", options: ["Login with provider", "Delete users", "Run tests"], correctIndex: 0 },
      { question: "Token is usually stored in:", options: ["Browser", "GPU", "Terminal"], correctIndex: 0 },
      { question: "Token is sent in:", options: ["Authorization header", "Image tag", "CSS file"], correctIndex: 0 },
      { question: "Login mostly checks:", options: ["Authentication", "Color theme", "Font size"], correctIndex: 0 },
      { question: "Roles control:", options: ["Access", "Download speed", "Screen size"], correctIndex: 0 },
      { question: "Token helps server know:", options: ["User identity", "Battery level", "Mouse speed"], correctIndex: 0 },
      { question: "Session is:", options: ["Another auth option", "Image format", "Package manager"], correctIndex: 0 },
      { question: "Secure auth is:", options: ["Required", "Optional always", "Not needed"], correctIndex: 0 }
    ]
  },
  database: {
    animationTitle: "Insert -> Query -> Return Data",
    animationFlow: ["Data is saved", "DB stores record", "Query fetches record", "App receives result"],
    howItWorks: [
      "App sends data to database.",
      "Database stores rows/documents.",
      "Query asks for needed data.",
      "Result comes back to app."
    ],
    script: [
      "Databases store app data like users, tasks, and messages.",
      "SQL databases organize data in tables and rows.",
      "NoSQL systems like MongoDB use document-based records."
    ],
    quickQuestions: [
      {
        question: "SQL stores data in:",
        options: ["Tables", "Images", "Browser cache"],
        correctIndex: 0,
        explanation: "SQL databases primarily structure data in relational tables."
      },
      {
        question: "SELECT is used to:",
        options: ["Fetch data", "Delete table", "Hash password"],
        correctIndex: 0,
        explanation: "SELECT reads records from a table."
      }
    ],
    miniTask: {
      title: "Create a users table",
      instruction: "Define name and email columns and write a SELECT query.",
      actionLabel: "Open SQL Prompt",
      actionPrompt: "Create a SQL users table with id, name, and email plus sample SELECT queries."
    },
    buildNowLabel: "Build user CRUD data layer",
    fullQuiz: [
      { question: "INSERT means:", options: ["Add data", "Read log", "Run test"], correctIndex: 0 },
      { question: "UPDATE means:", options: ["Modify data", "Close app", "Build UI"], correctIndex: 0 },
      { question: "DELETE means:", options: ["Remove data", "Create chart", "Login"], correctIndex: 0 },
      { question: "WHERE is used to:", options: ["Filter data", "Animate card", "Send email"], correctIndex: 0 },
      { question: "Primary key is:", options: ["Unique ID", "Theme color", "API host"], correctIndex: 0 },
      { question: "Row is:", options: ["Single record", "Whole app", "Style rule"], correctIndex: 0 },
      { question: "Column is:", options: ["Field", "Button", "Server"], correctIndex: 0 },
      { question: "DB is for:", options: ["Storage", "Routing", "Animation"], correctIndex: 0 },
      { question: "Query is:", options: ["Data request", "Image type", "UI state"], correctIndex: 0 },
      { question: "ORM is:", options: ["DB helper", "Video player", "Auth token"], correctIndex: 0 }
    ]
  },
  backend: {
    animationTitle: "Route -> Controller -> DB -> Response",
    animationFlow: ["Route receives call", "Controller runs logic", "DB reads/writes", "API sends response"],
    howItWorks: [
      "Route matches request path.",
      "Controller handles business logic.",
      "Database operation executes.",
      "Final response is returned."
    ],
    script: [
      "Backend handles business logic and data operations.",
      "Routes receive requests and call controllers.",
      "Controllers access DB and return structured responses."
    ],
    quickQuestions: [
      {
        question: "Express is:",
        options: ["A backend framework", "A CSS library", "A database"],
        correctIndex: 0,
        explanation: "Express is a Node.js framework for API and web server logic."
      },
      {
        question: "Middleware runs:",
        options: ["Before final route handler", "After DB closes", "Only in frontend"],
        correctIndex: 0,
        explanation: "Middleware executes in the request pipeline before response."
      }
    ],
    miniTask: {
      title: "Generate REST API",
      instruction: "Create task routes with controller and validation.",
      actionLabel: "Open REST Prompt",
      actionPrompt: "Generate a Node + Express REST API for tasks with CRUD endpoints."
    },
    buildNowLabel: "Build full tasks API",
    fullQuiz: [
      { question: "API means:", options: ["Interface", "Image", "Index"], correctIndex: 0 },
      { question: "Route is:", options: ["Path", "Color", "Table"], correctIndex: 0 },
      { question: "Controller handles:", options: ["Logic", "Logo", "Font"], correctIndex: 0 },
      { question: "Middleware is:", options: ["Pre-check function", "DB row", "UI card"], correctIndex: 0 },
      { question: "Response is:", options: ["Output", "Prompt", "Icon"], correctIndex: 0 },
      { question: "Request is:", options: ["Input", "Gradient", "Avatar"], correctIndex: 0 },
      { question: "Node is:", options: ["Runtime", "Database", "Design tool"], correctIndex: 0 },
      { question: "Express is:", options: ["Framework", "Browser", "Compiler"], correctIndex: 0 },
      { question: "JSON is:", options: ["Format", "Hook", "Test"], correctIndex: 0 },
      { question: "Backend API is for:", options: ["Server communication", "Text color", "Image crop"], correctIndex: 0 }
    ]
  },
  testing: {
    animationTitle: "Bug -> Debug -> Fix -> Verify",
    animationFlow: ["Bug appears", "Logs show issue", "Fix is applied", "Retest confirms fix"],
    howItWorks: [
      "Reproduce the same bug.",
      "Check logs and network.",
      "Patch the root cause.",
      "Run tests again to verify."
    ],
    script: [
      "Testing catches bugs before users face them.",
      "Debugging isolates root causes with logs and breakpoints.",
      "Retesting confirms the fix and prevents regressions."
    ],
    quickQuestions: [
      {
        question: "Main goal of testing:",
        options: ["Find defects early", "Increase bundle size", "Remove auth"],
        correctIndex: 0,
        explanation: "Testing improves reliability by catching defects early."
      },
      {
        question: "A good debug step is:",
        options: ["Reproduce the issue", "Rename random files", "Disable all validation"],
        correctIndex: 0,
        explanation: "Reliable reproduction is key to debugging and verification."
      }
    ],
    miniTask: {
      title: "Break and fix flow",
      instruction: "Intentionally trigger a login issue and patch it with AI guidance.",
      actionLabel: "Open Debug Prompt",
      actionPrompt: "Give a step-by-step debugging plan for a failing login API."
    },
    buildNowLabel: "Build a regression test suite",
    fullQuiz: [
      { question: "Bug means:", options: ["Error", "Feature", "Theme"], correctIndex: 0 },
      { question: "Test means:", options: ["Check behavior", "Change logo", "Add noise"], correctIndex: 0 },
      { question: "DevTools helps:", options: ["Debug", "Paint UI", "Seed DB"], correctIndex: 0 },
      { question: "Console shows:", options: ["Logs and errors", "Colors", "Tables only"], correctIndex: 0 },
      { question: "Network tab shows:", options: ["Requests", "Fonts", "Keyboard"], correctIndex: 0 },
      { question: "API testing is:", options: ["Useful", "Not needed", "Only design"], correctIndex: 0 },
      { question: "Postman is:", options: ["Testing tool", "Database", "Plugin theme"], correctIndex: 0 },
      { question: "When error appears:", options: ["Investigate and fix", "Ignore", "Delete app"], correctIndex: 0 },
      { question: "QA stands for:", options: ["Quality assurance", "Quick access", "Query app"], correctIndex: 0 },
      { question: "Debug means:", options: ["Find and solve issue", "Create token", "Upload image"], correctIndex: 0 }
    ]
  },
  uiux: {
    animationTitle: "Compare UI -> Improve UX Flow",
    animationFlow: ["User opens screen", "UI guides action", "Feedback appears", "Flow feels smooth"],
    howItWorks: [
      "UI shows clear sections.",
      "User knows next action.",
      "Errors are easy to fix.",
      "Task completion becomes faster."
    ],
    script: [
      "UI is visual structure and components.",
      "UX is how smoothly users complete tasks.",
      "Good UX removes friction and clarifies next actions."
    ],
    quickQuestions: [
      {
        question: "UI means:",
        options: ["Look and components", "Server scaling", "Token encryption"],
        correctIndex: 0,
        explanation: "UI covers what users see and interact with."
      },
      {
        question: "UX focuses on:",
        options: ["User journey quality", "Database indexes only", "Compiler options"],
        correctIndex: 0,
        explanation: "UX measures ease, clarity, and flow for users."
      }
    ],
    miniTask: {
      title: "Design login screen",
      instruction: "Create a clean login layout and improve form error feedback.",
      actionLabel: "Open UI Prompt",
      actionPrompt: "Design a modern login page with clear UX states and error handling."
    },
    buildNowLabel: "Build polished login UI",
    fullQuiz: [
      { question: "UI means:", options: ["Look", "Database", "Server"], correctIndex: 0 },
      { question: "UX means:", options: ["Feel", "Deploy", "Import"], correctIndex: 0 },
      { question: "Color helps:", options: ["Design clarity", "Token auth", "API route"], correctIndex: 0 },
      { question: "Font choice affects:", options: ["Readability", "DB writes", "API speed"], correctIndex: 0 },
      { question: "Layout is:", options: ["Structure", "Hash", "Cookie"], correctIndex: 0 },
      { question: "Button is for:", options: ["Action", "Storage", "Routing table"], correctIndex: 0 },
      { question: "Mobile-ready means:", options: ["Responsive", "Offline DB", "No CSS"], correctIndex: 0 },
      { question: "Grid helps:", options: ["Alignment", "JWT", "Logging"], correctIndex: 0 },
      { question: "Contrast helps:", options: ["Visibility", "Session", "Schema"], correctIndex: 0 },
      { question: "Good design improves:", options: ["Experience", "Server RAM", "Token life"], correctIndex: 0 }
    ]
  }
};

const detectUnit = (categoryName: string, title: string): keyof typeof UNIT_PACKS => {
  const text = `${categoryName} ${title}`.toLowerCase();
  if (text.includes("auth") || text.includes("jwt") || text.includes("token")) return "auth";
  if (text.includes("database") || text.includes("sql") || text.includes("mongo")) return "database";
  if (text.includes("test") || text.includes("debug") || text.includes("qa")) return "testing";
  if (text.includes("ui") || text.includes("ux") || text.includes("frontend") || text.includes("design")) return "uiux";
  if (text.includes("backend") || text.includes("express") || text.includes("node") || text.includes("api route")) return "backend";
  if (text.includes("web") || text.includes("api basics") || text.includes("request") || text.includes("response")) return "api_basics";
  return "api_basics";
};

export const getInteractiveLessonPack = (title: string, categoryName: string): InteractiveLessonPack => {
  const unitKey = detectUnit(categoryName, title);
  const unitLabelMap: Record<keyof typeof UNIT_PACKS, string> = {
    api_basics: "Unit 1 - Web & API Basics",
    auth: "Unit 2 - Authentication",
    database: "Unit 3 - Database",
    backend: "Unit 4 - Backend",
    testing: "Unit 5 - Testing",
    uiux: "Unit 6 - UI/UX"
  };
  return {
    unitLabel: unitLabelMap[unitKey],
    ...UNIT_PACKS[unitKey]
  };
};

export const mergeInteractiveLessonPack = (
  base: InteractiveLessonPack,
  override?: InteractiveLessonOverride
): InteractiveLessonPack => {
  if (!override) return base;
  return {
    unitLabel: override.unitLabel || base.unitLabel,
    animationTitle: override.animationTitle || base.animationTitle,
    animationFlow: Array.isArray((override as any).animationFlow) && (override as any).animationFlow.length > 0
      ? (override as any).animationFlow
      : base.animationFlow,
    howItWorks: Array.isArray((override as any).howItWorks) && (override as any).howItWorks.length > 0
      ? (override as any).howItWorks
      : base.howItWorks,
    script: Array.isArray(override.script) && override.script.length > 0 ? override.script : base.script,
    quickQuestions:
      Array.isArray(override.quickQuestions) && override.quickQuestions.length > 0
        ? override.quickQuestions
        : base.quickQuestions,
    miniTask: {
      title: override.miniTask?.title || base.miniTask.title,
      instruction: override.miniTask?.instruction || base.miniTask.instruction,
      actionLabel: override.miniTask?.actionLabel || base.miniTask.actionLabel,
      actionUrl: override.miniTask?.actionUrl || base.miniTask.actionUrl,
      actionPrompt: override.miniTask?.actionPrompt || base.miniTask.actionPrompt
    },
    buildNowLabel: override.buildNowLabel || base.buildNowLabel
    ,
    fullQuiz: Array.isArray((override as any).fullQuiz) && (override as any).fullQuiz.length > 0
      ? (override as any).fullQuiz
      : base.fullQuiz
  };
};
