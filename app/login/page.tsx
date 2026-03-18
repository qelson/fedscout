import type { Metadata } from 'next'
import LoginForm from './LoginForm'

export const metadata: Metadata = {
  title: 'Sign In — FedScout',
}

export default function LoginPage() {
  return <LoginForm />
}
