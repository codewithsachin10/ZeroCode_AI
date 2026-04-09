import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { db } from "@/lib/firebase";
import { collection, query, where, getDocs, limit } from "firebase/firestore";
import { 
  Github, 
  Linkedin, 
  Twitter, 
  Globe2, 
  Zap, 
  Database, 
  Flame, 
  ExternalLink,
  ShieldCheck,
  User,
  LayoutGrid,
  Activity,
  Trophy,
  Award,
  ChevronRight,
  ArrowRight,
  MapPin,
  Calendar,
  Terminal,
  Share2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";
import { isValidUsername, sanitizeExternalUrl } from "@/lib/security";
import AppLoader from "@/components/ui/AppLoader";

type PublicUser = {
  name: string;
  username: string;
  bio: string;
  profilePhoto: string;
  githubLink?: string;
  linkedinLink?: string;
  vercelLink?: string;
  supabaseLink?: string;
  firebaseLink?: string;
  portfolioUrl?: string;
  createdAt: any;
};

type PublicProject = {
  id: string;
  title: string;
  description: string;
  type: string;
  status: string;
};

const PublicProfile = () => {
  const { username } = useParams();
  const [user, setUser] = useState<PublicUser | null>(null);
  const [projects, setProjects] = useState<PublicProject[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    const fetchPublicData = async () => {
      setLoading(true);
      setError(false);
      try {
        if (!username || !isValidUsername(username)) {
          setError(true);
          return;
        }
        // Fetch User by username
        const usersRef = collection(db, "users");
        const q = query(usersRef, where("username", "==", username), where("isPublic", "==", true), limit(1));
        const userSnap = await getDocs(q);

        if (userSnap.empty) {
          setError(true);
          setLoading(false);
          return;
        }

        const userData = userSnap.docs[0].data() as PublicUser;
        const userId = userSnap.docs[0].id;
        setUser(userData);

        // Fetch Public Projects
        const projectsRef = collection(db, "projects");
        const pq = query(projectsRef, where("userId", "==", userId), where("isPublic", "==", true), limit(6));
        const projectsSnap = await getDocs(pq);
        setProjects(projectsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() } as PublicProject)));

      } catch (e) {
        console.error("Public Fetch Domain Failure:", e);
        setError(true);
      } finally {
        setLoading(false);
      }
    };

    fetchPublicData();
  }, [username]);

  if (loading) return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-10">
       <AppLoader label="Syncing public profile..." />
    </div>
  );

  if (error || !user) return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-10 text-center">
       <ShieldCheck size={64} className="text-destructive mb-8 opacity-20" />
       <h1 className="text-4xl font-black uppercase tracking-tighter mb-4">Node Not Discovered</h1>
       <p className="text-text-muted font-bold italic mb-10 max-w-md">The developer profile "{username}" does not exist or is private.</p>
       <Link to="/">
          <Button className="h-14 px-10 bg-primary text-black font-black uppercase text-xs tracking-widest rounded-2xl">Return to Core</Button>
       </Link>
    </div>
  );

  const socials = [
    { label: "GitHub", link: user.githubLink, icon: Github, color: "text-slate-300" },
    { label: "LinkedIn", link: user.linkedinLink, icon: Linkedin, color: "text-[#0A66C2]" },
    { label: "Vercel", link: user.vercelLink, icon: Zap, color: "text-white" },
    { label: "Supabase", link: user.supabaseLink, icon: Database, color: "text-[#3ECF8E]" },
    { label: "Firebase", link: user.firebaseLink, icon: Flame, color: "text-[#FFCA28]" },
    { label: "Web", link: user.portfolioUrl, icon: Globe2, color: "text-primary" }
  ].filter(s => s.link);

  return (
    <div className="min-h-screen bg-background text-foreground pb-40">
       {/* Background Grid Accent */}
       <div className="fixed inset-0 bg-[linear-gradient(rgba(34,197,94,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(34,197,94,0.03)_1px,transparent_1px)] bg-[size:100px_100px] pointer-events-none" />
       
       {/* Top Header */}
       <header className="fixed top-0 inset-x-0 h-20 bg-background/80 backdrop-blur-md border-b border-white/5 z-[60] px-10">
          <div className="max-w-7xl mx-auto h-full flex items-center justify-between">
             <Link to="/" className="text-xl font-black uppercase tracking-widest flex items-center gap-3">
                <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center text-black shadow-lg shadow-primary/20"><Terminal size={18} /></div>
                VibeCode<span className="text-primary">.P</span>
             </Link>
             <div className="flex items-center gap-6">
                <span className="text-[10px] font-black uppercase tracking-widest text-text-muted italic hidden md:block">Certified Developer Node Active</span>
                <Link to="/signup">
                   <Button variant="outline" className="h-10 border-primary text-primary font-black uppercase text-[10px] tracking-widest rounded-xl px-6">Join Academy</Button>
                </Link>
             </div>
          </div>
       </header>

       {/* Main Content */}
       <main className="max-w-7xl mx-auto pt-40 px-10 relative z-10">
          <div className="grid lg:grid-cols-12 gap-16">
             
             {/* Left Section: Identity Profile */}
             <div className="lg:col-span-4 space-y-12">
                <div className="space-y-8">
                   <div className="relative group w-48 h-48 mx-auto lg:mx-0">
                      <div className="absolute inset-0 bg-primary/20 rounded-[50px] blur-2xl group-hover:blur-3xl transition-all" />
                      <div className="relative w-48 h-48 rounded-[50px] border-4 border-white/5 overflow-hidden shadow-2xl">
                         {user.profilePhoto ? (
                            <img src={user.profilePhoto} alt={user.name} className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-700" />
                         ) : (
                            <div className="w-full h-full bg-surface flex items-center justify-center text-text-muted"><User size={64} /></div>
                         )}
                      </div>
                   </div>
                   
                   <div className="text-center lg:text-left space-y-4">
                      <div>
                         <h1 className="text-5xl font-black uppercase tracking-tighter text-white">{user.name}</h1>
                         <p className="text-xl font-bold text-primary italic opacity-70">@{user.username}</p>
                      </div>
                      <p className="text-base text-text-secondary leading-relaxed font-medium">
                         {user.bio || "This developer hasn't synchronized their mission profile yet. Awaiting initialization handshake."}
                      </p>
                   </div>
                </div>

                {/* Social Handshakes */}
                <div className="space-y-6">
                   <h3 className="text-xs font-black uppercase tracking-[0.3em] text-text-muted px-2">Social Handshakes</h3>
                   <div className="grid grid-cols-2 gap-4">
                      {socials.map((social) => {
                         const safeLink = sanitizeExternalUrl(String(social.link));
                         if (!safeLink) return null;
                         return <a 
                           key={social.label} 
                           href={safeLink} 
                           target="_blank" 
                           rel="noopener noreferrer"
                           className="flex items-center gap-4 p-5 bg-surface border border-white/5 rounded-[24px] hover:border-primary/40 group transition-all"
                         >
                            <social.icon className={`${social.color} group-hover:scale-110 transition-transform`} size={18} />
                            <span className="text-[10px] font-black uppercase tracking-widest text-text-muted">{social.label}</span>
                         </a>
                      })}
                   </div>
                </div>

                <div className="p-8 bg-primary/5 border border-primary/20 rounded-[32px] space-y-6">
                   <div className="flex items-center gap-4">
                      <Award className="text-primary" size={24} />
                      <h4 className="font-black uppercase tracking-widest text-sm">Elite Member Node</h4>
                   </div>
                   <div className="flex items-center justify-between text-[10px] font-black uppercase tracking-widest text-text-muted italic">
                      <span>Sync ID: #{user.username.length*42}</span>
                      <span>Joined: {user.createdAt ? format(user.createdAt.toDate(), "MMM yyyy") : "Alpha"}</span>
                   </div>
                </div>
             </div>

             {/* Right Section: Production Matrix */}
             <div className="lg:col-span-8 space-y-16">
                
                {/* Statistics Row */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                   {[
                      { label: "Active Yield", value: projects.length, icon: LayoutGrid, color: "text-primary" },
                      { label: "Node Rank", value: "#0" + (user.username.length + 4), icon: Trophy, color: "text-orange-500" },
                      { label: "Pulse Strength", value: "98%", icon: Activity, color: "text-green-500" },
                      { label: "Sync Status", value: "Verified", icon: ShieldCheck, color: "text-blue-500" }
                   ].map(stat => (
                      <div key={stat.label} className="p-6 bg-[#111] border border-white/5 rounded-[32px] space-y-3 group hover:border-white/10 transition-all">
                         <div className={`p-3 w-fit bg-white/5 rounded-xl ${stat.color} group-hover:scale-110 transition-transform`}>
                            <stat.icon size={18} />
                         </div>
                         <div>
                            <p className="text-[9px] font-black uppercase tracking-widest text-text-muted italic">{stat.label}</p>
                            <h4 className="text-xl font-black text-white">{stat.value}</h4>
                         </div>
                      </div>
                   ))}
                </div>

                {/* Projects Section */}
                <div className="space-y-10">
                   <div className="flex items-center justify-between px-4">
                      <h2 className="text-3xl font-black uppercase tracking-tight italic">Public Build Matrix</h2>
                      <div className="h-0.5 flex-1 bg-white/5 mx-10 rounded-full" />
                   </div>
                   
                   <div className="grid md:grid-cols-2 gap-8">
                      {projects.length > 0 ? (
                         projects.map(project => (
                            <div key={project.id} className="p-8 bg-[#111] border border-white/5 rounded-[40px] shadow-2xl hover:border-primary/20 transition-all group relative overflow-hidden">
                               <div className="absolute top-0 right-0 p-8 opacity-0 group-hover:opacity-20 transition-opacity">
                                  <LayoutGrid size={48} className="text-primary" />
                                </div>
                               <div className="relative z-10 space-y-6">
                                  <div className="flex items-center justify-between">
                                     <span className="text-[10px] font-black uppercase tracking-widest text-primary italic bg-primary/5 px-3 py-1 rounded-md border border-primary/20">Production Node</span>
                                     <div className="flex items-center gap-2">
                                        <div className="w-2 h-2 rounded-full bg-green-500 shadow-lg shadow-green-500/50" />
                                        <span className="text-[10px] font-black uppercase tracking-widest text-text-muted">{project.status || "Active"}</span>
                                     </div>
                                  </div>
                                  <div>
                                     <h3 className="text-2xl font-black uppercase tracking-tighter mb-2 group-hover:text-primary transition-colors">{project.title}</h3>
                                     <p className="text-sm text-text-muted font-bold leading-relaxed line-clamp-3 italic">
                                        {project.description || "Internal production logic encrypted. Awaiting public manifest update."}
                                     </p>
                                  </div>
                                  <Button variant="ghost" className="p-0 h-auto font-black uppercase text-[10px] tracking-widest text-primary gap-2 group/btn">
                                     Explore Architecture <ArrowRight size={14} className="group-hover/btn:translate-x-2 transition-transform" />
                                  </Button>
                               </div>
                            </div>
                         ))
                      ) : (
                         <div className="col-span-2 py-32 bg-surface/20 rounded-[40px] border-2 border-dashed border-white/5 flex flex-col items-center justify-center text-center px-10">
                            <Terminal size={48} className="text-text-muted mb-8 opacity-20" />
                            <h3 className="text-xl font-black uppercase tracking-widest mb-4">Zero Public Handshakes</h3>
                            <p className="text-sm text-text-muted font-bold italic max-w-sm">This developer has not yet exposed any production nodes to the public build matrix.</p>
                         </div>
                      )}
                   </div>
                </div>

                {/* Call to Action */}
                <div className="p-12 bg-surface border border-white/10 rounded-[50px] flex flex-col md:flex-row items-center justify-between gap-12 text-center md:text-left relative overflow-hidden group">
                   <div className="absolute inset-x-0 bottom-0 h-1 bg-primary scale-x-0 group-hover:scale-x-100 transition-transform duration-700" />
                   <div className="space-y-4 relative z-10">
                      <h3 className="text-3xl font-black uppercase tracking-tighter italic">Want a profile like this?</h3>
                      <p className="text-text-secondary font-bold max-w-sm">Join VibeCode Academy today and synchronize your developer identity with a professional production mesh.</p>
                   </div>
                   <Link to="/signup" className="relative z-10">
                      <Button className="h-20 px-12 bg-primary text-black font-black uppercase text-sm tracking-widest rounded-[32px] shadow-2xl shadow-primary/30 hover:scale-105 transition-all gap-4">
                         Initialize My Profile <Share2 size={20} />
                      </Button>
                   </Link>
                </div>

             </div>
          </div>
       </main>

       {/* Floating Footer Access */}
       <footer className="fixed bottom-10 inset-x-0 pointer-events-none px-10 text-center">
          <div className="inline-flex items-center bg-black/80 backdrop-blur-xl border border-white/10 p-2 rounded-full pointer-events-auto shadow-2xl">
             <div className="px-6 py-2 text-[10px] font-black uppercase tracking-widest text-text-muted border-r border-white/10 italic">Internal Node v1.0.4</div>
             <a href="#" className="px-6 py-2 text-[10px] font-black uppercase tracking-widest text-primary hover:scale-110 transition-transform italic">Privacy Protocol</a>
          </div>
       </footer>
    </div>
  );
};

export default PublicProfile;
