/**
 * A simple utility to highlight Lua code for the report UI
 * Uses span elements with color classes to highlight syntax
 */
export function highlightCode(code: string): string {
  if (!code) return '';
  
  // Regular expressions for different syntax elements
  const patterns = [
    // Keywords (pink)
    { pattern: /\b(and|break|do|else|elseif|end|false|for|function|if|in|local|nil|not|or|repeat|return|then|true|until|while)\b/g, replacement: '<span class="text-pink-400">$1</span>' },
    
    // Built-in functions (blue)
    { pattern: /\b(print|pairs|ipairs|type|tostring|tonumber|math|string|table|hook|file|http|surface|Material|RunString|CompileString|timer|net|player|util|debug)\b(\.\w+)?/g, replacement: '<span class="text-blue-400">$1$2</span>' },
    
    // Numbers (orange)
    { pattern: /\b(\d+(\.\d+)?)\b/g, replacement: '<span class="text-orange-400">$1</span>' },
    
    // Strings (green) - handles both single and double quotes
    { pattern: /(["'])(.*?)\1/g, replacement: '<span class="text-green-400">$1$2$1</span>' },
    
    // Comments (slate)
    { pattern: /(--[^\n]*)/g, replacement: '<span class="text-slate-500">$1</span>' },
  ];
  
  // Apply each pattern to the code
  let highlightedCode = code;
  patterns.forEach(({ pattern, replacement }) => {
    highlightedCode = highlightedCode.replace(pattern, replacement);
  });
  
  return highlightedCode;
}
