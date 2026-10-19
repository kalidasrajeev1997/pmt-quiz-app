import { Controller, useFormContext } from "react-hook-form";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import type { QuizFormValues } from "@/helpers/quizSchema";
import { useSelection } from "@/hooks/useSelection";

export default function QuizCountryFields() {
  const { countries } = useSelection();
  const {
    control,
    formState: { errors },
  } = useFormContext<QuizFormValues>();

  return (
    <section className="space-y-4" aria-labelledby="countries-title">
      <h2 id="countries-title" className="text-lg font-medium">
        Assigned countries
      </h2>
      <Controller
        control={control}
        name="countries"
        render={({ field }) => (
          <div
            role="group"
            aria-labelledby="countries-title"
            aria-describedby={errors.countries ? "countries-error" : undefined}
            className="space-y-3"
          >
            {countries.map((country) => (
              <div key={country.code} className="flex items-center gap-3">
                <Checkbox
                  id={`country-${country.code}`}
                  checked={field.value.includes(country.code)}
                  onCheckedChange={(checked) =>
                    field.onChange(
                      checked
                        ? [...field.value, country.code]
                        : field.value.filter((code) => code !== country.code),
                    )
                  }
                />
                <Label htmlFor={`country-${country.code}`}>
                  {country.name}
                </Label>
              </div>
            ))}
          </div>
        )}
      />
      {errors.countries && (
        <p
          id="countries-error"
          role="alert"
          className="text-sm text-destructive"
        >
          {errors.countries.message}
        </p>
      )}
    </section>
  );
}
