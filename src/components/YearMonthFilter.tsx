"use client";

import { useRouter, useSearchParams } from "next/navigation";

interface YearMonthFilterProps {
  availableYears?: number[];
  showMonthFilter?: boolean;
}

const months = [
  { value: 0, label: "Todos los meses" },
  { value: 1, label: "Enero" },
  { value: 2, label: "Febrero" },
  { value: 3, label: "Marzo" },
  { value: 4, label: "Abril" },
  { value: 5, label: "Mayo" },
  { value: 6, label: "Junio" },
  { value: 7, label: "Julio" },
  { value: 8, label: "Agosto" },
  { value: 9, label: "Septiembre" },
  { value: 10, label: "Octubre" },
  { value: 11, label: "Noviembre" },
  { value: 12, label: "Diciembre" },
];

export default function YearMonthFilter({
  availableYears,
  showMonthFilter = true,
}: YearMonthFilterProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const currentYear = new Date().getFullYear();

  const selectedYear = parseInt(searchParams.get("year") || String(currentYear));
  const selectedMonth = parseInt(searchParams.get("month") || "0");

  // Generate years from current year back to 2020
  const years = availableYears || Array.from({ length: currentYear - 2019 }, (_, i) => currentYear - i);

  const updateFilters = (year: number, month: number) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("year", year.toString());
    if (month > 0) {
      params.set("month", month.toString());
    } else {
      params.delete("month");
    }
    router.push(`?${params.toString()}`);
  };

  return (
    <div className="flex gap-4 items-center">
      <div>
        <label htmlFor="year" className="block text-sm font-medium text-gray-700 mb-1">
          Año
        </label>
        <select
          id="year"
          value={selectedYear}
          onChange={(e) => updateFilters(parseInt(e.target.value), selectedMonth)}
          className="block w-32 rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 bg-white px-3 py-2 border"
        >
          {years.map((year) => (
            <option key={year} value={year}>
              {year}
            </option>
          ))}
        </select>
      </div>
      {showMonthFilter && (
        <div>
          <label htmlFor="month" className="block text-sm font-medium text-gray-700 mb-1">
            Mes
          </label>
          <select
            id="month"
            value={selectedMonth}
            onChange={(e) => updateFilters(selectedYear, parseInt(e.target.value))}
            className="block w-44 rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 bg-white px-3 py-2 border"
          >
            {months.map((month) => (
              <option key={month.value} value={month.value}>
                {month.label}
              </option>
            ))}
          </select>
        </div>
      )}
    </div>
  );
}
