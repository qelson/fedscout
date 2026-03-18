import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Get Started — FedScout',
}

export default function QuizLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
