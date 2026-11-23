import type { CSSProperties, ForwardedRef, HTMLAttributes, ImgHTMLAttributes } from 'react'
import { forwardRef } from 'react'
import style from './style.module.css'

export interface IconProps extends ImgHTMLAttributes<HTMLImageElement> {
	width?: number
	height?: number
	// Draw the icon's shape in the current text colour instead of its own
	// colours, so it follows the theme and hover states. Suits single-colour
	// icons; the image is used as a mask.
	tint?: boolean
}

export const Icon = /* @__PURE__ */ forwardRef(function Icon(
	{ width, height, tint, src, alt, ...rest }: IconProps,
	ref: ForwardedRef<HTMLElement>
) {
	const size = { width: width ?? height ?? 16, height: height ?? width ?? 16 }
	const className = `pg-icon ${style.icon}${tint ? ` ${style.tint}` : ''}${rest.className ? ` ${rest.className}` : ''}`

	if (tint) {
		return (
			<span
				{...(rest as HTMLAttributes<HTMLSpanElement>)}
				ref={ref}
				// Read out like an <img>: by its alt text, or not at all without one
				role={alt ? 'img' : undefined}
				aria-label={alt || undefined}
				aria-hidden={alt ? undefined : true}
				style={{ ...size, '--pg-icon-src': `url(${JSON.stringify(src ?? '')})`, ...rest.style } as CSSProperties}
				className={className}
			/>
		)
	}

	return (
		<img
			{...rest}
			src={src}
			alt={alt ?? ''}
			draggable={false}
			ref={ref as ForwardedRef<HTMLImageElement>}
			style={{ ...size, ...rest.style }}
			className={className}
		/>
	)
})
