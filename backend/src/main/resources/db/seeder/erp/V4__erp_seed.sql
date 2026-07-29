

INSERT INTO public.erp_client (id_client, raison_sociale, secteur, chiffre_affaires, encours, region, statut)
VALUES
    ('CL-001', 'STE Medina',       'Commerce',  428000, 42800, 'Tunis',    'Actif'),
    ('CL-002', 'Groupe Sahel',     'Services',  382000, 38200, 'Sousse',   'Actif'),
    ('CL-003', 'Nabeul Trade',     'Industrie', 295000, 29500, 'Nabeul',   'Actif'),
    ('CL-004', 'Sfax Import',      'BTP',       241000, 24100, 'Sfax',     'Actif'),
    ('CL-005', 'Djerba Co',        'Commerce',  187000, 18700, 'Médenine', 'Inactif'),
    ('CL-006', 'Bizerte Logix',    'Services',  310000, 31000, 'Bizerte',  'Actif'),
    ('CL-007', 'Kairouan Agro',    'Industrie', 150000, 15000, 'Kairouan', 'Actif'),
    ('CL-008', 'Gafsa Mining Co',  'Industrie', 520000, 52000, 'Gafsa',    'Actif')
ON CONFLICT (id_client) DO NOTHING;

INSERT INTO public.erp_facture (num_facture, id_client, client, date_facture, montant_ttc, montant_ht, statut, mois)
VALUES
    ('FAC-2601',  'CL-001', 'STE Medina',       '2026-01-15', 182000, 152941, 'Validée',    'Jan'),
    ('FAC-2602',  'CL-002', 'Groupe Sahel',     '2026-02-12', 154000, 129412, 'Validée',    'Fév'),
    ('FAC-2602b', 'CL-002', 'Groupe Sahel',     '2026-02-12', 110000, 92436,  'Validée',    'Fév'),
    ('FAC-2603',  'CL-003', 'Nabeul Trade',     '2026-03-18', 201000, 168908, 'Validée',    'Mar'),
    ('FAC-2603b', 'CL-003', 'Nabeul Trade',     '2026-03-18', 50000,  42016,  'Validée',    'Mar'),
    ('FAC-2603c', 'CL-003', 'Nabeul Trade',     '2026-03-18', 75000,  63025,  'Validée',    'Mar'),
    ('FAC-2604',  'CL-004', 'Sfax Import',      '2026-04-08', 176000, 147899, 'En attente', 'Avr'),
    ('FAC-2605',  'CL-001', 'STE Medina',       '2026-05-20', 223000, 187395, 'Validée',    'Mai'),
    ('FAC-2605b', 'CL-001', 'STE Medina',       '2026-05-20', 105000, 88235,  'Validée',    'Mai'),
    ('FAC-2606',  'CL-002', 'Groupe Sahel',     '2026-06-16', 245000, 205882, 'Validée',    'Juin'),
    ('FAC-2607',  'CL-005', 'Djerba Co',        '2026-07-04', 198000, 166387, 'Validée',    'Juil'),
    ('FAC-2607b', 'CL-005', 'Djerba Co',        '2026-07-04', 50000,  42016,  'Validée',    'Juil'),
    ('FAC-2607c', 'CL-005', 'Djerba Co',        '2026-07-04', 90000,  75630,  'Validée',    'Juil'),
    ('FAC-2608',  'CL-003', 'Nabeul Trade',     '2026-08-10', 120000, 100840, 'Validée',    'Aoû'),
    ('FAC-2609',  'CL-004', 'Sfax Import',      '2026-09-01', 85000,  71428,  'Validée',    'Sep'),
    ('FAC-2609b', 'CL-004', 'Sfax Import',      '2026-09-01', 60000,  50420,  'Validée',    'Sep'),
    ('FAC-2610',  'CL-006', 'Bizerte Logix',    '2026-07-15', 140000, 117647, 'Validée',    'Juil'),
    ('FAC-2611',  'CL-007', 'Kairouan Agro',    '2026-07-18', 95000,  79831,  'En attente', 'Juil'),
    ('FAC-2612',  'CL-008', 'Gafsa Mining Co',  '2026-07-22', 310000, 260504, 'Validée',    'Juil')
ON CONFLICT (num_facture) DO NOTHING;

