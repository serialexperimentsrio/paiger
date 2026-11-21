import { Box } from '../../Box'
import type React from 'react'
import { useEffect, useRef } from 'react'
import { isModalTransitioning, registerCloseAnimation } from '../'
import { ANIMATION_CONFIG } from '../animationConfig'
import style from './style.module.css'

export interface ModalBoxProps {
	className?: string
	style?: React.CSSProperties
	children: React.ReactNode
	icon?: string
	image?: string
}

export type ModalBoxComponent = React.ReactElement<ModalBoxProps>

export const ModalBox = ({
	className,
	style: propStyle,
	children,
	icon,
	image
}: ModalBoxProps) => {
	const divRef = useRef<HTMLDivElement>(null)
	const opened = useRef(false)

	// Forms: start in the first input
	useEffect(() => {
		divRef.current?.querySelector('input')?.focus({ preventScroll: true })
	}, [])

	useEffect(() => {
		if (!divRef.current) return

		const animateOuterModal = (from: Keyframe, to: Keyframe) => {
			if (!divRef.current) return
			divRef.current.parentElement?.animate([from, to], {
				duration: ANIMATION_CONFIG.modalTransition.duration,
				easing: ANIMATION_CONFIG.modalTransition.easing,
				fill: 'forwards'
			})
		}

		const { initialFilter } = ANIMATION_CONFIG.modalTransition

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
			animateOuterModal({ width: fin.width, height: 0, boxShadow: '0 0 0 0 transparent', filter: initialFilter }, fin)
		}

		const closeModal = (isNested = false) => {
			if (!divRef.current?.parentElement) return
			const outerModal = divRef.current.parentElement
			outerModal.getAnimations().forEach((anim) => anim.cancel())
			// Swaps close faster than a normal close
			const duration = isNested
				? ANIMATION_CONFIG.nestedTransition.duration
				: ANIMATION_CONFIG.modalTransition.duration
			const fin = finalStyles()
			const anim = outerModal.animate(
				[fin, { width: fin.width, height: 0, filter: initialFilter }],
				{ duration, easing: ANIMATION_CONFIG.modalTransition.easing, fill: 'forwards' }
			)
			anim.onfinish = () => {
				outerModal.style.visibility = 'hidden'
			}
		}

		registerCloseAnimation((isNested?: boolean) => closeModal(isNested))

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
			className={`rb-modal ${style.outerModal}`}
		>
			<div
				ref={divRef}
				className={`rb-modal-content ${style.innerModal}${className ? ` ${className}` : ''}`}
				style={propStyle}
			>
				{children}
			</div>
		</Box>
	)
}
