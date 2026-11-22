import { Box } from '../../Box'
import { useEffect, useRef, useState } from 'react'
import styles from './style.module.css'

export type ToastType = 'default' | 'error' | 'success' | 'warning' | 'info'

// How long a toast stays up, and how long it takes to fade
export const DISPLAY_MS = 2500
const FADE_MS = 350
// After the mouse leaves, wait this long before fading again
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
	const closeTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
	const removeTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

	const startClosing = () => {
		setIsClosing(true)

		// Remove it once the fade is done, with a little slack
		if (props.onRemove) {
			const onRemove = props.onRemove
			removeTimeoutRef.current = setTimeout(() => {
				setIsAnimationComplete(true)
				onRemove(props.id)
			}, FADE_MS + 300)
		}
	}

	// Mount only, or every re-render would restart the timer
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
			onMouseEnter={handleMouseEnter}
			onMouseLeave={handleMouseLeave}
			className={`rb-toast ${styles.toast} ${isClosing ? styles.closing : ''}`}
			// The CSS picks colours and the fade off these
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
