import { useState } from "react";
import { Database, RefreshCw, CheckCircle2, AlertTriangle, Loader2, Sparkles, Trash2 } from "lucide-react";
import { 
  collection, 
  writeBatch, 
  doc, 
  serverTimestamp,
  getDocs,
  query,
  limit,
  deleteDoc
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { VIBECODING_CURRICULUM } from "@/lib/curriculum-data";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

export default function AdminDataSync() {
  const [syncing, setSyncing] = useState(false);
  const [seedingProjects, setSeedingProjects] = useState(false);
  const [stats, setStats] = useState<any>(null);

  const performSync = async () => {
    if (!confirm("This will synchronize the Firestore database with the hardcoded curriculum data. Existing records might be duplicated if IDs don't match. Proceed?")) return;
    
    setSyncing(true);
    try {
      const batch = writeBatch(db);
      const courseId = "vibecoding-mastery";
      const courseRef = doc(db, "courses", courseId);
      batch.set(courseRef, {
        title: "VibeCoding Mastery",
        description: "Zero-code to hero-code high-performance technical track.",
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      }, { merge: true });

      let moduleCount = 0;
      let lessonCount = 0;
      let quizCount = 0;
      let projectCount = 0;

      VIBECODING_CURRICULUM.forEach((mod, modIdx) => {
        const modRef = doc(db, "modules", mod.id);
        batch.set(modRef, {
          courseId: courseId,
          title: mod.name,
          order: modIdx + 1,
          description: `Comprehensive track for ${mod.name}`,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp()
        }, { merge: true });
        moduleCount++;

        mod.units.forEach((unit, unitIdx) => {
          const lessonRef = doc(db, "lessons", unit.id);
          batch.set(lessonRef, {
            moduleId: mod.id,
            title: unit.title,
            order: unitIdx + 1,
            videoUrl: unit.videoUrl,
            shortNote: unit.shortNote.join("\n"),
            keyPoints: unit.keyPoints,
            animationData: JSON.stringify(unit.animation),
            miniTask: unit.miniTask.instruction,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp()
          }, { merge: true });
          lessonCount++;

          if (unit.quiz && unit.quiz.length > 0) {
            const quizRef = doc(db, "quizzes", `quiz-${unit.id}`);
            batch.set(quizRef, {
              moduleId: mod.id,
              lessonId: unit.id,
              questions: unit.quiz.map(q => ({
                question: q.question,
                options: q.options,
                correctAnswer: q.correctIndex
              })),
              createdAt: serverTimestamp(),
              updatedAt: serverTimestamp()
            }, { merge: true });
            quizCount++;
          }
        });
      });

      await batch.commit();
      setStats({ modules: moduleCount, lessons: lessonCount, quizzes: quizCount });
      toast.success("Synchronisation complete.");
    } catch (err) {
      console.error(err);
      toast.error("Synchronisation failed.");
    } finally {
      setSyncing(false);
    }
  };

  const seedOfficialProjects = async () => {
    if (!confirm("This will REMOVE ALL current projects and add the 14 official ones. Proceed?")) return;
    
    setSeedingProjects(true);
    try {
      // 1. Clear existing projects
      const projSnap = await getDocs(collection(db, "projects"));
      const deleteBatch = writeBatch(db);
      projSnap.docs.forEach(d => deleteBatch.delete(d.ref));
      await deleteBatch.commit();

      // 2. Add specific 14 projects
      const officialProjects = [
        { 
          title: "Link Shortener SaaS", 
          description: "Make long web links short and easy to share.", 
          difficulty: "Medium", 
          instructions: "1. Create a modern input field for long URLs.\n2. Generate a random 6-character short code.\n3. Save the mapping (Short Code -> Original URL) in Firestore.\n4. Design a 'Copy to Clipboard' component for the short link.\n5. Build a redirect page that fetches the URL by code and navigates.", 
          techStack: "React, Firebase, URL Logic", 
          isPublished: true 
        },
        { 
          title: "Invoice Generator SaaS", 
          description: "Create and download simple bills for customers.", 
          difficulty: "Medium", 
          instructions: "1. Build an interactive form to add items and prices.\n2. Create a live-updating total calculation engine.\n3. Design a professional PDF template layout.\n4. Integrate jsPDF to convert the HTML view to PDF.\n5. Add a 'Download Invoice' button for the user.", 
          techStack: "React, jsPDF, State Management", 
          isPublished: true 
        },
        { 
          title: "Form Builder SaaS", 
          description: "Build your own forms with questions and save answers.", 
          difficulty: "Hard", 
          instructions: "1. Build a sidebar with drag-and-drop form fields.\n2. Create a dynamic canvas that renders fields in real-time.\n3. Implement field editing (Label, Placeholder, Required).\n4. Generate a unique 'Form ID' and submission URL.\n5. Build a 'Form View' page where people can submit answers.", 
          techStack: "React, dnd-kit, Firestore", 
          isPublished: true 
        },
        { 
          title: "QR Code Generator (Basic)", 
          description: "Turn any text or link into a QR code image.", 
          difficulty: "Easy", 
          instructions: "1. Create a central text box for the URL or text.\n2. Install and configure the 'qrcode.react' library.\n3. Generate the QR code instantly as the user types.\n4. Add a button to download the QR code as a PNG.\n5. Simple UI styling for a mobile-first experience.", 
          techStack: "React, qrcode.react, CSS", 
          isPublished: true 
        },
        { 
          title: "Simple Booking SaaS", 
          description: "A tool to book seats for movies or events.", 
          difficulty: "Hard", 
          instructions: "1. Design a grid layout representing movie seats.\n2. Create different states for seats: Available, Selected, Booked.\n3. Implement a multi-select system for user choice.\n4. Link the grid to Firestore for real-time seat tracking.\n5. Build a 'Checkout' summary showing total price and seat IDs.", 
          techStack: "React, Firebase, Grid CSS", 
          isPublished: true 
        },
        { 
          title: "Notes / To-Do SaaS", 
          description: "Keep track of your daily tasks and write simple notes.", 
          difficulty: "Easy", 
          instructions: "1. Create an input with an 'Add' button for tasks.\n2. Render a list of tasks with a 'Done' checkbox.\n3. Add a 'Delete' button to remove specific items.\n4. Persist data using LocalStorage so notes stay after refresh.\n5. Add a 'Search' filter to find tasks by keyword.", 
          techStack: "React, Storage, State Hooks", 
          isPublished: true 
        },
        { 
          title: "Password Generator SaaS", 
          description: "Create strong and random passwords to stay safe.", 
          difficulty: "Easy", 
          instructions: "1. Create range sliders for length and complexity options.\n2. Build a character pool based on user checkboxes.\n3. Implement the random generation logic in JavaScript.\n4. Display the result in a clean, masked input field.\n5. Add a 'Copy' button with a success notification.", 
          techStack: "React, JavaScript, Logic", 
          isPublished: true 
        },
        { 
          title: "Simple Poll / Voting SaaS", 
          description: "Ask questions and let people vote for answers.", 
          difficulty: "Medium", 
          instructions: "1. Create a form to post a question and options.\n2. Set up a real-time listener for vote counts in Firestore.\n3. Build animated progress bars for live result tracking.\n4. Implement a 'Single Vote' restriction based on user ID.\n5. Create a 'Share' link for each individual poll.", 
          techStack: "React, Firebase, Framer Motion", 
          isPublished: true 
        },
        { 
          title: "Mini URL Preview SaaS", 
          description: "Put a link and see a small preview of the website.", 
          difficulty: "Medium", 
          instructions: "1. Create a link input field with an 'Analyze' button.\n2. Integrate a free OpenGraph API or link preview service.\n3. Extract Title, Description, and Image from the response.\n4. Render the data in a beautiful 'Link Card' component.\n5. Add loading states to show the analysis progress.", 
          techStack: "React, External APIs, CSS", 
          isPublished: true 
        },
        { 
          title: "OTP Generator + Validator", 
          description: "Send a code to a user and check if it is correct.", 
          difficulty: "Medium", 
          instructions: "1. Build a 4-digit or 6-digit input group UI.\n2. Implement 'Auto-Focus' logic for consecutive inputs.\n3. Add a 'Generate Code' button to create a random string.\n4. Create a logic check that compares user input vs the code.\n5. Success/Error state visuals with a 'Resend' timer.", 
          techStack: "React, Logic, User Flow", 
          isPublished: true 
        },
        { 
          title: "Expense Splitter", 
          description: "Divide bills and costs with your friends easily.", 
          difficulty: "Easy", 
          instructions: "1. Input for total amount and number of participants.\n2. Add a 'Custom Share' option for unequal splitting.\n3. Real-time math calculation for the 'Per Person' cost.\n4. List of expenses with timestamps and descriptions.\n5. Simple 'Clear All' button to reset the calculation.", 
          techStack: "React, Math, State Management", 
          isPublished: true 
        },
        { 
          title: "Digital Visiting Card", 
          description: "Create a simple page with your photo and contact info.", 
          difficulty: "Easy", 
          instructions: "1. Design a vertical mobile-first card layout.\n2. Add fields for Name, Professional Title, and Bio.\n3. Integrate clickable social icons (LinkedIn, GitHub).\n4. Add a 'Download V-Card' or 'Contact Me' button.\n5. Premium styling with smooth gradients and glassmorphism.", 
          techStack: "React, UI Design, CSS", 
          isPublished: true 
        },
        { 
          title: "Ticket Generator", 
          description: "Make a ticket with a QR code and save it as a PDF.", 
          difficulty: "Medium", 
          instructions: "1. Create a form for 'Event Name' and 'Attendee Name'.\n2. Integrate the QR Code generator for ticket verification.\n3. Combine user data and QR code into a visual ticket.\n4. Implement jsPDF for high-quality ticket downloads.\n5. Auto-generate a unique ticket serial number.", 
          techStack: "React, jsPDF, QR Library", 
          isPublished: true 
        },
        { 
          title: "Appointment Booking Page", 
          description: "Let people pick a time to meet you.", 
          difficulty: "Medium", 
          instructions: "1. Design a calendar grid or a time-slot list.\n2. Implement availability logic (Mark slots as taken).\n3. Set up a Firestore collection for 'Bookings'.\n4. Add a confirmation modal with booking details.\n5. Email notification simulation (Console log or toast).", 
          techStack: "React, Firebase, Date-fns", 
          isPublished: true 
        }
      ];

      const seedBatch = writeBatch(db);
      officialProjects.forEach(proj => {
        const ref = doc(collection(db, "projects"));
        seedBatch.set(ref, {
          ...proj,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp()
        });
      });

      await seedBatch.commit();
      toast.success("All official projects seeded successfully.");
    } catch (err) {
      console.error(err);
      toast.error("Seeding failed.");
    } finally {
      setSeedingProjects(false);
    }
  };

  return (
    <div className="max-w-4xl space-y-8 pb-20">
      <div className="border-b border-white/5 pb-4">
        <h2 className="text-sm font-black uppercase text-white tracking-widest leading-none mb-1">Nexus Data Factory</h2>
        <p className="text-[10px] text-text-muted font-bold uppercase tracking-widest">Master synchronisation and project seeding control</p>
      </div>

      <div className="grid md:grid-cols-2 gap-8">
        {/* Project Seeder */}
        <div className="p-8 bg-[#0B0B0B] border border-primary/20 rounded-[2px] space-y-6 relative overflow-hidden group">
           <div className="absolute inset-0 bg-primary/5 opacity-0 group-hover:opacity-100 transition-opacity blur-3xl pointer-events-none" />
           <div className="relative z-10 space-y-6">
              <div className="flex items-center gap-3">
                 <Sparkles size={16} className="text-primary" />
                 <h3 className="text-[10px] font-black uppercase tracking-widest text-white">Official Project Seeder</h3>
              </div>
              <p className="text-[11px] text-text-muted leading-relaxed font-bold uppercase tracking-tight opacity-60">
                 Factory reset the project library with the 14 official curriculum builds. This action will clear all existing custom projects.
              </p>
              <Button 
                onClick={seedOfficialProjects}
                disabled={seedingProjects}
                className="w-full h-12 bg-primary text-black font-black uppercase text-[10px] tracking-widest rounded-[2px] gap-2 shadow-[0_0_20px_rgba(34,211,238,0.15)]"
              >
                {seedingProjects ? <Loader2 className="animate-spin" size={14} /> : <Trash2 size={14} />}
                Reset & Seed Official Projects
              </Button>
           </div>
        </div>

        {/* Sync Curriculum */}
        <div className="p-8 bg-[#0B0B0B] border border-white/5 rounded-[2px] space-y-6">
           <div className="flex items-center gap-3">
              <Database size={16} className="text-white opacity-40" />
              <h3 className="text-[10px] font-black uppercase tracking-widest text-white/40">Academy Sync</h3>
           </div>
           <p className="text-[11px] text-text-muted leading-relaxed font-bold uppercase tracking-tight opacity-60">
              Sync the hardcoded 'VibeCoding' curriculum data to the High-Performance Firestore Cloud nodes.
           </p>
           <Button 
             onClick={performSync}
             disabled={syncing}
             variant="outline"
             className="w-full h-12 border-white/5 bg-transparent text-text-muted font-black uppercase text-[10px] tracking-widest rounded-[2px] gap-2 hover:text-white"
           >
             {syncing ? <Loader2 className="animate-spin" size={14} /> : <RefreshCw size={14} />}
             Execute System Sync
           </Button>
        </div>
      </div>

      {stats && (
        <div className="p-6 bg-green-500/5 border border-green-500/10 rounded-[2px] animate-in fade-in slide-in-from-bottom-2">
           <div className="flex items-center gap-3 text-green-500 mb-4">
              <CheckCircle2 size={16} />
              <h3 className="text-[10px] font-black uppercase tracking-widest">Network Update Success</h3>
           </div>
           <p className="text-[10px] font-bold uppercase text-green-500/60 tracking-widest">
              Synchronized {stats.modules} Modules and {stats.lessons} Lesson Nodes across the mesh.
           </p>
        </div>
      )}

      <div className="p-6 bg-orange-500/5 border border-orange-500/10 rounded-[2px] flex items-start gap-4">
         <AlertTriangle size={18} className="text-orange-500 shrink-0" />
         <p className="text-[9px] font-black uppercase tracking-widest text-orange-500/80 leading-relaxed">
            SYSTEM ADVISORY: Reset and Seed operations are destructive and cannot be rollbacked via UI. Identity and build mesh will be permanently overwritten.
         </p>
      </div>
    </div>
  );
}
