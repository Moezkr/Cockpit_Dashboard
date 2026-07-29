

INSERT INTO cockpit.user_account (id, version, created_at, updated_at, created_by, updated_by, username, email, password_hash, display_name, account_status, last_login_at)
VALUES
    ('a1111111-1111-4111-a111-111111111111', 0, NOW(), NOW(), 'system', 'system', 'ahaddad', 'amine.haddad@prestacode.com', '$2a$10$7Q9b9K.d1Z...', 'Amine Haddad', 'ACTIVE', NOW()),
    ('b2222222-2222-4222-b222-222222222222', 0, NOW(), NOW(), 'system', 'system', 'kjelassi', 'karim.jelassi@prestacode.com', '$2a$10$7Q9b9K.d1Z...', 'Karim Jelassi', 'ACTIVE', NOW()),
    ('c3333333-3333-4333-c333-333333333333', 0, NOW(), NOW(), 'system', 'system', 'ssahnoun', 'sonia.sahnoun@prestacode.com', '$2a$10$7Q9b9K.d1Z...', 'Sonia Sahnoun', 'ACTIVE', NOW()),
    ('d4444444-4444-4444-d444-444444444444', 0, NOW(), NOW(), 'system', 'system', 'mmedina', 'moncef.medina@prestacode.com', '$2a$10$7Q9b9K.d1Z...', 'Moncef Medina', 'ACTIVE', NOW())
ON CONFLICT (username) DO NOTHING;


INSERT INTO cockpit.data_source (id, version, created_at, updated_at, created_by, updated_by, source_key, source_label, source_description, host_application, table_name, active)
VALUES
    ('e1000001-0000-4000-a000-000000000001', 0, NOW(), NOW(), 'system', 'system', 'src-factures', 'Factures Clients', 'Factures clients émises (ProgesCode)', 'PROGES_CODE', 'public.erp_facture', true),
    ('e1000002-0000-4000-a000-000000000002', 0, NOW(), NOW(), 'system', 'system', 'src-clients', 'Référentiel Clients', 'Référentiel clients et comptes (ProgesCode)', 'PROGES_CODE', 'public.erp_client', true),
    ('e1000003-0000-4000-a000-000000000003', 0, NOW(), NOW(), 'system', 'system', 'src-paiements', 'Encaissements & Paiements', 'Encaissements et règlements reçus (ProgesCode)', 'PROGES_CODE', 'public.erp_paiement', true),
    ('e1000004-0000-4000-a000-000000000004', 0, NOW(), NOW(), 'system', 'system', 'src-rdv', 'Planning Rendez-vous', 'Planning des rendez-vous (HealthPilot)', 'HEALTH_PILOT', 'public.erp_rendez_vous', true),
    ('e1000005-0000-4000-a000-000000000005', 0, NOW(), NOW(), 'system', 'system', 'src-produits', 'Catalogue Produits & Stock', 'Gestion des produits et niveaux de stock (ProgesCode)', 'PROGES_CODE', 'public.erp_produit', true)
ON CONFLICT (source_key) DO NOTHING;


