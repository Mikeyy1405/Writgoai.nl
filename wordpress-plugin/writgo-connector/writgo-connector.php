<?php
/**
 * Plugin Name: Writgo Connector
 * Plugin URI: https://writgo.nl
 * Description: Verbind je WordPress site met Writgo.nl - Eenvoudig en veilig zonder technische configuratie. Ondersteunt Yoast SEO en RankMath SEO.
 * Version: 1.1.0
 * Author: Writgo
 * Author URI: https://writgo.nl
 * License: GPL v2 or later
 * Text Domain: writgo-connector
 */

if (!defined('ABSPATH')) {
    exit; // Exit if accessed directly
}

class Writgo_Connector {

    private $api_version = 'v1';
    private $option_name = 'writgo_connector_settings';

    public function __construct() {
        // Admin menu
        add_action('admin_menu', array($this, 'add_admin_menu'));
        add_action('admin_init', array($this, 'register_settings'));

        // Register custom REST API endpoints
        add_action('rest_api_init', array($this, 'register_rest_routes'));

        // Automatically whitelist Writgo IPs (if Wordfence is active)
        add_action('admin_init', array($this, 'auto_whitelist_ips'));

        // Add admin notices
        add_action('admin_notices', array($this, 'admin_notices'));

        // Webhooks for real-time sync
        add_action('save_post', array($this, 'send_webhook_on_save'), 10, 3);
        add_action('delete_post', array($this, 'send_webhook_on_delete'), 10, 1);
    }

    /**
     * Add admin menu
     */
    public function add_admin_menu() {
        add_options_page(
            'Writgo Connector',
            'Writgo',
            'manage_options',
            'writgo-connector',
            array($this, 'settings_page')
        );
    }

    /**
     * Register settings
     */
    public function register_settings() {
        register_setting('writgo_connector', $this->option_name);
    }

    /**
     * Get settings
     */
    private function get_settings() {
        $defaults = array(
            'api_key' => '',
            'webhook_url' => '',
            'webhook_secret' => '',
            'connected' => false,
            'connection_test_date' => '',
        );

        $settings = get_option($this->option_name, $defaults);
        return wp_parse_args($settings, $defaults);
    }

    /**
     * Update settings
     */
    private function update_settings($new_settings) {
        $settings = $this->get_settings();
        $updated = array_merge($settings, $new_settings);
        update_option($this->option_name, $updated);
        return $updated;
    }

    /**
     * Generate API key (one-time)
     */
    private function generate_api_key() {
        return wp_generate_password(64, false);
    }

    /**
     * Register custom REST API routes
     */
    public function register_rest_routes() {

        // Get posts
        register_rest_route('writgo/' . $this->api_version, '/posts', array(
            'methods' => 'GET',
            'callback' => array($this, 'get_posts'),
            'permission_callback' => array($this, 'verify_api_key'),
        ));

        // Get single post
        register_rest_route('writgo/' . $this->api_version, '/posts/(?P<id>\d+)', array(
            'methods' => 'GET',
            'callback' => array($this, 'get_post'),
            'permission_callback' => array($this, 'verify_api_key'),
        ));

        // Create post
        register_rest_route('writgo/' . $this->api_version, '/posts', array(
            'methods' => 'POST',
            'callback' => array($this, 'create_post'),
            'permission_callback' => array($this, 'verify_api_key'),
        ));

        // Update post
        register_rest_route('writgo/' . $this->api_version, '/posts/(?P<id>\d+)', array(
            'methods' => 'PUT',
            'callback' => array($this, 'update_post'),
            'permission_callback' => array($this, 'verify_api_key'),
        ));

        // Get categories
        register_rest_route('writgo/' . $this->api_version, '/categories', array(
            'methods' => 'GET',
            'callback' => array($this, 'get_categories'),
            'permission_callback' => array($this, 'verify_api_key'),
        ));

        // Connection test
        register_rest_route('writgo/' . $this->api_version, '/test', array(
            'methods' => 'GET',
            'callback' => array($this, 'test_connection'),
            'permission_callback' => array($this, 'verify_api_key'),
        ));

        // Health check (no auth required)
        register_rest_route('writgo/' . $this->api_version, '/health', array(
            'methods' => 'GET',
            'callback' => array($this, 'health_check'),
            'permission_callback' => '__return_true',
        ));
    }

