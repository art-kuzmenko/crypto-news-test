<?php
/**
 * Plugin Name: Crypto Price Ticker
 * Description: Displays a cryptocurrency price ticker using the WordPress Interactivity API, fetching from a custom API.
 * Version: 1.0.0
 * Author: Artem Kuzmenko
 * License: GPL2
 */

if (!defined('ABSPATH')) {
    exit;
}

class Crypto_Price_Ticker_Plugin {
    const OPTION_API_BASE = 'cpt_api_base_url';

    public function __construct() {
        add_action('init', [$this, 'register_assets']);
        add_action('admin_init', [$this, 'register_settings']);
        add_action('admin_menu', [$this, 'register_settings_page']);

        add_shortcode('crypto_price_ticker', [$this, 'render_shortcode']);
        add_action('wp_footer', [$this, 'render_footer_ticker']);
    }

    public function register_assets() {
        $handle = 'crypto-price-ticker-js';
        $src = plugins_url('assets/ticker.js', __FILE__);
        wp_register_script($handle, $src, [], '1.0.0', true);
    }

    public function register_settings() {
        register_setting('reading', self::OPTION_API_BASE, [
            'type' => 'string',
            'sanitize_callback' => 'esc_url_raw',
            'default' => 'http://localhost:3000'
        ]);

        add_settings_field(
            self::OPTION_API_BASE,
            __('Crypto API Base URL', 'crypto-price-ticker'),
            function () {
                $value = esc_attr(get_option(self::OPTION_API_BASE, 'http://localhost:3000'));
                echo '<input type="url" style="width: 400px" name="' . esc_attr(self::OPTION_API_BASE) . '" value="' . $value . '" placeholder="http://localhost:3000" />';
                echo '<p class="description">' . esc_html__('Base URL of the Cryptocurrency Price API (without trailing slash).', 'crypto-price-ticker') . '</p>';
            },
            'reading'
        );
    }

    public function register_settings_page() {
        // We reuse the Reading settings section by adding a field there (above)
    }

    private function enqueue() {
        wp_enqueue_script('crypto-price-ticker-js');
    }

    private function render_markup($coin_id, $show_label = true) {
        $coin_id = sanitize_text_field($coin_id ?: 'bitcoin');
        $api_base = esc_url_raw(get_option(self::OPTION_API_BASE, 'http://localhost:3000'));

        $context = [
            'id' => $coin_id,
            'apiBase' => rtrim($api_base, '/')
        ];

        $this->enqueue();

        ob_start();
        ?>
        <div data-wp-interactive="cryptoTicker" data-wp-context='<?php echo wp_json_encode($context); ?>' class="cpt-ticker" style="display:inline-flex;gap:.5rem;align-items:center;">
            <?php if ($show_label) : ?>
                <span data-wp-text="state.label">Loading...</span>
            <?php endif; ?>
            <strong data-wp-text="state.formattedPrice">$0.00</strong>
        </div>
        <?php
        return ob_get_clean();
    }

    public function render_shortcode($atts) {
        $atts = shortcode_atts([
            'id' => 'bitcoin'
        ], $atts, 'crypto_price_ticker');

        return $this->render_markup($atts['id'], true);
    }

    public function render_footer_ticker() {
        // Example: always show Bitcoin ticker in footer; themes can remove this action if undesired
        echo $this->render_markup('bitcoin', true);
    }
}

new Crypto_Price_Ticker_Plugin();