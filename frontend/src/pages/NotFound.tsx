import { Link } from 'react-router-dom'
import { Train, ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'

export function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
      <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-5">
        <Train size={28} className="text-muted-foreground" />
      </div>
      <h1 className="text-4xl font-bold mb-2">404</h1>
      <p className="text-lg font-medium text-foreground mb-1">Page not found</p>
      <p className="text-sm text-muted-foreground mb-6 max-w-xs">
        The page you are looking for doesn't exist or has been moved.
      </p>
      <Button asChild variant="default">
        <Link to="/" className="flex items-center gap-2">
          <ArrowLeft size={15} />
          Back to Overview
        </Link>
      </Button>
    </div>
  )
}
