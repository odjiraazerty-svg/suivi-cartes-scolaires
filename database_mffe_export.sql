--
-- PostgreSQL database dump
--

--

-- Dumped from database version 17.11
-- Dumped by pg_dump version 17.11

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: entite; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.entite (
    id_entite character varying(50) NOT NULL,
    nom character varying(255) NOT NULL,
    sigle character varying(50),
    id_hierarchisation character varying(150) NOT NULL,
    id_entite_parent character varying(50),
    localisation character varying(255) DEFAULT 'Abidjan'::character varying,
    responsable_nom character varying(255),
    actif boolean DEFAULT true,
    id_user character varying(50) DEFAULT '1'::character varying,
    dh_creation timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    id_nature character varying(100)
);


--
-- Name: hierarchisation_entite; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.hierarchisation_entite (
    id_hierarchisation character varying(150) NOT NULL,
    libelle character varying(150) NOT NULL,
    description text,
    actif boolean DEFAULT true,
    id_user character varying(50),
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);


--
-- Name: livraison_carte; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.livraison_carte (
    id integer NOT NULL,
    id_entite character varying(50) NOT NULL,
    date_livraison date DEFAULT CURRENT_DATE NOT NULL,
    quantite_livree integer NOT NULL,
    annee_scolaire character varying(20) DEFAULT '2025-2026'::character varying,
    destinataire_nom character varying(255),
    destinataire_type character varying(100) DEFAULT 'BENEFICIAIRES'::character varying,
    reference_decharge character varying(100),
    livreur_nom character varying(255),
    observations text,
    id_user character varying(50),
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    mode_livraison character varying(100) DEFAULT 'Agent du MFFE'::character varying,
    cout_livraison numeric(12,2) DEFAULT 0,
    receptionne_par character varying(255),
    contact_receptionnaire character varying(100),
    CONSTRAINT livraison_carte_quantite_livree_check CHECK ((quantite_livree > 0))
);


--
-- Name: livraison_carte_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.livraison_carte_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: livraison_carte_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.livraison_carte_id_seq OWNED BY public.livraison_carte.id;


--
-- Name: nature_entite; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.nature_entite (
    id_nature character varying(100) NOT NULL,
    libelle character varying(255) NOT NULL,
    actif boolean DEFAULT true,
    id_user character varying(50),
    dh_creation timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);


--
-- Name: production_carte; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.production_carte (
    id integer NOT NULL,
    annee_scolaire character varying(20) DEFAULT '2026-2027'::character varying NOT NULL,
    quantite_produite integer NOT NULL,
    cout_total numeric(15,2) DEFAULT 0,
    date_production date DEFAULT CURRENT_DATE,
    prestataire character varying(255) DEFAULT 'Imprimerie Nationale / Prestataire MFFE'::character varying,
    reference_commande character varying(100),
    observations text,
    id_user character varying(50),
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT production_carte_quantite_produite_check CHECK ((quantite_produite >= 0))
);


--
-- Name: production_carte_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.production_carte_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: production_carte_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.production_carte_id_seq OWNED BY public.production_carte.id;


--
-- Name: reception_carte; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.reception_carte (
    id integer NOT NULL,
    id_entite character varying(50) NOT NULL,
    date_reception date DEFAULT CURRENT_DATE NOT NULL,
    quantite_recue integer NOT NULL,
    annee_scolaire character varying(20) DEFAULT '2025-2026'::character varying,
    reference_bordereau character varying(100),
    receptionnaire_nom character varying(255),
    observations text,
    id_user character varying(50),
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT reception_carte_quantite_recue_check CHECK ((quantite_recue > 0))
);


--
-- Name: reception_carte_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.reception_carte_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: reception_carte_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.reception_carte_id_seq OWNED BY public.reception_carte.id;


--
-- Name: user; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."user" (
    id character varying(50) NOT NULL,
    email character varying(255) NOT NULL,
    password_hash character varying(255) NOT NULL,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    name character varying(255) DEFAULT 'Administrateur MFFE'::character varying,
    role character varying(50) DEFAULT 'ADMIN'::character varying
);


--
-- Name: vue_bilan_cartes_par_entite; Type: VIEW; Schema: public; Owner: -
--

CREATE VIEW public.vue_bilan_cartes_par_entite AS
 WITH recu AS (
         SELECT reception_carte.id_entite,
            (COALESCE(sum(reception_carte.quantite_recue), (0)::bigint))::integer AS total_recu,
            (count(reception_carte.id))::integer AS nb_receptions,
            max(reception_carte.date_reception) AS derniere_reception
           FROM public.reception_carte
          GROUP BY reception_carte.id_entite
        ), livre AS (
         SELECT livraison_carte.id_entite,
            (COALESCE(sum(livraison_carte.quantite_livree), (0)::bigint))::integer AS total_livre,
            (count(livraison_carte.id))::integer AS nb_livraisons,
            max(livraison_carte.date_livraison) AS derniere_livraison
           FROM public.livraison_carte
          GROUP BY livraison_carte.id_entite
        )
 SELECT e.id_entite,
    e.nom AS nom_entite,
    e.sigle,
    e.localisation,
    e.id_hierarchisation,
    e.id_nature,
    COALESCE(r.total_recu, 0) AS total_recu,
    COALESCE(l.total_livre, 0) AS total_livre,
    (COALESCE(r.total_recu, 0) - COALESCE(l.total_livre, 0)) AS solde_stock_disponible,
    round(
        CASE
            WHEN (COALESCE(r.total_recu, 0) > 0) THEN (((COALESCE(l.total_livre, 0))::numeric / (COALESCE(r.total_recu, 0))::numeric) * (100)::numeric)
            ELSE (0)::numeric
        END, 2) AS taux_distribution_pct,
    r.derniere_reception,
    l.derniere_livraison
   FROM ((public.entite e
     LEFT JOIN recu r ON (((e.id_entite)::text = (r.id_entite)::text)))
     LEFT JOIN livre l ON (((e.id_entite)::text = (l.id_entite)::text)));


--
-- Name: vue_cumul_cartes_par_entite; Type: VIEW; Schema: public; Owner: -
--

CREATE VIEW public.vue_cumul_cartes_par_entite AS
 SELECT e.id_entite,
    e.nom AS nom_entite,
    e.sigle,
    e.localisation,
    e.id_hierarchisation,
    e.id_nature,
    (COALESCE(sum(r.quantite_recue), (0)::bigint))::integer AS total_cartes_recues,
    (count(r.id))::integer AS nombre_livraisons,
    max(r.date_reception) AS derniere_date_reception
   FROM (public.entite e
     LEFT JOIN public.reception_carte r ON (((e.id_entite)::text = (r.id_entite)::text)))
  GROUP BY e.id_entite, e.nom, e.sigle, e.localisation, e.id_hierarchisation, e.id_nature;


--
-- Name: vue_cumul_livraisons_par_entite; Type: VIEW; Schema: public; Owner: -
--

CREATE VIEW public.vue_cumul_livraisons_par_entite AS
 SELECT e.id_entite,
    e.nom AS nom_entite,
    e.sigle,
    e.localisation,
    e.id_hierarchisation,
    e.id_nature,
    (COALESCE(sum(l.quantite_livree), (0)::bigint))::integer AS total_cartes_livrees,
    (count(l.id))::integer AS nombre_livraisons_effectuees,
    max(l.date_livraison) AS derniere_date_livraison
   FROM (public.entite e
     LEFT JOIN public.livraison_carte l ON (((e.id_entite)::text = (l.id_entite)::text)))
  GROUP BY e.id_entite, e.nom, e.sigle, e.localisation, e.id_hierarchisation, e.id_nature;


--
-- Name: livraison_carte id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.livraison_carte ALTER COLUMN id SET DEFAULT nextval('public.livraison_carte_id_seq'::regclass);


--
-- Name: production_carte id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.production_carte ALTER COLUMN id SET DEFAULT nextval('public.production_carte_id_seq'::regclass);


--
-- Name: reception_carte id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.reception_carte ALTER COLUMN id SET DEFAULT nextval('public.reception_carte_id_seq'::regclass);


--
-- Data for Name: entite; Type: TABLE DATA; Schema: public; Owner: -
--

