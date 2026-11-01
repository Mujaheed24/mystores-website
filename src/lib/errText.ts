// Plain-language text for a failed action. Kept in its own file so small pages can use it without loading the database code.
export const errText = (e: any) =>
  e?.code === "permission-denied" ? "You don't have permission to do that." : e?.message || "Something went wrong. Try again.";
