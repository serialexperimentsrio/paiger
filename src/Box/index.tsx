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

export type BoxProps = {
	image?: string
	icon?: string
	imageComponent?: React.ComponentType<ImageComponentProps>
} & HTMLAttributes<HTMLDivElement>

// Pure, and named rather than given a displayName afterwards, so bundlers can
// drop it when unused and dev tools still show "Box"
export const Box = /* @__PURE__ */ forwardRef(function Box(
	{ image, icon, className, children, imageComponent, ...rest }: BoxProps,
	ref: ForwardedRef<HTMLDivElement>
) {
	const Img = imageComponent ?? 'img'

	return (
		<div
			{...rest}
			ref={ref}
			className={`pg-box ${style.box}${className ? ` ${className}` : ''}`}
		>
			{/* Placed purely with CSS, so apps can move them around */}
			{image && (
				<Img
					src={image}
					className={`pg-box-image ${style.bg}`}
					alt=""
					aria-hidden="true"
					fill={imageComponent != null ? true : undefined}
				/>
			)}
			{icon && (
				<Img
					src={icon}
					className={`pg-box-icon ${style.iconbg}`}
					alt=""
					aria-hidden="true"
					fill={imageComponent != null ? true : undefined}
				/>
			)}
			{children}
		</div>
	)
})
