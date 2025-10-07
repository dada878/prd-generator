import { Message } from '@/lib/types'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'

interface ChatMessageProps {
  message: Message
  onOptionClick?: (option: string) => void
}

export function ChatMessage({ message, onOptionClick }: ChatMessageProps) {
  return (
    <div
      className={`flex ${
        message.role === 'user' ? 'justify-end' : 'justify-start'
      } mb-4`}
    >
      <Card
        className={`max-w-[80%] p-4 ${
          message.role === 'user'
            ? 'bg-primary text-primary-foreground'
            : 'bg-muted'
        }`}
      >
        <p className="whitespace-pre-wrap">{message.content}</p>
        {message.options && message.options.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-3">
            {message.options.map((option, index) => (
              <Button
                key={index}
                variant="outline"
                size="sm"
                onClick={() => onOptionClick?.(option)}
                className="text-sm"
              >
                {option}
              </Button>
            ))}
          </div>
        )}
      </Card>
    </div>
  )
}
