import { revalidatePath } from "next/cache";

export function revalidateStorefront() {
  revalidatePath("/", "layout");
}
