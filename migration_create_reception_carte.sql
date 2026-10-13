-- Migration: Création de la table d'enregistrement des réceptions de cartes scolaires
-- Base de données : suivi_carte_scolaire_mffe

BEGIN;

CREATE TABLE IF NOT EXISTS reception_carte (
    id SERIAL PRIMARY KEY,
    id_entite VARCHAR(50) NOT NULL,
    date_reception DATE NOT NULL DEFAULT CURRENT_DATE,
    quantite_recue INTEGER NOT NULL CHECK (quantite_recue > 0),
    annee_scolaire VARCHAR(20) DEFAULT '2025-2026',
    reference_bordereau VARCHAR(100),
    receptionnaire_nom VARCHAR(255),
    observations TEXT,
    id_user VARCHAR(50),
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_reception_carte_entite 
        FOREIGN KEY (id_entite) 
        REFERENCES entite(id_entite) 
        ON UPDATE CASCADE 
        ON DELETE RESTRICT,

    CONSTRAINT fk_reception_carte_user 
        FOREIGN KEY (id_user) 
        REFERENCES "user"(id) 
        ON UPDATE CASCADE 
        ON DELETE SET NULL
);

-- Index pour accélérer les requêtes d'affichage et de filtrage
CREATE INDEX IF NOT EXISTS idx_reception_carte_entite ON reception_carte(id_entite);
CREATE INDEX IF NOT EXISTS idx_reception_carte_date ON reception_carte(date_reception);
CREATE INDEX IF NOT EXISTS idx_reception_carte_annee ON reception_carte(annee_scolaire);
CREATE INDEX IF NOT EXISTS idx_reception_carte_user ON reception_carte(id_user);

-- Vue pratique pour l'application mobile : cumul des cartes reçues par entité
CREATE OR REPLACE VIEW vue_cumul_cartes_par_entite AS
SELECT 
    e.id_entite,
    e.nom AS nom_entite,
    e.sigle,
    e.localisation,
    e.id_hierarchisation,
    e.id_nature,
    COALESCE(SUM(r.quantite_recue), 0)::INTEGER AS total_cartes_recues,
    COUNT(r.id)::INTEGER AS nombre_livraisons,
    MAX(r.date_reception) AS derniere_date_reception
FROM entite e
LEFT JOIN reception_carte r ON e.id_entite = r.id_entite
GROUP BY e.id_entite, e.nom, e.sigle, e.localisation, e.id_hierarchisation, e.id_nature;

COMMIT;
