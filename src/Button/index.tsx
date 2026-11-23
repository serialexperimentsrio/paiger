import type { ButtonHTMLAttributes, ForwardedRef, MouseEvent } from 'react'
import { forwardRef, useState } from 'react'
import style from './style.module.css'
import sweep from '../sweep.module.css'

export interface ButtonProps extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'onClick'> {
	// Return a promise and the button shows its loading state until it settles
	onClick?: (event: MouseEvent<HTMLButtonElement>) => unknown
	// Shows the loading state from outside, e.g. while a form submits
	loading?: boolean
	danger?: boolean
	size?: 'small' | 'medium' | 'large'
	// Ghost buttons have no fill or border until hovered
	variant?: 'solid' | 'ghost'
}

export const Button = /* @__PURE__ */ forwardRef(function Button(
	{ onClick, loading: loadingProp, danger, size = 'medium', variant = 'solid', className, ...rest }: ButtonProps,
	ref: ForwardedRef<HTMLButtonElement>
) {
	// Only tracks a promise from our own onClick; the prop is read as it is
	const [pending, setPending] = useState(false)
	const loading = pending || loadingProp

	const handleClick = (event: MouseEvent<HTMLButtonElement>) => {
		// We don't set `disabled` while loading because that drops keyboard focus,
		// so extra clicks (and form submits) are stopped here instead
		if (loading) {
			event.preventDefault()
			return
		}
		const result = onClick?.(event)
		if (typeof (result as PromiseLike<unknown> | undefined)?.then !== 'function') return
		setPending(true)
		Promise.resolve(result).finally(() => setPending(false))
	}

	return (
		<button
			// Inside a form, a plain <button> would submit it; opt in with type="submit"
			type="button"
			{...rest}
			ref={ref}
			onClick={handleClick}
			aria-busy={loading || undefined}
			data-loading={loading || undefined}
			data-danger={danger || undefined}
			data-size={size}
			data-variant={variant}
			className={[
				'pg-button',
				style.button,
				sweep.sweep,
				size !== 'medium' && style[size],
				variant === 'ghost' && style.ghost,
				danger && style.danger,
				loading && sweep.active,
				loading && style.loading,
				className
			]
				.filter(Boolean)
				.join(' ')}
		/>
	)
})
