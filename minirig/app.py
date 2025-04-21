from flask import Flask, render_template, jsonify, request, redirect, url_for
import os
import sqlite3
import json
from datetime import datetime
import uuid

# Initialize Flask app
app = Flask(__name__)

# Database setup
def get_db_connection():
    conn = sqlite3.connect('minirig.db')
    conn.row_factory = sqlite3.Row
    return conn

def init_db():
    conn = get_db_connection()
    
    # Create components table
    conn.execute('''
    CREATE TABLE IF NOT EXISTS components (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        type TEXT NOT NULL,
        brand TEXT NOT NULL,
        model TEXT NOT NULL,
        price REAL NOT NULL,
        specs TEXT NOT NULL,
        dimensions TEXT,
        image_url TEXT,
        url TEXT
    )
    ''')
    
    # Create compatibility rules table
    conn.execute('''
    CREATE TABLE IF NOT EXISTS compatibility_rules (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        component_id INTEGER,
        compatible_with_type TEXT NOT NULL,
        compatible_with_id INTEGER,
        compatibility_note TEXT,
        FOREIGN KEY (component_id) REFERENCES components (id)
    )
    ''')
    
    # Create builds table
    conn.execute('''
    CREATE TABLE IF NOT EXISTS builds (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        description TEXT,
        created_at DATETIME NOT NULL,
        updated_at DATETIME NOT NULL,
        share_code TEXT UNIQUE,
        total_price REAL
    )
    ''')
    
    # Create build_components table
    conn.execute('''
    CREATE TABLE IF NOT EXISTS build_components (
        build_id INTEGER,
        component_id INTEGER,
        PRIMARY KEY (build_id, component_id),
        FOREIGN KEY (build_id) REFERENCES builds (id),
        FOREIGN KEY (component_id) REFERENCES components (id)
    )
    ''')
    
    # Insert sample data if the components table is empty
    cursor = conn.execute('SELECT COUNT(*) FROM components')
    count = cursor.fetchone()[0]
    
    if count == 0:
        # Sample data for demonstration
        sample_components = [
            # Cases
            ('NZXT H210', 'case', 'NZXT', 'H210', 89.99, 
             json.dumps({'material': 'Steel', 'color': 'Black', 'max_gpu_length': 325}),
             json.dumps({'length': 349, 'width': 210, 'height': 372}),
             '/static/img/cases/nzxt_h210.jpg', '#'),
            
            ('Cooler Master NR200', 'case', 'Cooler Master', 'NR200', 79.99, 
             json.dumps({'material': 'Steel', 'color': 'Black', 'max_gpu_length': 330}),
             json.dumps({'length': 376, 'width': 185, 'height': 274}),
             '/static/img/cases/cm_nr200.jpg', '#'),
            
            # Motherboards
            ('ASUS ROG STRIX B660-I', 'motherboard', 'ASUS', 'ROG STRIX B660-I', 219.99, 
             json.dumps({'socket': 'LGA1700', 'chipset': 'B660', 'form_factor': 'Mini-ITX'}),
             json.dumps({'length': 170, 'width': 170, 'height': 0}),
             '/static/img/motherboards/asus_b660i.jpg', '#'),
            
            ('MSI MPG B550I', 'motherboard', 'MSI', 'MPG B550I GAMING EDGE WIFI', 199.99, 
             json.dumps({'socket': 'AM4', 'chipset': 'B550', 'form_factor': 'Mini-ITX'}),
             json.dumps({'length': 170, 'width': 170, 'height': 0}),
             '/static/img/motherboards/msi_b550i.jpg', '#'),
            
            # CPUs
            ('Intel Core i5-12600K', 'cpu', 'Intel', 'Core i5-12600K', 279.99, 
             json.dumps({'cores': 10, 'threads': 16, 'base_clock': 3.7, 'socket': 'LGA1700', 'tdp': 125}),
             None, '/static/img/cpus/i5_12600k.jpg', '#'),
            
            ('AMD Ryzen 5 5600X', 'cpu', 'AMD', 'Ryzen 5 5600X', 229.99, 
             json.dumps({'cores': 6, 'threads': 12, 'base_clock': 3.7, 'socket': 'AM4', 'tdp': 65}),
             None, '/static/img/cpus/ryzen_5600x.jpg', '#'),
            
            # CPU Coolers
            ('Noctua NH-L9i', 'cooler', 'Noctua', 'NH-L9i', 44.95, 
             json.dumps({'type': 'Air', 'height': 37, 'tdp_rating': 95}),
             json.dumps({'length': 95, 'width': 95, 'height': 37}),
             '/static/img/coolers/noctua_nhl9i.jpg', '#'),
            
            ('Noctua NH-L12S', 'cooler', 'Noctua', 'NH-L12S', 59.95, 
             json.dumps({'type': 'Air', 'height': 70, 'tdp_rating': 120}),
             json.dumps({'length': 128, 'width': 128, 'height': 70}),
             '/static/img/coolers/noctua_nhl12s.jpg', '#'),
            
            # Memory
            ('Corsair Vengeance LPX 16GB', 'memory', 'Corsair', 'Vengeance LPX 16GB (2x8GB) DDR4-3200', 89.99, 
             json.dumps({'capacity': 16, 'speed': 3200, 'type': 'DDR4', 'modules': 2, 'profile': 'low'}),
             None, '/static/img/memory/corsair_vengeance.jpg', '#'),
            
            ('G.Skill Ripjaws V 16GB', 'memory', 'G.Skill', 'Ripjaws V 16GB (2x8GB) DDR4-3600', 79.99, 
             json.dumps({'capacity': 16, 'speed': 3600, 'type': 'DDR4', 'modules': 2, 'profile': 'standard'}),
             None, '/static/img/memory/gskill_ripjaws.jpg', '#'),
            
            # Storage
            ('Samsung 970 EVO Plus 1TB', 'storage', 'Samsung', '970 EVO Plus 1TB NVMe SSD', 129.99, 
             json.dumps({'capacity': 1000, 'type': 'M.2 NVMe', 'read_speed': 3500, 'write_speed': 3300}),
             None, '/static/img/storage/samsung_970evo.jpg', '#'),
            
            ('WD Black SN750 1TB', 'storage', 'Western Digital', 'Black SN750 1TB NVMe SSD', 139.99, 
             json.dumps({'capacity': 1000, 'type': 'M.2 NVMe', 'read_speed': 3470, 'write_speed': 3000}),
             None, '/static/img/storage/wd_black.jpg', '#'),
            
            # GPUs
            ('NVIDIA GeForce RTX 3060 Ti', 'gpu', 'NVIDIA', 'GeForce RTX 3060 Ti 8GB', 399.99, 
             json.dumps({'memory': 8, 'memory_type': 'GDDR6', 'tdp': 200}),
             json.dumps({'length': 242, 'width': 112, 'height': 38}),
             '/static/img/gpus/rtx_3060ti.jpg', '#'),
            
            ('AMD Radeon RX 6700 XT', 'gpu', 'AMD', 'Radeon RX 6700 XT 12GB', 479.99, 
             json.dumps({'memory': 12, 'memory_type': 'GDDR6', 'tdp': 230}),
             json.dumps({'length': 267, 'width': 120, 'height': 40}),
             '/static/img/gpus/rx_6700xt.jpg', '#'),
            
            # PSUs
            ('Corsair SF600', 'psu', 'Corsair', 'SF600 600W 80+ Gold SFX', 129.99, 
             json.dumps({'wattage': 600, 'efficiency': 'Gold', 'form_factor': 'SFX', 'modular': 'Full'}),
             None, '/static/img/psus/corsair_sf600.jpg', '#'),
            
            ('Corsair SF750', 'psu', 'Corsair', 'SF750 750W 80+ Platinum SFX', 169.99, 
             json.dumps({'wattage': 750, 'efficiency': 'Platinum', 'form_factor': 'SFX', 'modular': 'Full'}),
             None, '/static/img/psus/corsair_sf750.jpg', '#')
        ]
        
        conn.executemany(
            'INSERT INTO components (name, type, brand, model, price, specs, dimensions, image_url, url) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
            sample_components
        )
        
        # Sample compatibility rules
        compatibility_rules = [
            # LGA1700 CPU with B660 motherboard
            (5, 'motherboard', 3, 'Compatible socket'),
            # AM4 CPU with B550 motherboard
            (6, 'motherboard', 4, 'Compatible socket'),
            # B660 motherboard with LGA1700 CPU
            (3, 'cpu', 5, 'Compatible socket'),
            # B550 motherboard with AM4 CPU
            (4, 'cpu', 6, 'Compatible socket'),
        ]
        
        conn.executemany(
            'INSERT INTO compatibility_rules (component_id, compatible_with_type, compatible_with_id, compatibility_note) VALUES (?, ?, ?, ?)',
            compatibility_rules
        )
    
    conn.commit()
    conn.close()

