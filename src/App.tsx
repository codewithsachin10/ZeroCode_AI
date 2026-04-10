import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Navigate, Route, Routes, useParams } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { lazy, Suspense } from "react";

import ErrorBoundary from "./components/ErrorBoundary";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";

const PromptLibrary = lazy(() => import("./pages/PromptLibrary"));
const ToolsPage = lazy(() => import("./pages/ToolsPage"));
const GuidedBuild = lazy(() => import("./pages/GuidedBuild"));
const HackathonMode = lazy(() => import("./pages/HackathonMode"));
const HackathonDetails = lazy(() => import("./pages/HackathonDetails"));
const Login = lazy(() => import("./pages/Login"));
const Signup = lazy(() => import("./pages/Signup"));
const Dashboard = lazy(() => import("./pages/Dashboard"));
const Feedback = lazy(() => import("./pages/Feedback"));
const FAQPage = lazy(() => import("./pages/FAQPage"));
const SavedPrompts = lazy(() => import("./pages/SavedPrompts"));
const Account = lazy(() => import("./pages/Account"));
const Chat = lazy(() => import("./pages/Chat"));
const PublicProfile = lazy(() => import("./pages/PublicProfile"));
const LearningHub = lazy(() => import("./pages/LearningHub"));
const VideoPlayer = lazy(() => import("./pages/VideoPlayer"));
const Certificate = lazy(() => import("./pages/Certificate"));

import { ProtectedRoute } from "./components/ProtectedRoute";

// Admin Pages
import AdminLayout from "./pages/admin/AdminLayout";
import AdminDashboard from "./pages/admin/AdminDashboard";
import AdminPrompts from "./pages/admin/AdminPrompts";
import AdminCategories from "./pages/admin/AdminCategories";
import AdminUsers from "./pages/admin/AdminUsers";
import AdminAnalytics from "./pages/admin/AdminAnalytics";
import AdminLearning from "./pages/admin/AdminLearning";
import AdminHackathons from "./pages/admin/AdminHackathons";
import AdminFeedback from "./pages/admin/AdminFeedback";
import AdminSettings from "./pages/admin/AdminSettings";

import { AcademyProvider } from "./context/AcademyContext";
import { UserProvider } from "./context/UserContext";
import AppLoader from "./components/ui/AppLoader";

const queryClient = new QueryClient();

const Loading = () => (
  <div className="min-h-screen flex items-center justify-center bg-[#0B0B0B]">
    <AppLoader label="Synchronizing academy mesh..." />
  </div>
);

const LegacyAcademyVideoRedirect = () => {
  const { videoId } = useParams();
  return <Navigate to={videoId ? `/learn/${videoId}` : "/learn"} replace />;
};

const LegacyAcademyCertificateRedirect = () => {
  const { catId } = useParams();
  return <Navigate to={catId ? `/learn/certificate/${catId}` : "/learn"} replace />;
};

const App = () => (
  <ErrorBoundary>
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster position="top-right" expand={false} visibleToasts={3} />
        <BrowserRouter>
          <UserProvider>
            <AcademyProvider>
              <Suspense fallback={<Loading />}>
              <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/prompts" element={<PromptLibrary />} />
              <Route path="/tools" element={<ToolsPage />} />
              <Route path="/guided-build" element={<GuidedBuild />} />
              <Route path="/hackathon" element={<HackathonMode />} />
              <Route path="/hackathon/:hackathonId" element={<HackathonDetails />} />
              <Route path="/login" element={<Login />} />
              <Route path="/signup" element={<Signup />} />
              
              <Route 
                path="/dashboard" 
                element={
                  <ProtectedRoute>
                    <Dashboard />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/account" 
                element={
                  <ProtectedRoute>
                    <Account />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/favorites" 
                element={
                  <ProtectedRoute>
                    <SavedPrompts />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/chat" 
                element={
                  <ProtectedRoute>
                    <Chat />
                  </ProtectedRoute>
                } 
              />

              {/* Smart Learning Engine Routes */}
              <Route 
                path="/learn" 
                element={
                  <ProtectedRoute>
                    <LearningHub />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/learn/module/:moduleKey" 
                element={
                  <ProtectedRoute>
                    <LearningHub />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/learn/:videoId" 
                element={
                  <ProtectedRoute>
                    <VideoPlayer />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/learn/certificate/:catId" 
                element={
                  <ProtectedRoute>
                    <Certificate />
                  </ProtectedRoute>
                } 
              />
              <Route path="/academy" element={<Navigate to="/learn" replace />} />
              <Route path="/academy/:videoId" element={<LegacyAcademyVideoRedirect />} />
              <Route path="/academy/certificate/:catId" element={<LegacyAcademyCertificateRedirect />} />

              <Route path="/feedback" element={<Feedback />} />
              <Route path="/faq" element={<FAQPage />} />
              
              {/* Admin Routes */}
              <Route 
                path="/admin" 
                element={
                  <ProtectedRoute adminOnly={true}>
                    <AdminLayout />
                  </ProtectedRoute>
                }
              >
                <Route index element={<AdminDashboard />} />
                <Route path="prompts" element={<AdminPrompts />} />
                <Route path="categories" element={<AdminCategories />} />
                <Route path="users" element={<AdminUsers />} />
                <Route path="analytics" element={<AdminAnalytics />} />
                <Route path="learning" element={<AdminLearning />} />
                <Route path="hackathons" element={<AdminHackathons />} />
                <Route path="feedback" element={<AdminFeedback />} />
                <Route path="settings" element={<AdminSettings />} />
              </Route>

              <Route path="/u/:username" element={<PublicProfile />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </Suspense>
        </AcademyProvider>
      </UserProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
  </ErrorBoundary>
);

export default App;
