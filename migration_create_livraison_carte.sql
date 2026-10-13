-- Migration: Création de la table d'enregistrement des quantités de cartes livrées/distribuées par entité
-- Base de données : suivi_carte_scolaire_mffe

BEGIN;

CREATE TABLE IF NOT EXISTS livraison_carte (
    id SERIAL PRIMARY KEY,
    id_entite VARCHAR(50) NOT NULL,
    date_livraison DATE NOT NULL DEFAULT CURRENT_DATE,
    quantite_livree INTEGER NOT NULL CHECK (quantite_livree > 0),
    annee_scolaire VARCHAR(20) DEFAULT '2025-2026',
    destinataire_nom VARCHAR(255),
    destinataire_type VARCHAR(100) DEFAULT 'BENEFICIAIRES',
    reference_decharge VARCHAR(100),
    livreur_nom VARCHAR(255),
    observations TEXT,
    id_user VARCHAR(50),
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_livraison_carte_entite 
        FOREIGN KEY (id_entite) 
        REFERENCES entite(id_entite) 
        ON UPDATE CASCADE 
        ON DELETE RESTRICT,

    CONSTRAINT fk_livraison_carte_user 
        FOREIGN KEY (id_user) 
        REFERENCES "user"(id) 
        ON UPDATE CASCADE 
        ON DELETE SET NULL
);

-- Index pour accélérer les requêtes d'affichage et de filtrage
CREATE INDEX IF NOT EXISTS idx_livraison_carte_entite ON livraison_carte(id_entite);
CREATE INDEX IF NOT EXISTS idx_livraison_carte_date ON livraison_carte(date_livraison);
CREATE INDEX IF NOT EXISTS idx_livraison_carte_annee ON livraison_carte(annee_scolaire);
CREATE INDEX IF NOT EXISTS idx_livraison_carte_user ON livraison_carte(id_user);

-- Vue d'agrégation des livraisons par entité
CREATE OR REPLACE VIEW vue_cumul_livraisons_par_entite AS
SELECT 
    e.id_entite,
    e.nom AS nom_entite,
    e.sigle,
    e.localisation,
    e.id_hierarchisation,
    e.id_nature,
    COALESCE(SUM(l.quantite_livree), 0)::INTEGER AS total_cartes_livrees,
    COUNT(l.id)::INTEGER AS nombre_livraisons_effectuees,
    MAX(l.date_livraison) AS derniere_date_livraison
FROM entite e
LEFT JOIN livraison_carte l ON e.id_entite = l.id_entite
GROUP BY e.id_entite, e.nom, e.sigle, e.localisation, e.id_hierarchisation, e.id_nature;

-- Vue consolidée du bilan des cartes (Reçues vs Livrées vs Stock restant)
CREATE OR REPLACE VIEW vue_bilan_cartes_par_entite AS
WITH recu AS (
    SELECT 
        id_entite, 
        COALESCE(SUM(quantite_recue), 0)::INTEGER AS total_recu,
        COUNT(id)::INTEGER AS nb_receptions,
        MAX(date_reception) AS derniere_reception
    FROM reception_carte
    GROUP BY id_entite
),
livre AS (
    SELECT 
        id_entite, 
        COALESCE(SUM(quantite_livree), 0)::INTEGER AS total_livre,
        COUNT(id)::INTEGER AS nb_livraisons,
        MAX(date_livraison) AS derniere_livraison
    FROM livraison_carte
    GROUP BY id_entite
)
SELECT 
    e.id_entite,
    e.nom AS nom_entite,
    e.sigle,
    e.localisation,
    e.id_hierarchisation,
    e.id_nature,
    COALESCE(r.total_recu, 0) AS total_recu,
    COALESCE(l.total_livre, 0) AS total_livre,
    (COALESCE(r.total_recu, 0) - COALESCE(l.total_livre, 0)) AS solde_stock_disponible,
    ROUND(
        CASE 
            WHEN COALESCE(r.total_recu, 0) > 0 
            THEN (COALESCE(l.total_livre, 0)::NUMERIC / COALESCE(r.total_recu, 0)::NUMERIC) * 100 
            ELSE 0 
        END, 2
    ) AS taux_distribution_pct,
    r.derniere_reception,
    l.derniere_livraison
FROM entite e
LEFT JOIN recu r ON e.id_entite = r.id_entite
LEFT JOIN livre l ON e.id_entite = l.id_entite;

COMMIT;
