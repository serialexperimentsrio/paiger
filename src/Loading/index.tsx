import type { CSSProperties, ForwardedRef } from 'react'
import { forwardRef, useContext } from 'react'
import { LabelsContext } from '../shared'
import styles from './style.module.css'

export type LoadingProps = {
	style?: CSSProperties
	// Centre it over the nearest positioned parent instead of sitting in the text
	center?: boolean
	className?: string
}

export const Loading = /* @__PURE__ */ forwardRef(function Loading(
	{ style, center, className }: LoadingProps,
	ref: ForwardedRef<HTMLSpanElement>
) {
	const labels = useContext(LabelsContext)
	return (
		<span
			ref={ref}
			className={[
				'pg-loading',
				styles.loading,
				center && styles.center,
				className
			]
				.filter(Boolean)
				.join(' ')}
			style={style}
			role="status"
			aria-label={labels.loading}
		>
			<span className={`pg-loading-dot ${styles.dot}`} aria-hidden="true" />
			<span className={`pg-loading-dot ${styles.dot}`} aria-hidden="true" />
			<span className={`pg-loading-dot ${styles.dot}`} aria-hidden="true" />
		</span>
	)
})
