interface PageMockPreviewProps {
  html: string
  className?: string
}

export function PageMockPreview({ html, className = '' }: PageMockPreviewProps) {
  return (
    <iframe
      srcDoc={html}
      className={`w-full h-full border-0 ${className}`}
      sandbox="allow-same-origin"
      style={{ pointerEvents: 'none' }}
      title="Page Mock Preview"
    />
  )
}
