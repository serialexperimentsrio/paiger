import type { ForwardedRef, HTMLAttributes } from 'react'
import { forwardRef } from 'react'
import style from './style.module.css'

type ImageComponentProps = {
	src: string
	className?: string
	alt: string
	fill?: boolean
	style?: React.CSSProperties
}

type BoxProps = {
	image?: string
	icon?: string
	imageComponent?: React.ComponentType<ImageComponentProps>
} & HTMLAttributes<HTMLDivElement>

export const Box = forwardRef(
	(
		{ image, icon, className, children, imageComponent, ...rest }: BoxProps,
		ref: ForwardedRef<HTMLDivElement>
	) => {
		const Img = imageComponent ?? 'img'

		return (
			<div
				{...rest}
				ref={ref}
				className={`rb-box ${style.box} ${className || ''}`}
			>
				{/* Placed purely with CSS, so apps can move them around */}
				{image && (
					<Img
						src={image}
						className={`rb-box-image ${style.bg}`}
						alt=""
						aria-hidden="true"
						fill={imageComponent != null ? true : undefined}
					/>
				)}
				{icon && (
					<Img
						src={icon}
						className={`rb-box-icon ${style.iconbg}`}
						alt=""
						aria-hidden="true"
						fill={imageComponent != null ? true : undefined}
					/>
				)}
				{children}
			</div>
		)
	}
)

Box.displayName = 'Box'