INSERT INTO cockpit.data_field (id, version, created_at, updated_at, created_by, updated_by, data_source_id, field_key, field_label, field_type, field_description, nullable)
VALUES

    ('f1000101-0000-4000-a000-000000000101', 0, NOW(), NOW(), 'system', 'system', 'e1000001-0000-4000-a000-000000000001', 'num_facture', 'N° Facture', 'TEXT', 'Numéro unique de facture', false),
    ('f1000102-0000-4000-a000-000000000102', 0, NOW(), NOW(), 'system', 'system', 'e1000001-0000-4000-a000-000000000001', 'client', 'Client', 'TEXT', 'Nom du client', true),
    ('f1000103-0000-4000-a000-000000000103', 0, NOW(), NOW(), 'system', 'system', 'e1000001-0000-4000-a000-000000000001', 'date_facture', 'Date de facture', 'DATE', 'Date d emission de la facture', true),
    ('f1000104-0000-4000-a000-000000000104', 0, NOW(), NOW(), 'system', 'system', 'e1000001-0000-4000-a000-000000000001', 'montant_ttc', 'Montant TTC', 'AMOUNT', 'Montant toutes taxes comprises', true),
    ('f1000105-0000-4000-a000-000000000105', 0, NOW(), NOW(), 'system', 'system', 'e1000001-0000-4000-a000-000000000001', 'montant_ht', 'Montant HT', 'AMOUNT', 'Montant hors taxes', true),
    ('f1000106-0000-4000-a000-000000000106', 0, NOW(), NOW(), 'system', 'system', 'e1000001-0000-4000-a000-000000000001', 'statut', 'Statut Facture', 'TEXT', 'Statut de la facture', true),
    ('f1000107-0000-4000-a000-000000000107', 0, NOW(), NOW(), 'system', 'system', 'e1000001-0000-4000-a000-000000000001', 'mois', 'Mois', 'TEXT', 'Mois d emission', true),


    ('f1000201-0000-4000-a000-000000000201', 0, NOW(), NOW(), 'system', 'system', 'e1000002-0000-4000-a000-000000000002', 'id_client', 'ID Client', 'TEXT', 'Identifiant unique client', false),
    ('f1000202-0000-4000-a000-000000000202', 0, NOW(), NOW(), 'system', 'system', 'e1000002-0000-4000-a000-000000000002', 'raison_sociale', 'Raison Sociale', 'TEXT', 'Nom de entreprise client', false),
    ('f1000203-0000-4000-a000-000000000203', 0, NOW(), NOW(), 'system', 'system', 'e1000002-0000-4000-a000-000000000002', 'secteur', 'Secteur d Activité', 'TEXT', 'Secteur activité', true),
    ('f1000204-0000-4000-a000-000000000204', 0, NOW(), NOW(), 'system', 'system', 'e1000002-0000-4000-a000-000000000002', 'chiffre_affaires', 'Chiffre d Affaires', 'AMOUNT', 'Chiffre d affaires annuel', true),
    ('f1000205-0000-4000-a000-000000000205', 0, NOW(), NOW(), 'system', 'system', 'e1000002-0000-4000-a000-000000000002', 'encours', 'Encours Client', 'AMOUNT', 'Montant des en-cours', true),
    ('f1000206-0000-4000-a000-000000000206', 0, NOW(), NOW(), 'system', 'system', 'e1000002-0000-4000-a000-000000000002', 'region', 'Région', 'TEXT', 'Région géographique', true),
    ('f1000207-0000-4000-a000-000000000207', 0, NOW(), NOW(), 'system', 'system', 'e1000002-0000-4000-a000-000000000002', 'statut', 'Statut Client', 'TEXT', 'Statut du client', true),


    ('f1000301-0000-4000-a000-000000000301', 0, NOW(), NOW(), 'system', 'system', 'e1000003-0000-4000-a000-000000000003', 'num_paiement', 'N° Règlement', 'TEXT', 'Numéro de reçu', false),
    ('f1000302-0000-4000-a000-000000000302', 0, NOW(), NOW(), 'system', 'system', 'e1000003-0000-4000-a000-000000000003', 'num_facture', 'N° Facture', 'TEXT', 'Facture associée', true),
    ('f1000303-0000-4000-a000-000000000303', 0, NOW(), NOW(), 'system', 'system', 'e1000003-0000-4000-a000-000000000003', 'date_paiement', 'Date de Paiement', 'DATE', 'Date d encaissement', true),
    ('f1000304-0000-4000-a000-000000000304', 0, NOW(), NOW(), 'system', 'system', 'e1000003-0000-4000-a000-000000000003', 'montant_paye', 'Montant Payé', 'AMOUNT', 'Montant du règlement', true),
    ('f1000305-0000-4000-a000-000000000305', 0, NOW(), NOW(), 'system', 'system', 'e1000003-0000-4000-a000-000000000003', 'mode_paiement', 'Mode de Règlement', 'TEXT', 'Mode de paiement', true),
    ('f1000306-0000-4000-a000-000000000306', 0, NOW(), NOW(), 'system', 'system', 'e1000003-0000-4000-a000-000000000003', 'mois', 'Mois', 'TEXT', 'Mois du paiement', true),


    ('f1000401-0000-4000-a000-000000000401', 0, NOW(), NOW(), 'system', 'system', 'e1000004-0000-4000-a000-000000000004', 'id_rdv', 'N° Consultation', 'TEXT', 'Code du rendez-vous', false),
    ('f1000402-0000-4000-a000-000000000402', 0, NOW(), NOW(), 'system', 'system', 'e1000004-0000-4000-a000-000000000004', 'praticien', 'Praticien', 'TEXT', 'Nom du praticien', true),
    ('f1000403-0000-4000-a000-000000000403', 0, NOW(), NOW(), 'system', 'system', 'e1000004-0000-4000-a000-000000000004', 'date_rdv', 'Date RDV', 'DATE', 'Date du rendez-vous', true),
    ('f1000404-0000-4000-a000-000000000404', 0, NOW(), NOW(), 'system', 'system', 'e1000004-0000-4000-a000-000000000004', 'acte', 'Acte / Intervention', 'TEXT', 'Type d acte', true),
    ('f1000405-0000-4000-a000-000000000405', 0, NOW(), NOW(), 'system', 'system', 'e1000004-0000-4000-a000-000000000004', 'montant', 'Montant Honoraires', 'AMOUNT', 'Montant de consultation', true),
    ('f1000406-0000-4000-a000-000000000406', 0, NOW(), NOW(), 'system', 'system', 'e1000004-0000-4000-a000-000000000004', 'statut', 'Statut RDV', 'TEXT', 'Statut du rendez-vous', true),


    ('f1000501-0000-4000-a000-000000000501', 0, NOW(), NOW(), 'system', 'system', 'e1000005-0000-4000-a000-000000000005', 'id_produit', 'Code Produit', 'TEXT', 'Code référence produit', false),
    ('f1000502-0000-4000-a000-000000000502', 0, NOW(), NOW(), 'system', 'system', 'e1000005-0000-4000-a000-000000000005', 'designation', 'Désignation', 'TEXT', 'Nom du produit', false),
    ('f1000503-0000-4000-a000-000000000503', 0, NOW(), NOW(), 'system', 'system', 'e1000005-0000-4000-a000-000000000005', 'categorie', 'Catégorie', 'TEXT', 'Famille de produit', true),
    ('f1000504-0000-4000-a000-000000000504', 0, NOW(), NOW(), 'system', 'system', 'e1000005-0000-4000-a000-000000000005', 'prix_unitaire', 'Prix Unitaire', 'AMOUNT', 'Prix unitaire HT', true),
    ('f1000505-0000-4000-a000-000000000505', 0, NOW(), NOW(), 'system', 'system', 'e1000005-0000-4000-a000-000000000005', 'stock_actuel', 'Stock Actuel', 'NUMBER', 'Quantite disponible', true),
    ('f1000506-0000-4000-a000-000000000506', 0, NOW(), NOW(), 'system', 'system', 'e1000005-0000-4000-a000-000000000005', 'stock_min', 'Seuil Sécurité', 'NUMBER', 'Niveau d alerte stock', true),
    ('f1000507-0000-4000-a000-000000000507', 0, NOW(), NOW(), 'system', 'system', 'e1000005-0000-4000-a000-000000000005', 'statut', 'Statut Stock', 'TEXT', 'Disponibilité stock', true)
