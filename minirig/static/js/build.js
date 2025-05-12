// Store all component data
let componentsData = {};
let selectedComponents = {};

// Initialize the page when it loads
document.addEventListener('DOMContentLoaded', () => {
    loadComponents();
    setupEventListeners();
});

// Load all component data from the API
function loadComponents() {
    const componentTypes = ['case', 'motherboard', 'cpu', 'cooler', 'memory', 'storage', 'gpu', 'psu'];
    
    const fetchPromises = componentTypes.map(type => 
        fetch(`/api/components/${type}`, {
            // Add cache-busting headers to ensure fresh data
            cache: 'no-store',
            headers: {
                'Cache-Control': 'no-cache, no-store, must-revalidate',
                'Pragma': 'no-cache',
                'Expires': '0'
            }
        })
        .then(response => response.json())
        .then(data => {
            componentsData[type] = data;
            populateSelectOptions(type, data);
            if (type === 'gpu') {
                console.log("GPU data loaded:", data.length, "items");
                // Log a few GPU items to debug
                if (data.length > 0) {
                    console.log("Sample GPU data:", data[0]);
                    console.log("GPUs with chip data:", data.filter(gpu => gpu.specs && gpu.specs.chip).length);
                }
            }
        })
    );
    
    Promise.all(fetchPromises)
        .then(() => console.log("All components loaded"))
        .catch(error => console.error('Error loading components:', error));
}

// Populate select dropdown with component options
function populateSelectOptions(type, components) {
    const select = document.getElementById(`${type}-select`);
    if (!select) return;
    
    // Clear existing options except the first one
    while (select.options.length > 1) {
        select.remove(1);
    }
    
    // Add options for each component
    components.forEach(component => {
        const option = document.createElement('option');
        option.value = component.id;
        
        // Format the display text based on component type
        let displayText = '';
        
        if (type === 'cpu') {
            const socket = component.specs?.socket || 'Unknown Socket';
            displayText = `${component.brand} ${component.model} (${socket}) - $${component.price.toFixed(2)}`;
        } else if (type === 'motherboard') {
            const socket = component.specs?.socket || 'Unknown Socket';
            displayText = `${component.brand} ${component.model} (${socket}) - $${component.price.toFixed(2)}`;
        } else if (type === 'gpu') {
            // Include chipset information for GPUs
            const chipset = component.specs?.chip || 'Unknown';
            displayText = `${component.brand} ${component.model} (${chipset}) - $${component.price.toFixed(2)}`;
            console.log("Created GPU option:", displayText);
        } else {
            displayText = `${component.brand} ${component.model} - $${component.price.toFixed(2)}`;
        }
        
        option.textContent = displayText;
        select.appendChild(option);
    });
}

// Set up event listeners for select elements and buttons
function setupEventListeners() {
    // Component select elements
    const componentTypes = ['case', 'motherboard', 'cpu', 'cooler', 'memory', 'storage', 'gpu', 'psu'];
    
    componentTypes.forEach(type => {
        const select = document.getElementById(`${type}-select`);
        if (select) {
            select.addEventListener('change', () => handleComponentSelection(type, select));
        }
    });
    
    // Button event listeners
    const saveButton = document.getElementById('save-build');
    if (saveButton) {
        saveButton.addEventListener('click', saveBuild);
    }
    
    const clearButton = document.getElementById('clear-build');
    if (clearButton) {
        clearButton.addEventListener('click', clearBuild);
    }
    
    const loadButton = document.getElementById('load-build');
    if (loadButton) {
        loadButton.addEventListener('click', showLoadBuildModal);
    }
    
    // Modal close button
    const closeModalButton = document.querySelector('.close');
    if (closeModalButton) {
        closeModalButton.addEventListener('click', hideLoadBuildModal);
    }
    
    // Load code button
    const loadCodeButton = document.getElementById('load-code-button');
    if (loadCodeButton) {
        loadCodeButton.addEventListener('click', loadBuildByCode);
    }
}

