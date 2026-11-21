import type { ForwardedRef, ImgHTMLAttributes } from 'react'
import { forwardRef } from 'react'
import style from './style.module.css'

interface Props extends ImgHTMLAttributes<HTMLImageElement> {
	width?: number
	height?: number
}

export const Icon = forwardRef(
	(
		{ width, height, ...rest }: Props,
		ref: ForwardedRef<HTMLImageElement>
	) => {
		return (
			<img
				{...rest}
				draggable={false}
				ref={ref}
				alt={rest.alt ?? ''}
				style={{
					width: width ?? height ?? 16,
					height: height ?? width ?? 16,
					...rest.style
				}}
				className={`rb-icon ${style.icon}${rest.className ? ` ${rest.className}` : ''}`}
			/>
		)
	}
)

Icon.displayName = 'Icon'
