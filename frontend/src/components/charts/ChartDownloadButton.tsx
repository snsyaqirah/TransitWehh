import { useState } from 'react'
import { Download } from 'lucide-react'
import { toPng } from 'html-to-image'
import { Button } from '@/components/ui/button'

interface ChartDownloadButtonProps {
  targetRef: React.RefObject<HTMLDivElement | null>
  filename?: string
}

export function ChartDownloadButton({ targetRef, filename = 'chart.png' }: ChartDownloadButtonProps) {
  const [downloading, setDownloading] = useState(false)

  const handleDownload = async () => {
    if (!targetRef.current) return
    setDownloading(true)
    try {
      const dataUrl = await toPng(targetRef.current, {
        backgroundColor: 'transparent',
        pixelRatio: 2,
      })
      const link = document.createElement('a')
      link.download = filename
      link.href = dataUrl
      link.click()
    } catch (err) {
      console.error('Chart download failed:', err)
    } finally {
      setDownloading(false)
    }
  }

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={handleDownload}
      disabled={downloading}
      className="gap-1.5 text-muted-foreground hover:text-foreground"
      title="Download chart as PNG"
    >
      <Download size={14} />
      <span className="text-xs">{downloading ? 'Saving…' : 'PNG'}</span>
    </Button>
  )
}
