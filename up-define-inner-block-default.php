<?php
/**
 * Plugin Name: UP Define Inner Block Default
 * Description: Définit automatiquement les variations ou classes d'un bloc inséré selon son parent via des filtres.
 * Version: 0.1.0
 * Author: GEHIN Nicolas
 */

if (!defined('ABSPATH')) {
    exit;
}

class Up_Define_Inner_Block_Default {
    const FILTER_RULES = 'up_define_inner_block_default_rules';
    const SCRIPT_HANDLE = 'up-define-inner-block-default-editor';

    public function __construct() {
        add_action('enqueue_block_editor_assets', [$this, 'enqueue_editor_assets']);
    }

    public function enqueue_editor_assets() {
        $handle = self::SCRIPT_HANDLE;
        $src = plugins_url('assets/editor.js', __FILE__);
        $deps = ['wp-data', 'wp-block-editor', 'wp-element'];
        $version = file_exists(__DIR__ . '/assets/editor.js') ? filemtime(__DIR__ . '/assets/editor.js') : false;
        wp_enqueue_script($handle, $src, $deps, $version, true);
        $rules = $this->get_rules();
        wp_localize_script($handle, 'UPDefineInnerDefaultsData', [
            'rules' => $rules,
        ]);
    }

    protected function get_rules() {
        $raw = apply_filters(self::FILTER_RULES, []);
        if (!is_array($raw)) {
            return [];
        }
        $rules = [];
        foreach ($raw as $rule) {
            if (!is_array($rule)) {
                continue;
            }
            $blockName = isset($rule['block']) ? sanitize_text_field($rule['block']) : '';
            if (!$blockName) {
                continue;
            }
            $parentBlock = isset($rule['parent']) ? sanitize_text_field($rule['parent']) : '';
            $parentClasses = $this->normalize_classes($rule['parent_class'] ?? $rule['parent_classes'] ?? null);
            $variationClass = $this->normalize_variation($rule['variation'] ?? '');
            $extraClasses = $this->normalize_classes($rule['class'] ?? $rule['classes'] ?? null);
            $attributes = $this->normalize_attributes($rule['attributes'] ?? null);
            $matchAncestors = !empty($rule['match_ancestors']);
            $removeStyleClasses = array_key_exists('remove_style_classes', $rule) ? (bool) $rule['remove_style_classes'] : true;

            $rules[] = [
                'blockName' => $blockName,
                'parentBlock' => $parentBlock ?: null,
                'parentClasses' => $parentClasses,
                'variationClass' => $variationClass,
                'addClasses' => $extraClasses,
                'attributes' => $attributes,
                'matchAncestors' => $matchAncestors,
                'removeStyleClasses' => $removeStyleClasses,
            ];
        }
        return $rules;
    }

    protected function normalize_classes($classes) {
        $list = [];
        if (is_array($classes)) {
            foreach ($classes as $class) {
                if (!is_string($class)) {
                    continue;
                }
                $sanitized = sanitize_html_class($class);
                if ($sanitized) {
                    $list[] = $sanitized;
                }
            }
        } elseif (is_string($classes)) {
            $parts = preg_split('/\s+/', trim($classes));
            if (is_array($parts)) {
                foreach ($parts as $part) {
                    $sanitized = sanitize_html_class($part);
                    if ($sanitized) {
                        $list[] = $sanitized;
                    }
                }
            }
        }
        return array_values(array_unique($list));
    }

    protected function normalize_variation($variation) {
        if (!is_string($variation)) {
            return '';
        }
        $variation = trim($variation);
        if ($variation === '') {
            return '';
        }
        if (strpos($variation, 'is-style-') === 0) {
            $class = sanitize_html_class($variation);
            return $class ?: '';
        }
        $slug = sanitize_title($variation);
        if ($slug === '') {
            return '';
        }
        $class = 'is-style-' . $slug;
        return sanitize_html_class($class) ?: '';
    }

    protected function normalize_attributes($attributes) {
        if (!is_array($attributes)) {
            return [];
        }
        $normalized = [];
        foreach ($attributes as $key => $value) {
            if (!is_string($key)) {
                continue;
            }
            $attrKey = sanitize_key($key);
            if ($attrKey === '') {
                continue;
            }
            if ($attrKey === 'className') {
                $classString = implode(' ', $this->normalize_classes($value));
                $normalized[$attrKey] = $classString;
                continue;
            }
            if (is_bool($value) || is_null($value)) {
                $normalized[$attrKey] = $value;
                continue;
            }
            if (is_int($value) || is_float($value)) {
                $normalized[$attrKey] = $value;
                continue;
            }
            if (is_string($value)) {
                $normalized[$attrKey] = sanitize_text_field($value);
            }
        }
        return $normalized;
    }
}

new Up_Define_Inner_Block_Default();
