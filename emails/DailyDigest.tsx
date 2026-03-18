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
  Heading,
  Row,
  Column,
} from '@react-email/components'

export interface DigestOpportunity {
  title: string
  sam_url: string
  agency: string
  estimated_value_min: number | null
  estimated_value_max: number | null
  response_deadline: string | null
  description: string
  score?: number
  scoreLabel?: string
  brief?: string
}

interface DailyDigestProps {
  opportunities: DigestOpportunity[]
  date: string           // e.g. "Monday, March 17, 2026"
  settingsUrl: string
  userEmail: string
}

function formatValue(min: number | null, max: number | null): string {
  const val = min ?? max
  if (val === null) return 'Not specified'
  if (val >= 1_000_000) return `$${(val / 1_000_000).toFixed(1)}M`
  if (val >= 1_000) return `$${Math.round(val / 1_000)}K`
  return `$${val.toLocaleString()}`
}

function formatDeadline(deadline: string | null): string {
  if (!deadline) return 'No deadline listed'
  const d = new Date(deadline)
  return d.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
}

function excerpt(description: string): string {
  if (!description) return ''
  const clean = description.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim()
  return clean.length > 160 ? clean.slice(0, 157) + '…' : clean
}

// ─── Styles ───────────────────────────────────────────────────────────────────

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
  backgroundColor: '#ffffff',
  padding: '28px 36px 20px',
  borderBottom: '1px solid #f3f4f6',
}

const logoStyle = {
  fontSize: '18px',
  fontWeight: '700',
  color: '#111827',
  margin: '0',
}

const dateStyle = {
  fontSize: '13px',
  color: '#9ca3af',
  margin: '4px 0 0',
}

const contentStyle = {
  padding: '24px 36px',
}

const introStyle = {
  fontSize: '15px',
  color: '#374151',
  margin: '0 0 24px',
  lineHeight: '1.6',
}

const titleStyle = {
  fontSize: '15px',
  fontWeight: '700',
  color: '#111827',
  textDecoration: 'none',
  lineHeight: '1.4',
}

const metaStyle = {
  fontSize: '13px',
  color: '#6b7280',
  margin: '6px 0 0',
  lineHeight: '1.5',
}

const excerptStyle = {
  fontSize: '13px',
  color: '#9ca3af',
  margin: '6px 0 0',
  lineHeight: '1.6',
}

const hrStyle = {
  borderColor: '#f3f4f6',
  margin: '20px 0',
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

// ─── Component ────────────────────────────────────────────────────────────────

export default function DailyDigest({
  opportunities,
  date,
  settingsUrl,
  userEmail,
}: DailyDigestProps) {
  const count = opportunities.length

  return (
    <Html lang="en">
      <Head />
      <Preview>
        {`${count} new government contract ${count === 1 ? 'opportunity' : 'opportunities'} matching your profile`}
      </Preview>
      <Body style={bodyStyle}>
        <Container style={containerStyle}>
          {/* Header */}
          <Section style={headerStyle}>
            <Text style={logoStyle}>fedscout</Text>
            <Text style={dateStyle}>{date}</Text>
          </Section>

          {/* Body */}
          <Section style={contentStyle}>
            <Text style={introStyle}>
              Here {count === 1 ? 'is' : 'are'} your {count} new matching{' '}
              {count === 1 ? 'opportunity' : 'opportunities'} for {date}:
            </Text>

            {opportunities.map((opp, i) => (
              <Section key={i}>
                {/* Title */}
                <Link href={opp.sam_url} style={titleStyle}>
                  {opp.title}
                </Link>

                {/* Score */}
                {opp.score !== undefined && opp.scoreLabel && (
                  <Text style={{
                    fontSize: '12px',
                    color: opp.score >= 80 ? '#16a34a' : opp.score >= 60 ? '#d97706' : '#9ca3af',
                    margin: '4px 0 0',
                  }}>
                    {opp.score}/100 · {opp.scoreLabel}
                  </Text>
                )}

                {/* Meta */}
                <Text style={metaStyle}>
                  {opp.agency}&nbsp;&nbsp;·&nbsp;&nbsp;
                  Est. {formatValue(opp.estimated_value_min, opp.estimated_value_max)}&nbsp;&nbsp;·&nbsp;&nbsp;
                  Due {formatDeadline(opp.response_deadline)}
                </Text>

                {/* Brief first bullet */}
                {opp.brief && (() => {
                  const firstLine = opp.brief.split('\n').find(l => l.trim())
                  return firstLine ? (
                    <Text style={{ ...excerptStyle, fontStyle: 'italic' }}>
                      · {firstLine.replace(/^[\d.\-*•]\s*/, '').trim()}
                    </Text>
                  ) : null
                })()}

                {/* Excerpt (only if no brief) */}
                {!opp.brief && opp.description && (
                  <Text style={excerptStyle}>{excerpt(opp.description)}</Text>
                )}

                {i < opportunities.length - 1 && <Hr style={hrStyle} />}
              </Section>
            ))}
          </Section>

          {/* Dashboard CTA */}
          <Section style={{ textAlign: 'center', padding: '0 36px 24px' }}>
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
              View all your matches →
            </Link>
          </Section>

          {/* Footer */}
          <Section style={footerStyle}>
            <Text style={footerTextStyle}>
              You&apos;re receiving this because you have an active fedscout subscription.{' '}
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
