<?php
/**
 * Plugin Name: CEFR Reading Test
 * Plugin URI: https://your-domain.com
 * Description: AI-powered pronunciation assessment tool with CEFR-aligned reading exercises
 * Version: 2.0.0
 * Author: Your Name
 * License: MIT
 */

// Prevent direct access
if (!defined('ABSPATH')) {
    exit;
}

class CEFRReadingTestPlugin {
    
    public function __construct() {
        add_action('init', array($this, 'init'));
        add_shortcode('cefr_reading_test', array($this, 'render_shortcode'));
        add_action('wp_enqueue_scripts', array($this, 'enqueue_scripts'));
        add_action('wp_head', array($this, 'add_meta_tags'));
    }
    
    public function init() {
        // Initialize plugin
    }
    
    public function enqueue_scripts() {
        // Only load on pages that use the shortcode
        global $post;
        if (is_a($post, 'WP_Post') && has_shortcode($post->post_content, 'cefr_reading_test')) {
            
            $plugin_url = plugin_dir_url(__FILE__);
            
            // Enqueue CSS
            wp_enqueue_style(
                'cefr-reading-test-styles',
                $plugin_url . 'assets/styles.css',
                array(),
                '2.0.0'
            );
            
            // Enqueue JavaScript modules
            wp_enqueue_script(
                'cefr-reading-test-app',
                $plugin_url . 'assets/app.js',
                array(),
                '2.0.0',
                true
            );
            
            // Add module type attribute
            add_filter('script_loader_tag', array($this, 'add_module_attribute'), 10, 3);
            
            // Localize script for WordPress integration
            wp_localize_script('cefr-reading-test-app', 'cefrWP', array(
                'ajaxUrl' => admin_url('admin-ajax.php'),
                'nonce' => wp_create_nonce('cefr_nonce'),
                'isLoggedIn' => is_user_logged_in(),
                'userId' => get_current_user_id()
            ));
        }
    }
    
    public function add_module_attribute($tag, $handle, $src) {
        if ('cefr-reading-test-app' === $handle) {
            $tag = '<script type="module" src="' . esc_url($src) . '" id="' . $handle . '-js"></script>';
        }
        return $tag;
    }
    
    public function add_meta_tags() {
        global $post;
        if (is_a($post, 'WP_Post') && has_shortcode($post->post_content, 'cefr_reading_test')) {
            echo '<meta name="cefr-reading-test" content="active">' . "\n";
        }
    }
    
    public function render_shortcode($atts) {
        $atts = shortcode_atts(array(
            'level' => 'A1',
            'theme' => 'light',
            'width' => '100%',
            'height' => 'auto'
        ), $atts, 'cefr_reading_test');
        
        ob_start();
        ?>
        <div id="cefr-reading-test-container" 
             data-level="<?php echo esc_attr($atts['level']); ?>"
             data-theme="<?php echo esc_attr($atts['theme']); ?>"
             style="width: <?php echo esc_attr($atts['width']); ?>; height: <?php echo esc_attr($atts['height']); ?>;">
            
            <!-- WordPress-specific loading message -->
            <div id="cefr-loading" style="text-align: center; padding: 2rem;">
                <p>Loading CEFR Reading Test...</p>
                <div style="width: 40px; height: 40px; border: 4px solid #f3f3f3; border-top: 4px solid #3498db; border-radius: 50%; animation: spin 1s linear infinite; margin: 0 auto;"></div>
            </div>
            
            <!-- Main app container -->
            <div class="container">
                <!-- Skip to main content for screen readers -->
                <a href="#main-content" class="sr-only">Skip to main content</a>
                
                <div class="container">
                    <!-- Header -->
                    <header class="header">
                        <h1>CEFR Reading Test</h1>
                        <p>Improve your English pronunciation with AI-powered feedback</p>
                        
                        <!-- Theme toggle and settings -->
                        <div style="margin-top: 1rem;">
                            <button id="themeToggle" class="btn btn-secondary" aria-label="Toggle dark mode">
                                <span id="themeIcon">🌙</span>
                            </button>
                            <button id="settingsBtn" class="btn btn-secondary" aria-label="Open settings">
                                <span>⚙️</span>
                            </button>
                        </div>
                    </header>

                    <!-- Main content -->
                    <main id="main-content">
                        <!-- Level selector -->
                        <section class="level-selector" id="levelSelector" aria-labelledby="level-heading">
                            <h2 id="level-heading" class="sr-only">Choose Your CEFR Level</h2>
                            <!-- Content will be populated by JavaScript -->
                        </section>

                        <!-- Test area -->
                        <section class="test-area" id="testArea" aria-labelledby="test-heading">
                            <h2 id="test-heading" class="sr-only">Pronunciation Test</h2>
                            <!-- Content will be populated by JavaScript -->
                        </section>

                        <!-- Results -->
                        <section class="results" id="results" aria-labelledby="results-heading" role="region" aria-live="polite">
                            <h2 id="results-heading" class="sr-only">Test Results</h2>
                            <!-- Content will be populated by JavaScript -->
                        </section>

                        <!-- History and progress -->
                        <section class="history-section" id="historySection" aria-labelledby="history-heading">
                            <h2 id="history-heading">Your Progress</h2>
                            <!-- Content will be populated by JavaScript -->
                        </section>
                    </main>
                </div>
            </div>
        </div>
        
        <style>
        @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
        }
        </style>
        <?php
        return ob_get_clean();
    }
}

