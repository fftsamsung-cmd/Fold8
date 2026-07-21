import React, { useEffect, useRef, useState, useCallback, type ReactNode } from 'react'

/* Adapted from the reference project's ImageSwiper (skill 05 — Durability).
   Same drag/auto-swipe card-stack physics, generalized from a CSV of image
   URLs to arbitrary ReactNode cards so it can drive non-photo content
   (e.g. the labeled DeviceMock panes, which have no photography). */
interface SwipeStackProps {
  cards: ReactNode[]
  cardWidth?: number
  cardHeight?: number
  className?: string
}

export const SwipeStack: React.FC<SwipeStackProps> = ({
  cards,
  cardWidth = 256,
  cardHeight = 352,
  className = '',
}) => {
  const cardStackRef = useRef<HTMLDivElement>(null)
  const isSwiping = useRef(false)
  const startX = useRef(0)
  const currentX = useRef(0)
  const animationFrameId = useRef<number | null>(null)

  const [cardOrder, setCardOrder] = useState<number[]>(() => Array.from({ length: cards.length }, (_, i) => i))

  const getDurationFromCSS = useCallback((variableName: string, element?: HTMLElement | null): number => {
    const targetElement = element || document.documentElement
    const value = getComputedStyle(targetElement)?.getPropertyValue(variableName)?.trim()
    if (!value) return 0
    if (value.endsWith('ms')) return parseFloat(value)
    if (value.endsWith('s')) return parseFloat(value) * 1000
    return parseFloat(value) || 0
  }, [])

  const getCards = useCallback((): HTMLElement[] => {
    if (!cardStackRef.current) return []
    return [...cardStackRef.current.querySelectorAll('.swipe-card')] as HTMLElement[]
  }, [])

  const getActiveCard = useCallback((): HTMLElement | null => {
    const stackCards = getCards()
    return stackCards[0] || null
  }, [getCards])

  const updatePositions = useCallback(() => {
    const stackCards = getCards()
    stackCards.forEach((card, i) => {
      card.style.setProperty('--i', (i + 1).toString())
      card.style.setProperty('--swipe-x', '0px')
      card.style.setProperty('--swipe-rotate', '0deg')
      card.style.opacity = '1'
    })
  }, [getCards])

  const applySwipeStyles = useCallback(
    (deltaX: number) => {
      const card = getActiveCard()
      if (!card) return
      card.style.setProperty('--swipe-x', `${deltaX}px`)
      card.style.setProperty('--swipe-rotate', `${deltaX * 0.2}deg`)
      card.style.opacity = (1 - Math.min(Math.abs(deltaX) / 100, 1) * 0.75).toString()
    },
    [getActiveCard]
  )

  const handleStart = useCallback(
    (clientX: number) => {
      if (isSwiping.current) return
      isSwiping.current = true
      startX.current = clientX
      currentX.current = clientX
      const card = getActiveCard()
      if (card) card.style.transition = 'none'
    },
    [getActiveCard]
  )

  const handleEnd = useCallback(() => {
    if (!isSwiping.current) return
    if (animationFrameId.current) {
      cancelAnimationFrame(animationFrameId.current)
      animationFrameId.current = null
    }

    const deltaX = currentX.current - startX.current
    const threshold = 50
    const duration = getDurationFromCSS('--card-swap-duration', cardStackRef.current)
    const card = getActiveCard()

    if (card) {
      card.style.transition = `transform ${duration}ms ease, opacity ${duration}ms ease`

      if (Math.abs(deltaX) > threshold) {
        const direction = Math.sign(deltaX)
        card.style.setProperty('--swipe-x', `${direction * 300}px`)
        card.style.setProperty('--swipe-rotate', `${direction * 20}deg`)

        setTimeout(() => {
          if (getActiveCard() === card) {
            card.style.setProperty('--swipe-rotate', `${-direction * 20}deg`)
          }
        }, duration * 0.5)

        setTimeout(() => {
          setCardOrder((prev) => {
            if (prev.length === 0) return []
            return [...prev.slice(1), prev[0]]
          })
        }, duration)
      } else {
        applySwipeStyles(0)
      }
    }

    isSwiping.current = false
    startX.current = 0
    currentX.current = 0
  }, [getDurationFromCSS, getActiveCard, applySwipeStyles])

  const handleMove = useCallback(
    (clientX: number) => {
      if (!isSwiping.current) return
      if (animationFrameId.current) {
        cancelAnimationFrame(animationFrameId.current)
      }
      animationFrameId.current = requestAnimationFrame(() => {
        currentX.current = clientX
        const deltaX = currentX.current - startX.current
        applySwipeStyles(deltaX)

        if (Math.abs(deltaX) > 50) {
          handleEnd()
        }
      })
    },
    [applySwipeStyles, handleEnd]
  )

  useEffect(() => {
    const cardStackElement = cardStackRef.current
    if (!cardStackElement) return

    const handlePointerDown = (e: PointerEvent) => handleStart(e.clientX)
    const handlePointerMove = (e: PointerEvent) => handleMove(e.clientX)
    const handlePointerUp = () => handleEnd()

    cardStackElement.addEventListener('pointerdown', handlePointerDown)
    cardStackElement.addEventListener('pointermove', handlePointerMove)
    cardStackElement.addEventListener('pointerup', handlePointerUp)

    return () => {
      cardStackElement.removeEventListener('pointerdown', handlePointerDown)
      cardStackElement.removeEventListener('pointermove', handlePointerMove)
      cardStackElement.removeEventListener('pointerup', handlePointerUp)
      if (animationFrameId.current) cancelAnimationFrame(animationFrameId.current)
    }
  }, [handleStart, handleMove, handleEnd])

  useEffect(() => {
    updatePositions()
  }, [cardOrder, updatePositions])

  const autoSwipeDirection = useRef(1)
  const isHovering = useRef(false)

  const autoSwipe = useCallback(() => {
    if (isSwiping.current || isHovering.current) return
    const duration = getDurationFromCSS('--card-swap-duration', cardStackRef.current)
    const card = getActiveCard()
    if (!card) return

    const direction = autoSwipeDirection.current
    autoSwipeDirection.current *= -1

    card.style.transition = `transform ${duration}ms ease, opacity ${duration}ms ease`
    card.style.setProperty('--swipe-x', `${direction * 300}px`)
    card.style.setProperty('--swipe-rotate', `${direction * 20}deg`)

    setTimeout(() => {
      if (getActiveCard() === card) {
        card.style.setProperty('--swipe-rotate', `${-direction * 20}deg`)
      }
    }, duration * 0.5)

    setTimeout(() => {
      setCardOrder((prev) => {
        if (prev.length === 0) return []
        return [...prev.slice(1), prev[0]]
      })
    }, duration)
  }, [getDurationFromCSS, getActiveCard])

  useEffect(() => {
    if (cards.length <= 1) return
    const interval = setInterval(autoSwipe, 1500)
    return () => clearInterval(interval)
  }, [autoSwipe, cards.length])

  const handleMouseEnter = useCallback(() => {
    isHovering.current = true
  }, [])
  const handleMouseLeave = useCallback(() => {
    isHovering.current = false
  }, [])

  return (
    <div
      className={`swipe-stack ${className}`}
      ref={cardStackRef}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      style={
        {
          width: cardWidth + 32,
          height: cardHeight + 32,
          touchAction: 'none',
          transformStyle: 'preserve-3d',
          '--card-perspective': '700px',
          '--card-z-offset': '12px',
          '--card-y-offset': '7px',
          '--card-max-z-index': cards.length.toString(),
          '--card-swap-duration': '0.3s',
        } as React.CSSProperties
      }
    >
      {cardOrder.map((originalIndex, displayIndex) => (
        <div
          key={originalIndex}
          className="swipe-card"
          style={
            {
              '--i': (displayIndex + 1).toString(),
              zIndex: cards.length - displayIndex,
              width: cardWidth,
              height: cardHeight,
              transform: `perspective(var(--card-perspective))
                         translateZ(calc(-1 * var(--card-z-offset) * var(--i)))
                         translateY(calc(var(--card-y-offset) * var(--i)))
                         translateX(var(--swipe-x, 0px))
                         rotateY(var(--swipe-rotate, 0deg))`,
            } as React.CSSProperties
          }
        >
          {cards[originalIndex]}
        </div>
      ))}
    </div>
  )
}
