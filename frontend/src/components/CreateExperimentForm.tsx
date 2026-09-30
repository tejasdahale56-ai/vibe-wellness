"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, X, Loader2 } from "lucide-react";
import { createExperimentFromApi } from "@/lib/api";
import type { Experiment } from "@/types";

type CreateExperimentFormProps = {
  onClose: () => void;
  onCreated: (experiment: Experiment) => void;
};

export default function CreateExperimentForm({ onClose, onCreated }: CreateExperimentFormProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    why: "",
    context: "",
    durationDays: 1,
  });
  const [errors, setErrors] = useState<Partial<typeof formData>>({});

  const validateForm = () => {
    const newErrors: Partial<typeof formData> = {};
    if (!formData.title.trim()) newErrors.title = "Title is required";
    if (!formData.description.trim()) newErrors.description = "Description is required";
    if (!formData.why.trim()) newErrors.why = "Why is required";
    if (!formData.context.trim()) newErrors.context = "Context is required";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    setIsLoading(true);
    try {
      const experiment = await createExperimentFromApi({
        ...formData,
        progressPercent: 0,
        status: "planned",
        statusLabel: "Planned",
      });
      onCreated(experiment);
      onClose();
      router.push(`/experiment?experiment_id=${encodeURIComponent(experiment.id)}`);
    } catch (err) {
      console.error("Failed to create experiment:", err);
      alert("Failed to create experiment. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name as keyof typeof errors]) {
      setErrors((prev) => ({ ...prev, [name]: undefined }));
    }
  };

  return (
    <div className="create-experiment-modal" style={{
      position: "fixed",
      inset: 0,
      zIndex: 50,
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      background: "rgba(0, 0, 0, 0.6)",
      backdropFilter: "blur(4px)",
      padding: "20px"
    }}>
      <div style={{
        width: "100%",
        maxWidth: "520px",
        maxHeight: "90vh",
        overflowY: "auto",
        background: "var(--color-surface)",
        border: "1px solid var(--color-border)",
        borderRadius: "var(--radius-card)",
        boxShadow: "0 20px 60px rgba(0,0,0,0.3)",
        padding: "28px"
      }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "24px" }}>
          <h2 style={{ margin: 0, fontSize: "22px", fontWeight: 600, color: "var(--color-text)" }}>Create New Experiment</h2>
          <button onClick={onClose} style={{
            width: "32px", height: "32px", borderRadius: "50%", border: "1px solid var(--color-border)",
            background: "transparent", color: "var(--color-muted)", cursor: "pointer",
            display: "flex", alignItems: "center", justifyContent: "center", transition: "all 0.2s"
          }} onMouseOver={(e) => { e.currentTarget.style.background = "var(--color-surface-raised)"; e.currentTarget.style.color = "var(--color-text)"; }} onMouseOut={(e) => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = "var(--color-muted)"; }}>
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: "20px" }}>
            <label style={{ display: "block", marginBottom: "8px", fontSize: "13px", fontWeight: 600, color: "var(--color-text)" }}>Title</label>
            <input
              type="text"
              name="title"
              value={formData.title}
              onChange={handleChange}
              placeholder="e.g., Morning hydration routine"
              style={{
                width: "100%", padding: "12px 14px", border: `1px solid ${errors.title ? "#dc2626" : "var(--color-border)"}`,
                borderRadius: "var(--radius-control)", background: "var(--color-page)", color: "var(--color-text)",
                fontSize: "14px", outline: "none", transition: "border-color 0.2s"
              }}
            />
            {errors.title && <p style={{ margin: "6px 0 0", fontSize: "12px", color: "#dc2626" }}>{errors.title}</p>}
          </div>

          <div style={{ marginBottom: "20px" }}>
            <label style={{ display: "block", marginBottom: "8px", fontSize: "13px", fontWeight: 600, color: "var(--color-text)" }}>Description</label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              placeholder="What will you do? e.g., Drink a glass of water within 30 minutes of waking up"
              rows={3}
              style={{
                width: "100%", padding: "12px 14px", border: `1px solid ${errors.description ? "#dc2626" : "var(--color-border)"}`,
                borderRadius: "var(--radius-control)", background: "var(--color-page)", color: "var(--color-text)",
                fontSize: "14px", outline: "none", resize: "vertical", fontFamily: "inherit", transition: "border-color 0.2s"
              }}
            />
            {errors.description && <p style={{ margin: "6px 0 0", fontSize: "12px", color: "#dc2626" }}>{errors.description}</p>}
          </div>

          <div style={{ marginBottom: "20px" }}>
            <label style={{ display: "block", marginBottom: "8px", fontSize: "13px", fontWeight: 600, color: "var(--color-text)" }}>Why this experiment?</label>
            <textarea
              name="why"
              value={formData.why}
              onChange={handleChange}
              placeholder="What pattern or curiosity led to this? e.g., I notice I feel more energized on days I hydrate early"
              rows={3}
              style={{
                width: "100%", padding: "12px 14px", border: `1px solid ${errors.why ? "#dc2626" : "var(--color-border)"}`,
                borderRadius: "var(--radius-control)", background: "var(--color-page)", color: "var(--color-text)",
                fontSize: "14px", outline: "none", resize: "vertical", fontFamily: "inherit", transition: "border-color 0.2s"
              }}
            />
            {errors.why && <p style={{ margin: "6px 0 0", fontSize: "12px", color: "#dc2626" }}>{errors.why}</p>}
          </div>

          <div style={{ marginBottom: "20px" }}>
            <label style={{ display: "block", marginBottom: "8px", fontSize: "13px", fontWeight: 600, color: "var(--color-text)" }}>Context</label>
            <textarea
              name="context"
              value={formData.context}
              onChange={handleChange}
              placeholder="Any relevant context? e.g., My current morning routine is coffee first, water later"
              rows={2}
              style={{
                width: "100%", padding: "12px 14px", border: `1px solid ${errors.context ? "#dc2626" : "var(--color-border)"}`,
                borderRadius: "var(--radius-control)", background: "var(--color-page)", color: "var(--color-text)",
                fontSize: "14px", outline: "none", resize: "vertical", fontFamily: "inherit", transition: "border-color 0.2s"
              }}
            />
            {errors.context && <p style={{ margin: "6px 0 0", fontSize: "12px", color: "#dc2626" }}>{errors.context}</p>}
          </div>

          <div style={{ marginBottom: "24px" }}>
            <label style={{ display: "block", marginBottom: "8px", fontSize: "13px", fontWeight: 600, color: "var(--color-text)" }}>Duration (days)</label>
            <select
              name="durationDays"
              value={formData.durationDays}
              onChange={handleChange}
              style={{
                width: "100%", padding: "12px 14px", border: "1px solid var(--color-border)",
                borderRadius: "var(--radius-control)", background: "var(--color-page)", color: "var(--color-text)",
                fontSize: "14px", outline: "none", cursor: "pointer"
              }}
            >
              {[1, 3, 5, 7, 14, 21, 30].map((days) => (
                <option key={days} value={days}>{days} {days === 1 ? "day" : "days"}</option>
              ))}
            </select>
          </div>

          <div style={{ display: "flex", gap: "12px", justifyContent: "flex-end" }}>
            <button
              type="button"
              onClick={onClose}
              disabled={isLoading}
              style={{
                padding: "12px 20px", border: "1px solid var(--color-border)", borderRadius: "var(--radius-control)",
                background: "transparent", color: "var(--color-text)", fontSize: "13px", fontWeight: 600,
                cursor: isLoading ? "not-allowed" : "pointer", opacity: isLoading ? 0.6 : 1
              }}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading}
              style={{
                padding: "12px 20px", border: "none", borderRadius: "var(--radius-control)",
                background: "var(--color-accent)", color: "#172017", fontSize: "13px", fontWeight: 600,
                cursor: isLoading ? "not-allowed" : "pointer", display: "flex", alignItems: "center", gap: "8px"
              }}
            >
              {isLoading ? <Loader2 size={16} className="animate-spin" /> : <>Create Experiment <Plus size={16} /></>}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
