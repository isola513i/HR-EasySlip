// TypeScript 6+ requires explicit type declarations for CSS imports
declare module "*.css" {
  const content: Record<string, string>;
  export default content;
}