# Initialize database on app startup
@app.before_first_request
def before_first_request():
    init_db()

# Routes
@app.route('/')
def index():
    return render_template('index.html')

@app.route('/build')
def build():
    return render_template('build.html')

@app.route('/blog')
def blog():
    return render_template('blog.html')

# API Routes
@app.route('/api/components', methods=['GET'])
def get_components():
    component_type = request.args.get('type')
    
    conn = get_db_connection()
    
    if component_type:
        components = conn.execute('SELECT * FROM components WHERE type = ?', (component_type,)).fetchall()
    else:
        components = conn.execute('SELECT * FROM components').fetchall()
    
    conn.close()
    
    # Convert the results to a list of dictionaries
    component_list = []
    for component in components:
        component_dict = dict(component)
        component_dict['specs'] = json.loads(component_dict['specs']) if component_dict['specs'] else {}
        component_dict['dimensions'] = json.loads(component_dict['dimensions']) if component_dict['dimensions'] else None
        component_list.append(component_dict)
    
    return jsonify(component_list)

@app.route('/api/compatibility/<int:component_id>', methods=['GET'])
def get_compatibility(component_id):
    conn = get_db_connection()
    
    # Get the component's type
    component = conn.execute('SELECT type FROM components WHERE id = ?', (component_id,)).fetchone()
    
    if not component:
        conn.close()
        return jsonify({"error": "Component not found"}), 404
    
    # Get compatible components
    compatibility_rules = conn.execute(
        '''SELECT cr.compatible_with_type, cr.compatible_with_id, cr.compatibility_note, c.name, c.brand, c.model 
           FROM compatibility_rules cr 
           JOIN components c ON cr.compatible_with_id = c.id 
           WHERE cr.component_id = ?''',
        (component_id,)
    ).fetchall()
    
    conn.close()
    
    # Convert the results to a list of dictionaries
    compatibility_list = []
    for rule in compatibility_rules:
        compatibility_list.append({
            'type': rule['compatible_with_type'],
            'component_id': rule['compatible_with_id'],
            'note': rule['compatibility_note'],
            'name': rule['name'],
            'brand': rule['brand'],
            'model': rule['model']
        })
    
    return jsonify(compatibility_list)

