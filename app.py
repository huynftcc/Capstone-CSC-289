from flask import Flask, render_template, request, jsonify
import json

app = Flask(__name__)

# Load parts data (simplified for ITX builds)
with open('data/parts.json') as f:
    parts_data = json.load(f)

@app.route('/')
def index():
    return render_template('index.html', parts=parts_data)

@app.route('/recommend', methods=['POST'])
def recommend():
    data = request.json
    budget = int(data['budget'])
    use_case = data['use_case']
    
    # Basic recommendation logic (extendable for ITX specifics)
    recommended = {
        "cpu": "",
        "gpu": ""
    }
    
    if budget < 1000:
        recommended["cpu"] = "Intel Core i3-13100"
        recommended["gpu"] = "GTX 1660 Super"
    elif budget < 2000:
        recommended["cpu"] = "Ryzen 5 7600"
        recommended["gpu"] = "RTX 4060 Ti"
    else:
        recommended["cpu"] = "Ryzen 9 7900X"
        recommended["gpu"] = "RTX 4080"
        
    return jsonify(recommended)

if __name__ == '__main__':
    app.run(debug=True)
