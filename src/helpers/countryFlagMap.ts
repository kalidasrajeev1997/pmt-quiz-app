import IND from "@/assets/flags/india.svg";
import UK from "@/assets/flags/uk.svg";
import UAE from "@/assets/flags/uae.svg";

const countryFlagMap: Record<"IN" | "GB" | "AE", string> = {
  IN: IND,
  GB: UK,
  AE: UAE,
};

export default countryFlagMap;
