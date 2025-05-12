from flask import Flask, render_template, redirect, url_for, jsonify, request
import csv
import os
import json
import random
import string

app = Flask(__name__)

# Dictionary to store component data
components_data = {}

# Dictionary to store saved builds (in-memory storage)
saved_builds = {}

# Socket compatibility mapping
socket_compatibility = {
    'AM5': ['AMD Ryzen'],  # All Ryzen CPUs with AM5 in the name are compatible with AM5 socket
    'LGA 1700': ['Intel Core i9-12', 'Intel Core i7-12', 'Intel Core i5-12', 'Intel Core i9-13', 'Intel Core i7-13', 'Intel Core i5-13', 'Intel Core i9-14', 'Intel Core i7-14', 'Intel Core i5-14'],  # LGA 1700 is for Intel 12th and 13th gen
    'LGA 1851': ['Intel Core Ultra']  # LGA 1851 is for Intel 14th gen and Core Ultra
}

# Load component data from CSV files
def load_component_data():
    csv_files = {
        'case': 'data/case.csv',
        'motherboard': 'data/motherboard.csv',
        'cpu': 'data/cpu.csv',
        'cooler': 'data/cpu_cooler.csv',
        'memory': 'data/memory.csv',
        'storage': 'data/internal_storage.csv',
        'gpu': 'data/gpu.csv',
        'psu': 'data/psu.csv'
    }
    
    for component_type, file_path in csv_files.items():
        if file_path and os.path.exists(file_path):
            components_data[component_type] = []
            
            with open(file_path, 'r', encoding='utf-8') as csvfile:
                reader = csv.DictReader(csvfile)
                
                for i, row in enumerate(reader):
                    component = {
                        'id': i + 1,  # Generate ID for each component
                        'type': component_type
                    }
                    
                    # Map CSV columns to component fields based on component type
                    if component_type == 'case':
                        component.update({
                            'brand': row.get('name', '').split()[0] if row.get('name') else '',
                            'model': ' '.join(row.get('name', '').split()[1:]) if row.get('name') else '',
                            'price': float(row.get('price', 0)) if row.get('price') else 0,
                            'specs': {
                                'color': row.get('color', ''),
                                'side_panel': row.get('side_panel', ''),
                                'external_volume': float(row.get('external_volume', 0)) if row.get('external_volume') else 0,
                                'internal_35_bays': int(row.get('internal_35_bays', 0)) if row.get('internal_35_bays') else 0
                            }
                        })
                    elif component_type == 'motherboard':
                        component.update({
                            'brand': row.get('Motherboard Name', '').split()[0] if row.get('Motherboard Name') else '',
                            'model': ' '.join(row.get('Motherboard Name', '').split()[1:]) if row.get('Motherboard Name') else '',
                            'price': float(row.get('Price (USD)', 0)) if row.get('Price (USD)') else 0,
                            'specs': {
                                'socket': row.get('Socket Compatibility', ''),
                                'memory_slots': int(row.get('Memory Slots', 0)) if row.get('Memory Slots') else 0,
                                'color': row.get('Color', ''),
                                'memory_max': int(row.get('Memory Max', 0)) if row.get('Memory Max') else 0
                            }
                        })
                    elif component_type == 'cpu':
                        component.update({
                            'brand': row.get('CPU Name', '').split()[0] if row.get('CPU Name') else '',
                            'model': ' '.join(row.get('CPU Name', '').split()[1:]) if row.get('CPU Name') else '',
                            'price': float(row.get('Price (USD)', 0)) if row.get('Price (USD)') else 0,
                            'specs': {
                                'socket': row.get('Socket', ''),  # Add this line to include socket in CPU data
                                'core_count': int(row.get('Core Count', 0)) if row.get('Core Count') else 0,
                                'base_clock': row.get('Base Clock', ''),
                                'boost_clock': row.get('Boost Clock', ''),
                                'tdp': int(row.get('TDP', 0)) if row.get('TDP') else 0,
                                'integrated_graphics': row.get('Integrated Graphics', ''),
                                'microarchitecture': row.get('Microarchitecture', '')
                            }
                        })
                    elif component_type == 'cooler':
                        component.update({
                            'brand': row.get('Name', '').split()[0] if row.get('Name') else '',
                            'model': ' '.join(row.get('Name', '').split()[1:]) if row.get('Name') else '',
                            'price': float(row.get('Price (USD)', 0)) if row.get('Price (USD)') else 0,
                            'specs': {
                                'color': row.get('Color', ''),
                                'socket_compatibility': row.get('Socket compatibility', ''),
                                'cooler_type': row.get('Cooler type', ''),
                                'height': row.get('Height/Radiator size', ''),
                                'rgb': row.get('RGB', '')
                            }
                        })
                    elif component_type == 'memory':
                        component.update({
                            'brand': row.get('Name', '').split()[0] if row.get('Name') else '',
                            'model': ' '.join(row.get('Name', '').split()[1:]) if row.get('Name') else '',
                            'price': float(row.get('Price (USD)', 0)) if row.get('Price (USD)') else 0,
                            'specs': {
                                'speed': row.get('Speed', ''),
                                'modules': row.get('Modules', ''),
                                'color': row.get('Color', ''),
                                'latency': row.get('Latency', ''),
                                'cas': row.get('CAS', '')
                            }
                        })
                    elif component_type == 'storage':
                        component.update({
                            'brand': row.get('Name', '').split()[0] if row.get('Name') else '',
                            'model': ' '.join(row.get('Name', '').split()[1:]) if row.get('Name') else '',
                            'price': float(row.get('Price (USD)', 0)) if row.get('Price (USD)') else 0,
                            'specs': {
                                'form_factor': row.get('Form Factor', ''),
                                'interface': row.get('Interface', ''),
                                'capacity': row.get('Capacity', '')
                            }
                        })
                    elif component_type == 'gpu':
                        price_str = row.get('Price', '')
                        price = 0
                        if price_str:
                            try:
                                price = float(price_str.replace('$', '').replace(',', ''))
                            except:
                                price = 0
                        
                        # Extract GPU name and identify chip/chipset
                        gpu_name = row.get('Name', '')
                        chip = row.get('Chip', '')
                        
                        # If chip is empty, try to extract from name
                        if not chip:
                            # Common GPU chipsets to look for
                            chipsets = ["RTX 5090", "RTX 5080", "RTX 5070 Ti", "RTX 5070", "RTX 5060 Ti", "RTX 5060",
                                      "RX 9700 XT", "RX 9700", "RX 9600 XT", "RX 9600", "Arc B580"]
                            
                            # Check GPU name for chipset references
                            detected_chip = ""
                            for chipset in chipsets:
                                if chipset.lower() in gpu_name.lower():
                                    detected_chip = chipset
                                    break
                            
                            # Fallback detection based on model names
                            if not detected_chip:
                                if "VENTUS" in gpu_name and "PLUS" in gpu_name:
                                    detected_chip = "RTX 5070"
                                elif "VENTUS" in gpu_name:
                                    detected_chip = "RTX 5060"
                                elif "GAMING" in gpu_name and "AMP" in gpu_name:
                                    detected_chip = "RX 9700 XT"
                                elif "GAMING" in gpu_name:
                                    detected_chip = "RX 9600"
                                elif "EAGLE" in gpu_name:
                                    detected_chip = "RTX 5060 Ti"
                                elif "DUAL" in gpu_name:
                                    detected_chip = "RTX 5060"
                                elif "Ghost" in gpu_name:
                                    detected_chip = "RX 9600"
                                elif "Twin Edge" in gpu_name:
                                    detected_chip = "RTX 5070"
                                elif "AERO" in gpu_name:
                                    detected_chip = "RTX 5060 Ti"
                            
                            chip = detected_chip
                        
                        # If still empty, provide a generic placeholder
                        if not chip:
                            # Price-based chipset guessing
                            if price > 1500:
                                chip = "RTX 5080/5090"
                            elif price > 700:
                                chip = "RTX 5070/RX 9700"
                            elif price > 400:
                                chip = "RTX 5060/RX 9600"
                            else:
                                chip = "GPU"
                        
                        component.update({
                            'brand': row.get('Name', '').split()[0] if row.get('Name') else '',
                            'model': ' '.join(row.get('Name', '').split()[1:]) if row.get('Name') else '',
                            'price': price,
                            'specs': {
                                'chip': chip,
                                'memory': row.get('Memory', ''),
                                'base_clock': row.get('Base Clock', ''),
                                'boost_clock': row.get('Boost Clock', ''),
                                'color': row.get('Color', ''),
                                'length': row.get('Length', '')
                            }
                        })
                    elif component_type == 'psu':
                        component.update({
                            'brand': row.get('PSU Name', '').split()[0] if row.get('PSU Name') else '',
                            'model': ' '.join(row.get('PSU Name', '').split()[1:]) if row.get('PSU Name') else '',
                            'price': float(row.get('Price (USD)', 0)) if row.get('Price (USD)') else 0,
                            'specs': {
                                'wattage': row.get('Wattage', ''),
                                'form_factor': row.get('Form Factor', ''),
                                'efficiency': row.get('Efficiency', ''),
                                'type': row.get('Type', ''),
                                'color': row.get('Color', '')
                            }
                        })
                    
                    components_data[component_type].append(component)

