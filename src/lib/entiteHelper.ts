/**
 * Utilitaires pour la gestion et la standardisation des entités du MFFE
 * S'appuie sur les conventions et données de la table "entite"
 */

export interface NatureOption {
  code: string;
  label: string;
  description: string;
  defaultHierarchie: string;
}

export const STRUCTURE_NATURES: NatureOption[] = [
  {
    code: 'CPPE',
    label: 'CPPE (Centre de Protection de la Petite Enfance)',
    description: 'Structure préscolaire et protection de la petite enfance',
    defaultHierarchie: 'CPPE',
  },
  {
    code: 'CACE',
    label: 'CACE (Centre d\'Action Communautaire pour l\'Enfance)',
    description: 'Structure communautaire préscolaire',
    defaultHierarchie: 'CACE',
  },
  {
    code: 'IFEF',
    label: 'IFEF (Institution de Formation et d\'Éducation Féminine)',
    description: 'Centre de formation et d\'autonomisation des femmes et jeunes filles',
    defaultHierarchie: 'IFEF',
  },
  {
    code: 'CS',
    label: 'CS (Centre Social)',
    description: 'Centre social d\'intervention de proximité',
    defaultHierarchie: 'CS',
  },
  {
    code: 'CSE',
    label: 'CSE (Complexe Socio-Éducatif)',
    description: 'Complexe socio-éducatif regroupant plusieurs services',
    defaultHierarchie: 'COMPLEXE_SOCIO_EDUCATIF',
  },
  {
    code: 'CES',
    label: 'CES (Centre d\'Éducation Spécialisée)',
    description: 'Structure de prise en charge spécialisée pour enfants',
    defaultHierarchie: 'CES',
  },
  {
    code: 'POUPONNIERE',
    label: 'POUPONNIÈRE',
    description: 'Accueil et prise en charge des nourrissons et bébés',
    defaultHierarchie: 'POUPONNIERE',
  },
  {
    code: 'ORPHELINAT',
    label: 'ORPHELINAT',
    description: 'Orphelinats nationaux et structures d\'accueil d\'orphelins',
    defaultHierarchie: 'ORPHELINAT',
  },
  {
    code: 'CRECHE  GARDERIE',
    label: 'CRÈCHE / GARDERIE',
    description: 'Crèche et garderie de la petite enfance',
    defaultHierarchie: 'CRECHE  GARDERIE',
  },
  {
    code: 'GARDERIE',
    label: 'GARDERIE',
    description: 'Garderie d\'enfants',
    defaultHierarchie: 'GARDERIE',
  },
  {
    code: 'CA',
    label: 'CA (Centre d\'Accueil)',
    description: 'Centre d\'accueil pour enfants ou victimes de VBG',
    defaultHierarchie: 'CA',
  },
  {
    code: 'CT',
    label: 'CT (Centre de Transit)',
    description: 'Centre de transit pour enfants',
    defaultHierarchie: 'CT',
  },
  {
    code: 'STRUCTURE SPECIALISEE',
    label: 'STRUCTURE SPÉCIALISÉE',
    description: 'Structure spécialisée MFFE',
    defaultHierarchie: 'STRUCTURE_SPECIALISEE',
  },
  {
    code: 'SOS VILLAGE',
    label: 'SOS VILLAGE D\'ENFANTS',
    description: 'Villages d\'enfants partenaires',
    defaultHierarchie: 'SOS VILLAGE',
  },
  {
    code: 'CENTRE EDUCATIF',
    label: 'CENTRE ÉDUCATIF',
    description: 'Centre éducatif pour enfants',
    defaultHierarchie: 'CENTRE EDUCATIF',
  },
  {
    code: 'DIRECTION',
    label: 'DIRECTION (Régionale / Centrale)',
    description: 'Direction Régionale (DR), Direction Centrale ou Service MFFE',
    defaultHierarchie: 'DIRECTION_REGIONALE',
  },
  {
    code: 'ONG',
    label: 'ONG / PARTENAIRE',
    description: 'Organisation non gouvernementale ou partenaire agréé',
    defaultHierarchie: 'ONG',
  },
];

/**
 * Liste des 32 Directions Régionales officielles du MFFE répertoriées dans la table entite
 */
