import DepartmentSubcategoryPage from "@/app/components/shop/DepartmentSubcategoryPage";

export default function MenSubcategoryPage(props: {
  params: Promise<{ subcategory: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  return <DepartmentSubcategoryPage {...props} department="men" />;
}
