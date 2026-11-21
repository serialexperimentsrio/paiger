declare module '*.module.css' {
  const classes: Record<string, string>
  export default classes
}

// Plain CSS side-effect imports (TypeScript 6 checks these)
declare module '*.css'
