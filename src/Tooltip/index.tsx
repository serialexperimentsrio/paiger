import React, { useEffect, useId, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import style from './style.module.css'

type MouseEventHandler = (event: React.MouseEvent) => void

type ChildProps = {
	onMouseEnter?: MouseEventHandler
	onMouseLeave?: MouseEventHandler
	[key: string]: unknown
}

type TooltipProps = {
	text: string
	children: React.ReactElement<ChildProps>
	above?: boolean
	left?: boolean
	right?: boolean
	forceShow?: boolean
	forceHide?: boolean
}

export function Tooltip({
	text,
	children,
	above,
	left,
	right,
	forceShow,
	forceHide
}: TooltipProps) {
	useEffect(() => {
		const directionProps = [above, left, right].filter(Boolean)
		if (directionProps.length > 1) {
			console.warn(
				'Tooltip: Multiple direction props detected. Only one of "above", "left", or "right" should be set. ' +
					'Precedence: right > left > above > default(below)'
			)
		}
	}, [above, left, right])

	const [hovered, setHovered] = useState(false)
	const [visible, setVisible] = useState(false)

	const tooltipId = useId()
	const childRef = useRef<HTMLElement>(null)
	const boxRef = useRef<HTMLDivElement>(null)
	const tooltipSize = useRef({ width: 0, height: 0 })
	const animationRef = useRef<Animation | null>(null)
	const innerRef = useRef<HTMLDivElement>(null)
	const lastForceHideRef = useRef(forceHide)
	const scrollingRef = useRef(false)
	// The scroll handler is only set up once, so it reads this instead
	const forceShowRef = useRef(forceShow)
	forceShowRef.current = forceShow
	// Bumped after scrolling stops, so a pinned tooltip comes back
	const [settled, setSettled] = useState(0)

	// Hide while the page scrolls (the trigger moves away from the tooltip), and
	// bring it back once scrolling stops if the mouse is still on the trigger.
	// Capture so scrolling containers count too.
	useEffect(() => {
		let settleTimer: ReturnType<typeof setTimeout>
		const onScroll = () => {
			scrollingRef.current = true
			animationRef.current?.cancel()
			setHovered(false)
			setVisible(false)
			clearTimeout(settleTimer)
			settleTimer = setTimeout(() => {
				scrollingRef.current = false
				if (childRef.current?.matches(':hover')) setHovered(true)
				if (forceShowRef.current) setSettled((n) => n + 1)
			}, 150)
		}
		window.addEventListener('scroll', onScroll, { capture: true, passive: true })
		return () => {
			window.removeEventListener('scroll', onScroll, { capture: true })
			clearTimeout(settleTimer)
		}
	}, [])

	useEffect(() => {
		tooltipSize.current = { width: 0, height: 0 }
	}, [text])

	useEffect(() => {
		const wasJustForceHidden = !lastForceHideRef.current && forceHide
		lastForceHideRef.current = forceHide

		if (wasJustForceHidden) {
			setVisible(false)
		}

		if (forceHide) {
			return
		}

		const shouldShow = hovered || forceShow

		if (shouldShow) {
			setVisible(true)
		}

		if (!childRef.current || !boxRef.current) return

		const childRect = childRef.current.getBoundingClientRect()

		if (tooltipSize.current.width === 0 && innerRef.current) {
			const boxRect = innerRef.current.getBoundingClientRect()
			tooltipSize.current = {
				width: Math.round(boxRect.width + 4),
				height: Math.round(boxRect.height + 4)
			}
		}

		boxRef.current.style.position = 'absolute'

		const keyframes = [
			{
				opacity: 0,
				top: `${Math.round(
					childRect.top + childRect.height + window.scrollY - 10
				)}px`,
				left: `${Math.round(
					childRect.left + window.scrollX + childRect.width / 2
				)}px`,
				width: 0,
				height: 0
			},
			{
				opacity: 1,
				top: `${Math.round(
					childRect.top + childRect.height + 5 + window.scrollY
				)}px`,
				left: `min(${Math.round(
					childRect.left +
						childRect.width / 2 -
						tooltipSize.current.width / 2 +
						window.scrollX
				)}px, ${Math.round(
					window.innerWidth - tooltipSize.current.width - 20
				)}px)`,
				width: `${tooltipSize.current.width}px`,
				height: `${tooltipSize.current.height}px`
			}
		]

		if (above) {
			keyframes[0].top = `${Math.round(childRect.top + window.scrollY + 10)}px`
			keyframes[1].top = `${Math.round(
				childRect.top - tooltipSize.current.height - 5 + window.scrollY
			)}px`
		}

		if (left) {
			keyframes[0].top = `${Math.round(
				childRect.top + childRect.height / 2 + window.scrollY
			)}px`
			keyframes[0].left = `${Math.round(
				childRect.left + window.scrollX + 10
			)}px`
			keyframes[1].top = `${Math.round(
				childRect.top +
					childRect.height / 2 -
					tooltipSize.current.height / 2 +
					window.scrollY
			)}px`
			keyframes[1].left = `${Math.max(
				5,
				Math.round(
					childRect.left -
						tooltipSize.current.width -
						5 +
						window.scrollX
				)
			)}px`
		}

		if (right) {
			keyframes[0].top = `${Math.round(
				childRect.top + childRect.height / 2 + window.scrollY
			)}px`
			keyframes[0].left = `${Math.round(
				childRect.left + childRect.width + window.scrollX - 10
			)}px`
			keyframes[1].top = `${Math.round(
				childRect.top +
					childRect.height / 2 -
					tooltipSize.current.height / 2 +
					window.scrollY
			)}px`
			keyframes[1].left = `${Math.min(
				window.innerWidth - tooltipSize.current.width - 5,
				Math.round(
					childRect.left + childRect.width + 5 + window.scrollX
				)
			)}px`
		}

		if (!shouldShow) keyframes.reverse()

		animationRef.current?.cancel()
		const animation = boxRef.current.animate(keyframes, {
			duration: shouldShow ? 200 : 400,
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
	}, [hovered, forceShow, forceHide, above, left, right, settled])

	const isHorizontal = left || right
	// Render it whenever forceShow is on, since the effect needs the box to
	// measure and animate
	const tooltipContent =
		(hovered || visible || (forceShow && !forceHide)) &&
		createPortal(
			<div ref={boxRef} id={tooltipId} role="tooltip" className={`rb-tooltip ${style.tooltip}`}>
				<div ref={innerRef} className={`rb-tooltip-text ${style.tooltipInner} ${isHorizontal ? style.horizontal : style.vertical}`}>
					{text}
				</div>
			</div>,
			document.body
		)

	const clone = React.cloneElement(children, {
		// Only point at the tooltip while it exists
		'aria-describedby':
			[children.props['aria-describedby'], (hovered || visible || forceShow) && tooltipId]
				.filter(Boolean)
				.join(' ') || undefined,

		// Keep the child's own ref working (React 19 has it in props.ref)
		ref: (node: HTMLElement | null) => {
			childRef.current = node
			const own = (children.props as { ref?: React.Ref<HTMLElement> }).ref
			if (typeof own === 'function') own(node)
			else if (own) own.current = node
		},

		onMouseEnter: (e: React.MouseEvent) => {
			// Mid-scroll, the timer above handles this
			if (!scrollingRef.current) setHovered(true)
			children.props.onMouseEnter?.(e)
		},

		onMouseLeave: (e: React.MouseEvent) => {
			setHovered(false)
			children.props.onMouseLeave?.(e)
		}
	})

	return (
		<>
			{tooltipContent}
			{clone}
		</>
	)
}