INSERT INTO public.entite (id_entite, nom, sigle, id_hierarchisation, id_entite_parent, localisation, responsable_nom, actif, id_user, dh_creation, id_nature) VALUES ('CAB', 'Cabinet de Madame la Ministre', 'CAB', 'CABINET', NULL, 'Plateau, Immeuble Postel 2001', 'Directeur de Cabinet', true, '1', '2026-09-30 11:38:14.122+00', 'DIRECTION');
INSERT INTO public.entite (id_entite, nom, sigle, id_hierarchisation, id_entite_parent, localisation, responsable_nom, actif, id_user, dh_creation, id_nature) VALUES ('DR-ABJ', 'Direction Régionale Abidjan', 'DR-ABJ', 'DIRECTION_REGIONALE', NULL, 'Abidjan Treichville', 'Mme OUATTARA Aminata', true, '1', '2026-09-30 11:38:14.122+00', 'DIRECTION');
INSERT INTO public.entite (id_entite, nom, sigle, id_hierarchisation, id_entite_parent, localisation, responsable_nom, actif, id_user, dh_creation, id_nature) VALUES ('IG', 'Inspection Générale', 'IG', 'DIRECTION_CENTRALE', NULL, 'Abidjan', NULL, true, '1', '2026-10-05 13:59:10.593+00', 'DIRECTION');
INSERT INTO public.entite (id_entite, nom, sigle, id_hierarchisation, id_entite_parent, localisation, responsable_nom, actif, id_user, dh_creation, id_nature) VALUES ('ACACI', 'Autorité Centrale pour l’Adoption en Côte D’ivoire', 'ACACI', 'AUTORITE_INSTITUTION', NULL, 'Abidjan Cocody', 'Secrétaire Général', true, '1', '2026-10-05 13:59:10.593+00', 'DIRECTION');
INSERT INTO public.entite (id_entite, nom, sigle, id_hierarchisation, id_entite_parent, localisation, responsable_nom, actif, id_user, dh_creation, id_nature) VALUES ('DPGE', 'Direction de la Promotion du Genre et de l’Equité', 'DPGE', 'DIRECTION_CENTRALE', NULL, 'Abidjan', NULL, true, '1', '2026-10-05 13:59:10.593+00', 'DIRECTION');
INSERT INTO public.entite (id_entite, nom, sigle, id_hierarchisation, id_entite_parent, localisation, responsable_nom, actif, id_user, dh_creation, id_nature) VALUES ('DAEF', 'Direction de l’Autonomisation Economique de la Femme', 'DAEF', 'DIRECTION_CENTRALE', NULL, 'Abidjan', NULL, true, '1', '2026-10-05 13:59:10.593+00', 'DIRECTION');
INSERT INTO public.entite (id_entite, nom, sigle, id_hierarchisation, id_entite_parent, localisation, responsable_nom, actif, id_user, dh_creation, id_nature) VALUES ('DF', 'Direction de la Formation', 'DF', 'DIRECTION_CENTRALE', NULL, 'Abidjan', NULL, true, '1', '2026-10-05 13:59:10.593+00', 'DIRECTION');
INSERT INTO public.entite (id_entite, nom, sigle, id_hierarchisation, id_entite_parent, localisation, responsable_nom, actif, id_user, dh_creation, id_nature) VALUES ('DPF', 'Direction de la Promotion de la Famille', 'DPF', 'DIRECTION_CENTRALE', NULL, 'Abidjan', NULL, true, '1', '2026-10-05 13:59:10.593+00', 'DIRECTION');
INSERT INTO public.entite (id_entite, nom, sigle, id_hierarchisation, id_entite_parent, localisation, responsable_nom, actif, id_user, dh_creation, id_nature) VALUES ('DPE', 'Direction de la Protection de l’Enfant', 'DPE', 'DIRECTION_CENTRALE', NULL, 'Abidjan', NULL, true, '1', '2026-10-05 13:59:10.593+00', 'DIRECTION');
INSERT INTO public.entite (id_entite, nom, sigle, id_hierarchisation, id_entite_parent, localisation, responsable_nom, actif, id_user, dh_creation, id_nature) VALUES ('DCAJ', 'Direction du Conseil et des Affaires Juridiques', 'DCAJ', 'AUTORITE_INSTITUTION', 'ACACI', 'Abidjan', NULL, true, '1', '2026-10-05 13:59:10.593+00', 'DIRECTION');
INSERT INTO public.entite (id_entite, nom, sigle, id_hierarchisation, id_entite_parent, localisation, responsable_nom, actif, id_user, dh_creation, id_nature) VALUES ('DEI', 'Direction des Enquêtes et Investigations', 'DEI', 'AUTORITE_INSTITUTION', 'ACACI', 'Abidjan', NULL, true, '1', '2026-10-05 13:59:10.593+00', 'DIRECTION');
INSERT INTO public.entite (id_entite, nom, sigle, id_hierarchisation, id_entite_parent, localisation, responsable_nom, actif, id_user, dh_creation, id_nature) VALUES ('DCDEA', 'Direction de la Coopération, de la Documentation, des Etudes et des Archives', 'DCDEA', 'AUTORITE_INSTITUTION', 'ACACI', 'Abidjan', NULL, true, '1', '2026-10-05 13:59:10.593+00', 'DIRECTION');
INSERT INTO public.entite (id_entite, nom, sigle, id_hierarchisation, id_entite_parent, localisation, responsable_nom, actif, id_user, dh_creation, id_nature) VALUES ('DR AGNEBY-TIASSA', 'Direction Régionale Agnéby-Tiassa', 'DR-AGNEBY-TIASSA', 'DIRECTION_REGIONALE', NULL, 'Agboville', NULL, true, '1', '2026-10-05 13:59:10.593+00', 'DIRECTION');
INSERT INTO public.entite (id_entite, nom, sigle, id_hierarchisation, id_entite_parent, localisation, responsable_nom, actif, id_user, dh_creation, id_nature) VALUES ('DR BAFING', 'Direction Régionale Bafing', 'DR-BAFING', 'DIRECTION_REGIONALE', NULL, 'Touba', NULL, true, '1', '2026-10-05 13:59:10.593+00', 'DIRECTION');
INSERT INTO public.entite (id_entite, nom, sigle, id_hierarchisation, id_entite_parent, localisation, responsable_nom, actif, id_user, dh_creation, id_nature) VALUES ('DR BAGOUE', 'Direction Régionale Bagoué', 'DR-BAGOUE', 'DIRECTION_REGIONALE', NULL, 'Boundiali', NULL, true, '1', '2026-10-05 13:59:10.593+00', 'DIRECTION');
INSERT INTO public.entite (id_entite, nom, sigle, id_hierarchisation, id_entite_parent, localisation, responsable_nom, actif, id_user, dh_creation, id_nature) VALUES ('DR BELIER', 'Direction Régionale Bélier', 'DR-BELIER', 'DIRECTION_REGIONALE', NULL, 'Yamoussoukro', NULL, true, '1', '2026-10-05 13:59:10.593+00', 'DIRECTION');
INSERT INTO public.entite (id_entite, nom, sigle, id_hierarchisation, id_entite_parent, localisation, responsable_nom, actif, id_user, dh_creation, id_nature) VALUES ('DR BERE', 'Direction Régionale Béré', 'DR-BERE', 'DIRECTION_REGIONALE', NULL, 'Mankono', NULL, true, '1', '2026-10-05 13:59:10.593+00', 'DIRECTION');
INSERT INTO public.entite (id_entite, nom, sigle, id_hierarchisation, id_entite_parent, localisation, responsable_nom, actif, id_user, dh_creation, id_nature) VALUES ('DR BOUNKANI', 'Direction Régionale Bounkani', 'DR-BOUNKANI', 'DIRECTION_REGIONALE', NULL, 'Bouna', NULL, true, '1', '2026-10-05 13:59:10.593+00', 'DIRECTION');
INSERT INTO public.entite (id_entite, nom, sigle, id_hierarchisation, id_entite_parent, localisation, responsable_nom, actif, id_user, dh_creation, id_nature) VALUES ('DR CAVALY', 'Direction Régionale Cavally', 'DR-CAVALY', 'DIRECTION_REGIONALE', NULL, 'Guiglo', NULL, true, '1', '2026-10-05 13:59:10.593+00', 'DIRECTION');
INSERT INTO public.entite (id_entite, nom, sigle, id_hierarchisation, id_entite_parent, localisation, responsable_nom, actif, id_user, dh_creation, id_nature) VALUES ('DR FOLON', 'Direction Régionale Folon', 'DR-FOLON', 'DIRECTION_REGIONALE', NULL, 'Minignan', NULL, true, '1', '2026-10-05 13:59:10.593+00', 'DIRECTION');
INSERT INTO public.entite (id_entite, nom, sigle, id_hierarchisation, id_entite_parent, localisation, responsable_nom, actif, id_user, dh_creation, id_nature) VALUES ('DR GBEKE', 'Direction Régionale Gbêkê', 'DR-GBEKE', 'DIRECTION_REGIONALE', NULL, 'Bouaké', NULL, true, '1', '2026-10-05 13:59:10.593+00', 'DIRECTION');
INSERT INTO public.entite (id_entite, nom, sigle, id_hierarchisation, id_entite_parent, localisation, responsable_nom, actif, id_user, dh_creation, id_nature) VALUES ('DR GBOKLE', 'Direction Régionale Gboklê', 'DR-GBOKLE', 'DIRECTION_REGIONALE', NULL, 'Sassandra', NULL, true, '1', '2026-10-05 13:59:10.593+00', 'DIRECTION');
INSERT INTO public.entite (id_entite, nom, sigle, id_hierarchisation, id_entite_parent, localisation, responsable_nom, actif, id_user, dh_creation, id_nature) VALUES ('DR GOH', 'Direction Régionale Goh', 'DR-GOH', 'DIRECTION_REGIONALE', NULL, 'Gagnoa', NULL, true, '1', '2026-10-05 13:59:10.593+00', 'DIRECTION');
INSERT INTO public.entite (id_entite, nom, sigle, id_hierarchisation, id_entite_parent, localisation, responsable_nom, actif, id_user, dh_creation, id_nature) VALUES ('DR GONTOUGO', 'Direction Régionale Gontougo', 'DR-GONTOUGO', 'DIRECTION_REGIONALE', NULL, 'Bondoukou', NULL, true, '1', '2026-10-05 13:59:10.593+00', 'DIRECTION');
INSERT INTO public.entite (id_entite, nom, sigle, id_hierarchisation, id_entite_parent, localisation, responsable_nom, actif, id_user, dh_creation, id_nature) VALUES ('DR GRAND PONT', 'Direction Régionale Grand Pont', 'DR-GRAND PONT', 'DIRECTION_REGIONALE', NULL, 'Dabou', NULL, true, '1', '2026-10-05 13:59:10.593+00', 'DIRECTION');
INSERT INTO public.entite (id_entite, nom, sigle, id_hierarchisation, id_entite_parent, localisation, responsable_nom, actif, id_user, dh_creation, id_nature) VALUES ('SDEC', 'Sous-Direction des Effectifs et des Carrières', 'SDEC', 'SOUS_DIRECTION', 'DRH', 'Plateau, Tour C', 'Mme N''GUESSAN Aya', true, '1', '2026-09-30 11:38:14.122+00', 'DIRECTION');
INSERT INTO public.entite (id_entite, nom, sigle, id_hierarchisation, id_entite_parent, localisation, responsable_nom, actif, id_user, dh_creation, id_nature) VALUES ('DAFP', 'Direction des Affaires Financières et du Patrimoine', 'DAFP', 'DIRECTIONS_SERVICES_RATTACHES', NULL, 'Abidjan', NULL, true, '1', '2026-10-05 13:59:10.593+00', 'DIRECTION');
INSERT INTO public.entite (id_entite, nom, sigle, id_hierarchisation, id_entite_parent, localisation, responsable_nom, actif, id_user, dh_creation, id_nature) VALUES ('DRH', 'Direction des Ressources Humaines', 'DRH', 'DIRECTIONS_SERVICES_RATTACHES', NULL, 'Plateau, Tour C', 'Dr. KOUAME Jean', true, '1', '2026-09-30 11:38:14.122+00', 'DIRECTION');
INSERT INTO public.entite (id_entite, nom, sigle, id_hierarchisation, id_entite_parent, localisation, responsable_nom, actif, id_user, dh_creation, id_nature) VALUES ('DPED', 'Direction de la Planification, des Etudes et de la Documentation', 'DPED', 'DIRECTIONS_SERVICES_RATTACHES', NULL, 'Abidjan', NULL, true, '1', '2026-10-05 13:59:10.593+00', 'DIRECTION');
INSERT INTO public.entite (id_entite, nom, sigle, id_hierarchisation, id_entite_parent, localisation, responsable_nom, actif, id_user, dh_creation, id_nature) VALUES ('DR GUEMON', 'Direction Régionale Guemon', 'DR-GUEMON', 'DIRECTION_REGIONALE', NULL, 'Duékoué', NULL, true, '1', '2026-10-05 13:59:10.593+00', 'DIRECTION');
INSERT INTO public.entite (id_entite, nom, sigle, id_hierarchisation, id_entite_parent, localisation, responsable_nom, actif, id_user, dh_creation, id_nature) VALUES ('DR HAMBOL', 'Direction Régionale Hambol', 'DR-HAMBOL', 'DIRECTION_REGIONALE', NULL, 'Katiola', NULL, true, '1', '2026-10-05 13:59:10.593+00', 'DIRECTION');
INSERT INTO public.entite (id_entite, nom, sigle, id_hierarchisation, id_entite_parent, localisation, responsable_nom, actif, id_user, dh_creation, id_nature) VALUES ('DR KABADOUGOU', 'Direction Régionale Kabadougou', 'DR-KABADOUGOU', 'DIRECTION_REGIONALE', NULL, 'Odienné', NULL, true, '1', '2026-10-05 13:59:10.593+00', 'DIRECTION');
INSERT INTO public.entite (id_entite, nom, sigle, id_hierarchisation, id_entite_parent, localisation, responsable_nom, actif, id_user, dh_creation, id_nature) VALUES ('DR IFFOU', 'Direction Régionale Iffou', 'DR-IFFOU', 'DIRECTION_REGIONALE', NULL, 'Daoukro', NULL, true, '1', '2026-10-05 13:59:10.593+00', 'DIRECTION');
INSERT INTO public.entite (id_entite, nom, sigle, id_hierarchisation, id_entite_parent, localisation, responsable_nom, actif, id_user, dh_creation, id_nature) VALUES ('DR INDENIE-DJUABLIN', 'Direction Régionale Indénié-Djuablin', 'DR-INDENIE-DJUABLIN', 'DIRECTION_REGIONALE', NULL, 'Abengourou', NULL, true, '1', '2026-10-05 13:59:10.593+00', 'DIRECTION');
INSERT INTO public.entite (id_entite, nom, sigle, id_hierarchisation, id_entite_parent, localisation, responsable_nom, actif, id_user, dh_creation, id_nature) VALUES ('DR HAUT SASSANDRA', 'Direction Régionale Haut Sassandra', 'DR-HAUT SASSANDRA', 'DIRECTION_REGIONALE', NULL, 'Daloa', NULL, true, '1', '2026-10-05 13:59:10.593+00', 'DIRECTION');
INSERT INTO public.entite (id_entite, nom, sigle, id_hierarchisation, id_entite_parent, localisation, responsable_nom, actif, id_user, dh_creation, id_nature) VALUES ('DR LOH-DJIBOUA', 'Direction Régionale Loh-Djiboua', 'DR-LOH-DJIBOUA', 'DIRECTION_REGIONALE', NULL, 'Divo', NULL, true, '1', '2026-10-05 13:59:10.593+00', 'DIRECTION');
INSERT INTO public.entite (id_entite, nom, sigle, id_hierarchisation, id_entite_parent, localisation, responsable_nom, actif, id_user, dh_creation, id_nature) VALUES ('DR ME', 'Direction Régionale Me', 'DR-ME', 'DIRECTION_REGIONALE', NULL, 'Adzopé', NULL, true, '1', '2026-10-05 13:59:10.593+00', 'DIRECTION');
INSERT INTO public.entite (id_entite, nom, sigle, id_hierarchisation, id_entite_parent, localisation, responsable_nom, actif, id_user, dh_creation, id_nature) VALUES ('DR MORONOU', 'Direction Régionale Moronou', 'DR-MORONOU', 'DIRECTION_REGIONALE', NULL, 'Bongouanou', NULL, true, '1', '2026-10-05 13:59:10.593+00', 'DIRECTION');
INSERT INTO public.entite (id_entite, nom, sigle, id_hierarchisation, id_entite_parent, localisation, responsable_nom, actif, id_user, dh_creation, id_nature) VALUES ('DR N’ZI', 'Direction Régionale N’zi', 'DR-N’ZI', 'DIRECTION_REGIONALE', NULL, 'Dimbokro', NULL, true, '1', '2026-10-05 13:59:10.593+00', 'DIRECTION');
INSERT INTO public.entite (id_entite, nom, sigle, id_hierarchisation, id_entite_parent, localisation, responsable_nom, actif, id_user, dh_creation, id_nature) VALUES ('DR PORO', 'Direction Régionale Poro', 'DR-PORO', 'DIRECTION_REGIONALE', NULL, 'Korhogo', NULL, true, '1', '2026-10-05 13:59:10.593+00', 'DIRECTION');
INSERT INTO public.entite (id_entite, nom, sigle, id_hierarchisation, id_entite_parent, localisation, responsable_nom, actif, id_user, dh_creation, id_nature) VALUES ('DR SAN PEDRO', 'Direction Régionale San Pedro', 'DR-SAN PEDRO', 'DIRECTION_REGIONALE', NULL, 'San-Pédro', NULL, true, '1', '2026-10-05 13:59:10.593+00', 'DIRECTION');
INSERT INTO public.entite (id_entite, nom, sigle, id_hierarchisation, id_entite_parent, localisation, responsable_nom, actif, id_user, dh_creation, id_nature) VALUES ('CMS', 'Cellule Médico-Sociale', 'CMS', 'PROGRAMMES_CELLULES', NULL, 'Abidjan', NULL, true, '1', '2026-10-05 13:59:10.593+00', 'CELLULE');
INSERT INTO public.entite (id_entite, nom, sigle, id_hierarchisation, id_entite_parent, localisation, responsable_nom, actif, id_user, dh_creation, id_nature) VALUES ('DR SUD-COMOE', 'Direction Régionale Sud-Comoe', 'DR-SUD-COMOE', 'DIRECTION_REGIONALE', NULL, 'Aboisso', NULL, true, '1', '2026-10-05 13:59:10.593+00', 'DIRECTION');
INSERT INTO public.entite (id_entite, nom, sigle, id_hierarchisation, id_entite_parent, localisation, responsable_nom, actif, id_user, dh_creation, id_nature) VALUES ('DR TCHOLOGO', 'Direction Régionale Tchologo', 'DR-TCHOLOGO', 'DIRECTION_REGIONALE', NULL, 'Ferkessédougou', NULL, true, '1', '2026-10-05 13:59:10.593+00', 'DIRECTION');
INSERT INTO public.entite (id_entite, nom, sigle, id_hierarchisation, id_entite_parent, localisation, responsable_nom, actif, id_user, dh_creation, id_nature) VALUES ('DR TONKPI', 'Direction Régionale Tonkpi', 'DR-TONKPI', 'DIRECTION_REGIONALE', NULL, 'Man', NULL, true, '1', '2026-10-05 13:59:10.593+00', 'DIRECTION');
INSERT INTO public.entite (id_entite, nom, sigle, id_hierarchisation, id_entite_parent, localisation, responsable_nom, actif, id_user, dh_creation, id_nature) VALUES ('DR WORODOUGOU', 'Direction Régionale Worodougou', 'DR-WORODOUGOU', 'DIRECTION_REGIONALE', NULL, 'Séguéla', NULL, true, '1', '2026-10-05 13:59:10.593+00', 'DIRECTION');
INSERT INTO public.entite (id_entite, nom, sigle, id_hierarchisation, id_entite_parent, localisation, responsable_nom, actif, id_user, dh_creation, id_nature) VALUES ('DR NAWA', 'Direction Régionale Nawa', 'DR-NAWA', 'DIRECTION_REGIONALE', NULL, 'Soubré', NULL, true, '1', '2026-10-05 13:59:10.593+00', 'DIRECTION');
INSERT INTO public.entite (id_entite, nom, sigle, id_hierarchisation, id_entite_parent, localisation, responsable_nom, actif, id_user, dh_creation, id_nature) VALUES ('DR MARAHOUE', 'Direction Régionale Marahoué', 'DR-MARAHOUE', 'DIRECTION_REGIONALE', NULL, 'Bouaflé', NULL, true, '1', '2026-10-05 13:59:10.593+00', 'DIRECTION');
INSERT INTO public.entite (id_entite, nom, sigle, id_hierarchisation, id_entite_parent, localisation, responsable_nom, actif, id_user, dh_creation, id_nature) VALUES ('DR ABIDJAN', 'Direction Régionale Abidjan', 'DR-ABIDJAN', 'DIRECTION_REGIONALE', NULL, 'Abidjan', NULL, true, '1', '2026-10-05 13:59:10.593+00', 'DIRECTION');
INSERT INTO public.entite (id_entite, nom, sigle, id_hierarchisation, id_entite_parent, localisation, responsable_nom, actif, id_user, dh_creation, id_nature) VALUES ('DAJCI', 'Direction des affaires Juridiques et de la Coopération Internationale', 'DAJCI', 'DIRECTIONS_SERVICES_RATTACHES', NULL, 'Abidjan', NULL, true, '1', '2026-10-05 13:59:10.593+00', 'DIRECTION');
INSERT INTO public.entite (id_entite, nom, sigle, id_hierarchisation, id_entite_parent, localisation, responsable_nom, actif, id_user, dh_creation, id_nature) VALUES ('DSI', 'Direction des Systèmes d’Information', 'DSI', 'DIRECTIONS_SERVICES_RATTACHES', NULL, 'Abidjan', NULL, true, '1', '2026-10-05 13:59:10.593+00', 'DIRECTION');
INSERT INTO public.entite (id_entite, nom, sigle, id_hierarchisation, id_entite_parent, localisation, responsable_nom, actif, id_user, dh_creation, id_nature) VALUES ('DQ', 'Direction de la Qualité', 'DQ', 'DIRECTIONS_SERVICES_RATTACHES', NULL, 'Abidjan', NULL, true, '1', '2026-10-05 13:59:10.593+00', 'DIRECTION');
INSERT INTO public.entite (id_entite, nom, sigle, id_hierarchisation, id_entite_parent, localisation, responsable_nom, actif, id_user, dh_creation, id_nature) VALUES ('IFEF YABLASSOU', 'Institution de Formation et d''Éducation Féminine de Yablassou', 'IFEF', 'IFEF', 'DR GBEKE', 'SAKASSOU', NULL, true, '1', '2026-10-11 22:30:51.23+00', 'IFEF');
INSERT INTO public.entite (id_entite, nom, sigle, id_hierarchisation, id_entite_parent, localisation, responsable_nom, actif, id_user, dh_creation, id_nature) VALUES ('DCESCSPPECSE', 'Direction de la Coordination des Etablissements et Services à Caractère Social de Protection de la Petite Enfance et des Complexes Socio-éducatifs', 'DCESCSPPECSE', 'DIRECTIONS_SERVICES_RATTACHES', NULL, 'Abidjan', NULL, true, '1', '2026-10-05 13:59:10.593+00', 'DIRECTION');
INSERT INTO public.entite (id_entite, nom, sigle, id_hierarchisation, id_entite_parent, localisation, responsable_nom, actif, id_user, dh_creation, id_nature) VALUES ('SCRP', 'Service de la Communication et des Relations Publiques', 'SCRP', 'DIRECTIONS_SERVICES_RATTACHES', NULL, 'Abidjan', NULL, true, '1', '2026-10-05 13:59:10.593+00', 'DIRECTION');
INSERT INTO public.entite (id_entite, nom, sigle, id_hierarchisation, id_entite_parent, localisation, responsable_nom, actif, id_user, dh_creation, id_nature) VALUES ('CPMP', 'Cellule de Passation des Marchés Publics', 'CPMP', 'DIRECTIONS_SERVICES_RATTACHES', NULL, 'Abidjan', NULL, true, '1', '2026-10-05 13:59:10.593+00', 'DIRECTION');
INSERT INTO public.entite (id_entite, nom, sigle, id_hierarchisation, id_entite_parent, localisation, responsable_nom, actif, id_user, dh_creation, id_nature) VALUES ('SGP', 'Service de Gestion du Patrimoine', 'SGP', 'DIRECTIONS_SERVICES_RATTACHES', NULL, 'Abidjan', NULL, true, '1', '2026-10-05 13:59:10.593+00', 'DIRECTION');
INSERT INTO public.entite (id_entite, nom, sigle, id_hierarchisation, id_entite_parent, localisation, responsable_nom, actif, id_user, dh_creation, id_nature) VALUES ('PNOEV', 'Programme National de Prise en Charge des Orphelins et Autres Enfants Rendus Vulnérables du fait du VIH/SIDA', 'PNOEV', 'PROGRAMMES_CELLULES', NULL, 'Abidjan', NULL, true, '1', '2026-10-05 13:59:10.593+00', 'PROGRAMME');
INSERT INTO public.entite (id_entite, nom, sigle, id_hierarchisation, id_entite_parent, localisation, responsable_nom, actif, id_user, dh_creation, id_nature) VALUES ('PPEAV', 'Programme de Protection des Enfants et Adolescents Vulnérables', 'PPEAV', 'PROGRAMMES_CELLULES', NULL, 'Abidjan', NULL, true, '1', '2026-10-05 13:59:10.593+00', 'PROGRAMME');
INSERT INTO public.entite (id_entite, nom, sigle, id_hierarchisation, id_entite_parent, localisation, responsable_nom, actif, id_user, dh_creation, id_nature) VALUES ('CNLTEE', 'Comité National de Lutte Contre la Traite et l’Exploitation des Enfants', 'CNLTEE', 'PROGRAMMES_CELLULES', NULL, 'Abidjan', NULL, true, '1', '2026-10-05 13:59:10.593+00', 'COMITE');
INSERT INTO public.entite (id_entite, nom, sigle, id_hierarchisation, id_entite_parent, localisation, responsable_nom, actif, id_user, dh_creation, id_nature) VALUES ('PNLVBG', 'Programme National de Lutte contre les Violences Basées sur le Genre', 'PNLVBG', 'PROGRAMMES_CELLULES', NULL, 'Abidjan', NULL, true, '1', '2026-10-05 13:59:10.593+00', 'PROGRAMME');
INSERT INTO public.entite (id_entite, nom, sigle, id_hierarchisation, id_entite_parent, localisation, responsable_nom, actif, id_user, dh_creation, id_nature) VALUES ('PGNFNFD', 'Projet de Gestion Novatrice du Fonds National Femme et Développement', 'PGNFNFD', 'PROGRAMMES_CELLULES', NULL, 'Abidjan', NULL, true, '1', '2026-10-05 13:59:10.593+00', 'PROGRAMME');
INSERT INTO public.entite (id_entite, nom, sigle, id_hierarchisation, id_entite_parent, localisation, responsable_nom, actif, id_user, dh_creation, id_nature) VALUES ('USIFEM', 'Usines des Femmes de Côte D’ivoire', 'USIFEM', 'PROGRAMMES_CELLULES', NULL, 'Abidjan', NULL, true, '1', '2026-10-05 13:59:10.593+00', 'DIRECTION');
INSERT INTO public.entite (id_entite, nom, sigle, id_hierarchisation, id_entite_parent, localisation, responsable_nom, actif, id_user, dh_creation, id_nature) VALUES ('IFEF BINGERVILLE', 'Institution de Formation et d''Éducation Féminine de Bingerville', 'IFEF', 'IFEF', 'DR ABIDJAN', 'BINGERVILLE', NULL, true, '1', '2026-10-11 22:30:51.23+00', 'IFEF');
INSERT INTO public.entite (id_entite, nom, sigle, id_hierarchisation, id_entite_parent, localisation, responsable_nom, actif, id_user, dh_creation, id_nature) VALUES ('CPPE DJAKO DJOMAN AZITO', 'Centre de Protection de la Petite Enfance de Djako Djoman Azito', 'CPPE', 'CPPE', 'DR ABIDJAN', 'YOPOUGON', NULL, true, '1', '2026-10-11 22:30:51.23+00', 'CPPE');
INSERT INTO public.entite (id_entite, nom, sigle, id_hierarchisation, id_entite_parent, localisation, responsable_nom, actif, id_user, dh_creation, id_nature) VALUES ('CACE GBAGBA ESPOIR', 'Centre d''Action Communautaire pour l''Enfance de Gbagba Espoir', 'CACE', 'CACE', 'DR ABIDJAN', 'BINGERVILLE', NULL, true, '1', '2026-10-11 22:30:51.23+00', 'CACE');
INSERT INTO public.entite (id_entite, nom, sigle, id_hierarchisation, id_entite_parent, localisation, responsable_nom, actif, id_user, dh_creation, id_nature) VALUES ('CPPE BOUAKE KOKO', 'Centre de Protection de la Petite Enfance Bouake Koko', 'CPPE', 'CPPE', 'DR GBEKE', 'BOUAKE', NULL, true, '1', '2026-10-11 22:30:51.23+00', 'CPPE');
INSERT INTO public.entite (id_entite, nom, sigle, id_hierarchisation, id_entite_parent, localisation, responsable_nom, actif, id_user, dh_creation, id_nature) VALUES ('IFEF  YAMOUSSOUKRO', 'Institution de Formation et d''Éducation Féminine Yamoussoukro', 'IFEF', 'IFEF', 'DR BELIER', 'YAMOUSSOUKRO', NULL, true, '1', '2026-10-11 22:30:51.23+00', 'IFEF');
INSERT INTO public.entite (id_entite, nom, sigle, id_hierarchisation, id_entite_parent, localisation, responsable_nom, actif, id_user, dh_creation, id_nature) VALUES ('IFEF DABOU', 'Institution de Formation et d''Éducation Féminine de Dabou', 'IFEF', 'IFEF', 'DR GRAND PONT', 'DABOU', NULL, true, '1', '2026-10-11 22:30:51.23+00', 'IFEF');
INSERT INTO public.entite (id_entite, nom, sigle, id_hierarchisation, id_entite_parent, localisation, responsable_nom, actif, id_user, dh_creation, id_nature) VALUES ('CPPE OGHLWAPO', 'Centre de Protection de la Petite Enfance Oghlwapo', 'CPPE', 'CPPE', 'DR ME', 'OGHLWAPO', NULL, true, '1', '2026-10-11 22:30:51.23+00', 'CPPE');
INSERT INTO public.entite (id_entite, nom, sigle, id_hierarchisation, id_entite_parent, localisation, responsable_nom, actif, id_user, dh_creation, id_nature) VALUES ('IFEF MONTEZO', 'Institution de Formation et d''Éducation Féminine de Montezo', 'IFEF', 'IFEF', 'DR ME', 'MONTEZO', NULL, true, '1', '2026-10-11 22:30:51.23+00', 'IFEF');
INSERT INTO public.entite (id_entite, nom, sigle, id_hierarchisation, id_entite_parent, localisation, responsable_nom, actif, id_user, dh_creation, id_nature) VALUES ('IFEF LAKOTA', 'Institution de Formation et d''Éducation Féminine de Lakota', 'IFEF', 'IFEF', 'DR LOH-DJIBOUA', 'LAKOTA', NULL, true, '1', '2026-10-11 22:30:51.23+00', 'IFEF');
INSERT INTO public.entite (id_entite, nom, sigle, id_hierarchisation, id_entite_parent, localisation, responsable_nom, actif, id_user, dh_creation, id_nature) VALUES ('IFEF ZIKISSO', 'Institution de Formation et d''Éducation Féminine de Zikisso', 'IFEF', 'IFEF', 'DR LOH-DJIBOUA', 'ZIKISSO', NULL, true, '1', '2026-10-11 22:30:51.23+00', 'IFEF');
INSERT INTO public.entite (id_entite, nom, sigle, id_hierarchisation, id_entite_parent, localisation, responsable_nom, actif, id_user, dh_creation, id_nature) VALUES ('IFEF MOOSSOU', 'Institution de Formation et d''Éducation Féminine de Moossou', 'IFEF', 'IFEF', 'DR SUD-COMOE', 'MOOSSOU', NULL, true, '1', '2026-10-11 22:30:51.23+00', 'IFEF');
INSERT INTO public.entite (id_entite, nom, sigle, id_hierarchisation, id_entite_parent, localisation, responsable_nom, actif, id_user, dh_creation, id_nature) VALUES ('IFEF BONOUA', 'Institution de Formation et d''Éducation Féminine de Bonoua', 'IFEF', 'IFEF', 'DR SUD-COMOE', 'BONOUA', NULL, true, '1', '2026-10-11 22:30:51.23+00', 'IFEF');
INSERT INTO public.entite (id_entite, nom, sigle, id_hierarchisation, id_entite_parent, localisation, responsable_nom, actif, id_user, dh_creation, id_nature) VALUES ('CPPE VAVOUA', 'Centre de Protection de la Petite Enfance de Vavoua', 'CPPE', 'CPPE', 'DR HAUT SASSANDRA', 'VAVOUA', NULL, true, '1', '2026-10-11 22:30:51.23+00', 'CPPE');
INSERT INTO public.entite (id_entite, nom, sigle, id_hierarchisation, id_entite_parent, localisation, responsable_nom, actif, id_user, dh_creation, id_nature) VALUES ('CSE KORHOGO', 'Complexe Socio-Éducatif de Korhogo', 'CSE', 'COMPLEXE_SOCIO_EDUCATIF', 'DR PORO', 'KORHOGO', NULL, true, '1', '2026-10-11 22:30:51.23+00', 'CSE');
INSERT INTO public.entite (id_entite, nom, sigle, id_hierarchisation, id_entite_parent, localisation, responsable_nom, actif, id_user, dh_creation, id_nature) VALUES ('CES 1 KORHOGO', 'Centre d''Éducation Specialisée 1 de Korhogo', 'CES', 'CES', 'DR PORO', 'KORHOGO', NULL, true, '1', '2026-10-11 22:30:51.23+00', 'CES');
INSERT INTO public.entite (id_entite, nom, sigle, id_hierarchisation, id_entite_parent, localisation, responsable_nom, actif, id_user, dh_creation, id_nature) VALUES ('CS KORHOGO', 'Centre Social de Korhogo', 'CS', 'CS', 'DR PORO', 'KORHOGO', NULL, true, '1', '2026-10-11 22:30:51.23+00', 'CS');
INSERT INTO public.entite (id_entite, nom, sigle, id_hierarchisation, id_entite_parent, localisation, responsable_nom, actif, id_user, dh_creation, id_nature) VALUES ('CPPE KORHOGO', 'Centre de Protection de la Petite Enfance de Korhogo', 'CPPE', 'CPPE', 'DR PORO', 'KORHOGO', NULL, true, '1', '2026-10-11 22:30:51.23+00', 'CPPE');
INSERT INTO public.entite (id_entite, nom, sigle, id_hierarchisation, id_entite_parent, localisation, responsable_nom, actif, id_user, dh_creation, id_nature) VALUES ('CSE SIRASSO', 'Complexe Socio-Éducatif de Sirasso', 'CSE', 'COMPLEXE_SOCIO_EDUCATIF', 'DR PORO', 'SIRASSO', NULL, true, '1', '2026-10-11 22:30:51.23+00', 'CSE');
INSERT INTO public.entite (id_entite, nom, sigle, id_hierarchisation, id_entite_parent, localisation, responsable_nom, actif, id_user, dh_creation, id_nature) VALUES ('IFEF KAGBOLODOUGOU', 'Institution de Formation et d''Éducation Féminine de Kagbolodougou', 'IFEF', 'IFEF', 'DR PORO', 'KAGBOLODOUGOU', NULL, true, '1', '2026-10-11 22:30:51.23+00', 'IFEF');
INSERT INTO public.entite (id_entite, nom, sigle, id_hierarchisation, id_entite_parent, localisation, responsable_nom, actif, id_user, dh_creation, id_nature) VALUES ('CS KAGBOLODOUGOU', 'Centre Social de Kagbolodougou', 'CS', 'CS', 'DR PORO', 'KAGBOLODOUGOU', NULL, true, '1', '2026-10-11 22:30:51.23+00', 'CS');
INSERT INTO public.entite (id_entite, nom, sigle, id_hierarchisation, id_entite_parent, localisation, responsable_nom, actif, id_user, dh_creation, id_nature) VALUES ('IFEF KORHOGO', 'Institution de Formation et d''Éducation Féminine de Korhogo', 'IFEF', 'IFEF', 'DR PORO', 'KORHOGO', NULL, true, '1', '2026-10-11 22:30:51.23+00', 'IFEF');
INSERT INTO public.entite (id_entite, nom, sigle, id_hierarchisation, id_entite_parent, localisation, responsable_nom, actif, id_user, dh_creation, id_nature) VALUES ('IFEF SINEMATIALI', 'Institution de Formation et d''Éducation Féminine de Sinematiali', 'IFEF', 'IFEF', 'DR PORO', 'KORHOGO', NULL, true, '1', '2026-10-11 22:30:51.23+00', 'IFEF');
INSERT INTO public.entite (id_entite, nom, sigle, id_hierarchisation, id_entite_parent, localisation, responsable_nom, actif, id_user, dh_creation, id_nature) VALUES ('IFEF GUIEMBE', 'Institution de Formation et d''Éducation Féminine de Guiembe', 'IFEF', 'IFEF', 'DR PORO', 'GUIEMBE', NULL, true, '1', '2026-10-11 22:30:51.23+00', 'IFEF');
INSERT INTO public.entite (id_entite, nom, sigle, id_hierarchisation, id_entite_parent, localisation, responsable_nom, actif, id_user, dh_creation, id_nature) VALUES ('IFEF NIOFOIN', 'Institution de Formation et d''Éducation Féminine de Niofoin', 'IFEF', 'IFEF', 'DR PORO', 'NIOFOIN', NULL, true, '1', '2026-10-11 22:30:51.23+00', 'IFEF');
INSERT INTO public.entite (id_entite, nom, sigle, id_hierarchisation, id_entite_parent, localisation, responsable_nom, actif, id_user, dh_creation, id_nature) VALUES ('IFEF DUEKOUE', 'Institution de Formation et d''Éducation Féminine de Duekoue', 'IFEF', 'IFEF', 'DR GUEMON', 'DUEKOUE', NULL, true, '1', '2026-10-11 22:30:51.23+00', 'IFEF');
INSERT INTO public.entite (id_entite, nom, sigle, id_hierarchisation, id_entite_parent, localisation, responsable_nom, actif, id_user, dh_creation, id_nature) VALUES ('CSE DUEKOUE', 'Complexe Socio-Éducatif de Duekoue', 'CSE', 'COMPLEXE_SOCIO_EDUCATIF', 'DR GUEMON', 'DUEKOUE', NULL, true, '1', '2026-10-11 22:30:51.23+00', 'CSE');
INSERT INTO public.entite (id_entite, nom, sigle, id_hierarchisation, id_entite_parent, localisation, responsable_nom, actif, id_user, dh_creation, id_nature) VALUES ('CSE BANGOLO', 'Complexe Socio-Éducatif de Bangolo', 'CSE', 'COMPLEXE_SOCIO_EDUCATIF', 'DR GUEMON', 'BANGOLO', NULL, true, '1', '2026-10-11 22:30:51.23+00', 'CSE');
INSERT INTO public.entite (id_entite, nom, sigle, id_hierarchisation, id_entite_parent, localisation, responsable_nom, actif, id_user, dh_creation, id_nature) VALUES ('CT BOUAKE KOKO', 'Centre de Transit Bouake Koko', 'CT', 'CT', 'DR GBEKE', 'BOUAKE', NULL, true, '1', '2026-10-11 22:30:51.23+00', 'CT');
INSERT INTO public.entite (id_entite, nom, sigle, id_hierarchisation, id_entite_parent, localisation, responsable_nom, actif, id_user, dh_creation, id_nature) VALUES ('CSE BOUAKE KOKO', 'Complexe Socio-Éducatif Bouake Koko', 'CSE', 'COMPLEXE_SOCIO_EDUCATIF', 'DR GBEKE', 'BOUAKE', NULL, true, '1', '2026-10-11 22:30:51.23+00', 'CSE');
INSERT INTO public.entite (id_entite, nom, sigle, id_hierarchisation, id_entite_parent, localisation, responsable_nom, actif, id_user, dh_creation, id_nature) VALUES ('CS BOUAKE KOKO', 'Centre Social de Bouake Koko', 'CS', 'CS', 'DR GBEKE', 'BOUAKE', NULL, true, '1', '2026-10-11 22:30:51.23+00', 'CS');
INSERT INTO public.entite (id_entite, nom, sigle, id_hierarchisation, id_entite_parent, localisation, responsable_nom, actif, id_user, dh_creation, id_nature) VALUES ('CES BOUAKE KOKO', 'Centre d''Éducation Spécialisée Bouake Koko', 'CES', 'CES', 'DR GBEKE', 'BOUAKE', NULL, true, '1', '2026-10-11 22:30:51.23+00', 'CES');
INSERT INTO public.entite (id_entite, nom, sigle, id_hierarchisation, id_entite_parent, localisation, responsable_nom, actif, id_user, dh_creation, id_nature) VALUES ('CSE BEOUMI', 'Complexe Socio-Éducatif de Beoumi', 'CSE', 'COMPLEXE_SOCIO_EDUCATIF', 'DR GBEKE', 'BOUAKE', NULL, true, '1', '2026-10-11 22:30:51.23+00', 'CSE');
INSERT INTO public.entite (id_entite, nom, sigle, id_hierarchisation, id_entite_parent, localisation, responsable_nom, actif, id_user, dh_creation, id_nature) VALUES ('CES BEOUMI', 'Centre d''Éducation Spécialisée de Beoumi', 'CES', 'CES', 'DR GBEKE', 'BOUAKE', NULL, true, '1', '2026-10-11 22:30:51.23+00', 'CES');
INSERT INTO public.entite (id_entite, nom, sigle, id_hierarchisation, id_entite_parent, localisation, responsable_nom, actif, id_user, dh_creation, id_nature) VALUES ('POUPONNIERE BOUAKE', 'Direction Pouponnière de Bouake', 'POUPONNIERE', 'POUPONNIERE', 'DR GBEKE', 'BOUAKE', NULL, true, '1', '2026-10-11 22:30:51.23+00', 'POUPONNIERE');
INSERT INTO public.entite (id_entite, nom, sigle, id_hierarchisation, id_entite_parent, localisation, responsable_nom, actif, id_user, dh_creation, id_nature) VALUES ('CPPE BOUAKE', 'Centre de Protection de la Petite Enfance de Bouake', 'CPPE', 'CPPE', 'DR GBEKE', 'BOUAKE', NULL, true, '1', '2026-10-11 22:30:51.23+00', 'CPPE');
INSERT INTO public.entite (id_entite, nom, sigle, id_hierarchisation, id_entite_parent, localisation, responsable_nom, actif, id_user, dh_creation, id_nature) VALUES ('IFEF AIR FRANCE', 'Institution de Formation et d''Éducation Féminine de Air France', 'IFEF', 'IFEF', 'DR GBEKE', 'BOUAKE', NULL, true, '1', '2026-10-11 22:30:51.23+00', 'IFEF');
INSERT INTO public.entite (id_entite, nom, sigle, id_hierarchisation, id_entite_parent, localisation, responsable_nom, actif, id_user, dh_creation, id_nature) VALUES ('IFEF AIR FRANCE BOUAKE', 'Institution de Formation et d''Éducation Féminine de Air France Bouake', 'IFEF', 'IFEF', 'DR GBEKE', 'BOUAKE', NULL, true, '1', '2026-10-11 22:30:51.23+00', 'IFEF');
INSERT INTO public.entite (id_entite, nom, sigle, id_hierarchisation, id_entite_parent, localisation, responsable_nom, actif, id_user, dh_creation, id_nature) VALUES ('IFEF BOUAKE KOKO', 'Institution de Formation et d''Éducation Féminine de Bouake Koko', 'IFEF', 'IFEF', 'DR GBEKE', 'BOUAKE', NULL, true, '1', '2026-10-11 22:30:51.23+00', 'IFEF');
INSERT INTO public.entite (id_entite, nom, sigle, id_hierarchisation, id_entite_parent, localisation, responsable_nom, actif, id_user, dh_creation, id_nature) VALUES ('IFEF BOTRO', 'Institution de Formation et d''Éducation Féminine de Botro', 'IFEF', 'IFEF', 'DR GBEKE', 'BOTRO', NULL, true, '1', '2026-10-11 22:30:51.23+00', 'IFEF');
INSERT INTO public.entite (id_entite, nom, sigle, id_hierarchisation, id_entite_parent, localisation, responsable_nom, actif, id_user, dh_creation, id_nature) VALUES ('IFEF DIABO', 'Institution de Formation et d''Éducation Féminine de Diabo', 'IFEF', 'IFEF', 'DR GBEKE', 'DIABO', NULL, true, '1', '2026-10-11 22:30:51.23+00', 'IFEF');
INSERT INTO public.entite (id_entite, nom, sigle, id_hierarchisation, id_entite_parent, localisation, responsable_nom, actif, id_user, dh_creation, id_nature) VALUES ('IFEF KONEHINOU', 'Institution de Formation et d''Éducation Féminine de Konehinou', 'IFEF', 'IFEF', 'DR GBEKE', 'LANGUIBONOU', NULL, true, '1', '2026-10-11 22:30:51.23+00', 'IFEF');
INSERT INTO public.entite (id_entite, nom, sigle, id_hierarchisation, id_entite_parent, localisation, responsable_nom, actif, id_user, dh_creation, id_nature) VALUES ('IFEF BEOUMI', 'Institution de Formation et d''Éducation Féminine de Beoumi', 'IFEF', 'IFEF', 'DR GBEKE', 'BEOUMI', NULL, true, '1', '2026-10-11 22:30:51.23+00', 'IFEF');
INSERT INTO public.entite (id_entite, nom, sigle, id_hierarchisation, id_entite_parent, localisation, responsable_nom, actif, id_user, dh_creation, id_nature) VALUES ('CPPE DJEBONOUA', 'Centre de Protection de la Petite Enfance de Djebonoua', 'CPPE', 'CPPE', 'DR GBEKE', 'DJEBONOUA', NULL, true, '1', '2026-10-11 22:30:51.23+00', 'CPPE');
INSERT INTO public.entite (id_entite, nom, sigle, id_hierarchisation, id_entite_parent, localisation, responsable_nom, actif, id_user, dh_creation, id_nature) VALUES ('IFEF YAMOUSSOUKRO', 'Institution de Formation et d''Éducation Féminine de Yamoussoukro', 'IFEF', 'IFEF', 'DR BELIER', 'YAMOUSSOUKRO', NULL, true, '1', '2026-10-11 22:30:51.23+00', 'IFEF');
INSERT INTO public.entite (id_entite, nom, sigle, id_hierarchisation, id_entite_parent, localisation, responsable_nom, actif, id_user, dh_creation, id_nature) VALUES ('IFEF TOUMODI', 'Institution de Formation et d''Éducation Féminine de Toumodi', 'IFEF', 'IFEF', 'DR BELIER', 'TOUMODI', NULL, true, '1', '2026-10-11 22:30:51.23+00', 'IFEF');
INSERT INTO public.entite (id_entite, nom, sigle, id_hierarchisation, id_entite_parent, localisation, responsable_nom, actif, id_user, dh_creation, id_nature) VALUES ('IFEF TIEBISSOU', 'Institution de Formation et d''Éducation Féminine Tiebissou', 'IFEF', 'IFEF', 'DR BELIER', 'TIEBISSOU', NULL, true, '1', '2026-10-11 22:30:51.23+00', 'IFEF');
INSERT INTO public.entite (id_entite, nom, sigle, id_hierarchisation, id_entite_parent, localisation, responsable_nom, actif, id_user, dh_creation, id_nature) VALUES ('IFEF DIDIEVI', 'Institution de Formation et d''Éducation Féminine de Didievi', 'IFEF', 'IFEF', 'DR BELIER', 'DIDIÉVI', NULL, true, '1', '2026-10-11 22:30:51.23+00', 'IFEF');
INSERT INTO public.entite (id_entite, nom, sigle, id_hierarchisation, id_entite_parent, localisation, responsable_nom, actif, id_user, dh_creation, id_nature) VALUES ('IFEF DJEKANOU', 'Institution de Formation et d''Éducation Féminine de Djekanou', 'IFEF', 'IFEF', 'DR BELIER', 'DJEKANOU', NULL, true, '1', '2026-10-11 22:30:51.23+00', 'IFEF');
INSERT INTO public.entite (id_entite, nom, sigle, id_hierarchisation, id_entite_parent, localisation, responsable_nom, actif, id_user, dh_creation, id_nature) VALUES ('IFEF KAHANKRO', 'Institution de Formation et d''Éducation Féminine de Kahankro', 'IFEF', 'IFEF', 'DR BELIER', 'KAHANKRO', NULL, true, '1', '2026-10-11 22:30:51.23+00', 'IFEF');
INSERT INTO public.entite (id_entite, nom, sigle, id_hierarchisation, id_entite_parent, localisation, responsable_nom, actif, id_user, dh_creation, id_nature) VALUES ('CSE YAMOUSSOUKRO', 'Complexe Socio-Éducatif de Yamoussoukro', 'CSE', 'COMPLEXE_SOCIO_EDUCATIF', 'DR BELIER', 'YAMOUSSOUKRO', NULL, true, '1', '2026-10-11 22:30:51.23+00', 'CSE');
INSERT INTO public.entite (id_entite, nom, sigle, id_hierarchisation, id_entite_parent, localisation, responsable_nom, actif, id_user, dh_creation, id_nature) VALUES ('SOS VILLAGE YAMOUSSOUKRO', 'Sos Villages d''Enfants Yamoussoukro', 'SOS VILLAGE', 'SOS VILLAGE', 'DR BELIER', 'YAMOUSSOUKRO', NULL, true, '1', '2026-10-11 22:30:51.23+00', 'SOS VILLAGE');
INSERT INTO public.entite (id_entite, nom, sigle, id_hierarchisation, id_entite_parent, localisation, responsable_nom, actif, id_user, dh_creation, id_nature) VALUES ('CES YAKRO', 'Centre d''Éducation Spécialisée Yakro', 'CES', 'CES', 'DR BELIER', 'YAMOUSSOUKRO', NULL, true, '1', '2026-10-11 22:30:51.23+00', 'CES');
INSERT INTO public.entite (id_entite, nom, sigle, id_hierarchisation, id_entite_parent, localisation, responsable_nom, actif, id_user, dh_creation, id_nature) VALUES ('IFEF DETIEBISSOU', 'Institution de Formation et d''Éducation Féminine de Tiébissou', 'IFEF', 'IFEF', 'DR BELIER', 'TIEBISSOU', NULL, true, '1', '2026-10-11 22:30:51.23+00', 'IFEF');
INSERT INTO public.entite (id_entite, nom, sigle, id_hierarchisation, id_entite_parent, localisation, responsable_nom, actif, id_user, dh_creation, id_nature) VALUES ('CSE BOUAFLE', 'Complexe Socio-Éducatif de Bouafle', 'CSE', 'COMPLEXE_SOCIO_EDUCATIF', 'DR MARAHOUE', 'BOUAFLE', NULL, true, '1', '2026-10-11 22:30:51.23+00', 'CSE');
INSERT INTO public.entite (id_entite, nom, sigle, id_hierarchisation, id_entite_parent, localisation, responsable_nom, actif, id_user, dh_creation, id_nature) VALUES ('IFEF BOUAFLE', 'Institution de Formation et d''Éducation Féminine de Bouafle', 'IFEF', 'IFEF', 'DR MARAHOUE', 'BOUAFLÉ', NULL, true, '1', '2026-10-11 22:30:51.23+00', 'IFEF');
INSERT INTO public.entite (id_entite, nom, sigle, id_hierarchisation, id_entite_parent, localisation, responsable_nom, actif, id_user, dh_creation, id_nature) VALUES ('IFEF SINFRA', 'Institution de Formation et d''Éducation Féminine de Sinfra', 'IFEF', 'IFEF', 'DR MARAHOUE', 'SINFRA', NULL, true, '1', '2026-10-11 22:30:51.23+00', 'IFEF');
INSERT INTO public.entite (id_entite, nom, sigle, id_hierarchisation, id_entite_parent, localisation, responsable_nom, actif, id_user, dh_creation, id_nature) VALUES ('IFEF ZUENOULA', 'Institution de Formation et d''Éducation Féminine de Zuenoula', 'IFEF', 'IFEF', 'DR MARAHOUE', 'ZUÉNOULA', NULL, true, '1', '2026-10-11 22:30:51.23+00', 'IFEF');
INSERT INTO public.entite (id_entite, nom, sigle, id_hierarchisation, id_entite_parent, localisation, responsable_nom, actif, id_user, dh_creation, id_nature) VALUES ('CSE BONGOUANOU', 'Complexe Socio-Éducatif de Bongouanou', 'CSE', 'COMPLEXE_SOCIO_EDUCATIF', 'DR MORONOU', 'BONGOUANOU', NULL, true, '1', '2026-10-11 22:30:51.23+00', 'CSE');
INSERT INTO public.entite (id_entite, nom, sigle, id_hierarchisation, id_entite_parent, localisation, responsable_nom, actif, id_user, dh_creation, id_nature) VALUES ('CES BONGOUANOU', 'Centre d''Éducation Spécialisée Bongouanou', 'CES', 'CES', 'DR MORONOU', 'BONGOUANOU', NULL, true, '1', '2026-10-11 22:30:51.23+00', 'CES');
INSERT INTO public.entite (id_entite, nom, sigle, id_hierarchisation, id_entite_parent, localisation, responsable_nom, actif, id_user, dh_creation, id_nature) VALUES ('IFEF BONGOUANOU', 'Institution de Formation et d''Éducation Féminine de Bongouanou', 'IFEF', 'IFEF', 'DR MORONOU', 'BONGOUANOU', NULL, true, '1', '2026-10-11 22:30:51.23+00', 'IFEF');
INSERT INTO public.entite (id_entite, nom, sigle, id_hierarchisation, id_entite_parent, localisation, responsable_nom, actif, id_user, dh_creation, id_nature) VALUES ('IFEF ARRAH', 'Institution de Formation et d''Éducation Féminine de Arrah', 'IFEF', 'IFEF', 'DR MORONOU', 'ARRAH', NULL, true, '1', '2026-10-11 22:30:51.23+00', 'IFEF');
INSERT INTO public.entite (id_entite, nom, sigle, id_hierarchisation, id_entite_parent, localisation, responsable_nom, actif, id_user, dh_creation, id_nature) VALUES ('IFEF M''BATTO', 'Institution de Formation et d''Éducation Féminine de m''Batto', 'IFEF', 'IFEF', 'DR MORONOU', 'M’BATTO', NULL, true, '1', '2026-10-11 22:30:51.23+00', 'IFEF');
INSERT INTO public.entite (id_entite, nom, sigle, id_hierarchisation, id_entite_parent, localisation, responsable_nom, actif, id_user, dh_creation, id_nature) VALUES ('CSE MANKONO', 'Complexe Socio-Éducatif de Mankono', 'CSE', 'COMPLEXE_SOCIO_EDUCATIF', 'DR BERE', 'MANKONO', NULL, true, '1', '2026-10-11 22:30:51.23+00', 'CSE');
INSERT INTO public.entite (id_entite, nom, sigle, id_hierarchisation, id_entite_parent, localisation, responsable_nom, actif, id_user, dh_creation, id_nature) VALUES ('IFEF SAN PEDRO', 'Institution de Formation et d''Éducation Féminine San Pedro', 'IFEF', 'IFEF', 'DR SAN PEDRO', 'SAN PEDRO', NULL, true, '1', '2026-10-11 22:30:51.23+00', 'IFEF');
INSERT INTO public.entite (id_entite, nom, sigle, id_hierarchisation, id_entite_parent, localisation, responsable_nom, actif, id_user, dh_creation, id_nature) VALUES ('CSE TABOU', 'Complexe Socio-Éducatif de Tabou', 'CSE', 'COMPLEXE_SOCIO_EDUCATIF', 'DR SAN PEDRO', 'TABOU', NULL, true, '1', '2026-10-11 22:30:51.23+00', 'CSE');
INSERT INTO public.entite (id_entite, nom, sigle, id_hierarchisation, id_entite_parent, localisation, responsable_nom, actif, id_user, dh_creation, id_nature) VALUES ('IFEF TABOU', 'Institution de Formation et d''Éducation Féminine de Tabou', 'IFEF', 'IFEF', 'DR SAN PEDRO', 'TABOU', NULL, true, '1', '2026-10-11 22:30:51.23+00', 'IFEF');
INSERT INTO public.entite (id_entite, nom, sigle, id_hierarchisation, id_entite_parent, localisation, responsable_nom, actif, id_user, dh_creation, id_nature) VALUES ('CSE DIVO', 'Complexe Socio-Éducatif de Divo', 'CSE', 'COMPLEXE_SOCIO_EDUCATIF', 'DR LOH-DJIBOUA', 'DIVO', NULL, true, '1', '2026-10-11 22:30:51.23+00', 'CSE');
INSERT INTO public.entite (id_entite, nom, sigle, id_hierarchisation, id_entite_parent, localisation, responsable_nom, actif, id_user, dh_creation, id_nature) VALUES ('CES DIVO', 'Centre d''Éducation Spécialisée de Divo', 'CES', 'CES', 'DR LOH-DJIBOUA', 'DIVO', NULL, true, '1', '2026-10-11 22:30:51.23+00', 'CES');
INSERT INTO public.entite (id_entite, nom, sigle, id_hierarchisation, id_entite_parent, localisation, responsable_nom, actif, id_user, dh_creation, id_nature) VALUES ('CS DIVO', 'Centre Social de Divo', 'CS', 'CS', 'DR LOH-DJIBOUA', 'DIVO', NULL, true, '1', '2026-10-11 22:30:51.23+00', 'CS');
INSERT INTO public.entite (id_entite, nom, sigle, id_hierarchisation, id_entite_parent, localisation, responsable_nom, actif, id_user, dh_creation, id_nature) VALUES ('IFEF DIVO', 'Institution de Formation et d''Éducation Féminine de Divo', 'IFEF', 'IFEF', 'DR LOH-DJIBOUA', 'DIVO', NULL, true, '1', '2026-10-11 22:30:51.23+00', 'IFEF');
INSERT INTO public.entite (id_entite, nom, sigle, id_hierarchisation, id_entite_parent, localisation, responsable_nom, actif, id_user, dh_creation, id_nature) VALUES ('IFEF HIRE', 'Institution de Formation et d''Éducation Féminine de Hire', 'IFEF', 'IFEF', 'DR LOH-DJIBOUA', 'HIRE', NULL, true, '1', '2026-10-11 22:30:51.23+00', 'IFEF');
INSERT INTO public.entite (id_entite, nom, sigle, id_hierarchisation, id_entite_parent, localisation, responsable_nom, actif, id_user, dh_creation, id_nature) VALUES ('IFEF GUITRY', 'Institution de Formation et d''Éducation Féminine de Guitry', 'IFEF', 'IFEF', 'DR LOH-DJIBOUA', 'GUITRY', NULL, true, '1', '2026-10-11 22:30:51.23+00', 'IFEF');
INSERT INTO public.entite (id_entite, nom, sigle, id_hierarchisation, id_entite_parent, localisation, responsable_nom, actif, id_user, dh_creation, id_nature) VALUES ('CSE BOUNA', 'Complexe Socio-Éducatif de Bouna', 'CSE', 'COMPLEXE_SOCIO_EDUCATIF', 'DR BOUNKANI', 'BOUNA', NULL, true, '1', '2026-10-11 22:30:51.23+00', 'CSE');
INSERT INTO public.entite (id_entite, nom, sigle, id_hierarchisation, id_entite_parent, localisation, responsable_nom, actif, id_user, dh_creation, id_nature) VALUES ('IFEF NASSIAN', 'Institution de Formation et d''Éducation Féminine de Nassian', 'IFEF', 'IFEF', 'DR BOUNKANI', 'NASSIAN', NULL, true, '1', '2026-10-11 22:30:51.23+00', 'IFEF');
INSERT INTO public.entite (id_entite, nom, sigle, id_hierarchisation, id_entite_parent, localisation, responsable_nom, actif, id_user, dh_creation, id_nature) VALUES ('IFEF BOUNA', 'Institution de Formation et d''Éducation Féminine de Bouna', 'IFEF', 'IFEF', 'DR BOUNKANI', 'BOUNA', NULL, true, '1', '2026-10-11 22:30:51.23+00', 'IFEF');
INSERT INTO public.entite (id_entite, nom, sigle, id_hierarchisation, id_entite_parent, localisation, responsable_nom, actif, id_user, dh_creation, id_nature) VALUES ('CSE GAGNOA', 'Complexe Socio-Éducatif de Gagnoa', 'CSE', 'COMPLEXE_SOCIO_EDUCATIF', 'DR GOH', 'GAGNOA', NULL, true, '1', '2026-10-11 22:30:51.23+00', 'CSE');
INSERT INTO public.entite (id_entite, nom, sigle, id_hierarchisation, id_entite_parent, localisation, responsable_nom, actif, id_user, dh_creation, id_nature) VALUES ('CSE DIEGONEFLA', 'Complexe Socio-Éducatif de Diegonefla', 'CSE', 'COMPLEXE_SOCIO_EDUCATIF', 'DR GOH', 'DIEGONEFLA', NULL, true, '1', '2026-10-11 22:30:51.23+00', 'CSE');
INSERT INTO public.entite (id_entite, nom, sigle, id_hierarchisation, id_entite_parent, localisation, responsable_nom, actif, id_user, dh_creation, id_nature) VALUES ('CSE OUME', 'Complexe Socio-Éducatif d''Oume', 'CSE', 'COMPLEXE_SOCIO_EDUCATIF', 'DR GOH', 'OUME', NULL, true, '1', '2026-10-11 22:30:51.23+00', 'CSE');
INSERT INTO public.entite (id_entite, nom, sigle, id_hierarchisation, id_entite_parent, localisation, responsable_nom, actif, id_user, dh_creation, id_nature) VALUES ('IFEF GAGNOA', 'Institution de Formation et d''Éducation Féminine de Gagnoa', 'IFEF', 'IFEF', 'DR GOH', 'GAGNOA', NULL, true, '1', '2026-10-11 22:30:51.23+00', 'IFEF');
INSERT INTO public.entite (id_entite, nom, sigle, id_hierarchisation, id_entite_parent, localisation, responsable_nom, actif, id_user, dh_creation, id_nature) VALUES ('IFEF OUME', 'Institution de Formation et d''Éducation Féminine d''Oume', 'IFEF', 'IFEF', 'DR GOH', 'OUME', NULL, true, '1', '2026-10-11 22:30:51.23+00', 'IFEF');
INSERT INTO public.entite (id_entite, nom, sigle, id_hierarchisation, id_entite_parent, localisation, responsable_nom, actif, id_user, dh_creation, id_nature) VALUES ('IFEF DIEGONEFLA', 'Institution de Formation et d''Éducation Féminine de Diegonefla', 'IFEF', 'IFEF', 'DR GOH', 'DIEGONEFLA', NULL, true, '1', '2026-10-11 22:30:51.23+00', 'IFEF');
INSERT INTO public.entite (id_entite, nom, sigle, id_hierarchisation, id_entite_parent, localisation, responsable_nom, actif, id_user, dh_creation, id_nature) VALUES ('IFEF ZEBIZEKOU', 'Institution de Formation et d''Éducation Féminine de Zebizekou', 'IFEF', 'IFEF', 'DR GOH', 'ZEBIZEKOU', NULL, true, '1', '2026-10-11 22:30:51.23+00', 'IFEF');
INSERT INTO public.entite (id_entite, nom, sigle, id_hierarchisation, id_entite_parent, localisation, responsable_nom, actif, id_user, dh_creation, id_nature) VALUES ('IFEF GUIBEROUA', 'Institution de Formation et d''Éducation Féminine de Guiberoua', 'IFEF', 'IFEF', 'DR GOH', 'GUIBEROUA', NULL, true, '1', '2026-10-11 22:30:51.23+00', 'IFEF');
INSERT INTO public.entite (id_entite, nom, sigle, id_hierarchisation, id_entite_parent, localisation, responsable_nom, actif, id_user, dh_creation, id_nature) VALUES ('IFEF OURAGAHIO', 'Institution de Formation et d''Éducation Féminine de Ouragahio', 'IFEF', 'IFEF', 'DR GOH', 'OURAGAHIO', NULL, true, '1', '2026-10-11 22:30:51.23+00', 'IFEF');
INSERT INTO public.entite (id_entite, nom, sigle, id_hierarchisation, id_entite_parent, localisation, responsable_nom, actif, id_user, dh_creation, id_nature) VALUES ('IFEF GRAND LAHOU', 'Institution de Formation et d''Éducation Féminine de Grand Lahou', 'IFEF', 'IFEF', 'DR GRAND PONT', 'GRAND LAHOU', NULL, true, '1', '2026-10-11 22:30:51.23+00', 'IFEF');
INSERT INTO public.entite (id_entite, nom, sigle, id_hierarchisation, id_entite_parent, localisation, responsable_nom, actif, id_user, dh_creation, id_nature) VALUES ('IFEF LOPOU 2', 'Institution de Formation et d''Éducation Féminine de Lopou 2', 'IFEF', 'IFEF', 'DR GRAND PONT', 'LOPOU', NULL, true, '1', '2026-10-11 22:30:51.23+00', 'IFEF');
INSERT INTO public.entite (id_entite, nom, sigle, id_hierarchisation, id_entite_parent, localisation, responsable_nom, actif, id_user, dh_creation, id_nature) VALUES ('IFEF TOUPAH', 'Institution de Formation et d''Éducation Féminine de Toupah', 'IFEF', 'IFEF', 'DR GRAND PONT', 'TOUPAH', NULL, true, '1', '2026-10-11 22:30:51.23+00', 'IFEF');
INSERT INTO public.entite (id_entite, nom, sigle, id_hierarchisation, id_entite_parent, localisation, responsable_nom, actif, id_user, dh_creation, id_nature) VALUES ('IFEF JACQUEVILLE', 'Institution de Formation et d''Éducation Féminine de Jacqueville', 'IFEF', 'IFEF', 'DR GRAND PONT', 'JACQUEVILLE', NULL, true, '1', '2026-10-11 22:30:51.23+00', 'IFEF');
INSERT INTO public.entite (id_entite, nom, sigle, id_hierarchisation, id_entite_parent, localisation, responsable_nom, actif, id_user, dh_creation, id_nature) VALUES ('CACE DJADJEME RWOD', 'Centre d''Action Communautaire pour l''Enfance de Djadjeme Rwod', 'CACE', 'CACE', 'DR GRAND PONT', 'DABOU', NULL, true, '1', '2026-10-11 22:30:51.23+00', 'CACE');
INSERT INTO public.entite (id_entite, nom, sigle, id_hierarchisation, id_entite_parent, localisation, responsable_nom, actif, id_user, dh_creation, id_nature) VALUES ('POUPONNIERE DABOU', 'Pouponnière de Dabou', 'POUPONNIERE', 'POUPONNIERE', 'DR GRAND PONT', 'DABOU', NULL, true, '1', '2026-10-11 22:30:51.23+00', 'POUPONNIERE');
INSERT INTO public.entite (id_entite, nom, sigle, id_hierarchisation, id_entite_parent, localisation, responsable_nom, actif, id_user, dh_creation, id_nature) VALUES ('IFEF N''DJEM', 'Institution de Formation et d''Éducation Féminine de n''Djem', 'IFEF', 'IFEF', 'DR GRAND PONT', 'JACQUEVILLE', NULL, true, '1', '2026-10-11 22:30:51.23+00', 'IFEF');
INSERT INTO public.entite (id_entite, nom, sigle, id_hierarchisation, id_entite_parent, localisation, responsable_nom, actif, id_user, dh_creation, id_nature) VALUES ('IFEF BODOU', 'Institution de Formation et d''Éducation Féminine de Bodou', 'IFEF', 'IFEF', 'DR GRAND PONT', 'DABOU', NULL, true, '1', '2026-10-11 22:30:51.23+00', 'IFEF');
INSERT INTO public.entite (id_entite, nom, sigle, id_hierarchisation, id_entite_parent, localisation, responsable_nom, actif, id_user, dh_creation, id_nature) VALUES ('IFEF TENGRELA', 'Institution de Formation et d''Éducation Féminine de Tengrela', 'IFEF', 'IFEF', 'DR BAGOUE', 'TENGRELA', NULL, true, '1', '2026-10-11 22:30:51.23+00', 'IFEF');
INSERT INTO public.entite (id_entite, nom, sigle, id_hierarchisation, id_entite_parent, localisation, responsable_nom, actif, id_user, dh_creation, id_nature) VALUES ('IFEF KOUTO', 'Institution de Formation et d''Éducation Féminine de Kouto', 'IFEF', 'IFEF', 'DR BAGOUE', 'KOUTO', NULL, true, '1', '2026-10-11 22:30:51.23+00', 'IFEF');
INSERT INTO public.entite (id_entite, nom, sigle, id_hierarchisation, id_entite_parent, localisation, responsable_nom, actif, id_user, dh_creation, id_nature) VALUES ('IFEF GBON', 'Institution de Formation et d''Éducation Féminine de Gbon', 'IFEF', 'IFEF', 'DR BAGOUE', 'GBON', NULL, true, '1', '2026-10-11 22:30:51.23+00', 'IFEF');
INSERT INTO public.entite (id_entite, nom, sigle, id_hierarchisation, id_entite_parent, localisation, responsable_nom, actif, id_user, dh_creation, id_nature) VALUES ('IFEF BOUNDIALI', 'Institution de Formation et d''Éducation Féminine de Boundiali', 'IFEF', 'IFEF', 'DR BAGOUE', 'BOUNDIALI', NULL, true, '1', '2026-10-11 22:30:51.23+00', 'IFEF');
INSERT INTO public.entite (id_entite, nom, sigle, id_hierarchisation, id_entite_parent, localisation, responsable_nom, actif, id_user, dh_creation, id_nature) VALUES ('IFEF DETENGRELA', 'Institution de Formation et d''Éducation Féminine de Tengrela', 'IFEF', 'IFEF', 'DR BAGOUE', 'TENGRELA', NULL, true, '1', '2026-10-11 22:30:51.23+00', 'IFEF');
INSERT INTO public.entite (id_entite, nom, sigle, id_hierarchisation, id_entite_parent, localisation, responsable_nom, actif, id_user, dh_creation, id_nature) VALUES ('CA BOUNDIALI', 'Centre d''Accueil de Boundiali', 'CA', 'CA', 'DR BAGOUE', 'BOUNDIALI', NULL, true, '1', '2026-10-11 22:30:51.23+00', 'CA');
INSERT INTO public.entite (id_entite, nom, sigle, id_hierarchisation, id_entite_parent, localisation, responsable_nom, actif, id_user, dh_creation, id_nature) VALUES ('IFEF KASSERE', 'Institution de Formation et d''Éducation Féminine de Kassere', 'IFEF', 'IFEF', 'DR BAGOUE', 'KASSERE', NULL, true, '1', '2026-10-11 22:30:51.23+00', 'IFEF');
INSERT INTO public.entite (id_entite, nom, sigle, id_hierarchisation, id_entite_parent, localisation, responsable_nom, actif, id_user, dh_creation, id_nature) VALUES ('CSE ABENGOUROU', 'Complexe Socio-Éducatif d''Abengourou', 'CSE', 'COMPLEXE_SOCIO_EDUCATIF', 'DR INDENIE-DJUABLIN', 'ABENGOUROU', NULL, true, '1', '2026-10-11 22:30:51.23+00', 'CSE');
INSERT INTO public.entite (id_entite, nom, sigle, id_hierarchisation, id_entite_parent, localisation, responsable_nom, actif, id_user, dh_creation, id_nature) VALUES ('CSE NIABLE', 'Complexe Socio-Éducatif de Niable', 'CSE', 'COMPLEXE_SOCIO_EDUCATIF', 'DR INDENIE-DJUABLIN', 'NIABLE', NULL, true, '1', '2026-10-11 22:30:51.23+00', 'CSE');
INSERT INTO public.entite (id_entite, nom, sigle, id_hierarchisation, id_entite_parent, localisation, responsable_nom, actif, id_user, dh_creation, id_nature) VALUES ('CSE AGNIBILEKROU', 'Complexe Socio-Éducatif d''Agnibilekrou', 'CSE', 'COMPLEXE_SOCIO_EDUCATIF', 'DR INDENIE-DJUABLIN', 'AGNIBILEKROU', NULL, true, '1', '2026-10-11 22:30:51.23+00', 'CSE');
INSERT INTO public.entite (id_entite, nom, sigle, id_hierarchisation, id_entite_parent, localisation, responsable_nom, actif, id_user, dh_creation, id_nature) VALUES ('IFEF ABENGOUROU', 'Institution de Formation et d''Éducation Féminine d''Abengourou', 'IFEF', 'IFEF', 'DR INDENIE-DJUABLIN', 'ABENGOUROU', NULL, true, '1', '2026-10-11 22:30:51.23+00', 'IFEF');
INSERT INTO public.entite (id_entite, nom, sigle, id_hierarchisation, id_entite_parent, localisation, responsable_nom, actif, id_user, dh_creation, id_nature) VALUES ('IFEF AGNIBILEKROU', 'Institution de Formation et d''Éducation Féminine d''Agnibilekrou', 'IFEF', 'IFEF', 'DR INDENIE-DJUABLIN', 'AGNIBILEKROU', NULL, true, '1', '2026-10-11 22:30:51.23+00', 'IFEF');
INSERT INTO public.entite (id_entite, nom, sigle, id_hierarchisation, id_entite_parent, localisation, responsable_nom, actif, id_user, dh_creation, id_nature) VALUES ('IFEF YAKASSE-FEYASSE', 'Institution de Formation et d''Éducation Féminine de Yakasse-Feyasse', 'IFEF', 'IFEF', 'DR INDENIE-DJUABLIN', 'YAKASSE-FEYASSE', NULL, true, '1', '2026-10-11 22:30:51.23+00', 'IFEF');
INSERT INTO public.entite (id_entite, nom, sigle, id_hierarchisation, id_entite_parent, localisation, responsable_nom, actif, id_user, dh_creation, id_nature) VALUES ('IFEF TANGUELAN', 'Institution de Formation et d''Éducation Féminine de Tanguelan', 'IFEF', 'IFEF', 'DR INDENIE-DJUABLIN', 'TANGUELAN', NULL, true, '1', '2026-10-11 22:30:51.23+00', 'IFEF');
INSERT INTO public.entite (id_entite, nom, sigle, id_hierarchisation, id_entite_parent, localisation, responsable_nom, actif, id_user, dh_creation, id_nature) VALUES ('CPPE INDENIE-DJUABLIN', 'Centre de Protection de la Petite Enfance de Indenie-Djuablin', 'CPPE', 'CPPE', 'DR INDENIE-DJUABLIN', 'ABENGOUROU', NULL, true, '1', '2026-10-11 22:30:51.23+00', 'CPPE');
INSERT INTO public.entite (id_entite, nom, sigle, id_hierarchisation, id_entite_parent, localisation, responsable_nom, actif, id_user, dh_creation, id_nature) VALUES ('CPPE YAKASSE-FEYASSE', 'Centre de Protection de la Petite Enfance de Yakasse-Feyasse', 'CPPE', 'CPPE', 'DR INDENIE-DJUABLIN', 'YAKASSE-FEYASSE', NULL, true, '1', '2026-10-11 22:30:51.23+00', 'CPPE');
INSERT INTO public.entite (id_entite, nom, sigle, id_hierarchisation, id_entite_parent, localisation, responsable_nom, actif, id_user, dh_creation, id_nature) VALUES ('CPPE LES ETOILES DU DJUABLIN', 'Centre de Protection de la Petite Enfance les Etoiles du Djuablin', 'CPPE', 'CPPE', 'DR INDENIE-DJUABLIN', 'AGNIBILEKROU', NULL, true, '1', '2026-10-11 22:30:51.23+00', 'CPPE');
INSERT INTO public.entite (id_entite, nom, sigle, id_hierarchisation, id_entite_parent, localisation, responsable_nom, actif, id_user, dh_creation, id_nature) VALUES ('CACE DAME', 'Centre d''Action Communautaire pour l''Enfance de Dame', 'CACE', 'CACE', 'DR INDENIE-DJUABLIN', 'DAME', NULL, true, '1', '2026-10-11 22:30:51.23+00', 'CACE');
INSERT INTO public.entite (id_entite, nom, sigle, id_hierarchisation, id_entite_parent, localisation, responsable_nom, actif, id_user, dh_creation, id_nature) VALUES ('CACE REVE CAETOU', 'Centre d''Action Communautaire pour l''Enfance de Reve Caetou', 'CACE', 'CACE', 'DR INDENIE-DJUABLIN', 'ABENGOUROU', NULL, true, '1', '2026-10-11 22:30:51.23+00', 'CACE');
INSERT INTO public.entite (id_entite, nom, sigle, id_hierarchisation, id_entite_parent, localisation, responsable_nom, actif, id_user, dh_creation, id_nature) VALUES ('CSE GUIGLO', 'Complexe Socio-Éducatif de Guiglo', 'CSE', 'COMPLEXE_SOCIO_EDUCATIF', 'DR CAVALY', 'GUIGLO', NULL, true, '1', '2026-10-11 22:30:51.23+00', 'CSE');
INSERT INTO public.entite (id_entite, nom, sigle, id_hierarchisation, id_entite_parent, localisation, responsable_nom, actif, id_user, dh_creation, id_nature) VALUES ('CSE TAÏ', 'Complexe Socio-Éducatif de Taï', 'CSE', 'COMPLEXE_SOCIO_EDUCATIF', 'DR CAVALY', 'TAÏ', NULL, true, '1', '2026-10-11 22:30:51.23+00', 'CSE');
INSERT INTO public.entite (id_entite, nom, sigle, id_hierarchisation, id_entite_parent, localisation, responsable_nom, actif, id_user, dh_creation, id_nature) VALUES ('IFEF GUIGLO', 'Institution de Formation et d''Éducation Féminine de Guiglo', 'IFEF', 'IFEF', 'DR CAVALY', 'GUIGLO', NULL, true, '1', '2026-10-11 22:30:51.23+00', 'IFEF');
INSERT INTO public.entite (id_entite, nom, sigle, id_hierarchisation, id_entite_parent, localisation, responsable_nom, actif, id_user, dh_creation, id_nature) VALUES ('IFEF DETOULEPLEU', 'Institution de Formation et d''Éducation Féminine de Toulépleu', 'IFEF', 'IFEF', 'DR CAVALY', 'TOULEPLEU', NULL, true, '1', '2026-10-11 22:30:51.23+00', 'IFEF');
INSERT INTO public.entite (id_entite, nom, sigle, id_hierarchisation, id_entite_parent, localisation, responsable_nom, actif, id_user, dh_creation, id_nature) VALUES ('IFEF TAÏ', 'Institution de Formation et d''Éducation Féminine de Taï', 'IFEF', 'IFEF', 'DR CAVALY', 'TAÏ', NULL, true, '1', '2026-10-11 22:30:51.23+00', 'IFEF');
INSERT INTO public.entite (id_entite, nom, sigle, id_hierarchisation, id_entite_parent, localisation, responsable_nom, actif, id_user, dh_creation, id_nature) VALUES ('IFEF BLOLEQUIN', 'Institution de Formation et d''Éducation Féminine de Blolequin', 'IFEF', 'IFEF', 'DR CAVALY', 'BLOLEQUIN', NULL, true, '1', '2026-10-11 22:30:51.23+00', 'IFEF');
INSERT INTO public.entite (id_entite, nom, sigle, id_hierarchisation, id_entite_parent, localisation, responsable_nom, actif, id_user, dh_creation, id_nature) VALUES ('CSE ZAGNE', 'Complexe Socio-Éducatif de Zagne', 'CSE', 'COMPLEXE_SOCIO_EDUCATIF', 'DR CAVALY', 'ZAGNE', NULL, true, '1', '2026-10-11 22:30:51.23+00', 'CSE');
INSERT INTO public.entite (id_entite, nom, sigle, id_hierarchisation, id_entite_parent, localisation, responsable_nom, actif, id_user, dh_creation, id_nature) VALUES ('CSE MADINANI', 'Complexe Socio-Éducatif de Madinani', 'CSE', 'COMPLEXE_SOCIO_EDUCATIF', 'DR KABADOUGOU', 'MADINANI', NULL, true, '1', '2026-10-11 22:30:51.23+00', 'CSE');
INSERT INTO public.entite (id_entite, nom, sigle, id_hierarchisation, id_entite_parent, localisation, responsable_nom, actif, id_user, dh_creation, id_nature) VALUES ('CSE GBELEBAN', 'Complexe Socio-Éducatif de Gbeleban', 'CSE', 'COMPLEXE_SOCIO_EDUCATIF', 'DR KABADOUGOU', 'GBELEBAN', NULL, true, '1', '2026-10-11 22:30:51.23+00', 'CSE');
INSERT INTO public.entite (id_entite, nom, sigle, id_hierarchisation, id_entite_parent, localisation, responsable_nom, actif, id_user, dh_creation, id_nature) VALUES ('IFEF GBELEBAN', 'Institution de Formation et d''Éducation Féminine de Gbeleban', 'IFEF', 'IFEF', 'DR KABADOUGOU', 'GBELEBAN', NULL, true, '1', '2026-10-11 22:30:51.23+00', 'IFEF');
INSERT INTO public.entite (id_entite, nom, sigle, id_hierarchisation, id_entite_parent, localisation, responsable_nom, actif, id_user, dh_creation, id_nature) VALUES ('IFEF ODIENNE', 'Institution de Formation et d''Éducation Féminine d''Odienne', 'IFEF', 'IFEF', 'DR KABADOUGOU', 'ODIENNE', NULL, true, '1', '2026-10-11 22:30:51.23+00', 'IFEF');
INSERT INTO public.entite (id_entite, nom, sigle, id_hierarchisation, id_entite_parent, localisation, responsable_nom, actif, id_user, dh_creation, id_nature) VALUES ('IFEF SEGUELON', 'Institution de Formation et d''Éducation Féminine de Seguelon', 'IFEF', 'IFEF', 'DR KABADOUGOU', 'ODIENNE', NULL, true, '1', '2026-10-11 22:30:51.23+00', 'IFEF');
INSERT INTO public.entite (id_entite, nom, sigle, id_hierarchisation, id_entite_parent, localisation, responsable_nom, actif, id_user, dh_creation, id_nature) VALUES ('CSE ODIENNE', 'Complexe Socio-Éducatif d''Odienne', 'CSE', 'COMPLEXE_SOCIO_EDUCATIF', 'DR KABADOUGOU', 'ODIENNE', NULL, true, '1', '2026-10-11 22:30:51.23+00', 'CSE');
INSERT INTO public.entite (id_entite, nom, sigle, id_hierarchisation, id_entite_parent, localisation, responsable_nom, actif, id_user, dh_creation, id_nature) VALUES ('IFEF TIEME', 'Institution de Formation et d''Éducation Féminine de Tieme', 'IFEF', 'IFEF', 'DR KABADOUGOU', 'TIEME', NULL, true, '1', '2026-10-11 22:30:51.23+00', 'IFEF');
INSERT INTO public.entite (id_entite, nom, sigle, id_hierarchisation, id_entite_parent, localisation, responsable_nom, actif, id_user, dh_creation, id_nature) VALUES ('IFEF SEYDOUGOU', 'Institution de Formation et d''Éducation Féminine de Seydougou', 'IFEF', 'IFEF', 'DR KABADOUGOU', 'SEYDOUGOU', NULL, true, '1', '2026-10-11 22:30:51.23+00', 'IFEF');
INSERT INTO public.entite (id_entite, nom, sigle, id_hierarchisation, id_entite_parent, localisation, responsable_nom, actif, id_user, dh_creation, id_nature) VALUES ('CSE BONDOUKOU', 'Complexe Socio-Éducatif de Bondoukou', 'CSE', 'COMPLEXE_SOCIO_EDUCATIF', 'DR GONTOUGO', 'BONDOUKOU', NULL, true, '1', '2026-10-11 22:30:51.23+00', 'CSE');
INSERT INTO public.entite (id_entite, nom, sigle, id_hierarchisation, id_entite_parent, localisation, responsable_nom, actif, id_user, dh_creation, id_nature) VALUES ('CES BONDOUKOU', 'Centre d''Éducation Spécialisée Bondoukou', 'CES', 'CES', 'DR GONTOUGO', 'BONDOUKOU', NULL, true, '1', '2026-10-11 22:30:51.23+00', 'CES');
INSERT INTO public.entite (id_entite, nom, sigle, id_hierarchisation, id_entite_parent, localisation, responsable_nom, actif, id_user, dh_creation, id_nature) VALUES ('IFEF BONDOUKOU', 'Institution de Formation et d''Éducation Féminine de Bondoukou', 'IFEF', 'IFEF', 'DR GONTOUGO', 'BONDOUKOU', NULL, true, '1', '2026-10-11 22:30:51.23+00', 'IFEF');
INSERT INTO public.entite (id_entite, nom, sigle, id_hierarchisation, id_entite_parent, localisation, responsable_nom, actif, id_user, dh_creation, id_nature) VALUES ('IFEF TANDA', 'Institution de Formation et d''Éducation Féminine de Tanda', 'IFEF', 'IFEF', 'DR GONTOUGO', 'TANDA', NULL, true, '1', '2026-10-11 22:30:51.23+00', 'IFEF');
INSERT INTO public.entite (id_entite, nom, sigle, id_hierarchisation, id_entite_parent, localisation, responsable_nom, actif, id_user, dh_creation, id_nature) VALUES ('CPPE TIEDIO', 'Centre de Protection de la Petite Enfance de Tiedio', 'CPPE', 'CPPE', 'DR GONTOUGO', 'TIEDIO', NULL, true, '1', '2026-10-11 22:30:51.23+00', 'CPPE');
INSERT INTO public.entite (id_entite, nom, sigle, id_hierarchisation, id_entite_parent, localisation, responsable_nom, actif, id_user, dh_creation, id_nature) VALUES ('IFEF TIEDIO', 'Institution de Formation et d''Éducation Féminine de Tiedio', 'IFEF', 'IFEF', 'DR GONTOUGO', 'TIEDIO', NULL, true, '1', '2026-10-11 22:30:51.23+00', 'IFEF');
INSERT INTO public.entite (id_entite, nom, sigle, id_hierarchisation, id_entite_parent, localisation, responsable_nom, actif, id_user, dh_creation, id_nature) VALUES ('IFEF AMANVI', 'Institution de Formation et d''Éducation Féminine d''Amanvi', 'IFEF', 'IFEF', 'DR GONTOUGO', 'AMANVI', NULL, true, '1', '2026-10-11 22:30:51.23+00', 'IFEF');
INSERT INTO public.entite (id_entite, nom, sigle, id_hierarchisation, id_entite_parent, localisation, responsable_nom, actif, id_user, dh_creation, id_nature) VALUES ('IFEF KOUASSI DATEKRO', 'Institution de Formation et d''Éducation Féminine de Kouassi Datekro', 'IFEF', 'IFEF', 'DR GONTOUGO', 'KOUASSI DATEKRO', NULL, true, '1', '2026-10-11 22:30:51.23+00', 'IFEF');
INSERT INTO public.entite (id_entite, nom, sigle, id_hierarchisation, id_entite_parent, localisation, responsable_nom, actif, id_user, dh_creation, id_nature) VALUES ('IFEF TRANSUA', 'Institution de Formation et d''Éducation Féminine de Transua', 'IFEF', 'IFEF', 'DR GONTOUGO', 'TRANSUA', NULL, true, '1', '2026-10-11 22:30:51.23+00', 'IFEF');
INSERT INTO public.entite (id_entite, nom, sigle, id_hierarchisation, id_entite_parent, localisation, responsable_nom, actif, id_user, dh_creation, id_nature) VALUES ('IFEF ASSUEFRY', 'Institution de Formation et d''Éducation Féminine d''Assuefry', 'IFEF', 'IFEF', 'DR GONTOUGO', 'ASSUEFRY', NULL, true, '1', '2026-10-11 22:30:51.23+00', 'IFEF');
INSERT INTO public.entite (id_entite, nom, sigle, id_hierarchisation, id_entite_parent, localisation, responsable_nom, actif, id_user, dh_creation, id_nature) VALUES ('CSE DABAKALA', 'Complexe Socio-Éducatif de Dabakala', 'CSE', 'COMPLEXE_SOCIO_EDUCATIF', 'DR HAMBOL', 'KATIOLA', NULL, true, '1', '2026-10-11 22:30:51.23+00', 'CSE');
INSERT INTO public.entite (id_entite, nom, sigle, id_hierarchisation, id_entite_parent, localisation, responsable_nom, actif, id_user, dh_creation, id_nature) VALUES ('CES DABAKALA', 'Centre d''Éducation Spécialisée de Dabakala', 'CES', 'CES', 'DR HAMBOL', 'DABAKALA', NULL, true, '1', '2026-10-11 22:30:51.23+00', 'CES');
INSERT INTO public.entite (id_entite, nom, sigle, id_hierarchisation, id_entite_parent, localisation, responsable_nom, actif, id_user, dh_creation, id_nature) VALUES ('IFEF TAFIERE', 'Institution de Formation et d''Éducation Féminine de Tafiere', 'IFEF', 'IFEF', 'DR HAMBOL', 'TAFIRE', NULL, true, '1', '2026-10-11 22:30:51.23+00', 'IFEF');
INSERT INTO public.entite (id_entite, nom, sigle, id_hierarchisation, id_entite_parent, localisation, responsable_nom, actif, id_user, dh_creation, id_nature) VALUES ('IFEF KATIOLA', 'Institution de Formation et d''Éducation Féminine de Katiola', 'IFEF', 'IFEF', 'DR HAMBOL', 'KATIOLA', NULL, true, '1', '2026-10-11 22:30:51.23+00', 'IFEF');
INSERT INTO public.entite (id_entite, nom, sigle, id_hierarchisation, id_entite_parent, localisation, responsable_nom, actif, id_user, dh_creation, id_nature) VALUES ('IFEF DABAKALA', 'Institution de Formation et d''Éducation Féminine de Dabakala', 'IFEF', 'IFEF', 'DR HAMBOL', 'DABAKALA', NULL, true, '1', '2026-10-11 22:30:51.23+00', 'IFEF');
INSERT INTO public.entite (id_entite, nom, sigle, id_hierarchisation, id_entite_parent, localisation, responsable_nom, actif, id_user, dh_creation, id_nature) VALUES ('IFEF FRONAN', 'Institution de Formation et d''Éducation Féminine de Fronan', 'IFEF', 'IFEF', 'DR HAMBOL', 'FRONAN', NULL, true, '1', '2026-10-11 22:30:51.23+00', 'IFEF');
INSERT INTO public.entite (id_entite, nom, sigle, id_hierarchisation, id_entite_parent, localisation, responsable_nom, actif, id_user, dh_creation, id_nature) VALUES ('IFEF TAFIRE', 'Institution de Formation et d''Éducation Féminine de Tafire', 'IFEF', 'IFEF', 'DR HAMBOL', 'SATAMA SOKORO', NULL, true, '1', '2026-10-11 22:30:51.23+00', 'IFEF');
INSERT INTO public.entite (id_entite, nom, sigle, id_hierarchisation, id_entite_parent, localisation, responsable_nom, actif, id_user, dh_creation, id_nature) VALUES ('IFEF SATAMA SOKOURA', 'Institution de Formation et d''Éducation Féminine de Satama Sokoura', 'IFEF', 'IFEF', 'DR HAMBOL', 'SATAMA SOKOURA', NULL, true, '1', '2026-10-11 22:30:51.23+00', 'IFEF');
INSERT INTO public.entite (id_entite, nom, sigle, id_hierarchisation, id_entite_parent, localisation, responsable_nom, actif, id_user, dh_creation, id_nature) VALUES ('IFEF SANTAMA SOKOURA', 'Institution de Formation et d''Éducation Féminine de Santama Sokoura', 'IFEF', 'IFEF', 'DR HAMBOL', 'SATAMA SOKOURA', NULL, true, '1', '2026-10-11 22:30:51.23+00', 'IFEF');
INSERT INTO public.entite (id_entite, nom, sigle, id_hierarchisation, id_entite_parent, localisation, responsable_nom, actif, id_user, dh_creation, id_nature) VALUES ('CSE AGBOVILLE', 'Complexe Socio-Éducatif d''Agboville', 'CSE', 'COMPLEXE_SOCIO_EDUCATIF', 'DR AGNEBY-TIASSA', 'AGBOVILLE', NULL, true, '1', '2026-10-11 22:30:51.23+00', 'CSE');
INSERT INTO public.entite (id_entite, nom, sigle, id_hierarchisation, id_entite_parent, localisation, responsable_nom, actif, id_user, dh_creation, id_nature) VALUES ('IFEF CENTRE KIMOU', 'Institution de Formation et d''Éducation Féminine Centre Kimou', 'IFEF', 'IFEF', 'DR AGNEBY-TIASSA', 'AGBOVILLE', NULL, true, '1', '2026-10-11 22:30:51.23+00', 'IFEF');
INSERT INTO public.entite (id_entite, nom, sigle, id_hierarchisation, id_entite_parent, localisation, responsable_nom, actif, id_user, dh_creation, id_nature) VALUES ('IFEF AGBOVILLE', 'Institution de Formation et d''Éducation Féminine d''Agboville', 'IFEF', 'IFEF', 'DR AGNEBY-TIASSA', 'AGBOVILLE', NULL, true, '1', '2026-10-11 22:30:51.23+00', 'IFEF');
INSERT INTO public.entite (id_entite, nom, sigle, id_hierarchisation, id_entite_parent, localisation, responsable_nom, actif, id_user, dh_creation, id_nature) VALUES ('CPPE AGBOVILLE', 'Centre de Protection de la Petite Enfance d''Agboville', 'CPPE', 'CPPE', 'DR AGNEBY-TIASSA', 'AGBOVILLE', NULL, true, '1', '2026-10-11 22:30:51.23+00', 'CPPE');
INSERT INTO public.entite (id_entite, nom, sigle, id_hierarchisation, id_entite_parent, localisation, responsable_nom, actif, id_user, dh_creation, id_nature) VALUES ('CT AGBOVILLE (CTEA)', 'Centre de Transit pour Enfants d''Agboville (Ctea)', 'CT', 'CT', 'DR AGNEBY-TIASSA', 'AGBOVILLE', NULL, true, '1', '2026-10-11 22:30:51.23+00', 'CT');
INSERT INTO public.entite (id_entite, nom, sigle, id_hierarchisation, id_entite_parent, localisation, responsable_nom, actif, id_user, dh_creation, id_nature) VALUES ('CPPE GRAND MOUTCHO', 'Centre de Protection de la Petite Enfance de Grand Moutcho', 'CPPE', 'CPPE', 'DR AGNEBY-TIASSA', 'GRAND MOUTCHO', NULL, true, '1', '2026-10-11 22:30:51.23+00', 'CPPE');
INSERT INTO public.entite (id_entite, nom, sigle, id_hierarchisation, id_entite_parent, localisation, responsable_nom, actif, id_user, dh_creation, id_nature) VALUES ('CSE TIASSALE', 'Complexe Socio-Éducatif de Tiassale', 'CSE', 'COMPLEXE_SOCIO_EDUCATIF', 'DR AGNEBY-TIASSA', 'TIASSALE', NULL, true, '1', '2026-10-11 22:30:51.23+00', 'CSE');
INSERT INTO public.entite (id_entite, nom, sigle, id_hierarchisation, id_entite_parent, localisation, responsable_nom, actif, id_user, dh_creation, id_nature) VALUES ('CPPE ASSALE TIEMOKO TIASSALE', 'Centre de Protection de la Petite Enfance d''Assale Tiemoko Tiassale', 'CPPE', 'CPPE', 'DR AGNEBY-TIASSA', 'TIASSALE', NULL, true, '1', '2026-10-11 22:30:51.23+00', 'CPPE');
INSERT INTO public.entite (id_entite, nom, sigle, id_hierarchisation, id_entite_parent, localisation, responsable_nom, actif, id_user, dh_creation, id_nature) VALUES ('IFEF TIASSALE', 'Institution de Formation et d''Éducation Féminine de Tiassale', 'IFEF', 'IFEF', 'DR AGNEBY-TIASSA', 'TIASSALE', NULL, true, '1', '2026-10-11 22:30:51.23+00', 'IFEF');
INSERT INTO public.entite (id_entite, nom, sigle, id_hierarchisation, id_entite_parent, localisation, responsable_nom, actif, id_user, dh_creation, id_nature) VALUES ('CPPE N''DOUCI', 'Centre de Protection de la Petite Enfance de n''Douci', 'CPPE', 'CPPE', 'DR AGNEBY-TIASSA', 'N''DOUCI', NULL, true, '1', '2026-10-11 22:30:51.23+00', 'CPPE');
INSERT INTO public.entite (id_entite, nom, sigle, id_hierarchisation, id_entite_parent, localisation, responsable_nom, actif, id_user, dh_creation, id_nature) VALUES ('IFEF TAABO', 'Institution de Formation et d''Éducation Féminine de Taabo', 'IFEF', 'IFEF', 'DR AGNEBY-TIASSA', 'TAABO', NULL, true, '1', '2026-10-11 22:30:51.23+00', 'IFEF');
INSERT INTO public.entite (id_entite, nom, sigle, id_hierarchisation, id_entite_parent, localisation, responsable_nom, actif, id_user, dh_creation, id_nature) VALUES ('IFEF SIKENSI', 'Institution de Formation et d''Éducation Féminine de Sikensi', 'IFEF', 'IFEF', 'DR AGNEBY-TIASSA', 'SIKENSI', NULL, true, '1', '2026-10-11 22:30:51.23+00', 'IFEF');
INSERT INTO public.entite (id_entite, nom, sigle, id_hierarchisation, id_entite_parent, localisation, responsable_nom, actif, id_user, dh_creation, id_nature) VALUES ('CES DALOA', 'Centre d''Éducation Spécialisée de Daloa', 'CES', 'CES', 'DR HAUT SASSANDRA', 'DALOA', NULL, true, '1', '2026-10-11 22:30:51.23+00', 'CES');
INSERT INTO public.entite (id_entite, nom, sigle, id_hierarchisation, id_entite_parent, localisation, responsable_nom, actif, id_user, dh_creation, id_nature) VALUES ('CSE DALOA', 'Complexe Socio Éducatif de Daloa', 'CSE', 'COMPLEXE_SOCIO_EDUCATIF', 'DR HAUT SASSANDRA', 'DALOA', NULL, true, '1', '2026-10-11 22:30:51.23+00', 'CSE');
INSERT INTO public.entite (id_entite, nom, sigle, id_hierarchisation, id_entite_parent, localisation, responsable_nom, actif, id_user, dh_creation, id_nature) VALUES ('CS DALOA', 'Centre Social de Daloa', 'CS', 'CS', 'DR HAUT SASSANDRA', 'DALOA', NULL, true, '1', '2026-10-11 22:30:51.23+00', 'CS');
INSERT INTO public.entite (id_entite, nom, sigle, id_hierarchisation, id_entite_parent, localisation, responsable_nom, actif, id_user, dh_creation, id_nature) VALUES ('CPPE DALOA COMMUNE', 'Centre de Protection de la Petite Enfance de Daloa Commune', 'CPPE', 'CPPE', 'DR HAUT SASSANDRA', 'DALOA', NULL, true, '1', '2026-10-11 22:30:51.23+00', 'CPPE');
INSERT INTO public.entite (id_entite, nom, sigle, id_hierarchisation, id_entite_parent, localisation, responsable_nom, actif, id_user, dh_creation, id_nature) VALUES ('CSE ISSIA', 'Complexe Socio Éducatif d''Issia', 'CSE', 'COMPLEXE_SOCIO_EDUCATIF', 'DR HAUT SASSANDRA', 'ISSIA', NULL, true, '1', '2026-10-11 22:30:51.23+00', 'CSE');
INSERT INTO public.entite (id_entite, nom, sigle, id_hierarchisation, id_entite_parent, localisation, responsable_nom, actif, id_user, dh_creation, id_nature) VALUES ('CES ISSIA', 'Centre d''Éducation Spécialisée Issia', 'CES', 'CES', 'DR HAUT SASSANDRA', 'ISSIA', NULL, true, '1', '2026-10-11 22:30:51.23+00', 'CES');
INSERT INTO public.entite (id_entite, nom, sigle, id_hierarchisation, id_entite_parent, localisation, responsable_nom, actif, id_user, dh_creation, id_nature) VALUES ('CS ISSIA', 'Centre Social de Issia', 'CS', 'CS', 'DR HAUT SASSANDRA', 'ISSIA', NULL, true, '1', '2026-10-11 22:30:51.23+00', 'CS');
INSERT INTO public.entite (id_entite, nom, sigle, id_hierarchisation, id_entite_parent, localisation, responsable_nom, actif, id_user, dh_creation, id_nature) VALUES ('CSE ZOUKOUGBEU', 'Complexe Socio-Éducatif de Zoukougbeu', 'CSE', 'COMPLEXE_SOCIO_EDUCATIF', 'DR HAUT SASSANDRA', 'ZOUKOUGBEU', NULL, true, '1', '2026-10-11 22:30:51.23+00', 'CSE');
INSERT INTO public.entite (id_entite, nom, sigle, id_hierarchisation, id_entite_parent, localisation, responsable_nom, actif, id_user, dh_creation, id_nature) VALUES ('CES ZOUKOUGBEU', 'Centre d''Éducation Spécialisée Zoukougbeu', 'CES', 'CES', 'DR HAUT SASSANDRA', 'ZOUKOUGBEU', NULL, true, '1', '2026-10-11 22:30:51.23+00', 'CES');
INSERT INTO public.entite (id_entite, nom, sigle, id_hierarchisation, id_entite_parent, localisation, responsable_nom, actif, id_user, dh_creation, id_nature) VALUES ('CSE VAVOUA', 'Complexe Socio-Éducatif de Vavoua', 'CSE', 'COMPLEXE_SOCIO_EDUCATIF', 'DR HAUT SASSANDRA', 'VAVOUA', NULL, true, '1', '2026-10-11 22:30:51.23+00', 'CSE');
INSERT INTO public.entite (id_entite, nom, sigle, id_hierarchisation, id_entite_parent, localisation, responsable_nom, actif, id_user, dh_creation, id_nature) VALUES ('IFEF DALOA COMMUNE', 'Institution de Formation et d''Éducation Féminine de Daloa Commune', 'IFEF', 'IFEF', 'DR HAUT SASSANDRA', 'DALOA', NULL, true, '1', '2026-10-11 22:30:51.23+00', 'IFEF');
INSERT INTO public.entite (id_entite, nom, sigle, id_hierarchisation, id_entite_parent, localisation, responsable_nom, actif, id_user, dh_creation, id_nature) VALUES ('IFEF DETAZIBOUO', 'Institution de Formation et d''Éducation Féminine de Tazibouo', 'IFEF', 'IFEF', 'DR HAUT SASSANDRA', 'DALOA', NULL, true, '1', '2026-10-11 22:30:51.23+00', 'IFEF');
INSERT INTO public.entite (id_entite, nom, sigle, id_hierarchisation, id_entite_parent, localisation, responsable_nom, actif, id_user, dh_creation, id_nature) VALUES ('IFEF TAZIBOUO', 'Institution de Formation et d''Éducation Féminine de Tazibouo', 'IFEF', 'IFEF', 'DR HAUT SASSANDRA', 'DALOA', NULL, true, '1', '2026-10-11 22:30:51.23+00', 'IFEF');
INSERT INTO public.entite (id_entite, nom, sigle, id_hierarchisation, id_entite_parent, localisation, responsable_nom, actif, id_user, dh_creation, id_nature) VALUES ('IFEF ISSIA', 'Institution de Formation et d''Éducation Féminine de Issia', 'IFEF', 'IFEF', 'DR HAUT SASSANDRA', 'ISSIA', NULL, true, '1', '2026-10-11 22:30:51.23+00', 'IFEF');
INSERT INTO public.entite (id_entite, nom, sigle, id_hierarchisation, id_entite_parent, localisation, responsable_nom, actif, id_user, dh_creation, id_nature) VALUES ('IFEF ZOUKOUGBEU', 'Institution de Formation et d''Éducation Féminine de Zoukougbeu', 'IFEF', 'IFEF', 'DR HAUT SASSANDRA', 'ZOUKOUGBEU', NULL, true, '1', '2026-10-11 22:30:51.23+00', 'IFEF');
INSERT INTO public.entite (id_entite, nom, sigle, id_hierarchisation, id_entite_parent, localisation, responsable_nom, actif, id_user, dh_creation, id_nature) VALUES ('IFEF VAVOUA', 'Institution de Formation et d''Éducation Féminine de Vavoua', 'IFEF', 'IFEF', 'DR HAUT SASSANDRA', 'VAVOUA', NULL, true, '1', '2026-10-11 22:30:51.23+00', 'IFEF');
INSERT INTO public.entite (id_entite, nom, sigle, id_hierarchisation, id_entite_parent, localisation, responsable_nom, actif, id_user, dh_creation, id_nature) VALUES ('CES ADZOPE', 'Centre d''Éducation Spécialisée d''Adzope', 'CES', 'CES', 'DR ME', 'COMMUNE D''ADZOPE', NULL, true, '1', '2026-10-11 22:30:51.23+00', 'CES');
INSERT INTO public.entite (id_entite, nom, sigle, id_hierarchisation, id_entite_parent, localisation, responsable_nom, actif, id_user, dh_creation, id_nature) VALUES ('CSE AKOUPÉ', 'Complexe Socio-Éducatif d''Akoupé', 'CSE', 'COMPLEXE_SOCIO_EDUCATIF', 'DR ME', 'COMMUNE D''AKOUPE', NULL, true, '1', '2026-10-11 22:30:51.23+00', 'CSE');
INSERT INTO public.entite (id_entite, nom, sigle, id_hierarchisation, id_entite_parent, localisation, responsable_nom, actif, id_user, dh_creation, id_nature) VALUES ('IFEF ADZOPE', 'Institut de Formation et d''Éducation Féminine d''Adzope', 'IFEF', 'IFEF', 'DR ME', 'COMMUNE D''ADZOPE', NULL, true, '1', '2026-10-11 22:30:51.23+00', 'IFEF');
INSERT INTO public.entite (id_entite, nom, sigle, id_hierarchisation, id_entite_parent, localisation, responsable_nom, actif, id_user, dh_creation, id_nature) VALUES ('CES AKOUPE', 'Centre d''Éducation Spécialisée d''Akoupe', 'CES', 'CES', 'DR ME', 'COMMUNE D''AKOUPE', NULL, true, '1', '2026-10-11 22:30:51.23+00', 'CES');
INSERT INTO public.entite (id_entite, nom, sigle, id_hierarchisation, id_entite_parent, localisation, responsable_nom, actif, id_user, dh_creation, id_nature) VALUES ('IFEF AFFERY', 'Institut de Formation et d''Éducation Féminine d''Affery', 'IFEF', 'IFEF', 'DR ME', 'AFFERY', NULL, true, '1', '2026-10-11 22:30:51.23+00', 'IFEF');
INSERT INTO public.entite (id_entite, nom, sigle, id_hierarchisation, id_entite_parent, localisation, responsable_nom, actif, id_user, dh_creation, id_nature) VALUES ('CACE MONTEZO', 'Centre d''Action Communautaire pour l''Enfance de Montezo', 'CACE', 'CACE', 'DR ME', 'MONTEZO', NULL, true, '1', '2026-10-11 22:30:51.23+00', 'CACE');
INSERT INTO public.entite (id_entite, nom, sigle, id_hierarchisation, id_entite_parent, localisation, responsable_nom, actif, id_user, dh_creation, id_nature) VALUES ('CES ALEPE', 'Centre d''Éducation Spécialisée d''Alepe', 'CES', 'CES', 'DR ME', 'COMMUNE D''ALEPE', NULL, true, '1', '2026-10-11 22:30:51.23+00', 'CES');
INSERT INTO public.entite (id_entite, nom, sigle, id_hierarchisation, id_entite_parent, localisation, responsable_nom, actif, id_user, dh_creation, id_nature) VALUES ('CPPE AHOUTOUE', 'Centre de Protection de la Petite Enfance d''Ahoutoue', 'CPPE', 'CPPE', 'DR ME', 'AHOUTOUE', NULL, true, '1', '2026-10-11 22:30:51.23+00', 'CPPE');
INSERT INTO public.entite (id_entite, nom, sigle, id_hierarchisation, id_entite_parent, localisation, responsable_nom, actif, id_user, dh_creation, id_nature) VALUES ('CSE ALEPE', 'Complexe Socio-Éducatif d''Alepe', 'CSE', 'COMPLEXE_SOCIO_EDUCATIF', 'DR ME', 'COMMUNE D''ALEPE', NULL, true, '1', '2026-10-11 22:30:51.23+00', 'CSE');
INSERT INTO public.entite (id_entite, nom, sigle, id_hierarchisation, id_entite_parent, localisation, responsable_nom, actif, id_user, dh_creation, id_nature) VALUES ('IFEF YAKASSE-ATTOBROU', 'Institution de Formation et d''Éducation Féminine d''Yakasse-Attobrou', 'IFEF', 'IFEF', 'DR ME', 'COMMUNE YAKASSE -ATTOBROU', NULL, true, '1', '2026-10-11 22:30:51.23+00', 'IFEF');
INSERT INTO public.entite (id_entite, nom, sigle, id_hierarchisation, id_entite_parent, localisation, responsable_nom, actif, id_user, dh_creation, id_nature) VALUES ('CACE ANGANKONAKRO', 'Centre d''Action Communautaire pour l''Enfance d''Angankonakro', 'CACE', 'CACE', 'DR N’ZI', 'DIMBOKRO', NULL, true, '1', '2026-10-11 22:30:51.23+00', 'CACE');
INSERT INTO public.entite (id_entite, nom, sigle, id_hierarchisation, id_entite_parent, localisation, responsable_nom, actif, id_user, dh_creation, id_nature) VALUES ('CSE DIMBOKRO', 'Complexe Socio-Éducatif de Dimbokro', 'CSE', 'COMPLEXE_SOCIO_EDUCATIF', 'DR N’ZI', 'DIMBOKRO', NULL, true, '1', '2026-10-11 22:30:51.23+00', 'CSE');
INSERT INTO public.entite (id_entite, nom, sigle, id_hierarchisation, id_entite_parent, localisation, responsable_nom, actif, id_user, dh_creation, id_nature) VALUES ('IFEF BOCANDA', 'Institution de Formation et d''Éducation Féminine de Bocanda', 'IFEF', 'IFEF', 'DR N’ZI', 'DIMBOKRO', NULL, true, '1', '2026-10-11 22:30:51.23+00', 'IFEF');
INSERT INTO public.entite (id_entite, nom, sigle, id_hierarchisation, id_entite_parent, localisation, responsable_nom, actif, id_user, dh_creation, id_nature) VALUES ('IFEF DIMBOKRO', 'Institution de Formation et d''Éducation Féminine de Dimbokro', 'IFEF', 'IFEF', 'DR N’ZI', 'DIMBOKRO', NULL, true, '1', '2026-10-11 22:30:51.23+00', 'IFEF');
INSERT INTO public.entite (id_entite, nom, sigle, id_hierarchisation, id_entite_parent, localisation, responsable_nom, actif, id_user, dh_creation, id_nature) VALUES ('IFEF KOUASSI-KOUASSIKRO', 'Institution de Formation et d''Éducation Féminine de Kouassi-Kouassikro', 'IFEF', 'IFEF', 'DR N’ZI', 'DIMBOKRO', NULL, true, '1', '2026-10-11 22:30:51.23+00', 'IFEF');
INSERT INTO public.entite (id_entite, nom, sigle, id_hierarchisation, id_entite_parent, localisation, responsable_nom, actif, id_user, dh_creation, id_nature) VALUES ('IFEF KOUASSIKOUASSIKRO', 'Institution de Formation et d''Éducation Féminine de Kouassikouassikro', 'IFEF', 'IFEF', 'DR N’ZI', 'KOUASSIKOUASSIKRO', NULL, true, '1', '2026-10-11 22:30:51.23+00', 'IFEF');
INSERT INTO public.entite (id_entite, nom, sigle, id_hierarchisation, id_entite_parent, localisation, responsable_nom, actif, id_user, dh_creation, id_nature) VALUES ('CSE SEGUELA', 'Complexe Socio-Éducatif de Seguela', 'CSE', 'COMPLEXE_SOCIO_EDUCATIF', 'DR WORODOUGOU', 'SEGUELA', NULL, true, '1', '2026-10-11 22:30:51.23+00', 'CSE');
INSERT INTO public.entite (id_entite, nom, sigle, id_hierarchisation, id_entite_parent, localisation, responsable_nom, actif, id_user, dh_creation, id_nature) VALUES ('IFEF KANI', 'Institution de Formation et d''Éducation Féminine de Kani', 'IFEF', 'IFEF', 'DR WORODOUGOU', 'KANI', NULL, true, '1', '2026-10-11 22:30:51.23+00', 'IFEF');
INSERT INTO public.entite (id_entite, nom, sigle, id_hierarchisation, id_entite_parent, localisation, responsable_nom, actif, id_user, dh_creation, id_nature) VALUES ('IFEF SEGUELA', 'Institution de Formation et d''Éducation Féminine de Seguela', 'IFEF', 'IFEF', 'DR WORODOUGOU', 'SEGUELA', NULL, true, '1', '2026-10-11 22:30:51.23+00', 'IFEF');
INSERT INTO public.entite (id_entite, nom, sigle, id_hierarchisation, id_entite_parent, localisation, responsable_nom, actif, id_user, dh_creation, id_nature) VALUES ('IFEF SAGOURA-DOUGOULA', 'Institution de Formation et d''Éducation Féminine de Sagoura-Dougoula', 'IFEF', 'IFEF', 'DR WORODOUGOU', 'SAGOURA-DOUGOULA', NULL, true, '1', '2026-10-11 22:30:51.23+00', 'IFEF');
INSERT INTO public.entite (id_entite, nom, sigle, id_hierarchisation, id_entite_parent, localisation, responsable_nom, actif, id_user, dh_creation, id_nature) VALUES ('IFEF DE DUALLA', 'Institution de Formation et d''Éducation Féminine de de Dualla', 'IFEF', 'IFEF', 'DR WORODOUGOU', 'DUALLA', NULL, true, '1', '2026-10-11 22:30:51.23+00', 'IFEF');
INSERT INTO public.entite (id_entite, nom, sigle, id_hierarchisation, id_entite_parent, localisation, responsable_nom, actif, id_user, dh_creation, id_nature) VALUES ('IFEF DUALLA', 'Institution de Formation et d''Éducation Féminine de Dualla', 'IFEF', 'IFEF', 'DR WORODOUGOU', 'DUALLA', NULL, true, '1', '2026-10-11 22:30:51.23+00', 'IFEF');
INSERT INTO public.entite (id_entite, nom, sigle, id_hierarchisation, id_entite_parent, localisation, responsable_nom, actif, id_user, dh_creation, id_nature) VALUES ('CA SOUBRE', 'Centre d''Accueil pour Enfants de Soubre', 'CA', 'CA', 'DR NAWA', 'SOUBRE', NULL, true, '1', '2026-10-11 22:30:51.23+00', 'CA');
INSERT INTO public.entite (id_entite, nom, sigle, id_hierarchisation, id_entite_parent, localisation, responsable_nom, actif, id_user, dh_creation, id_nature) VALUES ('CES CENTRE D''EDUCATION SPËCIALISEE DE SOUBRE', 'Centre d''Éducation Spëcialisee de Soubre', 'CES', 'CES', 'DR NAWA', 'SOUBRE', NULL, true, '1', '2026-10-11 22:30:51.23+00', 'CES');
INSERT INTO public.entite (id_entite, nom, sigle, id_hierarchisation, id_entite_parent, localisation, responsable_nom, actif, id_user, dh_creation, id_nature) VALUES ('IFEF BUYO', 'Institution de Formation et d''Éducation Féminine de Buyo', 'IFEF', 'IFEF', 'DR NAWA', 'BUYO', NULL, true, '1', '2026-10-11 22:30:51.23+00', 'IFEF');
INSERT INTO public.entite (id_entite, nom, sigle, id_hierarchisation, id_entite_parent, localisation, responsable_nom, actif, id_user, dh_creation, id_nature) VALUES ('IFEF SOUBRE', 'Institution de Formation et d''Éducation Féminine de Soubre', 'IFEF', 'IFEF', 'DR NAWA', 'SOUBRE', NULL, true, '1', '2026-10-11 22:30:51.23+00', 'IFEF');
INSERT INTO public.entite (id_entite, nom, sigle, id_hierarchisation, id_entite_parent, localisation, responsable_nom, actif, id_user, dh_creation, id_nature) VALUES ('IFEF GUEYO', 'Institution de Formation et d''Éducation Féminine de Gueyo', 'IFEF', 'IFEF', 'DR NAWA', 'GUEYO', NULL, true, '1', '2026-10-11 22:30:51.23+00', 'IFEF');
INSERT INTO public.entite (id_entite, nom, sigle, id_hierarchisation, id_entite_parent, localisation, responsable_nom, actif, id_user, dh_creation, id_nature) VALUES ('CES SOUBRE', 'Centre d''Éducation Spécialisée de Soubre', 'CES', 'CES', 'DR NAWA', 'SOUBRE', NULL, true, '1', '2026-10-11 22:30:51.23+00', 'CES');
INSERT INTO public.entite (id_entite, nom, sigle, id_hierarchisation, id_entite_parent, localisation, responsable_nom, actif, id_user, dh_creation, id_nature) VALUES ('CS SOUBRE', 'Centre Social de Soubre', 'CS', 'CS', 'DR NAWA', 'SOUBRE', NULL, true, '1', '2026-10-11 22:30:51.23+00', 'CS');
INSERT INTO public.entite (id_entite, nom, sigle, id_hierarchisation, id_entite_parent, localisation, responsable_nom, actif, id_user, dh_creation, id_nature) VALUES ('IFEF MEAGUI', 'Institution de Formation et d''Éducation Féminine de Meagui', 'IFEF', 'IFEF', 'DR NAWA', 'MEAGUI', NULL, true, '1', '2026-10-11 22:30:51.23+00', 'IFEF');
INSERT INTO public.entite (id_entite, nom, sigle, id_hierarchisation, id_entite_parent, localisation, responsable_nom, actif, id_user, dh_creation, id_nature) VALUES ('CACE WALEBO', 'Centre d''Action Communautaire pour l''Enfance de Walebo', 'CACE', 'CACE', 'DR NAWA', 'SOUBRE', NULL, true, '1', '2026-10-11 22:30:51.23+00', 'CACE');
INSERT INTO public.entite (id_entite, nom, sigle, id_hierarchisation, id_entite_parent, localisation, responsable_nom, actif, id_user, dh_creation, id_nature) VALUES ('CSE TOUBA', 'Complexe Socio-Éducatif de Touba', 'CSE', 'COMPLEXE_SOCIO_EDUCATIF', 'DR BAFING', 'TOUBA', NULL, true, '1', '2026-10-11 22:30:51.23+00', 'CSE');
INSERT INTO public.entite (id_entite, nom, sigle, id_hierarchisation, id_entite_parent, localisation, responsable_nom, actif, id_user, dh_creation, id_nature) VALUES ('ORPHELINAT GRAND BASSAM', 'Orphelinat National de Filles de Grand Bassam', 'ORPHELINAT', 'ORPHELINAT', 'DR SUD-COMOE', 'Grand Bassam', NULL, true, '1', '2026-10-11 22:30:51.23+00', 'ORPHELINAT');
INSERT INTO public.entite (id_entite, nom, sigle, id_hierarchisation, id_entite_parent, localisation, responsable_nom, actif, id_user, dh_creation, id_nature) VALUES ('CPPE GRAND-BASSAM', 'Centre de Protection de la Petite Enfance de Grand-Bassam', 'CPPE', 'CPPE', 'DR SUD-COMOE', 'GRAND-BASSAM', NULL, true, '1', '2026-10-11 22:30:51.23+00', 'CPPE');
INSERT INTO public.entite (id_entite, nom, sigle, id_hierarchisation, id_entite_parent, localisation, responsable_nom, actif, id_user, dh_creation, id_nature) VALUES ('IFEF GRAND-BASSAM', 'Institution de Formation et d''Éducation Féminine de Grand-Bassam', 'IFEF', 'IFEF', 'DR SUD-COMOE', 'GRAND-BASSAM', NULL, true, '1', '2026-10-11 22:30:51.23+00', 'IFEF');
INSERT INTO public.entite (id_entite, nom, sigle, id_hierarchisation, id_entite_parent, localisation, responsable_nom, actif, id_user, dh_creation, id_nature) VALUES ('ONG PADRE PIO', 'ONG Padre Pio', 'ONG', 'ONG', 'DR SUD-COMOE', 'BONOUA', NULL, true, '1', '2026-10-11 22:30:51.23+00', 'ONG');
INSERT INTO public.entite (id_entite, nom, sigle, id_hierarchisation, id_entite_parent, localisation, responsable_nom, actif, id_user, dh_creation, id_nature) VALUES ('CPPE SAMO', 'Centre de Protection de la Petite Enfance de Samo', 'CPPE', 'CPPE', 'DR SUD-COMOE', 'SAMO', NULL, true, '1', '2026-10-11 22:30:51.23+00', 'CPPE');
INSERT INTO public.entite (id_entite, nom, sigle, id_hierarchisation, id_entite_parent, localisation, responsable_nom, actif, id_user, dh_creation, id_nature) VALUES ('IFEF ADIAKE', 'Institution de Formation et d''Éducation Féminine de Adiake', 'IFEF', 'IFEF', 'DR SUD-COMOE', 'ADIAKE', NULL, true, '1', '2026-10-11 22:30:51.23+00', 'IFEF');
INSERT INTO public.entite (id_entite, nom, sigle, id_hierarchisation, id_entite_parent, localisation, responsable_nom, actif, id_user, dh_creation, id_nature) VALUES ('IFEF ABOISSO', 'Institution de Formation et d''Éducation Féminine Aboisso', 'IFEF', 'IFEF', 'DR SUD-COMOE', 'ABOISSO', NULL, true, '1', '2026-10-11 22:30:51.23+00', 'IFEF');
INSERT INTO public.entite (id_entite, nom, sigle, id_hierarchisation, id_entite_parent, localisation, responsable_nom, actif, id_user, dh_creation, id_nature) VALUES ('SOS VILLAGE', 'Sos Village', 'SOS VILLAGE', 'SOS VILLAGE', 'DR SUD-COMOE', 'ABOISSO', NULL, true, '1', '2026-10-11 22:30:51.23+00', 'SOS VILLAGE');
INSERT INTO public.entite (id_entite, nom, sigle, id_hierarchisation, id_entite_parent, localisation, responsable_nom, actif, id_user, dh_creation, id_nature) VALUES ('CSE GRAND GBAPLEU', 'Complexe Socio-Éducatif de Grand Gbapleu', 'CSE', 'COMPLEXE_SOCIO_EDUCATIF', 'DR TONKPI', 'MAN', NULL, true, '1', '2026-10-11 22:30:51.23+00', 'CSE');
INSERT INTO public.entite (id_entite, nom, sigle, id_hierarchisation, id_entite_parent, localisation, responsable_nom, actif, id_user, dh_creation, id_nature) VALUES ('CSE LOGOUALE', 'Complexe Socio-Éducatif de Logouale', 'CSE', 'COMPLEXE_SOCIO_EDUCATIF', 'DR TONKPI', 'LOGOUALE', NULL, true, '1', '2026-10-11 22:30:51.23+00', 'CSE');
INSERT INTO public.entite (id_entite, nom, sigle, id_hierarchisation, id_entite_parent, localisation, responsable_nom, actif, id_user, dh_creation, id_nature) VALUES ('CSE MAHAPLEU', 'Complexe Socio-Éducatif de Mahapleu', 'CSE', 'COMPLEXE_SOCIO_EDUCATIF', 'DR TONKPI', 'MAHAPLEU', NULL, true, '1', '2026-10-11 22:30:51.23+00', 'CSE');
INSERT INTO public.entite (id_entite, nom, sigle, id_hierarchisation, id_entite_parent, localisation, responsable_nom, actif, id_user, dh_creation, id_nature) VALUES ('CSE ZOUAN-HOUNIEN', 'Complexe Socio-Éducatif de Zouan-Hounien', 'CSE', 'COMPLEXE_SOCIO_EDUCATIF', 'DR TONKPI', 'ZOUAN-HOUNIEN', NULL, true, '1', '2026-10-11 22:30:51.23+00', 'CSE');
INSERT INTO public.entite (id_entite, nom, sigle, id_hierarchisation, id_entite_parent, localisation, responsable_nom, actif, id_user, dh_creation, id_nature) VALUES ('CSE DANANE', 'Complexe Socio-Éducatif de Danane', 'CSE', 'COMPLEXE_SOCIO_EDUCATIF', 'DR TONKPI', 'DANANE', NULL, true, '1', '2026-10-11 22:30:51.23+00', 'CSE');
INSERT INTO public.entite (id_entite, nom, sigle, id_hierarchisation, id_entite_parent, localisation, responsable_nom, actif, id_user, dh_creation, id_nature) VALUES ('CSE GBONE', 'Complexe Socio-Éducatif de Gbone', 'CSE', 'COMPLEXE_SOCIO_EDUCATIF', 'DR TONKPI', 'GBONE', NULL, true, '1', '2026-10-11 22:30:51.23+00', 'CSE');
INSERT INTO public.entite (id_entite, nom, sigle, id_hierarchisation, id_entite_parent, localisation, responsable_nom, actif, id_user, dh_creation, id_nature) VALUES ('IFEF MAN', 'Institution de Formation et d''Éducation Féminine de Man', 'IFEF', 'IFEF', 'DR TONKPI', 'MAN', NULL, true, '1', '2026-10-11 22:30:51.23+00', 'IFEF');
INSERT INTO public.entite (id_entite, nom, sigle, id_hierarchisation, id_entite_parent, localisation, responsable_nom, actif, id_user, dh_creation, id_nature) VALUES ('IFEF LOGOUALE', 'Institution de Formation et d''Éducation Féminine de Logouale', 'IFEF', 'IFEF', 'DR TONKPI', 'LOGOUALE', NULL, true, '1', '2026-10-11 22:30:51.23+00', 'IFEF');
INSERT INTO public.entite (id_entite, nom, sigle, id_hierarchisation, id_entite_parent, localisation, responsable_nom, actif, id_user, dh_creation, id_nature) VALUES ('IFEF BIN-HOUYE', 'Institution de Formation et d''Éducation Féminine de Bin-Houye', 'IFEF', 'IFEF', 'DR TONKPI', 'BIN-HOUYE', NULL, true, '1', '2026-10-11 22:30:51.23+00', 'IFEF');
INSERT INTO public.entite (id_entite, nom, sigle, id_hierarchisation, id_entite_parent, localisation, responsable_nom, actif, id_user, dh_creation, id_nature) VALUES ('IFEF GBONE', 'Institution de Formation et d''Éducation Féminine de Gbone', 'IFEF', 'IFEF', 'DR TONKPI', 'BIN-HOUYE', NULL, true, '1', '2026-10-11 22:30:51.23+00', 'IFEF');
INSERT INTO public.entite (id_entite, nom, sigle, id_hierarchisation, id_entite_parent, localisation, responsable_nom, actif, id_user, dh_creation, id_nature) VALUES ('IFEF DANANE', 'Institution de Formation et d''Éducation Féminine de Danane', 'IFEF', 'IFEF', 'DR TONKPI', 'DANANE', NULL, true, '1', '2026-10-11 22:30:51.23+00', 'IFEF');
INSERT INTO public.entite (id_entite, nom, sigle, id_hierarchisation, id_entite_parent, localisation, responsable_nom, actif, id_user, dh_creation, id_nature) VALUES ('CS DU CFP', 'Centre Social du Cfp', 'CS', 'CS', 'DR FOLON', 'KANIASSO', NULL, true, '1', '2026-10-11 22:30:51.23+00', 'CS');
INSERT INTO public.entite (id_entite, nom, sigle, id_hierarchisation, id_entite_parent, localisation, responsable_nom, actif, id_user, dh_creation, id_nature) VALUES ('IFEF DAOUKRO', 'Institution de Formation et d''Éducation Féminine Daoukro', 'IFEF', 'IFEF', 'DR IFFOU', 'Daoukro', NULL, true, '1', '2026-10-11 22:30:51.23+00', 'IFEF');
INSERT INTO public.entite (id_entite, nom, sigle, id_hierarchisation, id_entite_parent, localisation, responsable_nom, actif, id_user, dh_creation, id_nature) VALUES ('IFEF OUELLE', 'Institution de Formation et d''Éducation Féminine de Ouelle', 'IFEF', 'IFEF', 'DR IFFOU', 'Ouellé', NULL, true, '1', '2026-10-11 22:30:51.23+00', 'IFEF');
INSERT INTO public.entite (id_entite, nom, sigle, id_hierarchisation, id_entite_parent, localisation, responsable_nom, actif, id_user, dh_creation, id_nature) VALUES ('CSE M''BAHIAKRO', 'Complexe Socio-Éducatif de m''Bahiakro', 'CSE', 'COMPLEXE_SOCIO_EDUCATIF', 'DR IFFOU', 'M''bahiakro', NULL, true, '1', '2026-10-11 22:30:51.23+00', 'CSE');
INSERT INTO public.entite (id_entite, nom, sigle, id_hierarchisation, id_entite_parent, localisation, responsable_nom, actif, id_user, dh_creation, id_nature) VALUES ('IFEF M''BAHIAKRO', 'Institution de Formation et d''Éducation Féminine m''Bahiakro', 'IFEF', 'IFEF', 'DR IFFOU', 'M''bahiakro', NULL, true, '1', '2026-10-11 22:30:51.23+00', 'IFEF');
INSERT INTO public.entite (id_entite, nom, sigle, id_hierarchisation, id_entite_parent, localisation, responsable_nom, actif, id_user, dh_creation, id_nature) VALUES ('IFEF PRIKRO', 'Institution de Formation et d''Éducation Féminine Prikro', 'IFEF', 'IFEF', 'DR IFFOU', 'prikro', NULL, true, '1', '2026-10-11 22:30:51.23+00', 'IFEF');
INSERT INTO public.entite (id_entite, nom, sigle, id_hierarchisation, id_entite_parent, localisation, responsable_nom, actif, id_user, dh_creation, id_nature) VALUES ('CSE OUELLE', 'Complexe Socio-Éducatif de Ouelle', 'CSE', 'COMPLEXE_SOCIO_EDUCATIF', 'DR IFFOU', 'OUELLE', NULL, true, '1', '2026-10-11 22:30:51.23+00', 'CSE');
INSERT INTO public.entite (id_entite, nom, sigle, id_hierarchisation, id_entite_parent, localisation, responsable_nom, actif, id_user, dh_creation, id_nature) VALUES ('CSE FRESCO', 'Complexe Socio-Éducatif de Fresco', 'CSE', 'COMPLEXE_SOCIO_EDUCATIF', 'DR GBOKLE', 'FRESCO', NULL, true, '1', '2026-10-11 22:30:51.23+00', 'CSE');
INSERT INTO public.entite (id_entite, nom, sigle, id_hierarchisation, id_entite_parent, localisation, responsable_nom, actif, id_user, dh_creation, id_nature) VALUES ('IFEF SASSANDRA', 'Institution de Formation et d''Éducation Féminine de Sassandra', 'IFEF', 'IFEF', 'DR GBOKLE', 'SASSANDRA', NULL, true, '1', '2026-10-11 22:30:51.23+00', 'IFEF');
INSERT INTO public.entite (id_entite, nom, sigle, id_hierarchisation, id_entite_parent, localisation, responsable_nom, actif, id_user, dh_creation, id_nature) VALUES ('IFEF FRESCO', 'Institution de Formation et d''Éducation Féminine Fresco', 'IFEF', 'IFEF', 'DR GBOKLE', 'FRESCO', NULL, true, '1', '2026-10-11 22:30:51.23+00', 'IFEF');
INSERT INTO public.entite (id_entite, nom, sigle, id_hierarchisation, id_entite_parent, localisation, responsable_nom, actif, id_user, dh_creation, id_nature) VALUES ('CES ABOBO', 'Centre d''Éducation Spécialisée d''Abobo', 'CES', 'CES', 'DR ABIDJAN', 'ABOBO', NULL, true, '1', '2026-10-11 22:30:51.23+00', 'CES');
INSERT INTO public.entite (id_entite, nom, sigle, id_hierarchisation, id_entite_parent, localisation, responsable_nom, actif, id_user, dh_creation, id_nature) VALUES ('CS ABOBO', 'Centre Social d''Abobo', 'CS', 'CS', 'DR ABIDJAN', 'ABOBO', NULL, true, '1', '2026-10-11 22:30:51.23+00', 'CS');
INSERT INTO public.entite (id_entite, nom, sigle, id_hierarchisation, id_entite_parent, localisation, responsable_nom, actif, id_user, dh_creation, id_nature) VALUES ('CSE ABOBO', 'Complexe Socio-Éducatif d''Abobo', 'CSE', 'COMPLEXE_SOCIO_EDUCATIF', 'DR ABIDJAN', 'ABOBO', NULL, true, '1', '2026-10-11 22:30:51.23+00', 'CSE');
INSERT INTO public.entite (id_entite, nom, sigle, id_hierarchisation, id_entite_parent, localisation, responsable_nom, actif, id_user, dh_creation, id_nature) VALUES ('CPPE ABOBO CENTRE', 'Centre de Protection de la Petite Enfance d''Abobo Centre', 'CPPE', 'CPPE', 'DR ABIDJAN', 'ABOBO', NULL, true, '1', '2026-10-11 22:30:51.23+00', 'CPPE');
INSERT INTO public.entite (id_entite, nom, sigle, id_hierarchisation, id_entite_parent, localisation, responsable_nom, actif, id_user, dh_creation, id_nature) VALUES ('IFEF ABOBO SOGEFHIA', 'Institution de Formation et d''Éducation Féminine Abobo Sogefhia', 'IFEF', 'IFEF', 'DR ABIDJAN', 'ABOBO', NULL, true, '1', '2026-10-11 22:30:51.23+00', 'IFEF');
INSERT INTO public.entite (id_entite, nom, sigle, id_hierarchisation, id_entite_parent, localisation, responsable_nom, actif, id_user, dh_creation, id_nature) VALUES ('CPPE LES ANGES D''ABOUABOU', 'Centre de Protection de la Petite Enfance les Anges d''Abouabou', 'CPPE', 'CPPE', 'DR ABIDJAN', 'ABOUABOU', NULL, true, '1', '2026-10-11 22:30:51.23+00', 'CPPE');
INSERT INTO public.entite (id_entite, nom, sigle, id_hierarchisation, id_entite_parent, localisation, responsable_nom, actif, id_user, dh_creation, id_nature) VALUES ('IFEF ADIOPODOUME', 'Institution de Formation et d''Éducation Féminine Adiopodoume', 'IFEF', 'IFEF', 'DR ABIDJAN', 'ADIOPODOUME', NULL, true, '1', '2026-10-11 22:30:51.23+00', 'IFEF');
INSERT INTO public.entite (id_entite, nom, sigle, id_hierarchisation, id_entite_parent, localisation, responsable_nom, actif, id_user, dh_creation, id_nature) VALUES ('CES ADJAME SANTE', 'Centre d''Éducation Spécialisée d''Adjame Sante', 'CES', 'CES', 'DR ABIDJAN', 'ADJAME', NULL, true, '1', '2026-10-11 22:30:51.23+00', 'CES');
INSERT INTO public.entite (id_entite, nom, sigle, id_hierarchisation, id_entite_parent, localisation, responsable_nom, actif, id_user, dh_creation, id_nature) VALUES ('CS ADJAME SANTE', 'Centre Social d''Adjame Sante', 'CS', 'CS', 'DR ABIDJAN', 'ADJAME', NULL, true, '1', '2026-10-11 22:30:51.23+00', 'CS');
INSERT INTO public.entite (id_entite, nom, sigle, id_hierarchisation, id_entite_parent, localisation, responsable_nom, actif, id_user, dh_creation, id_nature) VALUES ('CPPE ADJAME SANTE', 'Centre de Protection de la Petite Enfance Adjame Sante', 'CPPE', 'CPPE', 'DR ABIDJAN', 'ADJAME', NULL, true, '1', '2026-10-11 22:30:51.23+00', 'CPPE');
INSERT INTO public.entite (id_entite, nom, sigle, id_hierarchisation, id_entite_parent, localisation, responsable_nom, actif, id_user, dh_creation, id_nature) VALUES ('IFEF MARIE THERESE HOUPHOUET BOIGNY', 'Institution de Formation et d''Éducation Féminine Marie Thérèse Houphouet Boigny', 'IFEF', 'IFEF', 'DR ABIDJAN', 'ADJAME', NULL, true, '1', '2026-10-11 22:30:51.23+00', 'IFEF');
INSERT INTO public.entite (id_entite, nom, sigle, id_hierarchisation, id_entite_parent, localisation, responsable_nom, actif, id_user, dh_creation, id_nature) VALUES ('POUPONNIERE MARIE THERESE HOUPHOUET BOIGNY', 'Pouponnière Marie Thérèse Houphouet Boigny', 'POUPONNIERE', 'POUPONNIERE', 'DR ABIDJAN', 'ADJAME', NULL, true, '1', '2026-10-11 22:30:51.23+00', 'POUPONNIERE');
INSERT INTO public.entite (id_entite, nom, sigle, id_hierarchisation, id_entite_parent, localisation, responsable_nom, actif, id_user, dh_creation, id_nature) VALUES ('CES ADJAME 220 LGTS', 'Centre d''Éducation Spécialisée Adjame 220 Lgts', 'CES', 'CES', 'DR ABIDJAN', 'ADJAME', NULL, true, '1', '2026-10-11 22:30:51.23+00', 'CES');
INSERT INTO public.entite (id_entite, nom, sigle, id_hierarchisation, id_entite_parent, localisation, responsable_nom, actif, id_user, dh_creation, id_nature) VALUES ('CS ADJAME 220 LGTS', 'Centre Social d''Adjame 220 Lgts', 'CS', 'CS', 'DR ABIDJAN', 'ADJAME', NULL, true, '1', '2026-10-11 22:30:51.23+00', 'CS');
INSERT INTO public.entite (id_entite, nom, sigle, id_hierarchisation, id_entite_parent, localisation, responsable_nom, actif, id_user, dh_creation, id_nature) VALUES ('CSE ADJAME 220 LGTS', 'Complexe Socio-Éducatif Adjame 220 Lgts', 'CSE', 'COMPLEXE_SOCIO_EDUCATIF', 'DR ABIDJAN', 'ADJAME', NULL, true, '1', '2026-10-11 22:30:51.23+00', 'CSE');
INSERT INTO public.entite (id_entite, nom, sigle, id_hierarchisation, id_entite_parent, localisation, responsable_nom, actif, id_user, dh_creation, id_nature) VALUES ('CPPE ADJAME 220 LGTS', 'Centre de Protection de la Petite Enfance d''Adjame 220 Lgts', 'CPPE', 'CPPE', 'DR ABIDJAN', 'ADJAME', NULL, true, '1', '2026-10-11 22:30:51.23+00', 'CPPE');
INSERT INTO public.entite (id_entite, nom, sigle, id_hierarchisation, id_entite_parent, localisation, responsable_nom, actif, id_user, dh_creation, id_nature) VALUES ('CPPE LES MINIMES D''ANONO', 'Centre de Protection de la Petite Enfance les Minimes d''Anono', 'CPPE', 'CPPE', 'DR ABIDJAN', 'ANONO', NULL, true, '1', '2026-10-11 22:30:51.23+00', 'CPPE');
INSERT INTO public.entite (id_entite, nom, sigle, id_hierarchisation, id_entite_parent, localisation, responsable_nom, actif, id_user, dh_creation, id_nature) VALUES ('IFEF ANYAMA', 'Institution de Formation et d''Éducation Féminine Anyama', 'IFEF', 'IFEF', 'DR ABIDJAN', 'ANYAMA', NULL, true, '1', '2026-10-11 22:30:51.23+00', 'IFEF');
INSERT INTO public.entite (id_entite, nom, sigle, id_hierarchisation, id_entite_parent, localisation, responsable_nom, actif, id_user, dh_creation, id_nature) VALUES ('CENTRE PAVVIOS', 'Centre Pavvios', 'STRUCTURE SPECIALISEE', 'STRUCTURE_SPECIALISEE', NULL, 'ATTECOUBE', NULL, true, '1', '2026-10-11 22:30:51.23+00', 'STRUCTURE SPECIALISEE');
INSERT INTO public.entite (id_entite, nom, sigle, id_hierarchisation, id_entite_parent, localisation, responsable_nom, actif, id_user, dh_creation, id_nature) VALUES ('GARDERIE DEBARCADERE LOCODJRO', 'Garderie du Debarcadere de Locodjro', 'GARDERIE', 'GARDERIE', 'DR ABIDJAN', 'ATTECOUBE', NULL, true, '1', '2026-10-11 22:30:51.23+00', 'GARDERIE');
INSERT INTO public.entite (id_entite, nom, sigle, id_hierarchisation, id_entite_parent, localisation, responsable_nom, actif, id_user, dh_creation, id_nature) VALUES ('IFEF ABOBODOUME', 'Institution de Formation et d''Éducation Féminine Abobodoume', 'IFEF', 'IFEF', 'DR ABIDJAN', 'ATTECOUBE', NULL, true, '1', '2026-10-11 22:30:51.23+00', 'IFEF');
INSERT INTO public.entite (id_entite, nom, sigle, id_hierarchisation, id_entite_parent, localisation, responsable_nom, actif, id_user, dh_creation, id_nature) VALUES ('IFEF ATTECOUBE', 'Institution de Formation et d''Éducation Féminine Attecoube', 'IFEF', 'IFEF', 'DR ABIDJAN', 'ATTECOUBE', NULL, true, '1', '2026-10-11 22:30:51.23+00', 'IFEF');
INSERT INTO public.entite (id_entite, nom, sigle, id_hierarchisation, id_entite_parent, localisation, responsable_nom, actif, id_user, dh_creation, id_nature) VALUES ('CACE GBAGBA BERLIN', 'Centre d''Action Communautaire pour l''Enfance de Gbagba Berlin', 'CACE', 'CACE', 'DR ABIDJAN', 'BINGERVILLE', NULL, true, '1', '2026-10-11 22:30:51.23+00', 'CACE');
INSERT INTO public.entite (id_entite, nom, sigle, id_hierarchisation, id_entite_parent, localisation, responsable_nom, actif, id_user, dh_creation, id_nature) VALUES ('CACE KOFFIKRO', 'Centre d''Action Communautaire pour l''Enfance de Koffikro', 'CACE', 'CACE', 'DR ABIDJAN', 'BINGERVILLE', NULL, true, '1', '2026-10-11 22:30:51.23+00', 'CACE');
INSERT INTO public.entite (id_entite, nom, sigle, id_hierarchisation, id_entite_parent, localisation, responsable_nom, actif, id_user, dh_creation, id_nature) VALUES ('CPPE AKWE - DJEMIN', 'Centre de Protection de la Petite Enfance d''Akwe - Djemin', 'CPPE', 'CPPE', 'DR ABIDJAN', 'BINGERVILLE', NULL, true, '1', '2026-10-11 22:30:51.23+00', 'CPPE');
INSERT INTO public.entite (id_entite, nom, sigle, id_hierarchisation, id_entite_parent, localisation, responsable_nom, actif, id_user, dh_creation, id_nature) VALUES ('ORPHELINAT BINGERVILLE', 'Orphelinat de Garçons de Bingerville', 'ORPHELINAT', 'ORPHELINAT', 'DR ABIDJAN', 'BINGERVILLE', NULL, true, '1', '2026-10-11 22:30:51.23+00', 'ORPHELINAT');
INSERT INTO public.entite (id_entite, nom, sigle, id_hierarchisation, id_entite_parent, localisation, responsable_nom, actif, id_user, dh_creation, id_nature) VALUES ('CES COCODY NORD', 'Centre d''Éducation Spécialisé de Cocody Nord', 'CES', 'CES', 'DR ABIDJAN', 'COCODY', NULL, true, '1', '2026-10-11 22:30:51.23+00', 'CES');
INSERT INTO public.entite (id_entite, nom, sigle, id_hierarchisation, id_entite_parent, localisation, responsable_nom, actif, id_user, dh_creation, id_nature) VALUES ('CSE COCODY-NORD', 'Complexe Socio-Éducatif Cocody-Nord', 'CSE', 'COMPLEXE_SOCIO_EDUCATIF', 'DR ABIDJAN', 'COCODY', NULL, true, '1', '2026-10-11 22:30:51.23+00', 'CSE');
INSERT INTO public.entite (id_entite, nom, sigle, id_hierarchisation, id_entite_parent, localisation, responsable_nom, actif, id_user, dh_creation, id_nature) VALUES ('CPPE COCODY NORD', 'Centre de Protection de la Petite Enfance de Cocody Nord', 'CPPE', 'CPPE', 'DR ABIDJAN', 'COCODY', NULL, true, '1', '2026-10-11 22:30:51.23+00', 'CPPE');
INSERT INTO public.entite (id_entite, nom, sigle, id_hierarchisation, id_entite_parent, localisation, responsable_nom, actif, id_user, dh_creation, id_nature) VALUES ('CPPE DJOROGOBITE DE LA CITE SIR', 'Centre de Protection de la Petite Enfance de Djorogobite de la Cite Sir', 'CPPE', 'CPPE', 'DR ABIDJAN', 'COCODY', NULL, true, '1', '2026-10-11 22:30:51.23+00', 'CPPE');
INSERT INTO public.entite (id_entite, nom, sigle, id_hierarchisation, id_entite_parent, localisation, responsable_nom, actif, id_user, dh_creation, id_nature) VALUES ('CPPE LES HAMEAUX', 'Centre de Protection de la Petite Enfance les Hameaux', 'CPPE', 'CPPE', 'DR ABIDJAN', 'COCODY', NULL, true, '1', '2026-10-11 22:30:51.23+00', 'CPPE');
INSERT INTO public.entite (id_entite, nom, sigle, id_hierarchisation, id_entite_parent, localisation, responsable_nom, actif, id_user, dh_creation, id_nature) VALUES ('IFEF SAINTE FAMILLE', 'Institution de Formation et d''Éducation Féminine Sainte Famille', 'IFEF', 'IFEF', 'DR ABIDJAN', 'COCODY', NULL, true, '1', '2026-10-11 22:30:51.23+00', 'IFEF');
INSERT INTO public.entite (id_entite, nom, sigle, id_hierarchisation, id_entite_parent, localisation, responsable_nom, actif, id_user, dh_creation, id_nature) VALUES ('CES KOUMASSI CENTRE', 'Centre d''Éducation Spécialisée de Koumassi Centre', 'CES', 'CES', 'DR ABIDJAN', 'KOUMASSI', NULL, true, '1', '2026-10-11 22:30:51.23+00', 'CES');
INSERT INTO public.entite (id_entite, nom, sigle, id_hierarchisation, id_entite_parent, localisation, responsable_nom, actif, id_user, dh_creation, id_nature) VALUES ('CSE KOUMASSI', 'Complexe Socio-Éducatif Koumassi', 'CSE', 'COMPLEXE_SOCIO_EDUCATIF', 'DR ABIDJAN', 'KOUMASSI', NULL, true, '1', '2026-10-11 22:30:51.23+00', 'CSE');
INSERT INTO public.entite (id_entite, nom, sigle, id_hierarchisation, id_entite_parent, localisation, responsable_nom, actif, id_user, dh_creation, id_nature) VALUES ('CPPE MAMIE ADJOUA KOUMASSI', 'Centre de Protection de la Petite Enfance Mamie Adjoua Koumassi', 'CPPE', 'CPPE', 'DR ABIDJAN', 'KOUMASSI', NULL, true, '1', '2026-10-11 22:30:51.23+00', 'CPPE');
INSERT INTO public.entite (id_entite, nom, sigle, id_hierarchisation, id_entite_parent, localisation, responsable_nom, actif, id_user, dh_creation, id_nature) VALUES ('IFEF KOUMASSI', 'Institution de Formation et d''Éducation Féminine de Koumassi', 'IFEF', 'IFEF', 'DR ABIDJAN', 'KOUMASSI', NULL, true, '1', '2026-10-11 22:30:51.23+00', 'IFEF');
INSERT INTO public.entite (id_entite, nom, sigle, id_hierarchisation, id_entite_parent, localisation, responsable_nom, actif, id_user, dh_creation, id_nature) VALUES ('CENTRE EDUCATIF ZONE 4C', 'Centre Educatif Zone 4C', 'CENTRE EDUCATIF', 'CENTRE EDUCATIF', NULL, 'MARCORY', NULL, true, '1', '2026-10-11 22:30:51.23+00', 'CENTRE EDUCATIF');
INSERT INTO public.entite (id_entite, nom, sigle, id_hierarchisation, id_entite_parent, localisation, responsable_nom, actif, id_user, dh_creation, id_nature) VALUES ('IFEF MARCORY ANOUMABO ESPOIR', 'Institution de Formation et d''Éducation Féminine Marcory Anoumabo Espoir', 'IFEF', 'IFEF', 'DR ABIDJAN', 'MARCORY', NULL, true, '1', '2026-10-11 22:30:51.23+00', 'IFEF');
INSERT INTO public.entite (id_entite, nom, sigle, id_hierarchisation, id_entite_parent, localisation, responsable_nom, actif, id_user, dh_creation, id_nature) VALUES ('IFEF MARCORY MARCHE', 'Institution de Formation et d''Éducation Féminine Marcory Marché', 'IFEF', 'IFEF', 'DR ABIDJAN', 'MARCORY', NULL, true, '1', '2026-10-11 22:30:51.23+00', 'IFEF');
INSERT INTO public.entite (id_entite, nom, sigle, id_hierarchisation, id_entite_parent, localisation, responsable_nom, actif, id_user, dh_creation, id_nature) VALUES ('CES CENTRE D''EDUCATION SPECIALISE DE PORT - BOUET', 'Centre d''Éducation Spécialisé de Port - Bouet', 'CES', 'CES', 'DR ABIDJAN', 'PORT - BOUËT', NULL, true, '1', '2026-10-11 22:30:51.23+00', 'CES');
INSERT INTO public.entite (id_entite, nom, sigle, id_hierarchisation, id_entite_parent, localisation, responsable_nom, actif, id_user, dh_creation, id_nature) VALUES ('CS PORT - BOUET', 'Centre Social de Port - Bouet', 'CS', 'CS', 'DR ABIDJAN', 'PORT - BOUËT', NULL, true, '1', '2026-10-11 22:30:51.23+00', 'CS');
INSERT INTO public.entite (id_entite, nom, sigle, id_hierarchisation, id_entite_parent, localisation, responsable_nom, actif, id_user, dh_creation, id_nature) VALUES ('CSE PORT - BOUET', 'Complexe Socio-Éducatif de Port - Bouet', 'CSE', 'COMPLEXE_SOCIO_EDUCATIF', 'DR ABIDJAN', 'PORT - BOUËT', NULL, true, '1', '2026-10-11 22:30:51.23+00', 'CSE');
INSERT INTO public.entite (id_entite, nom, sigle, id_hierarchisation, id_entite_parent, localisation, responsable_nom, actif, id_user, dh_creation, id_nature) VALUES ('CPPE PORT - BOUET', 'Centre de Protection de la Petite Enfance de Port - Bouet', 'CPPE', 'CPPE', 'DR ABIDJAN', 'PORT - BOUËT', NULL, true, '1', '2026-10-11 22:30:51.23+00', 'CPPE');
INSERT INTO public.entite (id_entite, nom, sigle, id_hierarchisation, id_entite_parent, localisation, responsable_nom, actif, id_user, dh_creation, id_nature) VALUES ('IFEF PORT-BOUET', 'Institution de Formation et d''Éducation Féminine Port-Bouet', 'IFEF', 'IFEF', 'DR ABIDJAN', 'PORT - BOUËT', NULL, true, '1', '2026-10-11 22:30:51.23+00', 'IFEF');
INSERT INTO public.entite (id_entite, nom, sigle, id_hierarchisation, id_entite_parent, localisation, responsable_nom, actif, id_user, dh_creation, id_nature) VALUES ('CS ABADJIN KOUTE', 'Centre Social de Abadjin Koute', 'CS', 'CS', 'DR ABIDJAN', 'SONGON', NULL, true, '1', '2026-10-11 22:30:51.23+00', 'CS');
INSERT INTO public.entite (id_entite, nom, sigle, id_hierarchisation, id_entite_parent, localisation, responsable_nom, actif, id_user, dh_creation, id_nature) VALUES ('CSE ABADJIN KOUTE SONGON', 'Complexe Socio-Éducatif d’Abadjin Koute Songon', 'CSE', 'COMPLEXE_SOCIO_EDUCATIF', 'DR ABIDJAN', 'SONGON', NULL, true, '1', '2026-10-11 22:30:51.23+00', 'CSE');
INSERT INTO public.entite (id_entite, nom, sigle, id_hierarchisation, id_entite_parent, localisation, responsable_nom, actif, id_user, dh_creation, id_nature) VALUES ('IFEF SONGON', 'Institution de Formation et d''Éducation Féminine de Songon', 'IFEF', 'IFEF', 'DR ABIDJAN', 'SONGON', NULL, true, '1', '2026-10-11 22:30:51.23+00', 'IFEF');
INSERT INTO public.entite (id_entite, nom, sigle, id_hierarchisation, id_entite_parent, localisation, responsable_nom, actif, id_user, dh_creation, id_nature) VALUES ('CES TREICHVILLE', 'Centre d''Éducation Spécialisée de Treichville', 'CES', 'CES', 'DR ABIDJAN', 'TREICHVILLE', NULL, true, '1', '2026-10-11 22:30:51.23+00', 'CES');
INSERT INTO public.entite (id_entite, nom, sigle, id_hierarchisation, id_entite_parent, localisation, responsable_nom, actif, id_user, dh_creation, id_nature) VALUES ('CSE TREICHVILLE', 'Complexe Socio-Éducatif de Treichville', 'CSE', 'COMPLEXE_SOCIO_EDUCATIF', 'DR ABIDJAN', 'TREICHVILLE', NULL, true, '1', '2026-10-11 22:30:51.23+00', 'CSE');
INSERT INTO public.entite (id_entite, nom, sigle, id_hierarchisation, id_entite_parent, localisation, responsable_nom, actif, id_user, dh_creation, id_nature) VALUES ('CSE TREICHVILLE AVENUE 1', 'Complexe Socio-Éducatif Treichville Avenue 1', 'CSE', 'COMPLEXE_SOCIO_EDUCATIF', 'DR ABIDJAN', 'TREICHVILLE', NULL, true, '1', '2026-10-11 22:30:51.23+00', 'CSE');
INSERT INTO public.entite (id_entite, nom, sigle, id_hierarchisation, id_entite_parent, localisation, responsable_nom, actif, id_user, dh_creation, id_nature) VALUES ('CPPE TREICHVILLE AV 1', 'Centre de Protection de la Petite Enfance de Treichville Av 1', 'CPPE', 'CPPE', 'DR ABIDJAN', 'TREICHVILLE', NULL, true, '1', '2026-10-11 22:30:51.23+00', 'CPPE');
INSERT INTO public.entite (id_entite, nom, sigle, id_hierarchisation, id_entite_parent, localisation, responsable_nom, actif, id_user, dh_creation, id_nature) VALUES ('IFEF TREICHVILLE', 'Institution de Formation et d''Éducation Féminine de Treichville', 'IFEF', 'IFEF', 'DR ABIDJAN', 'TREICHVILLE', NULL, true, '1', '2026-10-11 22:30:51.23+00', 'IFEF');
INSERT INTO public.entite (id_entite, nom, sigle, id_hierarchisation, id_entite_parent, localisation, responsable_nom, actif, id_user, dh_creation, id_nature) VALUES ('CES PORT - BOUET 2', 'Centre d''Éducation Spécialisée de Port - Bouet 2', 'CES', 'CES', 'DR ABIDJAN', 'YOPOUGON', NULL, true, '1', '2026-10-11 22:30:51.23+00', 'CES');
INSERT INTO public.entite (id_entite, nom, sigle, id_hierarchisation, id_entite_parent, localisation, responsable_nom, actif, id_user, dh_creation, id_nature) VALUES ('CS YOPOUGON PORT - BOEUT 2', 'Centre Social de Yopougon Port - Bouet 2', 'CS', 'CS', 'DR ABIDJAN', 'YOPOUGON', NULL, true, '1', '2026-10-11 22:30:51.23+00', 'CS');
INSERT INTO public.entite (id_entite, nom, sigle, id_hierarchisation, id_entite_parent, localisation, responsable_nom, actif, id_user, dh_creation, id_nature) VALUES ('CSE YOPOUGON PORT - BOUET 2', 'Complexe Socio-Éducatif Yopougon Port - Bouet 2', 'CSE', 'COMPLEXE_SOCIO_EDUCATIF', 'DR ABIDJAN', 'YOPOUGON', NULL, true, '1', '2026-10-11 22:30:51.23+00', 'CSE');
INSERT INTO public.entite (id_entite, nom, sigle, id_hierarchisation, id_entite_parent, localisation, responsable_nom, actif, id_user, dh_creation, id_nature) VALUES ('CPPE MAMIE ADJOUA DE YOPOUGON', 'Centre de Protection de la Petite Enfance Mamie Adjoua de Yopougon', 'CPPE', 'CPPE', 'DR ABIDJAN', 'YOPOUGON', NULL, true, '1', '2026-10-11 22:30:51.23+00', 'CPPE');
INSERT INTO public.entite (id_entite, nom, sigle, id_hierarchisation, id_entite_parent, localisation, responsable_nom, actif, id_user, dh_creation, id_nature) VALUES ('IFEF SOLIC 3', 'Institution de Formation et d''Éducation Féminine Solic 3', 'IFEF', 'IFEF', 'DR ABIDJAN', 'YOPOUGON', NULL, true, '1', '2026-10-11 22:30:51.23+00', 'IFEF');
INSERT INTO public.entite (id_entite, nom, sigle, id_hierarchisation, id_entite_parent, localisation, responsable_nom, actif, id_user, dh_creation, id_nature) VALUES ('IFEF YOPOUGON-MAIRIE', 'Institution de Formation et d''Éducation Féminine Yopougon-Mairie', 'IFEF', 'IFEF', 'DR ABIDJAN', 'YOPOUGON', NULL, true, '1', '2026-10-11 22:30:51.23+00', 'IFEF');
INSERT INTO public.entite (id_entite, nom, sigle, id_hierarchisation, id_entite_parent, localisation, responsable_nom, actif, id_user, dh_creation, id_nature) VALUES ('POUPONNIERE YOPOUGON ATTIE', 'Pouponnière de Yopougon Attie', 'POUPONNIERE', 'POUPONNIERE', 'DR ABIDJAN', 'YOPOUGON', NULL, true, '1', '2026-10-11 22:30:51.23+00', 'POUPONNIERE');
INSERT INTO public.entite (id_entite, nom, sigle, id_hierarchisation, id_entite_parent, localisation, responsable_nom, actif, id_user, dh_creation, id_nature) VALUES ('MAISON DES FEMMES D''ADIAKE', 'Maison des Femmes d''Adiake', 'STRUCTURE SPECIALISEE', 'STRUCTURE_SPECIALISEE', 'DR SUD-COMOE', 'ADIAKE', NULL, true, '1', '2026-10-11 22:30:51.23+00', 'STRUCTURE SPECIALISEE');
INSERT INTO public.entite (id_entite, nom, sigle, id_hierarchisation, id_entite_parent, localisation, responsable_nom, actif, id_user, dh_creation, id_nature) VALUES ('CES YAMOUSSOUKRO', 'Centre d''Éducation Spécialisée Yamoussoukro', 'CES', 'CES', 'DR BELIER', 'YAMOUSSOUKRO', NULL, true, '1', '2026-10-11 22:30:51.23+00', 'CES');
INSERT INTO public.entite (id_entite, nom, sigle, id_hierarchisation, id_entite_parent, localisation, responsable_nom, actif, id_user, dh_creation, id_nature) VALUES ('SOS VILLAGE ABOBO', 'Sos Village Abobo', 'SOS VILLAGE', 'SOS VILLAGE', 'DR ABIDJAN', 'ABOBO', NULL, true, '1', '2026-10-11 22:30:51.23+00', 'SOS VILLAGE');
INSERT INTO public.entite (id_entite, nom, sigle, id_hierarchisation, id_entite_parent, localisation, responsable_nom, actif, id_user, dh_creation, id_nature) VALUES ('CES 2 KORHOGO', 'Centre d''Éducation Spécialisée 2 de Korhogo', 'CES', 'CES', 'DR PORO', 'KORHOGO', NULL, true, '1', '2026-10-11 22:30:51.23+00', 'CES');
INSERT INTO public.entite (id_entite, nom, sigle, id_hierarchisation, id_entite_parent, localisation, responsable_nom, actif, id_user, dh_creation, id_nature) VALUES ('CS SIRASSO', 'Centre Social de Sirasso', 'CS', 'CS', 'DR PORO', 'SIRASSO', NULL, true, '1', '2026-10-11 22:30:51.23+00', 'CS');
INSERT INTO public.entite (id_entite, nom, sigle, id_hierarchisation, id_entite_parent, localisation, responsable_nom, actif, id_user, dh_creation, id_nature) VALUES ('CES KAGBOLODOUGOU', 'Centre d''Éducation Spécialisée de Kagbolodougou', 'CES', 'CES', 'DR PORO', 'KAGBOLODOUGOU', NULL, true, '1', '2026-10-11 22:30:51.23+00', 'CES');
INSERT INTO public.entite (id_entite, nom, sigle, id_hierarchisation, id_entite_parent, localisation, responsable_nom, actif, id_user, dh_creation, id_nature) VALUES ('CA DES VICTIMES DE VBG', 'Centre d''Accueil et d''Hebergement des Victimes de Vbg', 'CA', 'CA', 'DR PORO', 'KORHOGO', NULL, true, '1', '2026-10-11 22:30:51.23+00', 'CA');
INSERT INTO public.entite (id_entite, nom, sigle, id_hierarchisation, id_entite_parent, localisation, responsable_nom, actif, id_user, dh_creation, id_nature) VALUES ('CACE DUEKOUE', 'Centre d''Action Communautaire pour l''Enfance de Duekoue', 'CACE', 'CACE', 'DR GUEMON', 'DUEKOUE', NULL, true, '1', '2026-10-11 22:30:51.23+00', 'CACE');
INSERT INTO public.entite (id_entite, nom, sigle, id_hierarchisation, id_entite_parent, localisation, responsable_nom, actif, id_user, dh_creation, id_nature) VALUES ('CSE FACOBLY', 'Complexe Socio-Éducatif de Facobly', 'CSE', 'COMPLEXE_SOCIO_EDUCATIF', 'DR GUEMON', 'FACOBLY', NULL, true, '1', '2026-10-11 22:30:51.23+00', 'CSE');
INSERT INTO public.entite (id_entite, nom, sigle, id_hierarchisation, id_entite_parent, localisation, responsable_nom, actif, id_user, dh_creation, id_nature) VALUES ('CS BEOUMI', 'Centre Social de Beoumi', 'CS', 'CS', 'DR GBEKE', 'BOUAKE', NULL, true, '1', '2026-10-11 22:30:51.23+00', 'CS');
INSERT INTO public.entite (id_entite, nom, sigle, id_hierarchisation, id_entite_parent, localisation, responsable_nom, actif, id_user, dh_creation, id_nature) VALUES ('CACE BOTRO', 'Centre d''Action Communautaire pour l''Enfance de Botro', 'CACE', 'CACE', 'DR GBEKE', 'BOTRO', NULL, true, '1', '2026-10-11 22:30:51.23+00', 'CACE');
INSERT INTO public.entite (id_entite, nom, sigle, id_hierarchisation, id_entite_parent, localisation, responsable_nom, actif, id_user, dh_creation, id_nature) VALUES ('CACE BODOKRO', 'Centre d''Action Communautaire pour l''Enfance de Bodokro', 'CACE', 'CACE', 'DR GBEKE', 'BODOKRO', NULL, true, '1', '2026-10-11 22:30:51.23+00', 'CACE');
INSERT INTO public.entite (id_entite, nom, sigle, id_hierarchisation, id_entite_parent, localisation, responsable_nom, actif, id_user, dh_creation, id_nature) VALUES ('CACE KANANGO KPLI', 'Centre d''Action Communautaire pour l''Enfance de Kanango Kpli', 'CACE', 'CACE', 'DR GBEKE', 'KPLI', NULL, true, '1', '2026-10-11 22:30:51.23+00', 'CACE');
INSERT INTO public.entite (id_entite, nom, sigle, id_hierarchisation, id_entite_parent, localisation, responsable_nom, actif, id_user, dh_creation, id_nature) VALUES ('CACE OLIENOU', 'Centre d''Action Communautaire pour l''Enfance de Olienou', 'CACE', 'CACE', 'DR GBEKE', 'OLIENOU', NULL, true, '1', '2026-10-11 22:30:51.23+00', 'CACE');
INSERT INTO public.entite (id_entite, nom, sigle, id_hierarchisation, id_entite_parent, localisation, responsable_nom, actif, id_user, dh_creation, id_nature) VALUES ('CACE KONZO', 'Centre d''Action Communautaire pour l''Enfance de Konzo', 'CACE', 'CACE', 'DR GBEKE', 'KONZO', NULL, true, '1', '2026-10-11 22:30:51.23+00', 'CACE');
INSERT INTO public.entite (id_entite, nom, sigle, id_hierarchisation, id_entite_parent, localisation, responsable_nom, actif, id_user, dh_creation, id_nature) VALUES ('CACE KOUNDANOU', 'Centre d''Action Communautaire pour l''Enfance de Koundanou', 'CACE', 'CACE', 'DR GBEKE', 'KOUNDANOU', NULL, true, '1', '2026-10-11 22:30:51.23+00', 'CACE');
INSERT INTO public.entite (id_entite, nom, sigle, id_hierarchisation, id_entite_parent, localisation, responsable_nom, actif, id_user, dh_creation, id_nature) VALUES ('CS BOUAKE', 'Centre Solidarité d''Action Sociale de Bouake', 'CS', 'CS', 'DR GBEKE', 'BOUAKE', NULL, true, '1', '2026-10-11 22:30:51.23+00', 'CS');
INSERT INTO public.entite (id_entite, nom, sigle, id_hierarchisation, id_entite_parent, localisation, responsable_nom, actif, id_user, dh_creation, id_nature) VALUES ('POUPONNIERE MAISON DES BEBES', 'Pouponnière Privée Maison des Bébés', 'POUPONNIERE', 'POUPONNIERE', 'DR GBEKE', 'BOUAKE', NULL, true, '1', '2026-10-11 22:30:51.23+00', 'POUPONNIERE');
INSERT INTO public.entite (id_entite, nom, sigle, id_hierarchisation, id_entite_parent, localisation, responsable_nom, actif, id_user, dh_creation, id_nature) VALUES ('CACE BONZI', 'Centre d''Action Communautaire pour l''Enfance de Bonzi', 'CACE', 'CACE', 'DR BELIER', 'BONZI', NULL, true, '1', '2026-10-11 22:30:51.23+00', 'CACE');
INSERT INTO public.entite (id_entite, nom, sigle, id_hierarchisation, id_entite_parent, localisation, responsable_nom, actif, id_user, dh_creation, id_nature) VALUES ('CACE TIBISSOU', 'Centre d''Action Communautaire pour l''Enfance de Tibissou', 'CACE', 'CACE', 'DR BELIER', 'GBANGBOSSOU', NULL, true, '1', '2026-10-11 22:30:51.23+00', 'CACE');
INSERT INTO public.entite (id_entite, nom, sigle, id_hierarchisation, id_entite_parent, localisation, responsable_nom, actif, id_user, dh_creation, id_nature) VALUES ('CACE GBANGBOSSOU', 'Centre d''Action Communautaire pour l''Enfance de Gbangbossou', 'CACE', 'CACE', 'DR BELIER', 'TIEBISSOU', NULL, true, '1', '2026-10-11 22:30:51.23+00', 'CACE');
INSERT INTO public.entite (id_entite, nom, sigle, id_hierarchisation, id_entite_parent, localisation, responsable_nom, actif, id_user, dh_creation, id_nature) VALUES ('CPPE "DOMINIQUE OUATTARA" ATTEKRO/DIDIEVI', 'Centre de Protection de la Petite Enfance de "Dominique Ouattara" Attekro/Didievi', 'CPPE', 'CPPE', 'DR BELIER', 'ATTEKRO', NULL, true, '1', '2026-10-11 22:30:51.23+00', 'CPPE');
INSERT INTO public.entite (id_entite, nom, sigle, id_hierarchisation, id_entite_parent, localisation, responsable_nom, actif, id_user, dh_creation, id_nature) VALUES ('CPPE SOPIM', 'Centre de Protection de la Petite Enfance de Sopim', 'CPPE', 'CPPE', 'DR BELIER', 'YAMOUSSOUKRO', NULL, true, '1', '2026-10-11 22:30:51.23+00', 'CPPE');
INSERT INTO public.entite (id_entite, nom, sigle, id_hierarchisation, id_entite_parent, localisation, responsable_nom, actif, id_user, dh_creation, id_nature) VALUES ('CACE ANGODA', 'Centre d''Action Communautaire pour l''Enfance de Angoda', 'CACE', 'CACE', 'DR BELIER', 'ANGODA/TOUMODI', NULL, true, '1', '2026-10-11 22:30:51.23+00', 'CACE');
INSERT INTO public.entite (id_entite, nom, sigle, id_hierarchisation, id_entite_parent, localisation, responsable_nom, actif, id_user, dh_creation, id_nature) VALUES ('CS DEYAMOUSSOUKRO', 'Centre Social de Yamoussoukro', 'CS', 'CS', 'DR BELIER', 'YAMOUSSOUKRO', NULL, true, '1', '2026-10-11 22:30:51.23+00', 'CS');
INSERT INTO public.entite (id_entite, nom, sigle, id_hierarchisation, id_entite_parent, localisation, responsable_nom, actif, id_user, dh_creation, id_nature) VALUES ('CACE NOTRE DAME DE LOURDE DE TOUMODI', 'Centre d''Action Communautaire pour l''Enfance de Notre Dame de Lourde de Toumodi', 'CACE', 'CACE', 'DR BELIER', 'TOUMODI', NULL, true, '1', '2026-10-11 22:30:51.23+00', 'CACE');
INSERT INTO public.entite (id_entite, nom, sigle, id_hierarchisation, id_entite_parent, localisation, responsable_nom, actif, id_user, dh_creation, id_nature) VALUES ('CPPE DOMINIQUE OUATTARA" ATTEKRO/DIDIEVI', 'Centre de Protection de la Petite Enfance de Dominique Ouattara" Attekro/Didievi', 'CPPE', 'CPPE', 'DR BELIER', 'ATTEKRO', NULL, true, '1', '2026-10-11 22:30:51.23+00', 'CPPE');
INSERT INTO public.entite (id_entite, nom, sigle, id_hierarchisation, id_entite_parent, localisation, responsable_nom, actif, id_user, dh_creation, id_nature) VALUES ('CACE SOPIM/YAKRO', 'Centre d''Action Communautaire pour l''Enfance de Sopim/Yakro', 'CACE', 'CACE', 'DR BELIER', 'YAMOUSSOUKRO', NULL, true, '1', '2026-10-11 22:30:51.23+00', 'CACE');
INSERT INTO public.entite (id_entite, nom, sigle, id_hierarchisation, id_entite_parent, localisation, responsable_nom, actif, id_user, dh_creation, id_nature) VALUES ('CACE KOUPELA', 'Centre d''Action Communautaire pour l''Enfance de Koupela', 'CACE', 'CACE', 'DR MARAHOUE', 'KOUPELA', NULL, true, '1', '2026-10-11 22:30:51.23+00', 'CACE');
INSERT INTO public.entite (id_entite, nom, sigle, id_hierarchisation, id_entite_parent, localisation, responsable_nom, actif, id_user, dh_creation, id_nature) VALUES ('CACE SINFRA', 'Centre d''Action Communautaire pour l''Enfance de Sinfra', 'CACE', 'CACE', 'DR MARAHOUE', 'N''DENOUKRO', NULL, true, '1', '2026-10-11 22:30:51.23+00', 'CACE');
INSERT INTO public.entite (id_entite, nom, sigle, id_hierarchisation, id_entite_parent, localisation, responsable_nom, actif, id_user, dh_creation, id_nature) VALUES ('CACE N''DENOUKRO', 'Centre d''Action Communautaire pour l''Enfance de n''Denoukro', 'CACE', 'CACE', 'DR MARAHOUE', 'N''DENOUKRO', NULL, true, '1', '2026-10-11 22:30:51.23+00', 'CACE');
INSERT INTO public.entite (id_entite, nom, sigle, id_hierarchisation, id_entite_parent, localisation, responsable_nom, actif, id_user, dh_creation, id_nature) VALUES ('CACE ZUENOULA', 'Centre d''Action Communautaire pour l''Enfance de Zuenoula', 'CACE', 'CACE', 'DR MARAHOUE', 'ZUÉNOULA', NULL, true, '1', '2026-10-11 22:30:51.23+00', 'CACE');
INSERT INTO public.entite (id_entite, nom, sigle, id_hierarchisation, id_entite_parent, localisation, responsable_nom, actif, id_user, dh_creation, id_nature) VALUES ('CACE BONON', 'Centre d''Action Communautaire pour l''Enfance de Bonon', 'CACE', 'CACE', 'DR MARAHOUE', 'BONON', NULL, true, '1', '2026-10-11 22:30:51.23+00', 'CACE');
INSERT INTO public.entite (id_entite, nom, sigle, id_hierarchisation, id_entite_parent, localisation, responsable_nom, actif, id_user, dh_creation, id_nature) VALUES ('CS BONGOUANOU', 'Centre Social de Bongouanou', 'CS', 'CS', 'DR MORONOU', 'BONGOUANOU', NULL, true, '1', '2026-10-11 22:30:51.23+00', 'CS');
INSERT INTO public.entite (id_entite, nom, sigle, id_hierarchisation, id_entite_parent, localisation, responsable_nom, actif, id_user, dh_creation, id_nature) VALUES ('CPPE BONGOUANOU', 'Centre de Protection de la Petite Enfance de Bongouanou', 'CPPE', 'CPPE', 'DR MORONOU', 'BONGOUANOU', NULL, true, '1', '2026-10-11 22:30:51.23+00', 'CPPE');
INSERT INTO public.entite (id_entite, nom, sigle, id_hierarchisation, id_entite_parent, localisation, responsable_nom, actif, id_user, dh_creation, id_nature) VALUES ('CS ARRAH', 'Centre Social de Arrah', 'CS', 'CS', 'DR MORONOU', 'ARRAH', NULL, true, '1', '2026-10-11 22:30:51.23+00', 'CS');
INSERT INTO public.entite (id_entite, nom, sigle, id_hierarchisation, id_entite_parent, localisation, responsable_nom, actif, id_user, dh_creation, id_nature) VALUES ('CACE M''BATTO', 'Centre d''Action Communautaire pour l''Enfance de m''Batto', 'CACE', 'CACE', 'DR MORONOU', 'M’BATTO', NULL, true, '1', '2026-10-11 22:30:51.23+00', 'CACE');
INSERT INTO public.entite (id_entite, nom, sigle, id_hierarchisation, id_entite_parent, localisation, responsable_nom, actif, id_user, dh_creation, id_nature) VALUES ('CACE N''GUESSANKRO', 'Centre d''Action Communautaire pour l''Enfance de n''Guessankro', 'CACE', 'CACE', 'DR MORONOU', 'N’GUESSANKRO', NULL, true, '1', '2026-10-11 22:30:51.23+00', 'CACE');
INSERT INTO public.entite (id_entite, nom, sigle, id_hierarchisation, id_entite_parent, localisation, responsable_nom, actif, id_user, dh_creation, id_nature) VALUES ('CPPE ASSIE-ASSASSO', 'Centre de Protection de la Petite Enfance de Assie-Assasso', 'CPPE', 'CPPE', 'DR MORONOU', 'ASSIE-ASSASSO', NULL, true, '1', '2026-10-11 22:30:51.23+00', 'CPPE');
INSERT INTO public.entite (id_entite, nom, sigle, id_hierarchisation, id_entite_parent, localisation, responsable_nom, actif, id_user, dh_creation, id_nature) VALUES ('CACE ANOUMABA', 'Centre d''Action Communautaire pour l''Enfance de Anoumaba', 'CACE', 'CACE', 'DR MORONOU', 'ANOUMABA', NULL, true, '1', '2026-10-11 22:30:51.23+00', 'CACE');
INSERT INTO public.entite (id_entite, nom, sigle, id_hierarchisation, id_entite_parent, localisation, responsable_nom, actif, id_user, dh_creation, id_nature) VALUES ('CACE ASSAHARA', 'Centre d''Action Communautaire pour l''Enfance de Assahara', 'CACE', 'CACE', 'DR MORONOU', 'ASSAHARA', NULL, true, '1', '2026-10-11 22:30:51.23+00', 'CACE');
INSERT INTO public.entite (id_entite, nom, sigle, id_hierarchisation, id_entite_parent, localisation, responsable_nom, actif, id_user, dh_creation, id_nature) VALUES ('CACE BOUAFFOUKRO', 'Centre d''Action Communautaire pour l''Enfance de Bouaffoukro', 'CACE', 'CACE', 'DR MORONOU', 'BOUAFFOUKRO', NULL, true, '1', '2026-10-11 22:30:51.23+00', 'CACE');
INSERT INTO public.entite (id_entite, nom, sigle, id_hierarchisation, id_entite_parent, localisation, responsable_nom, actif, id_user, dh_creation, id_nature) VALUES ('CPPE OUEDALLAH', 'Centre de Protection de la Petite Enfance de Ouedallah', 'CPPE', 'CPPE', 'DR BERE', 'OUEDALLAH', NULL, true, '1', '2026-10-11 22:30:51.23+00', 'CPPE');
INSERT INTO public.entite (id_entite, nom, sigle, id_hierarchisation, id_entite_parent, localisation, responsable_nom, actif, id_user, dh_creation, id_nature) VALUES ('CSE GRAND BEREBI', 'Complexe Socio-Éducatif Grand Berebi', 'CSE', 'COMPLEXE_SOCIO_EDUCATIF', 'DR SAN PEDRO', 'GRAND BEREBI', NULL, true, '1', '2026-10-11 22:30:51.23+00', 'CSE');
INSERT INTO public.entite (id_entite, nom, sigle, id_hierarchisation, id_entite_parent, localisation, responsable_nom, actif, id_user, dh_creation, id_nature) VALUES ('CPPE DIVO', 'Centre de Protection de la Petite Enfance de Divo', 'CPPE', 'CPPE', 'DR LOH-DJIBOUA', 'DIVO', NULL, true, '1', '2026-10-11 22:30:51.23+00', 'CPPE');
INSERT INTO public.entite (id_entite, nom, sigle, id_hierarchisation, id_entite_parent, localisation, responsable_nom, actif, id_user, dh_creation, id_nature) VALUES ('CACE MAKOBERI', 'Centre d''Action Communautaire pour l''Enfance de Makoberi', 'CACE', 'CACE', 'DR LOH-DJIBOUA', 'MAKOBERI', NULL, true, '1', '2026-10-11 22:30:51.23+00', 'CACE');
INSERT INTO public.entite (id_entite, nom, sigle, id_hierarchisation, id_entite_parent, localisation, responsable_nom, actif, id_user, dh_creation, id_nature) VALUES ('CACE ZIKISSO', 'Centre d''Action Communautaire pour l''Enfance de Zikisso', 'CACE', 'CACE', 'DR LOH-DJIBOUA', 'ZIKISSO', NULL, true, '1', '2026-10-11 22:30:51.23+00', 'CACE');
INSERT INTO public.entite (id_entite, nom, sigle, id_hierarchisation, id_entite_parent, localisation, responsable_nom, actif, id_user, dh_creation, id_nature) VALUES ('CACE GAGORE', 'Centre d''Action Communautaire pour l''Enfance de Gagore', 'CACE', 'CACE', 'DR LOH-DJIBOUA', 'GAGORE', NULL, true, '1', '2026-10-11 22:30:51.23+00', 'CACE');
INSERT INTO public.entite (id_entite, nom, sigle, id_hierarchisation, id_entite_parent, localisation, responsable_nom, actif, id_user, dh_creation, id_nature) VALUES ('CACE DATTA', 'Centre d''Action Communautaire pour l''Enfance de Datta', 'CACE', 'CACE', 'DR LOH-DJIBOUA', 'DATTA', NULL, true, '1', '2026-10-11 22:30:51.23+00', 'CACE');
INSERT INTO public.entite (id_entite, nom, sigle, id_hierarchisation, id_entite_parent, localisation, responsable_nom, actif, id_user, dh_creation, id_nature) VALUES ('CACE DIEKOLILIE', 'Centre d''Action Communautaire pour l''Enfance de Diekolilie', 'CACE', 'CACE', 'DR LOH-DJIBOUA', 'DIEKOLILIE', NULL, true, '1', '2026-10-11 22:30:51.23+00', 'CACE');
INSERT INTO public.entite (id_entite, nom, sigle, id_hierarchisation, id_entite_parent, localisation, responsable_nom, actif, id_user, dh_creation, id_nature) VALUES ('CACE GNIGUEDOUGOU', 'Centre d''Action Communautaire pour l''Enfance de Gniguedougou', 'CACE', 'CACE', 'DR LOH-DJIBOUA', 'GNIGUEDOUGOU', NULL, true, '1', '2026-10-11 22:30:51.23+00', 'CACE');
INSERT INTO public.entite (id_entite, nom, sigle, id_hierarchisation, id_entite_parent, localisation, responsable_nom, actif, id_user, dh_creation, id_nature) VALUES ('CACE LABODOUGOU', 'Centre d''Action Communautaire pour l''Enfance de Labodougou', 'CACE', 'CACE', 'DR LOH-DJIBOUA', 'LABODOUGOU', NULL, true, '1', '2026-10-11 22:30:51.23+00', 'CACE');
INSERT INTO public.entite (id_entite, nom, sigle, id_hierarchisation, id_entite_parent, localisation, responsable_nom, actif, id_user, dh_creation, id_nature) VALUES ('CS BOUNA', 'Centre Social de Bouna', 'CS', 'CS', 'DR BOUNKANI', 'BOUNA', NULL, true, '1', '2026-10-11 22:30:51.23+00', 'CS');
INSERT INTO public.entite (id_entite, nom, sigle, id_hierarchisation, id_entite_parent, localisation, responsable_nom, actif, id_user, dh_creation, id_nature) VALUES ('CPPE BOUNA', 'Centre de Protection de la Petite Enfance de Bouna', 'CPPE', 'CPPE', 'DR BOUNKANI', 'BOUNA', NULL, true, '1', '2026-10-11 22:30:51.23+00', 'CPPE');
INSERT INTO public.entite (id_entite, nom, sigle, id_hierarchisation, id_entite_parent, localisation, responsable_nom, actif, id_user, dh_creation, id_nature) VALUES ('CACE BILAHIO', 'Centre d''Action Communautaire pour l''Enfance de Bilahio', 'CACE', 'CACE', 'DR GOH', 'BILAHIO/GUIBEROUA', NULL, true, '1', '2026-10-11 22:30:51.23+00', 'CACE');
INSERT INTO public.entite (id_entite, nom, sigle, id_hierarchisation, id_entite_parent, localisation, responsable_nom, actif, id_user, dh_creation, id_nature) VALUES ('CACE GBANAKRO', 'Centre d''Action Communautaire pour l''Enfance de Gbanakro', 'CACE', 'CACE', 'DR GOH', 'GBANAKRO', NULL, true, '1', '2026-10-11 22:30:51.23+00', 'CACE');
INSERT INTO public.entite (id_entite, nom, sigle, id_hierarchisation, id_entite_parent, localisation, responsable_nom, actif, id_user, dh_creation, id_nature) VALUES ('CACE ALLAKONANKRO', 'Centre d''Action Communautaire pour l''Enfance de Allakonankro', 'CACE', 'CACE', 'DR GOH', 'ALLAKONANKRO', NULL, true, '1', '2026-10-11 22:30:51.23+00', 'CACE');
INSERT INTO public.entite (id_entite, nom, sigle, id_hierarchisation, id_entite_parent, localisation, responsable_nom, actif, id_user, dh_creation, id_nature) VALUES ('CACE MAHINADOPA', 'Centre d''Action Communautaire pour l''Enfance de Mahinadopa', 'CACE', 'CACE', 'DR GOH', 'MAHINADOPA', NULL, true, '1', '2026-10-11 22:30:51.23+00', 'CACE');
INSERT INTO public.entite (id_entite, nom, sigle, id_hierarchisation, id_entite_parent, localisation, responsable_nom, actif, id_user, dh_creation, id_nature) VALUES ('CACE AHUA', 'Centre d''Action Communautaire pour l''Enfance de Ahua', 'CACE', 'CACE', 'DR GOH', 'ATONIHIO', NULL, true, '1', '2026-10-11 22:30:51.23+00', 'CACE');
INSERT INTO public.entite (id_entite, nom, sigle, id_hierarchisation, id_entite_parent, localisation, responsable_nom, actif, id_user, dh_creation, id_nature) VALUES ('CPPE GOTA BAOULE', 'Centre de Protection de la Petite Enfance de Gota Baoule', 'CPPE', 'CPPE', 'DR GOH', 'GOTA BAOULE/OUME', NULL, true, '1', '2026-10-11 22:30:51.23+00', 'CPPE');
INSERT INTO public.entite (id_entite, nom, sigle, id_hierarchisation, id_entite_parent, localisation, responsable_nom, actif, id_user, dh_creation, id_nature) VALUES ('CACE ADJACOUTIE', 'Centre d''Action Communautaire pour l''Enfance de Adjacoutie', 'CACE', 'CACE', 'DR GRAND PONT', 'JACQUEVILLE', NULL, true, '1', '2026-10-11 22:30:51.23+00', 'CACE');
INSERT INTO public.entite (id_entite, nom, sigle, id_hierarchisation, id_entite_parent, localisation, responsable_nom, actif, id_user, dh_creation, id_nature) VALUES ('CPPE JACQUEVILLE', 'Centre de Protection de la Petite Enfance de Jacqueville', 'CPPE', 'CPPE', 'DR GRAND PONT', 'JACQUEVILLE', NULL, true, '1', '2026-10-11 22:30:51.23+00', 'CPPE');
INSERT INTO public.entite (id_entite, nom, sigle, id_hierarchisation, id_entite_parent, localisation, responsable_nom, actif, id_user, dh_creation, id_nature) VALUES ('CPPE ADOUMANGAN', 'Centre de Protection de la Petite Enfance d''Adoumangan', 'CPPE', 'CPPE', 'DR GRAND PONT', 'JACQUEVILLE', NULL, true, '1', '2026-10-11 22:30:51.23+00', 'CPPE');
INSERT INTO public.entite (id_entite, nom, sigle, id_hierarchisation, id_entite_parent, localisation, responsable_nom, actif, id_user, dh_creation, id_nature) VALUES ('CACE SICOR', 'Centre d''Action Communautaire pour l''Enfance de Sicor', 'CACE', 'CACE', 'DR GRAND PONT', 'JACQUEVILLE', NULL, true, '1', '2026-10-11 22:30:51.23+00', 'CACE');
INSERT INTO public.entite (id_entite, nom, sigle, id_hierarchisation, id_entite_parent, localisation, responsable_nom, actif, id_user, dh_creation, id_nature) VALUES ('CACE PILOTE DE DABOU', 'Centre d''Action Communautaire pour l''Enfance de Pilote de Dabou', 'CACE', 'CACE', 'DR GRAND PONT', 'DABOU', NULL, true, '1', '2026-10-11 22:30:51.23+00', 'CACE');
INSERT INTO public.entite (id_entite, nom, sigle, id_hierarchisation, id_entite_parent, localisation, responsable_nom, actif, id_user, dh_creation, id_nature) VALUES ('GARDERIE VIEL AKLOJ DABOU', 'Garderie d''Enfant VIEL AKLOJ/DABOU Viel Aklodj de Dabou', 'GARDERIE', 'GARDERIE', 'DR GRAND PONT', 'VIEL AKLOJ/DABOU', NULL, true, '1', '2026-10-11 22:30:51.23+00', 'GARDERIE');
INSERT INTO public.entite (id_entite, nom, sigle, id_hierarchisation, id_entite_parent, localisation, responsable_nom, actif, id_user, dh_creation, id_nature) VALUES ('CACE LOPOU', 'Centre d''Action Communautaire pour l''Enfance de Lopou', 'CACE', 'CACE', 'DR GRAND PONT', 'LOPOU', NULL, true, '1', '2026-10-11 22:30:51.23+00', 'CACE');
INSERT INTO public.entite (id_entite, nom, sigle, id_hierarchisation, id_entite_parent, localisation, responsable_nom, actif, id_user, dh_creation, id_nature) VALUES ('CACE BODOU', 'Centre d''Action Communautaire pour l''Enfance de Bodou', 'CACE', 'CACE', 'DR GRAND PONT', 'DABOU', NULL, true, '1', '2026-10-11 22:30:51.23+00', 'CACE');
INSERT INTO public.entite (id_entite, nom, sigle, id_hierarchisation, id_entite_parent, localisation, responsable_nom, actif, id_user, dh_creation, id_nature) VALUES ('CPPE KOUTO', 'Centre de Protection de la Petite Enfance de Kouto', 'CPPE', 'CPPE', 'DR BAGOUE', 'KOUTO', NULL, true, '1', '2026-10-11 22:30:51.23+00', 'CPPE');
INSERT INTO public.entite (id_entite, nom, sigle, id_hierarchisation, id_entite_parent, localisation, responsable_nom, actif, id_user, dh_creation, id_nature) VALUES ('CPPE NIABLE', 'Centre de Protection de la Petite Enfance de Niable', 'CPPE', 'CPPE', 'DR INDENIE-DJUABLIN', 'NIABLE', NULL, true, '1', '2026-10-11 22:30:51.23+00', 'CPPE');
INSERT INTO public.entite (id_entite, nom, sigle, id_hierarchisation, id_entite_parent, localisation, responsable_nom, actif, id_user, dh_creation, id_nature) VALUES ('CPPE ZINZENOU', 'Centre de Protection de la Petite Enfance de Zinzenou', 'CPPE', 'CPPE', 'DR INDENIE-DJUABLIN', 'ZINZENOU', NULL, true, '1', '2026-10-11 22:30:51.23+00', 'CPPE');
INSERT INTO public.entite (id_entite, nom, sigle, id_hierarchisation, id_entite_parent, localisation, responsable_nom, actif, id_user, dh_creation, id_nature) VALUES ('CACE SANKADIOKRO', 'Centre d''Action Communautaire pour l''Enfance de Sankadiokro', 'CACE', 'CACE', 'DR INDENIE-DJUABLIN', 'SANKADIOKRO', NULL, true, '1', '2026-10-11 22:30:51.23+00', 'CACE');
INSERT INTO public.entite (id_entite, nom, sigle, id_hierarchisation, id_entite_parent, localisation, responsable_nom, actif, id_user, dh_creation, id_nature) VALUES ('CACE D''ETTIENKRO', 'Centre d''Action Communautaire pour l''Enfance de d''Ettienkro', 'CACE', 'CACE', 'DR INDENIE-DJUABLIN', 'ETTIENKRO', NULL, true, '1', '2026-10-11 22:30:51.23+00', 'CACE');
INSERT INTO public.entite (id_entite, nom, sigle, id_hierarchisation, id_entite_parent, localisation, responsable_nom, actif, id_user, dh_creation, id_nature) VALUES ('CACE ASSIKASSO', 'Centre d''Action Communautaire pour l''Enfance de Assikasso', 'CACE', 'CACE', 'DR INDENIE-DJUABLIN', 'ASSIKASSO', NULL, true, '1', '2026-10-11 22:30:51.23+00', 'CACE');
INSERT INTO public.entite (id_entite, nom, sigle, id_hierarchisation, id_entite_parent, localisation, responsable_nom, actif, id_user, dh_creation, id_nature) VALUES ('CACE TANGUELAN', 'Centre d''Action Communautaire pour l''Enfance de Tanguelan', 'CACE', 'CACE', 'DR INDENIE-DJUABLIN', 'TANGUELAN', NULL, true, '1', '2026-10-11 22:30:51.23+00', 'CACE');
INSERT INTO public.entite (id_entite, nom, sigle, id_hierarchisation, id_entite_parent, localisation, responsable_nom, actif, id_user, dh_creation, id_nature) VALUES ('ORPHELINAT MAMIE-THERESE', 'Orphelinat Mamie-Thérèse', 'ORPHELINAT', 'ORPHELINAT', 'DR INDENIE-DJUABLIN', 'ABENGOUROU', NULL, true, '1', '2026-10-11 22:30:51.23+00', 'ORPHELINAT');
INSERT INTO public.entite (id_entite, nom, sigle, id_hierarchisation, id_entite_parent, localisation, responsable_nom, actif, id_user, dh_creation, id_nature) VALUES ('CACE MADINANI', 'Centre d''Action Communautaire pour l''Enfance de Madinani', 'CACE', 'CACE', 'DR KABADOUGOU', 'MADINANI', NULL, true, '1', '2026-10-11 22:30:51.23+00', 'CACE');
INSERT INTO public.entite (id_entite, nom, sigle, id_hierarchisation, id_entite_parent, localisation, responsable_nom, actif, id_user, dh_creation, id_nature) VALUES ('CACE ODIENNE', 'Centre d''Action Communautaire pour l''Enfance d''Odienne', 'CACE', 'CACE', 'DR KABADOUGOU', 'ODIENNE', NULL, true, '1', '2026-10-11 22:30:51.23+00', 'CACE');
INSERT INTO public.entite (id_entite, nom, sigle, id_hierarchisation, id_entite_parent, localisation, responsable_nom, actif, id_user, dh_creation, id_nature) VALUES ('CACE TIEME', 'Centre d''Action Communautaire pour l''Enfance de Tieme', 'CACE', 'CACE', 'DR KABADOUGOU', 'TIEME', NULL, true, '1', '2026-10-11 22:30:51.23+00', 'CACE');
INSERT INTO public.entite (id_entite, nom, sigle, id_hierarchisation, id_entite_parent, localisation, responsable_nom, actif, id_user, dh_creation, id_nature) VALUES ('CS BONDOUKOU', 'Centre Social de Bondoukou', 'CS', 'CS', 'DR GONTOUGO', 'BONDOUKOU', NULL, true, '1', '2026-10-11 22:30:51.23+00', 'CS');
INSERT INTO public.entite (id_entite, nom, sigle, id_hierarchisation, id_entite_parent, localisation, responsable_nom, actif, id_user, dh_creation, id_nature) VALUES ('CPPE BONDOUKOU', 'Centre de Protection de la Petite Enfance de Bondoukou', 'CPPE', 'CPPE', 'DR GONTOUGO', 'BONDOUKOU', NULL, true, '1', '2026-10-11 22:30:51.23+00', 'CPPE');
INSERT INTO public.entite (id_entite, nom, sigle, id_hierarchisation, id_entite_parent, localisation, responsable_nom, actif, id_user, dh_creation, id_nature) VALUES ('CACE LAOUDI-BA', 'Centre d''Action Communautaire pour l''Enfance de Laoudi-Ba', 'CACE', 'CACE', 'DR GONTOUGO', 'LAOUDI-BA', NULL, true, '1', '2026-10-11 22:30:51.23+00', 'CACE');
INSERT INTO public.entite (id_entite, nom, sigle, id_hierarchisation, id_entite_parent, localisation, responsable_nom, actif, id_user, dh_creation, id_nature) VALUES ('CACE YEREKAYE', 'Centre d''Action Communautaire pour l''Enfance de Yerekaye', 'CACE', 'CACE', 'DR GONTOUGO', 'YEREKAYE', NULL, true, '1', '2026-10-11 22:30:51.23+00', 'CACE');
INSERT INTO public.entite (id_entite, nom, sigle, id_hierarchisation, id_entite_parent, localisation, responsable_nom, actif, id_user, dh_creation, id_nature) VALUES ('CACE SAPLI-SEPINGO', 'Centre d''Action Communautaire pour l''Enfance de Sapli-Sepingo', 'CACE', 'CACE', 'DR GONTOUGO', 'SAPLI-SEPINGO', NULL, true, '1', '2026-10-11 22:30:51.23+00', 'CACE');
INSERT INTO public.entite (id_entite, nom, sigle, id_hierarchisation, id_entite_parent, localisation, responsable_nom, actif, id_user, dh_creation, id_nature) VALUES ('CACE PINDA BOROKO', 'Centre d''Action Communautaire pour l''Enfance de Pinda Boroko', 'CACE', 'CACE', 'DR GONTOUGO', 'PINDA BOROKO', NULL, true, '1', '2026-10-11 22:30:51.23+00', 'CACE');
INSERT INTO public.entite (id_entite, nom, sigle, id_hierarchisation, id_entite_parent, localisation, responsable_nom, actif, id_user, dh_creation, id_nature) VALUES ('CES TIEDIO', 'Centre d''Éducation Spécialisée Tiedio', 'CES', 'CES', 'DR GONTOUGO', 'TIEDIO', NULL, true, '1', '2026-10-11 22:30:51.23+00', 'CES');
INSERT INTO public.entite (id_entite, nom, sigle, id_hierarchisation, id_entite_parent, localisation, responsable_nom, actif, id_user, dh_creation, id_nature) VALUES ('CACE FISSA', 'Centre d''Action Communautaire pour l''Enfance de Fissa', 'CACE', 'CACE', 'DR GONTOUGO', 'FISSA', NULL, true, '1', '2026-10-11 22:30:51.23+00', 'CACE');
INSERT INTO public.entite (id_entite, nom, sigle, id_hierarchisation, id_entite_parent, localisation, responsable_nom, actif, id_user, dh_creation, id_nature) VALUES ('CPPE AMANVI', 'Centre de Protection de la Petite Enfance de Amanvi', 'CPPE', 'CPPE', 'DR GONTOUGO', 'AMANVI', NULL, true, '1', '2026-10-11 22:30:51.23+00', 'CPPE');
INSERT INTO public.entite (id_entite, nom, sigle, id_hierarchisation, id_entite_parent, localisation, responsable_nom, actif, id_user, dh_creation, id_nature) VALUES ('CPPE N''DAKRO', 'Centre de Protection de la Petite Enfance de n''Dakro', 'CPPE', 'CPPE', 'DR GONTOUGO', 'N''DAKRO', NULL, true, '1', '2026-10-11 22:30:51.23+00', 'CPPE');
INSERT INTO public.entite (id_entite, nom, sigle, id_hierarchisation, id_entite_parent, localisation, responsable_nom, actif, id_user, dh_creation, id_nature) VALUES ('CACE YAOKRO', 'Centre d''Action Communautaire pour l''Enfance de Yaokro', 'CACE', 'CACE', 'DR GONTOUGO', 'YAOKRO', NULL, true, '1', '2026-10-11 22:30:51.23+00', 'CACE');
INSERT INTO public.entite (id_entite, nom, sigle, id_hierarchisation, id_entite_parent, localisation, responsable_nom, actif, id_user, dh_creation, id_nature) VALUES ('CACE KOKOMIAN', 'Centre d''Action Communautaire pour l''Enfance de Kokomian', 'CACE', 'CACE', 'DR GONTOUGO', 'KOKOMIAN', NULL, true, '1', '2026-10-11 22:30:51.23+00', 'CACE');
INSERT INTO public.entite (id_entite, nom, sigle, id_hierarchisation, id_entite_parent, localisation, responsable_nom, actif, id_user, dh_creation, id_nature) VALUES ('CACE ARROSSUA', 'Centre d''Action Communautaire pour l''Enfance de Arrossua', 'CACE', 'CACE', 'DR GONTOUGO', 'ARROSSUA', NULL, true, '1', '2026-10-11 22:30:51.23+00', 'CACE');
INSERT INTO public.entite (id_entite, nom, sigle, id_hierarchisation, id_entite_parent, localisation, responsable_nom, actif, id_user, dh_creation, id_nature) VALUES ('CACE AHUITIESSO', 'Centre d''Action Communautaire pour l''Enfance de Ahuitiesso', 'CACE', 'CACE', 'DR GONTOUGO', 'AHUITIESSO', NULL, true, '1', '2026-10-11 22:30:51.23+00', 'CACE');
INSERT INTO public.entite (id_entite, nom, sigle, id_hierarchisation, id_entite_parent, localisation, responsable_nom, actif, id_user, dh_creation, id_nature) VALUES ('CACE PRITI 1', 'Centre d''Action Communautaire pour l''Enfance de Priti 1', 'CACE', 'CACE', 'DR GONTOUGO', 'PRITI 1', NULL, true, '1', '2026-10-11 22:30:51.23+00', 'CACE');
INSERT INTO public.entite (id_entite, nom, sigle, id_hierarchisation, id_entite_parent, localisation, responsable_nom, actif, id_user, dh_creation, id_nature) VALUES ('CS BONIERE', 'Centre Social de Boniere', 'CS', 'CS', 'DR HAMBOL', 'BONIEREDOUGOU', NULL, true, '1', '2026-10-11 22:30:51.23+00', 'CS');
INSERT INTO public.entite (id_entite, nom, sigle, id_hierarchisation, id_entite_parent, localisation, responsable_nom, actif, id_user, dh_creation, id_nature) VALUES ('CS DABAKALA', 'Centre Social de Dabakala', 'CS', 'CS', 'DR HAMBOL', 'DABAKALA', NULL, true, '1', '2026-10-11 22:30:51.23+00', 'CS');
INSERT INTO public.entite (id_entite, nom, sigle, id_hierarchisation, id_entite_parent, localisation, responsable_nom, actif, id_user, dh_creation, id_nature) VALUES ('CPPE FOUMBOLO', 'Centre de Protection de la Petite Enfance de Foumbolo', 'CPPE', 'CPPE', 'DR HAMBOL', 'FOUMBOLO', NULL, true, '1', '2026-10-11 22:30:51.23+00', 'CPPE');
INSERT INTO public.entite (id_entite, nom, sigle, id_hierarchisation, id_entite_parent, localisation, responsable_nom, actif, id_user, dh_creation, id_nature) VALUES ('CPPE DABAKALA', 'Centre de Protection de la Petite Enfance de Dabakala', 'CPPE', 'CPPE', 'DR HAMBOL', 'DABAKALA', NULL, true, '1', '2026-10-11 22:30:51.23+00', 'CPPE');
INSERT INTO public.entite (id_entite, nom, sigle, id_hierarchisation, id_entite_parent, localisation, responsable_nom, actif, id_user, dh_creation, id_nature) VALUES ('CPPE CENTRE D''EVEIL ADJA MAM', 'Centre d''Eveil Adja Mam', 'CPPE', 'CPPE', 'DR HAMBOL', 'TAFIRE', NULL, true, '1', '2026-10-11 22:30:51.23+00', 'CPPE');
INSERT INTO public.entite (id_entite, nom, sigle, id_hierarchisation, id_entite_parent, localisation, responsable_nom, actif, id_user, dh_creation, id_nature) VALUES ('CACE BOKALA', 'Centre d''Action Communautaire pour l''Enfance de Bokala', 'CACE', 'CACE', 'DR HAMBOL', 'BOKALA', NULL, true, '1', '2026-10-11 22:30:51.23+00', 'CACE');
INSERT INTO public.entite (id_entite, nom, sigle, id_hierarchisation, id_entite_parent, localisation, responsable_nom, actif, id_user, dh_creation, id_nature) VALUES ('CACE NIANGOUGBONO', 'Centre d''Action Communautaire pour l''Enfance de Niangougbono', 'CACE', 'CACE', 'DR HAMBOL', 'NIANGOUROUGBONON', NULL, true, '1', '2026-10-11 22:30:51.23+00', 'CACE');
INSERT INTO public.entite (id_entite, nom, sigle, id_hierarchisation, id_entite_parent, localisation, responsable_nom, actif, id_user, dh_creation, id_nature) VALUES ('CPPE BONIEREDOUGOU', 'Centre de Protection de la Petite Enfance de Bonieredougou', 'CPPE', 'CPPE', 'DR HAMBOL', 'BONIEREDOUGOU', NULL, true, '1', '2026-10-11 22:30:51.23+00', 'CPPE');
INSERT INTO public.entite (id_entite, nom, sigle, id_hierarchisation, id_entite_parent, localisation, responsable_nom, actif, id_user, dh_creation, id_nature) VALUES ('CACE ADAHOU', 'Centre d''Action Communautaire pour l''Enfance d''Adahou', 'CACE', 'CACE', 'DR AGNEBY-TIASSA', 'ADAHOU VILLAGE', NULL, true, '1', '2026-10-11 22:30:51.23+00', 'CACE');
INSERT INTO public.entite (id_entite, nom, sigle, id_hierarchisation, id_entite_parent, localisation, responsable_nom, actif, id_user, dh_creation, id_nature) VALUES ('CACE ATTOBROU', 'Centre d''Action Communautaire pour l''Enfance d''Attobrou', 'CACE', 'CACE', 'DR AGNEBY-TIASSA', 'ATTOBROU', NULL, true, '1', '2026-10-11 22:30:51.23+00', 'CACE');
INSERT INTO public.entite (id_entite, nom, sigle, id_hierarchisation, id_entite_parent, localisation, responsable_nom, actif, id_user, dh_creation, id_nature) VALUES ('CRECHE GARDERIE ABOUDE', 'Crèche /Garderie d''Aboude', 'CRECHE  GARDERIE', 'CRECHE  GARDERIE', 'DR AGNEBY-TIASSA', 'ABOUDE KOUASSIKRO', NULL, true, '1', '2026-10-11 22:30:51.23+00', 'CRECHE  GARDERIE');
INSERT INTO public.entite (id_entite, nom, sigle, id_hierarchisation, id_entite_parent, localisation, responsable_nom, actif, id_user, dh_creation, id_nature) VALUES ('CACE ELEVI', 'Centre d''Action Communautaire pour l''Enfance d''Elevi', 'CACE', 'CACE', 'DR AGNEBY-TIASSA', 'ELEVI', NULL, true, '1', '2026-10-11 22:30:51.23+00', 'CACE');
INSERT INTO public.entite (id_entite, nom, sigle, id_hierarchisation, id_entite_parent, localisation, responsable_nom, actif, id_user, dh_creation, id_nature) VALUES ('CACE ODOGUIE', 'Centre d''Action Communautaire pour l''Enfance de Odoguie', 'CACE', 'CACE', 'DR AGNEBY-TIASSA', 'ODOGUIE', NULL, true, '1', '2026-10-11 22:30:51.23+00', 'CACE');
INSERT INTO public.entite (id_entite, nom, sigle, id_hierarchisation, id_entite_parent, localisation, responsable_nom, actif, id_user, dh_creation, id_nature) VALUES ('CPPE AZAGUIE GARE', 'Centre de Protection de la Petite Enfance d''Azaguie Gare', 'CPPE', 'CPPE', 'DR AGNEBY-TIASSA', 'AZAGUIE', NULL, true, '1', '2026-10-11 22:30:51.23+00', 'CPPE');
INSERT INTO public.entite (id_entite, nom, sigle, id_hierarchisation, id_entite_parent, localisation, responsable_nom, actif, id_user, dh_creation, id_nature) VALUES ('CACE AZAGUIE MAKOUGUIE', 'Centre d''Action Communautaire pour l''Enfance de Azaguie Makouguie', 'CACE', 'CACE', 'DR AGNEBY-TIASSA', 'AZAGUIE MAKOUGUIE', NULL, true, '1', '2026-10-11 22:30:51.23+00', 'CACE');
INSERT INTO public.entite (id_entite, nom, sigle, id_hierarchisation, id_entite_parent, localisation, responsable_nom, actif, id_user, dh_creation, id_nature) VALUES ('CPPE N''ZIANOUAN', 'Centre de Protection de la Petite Enfance de n''Zianouan', 'CPPE', 'CPPE', 'DR AGNEBY-TIASSA', 'N''ZIANOUAN', NULL, true, '1', '2026-10-11 22:30:51.23+00', 'CPPE');
INSERT INTO public.entite (id_entite, nom, sigle, id_hierarchisation, id_entite_parent, localisation, responsable_nom, actif, id_user, dh_creation, id_nature) VALUES ('CACE ETICOON', 'Centre d''Action Communautaire pour l''Enfance d''Eticoon', 'CACE', 'CACE', 'DR AGNEBY-TIASSA', 'ETICOON', NULL, true, '1', '2026-10-11 22:30:51.23+00', 'CACE');
INSERT INTO public.entite (id_entite, nom, sigle, id_hierarchisation, id_entite_parent, localisation, responsable_nom, actif, id_user, dh_creation, id_nature) VALUES ('CACE DIBYKRO', 'Centre d''Action Communautaire pour l''Enfance de Dibykro', 'CACE', 'CACE', 'DR AGNEBY-TIASSA', 'DIBYKRO', NULL, true, '1', '2026-10-11 22:30:51.23+00', 'CACE');
INSERT INTO public.entite (id_entite, nom, sigle, id_hierarchisation, id_entite_parent, localisation, responsable_nom, actif, id_user, dh_creation, id_nature) VALUES ('CACE TOLAKRO', 'Centre d''Action Communautaire pour l''Enfance de Tolakro', 'CACE', 'CACE', 'DR AGNEBY-TIASSA', 'TOLLAKRO', NULL, true, '1', '2026-10-11 22:30:51.23+00', 'CACE');
INSERT INTO public.entite (id_entite, nom, sigle, id_hierarchisation, id_entite_parent, localisation, responsable_nom, actif, id_user, dh_creation, id_nature) VALUES ('CPPE ISSIA', 'Centre de Protection de la Petite Enfance d''Issia', 'CPPE', 'CPPE', 'DR HAUT SASSANDRA', 'ISSIA', NULL, true, '1', '2026-10-11 22:30:51.23+00', 'CPPE');
INSERT INTO public.entite (id_entite, nom, sigle, id_hierarchisation, id_entite_parent, localisation, responsable_nom, actif, id_user, dh_creation, id_nature) VALUES ('CS ZOUKOUGBEU', 'Centre Social de Zoukougbeu', 'CS', 'CS', 'DR HAUT SASSANDRA', 'ZOUKOUGBEU', NULL, true, '1', '2026-10-11 22:30:51.23+00', 'CS');
INSERT INTO public.entite (id_entite, nom, sigle, id_hierarchisation, id_entite_parent, localisation, responsable_nom, actif, id_user, dh_creation, id_nature) VALUES ('CPPE ZOUKOUGBEU', 'Centre de Protection de la Petite Enfance Zoukougbeu', 'CPPE', 'CPPE', 'DR HAUT SASSANDRA', 'ZOUKOUGBEU', NULL, true, '1', '2026-10-11 22:30:51.23+00', 'CPPE');
INSERT INTO public.entite (id_entite, nom, sigle, id_hierarchisation, id_entite_parent, localisation, responsable_nom, actif, id_user, dh_creation, id_nature) VALUES ('CS VAVOUA', 'Centre Social de Vavoua', 'CS', 'CS', 'DR HAUT SASSANDRA', 'VAVOUA', NULL, true, '1', '2026-10-11 22:30:51.23+00', 'CS');
INSERT INTO public.entite (id_entite, nom, sigle, id_hierarchisation, id_entite_parent, localisation, responsable_nom, actif, id_user, dh_creation, id_nature) VALUES ('CPPE QUARTIER BAOULE', 'Centre de Protection de la Petite Enfance de Quartier Baoule', 'CPPE', 'CPPE', 'DR HAUT SASSANDRA', 'DALOA', NULL, true, '1', '2026-10-11 22:30:51.23+00', 'CPPE');
INSERT INTO public.entite (id_entite, nom, sigle, id_hierarchisation, id_entite_parent, localisation, responsable_nom, actif, id_user, dh_creation, id_nature) VALUES ('CPPE TAZIBOUO', 'Centre de Protection de la Petite Enfance de Tazibouo', 'CPPE', 'CPPE', 'DR HAUT SASSANDRA', 'DALOA', NULL, true, '1', '2026-10-11 22:30:51.23+00', 'CPPE');
INSERT INTO public.entite (id_entite, nom, sigle, id_hierarchisation, id_entite_parent, localisation, responsable_nom, actif, id_user, dh_creation, id_nature) VALUES ('CACE GBOGUHÉ', 'Centre d''Action Communautaire pour l''Enfance de Gboguhé', 'CACE', 'CACE', 'DR HAUT SASSANDRA', 'DALOA', NULL, true, '1', '2026-10-11 22:30:51.23+00', 'CACE');
INSERT INTO public.entite (id_entite, nom, sigle, id_hierarchisation, id_entite_parent, localisation, responsable_nom, actif, id_user, dh_creation, id_nature) VALUES ('CACE ZALIHOUAN (DALOA)', 'Centre d''Action Communautaire pour l''Enfance de Zalihouan (Daloa)', 'CACE', 'CACE', 'DR HAUT SASSANDRA', 'DALOA', NULL, true, '1', '2026-10-11 22:30:51.23+00', 'CACE');
INSERT INTO public.entite (id_entite, nom, sigle, id_hierarchisation, id_entite_parent, localisation, responsable_nom, actif, id_user, dh_creation, id_nature) VALUES ('CACE MOLONOU', 'Centre d''Action Communautaire pour l''Enfance de Molonou', 'CACE', 'CACE', 'DR HAUT SASSANDRA', 'ISSIA', NULL, true, '1', '2026-10-11 22:30:51.23+00', 'CACE');
INSERT INTO public.entite (id_entite, nom, sigle, id_hierarchisation, id_entite_parent, localisation, responsable_nom, actif, id_user, dh_creation, id_nature) VALUES ('CACE GRÉGBEU (ZOUKOUGBEU)', 'Centre d''Action Communautaire pour l''Enfance de Grégbeu (Zoukougbeu)', 'CACE', 'CACE', 'DR HAUT SASSANDRA', 'ZOUKOUGBEU', NULL, true, '1', '2026-10-11 22:30:51.23+00', 'CACE');
INSERT INTO public.entite (id_entite, nom, sigle, id_hierarchisation, id_entite_parent, localisation, responsable_nom, actif, id_user, dh_creation, id_nature) VALUES ('CACE DRISSAKRO (ZOUKOUGBEU)', 'Centre d''Action Communautaire pour l''Enfance de Drissakro (Zoukougbeu)', 'CACE', 'CACE', 'DR HAUT SASSANDRA', 'ZOUKOUGBEU', NULL, true, '1', '2026-10-11 22:30:51.23+00', 'CACE');
INSERT INTO public.entite (id_entite, nom, sigle, id_hierarchisation, id_entite_parent, localisation, responsable_nom, actif, id_user, dh_creation, id_nature) VALUES ('CACE BANDIAHI', 'Centre d''Action Communautaire pour l''Enfance de Bandiahi', 'CACE', 'CACE', 'DR HAUT SASSANDRA', 'VAVOUA', NULL, true, '1', '2026-10-11 22:30:51.23+00', 'CACE');
INSERT INTO public.entite (id_entite, nom, sigle, id_hierarchisation, id_entite_parent, localisation, responsable_nom, actif, id_user, dh_creation, id_nature) VALUES ('CACE MIMIA (ISSIA)', 'Centre d''Action Communautaire pour l''Enfance de Mimia (Issia)', 'CACE', 'CACE', 'DR HAUT SASSANDRA', 'ZOUKOUGBEU', NULL, true, '1', '2026-10-11 22:30:51.23+00', 'CACE');
INSERT INTO public.entite (id_entite, nom, sigle, id_hierarchisation, id_entite_parent, localisation, responsable_nom, actif, id_user, dh_creation, id_nature) VALUES ('CACE CPC CARREFOUR', 'Centre d''Action Communautaire pour l''Enfance de Cpc Carrefour', 'CACE', 'CACE', 'DR HAUT SASSANDRA', 'ZOUKOUGBEU', NULL, true, '1', '2026-10-11 22:30:51.23+00', 'CACE');
INSERT INTO public.entite (id_entite, nom, sigle, id_hierarchisation, id_entite_parent, localisation, responsable_nom, actif, id_user, dh_creation, id_nature) VALUES ('CACE ZITTA', 'Centre d''Action Communautaire pour l''Enfance de Zitta', 'CACE', 'CACE', 'DR HAUT SASSANDRA', 'ZOUKOUGBEU', NULL, true, '1', '2026-10-11 22:30:51.23+00', 'CACE');
INSERT INTO public.entite (id_entite, nom, sigle, id_hierarchisation, id_entite_parent, localisation, responsable_nom, actif, id_user, dh_creation, id_nature) VALUES ('CACE ABIE', 'Centre d''Action Communautaire pour l''Enfance d''Abie', 'CACE', 'CACE', 'DR ME', 'ABIE', NULL, true, '1', '2026-10-11 22:30:51.23+00', 'CACE');
INSERT INTO public.entite (id_entite, nom, sigle, id_hierarchisation, id_entite_parent, localisation, responsable_nom, actif, id_user, dh_creation, id_nature) VALUES ('CACE AHOUABO', 'Centre d''Action Communautaire pour l''Enfance d''Ahouabo', 'CACE', 'CACE', 'DR ME', 'AHOUABO', NULL, true, '1', '2026-10-11 22:30:51.23+00', 'CACE');
INSERT INTO public.entite (id_entite, nom, sigle, id_hierarchisation, id_entite_parent, localisation, responsable_nom, actif, id_user, dh_creation, id_nature) VALUES ('CACE ANNEPE', 'Centre d''Action Communautaire pour l''Enfance d''Annepe', 'CACE', 'CACE', 'DR ME', 'ANNEPE', NULL, true, '1', '2026-10-11 22:30:51.23+00', 'CACE');
INSERT INTO public.entite (id_entite, nom, sigle, id_hierarchisation, id_entite_parent, localisation, responsable_nom, actif, id_user, dh_creation, id_nature) VALUES ('CPPE ADZOPE', 'Centre de Protection de la Petite Enfance d''Adzope', 'CPPE', 'CPPE', 'DR ME', 'COMMUNE D''ADZOPE', NULL, true, '1', '2026-10-11 22:30:51.23+00', 'CPPE');
INSERT INTO public.entite (id_entite, nom, sigle, id_hierarchisation, id_entite_parent, localisation, responsable_nom, actif, id_user, dh_creation, id_nature) VALUES ('CPPE 2 D''ADZOPE', 'Centre de Protection de la Petite Enfance 2 d''Adzope', 'CPPE', 'CPPE', 'DR ME', 'COMMUNE D''ADZOPE', NULL, true, '1', '2026-10-11 22:30:51.23+00', 'CPPE');
INSERT INTO public.entite (id_entite, nom, sigle, id_hierarchisation, id_entite_parent, localisation, responsable_nom, actif, id_user, dh_creation, id_nature) VALUES ('CPPE ANANGUIE', 'Centre de Protection de la Petite Enfance d''Ananguie', 'CPPE', 'CPPE', 'DR ME', 'ANANGUIE', NULL, true, '1', '2026-10-11 22:30:51.23+00', 'CPPE');
INSERT INTO public.entite (id_entite, nom, sigle, id_hierarchisation, id_entite_parent, localisation, responsable_nom, actif, id_user, dh_creation, id_nature) VALUES ('CS ADZOPE', 'Centre Social d''Adzopé', 'CS', 'CS', 'DR ME', 'COMMUNE D''ADZOPE', NULL, true, '1', '2026-10-11 22:30:51.23+00', 'CS');
INSERT INTO public.entite (id_entite, nom, sigle, id_hierarchisation, id_entite_parent, localisation, responsable_nom, actif, id_user, dh_creation, id_nature) VALUES ('CS AKOUPÉ', 'Centre Social d''Akoupé', 'CS', 'CS', 'DR ME', 'COMMUNE D''AKOUPE', NULL, true, '1', '2026-10-11 22:30:51.23+00', 'CS');
INSERT INTO public.entite (id_entite, nom, sigle, id_hierarchisation, id_entite_parent, localisation, responsable_nom, actif, id_user, dh_creation, id_nature) VALUES ('CACE AHEOUA', 'Centre d''Action Communautaire pour l''Enfance d''Aheoua', 'CACE', 'CACE', 'DR ME', 'AHEOUA', NULL, true, '1', '2026-10-11 22:30:51.23+00', 'CACE');
INSERT INTO public.entite (id_entite, nom, sigle, id_hierarchisation, id_entite_parent, localisation, responsable_nom, actif, id_user, dh_creation, id_nature) VALUES ('CACE ASSIKOUN', 'Centre d''Action Communautaire pour l''Enfance d''Assikoun', 'CACE', 'CACE', 'DR ME', 'ASSIKOUN', NULL, true, '1', '2026-10-11 22:30:51.23+00', 'CACE');
INSERT INTO public.entite (id_entite, nom, sigle, id_hierarchisation, id_entite_parent, localisation, responsable_nom, actif, id_user, dh_creation, id_nature) VALUES ('CS ALEPE', 'Centre Social d''Alepe', 'CS', 'CS', 'DR ME', 'COMMUNE D''ALEPE', NULL, true, '1', '2026-10-11 22:30:51.23+00', 'CS');
INSERT INTO public.entite (id_entite, nom, sigle, id_hierarchisation, id_entite_parent, localisation, responsable_nom, actif, id_user, dh_creation, id_nature) VALUES ('CPPE ALEPE', 'Centre de Protection de la Petite Enfance d''Alepe', 'CPPE', 'CPPE', 'DR ME', 'COMMUNE ALEPE', NULL, true, '1', '2026-10-11 22:30:51.23+00', 'CPPE');
INSERT INTO public.entite (id_entite, nom, sigle, id_hierarchisation, id_entite_parent, localisation, responsable_nom, actif, id_user, dh_creation, id_nature) VALUES ('CPPE MEMNI', 'Centre de Protection de la Petite Enfance de Memni', 'CPPE', 'CPPE', 'DR ME', 'MEMNI', NULL, true, '1', '2026-10-11 22:30:51.23+00', 'CPPE');
INSERT INTO public.entite (id_entite, nom, sigle, id_hierarchisation, id_entite_parent, localisation, responsable_nom, actif, id_user, dh_creation, id_nature) VALUES ('INTERNAT OGHLWAPO', 'Internat Garçon d''Oghlwapo', 'INTERNAT', 'INTERNAT', 'DR ME', 'OGHLWAPO', NULL, true, '1', '2026-10-11 22:30:51.23+00', 'INTERNAT');
INSERT INTO public.entite (id_entite, nom, sigle, id_hierarchisation, id_entite_parent, localisation, responsable_nom, actif, id_user, dh_creation, id_nature) VALUES ('CSE YAKASSE-ATTOBROU', 'Complexe Socio-Éducatif de Yakasse-Attobrou', 'CSE', 'COMPLEXE_SOCIO_EDUCATIF', 'DR ME', 'COMMUNE YAKASSE -ATTOBROU', NULL, true, '1', '2026-10-11 22:30:51.23+00', 'CSE');
INSERT INTO public.entite (id_entite, nom, sigle, id_hierarchisation, id_entite_parent, localisation, responsable_nom, actif, id_user, dh_creation, id_nature) VALUES ('CS YAKASSE-ATTOBROU', 'Centre Social de Yakasse-Attobrou', 'CS', 'CS', 'DR ME', 'COMMUNE YAKASSE -ATTOBROU', NULL, true, '1', '2026-10-11 22:30:51.23+00', 'CS');
INSERT INTO public.entite (id_entite, nom, sigle, id_hierarchisation, id_entite_parent, localisation, responsable_nom, actif, id_user, dh_creation, id_nature) VALUES ('CACE ASSIE-ORIE', 'Centre d''Action Communautaire pour l''Enfance d''Assie-Orie', 'CACE', 'CACE', 'DR ME', 'ASSIE-ORIE', NULL, true, '1', '2026-10-11 22:30:51.23+00', 'CACE');
INSERT INTO public.entite (id_entite, nom, sigle, id_hierarchisation, id_entite_parent, localisation, responsable_nom, actif, id_user, dh_creation, id_nature) VALUES ('CPPE YAKASSE-ATTOBROU', 'Centre de Protection de la Petite Enfance de Yakasse-Attobrou', 'CPPE', 'CPPE', 'DR ME', 'COMMUNE DE YAKASSE-ATTOBROU', NULL, true, '1', '2026-10-11 22:30:51.23+00', 'CPPE');
INSERT INTO public.entite (id_entite, nom, sigle, id_hierarchisation, id_entite_parent, localisation, responsable_nom, actif, id_user, dh_creation, id_nature) VALUES ('CACE EDIAKRO', 'Centre d''Action Communautaire pour l''Enfance d''Ediakro', 'CACE', 'CACE', 'DR N’ZI', 'ABIGUI', NULL, true, '1', '2026-10-11 22:30:51.23+00', 'CACE');
INSERT INTO public.entite (id_entite, nom, sigle, id_hierarchisation, id_entite_parent, localisation, responsable_nom, actif, id_user, dh_creation, id_nature) VALUES ('CPPE SEGUELA', 'Centre de Protection de la Petite Enfance de Seguela', 'CPPE', 'CPPE', 'DR WORODOUGOU', 'SEGUELA', NULL, true, '1', '2026-10-11 22:30:51.23+00', 'CPPE');
INSERT INTO public.entite (id_entite, nom, sigle, id_hierarchisation, id_entite_parent, localisation, responsable_nom, actif, id_user, dh_creation, id_nature) VALUES ('CPPE SAGOURA-DOUGOULA', 'Centre de Protection de la Petite Enfance de Sagoura-Dougoula', 'CPPE', 'CPPE', 'DR WORODOUGOU', 'SAGOURA-DOUGOULA', NULL, true, '1', '2026-10-11 22:30:51.23+00', 'CPPE');
INSERT INTO public.entite (id_entite, nom, sigle, id_hierarchisation, id_entite_parent, localisation, responsable_nom, actif, id_user, dh_creation, id_nature) VALUES ('CPPE DUALLA', 'Centre de Protection de la Petite Enfance de Dualla', 'CPPE', 'CPPE', 'DR WORODOUGOU', 'DUALLA', NULL, true, '1', '2026-10-11 22:30:51.23+00', 'CPPE');
INSERT INTO public.entite (id_entite, nom, sigle, id_hierarchisation, id_entite_parent, localisation, responsable_nom, actif, id_user, dh_creation, id_nature) VALUES ('CPPE GBEMAZO', 'Centre de Protection de la Petite Enfance de Gbemazo', 'CPPE', 'CPPE', 'DR WORODOUGOU', 'GBEMAZO', NULL, true, '1', '2026-10-11 22:30:51.23+00', 'CPPE');
INSERT INTO public.entite (id_entite, nom, sigle, id_hierarchisation, id_entite_parent, localisation, responsable_nom, actif, id_user, dh_creation, id_nature) VALUES ('CPPE SOUBRE', 'Centre de Protection de la Petite Enfance de Soubre', 'CPPE', 'CPPE', 'DR NAWA', 'SOUBRE', NULL, true, '1', '2026-10-11 22:30:51.23+00', 'CPPE');
INSERT INTO public.entite (id_entite, nom, sigle, id_hierarchisation, id_entite_parent, localisation, responsable_nom, actif, id_user, dh_creation, id_nature) VALUES ('CPPE YACOLIDABOUO', 'Centre de Protection de la Petite Enfance de Yacolidabouo', 'CPPE', 'CPPE', 'DR NAWA', 'YACOLIDABOUO', NULL, true, '1', '2026-10-11 22:30:51.23+00', 'CPPE');
INSERT INTO public.entite (id_entite, nom, sigle, id_hierarchisation, id_entite_parent, localisation, responsable_nom, actif, id_user, dh_creation, id_nature) VALUES ('CSE SOUBRE', 'Complexe Socio-Éducatif de Soubre', 'CSE', 'COMPLEXE_SOCIO_EDUCATIF', 'DR NAWA', 'SOUBRE', NULL, true, '1', '2026-10-11 22:30:51.23+00', 'CSE');
INSERT INTO public.entite (id_entite, nom, sigle, id_hierarchisation, id_entite_parent, localisation, responsable_nom, actif, id_user, dh_creation, id_nature) VALUES ('CACE TAGBA', 'Centre d''Action Communautaire pour l''Enfance de Tagba', 'CACE', 'CACE', 'DR NAWA', 'TAGBA', NULL, true, '1', '2026-10-11 22:30:51.23+00', 'CACE');
INSERT INTO public.entite (id_entite, nom, sigle, id_hierarchisation, id_entite_parent, localisation, responsable_nom, actif, id_user, dh_creation, id_nature) VALUES ('CPPE MEAGUI', 'Centre de Protection de la Petite Enfance de Meagui', 'CPPE', 'CPPE', 'DR NAWA', 'MEAGUI', NULL, true, '1', '2026-10-11 22:30:51.23+00', 'CPPE');
INSERT INTO public.entite (id_entite, nom, sigle, id_hierarchisation, id_entite_parent, localisation, responsable_nom, actif, id_user, dh_creation, id_nature) VALUES ('CACE BALEYO', 'Centre d''Action Communautaire pour l''Enfance de Baleyo', 'CACE', 'CACE', 'DR NAWA', 'BALEYO', NULL, true, '1', '2026-10-11 22:30:51.23+00', 'CACE');
INSERT INTO public.entite (id_entite, nom, sigle, id_hierarchisation, id_entite_parent, localisation, responsable_nom, actif, id_user, dh_creation, id_nature) VALUES ('CACE ABODANKRO', 'Centre d''Action Communautaire pour l''Enfance d''Abodankro', 'CACE', 'CACE', 'DR NAWA', 'ABODANKRO', NULL, true, '1', '2026-10-11 22:30:51.23+00', 'CACE');
INSERT INTO public.entite (id_entite, nom, sigle, id_hierarchisation, id_entite_parent, localisation, responsable_nom, actif, id_user, dh_creation, id_nature) VALUES ('CACE N''DRIKRO', 'Centre d''Action Communautaire pour l''Enfance de n''Drikro', 'CACE', 'CACE', 'DR NAWA', 'N''DRIKRO', NULL, true, '1', '2026-10-11 22:30:51.23+00', 'CACE');
INSERT INTO public.entite (id_entite, nom, sigle, id_hierarchisation, id_entite_parent, localisation, responsable_nom, actif, id_user, dh_creation, id_nature) VALUES ('CACE GOUANA', 'Centre d''Action Communautaire pour l''Enfance de Gouana', 'CACE', 'CACE', 'DR BAFING', 'TOUBA', NULL, true, '1', '2026-10-11 22:30:51.23+00', 'CACE');
INSERT INTO public.entite (id_entite, nom, sigle, id_hierarchisation, id_entite_parent, localisation, responsable_nom, actif, id_user, dh_creation, id_nature) VALUES ('CPPE MOOSSOU', 'Centre de Protection de la Petite Enfance de Moossou', 'CPPE', 'CPPE', 'DR SUD-COMOE', 'MOOSSOU', NULL, true, '1', '2026-10-11 22:30:51.23+00', 'CPPE');
INSERT INTO public.entite (id_entite, nom, sigle, id_hierarchisation, id_entite_parent, localisation, responsable_nom, actif, id_user, dh_creation, id_nature) VALUES ('CACE MEDINA', 'Centre d''Action Communautaire pour l''Enfance de Medina', 'CACE', 'CACE', 'DR SUD-COMOE', 'MEDINA', NULL, true, '1', '2026-10-11 22:30:51.23+00', 'CACE');
INSERT INTO public.entite (id_entite, nom, sigle, id_hierarchisation, id_entite_parent, localisation, responsable_nom, actif, id_user, dh_creation, id_nature) VALUES ('CACE ASSE', 'Centre d''Action Communautaire pour l''Enfance d''Asse', 'CACE', 'CACE', 'DR SUD-COMOE', 'ASSE', NULL, true, '1', '2026-10-11 22:30:51.23+00', 'CACE');
INSERT INTO public.entite (id_entite, nom, sigle, id_hierarchisation, id_entite_parent, localisation, responsable_nom, actif, id_user, dh_creation, id_nature) VALUES ('CACE LARABIA', 'Centre d''Action Communautaire pour l''Enfance de Larabia', 'CACE', 'CACE', 'DR SUD-COMOE', 'LARABIA', NULL, true, '1', '2026-10-11 22:30:51.23+00', 'CACE');
INSERT INTO public.entite (id_entite, nom, sigle, id_hierarchisation, id_entite_parent, localisation, responsable_nom, actif, id_user, dh_creation, id_nature) VALUES ('CPPE ABIATY', 'Centre de Protection de la Petite Enfance de Abiaty', 'CPPE', 'CPPE', 'DR SUD-COMOE', 'ABIATY', NULL, true, '1', '2026-10-11 22:30:51.23+00', 'CPPE');
INSERT INTO public.entite (id_entite, nom, sigle, id_hierarchisation, id_entite_parent, localisation, responsable_nom, actif, id_user, dh_creation, id_nature) VALUES ('CPPE ABOISSO', 'Centre de Protection de la Petite Enfance d''Aboisso', 'CPPE', 'CPPE', 'DR SUD-COMOE', 'ABOISSO', NULL, true, '1', '2026-10-11 22:30:51.23+00', 'CPPE');
INSERT INTO public.entite (id_entite, nom, sigle, id_hierarchisation, id_entite_parent, localisation, responsable_nom, actif, id_user, dh_creation, id_nature) VALUES ('CPPE ADAOU', 'Centre de Protection de la Petite Enfance Adaou', 'CPPE', 'CPPE', 'DR SUD-COMOE', 'ADAOU', NULL, true, '1', '2026-10-11 22:30:51.23+00', 'CPPE');
INSERT INTO public.entite (id_entite, nom, sigle, id_hierarchisation, id_entite_parent, localisation, responsable_nom, actif, id_user, dh_creation, id_nature) VALUES ('CPPE TOUMANGUIE', 'Centre de Protection de la Petite Enfance de Toumanguie', 'CPPE', 'CPPE', 'DR SUD-COMOE', 'TOUMANGUIE', NULL, true, '1', '2026-10-11 22:30:51.23+00', 'CPPE');
INSERT INTO public.entite (id_entite, nom, sigle, id_hierarchisation, id_entite_parent, localisation, responsable_nom, actif, id_user, dh_creation, id_nature) VALUES ('CPPE ADJOUAN', 'Centre de Protection de la Petite Enfance d''Adjouan', 'CPPE', 'CPPE', 'DR SUD-COMOE', 'ADJOUAN', NULL, true, '1', '2026-10-11 22:30:51.23+00', 'CPPE');
INSERT INTO public.entite (id_entite, nom, sigle, id_hierarchisation, id_entite_parent, localisation, responsable_nom, actif, id_user, dh_creation, id_nature) VALUES ('CPPE AFFIENOU', 'Centre de Protection de la Petite Enfance d''Affienou', 'CPPE', 'CPPE', 'DR SUD-COMOE', 'AFFIENOU', NULL, true, '1', '2026-10-11 22:30:51.23+00', 'CPPE');
INSERT INTO public.entite (id_entite, nom, sigle, id_hierarchisation, id_entite_parent, localisation, responsable_nom, actif, id_user, dh_creation, id_nature) VALUES ('CPPE KOUAKRO', 'Centre de Protection de la Petite Enfance de Kouakro', 'CPPE', 'CPPE', 'DR SUD-COMOE', 'KOUAKRO', NULL, true, '1', '2026-10-11 22:30:51.23+00', 'CPPE');
INSERT INTO public.entite (id_entite, nom, sigle, id_hierarchisation, id_entite_parent, localisation, responsable_nom, actif, id_user, dh_creation, id_nature) VALUES ('CPPE TIAPOUM', 'Centre de Protection de la Petite Enfance de Tiapoum', 'CPPE', 'CPPE', 'DR SUD-COMOE', 'TIAPOUM', NULL, true, '1', '2026-10-11 22:30:51.23+00', 'CPPE');
INSERT INTO public.entite (id_entite, nom, sigle, id_hierarchisation, id_entite_parent, localisation, responsable_nom, actif, id_user, dh_creation, id_nature) VALUES ('CPPE N''GUIEME', 'Centre de Protection de la Petite Enfance de n''Guieme', 'CPPE', 'CPPE', 'DR SUD-COMOE', 'N''GUIEME', NULL, true, '1', '2026-10-11 22:30:51.23+00', 'CPPE');
INSERT INTO public.entite (id_entite, nom, sigle, id_hierarchisation, id_entite_parent, localisation, responsable_nom, actif, id_user, dh_creation, id_nature) VALUES ('CPPE EBOINDA', 'Centre de Protection de la Petite Enfance de Eboinda', 'CPPE', 'CPPE', 'DR SUD-COMOE', 'EBOINDA', NULL, true, '1', '2026-10-11 22:30:51.23+00', 'CPPE');
INSERT INTO public.entite (id_entite, nom, sigle, id_hierarchisation, id_entite_parent, localisation, responsable_nom, actif, id_user, dh_creation, id_nature) VALUES ('CACE TOUTOUMI 1', 'Centre d''Action Communautaire pour l''Enfance de Toutoumi 1', 'CACE', 'CACE', 'DR SUD-COMOE', 'TOUTOUMI 1', NULL, true, '1', '2026-10-11 22:30:51.23+00', 'CACE');
INSERT INTO public.entite (id_entite, nom, sigle, id_hierarchisation, id_entite_parent, localisation, responsable_nom, actif, id_user, dh_creation, id_nature) VALUES ('CACE N''ZOBENOU', 'Centre d''Action Communautaire pour l''Enfance de n''Zobenou', 'CACE', 'CACE', 'DR SUD-COMOE', 'N''ZOBENOU', NULL, true, '1', '2026-10-11 22:30:51.23+00', 'CACE');
INSERT INTO public.entite (id_entite, nom, sigle, id_hierarchisation, id_entite_parent, localisation, responsable_nom, actif, id_user, dh_creation, id_nature) VALUES ('CACE ASSUE 1', 'Centre d''Action Communautaire pour l''Enfance d''Assue 1', 'CACE', 'CACE', 'DR SUD-COMOE', 'ASSUE 1', NULL, true, '1', '2026-10-11 22:30:51.23+00', 'CACE');
INSERT INTO public.entite (id_entite, nom, sigle, id_hierarchisation, id_entite_parent, localisation, responsable_nom, actif, id_user, dh_creation, id_nature) VALUES ('CACE ASSUE 2', 'Centre d''Action Communautaire pour l''Enfance d''Assue 2', 'CACE', 'CACE', 'DR SUD-COMOE', 'ASSUE 2', NULL, true, '1', '2026-10-11 22:30:51.23+00', 'CACE');
INSERT INTO public.entite (id_entite, nom, sigle, id_hierarchisation, id_entite_parent, localisation, responsable_nom, actif, id_user, dh_creation, id_nature) VALUES ('CACE BODOUA', 'Centre d''Action Communautaire pour l''Enfance de Bodoua', 'CACE', 'CACE', 'DR SUD-COMOE', 'BODOUA', NULL, true, '1', '2026-10-11 22:30:51.23+00', 'CACE');
INSERT INTO public.entite (id_entite, nom, sigle, id_hierarchisation, id_entite_parent, localisation, responsable_nom, actif, id_user, dh_creation, id_nature) VALUES ('CACE EBOKO', 'Centre d''Action Communautaire pour l''Enfance d''Eboko', 'CACE', 'CACE', 'DR SUD-COMOE', 'EBOKO', NULL, true, '1', '2026-10-11 22:30:51.23+00', 'CACE');
INSERT INTO public.entite (id_entite, nom, sigle, id_hierarchisation, id_entite_parent, localisation, responsable_nom, actif, id_user, dh_creation, id_nature) VALUES ('CACE EHANIA V3-V7', 'Centre d''Action Communautaire pour l''Enfance D'' Ehania V3-V7', 'CACE', 'CACE', 'DR SUD-COMOE', 'EHANIA V3-V7', NULL, true, '1', '2026-10-11 22:30:51.23+00', 'CACE');
INSERT INTO public.entite (id_entite, nom, sigle, id_hierarchisation, id_entite_parent, localisation, responsable_nom, actif, id_user, dh_creation, id_nature) VALUES ('CACE ALLANGOUANOU', 'Centre d''Action Communautaire pour l''Enfance d''Allangouanou', 'CACE', 'CACE', 'DR SUD-COMOE', 'ALLANGOUANOU', NULL, true, '1', '2026-10-11 22:30:51.23+00', 'CACE');
INSERT INTO public.entite (id_entite, nom, sigle, id_hierarchisation, id_entite_parent, localisation, responsable_nom, actif, id_user, dh_creation, id_nature) VALUES ('CACE GAOUSSOUKRO', 'Centre d''Action Communautaire pour l''Enfance de Gaoussoukro', 'CACE', 'CACE', 'DR SUD-COMOE', 'GAOUSSOUKRO', NULL, true, '1', '2026-10-11 22:30:51.23+00', 'CACE');
INSERT INTO public.entite (id_entite, nom, sigle, id_hierarchisation, id_entite_parent, localisation, responsable_nom, actif, id_user, dh_creation, id_nature) VALUES ('CPPE EDJAMBO', 'Centre de Protection de la Petite Enfance de Edjambo', 'CPPE', 'CPPE', 'DR SUD-COMOE', 'EDJAMBO', NULL, true, '1', '2026-10-11 22:30:51.23+00', 'CPPE');
INSERT INTO public.entite (id_entite, nom, sigle, id_hierarchisation, id_entite_parent, localisation, responsable_nom, actif, id_user, dh_creation, id_nature) VALUES ('CPPE FRAMBO', 'Centre de Protection de la Petite Enfance de Frambo', 'CPPE', 'CPPE', 'DR SUD-COMOE', 'FRAMBO', NULL, true, '1', '2026-10-11 22:30:51.23+00', 'CPPE');
INSERT INTO public.entite (id_entite, nom, sigle, id_hierarchisation, id_entite_parent, localisation, responsable_nom, actif, id_user, dh_creation, id_nature) VALUES ('CPPE BILEOULEKRO', 'Centre de Protection de la Petite Enfance de Bileoulekro', 'CPPE', 'CPPE', 'DR SUD-COMOE', 'BILEOULEKRO', NULL, true, '1', '2026-10-11 22:30:51.23+00', 'CPPE');
INSERT INTO public.entite (id_entite, nom, sigle, id_hierarchisation, id_entite_parent, localisation, responsable_nom, actif, id_user, dh_creation, id_nature) VALUES ('CPPE KOTOAGNUAN', 'Centre de Protection de la Petite Enfance de Kotoagnuan', 'CPPE', 'CPPE', 'DR SUD-COMOE', 'KOTOAGNUAN', NULL, true, '1', '2026-10-11 22:30:51.23+00', 'CPPE');
INSERT INTO public.entite (id_entite, nom, sigle, id_hierarchisation, id_entite_parent, localisation, responsable_nom, actif, id_user, dh_creation, id_nature) VALUES ('CPPE SAYKRO', 'Centre de Protection de la Petite Enfance de Saykro', 'CPPE', 'CPPE', 'DR SUD-COMOE', 'SAYKRO', NULL, true, '1', '2026-10-11 22:30:51.23+00', 'CPPE');
INSERT INTO public.entite (id_entite, nom, sigle, id_hierarchisation, id_entite_parent, localisation, responsable_nom, actif, id_user, dh_creation, id_nature) VALUES ('CPPE NOE', 'Centre de Protection de la Petite Enfance de Noe', 'CPPE', 'CPPE', 'DR SUD-COMOE', 'NOE', NULL, true, '1', '2026-10-11 22:30:51.23+00', 'CPPE');
INSERT INTO public.entite (id_entite, nom, sigle, id_hierarchisation, id_entite_parent, localisation, responsable_nom, actif, id_user, dh_creation, id_nature) VALUES ('CSE DIOULABOUGOU', 'Complexe Socio-Éducatif de Dioulabougou', 'CSE', 'COMPLEXE_SOCIO_EDUCATIF', 'DR TONKPI', 'MAN', NULL, true, '1', '2026-10-11 22:30:51.23+00', 'CSE');
INSERT INTO public.entite (id_entite, nom, sigle, id_hierarchisation, id_entite_parent, localisation, responsable_nom, actif, id_user, dh_creation, id_nature) VALUES ('CACE BIN-HOUYE', 'Centre Action Communautaire pour l''Enfance de Bin-Houye', 'CACE', 'CACE', 'DR TONKPI', 'BIN-HOUYE', NULL, true, '1', '2026-10-11 22:30:51.23+00', 'CACE');
INSERT INTO public.entite (id_entite, nom, sigle, id_hierarchisation, id_entite_parent, localisation, responsable_nom, actif, id_user, dh_creation, id_nature) VALUES ('CACE SEUPLEU', 'Centre Action Communautaire pour l''Enfance de Seupleu', 'CACE', 'CACE', 'DR TONKPI', 'MAN', NULL, true, '1', '2026-10-11 22:30:51.23+00', 'CACE');
INSERT INTO public.entite (id_entite, nom, sigle, id_hierarchisation, id_entite_parent, localisation, responsable_nom, actif, id_user, dh_creation, id_nature) VALUES ('CSE MINIGNAN', 'Complexe Socio-Éducatif de Minignan', 'CSE', 'COMPLEXE_SOCIO_EDUCATIF', 'DR FOLON', 'MINIGNAN', NULL, true, '1', '2026-10-11 22:30:51.23+00', 'CSE');
INSERT INTO public.entite (id_entite, nom, sigle, id_hierarchisation, id_entite_parent, localisation, responsable_nom, actif, id_user, dh_creation, id_nature) VALUES ('CSE DAOUKRO', 'Complexe Socio-Éducatif de Daoukro', 'CSE', 'COMPLEXE_SOCIO_EDUCATIF', 'DR IFFOU', 'Daoukro', NULL, true, '1', '2026-10-11 22:30:51.23+00', 'CSE');
INSERT INTO public.entite (id_entite, nom, sigle, id_hierarchisation, id_entite_parent, localisation, responsable_nom, actif, id_user, dh_creation, id_nature) VALUES ('CACE BEDIE KOMENANKRO', 'Centre d''Action Communautaire pour l''Enfance de Bedie Komenankro', 'CACE', 'CACE', 'DR IFFOU', 'Bédié komenankro', NULL, true, '1', '2026-10-11 22:30:51.23+00', 'CACE');
INSERT INTO public.entite (id_entite, nom, sigle, id_hierarchisation, id_entite_parent, localisation, responsable_nom, actif, id_user, dh_creation, id_nature) VALUES ('CPPE OUELLE', 'Centre de Protection de la Petite Enfance de Ouelle', 'CPPE', 'CPPE', 'DR IFFOU', 'OUELLE', NULL, true, '1', '2026-10-11 22:30:51.23+00', 'CPPE');
INSERT INTO public.entite (id_entite, nom, sigle, id_hierarchisation, id_entite_parent, localisation, responsable_nom, actif, id_user, dh_creation, id_nature) VALUES ('CACE KOUMELEKRO', 'Centre d''Action Communautaire pour l''Enfance de Koumelekro', 'CACE', 'CACE', 'DR IFFOU', 'Koumelekro', NULL, true, '1', '2026-10-11 22:30:51.23+00', 'CACE');
INSERT INTO public.entite (id_entite, nom, sigle, id_hierarchisation, id_entite_parent, localisation, responsable_nom, actif, id_user, dh_creation, id_nature) VALUES ('CPPE ZANZANSSOU', 'Centre de Protection de la Petite Enfance de Zanzanssou', 'CPPE', 'CPPE', 'DR IFFOU', 'Zanzanssou', NULL, true, '1', '2026-10-11 22:30:51.23+00', 'CPPE');
INSERT INTO public.entite (id_entite, nom, sigle, id_hierarchisation, id_entite_parent, localisation, responsable_nom, actif, id_user, dh_creation, id_nature) VALUES ('CPPE PRIKRO', 'Centre de Protection de la Petite Enfance de Prikro', 'CPPE', 'CPPE', 'DR IFFOU', 'Prikro', NULL, true, '1', '2026-10-11 22:30:51.23+00', 'CPPE');
INSERT INTO public.entite (id_entite, nom, sigle, id_hierarchisation, id_entite_parent, localisation, responsable_nom, actif, id_user, dh_creation, id_nature) VALUES ('CPPE KOFFI AMONKRO', 'Centre de Protection de la Petite Enfance de Koffi Amonkro', 'CPPE', 'CPPE', 'DR IFFOU', 'koffi Amonkro', NULL, true, '1', '2026-10-11 22:30:51.23+00', 'CPPE');
INSERT INTO public.entite (id_entite, nom, sigle, id_hierarchisation, id_entite_parent, localisation, responsable_nom, actif, id_user, dh_creation, id_nature) VALUES ('CACE AGNI ASSIKASSO', 'Centre d''Action Communautaire pour l''Enfance d''Agni Assikasso', 'CACE', 'CACE', 'DR IFFOU', 'Agni Assikasso', NULL, true, '1', '2026-10-11 22:30:51.23+00', 'CACE');
INSERT INTO public.entite (id_entite, nom, sigle, id_hierarchisation, id_entite_parent, localisation, responsable_nom, actif, id_user, dh_creation, id_nature) VALUES ('CACE OUELLE KOUMANOUN', 'Centre d''Action Communautaire pour l''Enfance d''Ouelle Koumanoun', 'CACE', 'CACE', 'DR IFFOU', 'Ouelle Koumanoun', NULL, true, '1', '2026-10-11 22:30:51.23+00', 'CACE');
INSERT INTO public.entite (id_entite, nom, sigle, id_hierarchisation, id_entite_parent, localisation, responsable_nom, actif, id_user, dh_creation, id_nature) VALUES ('CACE N''GATTAKRO', 'Centre d''Action Communautaire pour l''Enfance de n''Gattakro', 'CACE', 'CACE', 'DR IFFOU', 'N''gattakro', NULL, true, '1', '2026-10-11 22:30:51.23+00', 'CACE');
INSERT INTO public.entite (id_entite, nom, sigle, id_hierarchisation, id_entite_parent, localisation, responsable_nom, actif, id_user, dh_creation, id_nature) VALUES ('CSE SASSANDRA', 'Complexe Socio-Éducatif de Sassandra', 'CSE', 'COMPLEXE_SOCIO_EDUCATIF', 'DR GBOKLE', 'SASSANDRA', NULL, true, '1', '2026-10-11 22:30:51.23+00', 'CSE');
INSERT INTO public.entite (id_entite, nom, sigle, id_hierarchisation, id_entite_parent, localisation, responsable_nom, actif, id_user, dh_creation, id_nature) VALUES ('CACE YAPOKOI', 'Centre d''Action Communautaire pour l''Enfance de Yapokoi', 'CACE', 'CACE', 'DR ABIDJAN', 'ADJAME', NULL, true, '1', '2026-10-11 22:30:51.23+00', 'CACE');
INSERT INTO public.entite (id_entite, nom, sigle, id_hierarchisation, id_entite_parent, localisation, responsable_nom, actif, id_user, dh_creation, id_nature) VALUES ('CSE ADJAME SANTE', 'Complexe Socio-Éducatif Adjame Sante', 'CSE', 'COMPLEXE_SOCIO_EDUCATIF', 'DR ABIDJAN', 'ADJAME', NULL, true, '1', '2026-10-11 22:30:51.23+00', 'CSE');
INSERT INTO public.entite (id_entite, nom, sigle, id_hierarchisation, id_entite_parent, localisation, responsable_nom, actif, id_user, dh_creation, id_nature) VALUES ('CRECHE / GARDERIE MTHB', 'Garderie Mthb', 'CRECHE  GARDERIE', 'CRECHE  GARDERIE', 'DR ABIDJAN', 'ADJAME', NULL, true, '1', '2026-10-11 22:30:51.23+00', 'CRECHE  GARDERIE');
INSERT INTO public.entite (id_entite, nom, sigle, id_hierarchisation, id_entite_parent, localisation, responsable_nom, actif, id_user, dh_creation, id_nature) VALUES ('CACE ADONKOI 1', 'Centre d''Action Communautaire pour l''Enfance d''Adonkoi 1', 'CACE', 'CACE', 'DR ABIDJAN', 'ANYAMA', NULL, true, '1', '2026-10-11 22:30:51.23+00', 'CACE');
INSERT INTO public.entite (id_entite, nom, sigle, id_hierarchisation, id_entite_parent, localisation, responsable_nom, actif, id_user, dh_creation, id_nature) VALUES ('CACE ALLOKOI', 'Centre d''Action Communautaire pour l''Enfance d''Allokoi', 'CACE', 'CACE', 'DR ABIDJAN', 'ANYAMA', NULL, true, '1', '2026-10-11 22:30:51.23+00', 'CACE');
INSERT INTO public.entite (id_entite, nom, sigle, id_hierarchisation, id_entite_parent, localisation, responsable_nom, actif, id_user, dh_creation, id_nature) VALUES ('CACE ATTECOUBE 3', 'Centre d''Action Communautaire pour l''Enfance d''Attecoube 3', 'CACE', 'CACE', 'DR ABIDJAN', 'ATTECOUBE', NULL, true, '1', '2026-10-11 22:30:51.23+00', 'CACE');
INSERT INTO public.entite (id_entite, nom, sigle, id_hierarchisation, id_entite_parent, localisation, responsable_nom, actif, id_user, dh_creation, id_nature) VALUES ('GARDERIE DEBARCADERE DE LOCODJRO', 'Garderie du Debarcadere de Locodjro', 'GARDERIE', 'GARDERIE', 'DR ABIDJAN', 'ATTECOUBE', NULL, true, '1', '2026-10-11 22:30:51.23+00', 'GARDERIE');
INSERT INTO public.entite (id_entite, nom, sigle, id_hierarchisation, id_entite_parent, localisation, responsable_nom, actif, id_user, dh_creation, id_nature) VALUES ('CACE CARRIERE', 'Centre d''Action Communautaire pour l''Enfance de Carriere', 'CACE', 'CACE', 'DR ABIDJAN', 'BINGERVILLE', NULL, true, '1', '2026-10-11 22:30:51.23+00', 'CACE');
INSERT INTO public.entite (id_entite, nom, sigle, id_hierarchisation, id_entite_parent, localisation, responsable_nom, actif, id_user, dh_creation, id_nature) VALUES ('CACE DJOROBITE 1', 'Centre d''Action Communautaire pour l''Enfance de Djorobite 1', 'CACE', 'CACE', 'DR ABIDJAN', 'COCODY', NULL, true, '1', '2026-10-11 22:30:51.23+00', 'CACE');
INSERT INTO public.entite (id_entite, nom, sigle, id_hierarchisation, id_entite_parent, localisation, responsable_nom, actif, id_user, dh_creation, id_nature) VALUES ('CACE MATHIAS BOTCHI DE KOFFAKO', 'Centre d''Action Communautaire pour l''Enfance de Mathias Botchi de Koffako', 'CACE', 'CACE', 'DR ABIDJAN', 'COCODY', NULL, true, '1', '2026-10-11 22:30:51.23+00', 'CACE');
INSERT INTO public.entite (id_entite, nom, sigle, id_hierarchisation, id_entite_parent, localisation, responsable_nom, actif, id_user, dh_creation, id_nature) VALUES ('CS COCODY NORD', 'Centre Social de Cocody Nord', 'CS', 'CS', 'DR ABIDJAN', 'COCODY', NULL, true, '1', '2026-10-11 22:30:51.23+00', 'CS');
INSERT INTO public.entite (id_entite, nom, sigle, id_hierarchisation, id_entite_parent, localisation, responsable_nom, actif, id_user, dh_creation, id_nature) VALUES ('CPPE DJOROBITE 2', 'Centre de Protection de la Petite Enfance de Djorobite 2', 'CPPE', 'CPPE', 'DR ABIDJAN', 'COCODY', NULL, true, '1', '2026-10-11 22:30:51.23+00', 'CPPE');
INSERT INTO public.entite (id_entite, nom, sigle, id_hierarchisation, id_entite_parent, localisation, responsable_nom, actif, id_user, dh_creation, id_nature) VALUES ('CACE ADJAHUI - KOUBE', 'Centre d''Action Communautaire pour l''Enfance de Adjahui - Koube', 'CACE', 'CACE', 'DR ABIDJAN', 'PORT - BOUËT', NULL, true, '1', '2026-10-11 22:30:51.23+00', 'CACE');
INSERT INTO public.entite (id_entite, nom, sigle, id_hierarchisation, id_entite_parent, localisation, responsable_nom, actif, id_user, dh_creation, id_nature) VALUES ('CACE ADIAPOTO 2', 'Centre d''Action Communautaire pour l''Enfance de Adiapoto 2', 'CACE', 'CACE', 'DR ABIDJAN', 'SONGON', NULL, true, '1', '2026-10-11 22:30:51.23+00', 'CACE');
INSERT INTO public.entite (id_entite, nom, sigle, id_hierarchisation, id_entite_parent, localisation, responsable_nom, actif, id_user, dh_creation, id_nature) VALUES ('CACE SONGON ABIATE 2', 'Centre d''Action Communautaire pour l''Enfance de Songon Abiate 2', 'CACE', 'CACE', 'DR ABIDJAN', 'SONGON', NULL, true, '1', '2026-10-11 22:30:51.23+00', 'CACE');
INSERT INTO public.entite (id_entite, nom, sigle, id_hierarchisation, id_entite_parent, localisation, responsable_nom, actif, id_user, dh_creation, id_nature) VALUES ('CACE SONGON M''BRATHE', 'Centre d''Action Communautaire pour l''Enfance de Songon m''Brathe', 'CACE', 'CACE', 'DR ABIDJAN', 'SONGON', NULL, true, '1', '2026-10-11 22:30:51.23+00', 'CACE');
INSERT INTO public.entite (id_entite, nom, sigle, id_hierarchisation, id_entite_parent, localisation, responsable_nom, actif, id_user, dh_creation, id_nature) VALUES ('CES ABADJIN KOUTE', 'Centre d''Éducation Spécialisée de Abadjin Koute', 'CES', 'CES', 'DR ABIDJAN', 'SONGON', NULL, true, '1', '2026-10-11 22:30:51.23+00', 'CES');
INSERT INTO public.entite (id_entite, nom, sigle, id_hierarchisation, id_entite_parent, localisation, responsable_nom, actif, id_user, dh_creation, id_nature) VALUES ('CPPE ABADJIN KOUTE', 'Centre de Protection de la Petite Enfance de Abadjin Koute', 'CPPE', 'CPPE', 'DR ABIDJAN', 'SONGON', NULL, true, '1', '2026-10-11 22:30:51.23+00', 'CPPE');
INSERT INTO public.entite (id_entite, nom, sigle, id_hierarchisation, id_entite_parent, localisation, responsable_nom, actif, id_user, dh_creation, id_nature) VALUES ('CS TREICHVILLE', 'Centre Social de Treichville', 'CS', 'CS', 'DR ABIDJAN', 'TREICHVILLE', NULL, true, '1', '2026-10-11 22:30:51.23+00', 'CS');
INSERT INTO public.entite (id_entite, nom, sigle, id_hierarchisation, id_entite_parent, localisation, responsable_nom, actif, id_user, dh_creation, id_nature) VALUES ('ONG BLOOM', 'ONG Bloom', 'ONG', 'ONG', 'DR ABIDJAN', 'ABIDJAN', NULL, true, '1', '2026-10-11 22:30:51.23+00', 'ONG');
INSERT INTO public.entite (id_entite, nom, sigle, id_hierarchisation, id_entite_parent, localisation, responsable_nom, actif, id_user, dh_creation, id_nature) VALUES ('CACE BONZI/YAKRO', 'Centre d''Action Communautaire pour l''Enfance de Bonzi/Yakro', 'CACE', 'CACE', 'DR BELIER', 'BONZI', NULL, true, '1', '2026-10-11 22:30:51.23+00', 'CACE');
INSERT INTO public.entite (id_entite, nom, sigle, id_hierarchisation, id_entite_parent, localisation, responsable_nom, actif, id_user, dh_creation, id_nature) VALUES ('CS YAMOUSSOUKRO', 'Centre Social de Yamoussoukro', 'CS', 'CS', 'DR BELIER', 'YAMOUSSOUKRO', NULL, true, '1', '2026-10-11 22:30:51.23+00', 'CS');


