interface Nameable {
  firstNameTh?: string | null;
  lastNameTh?: string | null;
  firstNameEn?: string | null;
  lastNameEn?: string | null;
}

export function getInitials(person: Nameable): string {
  const first = person.firstNameTh || person.firstNameEn || "";
  const last = person.lastNameTh || person.lastNameEn || "";
  return `${first.charAt(0)}${last.charAt(0)}`;
}
