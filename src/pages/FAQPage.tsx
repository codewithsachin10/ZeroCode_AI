import Layout from "@/components/Layout";
import FAQSection from "@/components/sections/FAQSection";
import { Sparkles } from "lucide-react";

const FAQPage = () => {
  return (
    <Layout>
      <section className="pt-12 pb-20 relative overflow-hidden">
        {/* Hero Area */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-[600px] bg-primary/5 blur-[150px] -z-10 animate-pulse"></div>
        
        <div className="w-full px-4 md:px-10">
          <div className="max-w-5xl mx-auto text-center mb-12">
             <div className="inline-flex items-center gap-3 px-4 py-2 rounded-full glass text-[10px] font-black uppercase tracking-widest text-primary mb-10 border border-primary/20 shadow-lg shadow-primary/5">
                <Sparkles size={14} className="animate-pulse" />
                <span>The Global Brain Node</span>
             </div>
             <h1 className="text-5xl md:text-8xl font-black mb-8 tracking-tighter leading-[0.9] text-foreground lowercase">
                The <span className="text-gradient">Vibecoding</span>
                <br />
                Answer Engine
             </h1>
             <p className="text-xl text-text-secondary max-w-2xl mx-auto leading-relaxed italic">
                Everything you ever wanted to know about building with intelligence, intuition, and high-frequency intent.
             </p>
          </div>
          
          <div className="bg-surface/30 rounded-[48px] border border-border/40 backdrop-blur-3xl overflow-hidden shadow-2xl w-full">
              <FAQSection />
          </div>
          
          <div className="mt-20 grid grid-cols-1 md:grid-cols-3 gap-8">
             {[
               { title: "Realtime Sync", desc: "Our knowledge base updates in real-time with the AI ecosystem." },
               { title: "Community Verified", desc: "All answers are vetted by our top vibecoding engineering core." },
               { title: "Elastic Architecture", desc: "Adaptive UI controls for every device on the intelligence network." }
             ].map((item, i) => (
                <div key={i} className="glass p-10 rounded-[32px] border-border/40 group hover:border-primary/20 transition-all">
                   <h4 className="text-xl font-bold mb-4 tracking-tight group-hover:text-primary transition-colors">{item.title}</h4>
                   <p className="text-sm text-text-muted leading-relaxed italic">{item.desc}</p>
                </div>
             ))}
          </div>
        </div>
      </section>
    </Layout>
  );
};

export default FAQPage;
