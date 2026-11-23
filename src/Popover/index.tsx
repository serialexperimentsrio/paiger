import React, { useEffect, useId, useRef, useState } from 'react'
import style from './style.module.css'
import {
	type Placement,
	POPOVER_CONFIG,
	createPositionStyle,
	determinePosition,
	isInsideFixedContainer
} from './position'
import { setupObservers } from './observers'
import { createAnimationKeyframes, measurePopoverSize } from './animation'
import { duration, focusables, refOf, setRef } from '../shared'

// Open popovers, oldest first, so Escape closes only the newest
const openPopovers: object[] = []

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
	position: Placement
	popoverRef: React.RefObject<HTMLDivElement | null>
	onAnimationComplete?: () => void
	contentRef: React.RefObject<HTMLDivElement | null>
	openSizeRef: React.RefObject<{ width: number; height: number } | null>
	isMeasuring: boolean
	matchTriggerWidth: boolean
}) {
	const animationRef = useRef<Animation | null>(null)
	const previousOpenRef = useRef<boolean>(open)

	useEffect(() => {
		// Nothing to do unless `open` really changed, and not while measuring
		if (previousOpenRef.current === open || isMeasuring) return
		previousOpenRef.current = open

		if (!popoverRef.current || !contentRef.current) return

		if (animationRef.current) {
			animationRef.current.cancel()
			animationRef.current = null
		}

		// Grows from 0 to the height measured before it was shown, and back
		const height = openSizeRef.current?.height ?? 0
		const { medium, small } = POPOVER_CONFIG.animationOffset
		const keyframes = createAnimationKeyframes(position, height, open ? medium : small, open, matchTriggerWidth)

		if (open) {
			popoverRef.current.style.height = '0px'
			popoverRef.current.style.overflow = 'hidden'
		}
		const animation = popoverRef.current.animate(keyframes, {
			duration: duration('--pg-duration-popover', 300),
			easing: POPOVER_CONFIG.easing,
			fill: 'forwards'
		})
		animationRef.current = animation

		animation.onfinish = () => {
			if (!open) return onAnimationComplete?.()
			// Once open, drop the fill so the popover can resize with its content
			if (!popoverRef.current) return
			animation.cancel()
			popoverRef.current.style.height = 'auto'
			popoverRef.current.style.overflow = 'visible'
		}
	}, [open, position, onAnimationComplete, isMeasuring])

	useEffect(() => {
		return () => {
			if (animationRef.current) animationRef.current.cancel()
		}
	}, [])

	return (
		<div ref={contentRef} className={`pg-popover-content ${style.popoverContent}`}>
			{children}
		</div>
	)
}

export interface PopoverProps {
	// The trigger: clicking it opens and closes the popover. It needs to accept a ref.
	children?: React.ReactElement
	content: React.ReactNode | ((close: () => void) => React.ReactNode)
	// Always open on this side. Without it, the side with the most room wins.
	placement?: Placement
	// The sides to choose from when `placement` isn't set, in order of preference
	autoPlacements?: Placement[]
	defaultOpen?: boolean
	// Controlled: open while true. Clicks, Escape and the close function then
	// only ask for a change through onOpenChange.
	open?: boolean
	// Clicking or tabbing away closes it. Escape always does.
	closeOnClickOutside?: boolean
	matchTriggerWidth?: boolean
	style?: React.CSSProperties
	onOpenChange?: (open: boolean) => void
}