export const OFFICIAL_REGIONAL_DIRECTIONS: { id: string; nom: string; sigle: string }[] = [
  { id: 'DR ABIDJAN', nom: 'Direction Régionale Abidjan', sigle: 'DR-ABIDJAN' },
  { id: 'DR AGNEBY-TIASSA', nom: 'Direction Régionale Agnéby-Tiassa', sigle: 'DR-AGNEBY-TIASSA' },
  { id: 'DR BAFING', nom: 'Direction Régionale Bafing', sigle: 'DR-BAFING' },
  { id: 'DR BAGOUE', nom: 'Direction Régionale Bagoué', sigle: 'DR-BAGOUE' },
  { id: 'DR BELIER', nom: 'Direction Régionale Bélier', sigle: 'DR-BELIER' },
  { id: 'DR BERE', nom: 'Direction Régionale Béré', sigle: 'DR-BERE' },
  { id: 'DR BOUNKANI', nom: 'Direction Régionale Bounkani', sigle: 'DR-BOUNKANI' },
  { id: 'DR CAVALY', nom: 'Direction Régionale Cavally', sigle: 'DR-CAVALY' },
  { id: 'DR FOLON', nom: 'Direction Régionale Folon', sigle: 'DR-FOLON' },
  { id: 'DR GBEKE', nom: 'Direction Régionale Gbêkê', sigle: 'DR-GBEKE' },
  { id: 'DR GBOKLE', nom: 'Direction Régionale Gboklê', sigle: 'DR-GBOKLE' },
  { id: 'DR GOH', nom: 'Direction Régionale Goh', sigle: 'DR-GOH' },
  { id: 'DR GONTOUGO', nom: 'Direction Régionale Gontougo', sigle: 'DR-GONTOUGO' },
  { id: 'DR GRAND PONT', nom: 'Direction Régionale Grand Pont', sigle: 'DR-GRAND PONT' },
  { id: 'DR GUEMON', nom: 'Direction Régionale Guemon', sigle: 'DR-GUEMON' },
  { id: 'DR HAMBOL', nom: 'Direction Régionale Hambol', sigle: 'DR-HAMBOL' },
  { id: 'DR HAUT SASSANDRA', nom: 'Direction Régionale Haut Sassandra', sigle: 'DR-HAUT SASSANDRA' },
  { id: 'DR IFFOU', nom: 'Direction Régionale Iffou', sigle: 'DR-IFFOU' },
  { id: 'DR INDENIE-DJUABLIN', nom: 'Direction Régionale Indénié-Djuablin', sigle: 'DR-INDENIE-DJUABLIN' },
  { id: 'DR KABADOUGOU', nom: 'Direction Régionale Kabadougou', sigle: 'DR-KABADOUGOU' },
  { id: 'DR LOH-DJIBOUA', nom: 'Direction Régionale Loh-Djiboua', sigle: 'DR-LOH-DJIBOUA' },
  { id: 'DR MARAHOUE', nom: 'Direction Régionale Marahoué', sigle: 'DR-MARAHOUE' },
  { id: 'DR ME', nom: 'Direction Régionale Me', sigle: 'DR-ME' },
  { id: 'DR MORONOU', nom: 'Direction Régionale Moronou', sigle: 'DR-MORONOU' },
  { id: 'DR NAWA', nom: 'Direction Régionale Nawa', sigle: 'DR-NAWA' },
  { id: 'DR N’ZI', nom: 'Direction Régionale N’zi', sigle: 'DR-N’ZI' },
  { id: 'DR PORO', nom: 'Direction Régionale Poro', sigle: 'DR-PORO' },
  { id: 'DR SAN PEDRO', nom: 'Direction Régionale San Pedro', sigle: 'DR-SAN PEDRO' },
  { id: 'DR SUD-COMOE', nom: 'Direction Régionale Sud-Comoe', sigle: 'DR-SUD-COMOE' },
  { id: 'DR TCHOLOGO', nom: 'Direction Régionale Tchologo', sigle: 'DR-TCHOLOGO' },
  { id: 'DR TONKPI', nom: 'Direction Régionale Tonkpi', sigle: 'DR-TONKPI' },
  { id: 'DR WORODOUGOU', nom: 'Direction Régionale Worodougou', sigle: 'DR-WORODOUGOU' },
];

/**
 * Obtient le niveau de hiérarchisation par défaut pour une nature donnée
 */
