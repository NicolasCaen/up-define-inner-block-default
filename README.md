# UP Define Inner Block Default

## Description
Ce plugin permet de définir automatiquement la variation ou les classes à appliquer à un bloc inséré en fonction du parent dans lequel il est ajouté. Vous pouvez déclarer autant de règles que nécessaire via un filtre WordPress.

## Installation
1. Copiez le dossier `up-define-inner-block-default/` dans `wp-content/plugins/`.
2. Activez le plugin depuis **Extensions > Extensions installées** dans l’admin WordPress.

## Déclaration des règles
Les règles se déclarent via le filtre `up_define_inner_block_default_rules`. Chaque règle est un tableau associatif comportant au minimum le nom du bloc cible. Les clés disponibles sont:

- **`block`** *(obligatoire)* : nom complet du bloc enfant (ex: `core/button`).
- **`parent`** *(optionnel)* : nom du bloc parent direct à vérifier.
- **`parent_class` / `parent_classes`** *(optionnel)* : classe(s) exigées sur le parent (ex: `is-style-section-3`).
- **`variation`** *(optionnel)* : slug ou classe de variation à appliquer (`cta-special` donnera `is-style-cta-special`).
- **`class` / `classes`** *(optionnel)* : classe(s) supplémentaires à ajouter au bloc enfant.
- **`attributes`** *(optionnel)* : attributs supplémentaires à fusionner (ex: `['textAlign' => 'center']`).
- **`match_ancestors`** *(booléen, défaut `false`)* : si `true`, la règle teste tous les ancêtres (pas seulement le parent direct).
- **`remove_style_classes`** *(booléen, défaut `true`)* : retire les classes commençant par `is-style-` avant d’appliquer la variation.

## Exemple simple
Ajouter dans un mu-plugin ou dans `functions.php` de votre thème :

```php
<?php
add_filter( 'up_define_inner_block_default_rules', function( $rules ) {
    $rules[] = [
        'block'        => 'core/button',
        'parent'       => 'core/buttons',
        'variation'    => 'is-style-outline',
    ];
    return $rules;
});
```

## Exemple avec ancêtres et classes parent
```php
<?php
add_filter( 'up_define_inner_block_default_rules', function( $rules ) {
    $rules[] = [
        'block'            => 'core/button',
        'parent'           => 'core/group',
        'parent_class'     => 'is-style-section-3',
        'variation'        => 'is-style-outline',
        'match_ancestors'  => true,
    ];
    return $rules;
});
```

Dans cet exemple, tout bouton inséré dans un groupe ayant la classe `is-style-section-3` prendra automatiquement la variation `is-style-outline`, même si un bloc `core/buttons` se situe entre les deux.

## Exemple avec ajout de classes supplémentaires
```php
<?php
add_filter( 'up_define_inner_block_default_rules', function( $rules ) {
    $rules[] = [
        'block'        => 'core/paragraph',
        'parent'       => 'core/group',
        'parent_class' => 'is-style-highlight-wrapper',
        'classes'      => [ 'has-text-color', 'has-yellow-color' ],
    ];
    return $rules;
});
```

Ce réglage ajoute automatiquement les classes `has-text-color` et `has-yellow-color` à chaque paragraphe inséré dans un groupe stylisé avec `is-style-highlight-wrapper`.

## Exemple complet avec attributs personnalisés
```php
<?php
add_filter( 'up_define_inner_block_default_rules', function( $rules ) {
    $rules[] = [
        'block'            => 'core/heading',
        'parent'           => 'core/group',
        'parent_classes'   => [ 'is-style-section-hero', 'has-background' ],
        'variation'        => 'hero-heading',
        'addClasses'       => [ 'is-uppercase', 'has-extra-spacing' ],
        'attributes'       => [
            'textAlign' => 'center',
            'className' => [ 'has-text-color', 'has-white-color' ],
        ],
        'match_ancestors'  => true,
    ];
    return $rules;
});
```

Ici, chaque titre inséré dans la section héro reçoit la variation `is-style-hero-heading`, les classes supplémentaires `is-uppercase` et `has-extra-spacing`, ainsi que les attributs `textAlign` et `className` fournis.
