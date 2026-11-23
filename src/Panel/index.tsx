import type { ForwardedRef, HTMLAttributes, ReactNode } from 'react'
import { forwardRef } from 'react'
import { Box } from '../Box'
import style from './style.module.css'

export interface PanelProps extends Omit<HTMLAttributes<HTMLDivElement>, 'title'> {
	title: ReactNode
	// Sits at the right end of the title row, e.g. an IconButton
	titleExtra?: ReactNode
	children: ReactNode
}

// className, ref and the rest go on the outer wrapper, like every other component
export const Panel = /* @__PURE__ */ forwardRef(function Panel(
	{ title, titleExtra, className, children, ...rest }: PanelProps,
	ref: ForwardedRef<HTMLDivElement>
) {
	return (
		<div {...rest} ref={ref} className={`pg-panel ${style.panel}${className ? ` ${className}` : ''}`}>
			<div className={`pg-panel-title ${style.title}`}>
				<span>{title}</span>
				{titleExtra}
			</div>
			<Box className={`pg-panel-box ${style.box}`}>{children}</Box>
		</div>
	)
})
