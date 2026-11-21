import React, { useEffect, useRef, useState } from 'react'
import style from './style.module.css'
import {
	type PopoverPosition,
	POPOVER_CONFIG,
	createPositionStyle,
	determinePosition,
	isInsideFixedContainer
} from './position'
import { setupObservers } from './observers'
import { createAnimationKeyframes, measurePopoverSize } from './animation'

function PopoverContent({
	open,
	children,
	position,
	popoverRef,
	onAnimationComplete,
	contentRef,
	openSizeRef,
	isMeasuring,
	matchTriggerWidth
}: {
	open: boolean
	children: React.ReactNode
	position: PopoverPosition
	popoverRef: React.RefObject<HTMLDivElement | null>
	onAnimationComplete?: () => void
	contentRef?: React.RefObject<HTMLDivElement | null>
	openSizeRef: React.RefObject<{ width: number; height: number } | null>
	isMeasuring: boolean
	matchTriggerWidth: boolean
}) {
	const internalContentRef = useRef<HTMLDivElement>(null)
	const actualContentRef = contentRef || internalContentRef
	const animationRef = useRef<Animation | null>(null)
	const previousOpenRef = useRef<boolean>(open)

	useEffect(() => {
		// Nothing to do unless `open` really changed, and not while measuring
		if (previousOpenRef.current === open || isMeasuring) return
		previousOpenRef.current = open

		if (!popoverRef.current || !actualContentRef.current) return

		if (animationRef.current) {
			animationRef.current.cancel()
			animationRef.current = null
		}

		let currentSize = { width: 0, height: 0 }

		if (open) {
			// Grow from 0 to the height measured before it was shown
			currentSize = openSizeRef.current || { width: 0, height: 0 }

			popoverRef.current.style.height = '0px'
			popoverRef.current.style.overflow = 'hidden'

			const keyframes = createAnimationKeyframes(
				position,
				currentSize.height,
				POPOVER_CONFIG.animationOffset.medium,
				true,
				matchTriggerWidth
			)

			animationRef.current = popoverRef.current.animate(keyframes, POPOVER_CONFIG.animation)

			// Once open, drop the fill so the popover can resize with its content
			animationRef.current.onfinish = () => {
				if (popoverRef.current && open) {
					animationRef.current?.cancel()
					popoverRef.current.style.height = 'auto'
					popoverRef.current.style.overflow = 'visible'
				}
			}
		} else {
			currentSize = openSizeRef.current || { width: 0, height: 0 }

			const keyframes = createAnimationKeyframes(
				position,
				currentSize.height,
				POPOVER_CONFIG.animationOffset.small,
				false,
				matchTriggerWidth
			)

			animationRef.current = popoverRef.current.animate(keyframes, POPOVER_CONFIG.animation)

			animationRef.current.onfinish = () => {
				if (onAnimationComplete) onAnimationComplete()
			}
		}
	}, [open, position, onAnimationComplete, isMeasuring])

	useEffect(() => {
		return () => {
			if (animationRef.current) animationRef.current.cancel()
		}
	}, [])

	return (
		<div ref={actualContentRef} className={`rb-popover-content ${style.popoverContent}`}>
			{children}
		</div>
	)
}

