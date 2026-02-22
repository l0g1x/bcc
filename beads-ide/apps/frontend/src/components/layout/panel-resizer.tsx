import { useState } from 'react'
import { PanelResizeHandle } from 'react-resizable-panels'
import type { CSSProperties } from 'react'

interface PanelResizerProps {
  orientation?: 'horizontal' | 'vertical'
  className?: string
}

export function PanelResizer({ orientation = 'horizontal', className }: PanelResizerProps) {
  const [isHovered, setIsHovered] = useState(false)

  const baseStyle: CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: isHovered ? '#4a4a4a' : 'transparent',
    transition: 'background-color 0.15s ease',
  }

  const style: CSSProperties = orientation === 'horizontal'
    ? { ...baseStyle, width: '4px', cursor: 'col-resize' }
    : { ...baseStyle, height: '4px', cursor: 'row-resize' }

  return (
    <PanelResizeHandle
      className={className}
      style={style}
      onDragging={(isDragging) => {
        if (isDragging) setIsHovered(true)
      }}
    >
      <div
        style={{ width: '100%', height: '100%' }}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      />
    </PanelResizeHandle>
  )
}