@app.route('/api/builds', methods=['POST'])
def create_build():
    data = request.get_json()
    
    if not data or 'name' not in data or 'components' not in data:
        return jsonify({"error": "Invalid request data"}), 400
    
    # Generate unique share code
    share_code = str(uuid.uuid4())[:8]
    
    conn = get_db_connection()
    current_time = datetime.now().isoformat()
    
    # Calculate total price
    total_price = 0
    for component_id in data['components']:
        component = conn.execute('SELECT price FROM components WHERE id = ?', (component_id,)).fetchone()
        if component:
            total_price += component['price']
    
    # Create build record
    cursor = conn.execute(
        '''INSERT INTO builds (name, description, created_at, updated_at, share_code, total_price) 
           VALUES (?, ?, ?, ?, ?, ?)''',
        (data['name'], data.get('description', ''), current_time, current_time, share_code, total_price)
    )
    
    build_id = cursor.lastrowid
    
    # Add components to build
    for component_id in data['components']:
        conn.execute(
            'INSERT INTO build_components (build_id, component_id) VALUES (?, ?)',
            (build_id, component_id)
        )
    
    conn.commit()
    conn.close()
    
    return jsonify({
        "id": build_id,
        "share_code": share_code,
        "total_price": total_price
    })

@app.route('/api/builds/<share_code>', methods=['GET'])
def get_build(share_code):
    conn = get_db_connection()
    
    # Get build information
    build = conn.execute('SELECT * FROM builds WHERE share_code = ?', (share_code,)).fetchone()
    
    if not build:
        conn.close()
        return jsonify({"error": "Build not found"}), 404
    
    # Get components in the build
    components = conn.execute(
        '''SELECT c.* FROM components c 
           JOIN build_components bc ON c.id = bc.component_id 
           WHERE bc.build_id = ?''',
        (build['id'],)
    ).fetchall()
    
    conn.close()
    
    # Convert the results to dictionaries
    build_dict = dict(build)
    
    component_list = []
    for component in components:
        component_dict = dict(component)
        component_dict['specs'] = json.loads(component_dict['specs']) if component_dict['specs'] else {}
        component_dict['dimensions'] = json.loads(component_dict['dimensions']) if component_dict['dimensions'] else None
        component_list.append(component_dict)
    
    build_dict['components'] = component_list
    
    return jsonify(build_dict)

# Create directory for static files if it doesn't exist
def create_directories():
    os.makedirs('static/css', exist_ok=True)
    os.makedirs('static/js', exist_ok=True)
    os.makedirs('static/img/blog', exist_ok=True)
    os.makedirs('static/img/cases', exist_ok=True)
    os.makedirs('static/img/cpus', exist_ok=True)
    os.makedirs('static/img/motherboards', exist_ok=True)
    os.makedirs('static/img/coolers', exist_ok=True)
    os.makedirs('static/img/memory', exist_ok=True)
    os.makedirs('static/img/storage', exist_ok=True)
    os.makedirs('static/img/gpus', exist_ok=True)
    os.makedirs('static/img/psus', exist_ok=True)
    
    # Create placeholder image for development
    placeholder_path = 'static/img/placeholder.jpg'
    if not os.path.exists(placeholder_path):
        with open(placeholder_path, 'w') as f:
            f.write('Placeholder image - replace with actual image file')

# Run the app
if __name__ == '__main__':
    create_directories()
    app.run(debug=True)