    /**
     * Verify API key
     */
    public function verify_api_key($request) {
        $settings = $this->get_settings();

        if (empty($settings['api_key'])) {
            return new WP_Error('no_api_key', 'API key not configured', array('status' => 401));
        }

        $provided_key = $request->get_header('X-Writgo-API-Key');

        if (empty($provided_key)) {
            return new WP_Error('missing_api_key', 'X-Writgo-API-Key header required', array('status' => 401));
        }

        if (!hash_equals($settings['api_key'], $provided_key)) {
            return new WP_Error('invalid_api_key', 'Invalid API key', array('status' => 401));
        }

        return true;
    }

    /**
     * Get posts
     */
    public function get_posts($request) {
        $params = $request->get_params();

        $args = array(
            'post_type' => 'post',
            'post_status' => 'publish',
            'posts_per_page' => isset($params['per_page']) ? intval($params['per_page']) : 10,
            'paged' => isset($params['page']) ? intval($params['page']) : 1,
            'orderby' => 'date',
            'order' => 'DESC',
        );

        $query = new WP_Query($args);

        $posts = array();
        foreach ($query->posts as $post) {
            $posts[] = $this->format_post($post);
        }

        return new WP_REST_Response(array(
            'posts' => $posts,
            'total' => $query->found_posts,
            'pages' => $query->max_num_pages,
        ));
    }

    /**
     * Get single post
     */
    public function get_post($request) {
        $post_id = $request['id'];
        $post = get_post($post_id);

        if (!$post) {
            return new WP_Error('post_not_found', 'Post not found', array('status' => 404));
        }

        return new WP_REST_Response($this->format_post($post));
    }

    /**
     * Create post
     */
    public function create_post($request) {
        $params = $request->get_json_params();

        $post_data = array(
            'post_title' => sanitize_text_field($params['title'] ?? ''),
            'post_content' => wp_kses_post($params['content'] ?? ''),
            'post_excerpt' => sanitize_text_field($params['excerpt'] ?? ''),
            'post_status' => sanitize_text_field($params['status'] ?? 'draft'),
            'post_author' => get_current_user_id() ?: 1,
        );

        $post_id = wp_insert_post($post_data);

        if (is_wp_error($post_id)) {
            return $post_id;
        }

        // Set categories
        if (!empty($params['categories'])) {
            wp_set_post_categories($post_id, $params['categories']);
        }

        // Set featured image
        if (!empty($params['featured_image_url'])) {
            $this->set_featured_image_from_url($post_id, $params['featured_image_url']);
        }

        // Set SEO meta (Yoast or RankMath)
        $this->set_seo_meta($post_id, $params);

        $post = get_post($post_id);

        return new WP_REST_Response($this->format_post($post), 201);
    }

    /**
     * Update post
     */
    public function update_post($request) {
        $post_id = $request['id'];
        $params = $request->get_json_params();

        $post_data = array(
            'ID' => $post_id,
        );

        if (isset($params['title'])) {
            $post_data['post_title'] = sanitize_text_field($params['title']);
        }
        if (isset($params['content'])) {
            $post_data['post_content'] = wp_kses_post($params['content']);
        }
        if (isset($params['excerpt'])) {
            $post_data['post_excerpt'] = sanitize_text_field($params['excerpt']);
        }
        if (isset($params['status'])) {
            $post_data['post_status'] = sanitize_text_field($params['status']);
        }

        $result = wp_update_post($post_data);

        if (is_wp_error($result)) {
            return $result;
        }

        // Update categories
        if (isset($params['categories'])) {
            wp_set_post_categories($post_id, $params['categories']);
        }

        // Update featured image
        if (isset($params['featured_image_url'])) {
            $this->set_featured_image_from_url($post_id, $params['featured_image_url']);
        }

        // Update SEO meta (Yoast or RankMath)
        $this->set_seo_meta($post_id, $params);

        $post = get_post($post_id);

        return new WP_REST_Response($this->format_post($post));
    }

    /**
     * Get categories
     */
    public function get_categories($request) {
        $categories = get_categories(array(
            'hide_empty' => false,
        ));

        $formatted = array();
        foreach ($categories as $cat) {
            $formatted[] = array(
                'id' => $cat->term_id,
                'name' => $cat->name,
                'slug' => $cat->slug,
                'count' => $cat->count,
            );
        }

        return new WP_REST_Response($formatted);
    }

