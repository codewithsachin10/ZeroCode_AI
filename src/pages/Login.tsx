import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import Layout from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Eye, EyeOff, CheckCircle2, Loader2, Sparkles } from "lucide-react";
import AppLoader from "@/components/ui/AppLoader";
import { auth, db } from "@/lib/firebase";
import { signInWithEmailAndPassword } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [userName, setUserName] = useState("");
  const navigate = useNavigate();
  const location = useLocation();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      toast.error("Please fill in all fields");
      return;
    }
    setLoading(true);
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
      
      const userDoc = await getDoc(doc(db, "users", user.uid));
      const name = userDoc.exists() ? userDoc.data().name : user.displayName || "Developer";
      setUserName(name);
      const fromPath = location.state?.from?.pathname;
      
      setSuccess(true);
      
      setTimeout(() => {
         if (fromPath && fromPath.startsWith("/")) {
           navigate(fromPath);
         } else if (userDoc.exists() && ["admin", "super_admin"].includes(userDoc.data().role)) {
           navigate("/admin");
         } else {
           navigate("/account");
         }
      }, 2500);

    } catch (error: unknown) {
      console.error("Login submission error:", error);
      toast.error("Failed to login");
    } finally {
      if (!success) setLoading(false);
    }
  };

  return (
    <Layout>
      <div className="flex flex-col items-center justify-center min-h-[70vh] w-full px-6 bg-[#0B0B0B]">
        <div className="w-full max-w-[420px]">
          
          {success ? (
             <div className="bg-[#141414] border border-primary/20 rounded-3xl p-12 text-center shadow-2xl">
                <div className="flex justify-center mb-8">
                   <CheckCircle2 className="text-primary" size={64} />
                </div>
                <h2 className="text-3xl font-bold text-white mb-3">Logged in</h2>
                <p className="text-lg text-text-secondary opacity-60 mb-8">Welcome, {userName}</p>
                <div className="py-12 flex flex-col items-center justify-center">
                   <AppLoader label="Fetching your details..." />
                </div>
             </div>
          ) : (
             <div className="bg-[#141414] border border-white/5 rounded-2xl p-10 shadow-lg">
               <div className="text-center mb-8">
                 <h1 className="text-2xl font-bold text-white mb-2">Login</h1>
                 <p className="text-sm text-text-secondary">Log in to your account</p>
               </div>

               <form onSubmit={handleSubmit} className="space-y-6">
                 <div className="space-y-2">
                   <label className="text-xs font-bold text-text-secondary uppercase tracking-widest px-1">Email</label>
                   <input
                     type="email"
                     value={email}
                     required
                     onChange={(e) => setEmail(e.target.value)}
                     className="w-full bg-[#1A1A1A] border border-white/10 rounded-lg h-12 px-4 text-sm text-white outline-none focus:border-primary/50"
                     placeholder="you@example.com"
                   />
                 </div>

                 <div className="space-y-2">
                   <label className="text-xs font-bold text-text-secondary uppercase tracking-widest px-1">Password</label>
                   <div className="relative">
                     <input
                       type={showPassword ? "text" : "password"}
                       value={password}
                       required
                       onChange={(e) => setPassword(e.target.value)}
                       className="w-full bg-[#1A1A1A] border border-white/10 rounded-lg h-12 px-4 text-sm text-white outline-none focus:border-primary/50 pr-12"
                       placeholder="••••••••"
                     />
                     <button
                       type="button"
                       onClick={() => setShowPassword(!showPassword)}
                       className="absolute right-4 top-1/2 -translate-y-1/2 text-text-muted"
                     >
                       {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                     </button>
                   </div>
                 </div>

                 <button 
                   type="submit" 
                   className="tactile-btn tactile-btn-green w-full mt-4" 
                   disabled={loading}
                 >
                    <span className="btn-shadow"></span>
                    <span className="btn-edge"></span>
                    <span className="btn-front py-3.5 flex items-center justify-center gap-3">
                       {loading && <Loader2 className="animate-spin" size={16} />}
                       {loading ? "AUTHENTICATING..." : "LOG IN"}
                    </span>
                 </button>
               </form>

               <div className="text-center mt-6">
                  <p className="text-xs text-text-muted">
                     Don't have an account?{" "}
                     <Link to="/signup" className="text-primary hover:underline font-bold">Sign up</Link>
                  </p>
               </div>
             </div>
          )}
        </div>
      </div>
    </Layout>
  );
};

export default Login;