export function getDefaultHierarchieForNature(nature: string): string {
  const found = STRUCTURE_NATURES.find(n => n.code === nature);
  if (found) return found.defaultHierarchie;
  return nature || 'STRUCTURE';
}

/**
 * Algorithme intelligent de standardisation pour l'identifiant système (id_entite)
 * Calibré à 100% sur le format réel de la table "entite" (ex: CPPE 2 ADZOPE, CACE ABIGUI, IFEF BONOUA)
 */
export function generateIdEntiteFromNom(nom: string, nature: string = 'CPPE'): string {
  if (!nom || !nom.trim()) return '';
  const cleanNature = (nature || 'STRUCTURE').trim().toUpperCase();
  let clean = nom.trim();

  // 1. Suppression des désignations longues au début du nom
  const prefixesToRemove = [
    /^Centre\s+de\s+Protection\s+de\s+la\s+Petite\s+Enfance\s*(\(CPPE\))?\s*(d['’]|de\s+|du\s+|des\s+)?/i,
    /^Centre\s+d['’]Action\s+Communautaire\s+pour\s+l['’]Enfance\s*(\(CACE\))?\s*(d['’]|de\s+|du\s+|des\s+)?/i,
    /^Institution\s+de\s+Formation\s+et\s+d['’]Éducation\s+Féminine\s*(\(IFEF\))?\s*(d['’]|de\s+|du\s+|des\s+)?/i,
    /^Institution\s+de\s+Formation\s+et\s+d['’]Education\s+Féminine\s*(\(IFEF\))?\s*(d['’]|de\s+|du\s+|des\s+)?/i,
    /^Complexe\s+Socio-?Éducatif\s*(\(CSE\))?\s*(d['’]|de\s+|du\s+|des\s+)?/i,
    /^Complexe\s+Socio-?Educatif\s*(\(CSE\))?\s*(d['’]|de\s+|du\s+|des\s+)?/i,
    /^Centre\s+Social\s*(\(CS\))?\s*(d['’]|de\s+|du\s+|des\s+)?/i,
    /^Centre\s+d['’]Éducation\s+Spécialisée\s*(\(CES\))?\s*(d['’]|de\s+|du\s+|des\s+)?/i,
    /^Centre\s+d['’]Education\s+Spécialisée\s*(\(CES\))?\s*(d['’]|de\s+|du\s+|des\s+)?/i,
    /^Crèche\s*[–—-]\s*Garderie\s*(d['’]|de\s+|du\s+|des\s+)?/i,
    /^Pouponnière\s*(de\s+|d['’]|du\s+|des\s+|privée\s+)?/i,
    /^Pouponniere\s*(de\s+|d['’]|du\s+|des\s+|privée\s+)?/i,
    /^Orphelinat\s*(National\s+de\s+Filles\s+de\s+|de\s+Garçons\s+de\s+|de\s+|d['’]|du\s+|des\s+)?/i,
    /^Direction\s+Régionale\s*(\(DR\))?\s*(d['’]|de\s+|du\s+|des\s+)?/i,
  ];

  for (const pat of prefixesToRemove) {
    if (pat.test(clean)) {
      clean = clean.replace(pat, '');
      break;
    }
  }

  // 2. Supprimer les prépositions après un numéro au début (ex: "2 d'Adzope" -> "2 Adzope")
  clean = clean.replace(/^(\d+)\s+(d['’]|de\s+|du\s+|des\s+)/i, '$1 ');

  // 3. Supprimer le préfixe de nature direct s'il est déjà présent au début
  const directNatureRegex = new RegExp(`^${cleanNature}\\s*[-–—:]?\\s*(d['’]|de\\s+|du\\s+|des\\s+)?`, 'i');
  clean = clean.replace(directNatureRegex, '');

  // 4. Supprimer préposition initiale restante éventuelle (d' / de / du / des)
  clean = clean.replace(/^(d['’]|de\s+|du\s+|des\s+)/i, '');

  // 5. Nettoyage final et passage en majuscules
  clean = clean.trim().toUpperCase();

  // 6. Cas des Directions
  if (cleanNature === 'DIRECTION') {
    if (clean.startsWith('DR ') || clean.startsWith('DR-') || clean.startsWith('DRH') || clean.startsWith('CAB')) {
      return clean;
    }
    return `DR ${clean}`;
  }

  // Si le résultat est vide, renvoyer la nature
  if (!clean) return cleanNature;

  return `${cleanNature} ${clean}`;
}
