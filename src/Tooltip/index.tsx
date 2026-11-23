import React, { useEffect, useId, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import type { Placement } from '../Popover/position'
import { duration, refOf, setRef } from '../shared'
import style from './style.module.css'

type ChildProps = {
	onPointerEnter?: React.PointerEventHandler
	onPointerLeave?: React.PointerEventHandler
	onFocus?: React.FocusEventHandler
	onBlur?: React.FocusEventHandler
	'aria-describedby'?: string
}

export interface TooltipProps {
	content: React.ReactNode
	// The trigger. It needs to accept a ref.
	children: React.ReactElement<ChildProps>
	placement?: Placement
	// true keeps it shown, false keeps it hidden; leave it out to show on hover
	// and keyboard focus
	open?: boolean
}

// Every tooltip shares one scroll listener, which tells them when scrolling
// starts and when it has stopped. Capture, so scrolling containers count too.
const scrollWatchers = new Set<(scrolling: boolean) => void>()
let settleTimer: ReturnType<typeof setTimeout> | undefined

const onScroll = () => {
	if (settleTimer === undefined) scrollWatchers.forEach((watch) => watch(true))
	clearTimeout(settleTimer)
	settleTimer = setTimeout(() => {
		settleTimer = undefined
		scrollWatchers.forEach((watch) => watch(false))
	}, 150)
}

const watchScroll = (watch: (scrolling: boolean) => void) => {
	if (scrollWatchers.size === 0) window.addEventListener('scroll', onScroll, { capture: true, passive: true })
	scrollWatchers.add(watch)
	return () => {
		scrollWatchers.delete(watch)
		if (scrollWatchers.size > 0) return
		window.removeEventListener('scroll', onScroll, { capture: true })
		clearTimeout(settleTimer)
		settleTimer = undefined
	}
}

export function Tooltip({ content, children, placement = 'bottom', open }: TooltipProps) {
	// Hovered, or focused from the keyboard
	const [engaged, setEngaged] = useState(false)
	const [visible, setVisible] = useState(false)
	const shouldShow = open ?? engaged

	const tooltipId = useId()
	const childRef = useRef<HTMLElement | null>(null)
	const boxRef = useRef<HTMLDivElement>(null)
	const innerRef = useRef<HTMLDivElement>(null)
	const animationRef = useRef<Animation | null>(null)
	const scrollingRef = useRef(false)
	// Under a mouse or pen. Kept by hand, since :hover sticks after a tap.
	const hoveredRef = useRef(false)
	// The portal needs document.body, so nothing renders on the server
	const [mounted, setMounted] = useState(false)
	useEffect(() => setMounted(true), [])
	// The scroll handler is only set up once, so it reads this instead
	const pinnedRef = useRef(open)
	pinnedRef.current = open
	// Bumped after scrolling stops, so a pinned tooltip comes back
	const [settled, setSettled] = useState(0)

	// Hide while the page scrolls (the trigger moves away from the tooltip), and
	// bring it back once scrolling stops if the trigger is still hovered or
	// keyboard-focused
	useEffect(
		() =>
			watchScroll((scrolling) => {
				scrollingRef.current = scrolling
				if (scrolling) {
					animationRef.current?.cancel()
					setEngaged(false)
					setVisible(false)
				} else {
					if (hoveredRef.current || childRef.current?.matches(':focus-visible')) setEngaged(true)
					if (pinnedRef.current) setSettled((n) => n + 1)
				}
			}),
		[]
	)

	useEffect(() => {
		if (shouldShow) setVisible(true)
		if (!childRef.current || !boxRef.current || !innerRef.current) return
		// In the top layer, so it shows above popovers and anything else there
		if (!boxRef.current.matches(':popover-open')) boxRef.current.showPopover()

		const childRect = childRef.current.getBoundingClientRect()
		// Measured every time, since the content can change between showings
		const innerRect = innerRef.current.getBoundingClientRect()
		const size = { width: Math.round(innerRect.width + 4), height: Math.round(innerRect.height + 4) }
		// Fixed in the viewport: no scroll offsets, and it works inside fixed
		// headers. It hides while the page scrolls, so it never has to follow.
		boxRef.current.style.position = 'fixed'
		const viewWidth = document.documentElement.clientWidth
		const viewHeight = document.documentElement.clientHeight

		// The side asked for, or the opposite one when only that one has room
		const opposite = { top: 'bottom', bottom: 'top', left: 'right', right: 'left' } as const
		const room = {
			top: childRect.top,
			bottom: viewHeight - childRect.bottom,
			left: childRect.left,
			right: viewWidth - childRect.right
		}
		const fits = (side: Placement) =>
			room[side] >= (side === 'top' || side === 'bottom' ? size.height : size.width) + 10
		const side = fits(placement) || !fits(opposite[placement]) ? placement : opposite[placement]

		const px = (n: number) => `${Math.round(n)}px`
		const centerX = childRect.left + childRect.width / 2
		const middleY = childRect.top + childRect.height / 2
		// Keeps it 5px inside the edges of the window, but only while the
		// trigger is on screen. A pinned tooltip whose trigger has scrolled away
		// goes with it, instead of sticking to the edge.
		const onScreen =
			childRect.bottom > 0 && childRect.top < viewHeight && childRect.right > 0 && childRect.left < viewWidth
		const clamp = (n: number, room: number, length: number) =>
			onScreen ? Math.max(5, Math.min(n, room - length - 5)) : n
		const clampX = (left: number) => clamp(left, viewWidth, size.width)
		const clampY = (top: number) => clamp(top, viewHeight, size.height)

		// Where it unfolds from (just inside the trigger) and where it ends up
		const from: Keyframe = { opacity: 0, width: 0, height: 0 }
		const to: Keyframe = { opacity: 1, width: px(size.width), height: px(size.height) }

		if (side === 'top') {
			from.top = px(childRect.top + 10)
			from.left = px(centerX)
			to.top = px(childRect.top - size.height - 5)
			to.left = px(clampX(centerX - size.width / 2))
		} else if (side === 'left') {
			from.top = px(middleY)
			from.left = px(childRect.left + 10)
			to.top = px(clampY(middleY - size.height / 2))
			to.left = px(clampX(childRect.left - size.width - 5))
		} else if (side === 'right') {
			from.top = px(middleY)
			from.left = px(childRect.right - 10)
			to.top = px(clampY(middleY - size.height / 2))
			to.left = px(clampX(childRect.right + 5))
		} else {
			from.top = px(childRect.bottom - 10)
			from.left = px(centerX)
			to.top = px(childRect.bottom + 5)
			to.left = px(clampX(centerX - size.width / 2))
		}

		animationRef.current?.cancel()
		const length = duration('--pg-duration-tooltip', 200)
		const animation = boxRef.current.animate(shouldShow ? [from, to] : [to, from], {
			// Hiding takes twice as long as showing
			duration: shouldShow ? length : length * 2,
			easing: 'cubic-bezier(0.16, 1, 0.3, 1)',
			fill: 'forwards'
		})
		animationRef.current = animation

		if (!shouldShow) {
			animation.onfinish = () => setVisible(false)
		}

		return () => {
			animation.cancel()
		}
	}, [shouldShow, placement, settled])

	// Escape hides a hovered or focused tooltip without moving the pointer or
	// focus. A pinned one stays.
	useEffect(() => {
		if (!engaged || open !== undefined) return
		const onKeyDown = (e: KeyboardEvent) => {
			if (e.key === 'Escape') setEngaged(false)
		}
		document.addEventListener('keydown', onKeyDown)
		return () => document.removeEventListener('keydown', onKeyDown)
	}, [engaged, open])

	const isHorizontal = placement === 'left' || placement === 'right'
	const rendered = shouldShow || visible
	// Render it whenever it should show, since the effect needs the box to
	// measure and animate
	const tooltipContent =
		rendered &&
		mounted &&
		createPortal(
			<div ref={boxRef} id={tooltipId} role="tooltip" popover="manual" className={`pg-tooltip ${style.tooltip}`}>
				<div ref={innerRef} className={`pg-tooltip-text ${style.tooltipInner} ${isHorizontal ? style.horizontal : style.vertical}`}>
					{content}
				</div>
			</div>,
			document.body
		)

	const own = children.props
	const clone = React.cloneElement(children as React.ReactElement<Record<string, unknown>>, {
		// Only point at the tooltip while it exists
		'aria-describedby': [own['aria-describedby'], rendered && tooltipId].filter(Boolean).join(' ') || undefined,

		// Keep the child's own ref working alongside ours
		ref: (node: HTMLElement | null) => {
			childRef.current = node
			setRef(refOf<HTMLElement>(children), node)
		},

		// Not on touch: a tap would open it with nothing to close it again
		onPointerEnter: (e: React.PointerEvent) => {
			if (e.pointerType !== 'touch') {
				hoveredRef.current = true
				// Mid-scroll, the scroll watcher handles this
				if (!scrollingRef.current) setEngaged(true)
			}
			own.onPointerEnter?.(e)
		},

		onPointerLeave: (e: React.PointerEvent) => {
			hoveredRef.current = false
			setEngaged(false)
			own.onPointerLeave?.(e)
		},

		// Keyboard focus shows it too; a mouse click focusing the trigger doesn't
		onFocus: (e: React.FocusEvent<HTMLElement>) => {
			if (e.currentTarget.matches(':focus-visible')) setEngaged(true)
			own.onFocus?.(e)
		},

		onBlur: (e: React.FocusEvent) => {
			setEngaged(false)
			own.onBlur?.(e)
		}
	})

	return (
		<>
			{tooltipContent}
			{clone}
		</>
	)
}
