import { useState, useEffect, useRef, memo, useMemo } from "react";
import Layout from "@/components/Layout";
import { 
  User, ShieldCheck, Settings, Github, Linkedin, 
  Terminal, Database, Flame, Copy, Save, Camera, Lock, Loader2,
  Image as ImageIcon, Upload, LogOut, Zap, Globe2, PcCase, Activity,
  BookOpen, Bookmark, LayoutGrid, ListTodo, Trophy, TrendingUp,
  Share2, ArrowUpRight, Eye, EyeOff, History, Smartphone, Key, Instagram, Youtube, 
  AlertCircle, CalendarDays, Award
} from "lucide-react";
import { db, auth, storage } from "@/lib/firebase";
import { doc, updateDoc, setDoc, serverTimestamp } from "firebase/firestore";
import { updatePassword, signOut } from "firebase/auth";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import { useUser } from "@/context/UserContext";
import { isStrongPassword, isValidUsername, sanitizeExternalUrl, validateUpload } from "@/lib/security";
import AppLoader from "@/components/ui/AppLoader";

import CustomLinks from "@/components/profile/CustomLinks";
import DashboardInsights from "@/components/profile/DashboardInsights";
import KnowledgeNodes from "@/components/profile/KnowledgeNodes";
import SavedVault from "@/components/profile/SavedVault";
import ProjectMatrix from "@/components/profile/ProjectMatrix";
import TaskBoard from "@/components/profile/TaskBoard";
import Leaderboard from "@/components/profile/Leaderboard";
import ProductionCalendar from "@/components/profile/ProductionCalendar";
import Certificates from "@/components/profile/Certificates";

type AccountTab = "overview" | "projects" | "tasks" | "calendar" | "leaderboard" | "notes" | "vault" | "links" | "certificates" | "profile" | "security" | "settings";

