import IND from "@/assets/flags/india.svg";
import UK from "@/assets/flags/uk.svg";
import UAE from "@/assets/flags/uae.svg";
import Global from "@/assets/flags/global.svg";

const countryFlagMap: Record<"IN" | "GB" | "AE" | "All", string> = {
  IN: IND,
  GB: UK,
  AE: UAE,
  All: Global,
};

export default countryFlagMap;
