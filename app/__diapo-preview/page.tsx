import Preview from "./Preview";
export default async function Page({ searchParams }: { searchParams: Promise<{ scene?: string; portrait?: string }> }) {
 const params = await searchParams;
 return <Preview scene={params.scene || "product"} portrait={params.portrait || "0"} />;
}
