export function cleanJsonResponse(text: string): string {
  return text.replace(/```json\s*/gi, "").replace(/```\s*$/gm, "").trim()
}