// Handle component selection
function handleComponentSelection(type, select) {
    if (select.selectedIndex <= 0) {
        // Remove component if "Select a..." is chosen
        if (selectedComponents[type]) {
            delete selectedComponents[type];
        }
    } else {
        // Find the selected component data
        const componentId = parseInt(select.value);
        const componentData = componentsData[type].find(c => c.id === componentId);
        
        if (componentData) {
            selectedComponents[type] = componentData;
            
            // Check compatibility if both CPU and motherboard are selected
            if ((type === 'cpu' || type === 'motherboard') && 
                selectedComponents['cpu'] && selectedComponents['motherboard']) {
                checkCompatibility();
            }
        }
    }
    
    // Update the build summary
    updateBuildSummary();
}

// Check compatibility between CPU and motherboard
function checkCompatibility() {
    const cpu = selectedComponents['cpu'];
    const motherboard = selectedComponents['motherboard'];
    
    // Only check if both components are selected
    if (!cpu || !motherboard) {
        // Reset compatibility message if one component is unselected
        const compatibilityMessage = document.getElementById('compatibility-message');
        const compatibilityStatus = document.querySelector('.compatibility-status');
        
        compatibilityStatus.className = 'compatibility-status';
        compatibilityMessage.textContent = "Select both CPU and motherboard to check compatibility";
        return;
    }
    
    console.log("Checking compatibility between CPU and motherboard");
    
    // Get CPU and motherboard socket information
    const cpuSocket = cpu.specs?.socket;
    const mbSocket = motherboard.specs?.socket;
    const cpuBrand = cpu.brand;
    const cpuModel = cpu.model;
    
    // Check compatibility based on specific rules
    let isCompatible = false;
    let message = "";
    
    // Rule 1: AMD CPUs should only be compatible with AM5 motherboards
    if (cpuBrand.includes('AMD')) {
        if (mbSocket === 'AM5') {
            isCompatible = true;
            message = `${cpuBrand} ${cpuModel} is compatible with ${mbSocket} motherboard!`;
        } else {
            isCompatible = false;
            message = `${cpuBrand} ${cpuModel} requires an AM5 socket motherboard, but selected motherboard has ${mbSocket} socket.`;
        }
    }
    // Rule 2: Intel Core i5/i7/i9 should only be compatible with LGA 1700 motherboards
    else if (cpuModel.includes('Core i5') || cpuModel.includes('Core i7') || cpuModel.includes('Core i9')) {
        if (mbSocket === 'LGA 1700') {
            isCompatible = true;
            message = `${cpuBrand} ${cpuModel} is compatible with ${mbSocket} motherboard!`;
        } else {
            isCompatible = false;
            message = `${cpuBrand} ${cpuModel} requires an LGA 1700 socket motherboard, but selected motherboard has ${mbSocket} socket.`;
        }
    }
    // Rule 3: Intel Core Ultra should only be compatible with LGA 1851 motherboards
    else if (cpuModel.includes('Core Ultra')) {
        if (mbSocket === 'LGA 1851') {
            isCompatible = true;
            message = `${cpuBrand} ${cpuModel} is compatible with ${mbSocket} motherboard!`;
        } else {
            isCompatible = false;
            message = `${cpuBrand} ${cpuModel} requires an LGA 1851 socket motherboard, but selected motherboard has ${mbSocket} socket.`;
        }
    }
    // Fallback for any other cases - check with the API
    else {
        // Call the compatibility check API
        fetch('/api/check-compatibility', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                cpu: cpu,
                motherboard: motherboard
            })
        })
        .then(response => response.json())
        .then(data => {
            console.log("Compatibility check result:", data);
            
            const compatibilityMessage = document.getElementById('compatibility-message');
            const compatibilityStatus = document.querySelector('.compatibility-status');
            
            if (data.compatible) {
                compatibilityStatus.className = 'compatibility-status compatible';
                compatibilityMessage.textContent = "CPU and motherboard are compatible!";
            } else {
                compatibilityStatus.className = 'compatibility-status incompatible';
                compatibilityMessage.textContent = data.message || "CPU and motherboard are not compatible.";
            }
        })
        .catch(error => {
            console.error('Error checking compatibility:', error);
            
            const compatibilityMessage = document.getElementById('compatibility-message');
            compatibilityMessage.textContent = "Error checking compatibility. Please try again.";
        });
        return; // Return early since we're handling this asynchronously
    }
    
    // Update the UI with compatibility result
    console.log("Compatibility check result:", isCompatible, message);
    
    const compatibilityMessage = document.getElementById('compatibility-message');
    const compatibilityStatus = document.querySelector('.compatibility-status');
    
    if (isCompatible) {
        compatibilityStatus.className = 'compatibility-status compatible';
        compatibilityMessage.textContent = message;
    } else {
        compatibilityStatus.className = 'compatibility-status incompatible';
        compatibilityMessage.textContent = message;
    }
}

