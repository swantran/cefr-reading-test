# WordPress Integration Guide

## Method 1: WordPress Plugin (Recommended) ⭐

### Installation Steps:
1. **Upload Plugin**
   ```
   1. Zip the 'wordpress-plugin' folder
   2. Go to WordPress Admin → Plugins → Add New → Upload
   3. Upload the zip file and activate
   ```

2. **Use Shortcode**
   ```
   [cefr_reading_test]
   [cefr_reading_test level="B1" theme="dark"]
   [cefr_reading_test width="800px"]
   ```

3. **Configure Settings**
   ```
   WordPress Admin → Settings → CEFR Reading Test
   - Set API endpoint
   - Choose default level
   - Configure options
   ```

### Features:
- ✅ WordPress user integration
- ✅ Save results to user profiles
- ✅ Admin settings panel
- ✅ Shortcode parameters
- ✅ Theme integration

---

## Method 2: Iframe Embed

### 1. Host Your App
```bash
# Upload your files to any hosting:
- Netlify: netlify.com (free)
- Vercel: vercel.com (free)
- Your hosting provider
```

### 2. Add to WordPress
```html
<!-- In any post/page -->
<iframe 
    src="https://your-app.netlify.app" 
    width="100%" 
    height="800px" 
    frameborder="0"
    title="CEFR Reading Test">
</iframe>
```

### 3. Responsive Iframe
```html
<div style="position: relative; padding-bottom: 56.25%; height: 0; overflow: hidden;">
    <iframe 
        src="https://your-app.netlify.app" 
        style="position: absolute; top: 0; left: 0; width: 100%; height: 100%;"
        frameborder="0"
        title="CEFR Reading Test">
    </iframe>
</div>
```

---

## Method 3: Direct File Upload

### 1. Upload Files via FTP/cPanel
```
/wp-content/uploads/cefr-reading-test/
├── index.html
├── sw.js
└── src/
    ├── css/
    └── js/
```

### 2. Create WordPress Page
```html
<!-- Custom HTML block -->
<div id="cefr-container">
    <iframe 
        src="/wp-content/uploads/cefr-reading-test/index.html"
        width="100%" 
        height="800px"
        frameborder="0">
    </iframe>
</div>
```

---

## Method 4: Custom Page Template

### 1. Create Custom Template
```php
<?php
/*
Template Name: CEFR Reading Test
*/

get_header(); ?>

<div class="container">
    <div class="content-area">
        <?php
        // Include your HTML directly
        include(get_template_directory() . '/cefr-reading-test/index.html');
        ?>
    </div>
</div>

<?php get_footer(); ?>
```

### 2. Enqueue Scripts in functions.php
```php
function enqueue_cefr_scripts() {
    if (is_page_template('page-cefr-test.php')) {
        wp_enqueue_style('cefr-styles', get_template_directory_uri() . '/cefr-reading-test/src/css/styles.css');
        wp_enqueue_script('cefr-app', get_template_directory_uri() . '/cefr-reading-test/src/js/app.js', array(), '1.0', true);
    }
}
add_action('wp_enqueue_scripts', 'enqueue_cefr_scripts');
```

---

## Method 5: Gutenberg Block (Advanced)

### 1. Create Custom Block
```javascript
// cefr-block.js
const { registerBlockType } = wp.blocks;
const { InspectorControls } = wp.blockEditor;
const { PanelBody, SelectControl } = wp.components;

registerBlockType('custom/cefr-reading-test', {
    title: 'CEFR Reading Test',
    icon: 'microphone',
    category: 'embed',
    attributes: {
        level: {
            type: 'string',
            default: 'A1'
        }
    },
    edit: ({ attributes, setAttributes }) => {
        return (
            <>
                <InspectorControls>
                    <PanelBody title="Settings">
                        <SelectControl
                            label="CEFR Level"
                            value={attributes.level}
                            options={[
                                { label: 'A1', value: 'A1' },
                                { label: 'A2', value: 'A2' },
                                { label: 'B1', value: 'B1' },
                                { label: 'B2', value: 'B2' },
                                { label: 'C1', value: 'C1' },
                                { label: 'C2', value: 'C2' }
                            ]}
                            onChange={(level) => setAttributes({ level })}
                        />
                    </PanelBody>
                </InspectorControls>
                <div className="cefr-reading-test-block">
                    <p>CEFR Reading Test - Level: {attributes.level}</p>
                    <p>🎤 Pronunciation assessment will appear here on frontend</p>
                </div>
            </>
        );
    },
    save: ({ attributes }) => {
        return (
            <div className="cefr-reading-test" data-level={attributes.level}>
                [cefr_reading_test level="{attributes.level}"]
            </div>
        );
    }
});
```

---

## WordPress-Specific Features

### User Integration
```javascript
// In your app.js, detect WordPress user
if (window.cefrWP && window.cefrWP.isLoggedIn) {
    // Save results to WordPress user meta
    this.saveToWordPress(result);
}

async saveToWordPress(result) {
    const formData = new FormData();
    formData.append('action', 'save_cefr_result');
    formData.append('nonce', window.cefrWP.nonce);
    formData.append('result_data', JSON.stringify(result));
    
    try {
        const response = await fetch(window.cefrWP.ajaxUrl, {
            method: 'POST',
            body: formData
        });
        const data = await response.json();
        console.log('Saved to WordPress:', data);
    } catch (error) {
        console.error('WordPress save failed:', error);
    }
}
```

### Theme Integration
```css
/* Add to your theme's style.css */
.cefr-reading-test {
    background: var(--wp-theme-color, #ffffff);
    color: var(--wp-text-color, #333333);
    font-family: var(--wp-font-family, sans-serif);
}

/* Match WordPress button styles */
.cefr-reading-test .btn {
    background: var(--wp-primary-color, #0073aa);
}
```

---

## Quick Start (5 Minutes)

### Option A: Plugin Method
1. Download plugin folder
2. Zip it up
3. Upload to WordPress
4. Add `[cefr_reading_test]` to any page

### Option B: Iframe Method
1. Upload files to Netlify (drag & drop)
2. Get the URL (e.g., `https://abc123.netlify.app`)
3. Add iframe to WordPress page
4. Done!

---

## Troubleshooting

### Common Issues:
1. **Audio not working**: Ensure HTTPS (required for microphone)
2. **Scripts not loading**: Check file paths and permissions
3. **Styling conflicts**: Add CSS specificity or use iframe
4. **Mobile issues**: Test responsive design on actual devices

### WordPress-Specific:
1. **Plugin conflicts**: Deactivate other audio/media plugins temporarily
2. **Theme conflicts**: Test with default WordPress theme
3. **Caching issues**: Clear WordPress cache after updates
4. **Security plugins**: Whitelist audio permissions

---

## Recommended Approach

**For most users**: Use the **Plugin method** - it's the most integrated and user-friendly option.

**For advanced users**: Custom page template gives you full control.

**For quick testing**: Iframe embed is fastest to implement.