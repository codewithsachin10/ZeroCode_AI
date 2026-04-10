import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import Layout from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Eye, EyeOff, Rocket, Zap, Sparkles, CheckCircle2, Loader2 } from "lucide-react";
import { handlePlatformError, validateForm } from "@/lib/error-handler";
import AppLoader from "@/components/ui/AppLoader";
import { auth, db } from "@/lib/firebase";
import { generateSecretCode } from "@/lib/utils";
import { createUserWithEmailAndPassword, updateProfile } from "firebase/auth";
import { doc, setDoc, serverTimestamp } from "firebase/firestore";

const Signup = () => {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const validationError = validateForm({ name, email, password });
    if (validationError) {
      toast.error(validationError);
      return;
    }
    setLoading(true);
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
      
      await updateProfile(user, { displayName: name });
      const secretCode = generateSecretCode(user.uid);

      await setDoc(doc(db, "users", user.uid), {
        uid: user.uid,
        name,
        username: email.split("@")[0].toLowerCase(),
        secretCode,
        bio: "",
        email,
        phone: "",
        profilePhoto: "",
        githubLink: "",
        linkedinLink: "",
        vercelLink: "",
        supabaseLink: "",
        firebaseLink: "",
        isPublic: true,
        role: "user",
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
      
      setSuccess(true);
      
      setTimeout(() => {
        navigate("/account");
      }, 2500);

    } catch (error: any) {
      handlePlatformError(error, "Signup Flow");
      setLoading(false);
    }
  };

  return (
    <Layout>
      <div className="flex flex-col items-center justify-center min-h-[80vh] w-full px-6 bg-[#0B0B0B] py-12">
        <div className="w-full max-w-[420px]">
          
          {success ? (
             <div className="bg-[#141414] border border-primary/20 rounded-3xl p-12 text-center shadow-2xl">
                <div className="flex justify-center mb-8">
                   <Rocket className="text-primary" size={64} />
                </div>
                <h2 className="text-3xl font-bold text-white mb-2 italic">Identity Initialised</h2>
                <p className="text-lg text-text-secondary opacity-60 mb-8 font-medium">Welcome, <span className="text-primary font-bold">{name}</span></p>
                <div className="py-6 flex justify-center">
                   <AppLoader label="Deploying Developer Node..." />
                </div>
             </div>
          ) : (
             <div className="bg-[#141414] border border-white/5 rounded-2xl p-10 shadow-lg">
               <div className="text-center mb-10">
                 <h1 className="text-3xl font-bold text-white mb-2 tracking-tight">Create account</h1>
                 <p className="text-sm text-text-secondary opacity-60 font-medium italic">Join the ZeroCode AI ecosystem</p>
               </div>

               <form onSubmit={handleSubmit} className="space-y-6">
                 <div className="space-y-2">
                   <label className="text-xs font-bold text-text-secondary uppercase tracking-widest px-1">Display Name</label>
                   <input
                     type="text"
                     value={name}
                     required
                     onChange={(e) => setName(e.target.value)}
                     className="w-full bg-[#1A1A1A] border border-white/10 rounded-xl px-4 py-3.5 text-sm text-white outline-none focus:border-primary/50 transition-all placeholder:text-text-muted/30"
                     placeholder="Your Name"
                   />
                 </div>

                 <div className="space-y-2">
                   <label className="text-xs font-bold text-text-secondary uppercase tracking-widest px-1">Email</label>
                   <input
                     type="email"
                     value={email}
                     required
                     onChange={(e) => setEmail(e.target.value)}
                     className="w-full bg-[#1A1A1A] border border-white/10 rounded-xl px-4 py-3.5 text-sm text-white outline-none focus:border-primary/50 transition-all placeholder:text-text-muted/30"
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
                       className="w-full bg-[#1A1A1A] border border-white/10 rounded-xl px-4 py-3.5 text-sm text-white outline-none focus:border-primary/50 transition-all pr-12"
                       placeholder="Min. 6 characters"
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
                    <span className="btn-front py-4 flex items-center justify-center gap-3">
                       {loading ? <Loader2 className="animate-spin" size={18} /> : <Zap size={18} />}
                       {loading ? "INITIALIZING..." : "REGISTER IDENTITY"}
                    </span>
                 </button>
               </form>

               <div className="text-center mt-6 pt-4 border-t border-white/5">
                  <p className="text-sm text-text-muted font-medium">
                     Already have an account?{" "}
                     <Link to="/login" className="text-primary hover:underline font-bold">Log in</Link>
                  </p>
               </div>
             </div>
          )}
        </div>
      </div>
    </Layout>
  );
};

export default Signup;
