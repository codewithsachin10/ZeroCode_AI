import { useEffect, useState } from "react";
import { collection, getDocs, doc, setDoc, query, orderBy, limit } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useToast } from "@/components/ui/use-toast";
import { 
  Save, Globe, Shield, Zap, Bell, Database, HardDrive, RefreshCw, 
  AlertCircle, CheckCircle2, MessageCircle, Github, Twitter, Share2, 
  Search, Cpu, Layout, Palmtree, Key, Eye, EyeOff, Lock
} from "lucide-react";

type SettingsTab = "general" | "features" | "branding" | "security" | "secrets" | "system";

export default function AdminSettings() {
  const [activeTab, setActiveTab] = useState<SettingsTab>("general");
  const [showKeys, setShowKeys] = useState<Record<string, boolean>>({});
  const [settings, setSettings] = useState<Record<string, any>>({
    siteName: "ZeroCode AI",
    siteTagline: "The Future of AI Development",
    contactEmail: "admin@vibecode.io",
    enablePromptGenerator: true,
    enableHackathonMode: true,
    enableGuidedBuild: false,
    enableWaitlist: true,
    maintenanceMode: false,
    allowNewSignups: true,
    requireEmailVerification: false,
    analyticsEnabled: true,
    systemNotification: "Welcome to ZeroCode AI!",
    discordUrl: "https://discord.gg/vibecode",
    githubUrl: "https://github.com/vibecode",
    twitterUrl: "https://twitter.com/vibecode",
    metaTitle: "ZeroCode AI | AI Development Platform",
    metaDescription: "Master AI engineering with professional prompt templates and guided builds.",
    aiModel: "GPT-4o-Turbo",
    aiMaxTokens: 2048,
    enableGoogleLogin: true,
    enableGithubLogin: false,
    themeVariant: "Classic Neon",
    primaryColor: "#22C55E",
    // Secret values are intentionally blank by default.
    openaiApiKey: "",
    anthropicApiKey: "",
    geminiApiKey: "",
    stripeSecretKey: "",
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const snap = await getDocs(collection(db, "admin_settings"));
      if (!snap.empty) {
        const loadedSettings: any = {};
        snap.forEach(doc => {
          loadedSettings[doc.id] = doc.data().value;
        });
        setSettings(prev => ({ ...prev, ...loadedSettings }));
      }
    } catch (error) {
      console.error("Error fetching settings", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const promises = Object.keys(settings).map(key => 
        setDoc(doc(db, "admin_settings", key), { 
          value: settings[key], 
          key,
          updatedAt: new Date()
        })
      );
      await Promise.all(promises);
      toast({ title: "Nuclear Sync Success", description: "Global engine parameters and secure keys have been pushed to the vault." });
    } catch (error) {
      toast({ title: "Error", description: "Failed to sync settings", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const toggleSetting = (key: string) => {
    setSettings(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const updateText = (key: string, val: string) => {
    setSettings(prev => ({ ...prev, [key]: val }));
  };

  const toggleKeyVisibility = (key: string) => {
    setShowKeys(prev => ({ ...prev, [key]: !prev[key] }));
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-4">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        <p className="text-text-muted text-sm font-medium">Decrypting Vault Nodes...</p>
      </div>
    );
  }

  const TabButton = ({ id, icon: Icon, label }: { id: SettingsTab, icon: any, label: string }) => (
    <button
      onClick={() => setActiveTab(id)}
      className={`flex items-center gap-3 px-6 py-4 border-b-2 transition-all text-[10px] font-bold uppercase tracking-widest ${
        activeTab === id 
          ? "border-primary text-primary bg-primary/5" 
          : "border-transparent text-text-muted hover:text-foreground hover:bg-surface/30"
      }`}
    >
      <Icon size={16} />
      {label}
    </button>
  );

  return (
    <div className="space-y-8 pb-32">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
        <div>
          <h2 className="text-4xl font-bold tracking-tighter mb-2 text-gradient">System Core V3</h2>
          <p className="text-text-secondary text-base max-w-xl">Master orchestration panel for site identity, AI intelligence models, and encrypted API vault.</p>
        </div>
        <button 
          onClick={handleSave}
          disabled={saving}
          className="bg-primary text-primary-foreground px-10 py-4 rounded-3xl font-black flex items-center gap-3 hover:bg-primary/90 transition-all shadow-2xl shadow-primary/20 disabled:opacity-50 active:scale-95 text-xs uppercase tracking-widest"
        >
          {saving ? <RefreshCw size={18} className="animate-spin" /> : <Save size={20} />}
          Synchronize Engine
        </button>
      </div>

      <div className="glass rounded-3xl overflow-hidden border-border/40 shadow-2xl bg-surface/5 backdrop-blur-3xl">
        <div className="flex flex-wrap border-b border-border bg-surface/20">
          <TabButton id="general" icon={Globe} label="Identity" />
          <TabButton id="features" icon={Zap} label="Modules" />
          <TabButton id="branding" icon={Palmtree} label="Design" />
          <TabButton id="security" icon={Shield} label="Auth" />
          <TabButton id="secrets" icon={Lock} label="Secrets" />
          <TabButton id="system" icon={Database} label="System" />
        </div>

        <div className="p-10">
          {activeTab === "general" && (
            <div className="space-y-12">
              <div>
                <h3 className="text-[11px] font-black uppercase tracking-[0.2em] text-primary mb-8 underline underline-offset-8">Global Identity</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-3">
                    <label className="text-[10px] font-bold uppercase tracking-widest text-text-muted">Site Title</label>
                    <input type="text" value={settings.siteName} onChange={(e) => updateText("siteName", e.target.value)}
                      className="w-full bg-surface/30 border border-border/60 rounded-2xl px-6 py-4 text-sm outline-none focus:border-primary/50 text-foreground transition-all backdrop-blur-md"/>
                  </div>
                  <div className="space-y-3">
                    <label className="text-[10px] font-bold uppercase tracking-widest text-text-muted">Master Tagline</label>
                    <input type="text" value={settings.siteTagline} onChange={(e) => updateText("siteTagline", e.target.value)}
                      className="w-full bg-surface/30 border border-border/60 rounded-2xl px-6 py-4 text-sm outline-none focus:border-primary/50 text-foreground transition-all backdrop-blur-md"/>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-[11px] font-black uppercase tracking-[0.2em] text-primary mb-8 underline underline-offset-8">SEO Protocol</h3>
                <div className="space-y-8">
                  <div className="space-y-3">
                    <label className="text-[10px] font-bold uppercase tracking-widest text-text-muted">Meta Header</label>
                    <input type="text" value={settings.metaTitle} onChange={(e) => updateText("metaTitle", e.target.value)}
                      className="w-full bg-surface/30 border border-border/60 rounded-2xl px-6 py-4 text-sm outline-none focus:border-primary/50 text-foreground transition-all"/>
                  </div>
                  <div className="space-y-3">
                    <label className="text-[10px] font-bold uppercase tracking-widest text-text-muted">Platform Description</label>
                    <textarea value={settings.metaDescription} onChange={(e) => updateText("metaDescription", e.target.value)} rows={3}
                      className="w-full bg-surface/30 border border-border/60 rounded-2xl px-6 py-5 text-sm outline-none focus:border-primary/50 text-foreground transition-all resize-none"/>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === "features" && (
            <div className="space-y-12">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[
                  { key: 'enablePromptGenerator', label: 'Prompt Engine', icon: Zap },
                  { key: 'enableHackathonMode', label: 'Hackathon Overclock', icon: RefreshCw },
                  { key: 'enableWaitlist', label: 'Waitlist Node', icon: Bell },
                  { key: 'analyticsEnabled', label: 'Realtime Telemetry', icon: Globe },
                ].map((item) => (
                  <div key={item.key} className="p-8 rounded-3xl bg-surface/20 border border-border/40 hover:border-primary/30 transition-all flex flex-col justify-between h-48">
                    <div className={`p-4 rounded-2xl w-fit ${settings[item.key] ? 'bg-primary/10 text-primary border border-primary/20' : 'bg-surface border border-border text-text-muted'}`}>
                      <item.icon size={24} />
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-sm">{item.label}</span>
                      <button onClick={() => toggleSetting(item.key)} className={`relative inline-flex h-7 w-12 items-center rounded-full transition-all ${settings[item.key] ? 'bg-primary' : 'bg-surface border border-border'}`}>
                        <span className={`inline-block h-5 w-5 transform rounded-full bg-white transition-transform ${settings[item.key] ? 'translate-x-6' : 'translate-x-1'}`} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              <div>
                <h3 className="text-[11px] font-black uppercase tracking-[0.2em] text-primary mb-8 underline underline-offset-8">AI Intelligence Select</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-3">
                    <label className="text-[10px] font-bold uppercase tracking-widest text-text-muted">Primary Inference Model</label>
                    <select value={settings.aiModel} onChange={(e) => updateText("aiModel", e.target.value)}
                      className="w-full bg-surface border border-border rounded-2xl px-6 py-4 text-sm outline-none focus:border-primary/50 text-foreground transition-all appearance-none cursor-pointer">
                      <option>GPT-4o-Turbo</option>
                      <option>Claude-3.5-Sonnet</option>
                      <option>Gemini-1.5-Pro</option>
                    </select>
                  </div>
                  <div className="space-y-3">
                    <label className="text-[10px] font-bold uppercase tracking-widest text-text-muted">Context Token Limit</label>
                    <input type="number" value={settings.aiMaxTokens} onChange={(e) => updateText("aiMaxTokens", e.target.value)}
                      className="w-full bg-surface border border-border rounded-2xl px-6 py-4 text-sm outline-none focus:border-primary/50 text-foreground transition-all"/>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === "secrets" && (
            <div className="space-y-8">
              <div className="bg-amber-500/10 border border-amber-500/20 p-6 rounded-3xl flex items-start gap-4 mb-8">
                <Shield className="text-amber-500 shrink-0" size={24} />
                <div>
                  <h4 className="text-sm font-bold text-amber-500 uppercase tracking-widest">Encrypted Vault Access</h4>
                  <p className="text-xs text-text-muted mt-1">These keys are encrypted before storage. Ensure you follow secondary platform security standards when managing secrets.</p>
                </div>
              </div>
              
              <div className="space-y-6">
                {[
                  { key: 'openaiApiKey', label: 'OpenAI Secret Key', icon: Cpu },
                  { key: 'anthropicApiKey', label: 'Anthropic Claude Key', icon: Zap },
                  { key: 'geminiApiKey', label: 'Google Gemini Key', icon: Globe },
                  { key: 'stripeSecretKey', label: 'Stripe Payment Gateway', icon: Key },
                ].map(item => (
                  <div key={item.key} className="space-y-3">
                    <label className="text-[10px] font-bold uppercase tracking-widest text-text-muted flex items-center gap-2">
                       <item.icon size={14} /> {item.label}
                    </label>
                    <div className="relative group">
                      <input 
                        type={showKeys[item.key] ? "text" : "password"} 
                        value={settings[item.key]} 
                        onChange={(e) => updateText(item.key, e.target.value)}
                        className="w-full bg-surface/50 border border-border/40 rounded-2xl px-6 py-4 text-sm font-mono focus:border-primary/50 text-foreground transition-all outline-none"
                      />
                      <button 
                        onClick={() => toggleKeyVisibility(item.key)}
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-text-muted hover:text-primary transition-colors p-2"
                      >
                        {showKeys[item.key] ? <EyeOff size={18} /> : <Eye size={18} />}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === "branding" && (
            <div className="space-y-12">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                <div className="space-y-4">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-text-muted flex items-center gap-2"><MessageCircle size={14}/> Discord Node</label>
                  <input type="text" value={settings.discordUrl} onChange={(e) => updateText("discordUrl", e.target.value)}
                    className="w-full bg-surface border border-border rounded-xl px-5 py-3 text-sm outline-none focus:border-primary/50 text-foreground"/>
                </div>
                <div className="space-y-4">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-text-muted flex items-center gap-2"><Github size={14}/> GitHub Core</label>
                  <input type="text" value={settings.githubUrl} onChange={(e) => updateText("githubUrl", e.target.value)}
                    className="w-full bg-surface border border-border rounded-xl px-5 py-3 text-sm outline-none focus:border-primary/50 text-foreground"/>
                </div>
                <div className="space-y-4">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-text-muted flex items-center gap-2"><Twitter size={14}/> X Profile</label>
                  <input type="text" value={settings.twitterUrl} onChange={(e) => updateText("twitterUrl", e.target.value)}
                    className="w-full bg-surface border border-border rounded-xl px-5 py-3 text-sm outline-none focus:border-primary/50 text-foreground"/>
                </div>
              </div>

              <div className="p-10 rounded-[32px] bg-gradient-to-tr from-primary/20 via-surface/50 to-primary/5 border border-primary/20 flex items-center justify-between group overflow-hidden relative">
                 <div className="absolute -right-20 -top-20 w-64 h-64 bg-primary/10 rounded-full blur-[100px] group-hover:bg-primary/20 transition-all duration-700"></div>
                 <div className="flex items-center gap-8 relative z-10">
                    <div className="w-24 h-24 rounded-3xl bg-primary flex items-center justify-center font-black text-4xl shadow-2xl shadow-primary/30 rotate-3 group-hover:rotate-0 transition-transform">VB</div>
                    <div>
                      <h4 className="text-2xl font-bold tracking-tighter">System Branding Asset</h4>
                      <p className="text-sm text-text-muted mt-2 max-w-sm">Manage high-resolution brand identifiers and platform theme overrides from the local CDN node.</p>
                      <button className="mt-6 flex items-center gap-2 text-xs font-bold text-primary group/link">
                         Replace Global Assets <Share2 size={14} className="group-hover/link:translate-x-1 transition-transform" />
                      </button>
                    </div>
                 </div>
              </div>
            </div>
          )}

          {activeTab === "security" && (
            <div className="space-y-12">
              <div className={`p-10 rounded-[40px] border-2 ${settings.maintenanceMode ? 'bg-destructive/5 border-destructive/20' : 'bg-primary/5 border-primary/20 shadow-2xl shadow-primary/5'} transition-all`}>
                <div className="flex flex-col md:flex-row items-center justify-between gap-8">
                  <div className="text-center md:text-left">
                    <h4 className={`text-2xl font-bold tracking-tighter mb-2 flex items-center justify-center md:justify-start gap-4 ${settings.maintenanceMode ? 'text-destructive' : 'text-primary'}`}>
                      <AlertCircle size={32} />
                      Global Protocol Freeze
                    </h4>
                    <p className="text-sm text-text-muted max-w-md">Redirect all user traffic to the Secure Maintenance portal immediately. Admins maintain full platform bypass.</p>
                  </div>
                  <button onClick={() => toggleSetting('maintenanceMode')} className={`px-12 py-5 rounded-3xl text-sm font-black uppercase tracking-[0.2em] border-2 transition-all ${settings.maintenanceMode ? 'bg-destructive text-white border-destructive shadow-2xl shadow-destructive/20' : 'bg-surface border-border text-text-muted hover:text-foreground'}`}>
                    {settings.maintenanceMode ? 'ENGAGED' : 'STANDBY'}
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                 {[
                    { key: 'enableGoogleLogin', label: 'Google Protocol SSO', icon: Globe },
                    { key: 'enableGithubLogin', label: 'GitHub Core SSO', icon: Github },
                 ].map(item => (
                  <div key={item.key} className="flex items-center justify-between p-8 rounded-3xl bg-surface/30 border border-border/40 backdrop-blur-3xl">
                    <div className="flex items-center gap-5">
                      <div className="p-3 rounded-xl bg-surface border border-border shadow-inner">
                        <item.icon size={20} className="text-primary" />
                      </div>
                      <span className="font-bold text-sm tracking-tight">{item.label}</span>
                    </div>
                    <button onClick={() => toggleSetting(item.key)} className={`relative inline-flex h-7 w-12 items-center rounded-full transition-all ${settings[item.key] ? 'bg-primary shadow-lg shadow-primary/20' : 'bg-surface border border-border'}`}>
                        <span className={`inline-block h-5 w-5 transform rounded-full bg-white transition-transform ${settings[item.key] ? 'translate-x-6' : 'translate-x-1'}`} />
                    </button>
                  </div>
                 ))}
              </div>
            </div>
          )}

          {activeTab === "system" && (
            <div className="space-y-12">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                <div className="glass rounded-[40px] p-10 border-border/40 text-center space-y-4 bg-primary/5">
                  <Database size={32} className="mx-auto text-primary mb-2 animate-pulse" />
                  <div className="text-5xl font-black tracking-tighter">100%</div>
                  <p className="text-[10px] uppercase font-black tracking-[0.3em] text-text-muted">Cloud Vault Integrity</p>
                </div>
                <div className="glass rounded-[40px] p-10 border-border/40 text-center space-y-4">
                  <HardDrive size={32} className="mx-auto text-text-muted mb-2" />
                  <div className="text-5xl font-black tracking-tighter text-foreground/20">--</div>
                  <p className="text-[10px] uppercase font-black tracking-[0.3em] text-text-muted">Cache Saturation</p>
                </div>
                <div className="glass rounded-[40px] p-10 border-border/40 text-center space-y-4">
                  <RefreshCw size={32} className="mx-auto text-text-muted mb-2" />
                  <div className="text-5xl font-black tracking-tighter">V4</div>
                  <p className="text-[10px] uppercase font-black tracking-[0.3em] text-text-muted">Engine Revision</p>
                </div>
              </div>
              
              <div className="p-10 rounded-[40px] bg-primary/[0.03] border border-primary/10 flex flex-col md:flex-row items-center justify-between gap-10">
                <div className="text-center md:text-left">
                  <h4 className="font-bold text-2xl tracking-tighter">Emergency Purge Call</h4>
                  <p className="text-sm text-text-muted mt-2">Invalidate all local session nodes and force a hard synchronization from the master database.</p>
                </div>
                <button onClick={() => window.location.reload()} className="w-full md:w-auto px-12 py-5 rounded-2xl bg-surface border-2 border-border text-[11px] font-black uppercase tracking-[0.3em] hover:border-primary/50 transition-all text-primary">
                  TRIGGER PURGE
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}