ON CONFLICT (id) DO NOTHING;


INSERT INTO cockpit.data_query (id, version, created_at, updated_at, created_by, updated_by, owner_id, query_name, query_description, visibility, aggregation, aggregation_field_id, row_limit, used_by_widgets)
VALUES
    ('a2000001-0000-4000-a000-000000000001', 0, NOW(), NOW(), 'ahaddad', 'ahaddad', 'a1111111-1111-4111-a111-111111111111', 'Chiffre d''affaires mensuel', 'Somme du montant TTC facturé par mois', 'SHARED', 'SUM', 'f1000104-0000-4000-a000-000000000104', 100, 4),
    ('a2000002-0000-4000-a000-000000000002', 0, NOW(), NOW(), 'ahaddad', 'ahaddad', 'a1111111-1111-4111-a111-111111111111', 'Encours par client', 'Somme des encours dus par client', 'SHARED', 'SUM', 'f1000205-0000-4000-a000-000000000205', 100, 4),
    ('a2000003-0000-4000-a000-000000000003', 0, NOW(), NOW(), 'ahaddad', 'ahaddad', 'a1111111-1111-4111-a111-111111111111', 'Répartition CA par secteur', 'Chiffre d''affaires ventilé par secteur d''activité', 'SHARED', 'SUM', 'f1000204-0000-4000-a000-000000000204', 100, 3),
    ('a2000004-0000-4000-a000-000000000004', 0, NOW(), NOW(), 'ahaddad', 'ahaddad', 'a1111111-1111-4111-a111-111111111111', 'Honoraires praticiens', 'Total des honoraires par praticien', 'SHARED', 'SUM', 'f1000405-0000-4000-a000-000000000405', 100, 3),
    ('a2000005-0000-4000-a000-000000000005', 0, NOW(), NOW(), 'kjelassi', 'kjelassi', 'b2222222-2222-4222-b222-222222222222', 'Stock par catégorie', 'Somme des articles en stock par catégorie', 'SHARED', 'SUM', 'f1000505-0000-4000-a000-000000000505', 100, 3),
    ('a2000006-0000-4000-a000-000000000006', 0, NOW(), NOW(), 'ahaddad', 'ahaddad', 'a1111111-1111-4111-a111-111111111111', 'Répartition des actes médicaux', 'Ventilation des honoraires par acte médical', 'SHARED', 'SUM', 'f1000405-0000-4000-a000-000000000405', 100, 2),
    ('a2000007-0000-4000-a000-000000000007', 0, NOW(), NOW(), 'ahaddad', 'ahaddad', 'a1111111-1111-4111-a111-111111111111', 'Performance par région', 'Matrice de performance commerciale par région', 'SHARED', 'SUM', 'f1000204-0000-4000-a000-000000000204', 100, 3),
    ('a2000008-0000-4000-a000-000000000008', 0, NOW(), NOW(), 'ahaddad', 'ahaddad', 'a1111111-1111-4111-a111-111111111111', 'Paiements par mode', 'Montant des règlements reçus par mode', 'SHARED', 'SUM', 'f1000304-0000-4000-a000-000000000304', 100, 2),
    ('a2000009-0000-4000-a000-000000000009', 0, NOW(), NOW(), 'kjelassi', 'kjelassi', 'b2222222-2222-4222-b222-222222222222', 'Valeur du stock par produit', 'Valeur du stock valorisé', 'SHARED', 'SUM', 'f1000504-0000-4000-a000-000000000504', 100, 3),
    ('a2000010-0000-4000-a000-000000000010', 0, NOW(), NOW(), 'ahaddad', 'ahaddad', 'a1111111-1111-4111-a111-111111111111', 'Statut des consultations', 'Nombre de consultations par statut', 'SHARED', 'COUNT', 'f1000401-0000-4000-a000-000000000401', 100, 2),
    ('a2000011-0000-4000-a000-000000000011', 0, NOW(), NOW(), 'ahaddad', 'ahaddad', 'a1111111-1111-4111-a111-111111111111', 'Chiffre d''affaires par région', 'Chiffre d''affaires par région administrative', 'SHARED', 'SUM', 'f1000204-0000-4000-a000-000000000204', 100, 2),
    ('a2000012-0000-4000-a000-000000000012', 0, NOW(), NOW(), 'kjelassi', 'kjelassi', 'b2222222-2222-4222-b222-222222222222', 'Niveau de stock produits', 'Stock actuel par produit', 'SHARED', 'SUM', 'f1000505-0000-4000-a000-000000000505', 100, 3)
