import { Box } from '../Box'
import type { ReactNode } from 'react'
import style from './style.module.css'

export function Panel({
	title,
	children,
	titleExtra,
	className,
	...rest
}: React.HTMLAttributes<HTMLDivElement> & {
	title: string
	titleExtra?: ReactNode
	children: ReactNode
}) {
	return (
		<div className={`rb-panel ${style.panel}`}>
			<div className={`rb-panel-title ${style.title}`}>
				<span>{title}</span>
				{titleExtra}
			</div>
			<Box {...rest} className={`rb-panel-box ${style.box}${className ? ` ${className}` : ''}`}>
				{children}
			</Box>
		</div>
	)
}
