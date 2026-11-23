import type { ForwardedRef, ReactElement } from 'react'
import { forwardRef } from 'react'
import { Button, type ButtonProps } from '../Button'
import type { IconProps } from '../Icon'
import style from './style.module.css'

// Square, so its size comes from the icon; `size` doesn't apply
export interface IconButtonProps extends Omit<ButtonProps, 'size'> {
	children: ReactElement<IconProps>
}

export const IconButton = /* @__PURE__ */ forwardRef(function IconButton(
	{ className, ...rest }: IconButtonProps,
	ref: ForwardedRef<HTMLButtonElement>
) {
	return (
		<Button
			{...rest}
			ref={ref}
			className={`pg-icon-button ${style.button}${className ? ` ${className}` : ''}`}
		/>
	)
})