    /**
     * Test connection
     */
    public function test_connection($request) {
        $settings = $this->update_settings(array(
            'connected' => true,
            'connection_test_date' => current_time('mysql'),
        ));

        return new WP_REST_Response(array(
            'success' => true,
            'message' => 'Connection successful',
            'wordpress_version' => get_bloginfo('version'),
            'site_url' => get_site_url(),
            'plugin_version' => '1.1.0',
            'seo_plugin' => $this->detect_seo_plugin(),
        ));
    }

    /**
     * Health check
     */
    public function health_check($request) {
        return new WP_REST_Response(array(
            'status' => 'ok',
            'timestamp' => current_time('mysql'),
        ));
    }

    /**
     * Format post for API
     */
    private function format_post($post) {
        $formatted = array(
            'id' => $post->ID,
            'title' => $post->post_title,
            'content' => apply_filters('the_content', $post->post_content),
            'excerpt' => $post->post_excerpt,
            'status' => $post->post_status,
            'date' => $post->post_date,
            'modified' => $post->post_modified,
            'url' => get_permalink($post->ID),
            'author' => get_the_author_meta('display_name', $post->post_author),
        );

        // Featured image
        if (has_post_thumbnail($post->ID)) {
            $formatted['featured_image'] = get_the_post_thumbnail_url($post->ID, 'full');
        }

        // Categories
        $categories = get_the_category($post->ID);
        $formatted['categories'] = array();
        foreach ($categories as $cat) {
            $formatted['categories'][] = array(
                'id' => $cat->term_id,
                'name' => $cat->name,
                'slug' => $cat->slug,
            );
        }

        // SEO meta (Yoast or RankMath)
        $formatted['seo'] = $this->get_seo_meta($post->ID);
        $formatted['seo_plugin'] = $this->detect_seo_plugin();

        return $formatted;
    }

    /**
     * Detect which SEO plugin is active
     */
    private function detect_seo_plugin() {
        if (class_exists('RankMath')) {
            return 'rankmath';
        } elseif (class_exists('WPSEO_Meta')) {
            return 'yoast';
        }
        return 'none';
    }

    /**
     * Get SEO meta data (works with Yoast or RankMath)
     */
    private function get_seo_meta($post_id) {
        $seo_plugin = $this->detect_seo_plugin();

        if ($seo_plugin === 'rankmath') {
            return array(
                'title' => get_post_meta($post_id, 'rank_math_title', true),
                'description' => get_post_meta($post_id, 'rank_math_description', true),
                'focus_keyword' => get_post_meta($post_id, 'rank_math_focus_keyword', true),
                'canonical_url' => get_post_meta($post_id, 'rank_math_canonical_url', true),
            );
        } elseif ($seo_plugin === 'yoast') {
            return array(
                'title' => get_post_meta($post_id, '_yoast_wpseo_title', true),
                'description' => get_post_meta($post_id, '_yoast_wpseo_metadesc', true),
                'focus_keyword' => get_post_meta($post_id, '_yoast_wpseo_focuskw', true),
                'canonical_url' => get_post_meta($post_id, '_yoast_wpseo_canonical', true),
            );
        }

        return array(
            'title' => '',
            'description' => '',
            'focus_keyword' => '',
            'canonical_url' => '',
        );
    }

    /**
     * Set SEO meta data (works with Yoast or RankMath)
     */
    private function set_seo_meta($post_id, $params) {
        $seo_plugin = $this->detect_seo_plugin();

        if ($seo_plugin === 'rankmath') {
            // RankMath SEO
            if (!empty($params['seo_title'])) {
                update_post_meta($post_id, 'rank_math_title', sanitize_text_field($params['seo_title']));
            }
            if (!empty($params['seo_description'])) {
                update_post_meta($post_id, 'rank_math_description', sanitize_text_field($params['seo_description']));
            }
            if (!empty($params['focus_keyword'])) {
                update_post_meta($post_id, 'rank_math_focus_keyword', sanitize_text_field($params['focus_keyword']));
            }
            if (!empty($params['canonical_url'])) {
                update_post_meta($post_id, 'rank_math_canonical_url', esc_url_raw($params['canonical_url']));
            }
        } elseif ($seo_plugin === 'yoast') {
            // Yoast SEO
            if (!empty($params['seo_title'])) {
                update_post_meta($post_id, '_yoast_wpseo_title', sanitize_text_field($params['seo_title']));
            }
            if (!empty($params['seo_description'])) {
                update_post_meta($post_id, '_yoast_wpseo_metadesc', sanitize_text_field($params['seo_description']));
            }
            if (!empty($params['focus_keyword'])) {
                update_post_meta($post_id, '_yoast_wpseo_focuskw', sanitize_text_field($params['focus_keyword']));
            }
            if (!empty($params['canonical_url'])) {
                update_post_meta($post_id, '_yoast_wpseo_canonical', esc_url_raw($params['canonical_url']));
            }
        }
    }

