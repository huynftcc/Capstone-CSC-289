from flask import Flask, render_template, redirect, url_for

app = Flask(__name__)

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

if __name__ == '__main__':
    app.run(debug=True)