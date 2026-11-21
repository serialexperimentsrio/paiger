import React, { useEffect, useId, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import style from './style.module.css'

type MouseEventHandler = (event: React.MouseEvent) => void

type ChildProps = {
	onMouseEnter?: MouseEventHandler
	onMouseLeave?: MouseEventHandler
	[key: string]: unknown // use unknown instead of any
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
	// validate that only one direction prop is set
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

	// Scrolling moves the trigger away from where the tooltip was placed, so hide
	// it, then show it again once scrolling settles if the pointer is still over
	// the trigger. Capture phase also catches scrolls inside overflow containers,
	// which never reach a plain window listener.
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
		const animation = boxRef.current.animate(
			keyframes,
			shouldShow
				? {
						duration: 200,
						easing: 'cubic-bezier(0.16, 1, 0.3, 1)',
						fill: 'forwards'
					}
				: {
						duration: 400,
						easing: 'cubic-bezier(0.16, 1, 0.3, 1)',
						fill: 'forwards'
					}
		)
		animationRef.current = animation

		// handle hide animation complete
		if (!shouldShow) {
			animation.onfinish = () => setVisible(false)
		}

		return () => {
			animation.cancel()
		}
	}, [hovered, forceShow, forceHide, above, left, right])

	// show tooltip content
	const isHorizontal = left || right
	const tooltipContent =
		(hovered || visible) &&
		createPortal(
			<div ref={boxRef} id={tooltipId} role="tooltip" className={`rb-tooltip ${style.tooltip}`}>
				<div ref={innerRef} className={`rb-tooltip-text ${style.tooltipInner} ${isHorizontal ? style.horizontal : style.vertical}`}>
					{text}
				</div>
			</div>,
			document.body
		)

	// safely clone child element with added props
	const clone = React.cloneElement(children, {
		...children.props,
		// only reference the tooltip while it exists
		'aria-describedby':
			[children.props['aria-describedby'], (hovered || visible || forceShow) && tooltipId]
				.filter(Boolean)
				.join(' ') || undefined,

		// merge refs
		ref: (node: HTMLElement | null) => {
			// update our ref
			childRef.current = node

			type RefType =
				| ((instance: HTMLElement | null) => void)
				| { current: HTMLElement | null }
				| null
			// React 19 keeps the child's own ref in props.ref (element.ref is gone)
			const originalRef = (children.props as { ref?: RefType }).ref
			if (!originalRef) return

			// handle both function and object refs
			if (typeof originalRef === 'function') {
				// function ref
				;(originalRef as (instance: HTMLElement | null) => void)(node)
			} else if (
				originalRef &&
				typeof originalRef === 'object' &&
				'current' in originalRef
			) {
				// ref object, forward the ref
				// eslint-disable-next-line react-hooks/immutability
				;(originalRef as { current: HTMLElement | null }).current = node
			}
		},

		// add mouse handlers
		onMouseEnter: (e: React.MouseEvent) => {
			// while scrolling, the settle timer shows the tooltip instead
			if (!scrollingRef.current) setHovered(true)

			// call original
			if (children.props.onMouseEnter) {
				children.props.onMouseEnter(e)
			}
		},

		onMouseLeave: (e: React.MouseEvent) => {
			setHovered(false)

			if (children.props.onMouseLeave) {
				children.props.onMouseLeave(e)
			}
		}
	})

	return (
		<>
			{tooltipContent}
			{clone}
		</>
	)
}