export function Popover({
	children,
	content,
	above,
	below,
	left,
	right,
	smartPositions,
	defaultOpen = false,
	noCloseOnClickOutside = false,
	matchTriggerWidth = false,
	style: customStyle,
	onOpenChange
}: {
	children?: React.ReactElement
	content: React.ReactNode | ((closePopover: () => void) => React.ReactNode)
	above?: boolean
	below?: boolean
	left?: boolean
	right?: boolean
	smartPositions?: PopoverPosition[]
	defaultOpen?: boolean
	noCloseOnClickOutside?: boolean
	matchTriggerWidth?: boolean
	style?: React.CSSProperties
	onOpenChange?: (open: boolean) => void
}) {
	useEffect(() => {
		const directionProps = [above, below, left, right].filter(Boolean)
		if (directionProps.length > 1) {
			console.warn(
				'Popover: Multiple direction props detected. Only one of "above", "below", "left", or "right" should be set. ' +
					'Precedence: right > left > below > above'
			)
		}
	}, [above, below, left, right])

	const [isOpen, setIsOpen] = useState(false)
	const [isVisible, setIsVisible] = useState(false)
	const [isMeasuring, setIsMeasuring] = useState(false)
	const onOpenChangeRef = useRef(onOpenChange)
	onOpenChangeRef.current = onOpenChange

	useEffect(() => {
		onOpenChangeRef.current?.(isVisible)
	}, [isVisible])
	const [positionStyle, setPositionStyle] = useState<React.CSSProperties>({})
	const [currentPosition, setCurrentPosition] = useState<PopoverPosition>('below')
	const childrenRef = useRef<HTMLSpanElement>(null)
	const popoverRef = useRef<HTMLDivElement>(null)
	const popoverContentRef = useRef<HTMLDivElement>(null)
	const openSizeRef = useRef<{ width: number; height: number } | null>(null)

	const measureSize = () =>
		popoverRef.current ? measurePopoverSize(popoverRef.current) : null

	const calculatePosition = (size: { width: number; height: number } | null) => {
		if (!childrenRef.current) return {}
		const rect = childrenRef.current.getBoundingClientRect()
		// No size at all means the trigger isn't rendered yet
		if (rect.width === 0 && rect.height === 0 && rect.top === 0 && rect.left === 0)
			return {}

		const isFixed = isInsideFixedContainer(childrenRef.current)
		const scrollTop = isFixed ? 0 : window.scrollY
		const scrollLeft = isFixed ? 0 : window.scrollX

		const position = determinePosition(
			rect, size, scrollTop, isFixed,
			above, below, left, right, smartPositions
		)
		setCurrentPosition(position)

		const { viewportPadding: padding, triggerSpacing: spacing } = POPOVER_CONFIG
		return createPositionStyle(position, rect, spacing, padding, scrollTop, scrollLeft, isFixed, size || undefined, matchTriggerWidth)
	}

	const openPopover = async () => {
		if (!popoverRef.current || isVisible) return

		let finalSize: { width: number; height: number } | null = null
		let finalPosition: React.CSSProperties = {}

		try {
			// Measure twice: once at its natural size, then again in roughly the
			// right spot, so viewport limits are already applied when it animates
			const naturalSize = measureSize()
			if (!naturalSize) return

			const estimatedPosition = calculatePosition(naturalSize)
			if (Object.keys(estimatedPosition).length === 0) return

			setIsMeasuring(true)

			Object.assign(popoverRef.current.style, {
				...(estimatedPosition as React.CSSProperties),
				width: 'auto',
				height: 'auto',
				overflow: 'visible',
				visibility: 'hidden',
				opacity: '0',
				contain: 'layout style',
				animation: 'none',
				transition: 'none'
			})

			popoverRef.current.showPopover()

			await new Promise((resolve) => requestAnimationFrame(resolve))
			// It may have unmounted during that frame
			if (!popoverRef.current) return
			const constrainedRect = popoverRef.current.getBoundingClientRect()
			finalSize =
				constrainedRect.width > 0 && constrainedRect.height > 0
					? { width: constrainedRect.width, height: constrainedRect.height }
					: naturalSize

			finalPosition = calculatePosition(finalSize)
			if (Object.keys(finalPosition).length === 0) {
				finalPosition = estimatedPosition
			}

			// Move it into place while still hidden
			Object.assign(popoverRef.current.style, {
				...(finalPosition as React.CSSProperties),
				contain: 'layout style'
			})

			popoverRef.current.hidePopover()
		} catch {
			finalSize = measureSize()
			finalPosition = calculatePosition(finalSize)
		}

		openSizeRef.current = finalSize
		setIsOpen(false)
		setIsVisible(false)
		setIsMeasuring(false)

		await new Promise((resolve) => requestAnimationFrame(resolve))
		if (!popoverRef.current) return

		// Start collapsed, then show it and let the animation open it up
		Object.assign(popoverRef.current.style, {
			...(finalPosition as React.CSSProperties),
			height: '0px',
			opacity: '0',
			overflow: 'hidden'
		})

		setIsVisible(true)
		setIsOpen(true)
		popoverRef.current.showPopover()
		setPositionStyle(finalPosition)
	}

	const closePopover = () => {
		if (!isVisible) return
		setIsOpen(false)
	}

	const handleCloseAnimationComplete = () => {
		if (popoverRef.current) popoverRef.current.hidePopover()
		setIsVisible(false)
		setPositionStyle({})
	}

	const togglePopover = () => {
		if (isMeasuring) return
		if (isVisible) {
			closePopover()
		} else {
			void openPopover()
		}
	}

	useEffect(() => {
		if (!isVisible || !childrenRef.current || !popoverRef.current) return

		const updatePosition = () => {
			if (!popoverRef.current || !childrenRef.current) return

			// Measure its current natural size
			popoverRef.current.style.height = 'auto'
			popoverRef.current.style.maxWidth = 'none'
			popoverRef.current.style.maxHeight = 'none'
			popoverRef.current.style.overflow = 'visible'
			void popoverRef.current.offsetHeight

			const rect = popoverRef.current.getBoundingClientRect()
			const size =
				rect.width > 0 && rect.height > 0
					? { width: rect.width, height: rect.height }
					: null
			if (!size) return

			const triggerRect = childrenRef.current.getBoundingClientRect()
			const isFixed = isInsideFixedContainer(childrenRef.current)
			let scrollTop = 0, scrollLeft = 0

			if (!isFixed) {
				scrollTop = window.scrollY
				scrollLeft = window.scrollX
			}

			const { viewportPadding: padding, triggerSpacing: spacing } = POPOVER_CONFIG

			// Keep the side picked when it opened, so it doesn't flip around while
			// you scroll or resize
			const positionStyle = createPositionStyle(
				currentPosition, triggerRect, spacing, padding,
				scrollTop, scrollLeft, isFixed, size, matchTriggerWidth
			)
			setPositionStyle(positionStyle)

			popoverRef.current.style.height = 'auto'
			popoverRef.current.style.overflow = 'visible'
		}

		return setupObservers(childrenRef.current, popoverContentRef.current, updatePosition)
	}, [isVisible])

	useEffect(() => {
		if (!isVisible || noCloseOnClickOutside) return

		const handleClickOutside = (e: MouseEvent) => {
			const target = e.target as Node
			const outsidePopover = popoverRef.current && !popoverRef.current.contains(target)
			const outsideTrigger = childrenRef.current && !childrenRef.current.contains(target)
			if (outsidePopover && outsideTrigger) closePopover()
		}

		// Wait a tick, or the click that opened it would close it again
		const timer = setTimeout(
			() => document.addEventListener('mousedown', handleClickOutside),
			0
		)
		return () => {
			clearTimeout(timer)
			document.removeEventListener('mousedown', handleClickOutside)
		}
	}, [isVisible, noCloseOnClickOutside])

	useEffect(() => {
		if (defaultOpen && !isVisible && childrenRef.current) {
			const frameId = requestAnimationFrame(openPopover)
			return () => cancelAnimationFrame(frameId)
		}
		// Mount only
	}, [])

	const contentElement =
		typeof content === 'function' ? content(closePopover) : content
	const triggerElement = children
		? React.cloneElement(
				children as React.ReactElement<{
					onClick?: (e: React.MouseEvent) => void
					ref?: React.Ref<HTMLSpanElement>
				}>,
				{
					ref: childrenRef,
					onClick: (e: React.MouseEvent) => {
						const originalOnClick = (
							children as React.ReactElement<{
								onClick?: (e: React.MouseEvent) => void
							}>
						).props.onClick
						originalOnClick?.(e)
						togglePopover()
					}
				}
			)
		: null

	return (
		<>
			{triggerElement}
			<div
				ref={popoverRef}
				popover="manual"
				className={`rb-popover ${style.popover}`}
				style={{ ...positionStyle, ...customStyle } as React.CSSProperties}
			>
				<PopoverContent
					position={currentPosition}
					open={isOpen}
					popoverRef={popoverRef}
					contentRef={popoverContentRef}
					openSizeRef={openSizeRef}
					isMeasuring={isMeasuring}
					matchTriggerWidth={matchTriggerWidth}
					onAnimationComplete={!isOpen ? handleCloseAnimationComplete : undefined}
				>
					{contentElement}
				</PopoverContent>
			</div>
		</>
	)
}