ON CONFLICT (id) DO NOTHING;


INSERT INTO cockpit.query_source_binding (id, version, created_at, updated_at, created_by, updated_by, query_id, data_source_id, position_index)
VALUES
    ('b1000001-0000-4000-a000-000000000001', 0, NOW(), NOW(), 'system', 'system', 'a2000001-0000-4000-a000-000000000001', 'e1000001-0000-4000-a000-000000000001', 0),
    ('b1000002-0000-4000-a000-000000000002', 0, NOW(), NOW(), 'system', 'system', 'a2000002-0000-4000-a000-000000000002', 'e1000002-0000-4000-a000-000000000002', 0),
    ('b1000003-0000-4000-a000-000000000003', 0, NOW(), NOW(), 'system', 'system', 'a2000003-0000-4000-a000-000000000003', 'e1000002-0000-4000-a000-000000000002', 0),
    ('b1000004-0000-4000-a000-000000000004', 0, NOW(), NOW(), 'system', 'system', 'a2000004-0000-4000-a000-000000000004', 'e1000004-0000-4000-a000-000000000004', 0),
    ('b1000005-0000-4000-a000-000000000005', 0, NOW(), NOW(), 'system', 'system', 'a2000005-0000-4000-a000-000000000005', 'e1000005-0000-4000-a000-000000000005', 0),
    ('b1000006-0000-4000-a000-000000000006', 0, NOW(), NOW(), 'system', 'system', 'a2000006-0000-4000-a000-000000000006', 'e1000004-0000-4000-a000-000000000004', 0),
    ('b1000007-0000-4000-a000-000000000007', 0, NOW(), NOW(), 'system', 'system', 'a2000007-0000-4000-a000-000000000007', 'e1000002-0000-4000-a000-000000000002', 0),
    ('b1000008-0000-4000-a000-000000000008', 0, NOW(), NOW(), 'system', 'system', 'a2000008-0000-4000-a000-000000000008', 'e1000003-0000-4000-a000-000000000003', 0),
    ('b1000009-0000-4000-a000-000000000009', 0, NOW(), NOW(), 'system', 'system', 'a2000009-0000-4000-a000-000000000009', 'e1000005-0000-4000-a000-000000000005', 0),
    ('b1000010-0000-4000-a000-000000000010', 0, NOW(), NOW(), 'system', 'system', 'a2000010-0000-4000-a000-000000000010', 'e1000004-0000-4000-a000-000000000004', 0),
    ('b1000011-0000-4000-a000-000000000011', 0, NOW(), NOW(), 'system', 'system', 'a2000011-0000-4000-a000-000000000011', 'e1000002-0000-4000-a000-000000000002', 0),
    ('b1000012-0000-4000-a000-000000000012', 0, NOW(), NOW(), 'system', 'system', 'a2000012-0000-4000-a000-000000000012', 'e1000005-0000-4000-a000-000000000005', 0)
ON CONFLICT (id) DO NOTHING;


INSERT INTO cockpit.query_group_by_field (query_id, field_id, position_index)
VALUES
    ('a2000001-0000-4000-a000-000000000001', 'f1000107-0000-4000-a000-000000000107', 0),
    ('a2000002-0000-4000-a000-000000000002', 'f1000202-0000-4000-a000-000000000202', 0),
    ('a2000003-0000-4000-a000-000000000003', 'f1000203-0000-4000-a000-000000000203', 0),
    ('a2000004-0000-4000-a000-000000000004', 'f1000402-0000-4000-a000-000000000402', 0),
    ('a2000005-0000-4000-a000-000000000005', 'f1000503-0000-4000-a000-000000000503', 0),
    ('a2000006-0000-4000-a000-000000000006', 'f1000404-0000-4000-a000-000000000404', 0),
    ('a2000007-0000-4000-a000-000000000007', 'f1000206-0000-4000-a000-000000000206', 0),
    ('a2000008-0000-4000-a000-000000000008', 'f1000305-0000-4000-a000-000000000305', 0),
    ('a2000009-0000-4000-a000-000000000009', 'f1000502-0000-4000-a000-000000000502', 0),
    ('a2000010-0000-4000-a000-000000000010', 'f1000406-0000-4000-a000-000000000406', 0),
    ('a2000011-0000-4000-a000-000000000011', 'f1000206-0000-4000-a000-000000000206', 0),
    ('a2000012-0000-4000-a000-000000000012', 'f1000502-0000-4000-a000-000000000502', 0)
ON CONFLICT (query_id, field_id) DO NOTHING;


