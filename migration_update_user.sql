-- Migration: Mise à jour de la table "user" et de ses dépendances
-- Champs requis : id (chaine de caractere), email, password_hash, name, role

BEGIN;

-- 1. Supprimer temporairement les contraintes de clés étrangères référençant user(id)
ALTER TABLE entite DROP CONSTRAINT IF EXISTS entite_id_user_fkey;
ALTER TABLE hierarchisation_entite DROP CONSTRAINT IF EXISTS hierarchisation_entite_id_user_fkey;
ALTER TABLE nature_entite DROP CONSTRAINT IF EXISTS nature_entite_id_user_fkey;

-- 2. Supprimer la valeur par défaut liée à la séquence pour permettre un id textuel
ALTER TABLE "user" ALTER COLUMN id DROP DEFAULT;
DROP SEQUENCE IF EXISTS user_id_seq CASCADE;

-- 3. Modifier le type de la colonne id dans "user" en VARCHAR(50)
ALTER TABLE "user" ALTER COLUMN id TYPE VARCHAR(50) USING id::VARCHAR(50);

-- 4. Adapter le type de id_user dans les tables liées
ALTER TABLE entite ALTER COLUMN id_user DROP DEFAULT;
ALTER TABLE entite ALTER COLUMN id_user TYPE VARCHAR(50) USING id_user::VARCHAR(50);
ALTER TABLE entite ALTER COLUMN id_user SET DEFAULT '1';

ALTER TABLE hierarchisation_entite ALTER COLUMN id_user TYPE VARCHAR(50) USING id_user::VARCHAR(50);
ALTER TABLE nature_entite ALTER COLUMN id_user TYPE VARCHAR(50) USING id_user::VARCHAR(50);

-- 5. Renommer la colonne password en password_hash si nécessaire
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' AND table_name = 'user' AND column_name = 'password'
    ) THEN
        ALTER TABLE "user" RENAME COLUMN password TO password_hash;
    END IF;
END $$;

-- 6. Ajouter les colonnes "name" et "role"
ALTER TABLE "user" ADD COLUMN IF NOT EXISTS name VARCHAR(255) DEFAULT 'Administrateur MFFE';
ALTER TABLE "user" ADD COLUMN IF NOT EXISTS role VARCHAR(50) DEFAULT 'ADMIN';

-- 7. S'assurer que les enregistrements existants ont des valeurs par défaut
UPDATE "user" SET 
    name = COALESCE(name, 'Administrateur MFFE'),
    role = COALESCE(role, 'ADMIN')
WHERE id = '1';

-- 8. Recréer les contraintes de clés étrangères
ALTER TABLE entite 
    ADD CONSTRAINT entite_id_user_fkey 
    FOREIGN KEY (id_user) REFERENCES "user"(id) 
    ON UPDATE CASCADE ON DELETE SET NULL;

ALTER TABLE hierarchisation_entite 
    ADD CONSTRAINT hierarchisation_entite_id_user_fkey 
    FOREIGN KEY (id_user) REFERENCES "user"(id) 
    ON UPDATE CASCADE ON DELETE SET NULL;

ALTER TABLE nature_entite 
    ADD CONSTRAINT nature_entite_id_user_fkey 
    FOREIGN KEY (id_user) REFERENCES "user"(id) 
    ON UPDATE CASCADE ON DELETE SET NULL;

COMMIT;