const Account = () => {
  const { profile, loading: userLoading } = useUser();
  const [activeTab, setActiveTab] = useState<AccountTab>("overview");
  
  const [editData, setEditData] = useState<Record<string, unknown> | null>(null);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (profile && !editData) {
      setEditData({ ...profile });
    }
  }, [profile, editData]);

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile || !auth.currentUser || !editData) return;
    setSaving(true);
    try {
      const username = String(editData.username || "").trim();
      if (!isValidUsername(username)) {
        toast.error("Username must be 3-30 letters, numbers, or underscore.");
        return;
      }
      const profilePhotoUrl = String(editData.profilePhoto || "").trim();
      if (profilePhotoUrl && !sanitizeExternalUrl(profilePhotoUrl)) {
        toast.error("Profile photo URL is invalid.");
        return;
      }
      const safeUpdate = {
        name: String(editData.name || "").trim().slice(0, 80),
        username,
        phone: String(editData.phone || "").trim().slice(0, 20),
        bio: String(editData.bio || "").trim().slice(0, 500),
        profilePhoto: profilePhotoUrl || "",
        githubLink: String(editData.githubLink || "").trim(),
        linkedinLink: String(editData.linkedinLink || "").trim(),
        vercelLink: String(editData.vercelLink || "").trim(),
        supabaseLink: String(editData.supabaseLink || "").trim(),
        firebaseLink: String(editData.firebaseLink || "").trim(),
        portfolioUrl: String(editData.portfolioUrl || "").trim(),
      };
      const userRef = doc(db, "users", auth.currentUser.uid);
      await updateDoc(userRef, {
        ...safeUpdate,
        updatedAt: serverTimestamp()
      });
      toast.success("Profile updated.");
    } catch (e) {
      toast.error("Failed to update.");
    } finally {
      setSaving(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !auth.currentUser) return;
    const uploadCheck = validateUpload(file, {
      maxBytes: 2 * 1024 * 1024,
      allowedMimeTypes: ["image/jpeg", "image/png", "image/webp", "image/gif"],
    });
    if (!uploadCheck.ok) {
      toast.error(uploadCheck.reason || "Invalid file.");
      return;
    }

    setUploading(true);
    try {
      const storageRef = ref(storage, `avatars/${auth.currentUser.uid}`);
      await uploadBytes(storageRef, file);
      const url = await getDownloadURL(storageRef);
      setEditData((prev) => ({ ...(prev || {}), profilePhoto: url }));
      
      const userRef = doc(db, "users", auth.currentUser.uid);
      await updateDoc(userRef, { profilePhoto: url });
      
      toast.success("Photo uploaded.");
    } catch {
      toast.error("Upload failed.");
    } finally {
      setUploading(false);
    }
  };

  const handleUpdatePassword = async () => {
    if (!isStrongPassword(newPassword)) {
       toast.error("Use 8+ chars with upper, lower, and number.");
       return;
    }
    setSaving(true);
    try {
      if (auth.currentUser) {
        await updatePassword(auth.currentUser, newPassword);
        setNewPassword("");
        toast.success("Password updated.");
      }
    } catch {
      toast.error("Update failed. Please re-login and try again.");
    } finally {
      setSaving(false);
    }
  };

  const handleSaveSocialLinks = async () => {
    if (!auth.currentUser || !editData) return;
    setSaving(true);
    try {
      const socialKeys = [
        "githubLink",
        "linkedinLink",
        "twitterLink",
        "instagramLink",
        "youtubeLink",
        "portfolioUrl",
      ] as const;
      const payload: Record<string, string> = {};
      for (const key of socialKeys) {
        const value = String(editData[key] || "").trim();
        if (value && !sanitizeExternalUrl(value)) {
          toast.error(`Invalid URL for ${key.replace("Link", "")}.`);
          return;
        }
        payload[key] = value ? sanitizeExternalUrl(value) || "" : "";
      }
      await updateDoc(doc(db, "users", auth.currentUser.uid), {
        ...payload,
        updatedAt: serverTimestamp(),
      });
      toast.success("Social links updated.");
    } catch {
      toast.error("Failed to update social links.");
    } finally {
      setSaving(false);
    }
  };

  if (userLoading || !editData) return (
     <Layout minimalNavbar={true}>
        <div className="min-h-screen flex items-center justify-center bg-[#0B0B0B]">
           <AppLoader label="Loading account..." />
        </div>
     </Layout>
  );

  const tabs = [
    { id: "overview", label: "Overview", icon: Activity },
    { id: "projects", label: "Projects", icon: LayoutGrid },
    { id: "tasks", label: "Tasks", icon: ListTodo },
    { id: "calendar", label: "Calendar", icon: CalendarDays },
    { id: "leaderboard", label: "Leaderboard", icon: Trophy },
    { id: "notes", label: "Notes", icon: BookOpen },
    { id: "certificates", label: "Certificates", icon: Award },
    { id: "vault", label: "Saved", icon: Bookmark },
    { id: "links", label: "Links", icon: Globe2 },
    { id: "profile", label: "Profile", icon: User },
    { id: "security", label: "Security", icon: ShieldCheck },
  ];

  return (
    <Layout hideFooter={true} minimalNavbar={true}>
      <div className="pt-16 min-h-screen bg-[#0B0B0B]">
        <div className="flex h-[calc(100vh-64px)] overflow-hidden">
          
          <aside className="fixed top-16 left-0 w-64 h-[calc(100vh-64px)] border-r border-white/5 flex flex-col bg-[#0B0B0B] z-30">
             <div className="h-16 flex items-center px-8 border-b border-white/5 shrink-0">
                <h1 className="text-xs font-bold uppercase tracking-widest text-primary">Account Hub</h1>
             </div>

             <nav className="flex-1 py-4 px-4 space-y-1 overflow-y-auto scrollbar-hide">
                {tabs.map(tab => (
                   <button
                     key={tab.id}
                    onClick={() => setActiveTab(tab.id as AccountTab)}
                     className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-[10px] font-bold uppercase tracking-widest transition-all ${
                       activeTab === tab.id 
                         ? 'bg-primary text-black shadow-lg shadow-primary/10' 
                         : 'text-text-muted hover:bg-white/5 hover:text-white'
                     }`}
                   >
                      <tab.icon size={14} />
                      <span>{tab.label}</span>
                   </button>
                ))}
             </nav>

             <div className="p-8 border-t border-white/5 shrink-0">
                <button 
                  onClick={async () => {
                    await signOut(auth);
                    localStorage.removeItem("chatbot_hidden");
                    navigate("/");
                  }}
                  className="tactile-btn tactile-btn-red w-full"
                >
                   <span className="btn-shadow"></span>
                   <span className="btn-edge"></span>
                   <span className="btn-front flex items-center justify-center gap-3">
                      <LogOut size={14} />
                      Logout
                   </span>
                </button>
             </div>
          </aside>

          <main className="flex-1 ml-64 overflow-y-auto p-12 bg-[#0B0B0B]">
             <div className="w-full pb-40 space-y-12">
                
                {activeTab === "overview" && <DashboardInsights />}
                {activeTab === "projects" && <ProjectMatrix />}
                {activeTab === "tasks" && <TaskBoard />}
                {activeTab === "calendar" && <ProductionCalendar />}
                {activeTab === "leaderboard" && <Leaderboard />}
                {activeTab === "notes" && <KnowledgeNodes />}
                {activeTab === "vault" && <SavedVault />}
                {activeTab === "links" && (
                  <div className="space-y-8">
                    <div className="p-8 bg-[#111] border border-white/5 rounded-xl space-y-6">
                      <div className="space-y-2">
                        <h2 className="text-base font-bold uppercase text-white">Social Links</h2>
                        <p className="text-[10px] text-text-muted">Add your public social profiles.</p>
                      </div>
                      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {[
                          { key: "githubLink", label: "GitHub", logo: "https://cdn.simpleicons.org/github/ffffff", placeholder: "https://github.com/username" },
                          { key: "linkedinLink", label: "LinkedIn", logo: "https://cdn.simpleicons.org/linkedin/0A66C2", placeholder: "https://linkedin.com/in/username" },
                          { key: "twitterLink", label: "X / Twitter", logo: "https://cdn.simpleicons.org/x/ffffff", placeholder: "https://x.com/username" },
                          { key: "instagramLink", label: "Instagram", logo: "https://cdn.simpleicons.org/instagram/E4405F", placeholder: "https://instagram.com/username" },
                          { key: "youtubeLink", label: "YouTube", logo: "https://cdn.simpleicons.org/youtube/FF0000", placeholder: "https://youtube.com/@channel" },
                          { key: "portfolioUrl", label: "Website", logo: "https://cdn.simpleicons.org/googlechrome/34A853", placeholder: "https://your-site.com" },
                        ].map((item) => (
                          <div key={item.key} className="p-4 bg-black/30 border border-white/10 rounded-xl space-y-3">
                            <div className="flex items-center gap-3">
                              <div className="w-9 h-9 rounded-lg bg-[#0b0b0b] border border-white/10 flex items-center justify-center shrink-0 overflow-hidden">
                                <img src={item.logo} alt={item.label} className="w-5 h-5 object-contain" />
                              </div>
                              <label className="text-[10px] font-bold uppercase tracking-widest text-text-muted">
                                {item.label}
                              </label>
                            </div>
                            <input
                              type="text"
                              value={String(editData?.[item.key] || "")}
                              onChange={(e) => setEditData({ ...editData, [item.key]: e.target.value })}
                              placeholder={item.placeholder}
                              className="w-full bg-black/50 border border-white/10 rounded-lg px-3 h-9 text-[11px] font-bold text-white focus:border-primary/40 outline-none"
                            />
                          </div>
                        ))}
                      </div>
                      <Button
                        onClick={handleSaveSocialLinks}
                        disabled={saving}
                        className="h-11 px-6 rounded-lg bg-primary text-black font-bold uppercase text-[10px] tracking-widest"
                      >
                        Save Social Links
                      </Button>
                    </div>
                    <CustomLinks />
                  </div>
                )}
                { activeTab === "certificates" && <Certificates /> }

                {activeTab === "profile" && (
                  <form onSubmit={handleUpdateProfile} className="space-y-8">
                     <div className="space-y-4">
                        <h2 className="text-base font-bold uppercase text-white">Profile Photo</h2>
                        <div className="bg-[#111] border border-white/5 p-6 rounded-xl flex items-center gap-8">
                           <div className="relative group shrink-0">
                              <div className="w-24 h-24 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center font-bold text-2xl text-primary overflow-hidden">
                                 {editData.profilePhoto ? <img src={editData.profilePhoto} className="w-full h-full object-cover" /> : editData.name?.charAt(0).toUpperCase()}
                                 {uploading && (
                                    <div className="absolute inset-0 bg-black/80 flex items-center justify-center">
                                       <Loader2 className="animate-spin text-primary" size={16} />
                                    </div>
                                 )}
                              </div>
                              <button 
                                type="button" 
                                onClick={() => fileInputRef.current?.click()}
                                className="absolute -bottom-2 -right-2 bg-primary p-2 rounded-lg border-4 border-[#111] text-black"
                              >
                                 <Camera size={14} />
                              </button>
                              <input type="file" ref={fileInputRef} onChange={handleFileUpload} className="hidden" accept="image/*" />
                           </div>

                           <div className="flex-1 space-y-3">
                              <label className="text-[10px] font-bold uppercase tracking-widest text-text-muted">Direct Image Link</label>
                              <input 
                                type="text" 
                                placeholder="https://..."
                                value={editData.profilePhoto || ""}
                                onChange={(e) => setEditData({...editData, profilePhoto: e.target.value})}
                                className="w-full bg-black/40 border border-white/10 rounded-lg px-4 h-10 text-xs font-bold text-white focus:border-primary/40 outline-none"
                              />
                              <p className="text-[9px] text-text-muted">You can upload directly or paste a link.</p>
                           </div>
                        </div>
                     </div>

                     <div className="space-y-6">
                        <div className="flex items-center justify-between">
                           <h2 className="text-base font-bold uppercase text-white">Basic Info</h2>
                           <Button 
                             type="button"
                             onClick={() => navigate(`/u/${profile?.username}`)}
                             variant="ghost"
                             className="h-8 px-4 text-[9px] font-bold uppercase tracking-widest text-primary hover:bg-primary/5 transition-all"
                           >
                              <ArrowUpRight size={12} className="mr-2" />
                              View Public Profile
                           </Button>
                        </div>
                        <div className="grid md:grid-cols-2 gap-4">
                           {[
                             { label: "Full Name", key: "name" },
                             { label: "Username (@)", key: "username" },
                             { label: "Email Address", key: "email", disabled: true },
                             { label: "Phone Number", key: "phone" },
                           ].map(field => (
                              <div key={field.key} className="space-y-2">
                                 <label className="text-[10px] font-bold uppercase tracking-widest text-text-muted ml-1">{field.label}</label>
                                 <input 
                                   type="text" 
                                   value={String(editData?.[field.key] || "")} 
                                   disabled={field.disabled}
                                   onChange={(e) => setEditData({...editData, [field.key]: e.target.value})}
                                   className="w-full bg-[#111] border border-white/5 rounded-lg px-4 h-10 text-xs font-bold text-white focus:border-primary/40 outline-none disabled:opacity-30"
                                 />
                              </div>
                           ))}
                        </div>
                        <div className="space-y-2">
                           <label className="text-[10px] font-bold uppercase tracking-widest text-text-muted ml-1">Bio</label>
                           <textarea 
                             rows={4}
                             value={editData.bio || ""}
                             onChange={(e) => setEditData({...editData, bio: e.target.value})}
                             placeholder="Tell us about yourself..."
                             className="w-full bg-[#111] border border-white/5 rounded-lg p-4 text-xs font-medium text-white focus:border-primary/40 outline-none resize-none leading-relaxed"
                           />
                        </div>
                     </div>

                     <Button type="submit" disabled={saving} className="h-12 px-8 rounded-lg bg-primary text-black font-bold uppercase text-[10px] tracking-widest transition-all">
                        {saving ? <Loader2 className="animate-spin" size={14} /> : <Save size={14} className="mr-2" />}
                        Save Changes
                     </Button>
                  </form>
                )}

                {activeTab === "security" && (
                  <div className="space-y-8">
                     <h2 className="text-base font-bold uppercase text-white">Security</h2>
                     <div className="grid lg:grid-cols-2 gap-6">
                        <div className="p-8 bg-[#111] border border-white/5 rounded-xl space-y-6">
                           <div className="flex items-center gap-2">
                              <Key className="text-primary" size={14} />
                              <h3 className="text-[10px] font-bold uppercase tracking-widest text-white">Change Password</h3>
                           </div>
                           <div className="space-y-4">
                              <div className="relative">
                                 <input 
                                   type={showPassword ? "text" : "password"}
                                   placeholder="New Password..."
                                   value={newPassword}
                                   onChange={(e) => setNewPassword(e.target.value)}
                                   className="w-full bg-black/60 border border-white/10 rounded-lg h-10 px-4 text-xs font-bold text-white focus:border-primary/40 outline-none pr-10"
                                 />
                                 <button onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted hover:text-white">
                                    {showPassword ? <EyeOff size={14} /> : <Eye size={14} />}
                                 </button>
                              </div>
                              <Button onClick={handleUpdatePassword} disabled={saving} className="w-full h-10 rounded-lg bg-primary text-black font-bold uppercase text-[10px] tracking-widest transition-all">
                                 Update Access Key
                              </Button>
                           </div>
                        </div>

                        <div className="p-8 bg-white/5 border border-white/5 rounded-xl flex flex-col justify-between">
                            <div className="space-y-2">
                               <div className="flex items-center gap-2">
                                  <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                                  <span className="text-[10px] font-bold text-primary uppercase tracking-widest">Connected</span>
                                </div>
                                <h4 className="text-lg font-bold text-white uppercase mt-1">Status: Secure</h4>
                                <p className="text-[10px] text-text-muted">Your account is synchronized with our secure identity service.</p>
                            </div>
                            <ShieldCheck size={32} className="text-primary opacity-20 mt-4" />
                        </div>
                     </div>
                  </div>
                )}
             </div>
          </main>
        </div>
      </div>
    </Layout>
  );
};

export default memo(Account);