export function Popover({
	children,
	content,
	placement,
	autoPlacements,
	defaultOpen = false,
	open,
	closeOnClickOutside = true,
	matchTriggerWidth = false,
	style: customStyle,
	onOpenChange
}: PopoverProps) {
	const id = useId()
	const [isOpen, setIsOpen] = useState(false)
	const [isVisible, setIsVisible] = useState(false)
	const [isMeasuring, setIsMeasuring] = useState(false)
	const onOpenChangeRef = useRef(onOpenChange)
	onOpenChangeRef.current = onOpenChange

	const controlled = open !== undefined
	// The content only exists from the moment it starts opening until it has
	// closed. Opening needs it in the DOM to measure, so it mounts first.
	const [mounted, setMounted] = useState(false)
	const openOnMount = useRef(false)

	// Uncontrolled, report real changes, not the initial closed state.
	// Controlled, onOpenChange is only for asking (see setOpen).
	const reportedOpen = useRef(isVisible)
	useEffect(() => {
		if (reportedOpen.current === isVisible) return
		reportedOpen.current = isVisible
		if (!controlled) onOpenChangeRef.current?.(isVisible)
	}, [isVisible])
	const [positionStyle, setPositionStyle] = useState<React.CSSProperties>({})
	const [currentPosition, setCurrentPosition] = useState<Placement>('bottom')
	const childrenRef = useRef<HTMLElement | null>(null)
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

		const position = determinePosition(rect, size, scrollTop, isFixed, placement, autoPlacements)
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

		// Keyboard users land inside: on the first focusable thing (a menu marks
		// its current item that way)
		focusables(popoverRef.current)[0]?.focus({ preventScroll: true })
	}

	const closePopover = () => {
		if (!isVisible) return
		setIsOpen(false)
		// Focus was inside, which is about to disappear, so hand it back
		if (popoverRef.current?.contains(document.activeElement)) {
			childrenRef.current?.focus({ preventScroll: true })
		}
	}

	const handleCloseAnimationComplete = () => {
		if (popoverRef.current) popoverRef.current.hidePopover()
		setIsVisible(false)
		setPositionStyle({})
		setMounted(false)
	}

	const startOpening = () => {
		if (mounted) return void openPopover()
		openOnMount.current = true
		setMounted(true)
	}

	useEffect(() => {
		if (!mounted || !openOnMount.current) return
		openOnMount.current = false
		void openPopover()
	}, [mounted])

	// Every open and close from inside goes through here
	const setOpen = (next: boolean) => {
		if (controlled) return onOpenChangeRef.current?.(next)
		if (next) startOpening()
		else closePopover()
	}

	const togglePopover = () => {
		if (isMeasuring) return
		setOpen(!isVisible)
	}

	// Controlled: follow the prop
	useEffect(() => {
		if (!controlled) return
		if (open && !isVisible && !isMeasuring) startOpening()
		else if (!open && isVisible) closePopover()
	}, [open])

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
			const scrollTop = isFixed ? 0 : window.scrollY
			const scrollLeft = isFixed ? 0 : window.scrollX

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

	// Escape closes it from anywhere while it's open. Only the newest open
	// popover takes it, and it marks the event handled so a modal underneath
	// stays open. Capture, so this runs before the modal's listener.
	useEffect(() => {
		if (!isVisible) return
		const entry = {}
		openPopovers.push(entry)
		const onKeyDown = (e: KeyboardEvent) => {
			if (e.key !== 'Escape' || e.defaultPrevented || openPopovers[openPopovers.length - 1] !== entry) return
			e.preventDefault()
			setOpen(false)
		}
		document.addEventListener('keydown', onKeyDown, true)
		return () => {
			document.removeEventListener('keydown', onKeyDown, true)
			openPopovers.splice(openPopovers.indexOf(entry), 1)
		}
	}, [isVisible])

	useEffect(() => {
		if (!isVisible || !closeOnClickOutside) return

		const handleClickOutside = (e: MouseEvent) => {
			const target = e.target as Node
			const outsidePopover = popoverRef.current && !popoverRef.current.contains(target)
			const outsideTrigger = childrenRef.current && !childrenRef.current.contains(target)
			if (outsidePopover && outsideTrigger) setOpen(false)
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
	}, [isVisible, closeOnClickOutside])

	// Tabbing out of it counts as leaving, the same as clicking outside
	const handleBlur = (e: React.FocusEvent) => {
		const to = e.relatedTarget as Node | null
		if (!closeOnClickOutside || !to) return
		if (!popoverRef.current?.contains(to) && !childrenRef.current?.contains(to)) setOpen(false)
	}

	useEffect(() => {
		// Controlled ones open from the effect above
		if (!controlled && defaultOpen && !isVisible && childrenRef.current) {
			const frameId = requestAnimationFrame(startOpening)
			return () => cancelAnimationFrame(frameId)
		}
		// Mount only
	}, [])

	const contentElement = !mounted ? null : typeof content === 'function' ? content(() => setOpen(false)) : content

	const trigger = children as React.ReactElement<{ onClick?: (e: React.MouseEvent) => void }> | undefined
	const triggerElement = trigger
		? React.cloneElement(trigger as React.ReactElement<Record<string, unknown>>, {
				// Keep the trigger's own ref working alongside ours
				ref: (node: HTMLElement | null) => {
					childrenRef.current = node
					setRef(refOf<HTMLElement>(trigger), node)
				},
				'aria-expanded': isVisible,
				'aria-controls': id,
				onClick: (e: React.MouseEvent) => {
					trigger.props.onClick?.(e)
					togglePopover()
				}
			})
		: null

	return (
		<>
			{triggerElement}
			<div
				ref={popoverRef}
				id={id}
				popover="manual"
				className={`pg-popover ${style.popover}`}
				style={{ ...positionStyle, ...customStyle } as React.CSSProperties}
				onBlur={handleBlur}
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
