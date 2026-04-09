import { useEffect, useState } from "react";
import { collection, deleteDoc, doc, onSnapshot, query, serverTimestamp, setDoc } from "firebase/firestore";
import { getDownloadURL, ref, uploadBytesResumable } from "firebase/storage";
import { db, storage } from "@/lib/firebase";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

export default function AdminHackathons() {
  const [hackathons, setHackathons] = useState<any[]>([]);
  const [hackTitle, setHackTitle] = useState("");
  const [hackDescription, setHackDescription] = useState("");
  const [hackMode, setHackMode] = useState("Online");
  const [hackPrize, setHackPrize] = useState("");
  const [hackStatus, setHackStatus] = useState("upcoming");
  const [hackTags, setHackTags] = useState("");
  const [hackPreviewImage, setHackPreviewImage] = useState("");
  const [hackathonLink, setHackathonLink] = useState("");
  const [hackOrganizer, setHackOrganizer] = useState("");
  const [hackVenue, setHackVenue] = useState("");
  const [hackTeamSize, setHackTeamSize] = useState("");
  const [hackEligibility, setHackEligibility] = useState("");
  const [hackContactEmail, setHackContactEmail] = useState("");
  const [hackRules, setHackRules] = useState("");
  const [hackStartAt, setHackStartAt] = useState("");
  const [hackDeadlineAt, setHackDeadlineAt] = useState("");
  const [uploadingImage, setUploadingImage] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [editingHackathonId, setEditingHackathonId] = useState<string | null>(null);

  useEffect(() => {
    const unsubHackathons = onSnapshot(query(collection(db, "hackathons")), (snap) => {
      const rows = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      rows.sort((a: any, b: any) => {
        const aMs = a.startDate?.toDate ? a.startDate.toDate().getTime() : Number.MAX_SAFE_INTEGER;
        const bMs = b.startDate?.toDate ? b.startDate.toDate().getTime() : Number.MAX_SAFE_INTEGER;
        return aMs - bMs;
      });
      setHackathons(rows);
    });
    return () => unsubHackathons();
  }, []);

  const resetHackathonForm = () => {
    setHackTitle("");
    setHackDescription("");
    setHackMode("Online");
    setHackPrize("");
    setHackStatus("upcoming");
    setHackTags("");
    setHackPreviewImage("");
    setHackathonLink("");
    setHackOrganizer("");
    setHackVenue("");
    setHackTeamSize("");
    setHackEligibility("");
    setHackContactEmail("");
    setHackRules("");
    setHackStartAt("");
    setHackDeadlineAt("");
    setUploadProgress(0);
    setEditingHackathonId(null);
  };

  const uploadPreviewImage = async (file?: File | null) => {
    if (!file) return;
    const allowed = ["image/jpeg", "image/png", "image/webp", "image/gif"];
    if (!allowed.includes(file.type)) {
      toast.error("Use JPG, PNG, WEBP, or GIF image.");
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      toast.error("Image must be under 2MB.");
      return;
    }
    const toDataUrl = (target: File) =>
      new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(String(reader.result || ""));
        reader.onerror = () => reject(new Error("reader_failed"));
        reader.readAsDataURL(target);
      });

    // In local dev, Firebase Storage preflight is often blocked by CORS.
    // Use inline mode directly so posting never gets stuck.
    const isLocalhost = typeof window !== "undefined" && /^(localhost|127\.0\.0\.1)$/.test(window.location.hostname);
    if (isLocalhost) {
      if (file.size > 350 * 1024) {
        toast.error("For local mode, use image below 350KB.");
        return;
      }
      try {
        const dataUrl = await toDataUrl(file);
        setHackPreviewImage(dataUrl);
        toast.success("Image attached (local mode).");
      } catch (error) {
        console.error(error);
        toast.error("Could not read image file.");
      }
      return;
    }

    setUploadingImage(true);
    setUploadProgress(0);
    try {
      const fileName = `${Date.now()}_${file.name.replace(/[^a-zA-Z0-9._-]/g, "_")}`;
      const imageRef = ref(storage, `hackathons/previews/${fileName}`);
      const uploadTask = uploadBytesResumable(imageRef, file);
      await new Promise<void>((resolve, reject) => {
        uploadTask.on(
          "state_changed",
          (snapshot) => {
            const progress = Math.round((snapshot.bytesTransferred / snapshot.totalBytes) * 100);
            setUploadProgress(progress);
          },
          (error) => {
            reject(error);
          },
          () => {
            resolve();
          }
        );
      });
      const url = await getDownloadURL(imageRef);
      setHackPreviewImage(url);
      toast.success("Preview image uploaded.");
    } catch (error: any) {
      console.error(error);
      // Fallback: keep feature working even when Firebase Storage CORS blocks upload.
      // Firestore document size is limited, so only allow small files for inline data URLs.
      if (file.size <= 350 * 1024) {
        const dataUrl = await toDataUrl(file);
        setHackPreviewImage(dataUrl);
        toast.success("Image attached (inline mode). You can post now.");
      } else if (error?.code === "storage/unauthorized") {
        toast.error("Storage blocked. Use a smaller image (<350KB) or image URL.");
      } else if (error?.code === "storage/canceled") {
        toast.error("Upload canceled.");
      } else if (error?.code === "storage/retry-limit-exceeded") {
        toast.error("Network issue. Try again or use smaller image (<350KB).");
      } else {
        toast.error("Upload failed. Use a smaller image (<350KB) or paste image URL.");
      }
    } finally {
      setUploadingImage(false);
      setUploadProgress(0);
    }
  };

  return (
    <div className="grid lg:grid-cols-2 gap-6">
      <div className="p-6 bg-[#111] border border-white/10 rounded-xl space-y-4">
        <h3 className="text-sm font-bold uppercase text-white">Post Upcoming Hackathon</h3>
        <input value={hackTitle} onChange={(e) => setHackTitle(e.target.value)} placeholder="Hackathon title" className="w-full h-10 bg-black/40 border border-white/10 rounded-lg px-3 text-xs text-white" />
        <textarea value={hackDescription} onChange={(e) => setHackDescription(e.target.value)} placeholder="Description" className="w-full h-20 bg-black/40 border border-white/10 rounded-lg p-3 text-xs text-white resize-none" />
        <div className="grid grid-cols-2 gap-3">
          <select value={hackMode} onChange={(e) => setHackMode(e.target.value)} className="w-full h-10 bg-black/40 border border-white/10 rounded-lg px-3 text-xs text-white">
            <option value="Online">Online</option>
            <option value="Offline">Offline</option>
            <option value="Hybrid">Hybrid</option>
          </select>
          <select value={hackStatus} onChange={(e) => setHackStatus(e.target.value)} className="w-full h-10 bg-black/40 border border-white/10 rounded-lg px-3 text-xs text-white">
            <option value="upcoming">Upcoming</option>
            <option value="live">Live</option>
            <option value="ended">Ended</option>
          </select>
        </div>
        <input value={hackPrize} onChange={(e) => setHackPrize(e.target.value)} placeholder="Prize (e.g. $1000)" className="w-full h-10 bg-black/40 border border-white/10 rounded-lg px-3 text-xs text-white" />
        <input value={hackTags} onChange={(e) => setHackTags(e.target.value)} placeholder="Tags (comma separated)" className="w-full h-10 bg-black/40 border border-white/10 rounded-lg px-3 text-xs text-white" />
        <div className="space-y-2">
          <input value={hackPreviewImage} onChange={(e) => setHackPreviewImage(e.target.value)} placeholder="Preview image URL" className="w-full h-10 bg-black/40 border border-white/10 rounded-lg px-3 text-xs text-white" />
          <div className="flex items-center gap-2">
            <label className="h-9 px-4 rounded-lg bg-white/5 border border-white/10 text-[10px] uppercase font-bold text-white inline-flex items-center justify-center cursor-pointer hover:bg-white/10 transition-all">
              {uploadingImage ? "Uploading..." : "Upload Image"}
              <input
                type="file"
                accept="image/png,image/jpeg,image/webp,image/gif"
                className="hidden"
                onChange={(e) => {
                  uploadPreviewImage(e.target.files?.[0]);
                  e.currentTarget.value = "";
                }}
                disabled={uploadingImage}
              />
            </label>
            <span className="text-[10px] text-text-muted">
              {uploadingImage ? `${uploadProgress}%` : "Max 2MB • JPG/PNG/WEBP/GIF"}
            </span>
          </div>
        </div>
        <input value={hackathonLink} onChange={(e) => setHackathonLink(e.target.value)} placeholder="Hackathon link (registration/details)" className="w-full h-10 bg-black/40 border border-white/10 rounded-lg px-3 text-xs text-white" />
        <div className="grid grid-cols-2 gap-3">
          <input value={hackOrganizer} onChange={(e) => setHackOrganizer(e.target.value)} placeholder="Organizer" className="w-full h-10 bg-black/40 border border-white/10 rounded-lg px-3 text-xs text-white" />
          <input value={hackVenue} onChange={(e) => setHackVenue(e.target.value)} placeholder="Venue / Location" className="w-full h-10 bg-black/40 border border-white/10 rounded-lg px-3 text-xs text-white" />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <input value={hackTeamSize} onChange={(e) => setHackTeamSize(e.target.value)} placeholder="Team size (e.g. 1-4)" className="w-full h-10 bg-black/40 border border-white/10 rounded-lg px-3 text-xs text-white" />
          <input value={hackContactEmail} onChange={(e) => setHackContactEmail(e.target.value)} placeholder="Contact email" className="w-full h-10 bg-black/40 border border-white/10 rounded-lg px-3 text-xs text-white" />
        </div>
        <input value={hackEligibility} onChange={(e) => setHackEligibility(e.target.value)} placeholder="Eligibility (e.g. Students / Open to all)" className="w-full h-10 bg-black/40 border border-white/10 rounded-lg px-3 text-xs text-white" />
        <textarea value={hackRules} onChange={(e) => setHackRules(e.target.value)} placeholder="Rules and judging details" className="w-full h-24 bg-black/40 border border-white/10 rounded-lg p-3 text-xs text-white resize-none" />
        <div className="grid grid-cols-2 gap-3">
          <input type="datetime-local" value={hackStartAt} onChange={(e) => setHackStartAt(e.target.value)} className="w-full h-10 bg-black/40 border border-white/10 rounded-lg px-3 text-xs text-white" />
          <input type="datetime-local" value={hackDeadlineAt} onChange={(e) => setHackDeadlineAt(e.target.value)} className="w-full h-10 bg-black/40 border border-white/10 rounded-lg px-3 text-xs text-white" />
        </div>
        <div className="flex gap-3">
          <Button
            onClick={async () => {
              if (!hackTitle.trim()) return toast.error("Title required.");
              const id = editingHackathonId || hackTitle.trim().toLowerCase().replace(/[^a-z0-9]+/g, "_");
              await setDoc(doc(db, "hackathons", id), {
                title: hackTitle.trim(),
                description: hackDescription.trim(),
                mode: hackMode,
                prize: hackPrize.trim(),
                status: hackStatus,
                tags: hackTags.split(",").map((t) => t.trim()).filter(Boolean),
                previewImageUrl: hackPreviewImage.trim(),
                hackathonLink: hackathonLink.trim(),
                organizer: hackOrganizer.trim(),
                venue: hackVenue.trim(),
                teamSize: hackTeamSize.trim(),
                eligibility: hackEligibility.trim(),
                contactEmail: hackContactEmail.trim(),
                rules: hackRules.trim(),
                startDate: hackStartAt ? new Date(hackStartAt) : null,
                registrationDeadline: hackDeadlineAt ? new Date(hackDeadlineAt) : null,
                updatedAt: serverTimestamp()
              }, { merge: true });
              toast.success(editingHackathonId ? "Hackathon updated." : "Hackathon posted.");
              resetHackathonForm();
            }}
            className="h-10 px-5 bg-primary text-black text-[10px] uppercase font-bold"
          >
            {editingHackathonId ? "Update Hackathon" : "Post Hackathon"}
          </Button>
          {editingHackathonId && (
            <Button onClick={resetHackathonForm} className="h-10 px-5 bg-white/5 border border-white/10 text-white text-[10px] uppercase font-bold">
              Cancel Edit
            </Button>
          )}
        </div>
      </div>
      <div className="p-6 bg-[#111] border border-white/10 rounded-xl space-y-3">
        <h3 className="text-sm font-bold uppercase text-white">Posted Hackathons</h3>
        {hackathons.length === 0 ? (
          <p className="text-xs text-text-muted">No hackathons posted yet.</p>
        ) : hackathons.map((h) => (
          <div key={h.id} className="p-3 bg-black/30 border border-white/10 rounded-lg">
            {h.previewImageUrl && (
              <img
                src={h.previewImageUrl}
                alt={`${h.title} preview`}
                className="w-full h-28 object-cover rounded-md border border-white/10 mb-3"
              />
            )}
            <div className="flex items-center justify-between gap-2">
              <div>
                <p className="text-xs font-bold text-white">{h.title}</p>
                <p className="text-[10px] text-text-muted uppercase">{h.status || "upcoming"} • {h.mode || "online"}</p>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => {
                    setEditingHackathonId(h.id);
                    setHackTitle(h.title || "");
                    setHackDescription(h.description || "");
                    setHackMode(h.mode || "Online");
                    setHackPrize(h.prize || "");
                    setHackStatus(h.status || "upcoming");
                    setHackTags(Array.isArray(h.tags) ? h.tags.join(", ") : "");
                    setHackPreviewImage(h.previewImageUrl || "");
                    setHackathonLink(h.hackathonLink || "");
                    setHackOrganizer(h.organizer || "");
                    setHackVenue(h.venue || "");
                    setHackTeamSize(h.teamSize || "");
                    setHackEligibility(h.eligibility || "");
                    setHackContactEmail(h.contactEmail || "");
                    setHackRules(h.rules || "");
                    const start = h.startDate?.toDate ? h.startDate.toDate() : null;
                    const deadline = h.registrationDeadline?.toDate ? h.registrationDeadline.toDate() : null;
                    setHackStartAt(start ? new Date(start.getTime() - start.getTimezoneOffset() * 60000).toISOString().slice(0, 16) : "");
                    setHackDeadlineAt(deadline ? new Date(deadline.getTime() - deadline.getTimezoneOffset() * 60000).toISOString().slice(0, 16) : "");
                  }}
                  className="text-[10px] text-primary uppercase font-bold"
                >
                  Edit
                </button>
                <button onClick={async () => { await deleteDoc(doc(db, "hackathons", h.id)); toast.success("Hackathon deleted."); }} className="text-[10px] text-red-400 uppercase font-bold">
                  Delete
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
