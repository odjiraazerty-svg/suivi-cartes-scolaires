-- Migration: Création de la table production_carte pour enregistrer la production totale de cartes scolaires
-- Base de données : suivi_carte_scolaire_mffe

BEGIN;

CREATE TABLE IF NOT EXISTS production_carte (
    id SERIAL PRIMARY KEY,
    annee_scolaire VARCHAR(20) NOT NULL DEFAULT '2026-2027',
    quantite_produite INTEGER NOT NULL CHECK (quantite_produite >= 0),
    cout_total NUMERIC(15, 2) DEFAULT 0,
    date_production DATE DEFAULT CURRENT_DATE,
    prestataire VARCHAR(255) DEFAULT 'Imprimerie Nationale / Prestataire MFFE',
    reference_commande VARCHAR(100),
    observations TEXT,
    id_user VARCHAR(50),
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_production_carte_user 
        FOREIGN KEY (id_user) 
        REFERENCES "user"(id) 
        ON UPDATE CASCADE 
        ON DELETE SET NULL
);

-- Insérer une production initiale indicative si la table est vide (ex: 50 000 cartes produites pour 2026-2027)
INSERT INTO production_carte (annee_scolaire, quantite_produite, date_production, observations, id_user)
SELECT '2026-2027', 50000, CURRENT_DATE, 'Campagne nationale des cartes scolaires 2026-2027', '1'
WHERE NOT EXISTS (SELECT 1 FROM production_carte WHERE annee_scolaire = '2026-2027');

COMMIT;