# Load data when the app starts
load_component_data()

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/recommend')
def recommend():
    """Render the Recommend Build page."""
    return render_template('recommend.html')

@app.route('/build')
def build():
    """Render the Component Picker page."""
    return render_template('build.html')

# API endpoint to get all components
@app.route('/api/components')
def get_components():
    all_components = []
    for component_type, components in components_data.items():
        all_components.extend(components)
    return jsonify(all_components)

# API endpoint to get components by type
@app.route('/api/components/<component_type>')
def get_components_by_type(component_type):
    if component_type in components_data:
        return jsonify(components_data[component_type])
    return jsonify([])

# CPU-Motherboard compatibility check
def check_cpu_motherboard_compatibility(cpu, motherboard):
    # Extract socket from motherboard and CPU
    motherboard_socket = motherboard.get('specs', {}).get('socket', '').replace(' ', '').upper()
    cpu_socket = cpu.get('specs', {}).get('socket', '').replace(' ', '').upper()
    
    # Extract CPU brand
    cpu_brand = cpu.get('brand', '')
    
    # Basic brand-socket validation
    if 'AMD' in cpu_brand and not motherboard_socket.startswith('AM'):
        return False
    
    if 'INTEL' in cpu_brand.upper() and not (motherboard_socket.startswith('LGA') or motherboard_socket.startswith('BGA')):
        return False
        
    # Direct socket comparison (normalized)
    return motherboard_socket == cpu_socket

