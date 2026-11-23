import { useContext, type HTMLAttributes, type ReactNode } from 'react'
import { Box } from '../../Box'
import styles from './style.module.css'
import close from '../../close.module.css'
import { LabelsContext } from '../../shared'

export type ToastType = 'default' | 'error' | 'success' | 'warning' | 'info'

export interface ToastAction {
	label: string
	onClick: () => unknown
}

export interface ToastBoxProps extends HTMLAttributes<HTMLDivElement> {
	children: ReactNode
	type?: ToastType
	// A small button after the message, e.g. Undo
	action?: ToastAction
	// Shows the × and runs when it's pressed
	onDismiss?: () => void
}

// What a toast looks like, without the timing. toast() uses it, and you can
// render it yourself for a notice that stays in place.
export function ToastBox({ children, type = 'default', action, onDismiss, className, ...rest }: ToastBoxProps) {
	const labels = useContext(LabelsContext)
	return (
		<Box
			{...rest}
			className={`pg-toast ${styles.toast}${className ? ` ${className}` : ''}`}
			// The CSS picks colours off this
			data-type={type}
		>
			<div className={styles.message}>{children}</div>
			{action && (
				<button type="button" className={`pg-toast-action ${styles.action}`} onClick={action.onClick}>
					{action.label}
				</button>
			)}
			{onDismiss && (
				<button
					type="button"
					className={`pg-toast-dismiss ${close.close} ${styles.dismiss}`}
					aria-label={labels.dismiss}
					onClick={onDismiss}
				/>
			)}
		</Box>
	)
}
