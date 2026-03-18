import {
  Html,
  Head,
  Body,
  Container,
  Section,
  Text,
  Link,
  Hr,
  Preview,
  Row,
  Column,
} from '@react-email/components'
import { DigestOpportunity } from './DailyDigest'

interface WeeklySummaryProps {
  pursuingCount: number
  newThisWeek: number
  closingThisWeek: DigestOpportunity[]
  topMatches: DigestOpportunity[]
  settingsUrl: string
  userEmail: string
  dateRange: string  // e.g. "Mar 18 – Mar 24, 2026"
}

function formatValue(min: number | null, max: number | null): string {
  const val = min ?? max
  if (val === null) return 'Not specified'
  if (val >= 1_000_000) return `$${(val / 1_000_000).toFixed(1)}M`
  if (val >= 1_000) return `$${Math.round(val / 1_000)}K`
  return `$${val.toLocaleString()}`
}

function formatDeadline(deadline: string | null): string {
  if (!deadline) return 'No deadline'
  return new Date(deadline).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

const bodyStyle = {
  backgroundColor: '#f9fafb',
  fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
}

const containerStyle = {
  backgroundColor: '#ffffff',
  margin: '32px auto',
  padding: '0',
  maxWidth: '600px',
  borderRadius: '8px',
  border: '1px solid #e5e7eb',
}

const headerStyle = {
  backgroundColor: '#111827',
  padding: '28px 36px 20px',
  borderRadius: '8px 8px 0 0',
}

const logoStyle = {
  fontSize: '20px',
  fontWeight: '800',
  color: '#ffffff',
  margin: '0',
}

const dateRangeStyle = {
  fontSize: '13px',
  color: '#9ca3af',
  margin: '4px 0 0',
}

const contentStyle = {
  padding: '28px 36px',
}

const sectionTitleStyle = {
  fontSize: '13px',
  fontWeight: '700',
  color: '#6b7280',
  textTransform: 'uppercase' as const,
  letterSpacing: '0.05em',
  margin: '0 0 12px',
}

const statLabelStyle = {
  fontSize: '12px',
  color: '#9ca3af',
  margin: '4px 0 0',
  textAlign: 'center' as const,
}

const statValueStyle = {
  fontSize: '32px',
  fontWeight: '800',
  color: '#111827',
  margin: '0',
  textAlign: 'center' as const,
}

const cardStyle = {
  backgroundColor: '#f9fafb',
  border: '1px solid #e5e7eb',
  borderRadius: '6px',
  padding: '14px 16px',
  marginBottom: '10px',
}

const titleStyle = {
  fontSize: '14px',
  fontWeight: '700',
  color: '#111827',
  textDecoration: 'none',
  lineHeight: '1.4',
}

const metaStyle = {
  fontSize: '12px',
  color: '#6b7280',
  margin: '4px 0 0',
}

const hrStyle = {
  borderColor: '#e5e7eb',
  margin: '24px 0',
}

const footerStyle = {
  padding: '20px 36px 28px',
  borderTop: '1px solid #f3f4f6',
}

const footerTextStyle = {
  fontSize: '12px',
  color: '#9ca3af',
  margin: '0',
  lineHeight: '1.6',
}

export default function WeeklySummary({
  pursuingCount,
  newThisWeek,
  closingThisWeek,
  topMatches,
  settingsUrl,
  userEmail,
  dateRange,
}: WeeklySummaryProps) {
  return (
    <Html lang="en">
      <Head />
      <Preview>
        {`Your FedScout weekly briefing — ${newThisWeek} new matches, ${pursuingCount} pursuing`}
      </Preview>
      <Body style={bodyStyle}>
        <Container style={containerStyle}>
          {/* Header */}
          <Section style={headerStyle}>
            <Text style={logoStyle}>
              <span style={{ color: '#ffffff' }}>Fed</span>
              <span style={{ color: '#ef4444' }}>Scout</span>
              {' '}Weekly Briefing
            </Text>
            <Text style={dateRangeStyle}>{dateRange}</Text>
          </Section>

          {/* Body */}
          <Section style={contentStyle}>
            {/* Stats row */}
            <Row style={{ marginBottom: '24px' }}>
              <Column style={{ textAlign: 'center', padding: '0 8px' }}>
                <Text style={statValueStyle}>{pursuingCount}</Text>
                <Text style={statLabelStyle}>Pursuing</Text>
              </Column>
              <Column style={{ textAlign: 'center', padding: '0 8px' }}>
                <Text style={statValueStyle}>{newThisWeek}</Text>
                <Text style={statLabelStyle}>New matches</Text>
              </Column>
              <Column style={{ textAlign: 'center', padding: '0 8px' }}>
                <Text style={statValueStyle}>{closingThisWeek.length}</Text>
                <Text style={statLabelStyle}>Closing this week</Text>
              </Column>
            </Row>

            <Hr style={hrStyle} />

            {/* Closing this week */}
            {closingThisWeek.length > 0 && (
              <>
                <Text style={sectionTitleStyle}>Closing this week</Text>
                {closingThisWeek.map((opp, i) => (
                  <Section key={i} style={cardStyle}>
                    <Link href={opp.sam_url} style={titleStyle}>{opp.title}</Link>
                    <Text style={metaStyle}>
                      {opp.agency} · Due {formatDeadline(opp.response_deadline)} · Est. {formatValue(opp.estimated_value_min, opp.estimated_value_max)}
                    </Text>
                  </Section>
                ))}
                <Hr style={hrStyle} />
              </>
            )}

            {/* Top new matches */}
            {topMatches.length > 0 && (
              <>
                <Text style={sectionTitleStyle}>Top new matches</Text>
                {topMatches.map((opp, i) => (
                  <Section key={i} style={cardStyle}>
                    <Link href={opp.sam_url} style={titleStyle}>{opp.title}</Link>
                    {opp.score !== undefined && opp.scoreLabel && (
                      <Text style={{
                        fontSize: '11px',
                        color: opp.score >= 80 ? '#16a34a' : opp.score >= 60 ? '#d97706' : '#9ca3af',
                        margin: '3px 0 0',
                      }}>
                        {opp.score}/100 · {opp.scoreLabel}
                      </Text>
                    )}
                    <Text style={metaStyle}>
                      {opp.agency} · Est. {formatValue(opp.estimated_value_min, opp.estimated_value_max)}
                    </Text>
                  </Section>
                ))}
                <Hr style={hrStyle} />
              </>
            )}

            {/* CTA */}
            <Section style={{ textAlign: 'center', margin: '8px 0 0' }}>
              <Link
                href={settingsUrl.replace('/settings', '/dashboard')}
                style={{
                  backgroundColor: '#111827',
                  color: '#ffffff',
                  padding: '12px 28px',
                  borderRadius: '6px',
                  fontSize: '14px',
                  fontWeight: '600',
                  textDecoration: 'none',
                  display: 'inline-block',
                }}
              >
                Review your full pipeline →
              </Link>
            </Section>
          </Section>

          {/* Footer */}
          <Section style={footerStyle}>
            <Text style={footerTextStyle}>
              You&apos;re receiving this because you have an active FedScout subscription.{' '}
              <Link href={settingsUrl} style={{ color: '#6b7280' }}>
                Manage preferences
              </Link>
              {userEmail ? ` · Sent to ${userEmail}` : ''}
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  )
}
