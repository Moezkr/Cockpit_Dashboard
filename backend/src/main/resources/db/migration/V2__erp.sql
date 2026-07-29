CREATE TABLE IF NOT EXISTS public.erp_client (
    id_client        VARCHAR(50)  PRIMARY KEY,
    raison_sociale   VARCHAR(255) NOT NULL,
    secteur          VARCHAR(100),
    chiffre_affaires NUMERIC(15, 2),
    encours          NUMERIC(15, 2),
    region           VARCHAR(100),
    statut           VARCHAR(50)  DEFAULT 'Actif',
    created_at       TIMESTAMP    DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS public.erp_facture (
    num_facture VARCHAR(50) PRIMARY KEY,
    id_client VARCHAR(50) REFERENCES public.erp_client(id_client),
    client VARCHAR(255),
    date_facture DATE,
    montant_ttc NUMERIC(15, 2),
    montant_ht NUMERIC(15, 2),
    statut VARCHAR(50),
    mois VARCHAR(20),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS public.erp_paiement (
    num_paiement VARCHAR(50) PRIMARY KEY,
    num_facture VARCHAR(50) REFERENCES public.erp_facture(num_facture),
    id_client VARCHAR(50) REFERENCES public.erp_client(id_client),
    date_paiement DATE,
    montant_paye NUMERIC(15, 2),
    mode_paiement VARCHAR(50),
    mois VARCHAR(20),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS public.erp_rendez_vous (
    id_rdv     VARCHAR(50) PRIMARY KEY,
    praticien  VARCHAR(255),
    date_rdv   DATE,
    acte       VARCHAR(100),
    montant    NUMERIC(15, 2),
    statut     VARCHAR(50),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS public.erp_produit (
    id_produit    VARCHAR(50)  PRIMARY KEY,
    designation   VARCHAR(255) NOT NULL,
    categorie     VARCHAR(100),
    prix_unitaire NUMERIC(15, 2),
    stock_actuel  INTEGER,
    stock_min     INTEGER,
    statut        VARCHAR(50)  DEFAULT 'Disponible',
    created_at    TIMESTAMP    DEFAULT CURRENT_TIMESTAMP
);
