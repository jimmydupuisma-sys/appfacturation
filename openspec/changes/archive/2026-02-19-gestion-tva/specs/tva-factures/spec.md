## ADDED Requirements

### Requirement: Affichage TVA dans le total de la modale facture
Le système SHALL afficher Total HT / TVA / Total TTC dans la modale de création/édition de facture quand `tva_active` est true.

#### Scenario: Totaux avec TVA active
- **WHEN** `tva_active` est true et la facture a des lignes
- **THEN** la modale affiche "Total HT", "TVA (X%)" et "Total TTC"

#### Scenario: Total simple sans TVA
- **WHEN** `tva_active` est false
- **THEN** la modale affiche uniquement "Total" comme aujourd'hui

### Requirement: PDF facture avec TVA
Le système SHALL générer un PDF avec les montants HT, TVA et TTC quand `tva_active` est true, et supprimer la mention "TVA non applicable, art. 293 B du CGI".

#### Scenario: PDF avec TVA active
- **WHEN** `tva_active` est true et on génère le PDF d'une facture
- **THEN** le PDF affiche "Total HT", "TVA (X%)", "Total TTC" et n'affiche PAS la mention 293B

#### Scenario: PDF sans TVA
- **WHEN** `tva_active` est false
- **THEN** le PDF affiche "TOTAL HT" et la mention "TVA non applicable, art. 293 B du CGI" comme aujourd'hui
