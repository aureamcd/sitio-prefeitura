import NewsCard from "./NewsCard";

type Noticia = {
  id: string;
  titulo: string;
  resumo: string;
  imagem?: string;
  slug: string;
  data: string;
  destaque?: string;
};

export default function NewsGrid({ noticias }: { noticias: Noticia[] }) {
  return (
    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
      {noticias.map((n) => (
        <NewsCard key={n.id} {...n} />
      ))}
    </div>
  );
}