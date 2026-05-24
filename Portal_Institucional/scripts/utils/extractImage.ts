export function extractImageFromContent(content: string): string | null {
  if (!content) return null;

  const matches = [...content.matchAll(/<img[^>]+src="([^">]+)"/g)];

  if (matches.length === 0) return null;

  // pega a primeira imagem grande (geralmente a melhor)
  return matches[0][1];
}