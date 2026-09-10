import { Document, Page, Text, View, StyleSheet } from "@react-pdf/renderer";
import type {
  ExperienceItem,
  OutputLanguage,
  ResumeData,
  ResumeStyleOptions,
} from "../types";
import { sanitize } from "../lib/sanitize";
import { getResumeAccent, getResumeFont, PDF_LABELS } from "../lib/resumeStyles";

function createStyles(style: ResumeStyleOptions) {
  const font = getResumeFont(style);
  const accent = getResumeAccent(style);
  const scale = style.fontScale;
  return StyleSheet.create({
    page: {
      padding: style.padding,
      fontFamily: font.regular,
      fontSize: 10 * scale,
      lineHeight: 1.38,
      color: "#202124",
    },
    name: {
      color: accent.color,
      fontFamily: font.bold,
      fontSize: 22 * scale,
      textAlign: "center",
      marginBottom: 5,
    },
    contactRow: {
      flexDirection: "row",
      justifyContent: "center",
      marginVertical: 3,
      fontSize: 9 * scale,
      color: "#4B5563",
    },
    divider: {
      borderBottomWidth: 1.5,
      borderBottomColor: accent.color,
      borderBottomStyle: "solid",
      marginTop: 9,
      marginBottom: 2,
    },
    sectionTitle: {
      color: accent.color,
      fontFamily: font.bold,
      fontSize: 10.5 * scale,
      textTransform: "uppercase",
      letterSpacing: 1,
      borderBottomWidth: 0.6,
      borderBottomColor: accent.color,
      borderBottomStyle: "solid",
      marginBottom: 6,
      marginTop: 12,
      paddingBottom: 3,
    },
    summaryText: {
      fontSize: 9.5 * scale,
      marginBottom: 2,
      lineHeight: 1.48,
    },
    expItem: {
      marginBottom: 5,
      minPresenceAhead: 36,
    },
    expHeader: {
      flexDirection: "row",
      justifyContent: "space-between",
      marginBottom: 2,
      marginTop: 4,
    },
    expRole: {
      fontFamily: font.bold,
      fontSize: 10 * scale,
    },
    expCompany: {
      fontSize: 9.7 * scale,
    },
    expDates: {
      fontSize: 9 * scale,
      color: "#5B6470",
      textAlign: "right",
    },
    bullet: {
      fontSize: 9 * scale,
      marginLeft: 12,
      marginBottom: 1.5,
      lineHeight: 1.4,
    },
    skillsContainer: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: 4,
    },
    skillItem: {
      color: accent.color,
      backgroundColor: accent.soft,
      fontSize: 8.8 * scale,
      paddingHorizontal: 6,
      paddingVertical: 3,
      borderRadius: 2,
    },
    eduItem: {
      flexDirection: "row",
      justifyContent: "space-between",
      marginBottom: 4,
      fontSize: 9.5 * scale,
      minPresenceAhead: 24,
    },
    eduInstitution: {
      fontFamily: font.bold,
    },
    eduYear: {
      color: "#5B6470",
    },
  });
}

function ExperienceItem({
  exp,
  styles,
}: {
  exp: ExperienceItem;
  styles: ReturnType<typeof createStyles>;
}) {
  return (
    <View style={styles.expItem}>
      <View style={styles.expHeader}>
        <View>
          <Text style={styles.expRole}>{sanitize(exp.role)}</Text>
          <Text style={styles.expCompany}>{sanitize(exp.company)}</Text>
        </View>
        <Text style={styles.expDates}>{sanitize(exp.dates)}</Text>
      </View>
      {(exp.bullets || []).filter(Boolean).map((bullet, index) => (
        <Text key={index} style={styles.bullet}>
          {"\u2022"} {sanitize(bullet)}
        </Text>
      ))}
    </View>
  );
}

interface ResumeTemplateProps {
  data: ResumeData;
  layout: ResumeStyleOptions;
  outputLanguage?: OutputLanguage;
}

export default function ResumeTemplate({
  data,
  layout,
  outputLanguage = "en",
}: ResumeTemplateProps) {
  const labels = PDF_LABELS[outputLanguage];
  const styles = createStyles(layout);
  const contact = data.contact || {};
  const experience = (data.experience || []).filter((item) =>
    Boolean(item.role || item.company || item.dates || item.bullets?.some(Boolean)),
  );
  const skills = (data.skills || []).filter(Boolean);
  const education = (data.education || []).filter((item) =>
    Boolean(item.institution || item.degree || item.year),
  );
  const contactParts = [contact.email, contact.phone, contact.location].filter(Boolean);
  const profiles = (contact.profiles || []).filter(
    (profile) => profile.platform || profile.url,
  );

  return (
    <Document>
      <Page size="A4" style={styles.page} wrap>
        <Text style={styles.name}>{sanitize(contact.name || "")}</Text>
        {contactParts.length > 0 && (
          <View style={styles.contactRow}>
            <Text>{contactParts.map(sanitize).join("  |  ")}</Text>
          </View>
        )}
        {profiles.length > 0 && (
          <View style={styles.contactRow}>
            <Text>
              {profiles
                .map(
                  (profile) =>
                    sanitize(profile.platform) + ": " + sanitize(profile.url),
                )
                .join("  |  ")}
            </Text>
          </View>
        )}
        <View style={styles.divider} />

        {data.summary.trim() && (
          <View>
            <Text style={styles.sectionTitle} minPresenceAhead={30}>
              {labels.summary}
            </Text>
            <Text style={styles.summaryText}>{sanitize(data.summary)}</Text>
          </View>
        )}

        {experience.length > 0 && (
          <View>
            <Text style={styles.sectionTitle} minPresenceAhead={42}>
              {labels.experience}
            </Text>
            {experience.map((item, index) => (
              <ExperienceItem key={index} exp={item} styles={styles} />
            ))}
          </View>
        )}

        {skills.length > 0 && (
          <View>
            <Text style={styles.sectionTitle} minPresenceAhead={30}>
              {labels.skills}
            </Text>
            <View style={styles.skillsContainer}>
              {skills.map((skill, index) => (
                <Text key={index} style={styles.skillItem}>
                  {sanitize(skill)}
                </Text>
              ))}
            </View>
          </View>
        )}

        {education.length > 0 && (
          <View>
            <Text style={styles.sectionTitle} minPresenceAhead={30}>
              {labels.education}
            </Text>
            {education.map((item, index) => (
              <View key={index} style={styles.eduItem}>
                <View>
                  <Text style={styles.eduInstitution}>{sanitize(item.institution)}</Text>
                  <Text>{sanitize(item.degree)}</Text>
                </View>
                <Text style={styles.eduYear}>{sanitize(item.year)}</Text>
              </View>
            ))}
          </View>
        )}
      </Page>
    </Document>
  );
}
