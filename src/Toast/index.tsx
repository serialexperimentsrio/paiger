import { useEffect, useState } from 'react'
import { createRoot } from 'react-dom/client'
import type { ToastBoxProps, ToastType } from './ToastBox'
import ToastBox, { DISPLAY_MS } from './ToastBox'
import style from './style.module.css'

type XLocation = 'left' | 'right'
type YLocation = 'top' | 'bottom'
type ForceUpdateFn = (value: Record<string, never>) => void

let toasts: ToastBoxProps[] = []
// Heights of toasts that are fading out, so the stack doesn't collapse early
let removedToasts: Record<string, number> = {}
let fadedToasts: Record<string, boolean> = {}
let xLocation: XLocation = 'right'
let yLocation: YLocation = 'bottom'
let portalUpdateFn: ForceUpdateFn | null = null
let portalInitialized = false
let hideToasts = false

const generateId = () => Math.random().toString(36).substring(2, 9)

const updatePortal = () => portalUpdateFn?.({})

const ToastPortalContent = ({
	toasts,
	removedToasts,
	xLocation,
	yLocation
}: {
	toasts: ToastBoxProps[]
	removedToasts: Record<string, number>
	xLocation: XLocation
	yLocation: YLocation
}) => {
	type ExtendedToastBoxProps = ToastBoxProps & {
		isPlaceholder?: boolean
	}

	const allToasts: ExtendedToastBoxProps[] = [...toasts]
	Object.entries(removedToasts).forEach(([id, height]) => {
		if (!allToasts.some((t) => t.id === id)) {
			allToasts.push({
				id,
				height,
				text: '',
				closeAt: new Date(),
				closing: true,
				isPlaceholder: true
			})
		}
	})

	const totalHeight = allToasts.reduce(
		(acc, toast) => acc + toast.height + 10,
		8
	)

	const toastList = yLocation === 'top' ? [...allToasts].reverse() : [...allToasts]

	const providerStyle: React.CSSProperties = {
		...(yLocation === 'bottom'
			? { top: `calc(100% - ${totalHeight}px)` }
			: { bottom: `calc(100% - ${totalHeight}px)` }),
		[xLocation]: 0,
		// Without this the first toast slides in from the wrong side
		transform: 'translateX(0)'
	}

	return (
		<div
			className={`rb-toast-container ${style.toastProvider}`}
			role="status"
			aria-live="polite"
			aria-atomic="false"
			style={{
				...providerStyle,
				display: hideToasts ? 'none' : undefined
			}}
		>
			{toastList.map((toast) => {
				// Keep the gap while it fades out
				if (
					(toast as ExtendedToastBoxProps).isPlaceholder ||
					fadedToasts[toast.id]
				) {
					return (
						<div
							key={toast.id}
							style={{
								height: `${toast.height}px`,
								margin: '10px',
								width: '300px',
								visibility: 'hidden',
								display: 'block',
								position: 'relative'
							}}
						/>
					)
				}

				return <ToastBox key={toast.id} {...toast} />
			})}
		</div>
	)
}

export const setToastLocation = (x: XLocation, y: YLocation) => {
	xLocation = x
	yLocation = y
	updatePortal()
}

export const setToastVisibility = (visible: boolean) => {
	hideToasts = !visible
	updatePortal()
}

const initToastPortal = () => {
	if (typeof document === 'undefined' || portalInitialized) return

	const toastRoot = document.createElement('div')
	toastRoot.id = 'toast-portal'
	document.body.appendChild(toastRoot)

	const ToastUpdater = () => {
		const [, forceUpdate] = useState({})

		useEffect(() => {
			portalUpdateFn = forceUpdate
			return () => {
				portalUpdateFn = null
			}
		}, [])

		return (
			<ToastPortalContent
				toasts={toasts}
				removedToasts={removedToasts}
				xLocation={xLocation}
				yLocation={yLocation}
			/>
		)
	}

	createRoot(toastRoot).render(<ToastUpdater />)
	portalInitialized = true
}

const cleanupToasts = () => {
	toasts = []
	updatePortal()

	// Let the last fade finish painting first
	requestAnimationFrame(() => {
		requestAnimationFrame(() => {
			removedToasts = {}
			fadedToasts = {}
			updatePortal()
		})
	})
}

const handleRemoveToast = (id: string) => {
	const toastToRemove = toasts.find((t) => t.id === id)
	if (!toastToRemove) return

	fadedToasts = { ...fadedToasts, [id]: true }
	removedToasts = { ...removedToasts, [id]: toastToRemove.height }
	updatePortal()

	const allToastsFaded = toasts.every(
		(toast) => fadedToasts[toast.id] || toast.id === id
	)
	if (allToastsFaded) {
		cleanupToasts()
	}
}

export const popToast = (content: string, type?: ToastType) => {
	// Nothing to do on the server
	if (typeof document === 'undefined') return
	// The toast layer is only created once the first toast is shown
	initToastPortal()

	requestAnimationFrame(() => {
		// Render it off-screen first to find out how tall it is
		const tempContainer = document.createElement('div')
		tempContainer.style.position = 'absolute'
		tempContainer.style.visibility = 'hidden'
		tempContainer.style.width = '300px'
		const tempRoot = createRoot(tempContainer)
		document.body.appendChild(tempContainer)

		tempRoot.render(
			<ToastBox
				text={content}
				closing={false}
				height={200}
				id={generateId()}
				closeAt={new Date(Date.now() + DISPLAY_MS)}
				type={type}
			/>
		)

		requestAnimationFrame(() => {
			const toastElement = tempContainer.firstElementChild as HTMLElement
			const boxHeight = toastElement ? toastElement.offsetHeight : 50
			tempRoot.unmount()
			tempContainer.remove()

			toasts = [
				...toasts,
				{
					id: generateId(),
					closeAt: new Date(Date.now() + DISPLAY_MS),
					closing: false,
					height: boxHeight,
					text: content,
					type,
					onRemove: handleRemoveToast
				}
			]

			updatePortal()
		})
	})
}

