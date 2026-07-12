import { absoluteUrl } from "@/lib/seo";

type Item = { url: string; name: string };
	export function collectionItemListJsonLd({
  baseUrl,
  title,
  description,
  items,
}: {
  baseUrl: string;
  title: string;
  description: string;
  items: Item[];
}) {
  return {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    "@id": `${baseUrl}#collection`,
    name: title,
    description,
    url: baseUrl,
    mainEntity: {
      "@type": "ItemList",
      itemListElement: items.map((it, index) => ({
        "@type": "ListItem",
        position: index + 1,
        url: it.url,
        name: it.name,
      })),
    },
    publisher: {
      "@type": "Organization",
      "@id": `${absoluteUrl("/")}#organization`,
    },
  };
}