// Update the build summary display
function updateBuildSummary() {
    const componentsListElement = document.getElementById('selected-components-list');
    if (!componentsListElement) return;
    
    // Clear the current list
    componentsListElement.innerHTML = '';
    
    // Calculate total price
    let totalPrice = 0;
    
    // Create a component item for each selected component
    const componentTypes = ['case', 'motherboard', 'cpu', 'cooler', 'memory', 'storage', 'gpu', 'psu'];
    
    componentTypes.forEach(type => {
        const component = selectedComponents[type];
        if (component) {
            // Add to total price
            totalPrice += component.price;
            
            // Create component item element
            const componentItem = document.createElement('div');
            componentItem.className = 'component-item';
            
            // Component name div
            const componentName = document.createElement('div');
            componentName.className = 'component-name';
            
            // Add chipset info for GPUs
            if (type === 'gpu' && component.specs?.chip) {
                componentName.textContent = `${type.charAt(0).toUpperCase() + type.slice(1)}: ${component.brand} ${component.model} (${component.specs.chip})`;
            } else {
                componentName.textContent = `${type.charAt(0).toUpperCase() + type.slice(1)}: ${component.brand} ${component.model}`;
            }
            
            // Component price div
            const componentPrice = document.createElement('div');
            componentPrice.className = 'component-price';
            componentPrice.textContent = `$${component.price.toFixed(2)}`;
            
            // Add to component item
            componentItem.appendChild(componentName);
            componentItem.appendChild(componentPrice);
            
            // Add to components list
            componentsListElement.appendChild(componentItem);
        }
    });
    
    // Update total price display
    const totalPriceElement = document.getElementById('total-price');
    if (totalPriceElement) {
        totalPriceElement.textContent = `$${totalPrice.toFixed(2)}`;
    }
}

// Save the current build
function saveBuild() {
    const buildName = document.getElementById('build-name').value || "Untitled Build";
    
    // Make sure we have at least some components selected
    if (Object.keys(selectedComponents).length === 0) {
        alert("Please select at least one component before saving.");
        return;
    }
    
    // Prepare the build data
    const buildData = {
        name: buildName,
        components: selectedComponents
    };
    
    // Send save request to the API
    fetch('/api/builds', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(buildData)
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            // Show the share code
            const shareCodeDisplay = document.getElementById('share-code-display');
            const shareCodeText = document.getElementById('share-code-text');
            
            if (shareCodeDisplay && shareCodeText) {
                shareCodeText.textContent = data.share_code;
                shareCodeDisplay.style.display = 'block';
            }
            
            alert(`Build saved successfully! Your share code is: ${data.share_code}`);
        } else {
            alert('Error saving build: ' + (data.message || 'Unknown error'));
        }
    })
    .catch(error => {
        console.error('Error saving build:', error);
        alert('Error saving build. Please try again.');
    });
}

// Show the load build modal
function showLoadBuildModal() {
    const modal = document.getElementById('load-build-modal');
    if (modal) {
        modal.style.display = 'block';
    }
}

// Hide the load build modal
function hideLoadBuildModal() {
    const modal = document.getElementById('load-build-modal');
    if (modal) {
        modal.style.display = 'none';
    }
}