INSERT INTO public.erp_paiement (num_paiement, num_facture, id_client, date_paiement, montant_paye, mode_paiement, mois)
VALUES
    ('PAY-801', 'FAC-2601', 'CL-001', '2026-01-28', 150000, 'Virement', 'Jan'),
    ('PAY-802', 'FAC-2602', 'CL-002', '2026-02-22', 154000, 'Chèque',   'Fév'),
    ('PAY-803', 'FAC-2603', 'CL-003', '2026-03-30', 120000, 'Virement', 'Mar'),
    ('PAY-804', 'FAC-2605', 'CL-001', '2026-06-01', 223000, 'Espèces',  'Juin'),
    ('PAY-805', 'FAC-2606', 'CL-002', '2026-06-29', 190000, 'Virement', 'Juin'),
    ('PAY-806', 'FAC-2607', 'CL-005', '2026-07-15', 198000, 'Chèque',   'Juil'),
    ('PAY-807', 'FAC-2604', 'CL-004', '2026-07-20', 176000, 'Virement', 'Juil'),
    ('PAY-808', 'FAC-2610', 'CL-006', '2026-07-25', 140000, 'Virement', 'Juil'),
    ('PAY-809', 'FAC-2612', 'CL-008', '2026-07-26', 310000, 'Virement', 'Juil')
ON CONFLICT (num_paiement) DO NOTHING;

INSERT INTO public.erp_rendez_vous (id_rdv, praticien, date_rdv, acte, montant, statut)
VALUES
    ('RDV-101', 'Dr. Ben Ali',  '2026-07-10', 'Implantologie', 62000, 'Réalisé'),
    ('RDV-102', 'Dr. Trabelsi', '2026-07-11', 'Orthodontie',   48500, 'Réalisé'),
    ('RDV-103', 'Dr. Gharbi',   '2026-07-12', 'Prothèse',      41200, 'Réalisé'),
    ('RDV-104', 'Dr. Mansour',  '2026-07-13', 'Consultation',  33800, 'Confirmé'),
    ('RDV-105', 'Dr. Ben Ali',  '2026-07-14', 'Implantologie', 55000, 'Réalisé'),
    ('RDV-106', 'Dr. Trabelsi', '2026-07-15', 'Orthodontie',   42000, 'Confirmé'),
    ('RDV-107', 'Dr. Gharbi',   '2026-07-16', 'Detartrage',    18000, 'Réalisé'),
    ('RDV-108', 'Dr. Mansour',  '2026-07-17', 'Orthodontie',   51000, 'Réalisé'),
    ('RDV-109', 'Dr. Ben Ali',  '2026-07-18', 'Consultation',  36000, 'Réalisé')
ON CONFLICT (id_rdv) DO NOTHING;

INSERT INTO public.erp_produit (id_produit, designation, categorie, prix_unitaire, stock_actuel, stock_min, statut)
VALUES
    ('PRD-001', 'NVIDIA RTX 4090 24GB',       'Cartes Graphiques', 5800, 12,  4, 'Disponible'),
    ('PRD-002', 'NVIDIA RTX 4080 Super',     'Cartes Graphiques', 3900, 8,   3, 'Disponible'),
    ('PRD-003', 'AMD Radeon RX 7900 XTX',    'Cartes Graphiques', 3200, 3,   5, 'Stock faible'),
    ('PRD-004', 'Intel Core i9-14900K',      'Processeurs',       2100, 45, 10, 'Disponible'),
    ('PRD-005', 'Samsung 990 PRO 2TB SSD',   'Stockage SSD',      650, 120, 15, 'Disponible'),
    ('PRD-006', 'Corsair Vengeance DDR5',    'Mémoire RAM',       480,  85, 20, 'Disponible'),
    ('PRD-007', 'ASUS ROG Swift 32 4K OLED', 'Écrans Gaming',     4200, 6,   2, 'Disponible'),
    ('PRD-008', 'AMD Ryzen 9 7950X',         'Processeurs',       1950, 22,  5, 'Disponible'),
    ('PRD-009', 'Kingston Fury 64GB DDR5',   'Mémoire RAM',       780,  18,  5, 'Disponible')
ON CONFLICT (id_produit) DO NOTHING;