    /**
     * Set featured image from URL
     */
    private function set_featured_image_from_url($post_id, $image_url) {
        require_once(ABSPATH . 'wp-admin/includes/media.php');
        require_once(ABSPATH . 'wp-admin/includes/file.php');
        require_once(ABSPATH . 'wp-admin/includes/image.php');

        $attachment_id = media_sideload_image($image_url, $post_id, null, 'id');

        if (!is_wp_error($attachment_id)) {
            set_post_thumbnail($post_id, $attachment_id);
        }
    }

    /**
     * Send webhook on post save
     */
    public function send_webhook_on_save($post_id, $post, $update) {
        if ($post->post_status !== 'publish') {
            return;
        }

        $settings = $this->get_settings();
        if (empty($settings['webhook_url'])) {
            return;
        }

        $data = array(
            'event' => $update ? 'post_updated' : 'post_created',
            'post' => $this->format_post($post),
            'timestamp' => current_time('mysql'),
        );

        $this->send_webhook($settings['webhook_url'], $data, $settings['webhook_secret']);
    }

    /**
     * Send webhook on post delete
     */
    public function send_webhook_on_delete($post_id) {
        $settings = $this->get_settings();
        if (empty($settings['webhook_url'])) {
            return;
        }

        $data = array(
            'event' => 'post_deleted',
            'post_id' => $post_id,
            'timestamp' => current_time('mysql'),
        );

        $this->send_webhook($settings['webhook_url'], $data, $settings['webhook_secret']);
    }

    /**
     * Send webhook
     */
    private function send_webhook($url, $data, $secret) {
        wp_remote_post($url, array(
            'body' => json_encode($data),
            'headers' => array(
                'Content-Type' => 'application/json',
                'X-Writgo-Webhook-Secret' => $secret,
            ),
            'timeout' => 30,
        ));
    }

    /**
     * Auto-whitelist Writgo IPs in Wordfence
     */
    public function auto_whitelist_ips() {
        // Check if Wordfence is active
        if (!class_exists('wfConfig')) {
            return;
        }

        $settings = $this->get_settings();

        // Only run once after connection is established
        if (!$settings['connected'] || get_option('writgo_ips_whitelisted')) {
            return;
        }

        // Writgo proxy IP (you'll update this after setting up proxy)
        $writgo_ips = array(
            '123.456.789.10', // Replace with your actual proxy IP
        );

        // Get current Wordfence whitelist
        $whitelist = wfConfig::get('whitelisted', array());

        // Add Writgo IPs
        foreach ($writgo_ips as $ip) {
            if (!in_array($ip, $whitelist)) {
                $whitelist[] = $ip;
            }
        }

        // Save updated whitelist
        wfConfig::set('whitelisted', $whitelist);

        // Mark as done
        update_option('writgo_ips_whitelisted', true);
    }

    /**
     * Admin notices
     */
    public function admin_notices() {
        $settings = $this->get_settings();

        // Show notice if not configured
        if (empty($settings['api_key'])) {
            ?>
            <div class="notice notice-warning">
                <p>
                    <strong>Writgo Connector:</strong>
                    Plugin is geïnstalleerd maar nog niet geconfigureerd.
                    <a href="<?php echo admin_url('options-general.php?page=writgo-connector'); ?>">
                        Configureer nu &rarr;
                    </a>
                </p>
            </div>
            <?php
        }
    }