INSERT INTO cockpit.query_selected_field (query_id, field_id, position_index)
VALUES
    ('a2000001-0000-4000-a000-000000000001', 'f1000107-0000-4000-a000-000000000107', 0),
    ('a2000001-0000-4000-a000-000000000001', 'f1000104-0000-4000-a000-000000000104', 1),
    ('a2000002-0000-4000-a000-000000000002', 'f1000202-0000-4000-a000-000000000202', 0),
    ('a2000002-0000-4000-a000-000000000002', 'f1000205-0000-4000-a000-000000000205', 1),
    ('a2000003-0000-4000-a000-000000000003', 'f1000203-0000-4000-a000-000000000203', 0),
    ('a2000003-0000-4000-a000-000000000003', 'f1000204-0000-4000-a000-000000000204', 1),
    ('a2000004-0000-4000-a000-000000000004', 'f1000402-0000-4000-a000-000000000402', 0),
    ('a2000004-0000-4000-a000-000000000004', 'f1000405-0000-4000-a000-000000000405', 1),
    ('a2000005-0000-4000-a000-000000000005', 'f1000503-0000-4000-a000-000000000503', 0),
    ('a2000005-0000-4000-a000-000000000005', 'f1000505-0000-4000-a000-000000000505', 1),
    ('a2000006-0000-4000-a000-000000000006', 'f1000404-0000-4000-a000-000000000404', 0),
    ('a2000006-0000-4000-a000-000000000006', 'f1000405-0000-4000-a000-000000000405', 1),
    ('a2000007-0000-4000-a000-000000000007', 'f1000206-0000-4000-a000-000000000206', 0),
    ('a2000007-0000-4000-a000-000000000007', 'f1000204-0000-4000-a000-000000000204', 1),
    ('a2000008-0000-4000-a000-000000000008', 'f1000305-0000-4000-a000-000000000305', 0),
    ('a2000008-0000-4000-a000-000000000008', 'f1000304-0000-4000-a000-000000000304', 1),
    ('a2000009-0000-4000-a000-000000000009', 'f1000502-0000-4000-a000-000000000502', 0),
    ('a2000009-0000-4000-a000-000000000009', 'f1000504-0000-4000-a000-000000000504', 1),
    ('a2000010-0000-4000-a000-000000000010', 'f1000406-0000-4000-a000-000000000406', 0),
    ('a2000010-0000-4000-a000-000000000010', 'f1000401-0000-4000-a000-000000000401', 1),
    ('a2000011-0000-4000-a000-000000000011', 'f1000206-0000-4000-a000-000000000206', 0),
    ('a2000011-0000-4000-a000-000000000011', 'f1000204-0000-4000-a000-000000000204', 1),
    ('a2000012-0000-4000-a000-000000000012', 'f1000502-0000-4000-a000-000000000502', 0),
    ('a2000012-0000-4000-a000-000000000012', 'f1000505-0000-4000-a000-000000000505', 1)
ON CONFLICT (query_id, field_id) DO NOTHING;


INSERT INTO cockpit.dashboard (id, version, created_at, updated_at, created_by, updated_by, owner_id, dashboard_name, dashboard_description, color_hex, status, share_level, columns_count, density, refresh_interval, favorite, archived)
VALUES
    ('9f8e7d6c-5b4a-4f2e-9d0c-9b8a7f6e5d41', 0, NOW(), NOW(), 'ahaddad', 'ahaddad', 'a1111111-1111-4111-a111-111111111111', 'Suivi de trésorerie', 'Vue consolidée du CA, des encours et du recouvrement.', '#14b8a6', 'PUBLISHED', 'ORGANIZATION', 12, 'COMPACT', 'M1', true, false),
    ('8f7e6d5c-4b3a-4f1e-8d0c-8b7a6f5e4d32', 0, NOW(), NOW(), 'ahaddad', 'ahaddad', 'a1111111-1111-4111-a111-111111111111', 'Suivi des ventes', 'Performance commerciale par région et par secteur.', '#22c55e', 'PUBLISHED', 'ORGANIZATION', 12, 'COMPACT', 'OFF', true, false),
    ('7f6e5d4c-3b2a-4f0e-7d0c-7b6a5f4e3d23', 0, NOW(), NOW(), 'kjelassi', 'kjelassi', 'b2222222-2222-4222-b222-222222222222', 'Pilotage des Stocks & Produits', 'Niveaux de stocks et mouvements de marchandises.', '#f59e0b', 'PUBLISHED', 'ORGANIZATION', 12, 'NORMAL', 'M5', false, false),
    ('6f5e4d3c-2b1a-4f9e-6d0c-6b5a4f3e2d14', 0, NOW(), NOW(), 'ahaddad', 'ahaddad', 'a1111111-1111-4111-a111-111111111111', 'Activité Cabinet Dentaire & RH', 'Statistiques de consultations et honoraires praticiens.', '#8b5cf6', 'PUBLISHED', 'ORGANIZATION', 12, 'COMPACT', 'OFF', true, false)
ON CONFLICT (id) DO NOTHING;


INSERT INTO cockpit.dashboard_tag (dashboard_id, tag_value)
VALUES
    ('9f8e7d6c-5b4a-4f2e-9d0c-9b8a7f6e5d41', 'Finance'),
    ('9f8e7d6c-5b4a-4f2e-9d0c-9b8a7f6e5d41', 'Trésorerie'),
    ('8f7e6d5c-4b3a-4f1e-8d0c-8b7a6f5e4d32', 'Ventes'),
    ('7f6e5d4c-3b2a-4f0e-7d0c-7b6a5f4e3d23', 'Stock'),
    ('7f6e5d4c-3b2a-4f0e-7d0c-7b6a5f4e3d23', 'Produits'),
    ('6f5e4d3c-2b1a-4f9e-6d0c-6b5a4f3e2d14', 'Santé'),
    ('6f5e4d3c-2b1a-4f9e-6d0c-6b5a4f3e2d14', 'RH')
