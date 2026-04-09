import { useState } from "react";
import Layout from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

const Feedback = () => {
  const [type, setType] = useState("general");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim()) {
      toast.error("Please enter your feedback");
      return;
    }
    setLoading(true);
    // Will store in database when backend is connected
    setTimeout(() => {
      toast.success("Thank you for your feedback!");
      setMessage("");
      setLoading(false);
    }, 500);
  };

  return (
    <Layout>
      <section className="section-padding flex items-center justify-center min-h-[70vh]">
        <div className="w-full max-w-lg">
          <div className="glass rounded-2xl p-8">
            <h1 className="text-2xl font-bold mb-2">Share Feedback</h1>
            <p className="text-sm text-text-secondary mb-8">Help us improve ZeroCode AI</p>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="text-sm text-text-secondary block mb-1.5">Type</label>
                <select
                  value={type}
                  onChange={(e) => setType(e.target.value)}
                  className="w-full bg-surface border border-border rounded-lg px-4 py-2.5 text-sm outline-none focus:border-primary/50 transition-colors"
                >
                  <option value="general">General Feedback</option>
                  <option value="bug">Bug Report</option>
                  <option value="feature">Feature Request</option>
                  <option value="content">Content Suggestion</option>
                </select>
              </div>

              <div>
                <label className="text-sm text-text-secondary block mb-1.5">Message</label>
                <textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  rows={5}
                  className="w-full bg-surface border border-border rounded-lg px-4 py-2.5 text-sm outline-none focus:border-primary/50 transition-colors placeholder:text-text-muted resize-none"
                  placeholder="Tell us what you think..."
                  maxLength={1000}
                />
                <span className="text-xs text-text-muted">{message.length}/1000</span>
              </div>

              <Button type="submit" variant="hero" className="w-full" disabled={loading}>
                {loading ? "Sending..." : "Send Feedback"}
              </Button>
            </form>
          </div>
        </div>
      </section>
    </Layout>
  );
};

export default Feedback;
