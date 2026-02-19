## ADDED Requirements

### Requirement: Sélection du thème couleur
Le système SHALL permettre à l'utilisateur de choisir parmi 5 thèmes de couleur prédéfinis : Sky (défaut), Violet, Emerald, Rose, Amber. Le thème sélectionné SHALL être persisté en localStorage et appliqué immédiatement sans rechargement de page.

#### Scenario: Application du thème au démarrage
- **WHEN** l'application démarre
- **THEN** le thème stocké en localStorage est appliqué avant le premier rendu visible

#### Scenario: Changement de thème
- **WHEN** l'utilisateur sélectionne un thème différent
- **THEN** la couleur d'accent de toute l'interface change immédiatement
- **THEN** le nouveau thème est sauvegardé en localStorage

#### Scenario: Thème par défaut
- **WHEN** aucun thème n'est stocké en localStorage
- **THEN** le thème Sky est appliqué

### Requirement: Sélection de la police
Le système SHALL permettre à l'utilisateur de choisir parmi 10 polices : Inter, Poppins, DM Sans, Nunito, Raleway, IBM Plex Sans, Lora (défaut), Playfair Display, Merriweather, Source Serif 4. La police sélectionnée SHALL être chargée dynamiquement depuis Google Fonts et appliquée à l'interface entière sans rechargement.

#### Scenario: Chargement dynamique de la police
- **WHEN** l'utilisateur sélectionne une police non encore chargée
- **THEN** la feuille de style Google Fonts correspondante est injectée dans le DOM
- **THEN** la police est appliquée à `body` via la CSS variable `--font-body`

#### Scenario: Police par défaut
- **WHEN** aucune police n'est stockée en localStorage
- **THEN** la police Lora est utilisée (comportement actuel préservé)

#### Scenario: Fallback police hors ligne
- **WHEN** Google Fonts n'est pas accessible (ex. sans connexion)
- **THEN** la police de fallback définie (`Georgia, serif` ou `sans-serif`) est utilisée sans erreur visible

### Requirement: Persistance des préférences d'apparence
Le système SHALL stocker le thème couleur et la police dans localStorage sous les clés `theme` et `font`. Ces préférences SHALL être indépendantes du mode sombre/clair.

#### Scenario: Persistance entre sessions
- **WHEN** l'utilisateur ferme et rouvre l'application
- **THEN** son thème couleur et sa police sont restaurés à l'identique