--
-- Data for Name: hierarchisation_entite; Type: TABLE DATA; Schema: public; Owner: -
--

INSERT INTO public.hierarchisation_entite (id_hierarchisation, libelle, description, actif, id_user, created_at) VALUES ('CABINET', 'Cabinet', 'Cabinet ministériel et services rapprochés du Ministre', true, '1', '2026-10-04 16:05:08.262+00');
INSERT INTO public.hierarchisation_entite (id_hierarchisation, libelle, description, actif, id_user, created_at) VALUES ('DIRECTIONS_SERVICES_RATTACHES', 'Directions et Services Rattachés au Cabinet', 'Directions supports et services d''appui direct rattachés au Cabinet', true, '1', '2026-10-04 16:05:08.262+00');
INSERT INTO public.hierarchisation_entite (id_hierarchisation, libelle, description, actif, id_user, created_at) VALUES ('DIRECTION_GENERALE', 'Direction Générale', 'Directions générales de coordination et de pilotage stratégique', true, '1', '2026-10-04 16:05:08.262+00');
INSERT INTO public.hierarchisation_entite (id_hierarchisation, libelle, description, actif, id_user, created_at) VALUES ('DIRECTION_CENTRALE', 'Direction Centrale', 'Directions centrales opérationnelles et sectorielles', true, '1', '2026-10-04 16:05:08.262+00');
INSERT INTO public.hierarchisation_entite (id_hierarchisation, libelle, description, actif, id_user, created_at) VALUES ('SOUS_DIRECTION', 'Sous-Direction', 'Sous-directions opérationnelles au sein des directions centrales ou rattachées', true, '1', '2026-10-04 16:05:08.262+00');
INSERT INTO public.hierarchisation_entite (id_hierarchisation, libelle, description, actif, id_user, created_at) VALUES ('SERVICE', 'Service', 'Services administratifs, techniques ou opérationnels', true, '1', '2026-10-04 16:05:08.262+00');
INSERT INTO public.hierarchisation_entite (id_hierarchisation, libelle, description, actif, id_user, created_at) VALUES ('DIRECTION_REGIONALE', 'Direction Régionale', 'Services déconcentrés au niveau régional du Ministère', true, '1', '2026-10-04 16:05:08.262+00');
INSERT INTO public.hierarchisation_entite (id_hierarchisation, libelle, description, actif, id_user, created_at) VALUES ('COMPLEXE_SOCIO_EDUCATIF', 'Complexe Socio-Éducatif', 'Établissements socio-éducatifs de proximité (CSE)', true, '1', '2026-10-04 16:05:08.262+00');
INSERT INTO public.hierarchisation_entite (id_hierarchisation, libelle, description, actif, id_user, created_at) VALUES ('PROGRAMMES_CELLULES', 'Programmes et Cellules Rattachés', 'Programmes nationaux de prise en charge et cellules spécialisées rattachées', true, '1', '2026-10-04 16:05:08.262+00');
INSERT INTO public.hierarchisation_entite (id_hierarchisation, libelle, description, actif, id_user, created_at) VALUES ('AUTORITE_INSTITUTION', 'Autorité / Institution Rattachée', 'Organes et autorités autonomes sous tutelle (ex: ACACI)', true, '1', '2026-10-04 16:05:08.262+00');
INSERT INTO public.hierarchisation_entite (id_hierarchisation, libelle, description, actif, id_user, created_at) VALUES ('CPPE', 'Centre de Protection de la Petite Enfance', 'Il assure l''accueil, l''éveil et la protection des jeunes enfants (généralement de la crèche à la maternelle, de 3 mois à 5 ans).', true, '1', '2026-10-06 09:41:15.481+00');
INSERT INTO public.hierarchisation_entite (id_hierarchisation, libelle, description, actif, id_user, created_at) VALUES ('CS', 'Centre Social', 'Un centre social est un équipement de proximité à vocation globale, familiale et intergénérationnelle, conçu pour accueillir l''ensemble de la population d''un territoire (quartier urbain ou zone rurale).

Il fonctionne à la fois comme un lieu d''animation de la vie locale, un espace d''accès aux droits et un foyer d''initiatives citoyennes portées par et pour les habitants', true, '1', '2026-10-06 10:00:53.824+00');
INSERT INTO public.hierarchisation_entite (id_hierarchisation, libelle, description, actif, id_user, created_at) VALUES ('IFEF', 'Institution de Formation et d''Éducation Féminine', 'Structures publiques sous la tutelle du Ministère de la Femme, de la Famille et de l''Enfant. Elles offrent des formations professionnelles et pratiques aux femmes et jeunes filles déscolarisées ou non scolarisées (couture, broderie, pâtisserie, puériculture, gestion, alphabétisation)', true, '1', '2026-10-06 09:49:04.606+00');
INSERT INTO public.hierarchisation_entite (id_hierarchisation, libelle, description, actif, id_user, created_at) VALUES ('CACE', 'Centre d''Action Communautaire pour l''Enfance', 'Le Centre d’Action Communautaire pour l’Enfance (ou Centre d’Action Communautaire pour la Petite Enfance, CACE) est une structure socio-éducative de proximité, particulièrement développée en Côte d''Ivoire sous la tutelle du Ministère chargé de la Femme, de la Famille et de l''Enfant (MFFE)', true, '1', '2026-10-06 10:27:26.528+00');
INSERT INTO public.hierarchisation_entite (id_hierarchisation, libelle, description, actif, id_user, created_at) VALUES ('STRUCTURE_SPECIALISEE', 'Structure Spécialisée', NULL, true, '1', '2026-10-11 00:24:20.149+00');
INSERT INTO public.hierarchisation_entite (id_hierarchisation, libelle, description, actif, id_user, created_at) VALUES ('CES', 'Centre d''Éducation Spécialisée', 'Ramification issue du fichier Excel (Centre d''Éducation Spécialisée)', true, '1', '2026-10-11 22:30:51.23+00');
INSERT INTO public.hierarchisation_entite (id_hierarchisation, libelle, description, actif, id_user, created_at) VALUES ('CT', 'Centre de Transit', 'Ramification issue du fichier Excel (Centre de Transit)', true, '1', '2026-10-11 22:30:51.23+00');
INSERT INTO public.hierarchisation_entite (id_hierarchisation, libelle, description, actif, id_user, created_at) VALUES ('POUPONNIERE', 'Pouponnière', 'Ramification issue du fichier Excel (Pouponnière)', true, '1', '2026-10-11 22:30:51.23+00');
INSERT INTO public.hierarchisation_entite (id_hierarchisation, libelle, description, actif, id_user, created_at) VALUES ('SOS VILLAGE', 'Village d''Enfants SOS', 'Ramification issue du fichier Excel (Village d''Enfants SOS)', true, '1', '2026-10-11 22:30:51.23+00');
INSERT INTO public.hierarchisation_entite (id_hierarchisation, libelle, description, actif, id_user, created_at) VALUES ('CA', 'Centre d''Accueil', 'Ramification issue du fichier Excel (Centre d''Accueil)', true, '1', '2026-10-11 22:30:51.23+00');
INSERT INTO public.hierarchisation_entite (id_hierarchisation, libelle, description, actif, id_user, created_at) VALUES ('ORPHELINAT', 'Orphelinat', 'Ramification issue du fichier Excel (Orphelinat)', true, '1', '2026-10-11 22:30:51.23+00');
INSERT INTO public.hierarchisation_entite (id_hierarchisation, libelle, description, actif, id_user, created_at) VALUES ('ONG', 'Organisation Non Gouvernementale', 'Ramification issue du fichier Excel (Organisation Non Gouvernementale)', true, '1', '2026-10-11 22:30:51.23+00');
INSERT INTO public.hierarchisation_entite (id_hierarchisation, libelle, description, actif, id_user, created_at) VALUES ('GARDERIE', 'Garderie', 'Ramification issue du fichier Excel (Garderie)', true, '1', '2026-10-11 22:30:51.23+00');
INSERT INTO public.hierarchisation_entite (id_hierarchisation, libelle, description, actif, id_user, created_at) VALUES ('CENTRE EDUCATIF', 'Centre Éducatif', 'Ramification issue du fichier Excel (Centre Éducatif)', true, '1', '2026-10-11 22:30:51.23+00');
INSERT INTO public.hierarchisation_entite (id_hierarchisation, libelle, description, actif, id_user, created_at) VALUES ('CRECHE  GARDERIE', 'Crèche / Garderie', 'Ramification issue du fichier Excel (Crèche / Garderie)', true, '1', '2026-10-11 22:30:51.23+00');
INSERT INTO public.hierarchisation_entite (id_hierarchisation, libelle, description, actif, id_user, created_at) VALUES ('INTERNAT', 'Internat', 'Ramification issue du fichier Excel (Internat)', true, '1', '2026-10-11 22:30:51.23+00');


--
-- Data for Name: livraison_carte; Type: TABLE DATA; Schema: public; Owner: -
--



--
-- Data for Name: nature_entite; Type: TABLE DATA; Schema: public; Owner: -
--

INSERT INTO public.nature_entite (id_nature, libelle, actif, id_user, dh_creation) VALUES ('DIRECTION', 'Direction', true, '1', '2026-10-10 22:03:13.808+00');
INSERT INTO public.nature_entite (id_nature, libelle, actif, id_user, dh_creation) VALUES ('BASE', 'Structure de Base', true, '1', '2026-10-10 22:04:16.449+00');
INSERT INTO public.nature_entite (id_nature, libelle, actif, id_user, dh_creation) VALUES ('PROGRAMME', 'Programme', true, '1', '2026-10-10 22:05:14.076+00');
INSERT INTO public.nature_entite (id_nature, libelle, actif, id_user, dh_creation) VALUES ('CELLULE', 'Cellule', true, '1', '2026-10-10 22:05:40.278+00');
INSERT INTO public.nature_entite (id_nature, libelle, actif, id_user, dh_creation) VALUES ('COMITE', 'Comité', true, '1', '2026-10-10 22:06:13.384+00');
INSERT INTO public.nature_entite (id_nature, libelle, actif, id_user, dh_creation) VALUES ('GENERAL', 'Direction Générale', true, '1', '2026-10-10 22:07:04.646+00');
INSERT INTO public.nature_entite (id_nature, libelle, actif, id_user, dh_creation) VALUES ('CABINET', 'Cabinet', true, '1', '2026-10-11 21:41:56.516+00');
INSERT INTO public.nature_entite (id_nature, libelle, actif, id_user, dh_creation) VALUES ('INSPECTION GENERALE', 'Inspection Générale', true, '1', '2026-10-11 21:41:56.516+00');
INSERT INTO public.nature_entite (id_nature, libelle, actif, id_user, dh_creation) VALUES ('INSTITUTION', 'Institution', true, '1', '2026-10-11 21:41:56.516+00');
INSERT INTO public.nature_entite (id_nature, libelle, actif, id_user, dh_creation) VALUES ('SERVICE', 'Service', true, '1', '2026-10-11 21:41:56.516+00');
INSERT INTO public.nature_entite (id_nature, libelle, actif, id_user, dh_creation) VALUES ('PROJET', 'Projet', true, '1', '2026-10-11 21:41:56.516+00');
INSERT INTO public.nature_entite (id_nature, libelle, actif, id_user, dh_creation) VALUES ('IFEF', 'Institution de Formation et d''Éducation Féminine', true, '1', '2026-10-11 21:41:56.516+00');
INSERT INTO public.nature_entite (id_nature, libelle, actif, id_user, dh_creation) VALUES ('CPPE', 'Centre de Protection de la Petite Enfance', true, '1', '2026-10-11 21:41:56.516+00');
INSERT INTO public.nature_entite (id_nature, libelle, actif, id_user, dh_creation) VALUES ('CACE', 'Centre d''Action Communautaire pour l''Enfance', true, '1', '2026-10-11 21:41:56.516+00');
INSERT INTO public.nature_entite (id_nature, libelle, actif, id_user, dh_creation) VALUES ('CSE', 'Complexe Socio-Éducatif', true, '1', '2026-10-11 21:41:56.516+00');
INSERT INTO public.nature_entite (id_nature, libelle, actif, id_user, dh_creation) VALUES ('CES', 'Centre d''Éducation Spécialisée', true, '1', '2026-10-11 21:41:56.516+00');
INSERT INTO public.nature_entite (id_nature, libelle, actif, id_user, dh_creation) VALUES ('CS', 'Centre Social', true, '1', '2026-10-11 21:41:56.516+00');
INSERT INTO public.nature_entite (id_nature, libelle, actif, id_user, dh_creation) VALUES ('CT', 'Centre de Transit', true, '1', '2026-10-11 21:41:56.516+00');
INSERT INTO public.nature_entite (id_nature, libelle, actif, id_user, dh_creation) VALUES ('POUPONNIERE', 'Pouponnière', true, '1', '2026-10-11 21:41:56.516+00');
INSERT INTO public.nature_entite (id_nature, libelle, actif, id_user, dh_creation) VALUES ('SOS VILLAGE', 'Village d''Enfants SOS', true, '1', '2026-10-11 21:41:56.516+00');
INSERT INTO public.nature_entite (id_nature, libelle, actif, id_user, dh_creation) VALUES ('CA', 'Centre d''Accueil', true, '1', '2026-10-11 21:41:56.516+00');
INSERT INTO public.nature_entite (id_nature, libelle, actif, id_user, dh_creation) VALUES ('ORPHELINAT', 'Orphelinat', true, '1', '2026-10-11 21:41:56.516+00');
INSERT INTO public.nature_entite (id_nature, libelle, actif, id_user, dh_creation) VALUES ('ONG', 'Organisation Non Gouvernementale', true, '1', '2026-10-11 21:41:56.516+00');
INSERT INTO public.nature_entite (id_nature, libelle, actif, id_user, dh_creation) VALUES ('STRUCTURE SPECIALISEE', 'Structure Spécialisée', true, '1', '2026-10-11 21:41:56.516+00');
INSERT INTO public.nature_entite (id_nature, libelle, actif, id_user, dh_creation) VALUES ('GARDERIE', 'Garderie', true, '1', '2026-10-11 21:41:56.516+00');
INSERT INTO public.nature_entite (id_nature, libelle, actif, id_user, dh_creation) VALUES ('CENTRE EDUCATIF', 'Centre Éducatif', true, '1', '2026-10-11 21:41:56.516+00');
INSERT INTO public.nature_entite (id_nature, libelle, actif, id_user, dh_creation) VALUES ('CRECHE  GARDERIE', 'Crèche / Garderie', true, '1', '2026-10-11 21:41:56.516+00');
INSERT INTO public.nature_entite (id_nature, libelle, actif, id_user, dh_creation) VALUES ('INTERNAT', 'Internat', true, '1', '2026-10-11 21:41:56.516+00');


--
-- Data for Name: production_carte; Type: TABLE DATA; Schema: public; Owner: -
--

INSERT INTO public.production_carte (id, annee_scolaire, quantite_produite, cout_total, date_production, prestataire, reference_commande, observations, id_user, created_at, updated_at) VALUES (1, '2026-2027', 50000, 0.00, '2026-10-13', 'Imprimerie Nationale / Prestataire MFFE', NULL, 'Campagne nationale des cartes scolaires 2026-2027', '1', '2026-10-13 14:38:51.019183+00', '2026-10-13 14:38:51.019183+00');


--
-- Data for Name: reception_carte; Type: TABLE DATA; Schema: public; Owner: -
--



--
-- Data for Name: user; Type: TABLE DATA; Schema: public; Owner: -
--

INSERT INTO public."user" (id, email, password_hash, created_at, name, role) VALUES ('1', 'admin@mffe.gouv.ci', '$2b$10$a9GOQooe0TMYfIQCiSsWNO6NWGBsvucr6qTlLDky/fH.wTyFXVKz2', '2026-10-13 11:01:36.67148+00', 'Administrateur MFFE', 'ADMIN');
INSERT INTO public."user" (id, email, password_hash, created_at, name, role) VALUES ('USR-002', 'agent.drabj@mffe.gouv.ci', '$2b$10$a9GOQooe0TMYfIQCiSsWNO6NWGBsvucr6qTlLDky/fH.wTyFXVKz2', '2026-10-13 13:02:16.651462+00', 'KOUADIO Marc (Agent DR-ABJ)', 'USER');
INSERT INTO public."user" (id, email, password_hash, created_at, name, role) VALUES ('USR-MV6Y1AN9-057', 'ester@gmail.com', '$2b$10$5LARGRFxzayVeZKhCsYfyezwj.QeC95tArehWi31/CAiI819.CAnS', '2026-10-13 17:17:06.982596+00', 'DANHO Ester', 'ADMIN');
INSERT INTO public."user" (id, email, password_hash, created_at, name, role) VALUES ('USR-MV6Y5MLQ-737', 'stagiaire@gmail.com', '$2b$10$GYxQqZBka7AkiWGiltCjFOxFLMqMrT8sX3wcA/bzeagL5.TpKdxEy', '2026-10-13 17:20:29.104063+00', 'Stagiaire', 'USER');
INSERT INTO public."user" (id, email, password_hash, created_at, name, role) VALUES ('USR-MV6YAV8C-897', 'odjira@gmail.com', '$2b$10$BbXpMGoM25JNsnKR9W5pWe6U/hW0Q09wlQSYBsPzcOMyBqTpJKZGK', '2026-10-13 17:24:33.579505+00', 'ODJIRA', 'ADMIN');


--
-- Name: livraison_carte_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.livraison_carte_id_seq', 2, true);


--
-- Name: production_carte_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.production_carte_id_seq', 33, true);


--
-- Name: reception_carte_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.reception_carte_id_seq', 4, true);


--
-- Name: entite entite_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.entite
    ADD CONSTRAINT entite_pkey PRIMARY KEY (id_entite);


--
-- Name: hierarchisation_entite hierarchisation_entite_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.hierarchisation_entite
    ADD CONSTRAINT hierarchisation_entite_pkey PRIMARY KEY (id_hierarchisation);


--
-- Name: livraison_carte livraison_carte_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.livraison_carte
    ADD CONSTRAINT livraison_carte_pkey PRIMARY KEY (id);


--
-- Name: nature_entite nature_entite_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.nature_entite
    ADD CONSTRAINT nature_entite_pkey PRIMARY KEY (id_nature);


--
-- Name: production_carte production_carte_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.production_carte
    ADD CONSTRAINT production_carte_pkey PRIMARY KEY (id);


--
-- Name: reception_carte reception_carte_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.reception_carte
    ADD CONSTRAINT reception_carte_pkey PRIMARY KEY (id);


--
-- Name: user user_email_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."user"
    ADD CONSTRAINT user_email_key UNIQUE (email);


--
-- Name: user user_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."user"
    ADD CONSTRAINT user_pkey PRIMARY KEY (id);


--
-- Name: idx_entite_actif; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_entite_actif ON public.entite USING btree (actif);


--
-- Name: idx_entite_hierarchisation; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_entite_hierarchisation ON public.entite USING btree (id_hierarchisation);


--
-- Name: idx_entite_id_user; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_entite_id_user ON public.entite USING btree (id_user);


--
-- Name: idx_entite_nature; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_entite_nature ON public.entite USING btree (id_nature);


--
-- Name: idx_entite_nom; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_entite_nom ON public.entite USING btree (nom);


--
-- Name: idx_entite_parent; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_entite_parent ON public.entite USING btree (id_entite_parent);


--
-- Name: idx_entite_sigle; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_entite_sigle ON public.entite USING btree (sigle);


--
-- Name: idx_hierarchisation_entite_actif; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_hierarchisation_entite_actif ON public.hierarchisation_entite USING btree (actif);


--
-- Name: idx_hierarchisation_entite_id_user; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_hierarchisation_entite_id_user ON public.hierarchisation_entite USING btree (id_user);


--
-- Name: idx_hierarchisation_entite_libelle; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_hierarchisation_entite_libelle ON public.hierarchisation_entite USING btree (libelle);


--
-- Name: idx_livraison_carte_annee; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_livraison_carte_annee ON public.livraison_carte USING btree (annee_scolaire);


--
-- Name: idx_livraison_carte_date; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_livraison_carte_date ON public.livraison_carte USING btree (date_livraison);


--
-- Name: idx_livraison_carte_entite; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_livraison_carte_entite ON public.livraison_carte USING btree (id_entite);


--
-- Name: idx_livraison_carte_user; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_livraison_carte_user ON public.livraison_carte USING btree (id_user);


--
-- Name: idx_nature_entite_actif; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_nature_entite_actif ON public.nature_entite USING btree (actif);


--
-- Name: idx_nature_entite_libelle; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_nature_entite_libelle ON public.nature_entite USING btree (libelle);


--
-- Name: idx_reception_carte_annee; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_reception_carte_annee ON public.reception_carte USING btree (annee_scolaire);


--
-- Name: idx_reception_carte_date; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_reception_carte_date ON public.reception_carte USING btree (date_reception);


--
-- Name: idx_reception_carte_entite; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_reception_carte_entite ON public.reception_carte USING btree (id_entite);


--
-- Name: idx_reception_carte_user; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_reception_carte_user ON public.reception_carte USING btree (id_user);


--
-- Name: entite entite_id_entite_parent_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.entite
    ADD CONSTRAINT entite_id_entite_parent_fkey FOREIGN KEY (id_entite_parent) REFERENCES public.entite(id_entite) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: entite entite_id_hierarchisation_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.entite
    ADD CONSTRAINT entite_id_hierarchisation_fkey FOREIGN KEY (id_hierarchisation) REFERENCES public.hierarchisation_entite(id_hierarchisation) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: entite entite_id_nature_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.entite
    ADD CONSTRAINT entite_id_nature_fkey FOREIGN KEY (id_nature) REFERENCES public.nature_entite(id_nature) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: entite entite_id_user_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.entite
    ADD CONSTRAINT entite_id_user_fkey FOREIGN KEY (id_user) REFERENCES public."user"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: livraison_carte fk_livraison_carte_entite; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.livraison_carte
    ADD CONSTRAINT fk_livraison_carte_entite FOREIGN KEY (id_entite) REFERENCES public.entite(id_entite) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: livraison_carte fk_livraison_carte_user; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.livraison_carte
    ADD CONSTRAINT fk_livraison_carte_user FOREIGN KEY (id_user) REFERENCES public."user"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: production_carte fk_production_carte_user; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.production_carte
    ADD CONSTRAINT fk_production_carte_user FOREIGN KEY (id_user) REFERENCES public."user"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: reception_carte fk_reception_carte_entite; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.reception_carte
    ADD CONSTRAINT fk_reception_carte_entite FOREIGN KEY (id_entite) REFERENCES public.entite(id_entite) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: reception_carte fk_reception_carte_user; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.reception_carte
    ADD CONSTRAINT fk_reception_carte_user FOREIGN KEY (id_user) REFERENCES public."user"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: hierarchisation_entite hierarchisation_entite_id_user_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.hierarchisation_entite
    ADD CONSTRAINT hierarchisation_entite_id_user_fkey FOREIGN KEY (id_user) REFERENCES public."user"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: nature_entite nature_entite_id_user_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.nature_entite
    ADD CONSTRAINT nature_entite_id_user_fkey FOREIGN KEY (id_user) REFERENCES public."user"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- PostgreSQL database dump complete
--

\unrestrict wqp0bfj8nlPuQ7cjP6c7xBcJXLCOeOjPuIwcET94b1e4G1vKuBdQWJYw2623jBe

