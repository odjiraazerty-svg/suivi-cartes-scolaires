/**
 * Gestion centralisée de l'année scolaire (Calendrier officiel MFFE).
 *
 * Règle de calcul officielle :
 * - De septembre (mois 9) à décembre (mois 12) : année en cours - (année en cours + 1)
 *   Exemple : en octobre 2026 -> '2026-2027'
 * - De janvier (mois 1) à août (mois 8) : (année en cours - 1) - année en cours
 *   Exemple : en février 2027 -> '2026-2027'
 */

export function getCurrentSchoolYear(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth() + 1; // 1 à 12
  return month >= 9 ? `${year}-${year + 1}` : `${year - 1}-${year}`;
}

export function formatSchoolYearDisplay(annee: string): string {
  if (!annee) return '';
  const clean = annee.replace(/\s+/g, '');
  const parts = clean.split('-');
  if (parts.length === 2) {
    return `Année ${parts[0]} - ${parts[1]}`;
  }
  return annee;
}

export interface SchoolYearOption {
  value: string;
  label: string;
  isCurrent: boolean;
}

export function getAvailableSchoolYears(countBack: number = 3, countForward: number = 1): SchoolYearOption[] {
  const current = getCurrentSchoolYear();
  const [startStr, endStr] = current.split('-');
  const start = parseInt(startStr, 10) || 2026;
  const end = parseInt(endStr, 10) || start + 1;

  const years: SchoolYearOption[] = [];

  // 1. Année en cours (Priorité)
  years.push({
    value: `${start}-${end}`,
    label: `Année ${start} - ${end} (En cours)`,
    isCurrent: true,
  });

  // 2. Année précédente (N-1)
  years.push({
    value: `${start - 1}-${end - 1}`,
    label: `Année ${start - 1} - ${end - 1}`,
    isCurrent: false,
  });

  // 3. Année suivante (N+1)
  years.push({
    value: `${start + 1}-${end + 1}`,
    label: `Année ${start + 1} - ${end + 1}`,
    isCurrent: false,
  });

  // 4. Années antérieures supplémentaires
  for (let i = 2; i <= countBack; i++) {
    years.push({
      value: `${start - i}-${end - i}`,
      label: `Année ${start - i} - ${end - i}`,
      isCurrent: false,
    });
  }

  return years;
}
