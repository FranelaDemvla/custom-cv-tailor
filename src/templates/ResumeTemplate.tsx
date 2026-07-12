import { Document, Page, Text, View, StyleSheet } from "@react-pdf/renderer";
import type { ExperienceItem, ResumeData } from "../types";
import { sanitize } from "../lib/sanitize";

const styles = StyleSheet.create({
  page: {
    padding: 40,
    fontFamily: "Helvetica",
    fontSize: 10,
    lineHeight: 1.4,
    color: "#1a1a1a",
  },
  name: {
    fontSize: 20,
    fontFamily: "Helvetica-Bold",
    textAlign: "center",
    marginBottom: 4,
  },
  contactRow: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 12,
    marginVertical: 12,
    fontSize: 9,
    color: "#444",
  },
  divider: {
    borderBottomWidth: 1,
    borderBottomColor: "#333",
    borderBottomStyle: "solid",
    marginBottom: 10,
  },
  sectionTitle: {
    fontSize: 11,
    fontFamily: "Helvetica-Bold",
    textTransform: "uppercase",
    letterSpacing: 1,
    borderBottomWidth: 0.5,
    borderBottomColor: "#999",
    borderBottomStyle: "solid",
    marginBottom: 6,
    marginTop: 10,
    paddingBottom: 2,
  },
  summaryText: {
    fontSize: 9.5,
    marginBottom: 4,
    lineHeight: 1.5,
  },
  expHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 2,
    marginTop: 6,
  },
  expRole: {
    fontFamily: "Helvetica-Bold",
    fontSize: 10,
  },
  expCompany: {
    fontSize: 10,
  },
  expDates: {
    fontSize: 9,
    color: "#555",
  },
  bullet: {
    fontSize: 9,
    marginLeft: 12,
    marginBottom: 1,
    lineHeight: 1.4,
  },
  skillsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 4,
  },
  skillItem: {
    fontSize: 9,
    backgroundColor: "#f0f0f0",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 3,
  },
  eduItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 3,
    fontSize: 9.5,
  },
  eduInstitution: {
    fontFamily: "Helvetica-Bold",
  },
  eduDegree: {},
  eduYear: {
    color: "#555",
  },
});

const MAX_EXPERIENCE = 4;
const MAX_BULLETS_PER_ROLE = 4;
const MAX_EDUCATION = 3;
const MAX_SUMMARY_LENGTH = 500;

function ExperienceItem({ exp }: { exp: ExperienceItem }) {
  const bullets = exp.bullets?.slice(0, MAX_BULLETS_PER_ROLE) || [];
  return (
    <View>
      <View style={styles.expHeader}>
        <View>
          <Text style={styles.expRole}>{exp.role}</Text>
          <Text style={styles.expCompany}>{exp.company}</Text>
        </View>
        <Text style={styles.expDates}>{exp.dates}</Text>
      </View>
      {bullets.map((b, i) => (
        <Text key={i} style={styles.bullet}>
          {"\u2022"} {sanitize(b)}
        </Text>
      ))}
    </View>
  );
}

interface ResumeTemplateProps {
  data: ResumeData;
}

export default function ResumeTemplate({ data }: ResumeTemplateProps) {
  if (!data) return null;

  const contact = data.contact || {};
  const experience = (data.experience || []).slice(0, MAX_EXPERIENCE);
  const skills = data.skills || [];
  const education = (data.education || []).slice(0, MAX_EDUCATION);
  const summary = (data.summary || "").slice(0, MAX_SUMMARY_LENGTH);

  const contactParts = [contact.email, contact.phone, contact.location].filter(
    Boolean,
  );

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <Text style={styles.name}>{sanitize(contact.name || "")}</Text>
        {contactParts.length > 0 && (
          <View style={styles.contactRow}>
            <Text>{contactParts.join("  |  ")}</Text>
          </View>
        )}
        <View style={styles.divider} />

        {summary && (
          <View>
            <Text style={styles.sectionTitle}>Professional Summary</Text>
            <Text style={styles.summaryText}>{sanitize(summary)}</Text>
          </View>
        )}

        {experience.length > 0 && (
          <View>
            <Text style={styles.sectionTitle}>Experience</Text>
            {experience.map((exp, i) => (
              <ExperienceItem key={i} exp={exp} />
            ))}
          </View>
        )}

        {skills.length > 0 && (
          <View>
            <Text style={styles.sectionTitle}>Skills</Text>
            <View style={styles.skillsContainer}>
              {skills.map((skill, i) => (
                <Text key={i} style={styles.skillItem}>
                  {sanitize(skill)}
                </Text>
              ))}
            </View>
          </View>
        )}

        {education.length > 0 && (
          <View>
            <Text style={styles.sectionTitle}>Education</Text>
            {education.map((edu, i) => (
              <View key={i} style={styles.eduItem}>
                <View>
                  <Text style={styles.eduInstitution}>
                    {sanitize(edu.institution)}
                  </Text>
                  <Text style={styles.eduDegree}>{sanitize(edu.degree)}</Text>
                </View>
                <Text style={styles.eduYear}>{sanitize(edu.year)}</Text>
              </View>
            ))}
          </View>
        )}
      </Page>
    </Document>
  );
}
