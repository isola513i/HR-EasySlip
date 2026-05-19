import type { Metadata } from "next";
import { getLocale } from "@/lib/i18n/get-locale";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { ExpenseScreen } from "@/components/employee/expense/expense-screen";

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocale();
  const t = getDictionary(locale);
  return { title: t.hr.expense.pageTitle };
}

export default function EmployeeExpensePage() {
  return <ExpenseScreen />;
}
