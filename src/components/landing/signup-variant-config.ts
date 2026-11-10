/**
 * The signup variants (see signup-variant.tsx). Kept in a plain module, not a
 * client one, so server pages can resolve the variant before rendering.
 */
export type SignupVariant = "form" | "modal";

export function resolveSignupVariant(value: string | undefined): SignupVariant {
  return value === "modal" ? "modal" : "form";
}
