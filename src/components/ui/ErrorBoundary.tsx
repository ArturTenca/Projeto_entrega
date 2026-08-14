import { Component, type ErrorInfo, type ReactNode } from 'react'
import { DatabaseUnavailable } from '@/components/ui/DatabaseUnavailable'

interface ErrorBoundaryProps {
  children: ReactNode
}

interface ErrorBoundaryState {
  hasError: boolean
}

export class ErrorBoundary extends Component<
  ErrorBoundaryProps,
  ErrorBoundaryState
> {
  state: ErrorBoundaryState = { hasError: false }

  static getDerivedStateFromError(): ErrorBoundaryState {
    return { hasError: true }
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('Erro inesperado na aplicação', error, info.componentStack)
  }

  render() {
    if (this.state.hasError) {
      return (
        <DatabaseUnavailable
          title="Não foi possível carregar o aplicativo"
          description="Ocorreu um erro inesperado. Se o banco de dados estiver pausado, restaure o projeto e tente novamente."
          onRetry={() => {
            window.location.reload()
          }}
        />
      )
    }

    return this.props.children
  }
}
