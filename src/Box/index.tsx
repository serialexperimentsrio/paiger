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
				{/* Positioned by CSS only, so apps can restyle them */}
				{image && (
					<Img
						src={image}
						className={`rb-box-image boxbg ${style.bg}`}
						alt=""
						aria-hidden="true"
						fill={imageComponent != null ? true : undefined}
					/>
				)}
				{icon && (
					<Img
						src={icon}
						className={`rb-box-icon boxiconbg ${style.iconbg}`}
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
