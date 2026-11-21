import React, { useEffect, useRef, useState } from 'react'
import ReactDOM from 'react-dom/client'
import { ANIMATION_CONFIG } from './animationConfig'
import style from './style.module.css'

// There is only ever one modal on screen, so its state lives up here.
// previousModal is what openPreviousModal() goes back to.
let currentModal: React.ReactNode | undefined
let previousModal: React.ReactNode | undefined
let previousOnClose: (() => void) | undefined
export let modalActive = false
let onCloseCallback: (() => void) | undefined
let closeInnerModalFn: ((isNested?: boolean) => void) | undefined

// Pending transition, cancelled if another one starts
let modalTimeoutId: number | undefined
// Bumped on every setModal, so timers from an older call know they're stale
let modalGeneration = 0

export const registerCloseAnimation = (
	closeFunction: (isNested?: boolean) => void
) => {
	closeInnerModalFn = closeFunction
}

let isTransitioningBetweenModals = false
export const isModalTransitioning = () => isTransitioningBetweenModals

const clearModalTimeout = () => {
	if (modalTimeoutId !== undefined) {
		clearTimeout(modalTimeoutId)
		modalTimeoutId = undefined
		isTransitioningBetweenModals = false
	}
}

// A fresh key makes React remount, so the open animation plays even when the
// same component is shown twice in a row
const addKeyToModalContent = (content: React.ReactNode): React.ReactNode => {
	if (React.isValidElement(content)) {
		const uniqueKey = `modal-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`
		return React.cloneElement(content, { key: uniqueKey })
	}
	return content
}

export const setModal = (content: React.ReactNode, onClose?: () => void) => {
	if (currentModal != null) {
		previousModal = currentModal
		previousOnClose = onCloseCallback
	}

	clearModalTimeout()

	modalGeneration++
	const currentGeneration = modalGeneration

	const contentWithKey = addKeyToModalContent(content)

	// Nothing open yet, so just show it
	if (!modalActive && !isTransitioningBetweenModals) {
		currentModal = contentWithKey
		onCloseCallback = onClose
		modalActive = true
		if (portalUpdateFn) portalUpdateFn({})
		return
	}

	// Something is already open: close it, wait for that to finish, then open
	// the new one
	isTransitioningBetweenModals = true

	if (closeInnerModalFn) closeInnerModalFn(true)

	modalActive = false
	if (portalUpdateFn) portalUpdateFn({})

	const pendingContent = contentWithKey
	const pendingOnClose = onClose

	modalTimeoutId = window.setTimeout(() => {
		if (currentGeneration !== modalGeneration) return

		currentModal = undefined
		if (portalUpdateFn) portalUpdateFn({})

		// Give the old one a frame to unmount
		window.setTimeout(() => {
			if (currentGeneration !== modalGeneration) return

			currentModal = pendingContent
			onCloseCallback = pendingOnClose
			modalActive = true
			isTransitioningBetweenModals = false
			if (portalUpdateFn) portalUpdateFn({})
		}, 16)
	}, ANIMATION_CONFIG.nestedTransition.duration)
}

export const hideModal = () => {
	previousModal = undefined
	previousOnClose = undefined

	if (!modalActive) return

	clearModalTimeout()

	modalActive = false

	if (closeInnerModalFn) closeInnerModalFn(false)

	if (portalUpdateFn) portalUpdateFn({})

	// Keep the content around until the close animation is done, or it would
	// just vanish
	modalTimeoutId = window.setTimeout(() => {
		if (!modalActive) {
			currentModal = undefined
			isTransitioningBetweenModals = false
			if (portalUpdateFn) portalUpdateFn({})
		}
	}, ANIMATION_CONFIG.modalTransition.duration)
}

let portalUpdateFn: ((value: Record<string, never>) => void) | null = null

// Escape and clicking the backdrop both count as dismissing it
const dismissModal = () => {
	onCloseCallback?.()
	hideModal()
}

const ModalPortal = () => {
	const [, forceUpdate] = useState({})
	const dialogRef = useRef<HTMLDivElement>(null)
	const previousFocusRef = useRef<Element | null>(null)

	useEffect(() => {
		portalUpdateFn = forceUpdate
		return () => {
			portalUpdateFn = null
		}
	}, [])

	useEffect(() => {
		const handleKeyDown = (e: KeyboardEvent) => {
			if (e.key === 'Escape' && modalActive) dismissModal()

			// Keep Tab inside the dialog
			if (e.key === 'Tab' && modalActive && dialogRef.current) {
				const focusable = dialogRef.current.querySelectorAll<HTMLElement>(
					'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
				)
				if (focusable.length === 0) return
				const first = focusable[0]
				const last = focusable[focusable.length - 1]
				if (e.shiftKey) {
					if (document.activeElement === first) {
						e.preventDefault()
						last.focus()
					}
				} else {
					if (document.activeElement === last) {
						e.preventDefault()
						first.focus()
					}
				}
			}
		}
		document.addEventListener('keydown', handleKeyDown)
		return () => document.removeEventListener('keydown', handleKeyDown)
	}, [])

	// Remember what had focus, and give it back on close
	useEffect(() => {
		if (modalActive) {
			previousFocusRef.current = document.activeElement
			requestAnimationFrame(() => {
				const firstFocusable = dialogRef.current?.querySelector<HTMLElement>(
					'a[href], button:not([disabled]), input:not([disabled]), [tabindex]:not([tabindex="-1"])'
				)
				firstFocusable?.focus()
			})
		} else {
			if (previousFocusRef.current instanceof HTMLElement) {
				previousFocusRef.current.focus()
			}
			previousFocusRef.current = null
		}
	}, [modalActive])

	return (
		<>
			<div
				onClick={dismissModal}
				className={`rb-modal-backdrop ${style.modalBackdrop} ${modalActive ? style.active : ''}`}
				data-active={modalActive || undefined}
			/>
			<div
				ref={dialogRef}
				role="dialog"
				aria-modal="true"
				style={{ display: 'contents' }}
			>
				{currentModal}
			</div>
		</>
	)
}

let portalInitialized = false

const initModalPortal = () => {
	if (typeof document === 'undefined' || portalInitialized) return

	const portal = document.createElement('div')
	portal.id = 'modal-portal'
	document.body.appendChild(portal)

	ReactDOM.createRoot(portal).render(<ModalPortal />)

	portalInitialized = true
}

export const openPreviousModal = () => {
	if (!previousModal) return
	setModal(previousModal, previousOnClose)
	previousModal = undefined
	previousOnClose = undefined
}

initModalPortal()
