interface PageMockPreviewProps {
  html: string
  className?: string
}

export function PageMockPreview({ html, className = '' }: PageMockPreviewProps) {
  return (
    <div
      className={`border rounded-lg bg-white ${className}`}
      style={{ transformOrigin: 'top left' }}
    >
      <div
        className="w-full"
        dangerouslySetInnerHTML={{ __html: html }}
      />
    </div>
  )
}
