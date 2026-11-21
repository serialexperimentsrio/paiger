declare module '*.module.css' {
  const classes: Record<string, string>
  export default classes
}

// Plain `import "./x.css"` imports, which TypeScript 6 now checks
declare module '*.css'
