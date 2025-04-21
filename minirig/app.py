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
             json.dumps({'cores': 10, 'threads': 16, 'base_clock': 3.7, 'socket': 'LGA1700'}),
             None, '/static/img/cpus/i5_12600k.jpg', '#'),
            
            ('AMD Ryzen 5 5600X', 'cpu', 'AMD', 'Ryzen 5 5600X', 229.99, 
             json.dumps({'cores': 6, 'threads': 12, 'base_clock': 3.7, 'socket': 'AM4'}),
             None, '/static/img/cpus/ryzen_5600x.jpg', '#'),
            
            # More components would be added here
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

# Initialize database when the app starts
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

# Run the app
if __name__ == '__main__':
    app.run(debug=True)