    /**
     * Settings page
     */
    public function settings_page() {
        $settings = $this->get_settings();

        // Handle form submission
        if (isset($_POST['writgo_generate_key'])) {
            check_admin_referer('writgo_connector_settings');

            $new_key = $this->generate_api_key();
            $settings = $this->update_settings(array(
                'api_key' => $new_key,
            ));

            echo '<div class="notice notice-success"><p>Nieuwe API key gegenereerd!</p></div>';
        }

        if (isset($_POST['writgo_save_webhook'])) {
            check_admin_referer('writgo_connector_settings');

            $settings = $this->update_settings(array(
                'webhook_url' => sanitize_text_field($_POST['webhook_url'] ?? ''),
                'webhook_secret' => sanitize_text_field($_POST['webhook_secret'] ?? ''),
            ));

            echo '<div class="notice notice-success"><p>Webhook instellingen opgeslagen!</p></div>';
        }

        ?>
        <div class="wrap">
            <h1>Writgo Connector</h1>

            <div class="card">
                <h2>Stap 1: API Key</h2>
                <p>Kopieer deze API key naar je Writgo project instellingen.</p>

                <form method="post">
                    <?php wp_nonce_field('writgo_connector_settings'); ?>

                    <table class="form-table">
                        <tr>
                            <th>API Key</th>
                            <td>
                                <?php if (!empty($settings['api_key'])): ?>
                                    <code style="background: #f0f0f0; padding: 10px; display: block; word-break: break-all;">
                                        <?php echo esc_html($settings['api_key']); ?>
                                    </code>
                                    <p class="description">
                                        <strong>Status:</strong>
                                        <?php if ($settings['connected']): ?>
                                            <span style="color: green;">✓ Verbonden</span>
                                            (laatste test: <?php echo esc_html($settings['connection_test_date']); ?>)
                                        <?php else: ?>
                                            <span style="color: orange;">⚠ Nog niet verbonden</span>
                                        <?php endif; ?>
                                    </p>
                                <?php else: ?>
                                    <p>Nog geen API key gegenereerd.</p>
                                <?php endif; ?>
                            </td>
                        </tr>
                        <tr>
                            <th>API Endpoint</th>
                            <td>
                                <code><?php echo esc_html(rest_url('writgo/v1/')); ?></code>
                                <p class="description">Gebruik dit endpoint in Writgo</p>
                            </td>
                        </tr>
                    </table>

                    <p>
                        <button type="submit" name="writgo_generate_key" class="button button-primary">
                            <?php echo empty($settings['api_key']) ? 'Genereer API Key' : 'Genereer Nieuwe Key'; ?>
                        </button>
                    </p>
                </form>
            </div>

            <div class="card" style="margin-top: 20px;">
                <h2>Stap 2: Webhooks (Optioneel)</h2>
                <p>Voor real-time synchronisatie kan je webhooks configureren.</p>

                <form method="post">
                    <?php wp_nonce_field('writgo_connector_settings'); ?>

                    <table class="form-table">
                        <tr>
                            <th>Webhook URL</th>
                            <td>
                                <input
                                    type="url"
                                    name="webhook_url"
                                    value="<?php echo esc_attr($settings['webhook_url']); ?>"
                                    class="regular-text"
                                    placeholder="https://writgo.nl/api/webhooks/wordpress"
                                />
                            </td>
                        </tr>
                        <tr>
                            <th>Webhook Secret</th>
                            <td>
                                <input
                                    type="text"
                                    name="webhook_secret"
                                    value="<?php echo esc_attr($settings['webhook_secret']); ?>"
                                    class="regular-text"
                                    placeholder="Geheim token voor verificatie"
                                />
                            </td>
                        </tr>
                    </table>

                    <p>
                        <button type="submit" name="writgo_save_webhook" class="button">
                            Webhook Instellingen Opslaan
                        </button>
                    </p>
                </form>
            </div>

            <div class="card" style="margin-top: 20px;">
                <h2>Instructies</h2>
                <ol>
                    <li>Klik op "Genereer API Key" hierboven</li>
                    <li>Kopieer de API Key en het endpoint</li>
                    <li>Ga naar Writgo.nl → Project Instellingen</li>
                    <li>Kies "WordPress Connector Plugin" als verbindingsmethode</li>
                    <li>Plak de API Key en endpoint</li>
                    <li>Test de verbinding</li>
                </ol>

                <h3>Automatische Features</h3>
                <ul>
                    <li>✓ Automatische IP whitelisting (Wordfence)</li>
                    <li>✓ Custom API endpoints (geen REST API blocking)</li>
                    <li>✓ Real-time webhooks bij updates</li>
                    <li>✓ Veilige API key authenticatie</li>
                </ul>
            </div>
        </div>
        <?php
    }
}

// Initialize plugin
new Writgo_Connector();
