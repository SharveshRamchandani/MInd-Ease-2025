import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
	return twMerge(clsx(inputs))
}

// Basic Markdown/asterisk sanitizer for chat text
// - Strips bold/italic markers (*, _, **, __, ***)
// - Converts lists and blockquotes to plain lines
// - Flattens links to their visible text
// - Removes inline/code fences and keeps inner text
// - Collapses extra whitespace
export function stripMarkdown(input: string): string {
	if (!input) return "";
	let text = input;

	// Remove code fences ```lang\n...```
	text = text.replace(/```[\s\S]*?```/g, (m) => m.replace(/```/g, ""));
	// Remove inline code `code`
	text = text.replace(/`([^`]+)`/g, "$1");

	// Headers #### Title -> Title
	text = text.replace(/^\s{0,3}#{1,6}\s*/gm, "");
	// Blockquotes > quote -> quote
	text = text.replace(/^\s*>\s?/gm, "");
	// Horizontal rules
	text = text.replace(/^\s*([-*_]){3,}\s*$/gm, "");

	// Images ![alt](url) -> alt
	text = text.replace(/!\[([^\]]*)\]\([^)]*\)/g, "$1");
	// Links [label](url) -> label
	text = text.replace(/\[([^\]]+)\]\(([^)]+)\)/g, "$1");

	// Bold/italic ***text***, **text**, *text*, __text__, _text_ -> text
	text = text.replace(/\*\*\*([^*]+)\*\*\*/g, "$1");
	text = text.replace(/\*\*([^*]+)\*\*/g, "$1");
	text = text.replace(/\*([^*]+)\*/g, "$1");
	text = text.replace(/___([^_]+)___/g, "$1");
	text = text.replace(/__([^_]+)__/g, "$1");
	text = text.replace(/_([^_]+)_/g, "$1");

	// Unordered list markers -, *, + at line start -> plain
	text = text.replace(/^\s*[-*+]\s+/gm, "");
	// Ordered list markers 1. 2. -> plain
	text = text.replace(/^\s*\d+\.\s+/gm, "");

	// Collapse multiple blank lines
	text = text.replace(/\n{3,}/g, "\n\n");
	// Trim whitespace on each line
	text = text.replace(/^[\t ]+|[\t ]+$/gm, "");
	// Final trim
	return text.trim();
}
