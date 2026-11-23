import { useMemo, type ReactNode } from 'react'
import { ModalHost } from './Modal'
import { ToastHost } from './Toast'
import { DEFAULT_LABELS, LabelsContext, type PaigerLabels } from './shared'

export interface PaigerProviderProps {
	children?: ReactNode
	// Replaces the built-in English text screen readers hear
	labels?: Partial<PaigerLabels>
}

// Wrap your app in this once, inside your other providers. Modals and toasts
// render here, as part of your React tree, so their content can use your
// router, theme, store and any other context.
export function PaigerProvider({ children, labels }: PaigerProviderProps) {
	const value = useMemo(
		() => ({ ...DEFAULT_LABELS, ...labels }),
		[labels?.close, labels?.dismiss, labels?.loading]
	)
	return (
		<LabelsContext.Provider value={value}>
			{children}
			<ModalHost />
			<ToastHost />
		</LabelsContext.Provider>
	)
}