// Load a build by share code
function loadBuildByCode() {
    const shareCodeInput = document.getElementById('share-code-input');
    if (!shareCodeInput || !shareCodeInput.value) {
        alert("Please enter a share code.");
        return;
    }
    
    const shareCode = shareCodeInput.value.trim();
    
    // Request the build data from the API
    fetch(`/api/builds/${shareCode}`)
        .then(response => response.json())
        .then(data => {
            // Hide the modal
            hideLoadBuildModal();
            
            // Set the build name
            const buildNameInput = document.getElementById('build-name');
            if (buildNameInput) {
                buildNameInput.value = data.name || "Loaded Build";
            }
            
            // Clear current selections
            clearBuild(false); // Don't show alert
            
            // Select each component
            if (data.components) {
                for (const [type, component] of Object.entries(data.components)) {
                    const select = document.getElementById(`${type}-select`);
                    if (select) {
                        // Find the option with matching component ID
                        for (let i = 0; i < select.options.length; i++) {
                            if (select.options[i].value == component.id) {
                                select.selectedIndex = i;
                                handleComponentSelection(type, select);
                                break;
                            }
                        }
                    }
                }
            }
            
            alert("Build loaded successfully!");
        })
        .catch(error => {
            console.error('Error loading build:', error);
            alert("Error loading build. Please check the share code and try again.");
        });
}

// Clear the current build
function clearBuild(showAlert = true) {
    // Reset all select elements
    const componentTypes = ['case', 'motherboard', 'cpu', 'cooler', 'memory', 'storage', 'gpu', 'psu'];
    
    componentTypes.forEach(type => {
        const select = document.getElementById(`${type}-select`);
        if (select) {
            select.selectedIndex = 0;
        }
    });
    
    // Clear selected components
    selectedComponents = {};
    
    // Update build summary
    updateBuildSummary();
    
    // Reset compatibility message
    const compatibilityMessage = document.getElementById('compatibility-message');
    const compatibilityStatus = document.querySelector('.compatibility-status');
    
    if (compatibilityMessage && compatibilityStatus) {
        compatibilityStatus.className = 'compatibility-status';
        compatibilityMessage.textContent = "Select components to check compatibility";
    }
    
    // Clear build name
    const buildNameInput = document.getElementById('build-name');
    if (buildNameInput) {
        buildNameInput.value = '';
    }
    
    // Hide share code
    const shareCodeDisplay = document.getElementById('share-code-display');
    if (shareCodeDisplay) {
        shareCodeDisplay.style.display = 'none';
    }
    
    if (showAlert) {
        alert("Build cleared!");
    }
}

// Add a refresh button for GPU data (for debugging)
function addRefreshGPUButton() {
    const gpuCategory = document.getElementById('gpu-category');
    if (!gpuCategory) return;
    
    const refreshButton = document.createElement('button');
    refreshButton.textContent = "Refresh GPU List";
    refreshButton.style.marginTop = "10px";
    refreshButton.style.padding = "5px 10px";
    refreshButton.addEventListener('click', () => {
        fetch('/api/components/gpu', {
            cache: 'no-store',
            headers: {
                'Cache-Control': 'no-cache',
                'Pragma': 'no-cache'
            }
        })
        .then(response => response.json())
        .then(data => {
            console.log("Refreshed GPU data:", data);
            if (data.length > 0) {
                console.log("First GPU chip:", data[0].specs?.chip);
                populateSelectOptions('gpu', data);
                alert(`Refreshed ${data.length} GPUs`);
            }
        });
    });
    
    gpuCategory.appendChild(refreshButton);
}

// Call this function when the page loads
setTimeout(addRefreshGPUButton, 1000);

// Export a debug function to window for testing in console
window.debugGPUs = function() {
    const gpuSelect = document.getElementById('gpu-select');
    console.log("GPU select options:", gpuSelect?.options.length);
    
    if (gpuSelect && gpuSelect.options.length > 0) {
        console.log("First 3 GPU options:");
        for (let i = 0; i < Math.min(3, gpuSelect.options.length); i++) {
            console.log(`${i}: ${gpuSelect.options[i].textContent}`);
        }
    }
    
    console.log("GPU data in memory:", componentsData.gpu?.length);
    if (componentsData.gpu && componentsData.gpu.length > 0) {
        console.log("Sample GPU data:", componentsData.gpu[0]);
    }
};