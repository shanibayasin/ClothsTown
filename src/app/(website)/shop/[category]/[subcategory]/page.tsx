import DepartmentSubcategoryPage from "@/app/components/shop/DepartmentSubcategoryPage";

export default async function CategorySubcategoryPage({
  params,
  searchParams,
}: {
  params: Promise<{ category: string; subcategory: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { category, subcategory } = await params;

  return (
    <DepartmentSubcategoryPage
      params={Promise.resolve({ subcategory })}
      searchParams={searchParams}
      department={category}
    />
  );
}
