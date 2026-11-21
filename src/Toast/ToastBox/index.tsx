import { Box } from '../../Box'
import { useEffect, useRef, useState } from 'react'
import styles from './style.module.css'

export type ToastType = 'default' | 'error' | 'success' | 'warning' | 'info'

// How long a toast stays fully visible, then how long it takes to fade out
export const DISPLAY_MS = 2500
const FADE_MS = 350
// Hovering again after the fade has started gives the toast this long before fading again
const RESUME_MS = 1500

export interface ToastBoxProps {
	id: string
	closeAt: Date
	closing: boolean
	height: number
	text: string
	type?: ToastType
	onRemove?: (id: string) => void
}

export default function ToastBox(props: ToastBoxProps) {
	const [isClosing, setIsClosing] = useState(false)
	const [isAnimationComplete, setIsAnimationComplete] = useState(false)
	const boxRef = useRef<HTMLDivElement>(null)

	const closeTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
	const removeTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

	const startClosing = () => {
		setIsClosing(true)

		// Remove once the fade has finished, plus a short buffer
		if (props.onRemove) {
			const onRemove = props.onRemove
			removeTimeoutRef.current = setTimeout(() => {
				setIsAnimationComplete(true)
				onRemove(props.id)
			}, FADE_MS + 300)
		}
	}

	// Runs once: re-running on every parent render would restart the timer
	useEffect(() => {
		const remaining = props.closeAt.getTime() - Date.now()
		closeTimeoutRef.current = setTimeout(startClosing, Math.max(0, remaining))

		return () => {
			if (closeTimeoutRef.current) clearTimeout(closeTimeoutRef.current)
			if (removeTimeoutRef.current) clearTimeout(removeTimeoutRef.current)
		}
	}, [])

	const handleMouseEnter = () => {
		if (closeTimeoutRef.current) clearTimeout(closeTimeoutRef.current)
		if (removeTimeoutRef.current) clearTimeout(removeTimeoutRef.current)
		setIsClosing(false)
		setIsAnimationComplete(false)
	}

	const handleMouseLeave = () => {
		closeTimeoutRef.current = setTimeout(startClosing, RESUME_MS)
	}

	return (
		<Box
			ref={boxRef}
			onMouseEnter={handleMouseEnter}
			onMouseLeave={handleMouseLeave}
			className={`rb-toast ${styles.toast} ${isClosing ? styles.closing : ''}`}
			// Type colours and the fade live in CSS, keyed by these attributes
			data-type={props.type ?? 'default'}
			data-closing={isClosing || undefined}
			style={
				{
					pointerEvents: isAnimationComplete ? 'none' : 'auto',
					'--rb-toast-fade': `${FADE_MS}ms`
				} as React.CSSProperties
			}
		>
			<p>{props.text}</p>
		</Box>
	)
}
