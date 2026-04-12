import {
  Body,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Preview,
  Section,
  Text,
  Row,
  Column
} from "@react-email/components";
import { DigestResult } from "@/lib/digest";

interface DigestEmailProps {
  instanceName: string;
  chunkIndex: number;
  totalChunks: number;
  digest: DigestResult;
  userEmail: string;
}

export function DigestEmail({
  instanceName,
  chunkIndex,
  totalChunks,
  digest
}: DigestEmailProps) {
  const progressPercent = Math.round(((chunkIndex + 1) / totalChunks) * 100);

  return (
    <Html>
      <Head />
      <Preview>{digest.subject}</Preview>
      <Body style={styles.body}>
        <Container style={styles.container}>

          {/* Header */}
          <Section style={styles.header}>
            <Text style={styles.logo}>Recall</Text>
            <Text style={styles.headerMeta}>
              {instanceName} · Section {chunkIndex + 1} of {totalChunks}
            </Text>
          </Section>

          {/* Progress bar */}
          <Section style={styles.progressSection}>
            <Row>
              <Column>
                <Text style={styles.progressLabel}>{progressPercent}% through your material</Text>
                <div style={styles.progressBarBg}>
                  <div style={{ ...styles.progressBarFill, width: `${progressPercent}%` }} />
                </div>
              </Column>
            </Row>
          </Section>

          <Hr style={styles.divider} />

          {/* Summary */}
          <Section style={styles.section}>
            <Heading style={styles.sectionTitle}>Summary</Heading>
            <Text style={styles.summaryText}>{digest.summary}</Text>
          </Section>

          <Hr style={styles.divider} />

          {/* Key points */}
          {digest.keyPoints.length > 0 && (
            <Section style={styles.section}>
              <Heading style={styles.sectionTitle}>Key points</Heading>
              {digest.keyPoints.map((point, i) => (
                <Row key={i} style={styles.bulletRow}>
                  <Column style={styles.bulletDot}>
                    <Text style={styles.dot}>·</Text>
                  </Column>
                  <Column>
                    <Text style={styles.bulletText}>{point}</Text>
                  </Column>
                </Row>
              ))}
            </Section>
          )}

          <Hr style={styles.divider} />

          {/* Recall questions */}
          {digest.recallQuestions.length > 0 && (
            <Section style={styles.section}>
              <Heading style={styles.sectionTitle}>Test yourself</Heading>
              <Text style={styles.recallIntro}>
                Can you answer these without looking?
              </Text>
              {digest.recallQuestions.map((question, i) => (
                <Text key={i} style={styles.question}>
                  {i + 1}. {question}
                </Text>
              ))}
            </Section>
          )}

          <Hr style={styles.divider} />

          {/* Footer */}
          <Section style={styles.footer}>
            <Text style={styles.footerText}>
              ~{digest.estimatedReadMinutes} min read · Recall daily digest
            </Text>
            <Text style={styles.footerMeta}>
              You're receiving this because you set up a Recall instance for {instanceName}.
              To pause or cancel, log in to your Recall dashboard.
            </Text>
          </Section>

        </Container>
      </Body>
    </Html>
  );
}

const styles: Record<string, React.CSSProperties> = {
  body: {
    backgroundColor: "#f9f9f7",
    fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif"
  },
  container: {
    maxWidth: "600px",
    margin: "40px auto",
    backgroundColor: "#ffffff",
    borderRadius: "8px",
    overflow: "hidden",
    border: "1px solid #e8e8e4"
  },
  header: {
    padding: "28px 32px 20px"
  },
  logo: {
    fontSize: "20px",
    fontWeight: "500",
    color: "#1D9E75",
    margin: "0 0 4px"
  },
  headerMeta: {
    fontSize: "13px",
    color: "#888",
    margin: "0"
  },
  progressSection: {
    padding: "0 32px 20px"
  },
  progressLabel: {
    fontSize: "12px",
    color: "#aaa",
    margin: "0 0 6px"
  },
  progressBarBg: {
    backgroundColor: "#f0f0ec",
    borderRadius: "4px",
    height: "4px",
    overflow: "hidden"
  },
  progressBarFill: {
    backgroundColor: "#1D9E75",
    height: "4px",
    borderRadius: "4px"
  },
  divider: {
    borderColor: "#f0f0ec",
    margin: "0"
  },
  section: {
    padding: "24px 32px"
  },
  sectionTitle: {
    fontSize: "11px",
    fontWeight: "500",
    color: "#aaa",
    textTransform: "uppercase",
    letterSpacing: "0.08em",
    margin: "0 0 14px"
  },
  summaryText: {
    fontSize: "15px",
    lineHeight: "1.7",
    color: "#2c2c2a",
    margin: "0"
  },
  bulletRow: {
    marginBottom: "8px"
  },
  bulletDot: {
    width: "16px",
    paddingTop: "2px"
  },
  dot: {
    fontSize: "18px",
    color: "#1D9E75",
    margin: "0",
    lineHeight: "1.5"
  },
  bulletText: {
    fontSize: "14px",
    lineHeight: "1.6",
    color: "#2c2c2a",
    margin: "0"
  },
  recallIntro: {
    fontSize: "13px",
    color: "#888",
    margin: "0 0 12px",
    fontStyle: "italic"
  },
  question: {
    fontSize: "14px",
    lineHeight: "1.6",
    color: "#2c2c2a",
    margin: "0 0 10px",
    paddingLeft: "4px"
  },
  footer: {
    padding: "20px 32px 28px",
    backgroundColor: "#f9f9f7"
  },
  footerText: {
    fontSize: "12px",
    color: "#aaa",
    margin: "0 0 8px"
  },
  footerMeta: {
    fontSize: "11px",
    color: "#bbb",
    lineHeight: "1.5",
    margin: "0"
  }
};
