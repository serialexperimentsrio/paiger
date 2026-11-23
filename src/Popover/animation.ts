import type { Placement } from './position'
import { TRANSFORMS } from './position'

export const createAnimationKeyframes = (
	position: Placement,
	height: number,
	offset: number,
	isOpening: boolean,
	matchTriggerWidth: boolean
): Keyframe[] => {
	const baseTransform = TRANSFORMS[position]
	// Centred popovers rely on translateX(-50%), so every keyframe needs it too
	const centerPrefix = !matchTriggerWidth && (position === 'bottom' || position === 'top') ? 'translateX(-50%) ' : ''

	const offsets = {
		left: `translateX(${offset}px)`,
		right: `translateX(-${offset}px)`,
		top: `translateY(${offset}px)`,
		bottom: `translateY(-${offset}px)`
	}
	const offsetTransform = `${centerPrefix}${baseTransform} ${offsets[position]}`
	const restTransform = `${centerPrefix}${baseTransform}`

	const startFrame = {
		height: isOpening ? '0px' : `${height}px`,
		opacity: isOpening ? 0 : 1,
		overflow: 'hidden' as const,
		transform: isOpening ? offsetTransform : restTransform
	}
	const endFrame = {
		height: isOpening ? `${height}px` : '0px',
		opacity: isOpening ? 1 : 0,
		overflow: 'hidden' as const,
		transform: isOpening ? restTransform : offsetTransform
	}
	return [startFrame, endFrame]
}

export const measurePopoverSize = (
	element: HTMLDivElement
): { width: number; height: number } | null => {
	try {
		// A running animation would throw the measurement off
		element.getAnimations().forEach((anim) => anim.cancel())

		const original = element.style.cssText

		// Show it invisibly at its natural size, measure, then put everything back
		element.style.cssText = [
			'opacity: 0 !important',
			'position: fixed !important',
			'top: 0 !important',
			'left: 0 !important',
			'width: auto !important',
			'height: auto !important',
			'transform: none !important',
			'contain: layout style !important',
			'visibility: hidden !important',
			'pointer-events: none !important'
		].join('; ')

		element.showPopover()
		const rect = element.getBoundingClientRect()
		element.hidePopover()

		element.style.cssText = original

		return rect.width > 0 && rect.height > 0
			? { width: rect.width, height: rect.height }
			: null
	} catch {
		return null
	}
}