ON CONFLICT (dashboard_id, tag_value) DO NOTHING;


INSERT INTO cockpit.widget (id, version, created_at, updated_at, created_by, updated_by, dashboard_id, widget_type, widget_title, show_title, widget_description, query_id, grid_x, grid_y, grid_w, grid_h, refresh_interval, navigate_to_dashboard_id, kpi_format, text_content)
VALUES
    ('b3000001-0000-4000-a000-000000000001', 0, NOW(), NOW(), 'system', 'system', '9f8e7d6c-5b4a-4f2e-9d0c-9b8a7f6e5d41', 'KPI', 'Chiffre d''affaires (mois)', true, null, 'a2000001-0000-4000-a000-000000000001', 0, 0, 4, 4, 'INHERIT', null, 'AMOUNT', null),
    ('b3000002-0000-4000-a000-000000000002', 0, NOW(), NOW(), 'system', 'system', '9f8e7d6c-5b4a-4f2e-9d0c-9b8a7f6e5d41', 'KPI', 'Encours total client', true, null, 'a2000002-0000-4000-a000-000000000002', 4, 0, 4, 4, 'INHERIT', null, 'AMOUNT', null),
    ('b3000003-0000-4000-a000-000000000003', 0, NOW(), NOW(), 'system', 'system', '9f8e7d6c-5b4a-4f2e-9d0c-9b8a7f6e5d41', 'GAUGE', 'Objectif de recouvrement', true, null, 'a2000001-0000-4000-a000-000000000001', 8, 0, 4, 4, 'INHERIT', null, null, null),
    ('b3000004-0000-4000-a000-000000000004', 0, NOW(), NOW(), 'system', 'system', '9f8e7d6c-5b4a-4f2e-9d0c-9b8a7f6e5d41', 'LINE', 'Évolution du CA mensuel', true, null, 'a2000001-0000-4000-a000-000000000001', 0, 4, 12, 4, 'INHERIT', null, null, null),
    ('b3000005-0000-4000-a000-000000000005', 0, NOW(), NOW(), 'system', 'system', '9f8e7d6c-5b4a-4f2e-9d0c-9b8a7f6e5d41', 'BAR', 'Encours par client', true, null, 'a2000002-0000-4000-a000-000000000002', 0, 8, 6, 5, 'INHERIT', null, null, null),
    ('b3000006-0000-4000-a000-000000000006', 0, NOW(), NOW(), 'system', 'system', '9f8e7d6c-5b4a-4f2e-9d0c-9b8a7f6e5d41', 'DONUT', 'Répartition CA par secteur', true, null, 'a2000003-0000-4000-a000-000000000003', 6, 8, 6, 5, 'INHERIT', null, null, null),
    ('b3000007-0000-4000-a000-000000000007', 0, NOW(), NOW(), 'system', 'system', '9f8e7d6c-5b4a-4f2e-9d0c-9b8a7f6e5d41', 'DATAGRID', 'Détail des encours clients', true, null, 'a2000002-0000-4000-a000-000000000002', 0, 13, 12, 5, 'INHERIT', null, null, null),


    ('b3000008-0000-4000-a000-000000000008', 0, NOW(), NOW(), 'system', 'system', '8f7e6d5c-4b3a-4f1e-8d0c-8b7a6f5e4d32', 'KPI', 'CA cumulé annuel', true, null, 'a2000001-0000-4000-a000-000000000001', 0, 0, 3, 4, 'INHERIT', null, 'AMOUNT', null),
    ('b3000009-0000-4000-a000-000000000009', 0, NOW(), NOW(), 'system', 'system', '8f7e6d5c-4b3a-4f1e-8d0c-8b7a6f5e4d32', 'KPI', 'Volume total ventes', true, null, 'a2000003-0000-4000-a000-000000000003', 3, 0, 3, 4, 'INHERIT', null, 'INTEGER', null),
    ('b3000010-0000-4000-a000-000000000010', 0, NOW(), NOW(), 'system', 'system', '8f7e6d5c-4b3a-4f1e-8d0c-8b7a6f5e4d32', 'BAR', 'Ventes par mois', true, null, 'a2000001-0000-4000-a000-000000000001', 6, 0, 6, 4, 'INHERIT', null, null, null),
    ('b3000011-0000-4000-a000-000000000011', 0, NOW(), NOW(), 'system', 'system', '8f7e6d5c-4b3a-4f1e-8d0c-8b7a6f5e4d32', 'PIE', 'Part CA par secteur', true, null, 'a2000003-0000-4000-a000-000000000003', 0, 4, 4, 5, 'INHERIT', null, null, null),
    ('b3000012-0000-4000-a000-000000000012', 0, NOW(), NOW(), 'system', 'system', '8f7e6d5c-4b3a-4f1e-8d0c-8b7a6f5e4d32', 'STACKED', 'CA par région & entité', true, null, 'a2000007-0000-4000-a000-000000000007', 4, 4, 4, 5, 'INHERIT', null, null, null),
    ('b3000013-0000-4000-a000-000000000013', 0, NOW(), NOW(), 'system', 'system', '8f7e6d5c-4b3a-4f1e-8d0c-8b7a6f5e4d32', 'HEATMAP', 'Matrice de performance commerciale par région', true, null, 'a2000011-0000-4000-a000-000000000011', 8, 4, 4, 5, 'INHERIT', null, null, null),
    ('b3000014-0000-4000-a000-000000000014', 0, NOW(), NOW(), 'system', 'system', '8f7e6d5c-4b3a-4f1e-8d0c-8b7a6f5e4d32', 'LINE', 'Tendance mensuelle des ventes', true, null, 'a2000001-0000-4000-a000-000000000001', 0, 9, 12, 4, 'INHERIT', null, null, null),
    ('b3000015-0000-4000-a000-000000000015', 0, NOW(), NOW(), 'system', 'system', '8f7e6d5c-4b3a-4f1e-8d0c-8b7a6f5e4d32', 'DATAGRID', 'Référentiel Clients & Ventes', true, null, 'a2000002-0000-4000-a000-000000000002', 0, 13, 12, 5, 'INHERIT', null, null, null),


    ('b3000016-0000-4000-a000-000000000016', 0, NOW(), NOW(), 'system', 'system', '7f6e5d4c-3b2a-4f0e-7d0c-7b6a5f4e3d23', 'KPI', 'Stock total d''articles', true, null, 'a2000005-0000-4000-a000-000000000005', 0, 0, 3, 3, 'INHERIT', null, 'INTEGER', null),
    ('b3000017-0000-4000-a000-000000000017', 0, NOW(), NOW(), 'system', 'system', '7f6e5d4c-3b2a-4f0e-7d0c-7b6a5f4e3d23', 'KPI', 'Valeur globale du stock', true, null, 'a2000009-0000-4000-a000-000000000009', 3, 0, 3, 3, 'INHERIT', null, 'AMOUNT', null),
    ('b3000018-0000-4000-a000-000000000018', 0, NOW(), NOW(), 'system', 'system', '7f6e5d4c-3b2a-4f0e-7d0c-7b6a5f4e3d23', 'KPI', 'Articles en alerte stock', true, null, 'a2000012-0000-4000-a000-000000000012', 6, 0, 3, 3, 'INHERIT', null, 'INTEGER', null),
    ('b3000031-0000-4000-a000-000000000031', 0, NOW(), NOW(), 'system', 'system', '7f6e5d4c-3b2a-4f0e-7d0c-7b6a5f4e3d23', 'KPI', 'Taux de disponibilité', true, null, 'a2000005-0000-4000-a000-000000000005', 9, 0, 3, 3, 'INHERIT', null, 'PERCENT', null),
    ('b3000019-0000-4000-a000-000000000019', 0, NOW(), NOW(), 'system', 'system', '7f6e5d4c-3b2a-4f0e-7d0c-7b6a5f4e3d23', 'BAR', 'Niveau de stock par catégorie', true, null, 'a2000005-0000-4000-a000-000000000005', 0, 3, 6, 6, 'INHERIT', null, null, null),
    ('b3000020-0000-4000-a000-000000000020', 0, NOW(), NOW(), 'system', 'system', '7f6e5d4c-3b2a-4f0e-7d0c-7b6a5f4e3d23', 'DONUT', 'Répartition valeur stock', true, null, 'a2000009-0000-4000-a000-000000000009', 6, 3, 6, 6, 'INHERIT', null, null, null),
    ('b3000021-0000-4000-a000-000000000021', 0, NOW(), NOW(), 'system', 'system', '7f6e5d4c-3b2a-4f0e-7d0c-7b6a5f4e3d23', 'HEATMAP', 'Matrice de disponibilité des produits', true, null, 'a2000012-0000-4000-a000-000000000012', 0, 9, 6, 5, 'INHERIT', null, null, null),
    ('b3000022-0000-4000-a000-000000000022', 0, NOW(), NOW(), 'system', 'system', '7f6e5d4c-3b2a-4f0e-7d0c-7b6a5f4e3d23', 'GAUGE', 'Taux de disponibilité globale', true, null, 'a2000005-0000-4000-a000-000000000005', 6, 9, 6, 5, 'INHERIT', null, null, null),
    ('b3000023-0000-4000-a000-000000000023', 0, NOW(), NOW(), 'system', 'system', '7f6e5d4c-3b2a-4f0e-7d0c-7b6a5f4e3d23', 'LINE', 'Mouvements & Réapprovisionnement', true, null, 'a2000009-0000-4000-a000-000000000009', 0, 14, 12, 5, 'INHERIT', null, null, null),
    ('b3000024-0000-4000-a000-000000000024', 0, NOW(), NOW(), 'system', 'system', '7f6e5d4c-3b2a-4f0e-7d0c-7b6a5f4e3d23', 'DATAGRID', 'Catalogue Produits & Stocks', true, null, 'a2000012-0000-4000-a000-000000000012', 0, 19, 12, 6, 'INHERIT', null, null, null),


    ('b3000025-0000-4000-a000-000000000025', 0, NOW(), NOW(), 'system', 'system', '6f5e4d3c-2b1a-4f9e-6d0c-6b5a4f3e2d14', 'KPI', 'RDV réalisés ce mois', true, null, 'a2000010-0000-4000-a000-000000000010', 0, 0, 3, 3, 'INHERIT', null, 'INTEGER', null),
    ('b3000026-0000-4000-a000-000000000026', 0, NOW(), NOW(), 'system', 'system', '6f5e4d3c-2b1a-4f9e-6d0c-6b5a4f3e2d14', 'KPI', 'Chiffre d''affaires consultations', true, null, 'a2000004-0000-4000-a000-000000000004', 3, 0, 3, 3, 'INHERIT', null, 'AMOUNT', null),
    ('b3000032-0000-4000-a000-000000000032', 0, NOW(), NOW(), 'system', 'system', '6f5e4d3c-2b1a-4f9e-6d0c-6b5a4f3e2d14', 'KPI', 'Nouveaux patients', true, null, 'a2000010-0000-4000-a000-000000000010', 6, 0, 3, 3, 'INHERIT', null, 'INTEGER', null),
    ('b3000033-0000-4000-a000-000000000033', 0, NOW(), NOW(), 'system', 'system', '6f5e4d3c-2b1a-4f9e-6d0c-6b5a4f3e2d14', 'KPI', 'Taux d''occupation praticiens', true, null, 'a2000004-0000-4000-a000-000000000004', 9, 0, 3, 3, 'INHERIT', null, 'PERCENT', null),
    ('b3000027-0000-4000-a000-000000000027', 0, NOW(), NOW(), 'system', 'system', '6f5e4d3c-2b1a-4f9e-6d0c-6b5a4f3e2d14', 'BAR', 'Honoraires par praticien', true, null, 'a2000004-0000-4000-a000-000000000004', 0, 3, 6, 5, 'INHERIT', null, null, null),
    ('b3000028-0000-4000-a000-000000000028', 0, NOW(), NOW(), 'system', 'system', '6f5e4d3c-2b1a-4f9e-6d0c-6b5a4f3e2d14', 'PIE', 'Répartition des actes médicaux', true, null, 'a2000006-0000-4000-a000-000000000006', 6, 3, 6, 5, 'INHERIT', null, null, null),
    ('b3000029-0000-4000-a000-000000000029', 0, NOW(), NOW(), 'system', 'system', '6f5e4d3c-2b1a-4f9e-6d0c-6b5a4f3e2d14', 'HEATMAP', 'Fréquentation par praticien et acte', true, null, 'a2000004-0000-4000-a000-000000000004', 0, 8, 12, 5, 'INHERIT', null, null, null),
    ('b3000030-0000-4000-a000-000000000030', 0, NOW(), NOW(), 'system', 'system', '6f5e4d3c-2b1a-4f9e-6d0c-6b5a4f3e2d14', 'DATAGRID', 'Historique des consultations', true, null, 'a2000004-0000-4000-a000-000000000004', 0, 13, 12, 6, 'INHERIT', null, null, null)
