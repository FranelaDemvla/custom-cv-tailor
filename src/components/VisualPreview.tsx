import { useRef, useState, useEffect } from "react";
import type { ResumeData } from "../types";
import { sanitize } from "../lib/sanitize";

export default function VisualPreview({ data }: { data: ResumeData }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(0.5);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const ro = new ResizeObserver(([entry]) => {
      setScale(entry.contentRect.width / 595);
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const contact = data.contact || {};
  const contactParts = [contact.email, contact.phone, contact.location].filter(
    Boolean,
  );
  const experience = (data.experience || []).slice(0, 4);
  const skills = data.skills || [];
  const education = (data.education || []).slice(0, 3);
  const summary = (data.summary || "").slice(0, 500);

  return (
    <div
      ref={containerRef}
      className="w-full max-w-sm aspect-210/297 bg-surface-200 rounded-lg overflow-hidden relative"
    >
      <div
        className="absolute top-0 left-0 bg-white origin-top-left"
        style={{ width: 595, height: 842, transform: `scale(${scale})` }}
      >
        <div style={{ padding: 40 }}>
          <div
            style={{
              fontSize: 20,
              fontWeight: "bold",
              textAlign: "center",
              marginBottom: 4,
            }}
          >
            {sanitize(contact.name || "")}
          </div>

          {contactParts.length > 0 && (
            <div
              style={{
                display: "flex",
                flexDirection: "row",
                justifyContent: "center",
                gap: 12,
                marginTop: 12,
                marginBottom: 12,
                fontSize: 9,
                color: "#444",
              }}
            >
              {contactParts.join("  |  ")}
            </div>
          )}

          <div style={{ borderBottom: "1px solid #333", marginBottom: 10 }} />

          {summary && (
            <div style={{ marginBottom: 6 }}>
              <SectionTitle>Professional Summary</SectionTitle>
              <div style={{ fontSize: 9.5, lineHeight: 1.5 }}>
                {sanitize(summary)}
              </div>
            </div>
          )}

          {experience.length > 0 && (
            <div>
              <SectionTitle>Experience</SectionTitle>
              {experience.map((exp, i) => (
                <div key={i} style={{ marginBottom: 6 }}>
                  <div
                    style={{
                      display: "flex",
                      flexDirection: "row",
                      justifyContent: "space-between",
                      marginBottom: 2,
                      marginTop: 6,
                    }}
                  >
                    <div>
                      <div style={{ fontWeight: "bold", fontSize: 10 }}>
                        {sanitize(exp.role)}
                      </div>
                      <div style={{ fontSize: 10 }}>
                        {sanitize(exp.company)}
                      </div>
                    </div>
                    <div style={{ fontSize: 9, color: "#555" }}>
                      {sanitize(exp.dates)}
                    </div>
                  </div>
                  {(exp.bullets || []).slice(0, 4).map((b, j) => (
                    <div
                      key={j}
                      style={{
                        fontSize: 9,
                        marginLeft: 12,
                        marginBottom: 1,
                        lineHeight: 1.4,
                      }}
                    >
                      {"\u2022"} {sanitize(b)}
                    </div>
                  ))}
                </div>
              ))}
            </div>
          )}

          {skills.length > 0 && (
            <div>
              <SectionTitle>Skills</SectionTitle>
              <div
                style={{
                  display: "flex",
                  flexDirection: "row",
                  flexWrap: "wrap",
                  gap: 4,
                }}
              >
                {skills.map((skill, i) => (
                  <span
                    key={i}
                    style={{
                      fontSize: 9,
                      backgroundColor: "#f0f0f0",
                      padding: "2px 6px",
                      borderRadius: 3,
                    }}
                  >
                    {sanitize(skill)}
                  </span>
                ))}
              </div>
            </div>
          )}

          {education.length > 0 && (
            <div>
              <SectionTitle>Education</SectionTitle>
              {education.map((edu, i) => (
                <div
                  key={i}
                  style={{
                    display: "flex",
                    flexDirection: "row",
                    justifyContent: "space-between",
                    marginBottom: 3,
                    fontSize: 9.5,
                  }}
                >
                  <div>
                    <div style={{ fontWeight: "bold" }}>
                      {sanitize(edu.institution)}
                    </div>
                    <div>{sanitize(edu.degree)}</div>
                  </div>
                  <div style={{ color: "#555" }}>{sanitize(edu.year)}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        fontSize: 11,
        fontWeight: "bold",
        textTransform: "uppercase",
        letterSpacing: 1,
        borderBottom: "0.5px solid #999",
        marginBottom: 6,
        marginTop: 10,
        paddingBottom: 2,
      }}
    >
      {children}
    </div>
  );
}
