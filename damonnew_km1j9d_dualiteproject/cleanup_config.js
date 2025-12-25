const fs = require('fs');
const target = 'damon_service_-_pricing_&_project_management_kkc6qh_dualiteproject/netlify.toml';
try {
    if (fs.existsSync(target)) {
        fs.unlinkSync(target);
        console.log('Removed old netlify.toml from subdirectory');
    }
} catch (err) {
    console.error('Error removing file:', err);
}
try {
    fs.unlinkSync(__filename);
} catch (e) {}
