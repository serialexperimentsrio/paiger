import { Box } from '../../Box'
import type React from 'react'
import { useContext, useEffect, useId, useRef } from 'react'
import { hideModal, isModalTransitioning, registerCloseAnimation } from '../'
import { MODAL_EASING, MODAL_FILTER, modalDuration, swapDuration } from '../animationConfig'
import { LabelsContext, focusables } from '../../shared'
import style from './style.module.css'
import close from '../../close.module.css'

export interface ModalBoxProps {
	className?: string
	style?: React.CSSProperties
	children: React.ReactNode
	// Shown as the heading, and what screen readers announce the dialog as.
	// Without one, pass aria-label instead.
	title?: React.ReactNode
	'aria-label'?: string
	// The × in the corner. It closes the modal like Escape does.
	closeButton?: boolean
	icon?: string
	image?: string
}

export const ModalBox = ({
	className,
	style: propStyle,
	children,
	title,
	'aria-label': ariaLabel,
	closeButton = true,
	icon,
	image
}: ModalBoxProps) => {
	const titleId = useId()
	const labels = useContext(LabelsContext)
	const divRef = useRef<HTMLDivElement>(null)
	const opened = useRef(false)

	// Focus goes in as it opens: to the first field of a form, otherwise to
	// the first control (the × comes last, so it's only picked when alone).
	// Only visible ones, so a Select's hidden input doesn't count as a field.
	useEffect(() => {
		const controls = divRef.current ? focusables(divRef.current) : []
		const target = controls.find((el) => el.matches('input, select, textarea')) ?? controls[0]
		target?.focus({ preventScroll: true })
	}, [])

	useEffect(() => {
		if (!divRef.current) return

		const animateOuterModal = (from: Keyframe, to: Keyframe) => {
			if (!divRef.current) return
			divRef.current.parentElement?.animate([from, to], {
				duration: modalDuration(),
				easing: MODAL_EASING,
				fill: 'forwards'
			})
		}

		const finalStyles = () => {
			const rect = divRef.current?.getBoundingClientRect()
			return { width: `${rect?.width ?? 0}px`, height: `${rect?.height ?? 0}px` }
		}

		const openModal = () => {
			// Swapping from another modal: drop whatever was still animating
			if (isModalTransitioning() && divRef.current?.parentElement) {
				divRef.current.parentElement.getAnimations().forEach((anim) => anim.cancel())
			}
			const fin = finalStyles()
			animateOuterModal({ width: fin.width, height: 0, boxShadow: '0 0 0 0 transparent', filter: MODAL_FILTER }, fin)
		}

		const closeModal = (swap: boolean) => {
			if (!divRef.current?.parentElement) return
			const outerModal = divRef.current.parentElement
			outerModal.getAnimations().forEach((anim) => anim.cancel())
			const fin = finalStyles()
			const anim = outerModal.animate(
				[fin, { width: fin.width, height: 0, filter: MODAL_FILTER }],
				// Swaps close faster than a normal close
				{ duration: swap ? swapDuration() : modalDuration(), easing: MODAL_EASING, fill: 'forwards' }
			)
			anim.onfinish = () => {
				outerModal.style.visibility = 'hidden'
			}
		}

		registerCloseAnimation(closeModal)

		// Two frames: one for React to commit, one for layout, so the size we
		// measure is real
		requestAnimationFrame(() => {
			requestAnimationFrame(() => {
				openModal()
				opened.current = true
			})
		})

		let resizeRafId: number | undefined
		const resizeObserver = new ResizeObserver(() => {
			if (!opened.current) return
			// At most one resize animation per frame
			if (resizeRafId !== undefined) cancelAnimationFrame(resizeRafId)
			resizeRafId = requestAnimationFrame(() => {
				resizeRafId = undefined
				animateOuterModal({}, finalStyles())
			})
		})

		resizeObserver.observe(divRef.current)

		const currentRef = divRef.current
		return () => {
			if (currentRef) resizeObserver.unobserve(currentRef)
			if (resizeRafId !== undefined) cancelAnimationFrame(resizeRafId)
		}
	}, [])

	return (
		<Box
			image={image}
			icon={icon}
			className={`pg-modal ${style.outerModal}`}
			role="dialog"
			aria-modal="true"
			aria-labelledby={title ? titleId : undefined}
			aria-label={title ? undefined : ariaLabel}
		>
			<div
				ref={divRef}
				className={`pg-modal-content ${style.innerModal}${className ? ` ${className}` : ''}`}
				style={propStyle}
			>
				{title && (
					<h2 id={titleId} className="pg-modal-title">
						{title}
					</h2>
				)}
				{children}
				{closeButton && (
					<button
						type="button"
						className={`pg-modal-close ${close.close} ${style.close}`}
						aria-label={labels.close}
						onClick={hideModal}
					/>
				)}
			</div>
		</Box>
	)
}