# Compatibility check API
@app.route('/api/compatibility/<int:cpu_id>')
def check_compatibility(cpu_id):
    compatibility_data = []
    
    # Get all motherboards
    motherboards = components_data.get('motherboard', [])
    
    # Get the CPU
    cpu = None
    for cpu_item in components_data.get('cpu', []):
        if cpu_item['id'] == cpu_id:
            cpu = cpu_item
            break
    
    if cpu:
        # Check compatibility with each motherboard
        for mb in motherboards:
            is_compatible = check_cpu_motherboard_compatibility(cpu, mb)
            
            compatibility_data.append({
                'type': 'motherboard',
                'component_id': str(mb['id']),
                'compatible': is_compatible
            })
    
    return jsonify(compatibility_data)

# API endpoint to save builds
@app.route('/api/builds', methods=['POST'])
def save_build():
    data = request.json
    
    if not data:
        return jsonify({
            'success': False,
            'message': 'No data provided'
        })
    
    # Generate a share code
    share_code = ''.join(random.choices(string.ascii_uppercase + string.digits, k=8))
    
    # Store the build data in our in-memory dictionary
    saved_builds[share_code] = {
        'name': data.get('name', 'Untitled Build'),
        'components': data.get('components', {})
    }
    
    print(f"Saved build with code {share_code}: {saved_builds[share_code]}")
    
    return jsonify({
        'success': True,
        'share_code': share_code
    })

# API endpoint to load builds by share code
@app.route('/api/builds/<share_code>')
def load_build(share_code):
    # Check if the share code exists in our saved builds
    if share_code in saved_builds:
        return jsonify(saved_builds[share_code])
    
    # If not found, return an empty build
    return jsonify({
        'name': f'Build Not Found',
        'components': {}
    })

# API endpoint for direct compatibility check
@app.route('/api/check-compatibility', methods=['POST'])
def direct_compatibility_check():
    data = request.json
    
    if not data or 'cpu' not in data or 'motherboard' not in data:
        return jsonify({'compatible': False, 'error': 'Missing CPU or motherboard data'})
    
    cpu = data['cpu']
    motherboard = data['motherboard']
    
    cpu_socket = cpu.get('specs', {}).get('socket', '').replace(' ', '').upper()
    mb_socket = motherboard.get('specs', {}).get('socket', '').replace(' ', '').upper()
    cpu_brand = cpu.get('brand', '')
    cpu_name = f"{cpu.get('brand', '')} {cpu.get('model', '')}"
    
    # Check brand-socket compatibility
    message = None
    compatible = True
    
    if 'AMD' in cpu_brand and not mb_socket.startswith('AM'):
        compatible = False
        message = f"CPU {cpu_name} (AMD) is not compatible with {motherboard.get('specs', {}).get('socket', '')} motherboards"
    
    elif 'INTEL' in cpu_brand.upper() and not (mb_socket.startswith('LGA') or mb_socket.startswith('BGA')):
        compatible = False
        message = f"CPU {cpu_name} (Intel) is not compatible with {motherboard.get('specs', {}).get('socket', '')} motherboards"
    
    # If brand is compatible, check specific socket match
    elif cpu_socket != mb_socket:
        compatible = False
        message = f"CPU {cpu_name} requires {cpu.get('specs', {}).get('socket', '')} socket but motherboard has {motherboard.get('specs', {}).get('socket', '')} socket"
    
    return jsonify({
        'compatible': compatible,
        'message': message,
        'debug': {
            'cpu_socket': cpu_socket,
            'mb_socket': mb_socket,
            'cpu_brand': cpu_brand
        }
    })

if __name__ == '__main__':
    app.run(debug=True)