ON CONFLICT (id) DO NOTHING;


INSERT INTO cockpit.audit_event (id, version, created_at, updated_at, created_by, updated_by, actor_user_id, event_type, target_type, target_id, details_json, source_ip, user_agent, occurred_at)
VALUES
    ('d5000001-0000-4000-a000-000000000001', 0, NOW(), NOW(), 'ahaddad', 'ahaddad', 'a1111111-1111-4111-a111-111111111111', 'Partage du tableau de bord', 'DASHBOARD', '9f8e7d6c-5b4a-4f2e-9d0c-9b8a7f6e5d41', 'Suivi de trésorerie · Organisation · Lecture', '127.0.0.1', 'Mozilla/5.0', NOW() - INTERVAL '1 DAY'),
    ('d5000002-0000-4000-a000-000000000002', 0, NOW(), NOW(), 'ahaddad', 'ahaddad', 'a1111111-1111-4111-a111-111111111111', 'Modification de requête', 'QUERY', 'a2000001-0000-4000-a000-000000000001', 'Chiffre d’affaires mensuel par client', '127.0.0.1', 'Mozilla/5.0', NOW() - INTERVAL '2 DAYS'),
    ('d5000003-0000-4000-a000-000000000003', 0, NOW(), NOW(), 'kjelassi', 'kjelassi', 'b2222222-2222-4222-b222-222222222222', 'Export de données', 'DASHBOARD', '9f8e7d6c-5b4a-4f2e-9d0c-9b8a7f6e5d41', 'Détail des encours · 5 240 enregistrements', '127.0.0.1', 'Mozilla/5.0', NOW() - INTERVAL '3 DAYS'),
    ('d5000004-0000-4000-a000-000000000004', 0, NOW(), NOW(), 'ssahnoun', 'ssahnoun', 'c3333333-3333-4333-c333-333333333333', 'Création de tableau de bord', 'DASHBOARD', '7f6e5d4c-3b2a-4f0e-7d0c-7b6a5f4e3d23', 'Pilotage des Stocks & Produits', '127.0.0.1', 'Mozilla/5.0', NOW() - INTERVAL '10 DAYS')
ON CONFLICT (id) DO NOTHING;