// Initialize plugin
new CEFRReadingTestPlugin();

// AJAX handlers for WordPress integration
add_action('wp_ajax_save_cefr_result', 'save_cefr_result');
add_action('wp_ajax_nopriv_save_cefr_result', 'save_cefr_result');

function save_cefr_result() {
    check_ajax_referer('cefr_nonce', 'nonce');
    
    $user_id = get_current_user_id();
    $result_data = sanitize_textarea_field($_POST['result_data']);
    
    if ($user_id && $result_data) {
        // Save to WordPress user meta
        $existing_results = get_user_meta($user_id, 'cefr_test_results', true) ?: array();
        $existing_results[] = json_decode($result_data, true);
        
        // Keep only last 50 results
        if (count($existing_results) > 50) {
            $existing_results = array_slice($existing_results, -50);
        }
        
        update_user_meta($user_id, 'cefr_test_results', $existing_results);
        
        wp_send_json_success(array('message' => 'Result saved successfully'));
    } else {
        wp_send_json_error(array('message' => 'Failed to save result'));
    }
}

// Add admin menu
add_action('admin_menu', 'cefr_admin_menu');

function cefr_admin_menu() {
    add_options_page(
        'CEFR Reading Test Settings',
        'CEFR Reading Test',
        'manage_options',
        'cefr-reading-test',
        'cefr_admin_page'
    );
}

function cefr_admin_page() {
    if (isset($_POST['submit'])) {
        update_option('cefr_api_endpoint', sanitize_url($_POST['api_endpoint']));
        update_option('cefr_default_level', sanitize_text_field($_POST['default_level']));
        echo '<div class="notice notice-success"><p>Settings saved!</p></div>';
    }
    
    $api_endpoint = get_option('cefr_api_endpoint', 'https://cefr-speech-backend.herokuapp.com');
    $default_level = get_option('cefr_default_level', 'A1');
    ?>
    <div class="wrap">
        <h1>CEFR Reading Test Settings</h1>
        
        <form method="post" action="">
            <table class="form-table">
                <tr>
                    <th scope="row">API Endpoint</th>
                    <td>
                        <input type="url" name="api_endpoint" value="<?php echo esc_attr($api_endpoint); ?>" class="regular-text" />
                        <p class="description">Speech analysis API endpoint (leave default for offline mode)</p>
                    </td>
                </tr>
                <tr>
                    <th scope="row">Default Level</th>
                    <td>
                        <select name="default_level">
                            <?php foreach(['A1', 'A2', 'B1', 'B2', 'C1', 'C2'] as $level): ?>
                                <option value="<?php echo $level; ?>" <?php selected($default_level, $level); ?>>
                                    <?php echo $level; ?>
                                </option>
                            <?php endforeach; ?>
                        </select>
                    </td>
                </tr>
            </table>
            
            <?php submit_button(); ?>
        </form>
        
        <h2>Usage</h2>
        <p>Use the shortcode <code>[cefr_reading_test]</code> to embed the test in any post or page.</p>
        
        <h3>Shortcode Parameters:</h3>
        <ul>
            <li><code>level</code> - Starting CEFR level (A1, A2, B1, B2, C1, C2)</li>
            <li><code>theme</code> - Theme (light, dark)</li>
            <li><code>width</code> - Container width (default: 100%)</li>
            <li><code>height</code> - Container height (default: auto)</li>
        </ul>
        
        <h3>Examples:</h3>
        <code>[cefr_reading_test level="B1" theme="dark"]</code><br>
        <code>[cefr_reading_test width="800px" height="600px"]</code>
    </div>
    <?php
}