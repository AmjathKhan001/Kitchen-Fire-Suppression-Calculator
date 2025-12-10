/**
 * KFSS Calculator - Kitchen Fire Suppression System Calculator
 * Main JavaScript Application
 */

const KFSSCalculator = (function() {
    // Private variables and state
    let currentCalculation = null;
    let recentCalculations = [];
    let expertMode = false;
    
    // Standard appliances database
    const standardAppliances = [
        { id: 'fryer', name: 'Deep Fryer', nozzles: 1, price: 850 },
        { id: 'range', name: 'Cooking Range', nozzles: 2, price: 1200 },
        { id: 'grill', name: 'Griddle/Grill', nozzles: 1, price: 750 },
        { id: 'broiler', name: 'Broiler', nozzles: 1, price: 900 },
        { id: 'wok', name: 'Wok Station', nozzles: 2, price: 1100 },
        { id: 'oven', name: 'Convection Oven', nozzles: 1, price: 650 },
        { id: 'steamer', name: 'Steamer', nozzles: 1, price: 700 },
        { id: 'dishwasher', name: 'Dishwasher', nozzles: 1, price: 600 }
    ];
    
    // Component pricing (in USD)
    const pricing = {
        nozzle: 85,
        cylinder_5kg: 1200,
        cylinder_10kg: 1900,
        piping_per_meter: 35,
        hood_agent_tank: 1800,
        manual_release: 250,
        installation_labor: 850,
        commissioning: 400
    };
    
    // Currency exchange rates (approximate)
    const exchangeRates = {
        USD: 1.0,
        EUR: 0.92,
        INR: 83.0,
        AED: 3.67
    };
    
    // Currency symbols
    const currencySymbols = {
        USD: '$',
        EUR: '€',
        INR: '₹',
        AED: 'د.إ'
    };
    
    /**
     * Initialize the calculator
     */
    function init() {
        console.log('KFSS Calculator initializing...');
        loadRecentCalculations();
        initializeAppliances();
        setupEventListeners();
        setupExpertModeToggle();
        updateSummary();
        
        // Load last calculation if available
        const lastCalc = localStorage.getItem('kfss_last_calculation');
        if (lastCalc) {
            try {
                currentCalculation = JSON.parse(lastCalc);
                updateFormFromCalculation();
                updateSummary();
            } catch (e) {
                console.error('Failed to load last calculation:', e);
            }
        }
        
        console.log('KFSS Calculator initialized successfully');
    }
    
    /**
     * Initialize appliance list
     */
    function initializeAppliances() {
        const applianceList = document.getElementById('applianceList');
        if (!applianceList) return;
        
        applianceList.innerHTML = '';
        
        standardAppliances.forEach(appliance => {
            const item = document.createElement('div');
            item.className = 'appliance-item';
            item.dataset.id = appliance.id;
            item.dataset.nozzles = appliance.nozzles;
            item.dataset.price = appliance.price;
            
            item.innerHTML = `
                <div class="appliance-name">${appliance.name}</div>
                <div class="appliance-nozzles">${appliance.nozzles} nozzle${appliance.nozzles > 1 ? 's' : ''}</div>
            `;
            
            item.addEventListener('click', function() {
                this.classList.toggle('selected');
                updateSummary();
            });
            
            applianceList.appendChild(item);
        });
    }
    
    /**
     * Set up event listeners
     */
    function setupEventListeners() {
        // Calculate button
        const calculateBtn = document.getElementById('calculateBtn');
        if (calculateBtn) {
            calculateBtn.addEventListener('click', performCalculation);
        }
        
        // Reset button
        const resetBtn = document.getElementById('resetBtn');
        if (resetBtn) {
            resetBtn.addEventListener('click', resetCalculator);
        }
        
        // Custom appliance addition
        const addCustomBtn = document.getElementById('addCustomAppliance');
        if (addCustomBtn) {
            addCustomBtn.addEventListener('click', addCustomAppliance);
        }
        
        // Form input listeners for real-time updates
        const inputs = ['projectName', 'clientName', 'projectLocation', 'hoodLength', 
                       'hoodDepth', 'plenumSections', 'ductSections', 'currency'];
        
        inputs.forEach(inputId => {
            const input = document.getElementById(inputId);
            if (input) {
                input.addEventListener('input', updateSummary);
                input.addEventListener('change', updateSummary);
            }
        });
        
        // Expert mode fields
        const expertInputs = ['hoodMaterial', 'ductLength', 'nozzleType', 'pipeMaterial', 
                             'safetyFactor', 'pressureRating', 'additionalNotes'];
        
        expertInputs.forEach(inputId => {
            const input = document.getElementById(inputId);
            if (input) {
                input.addEventListener('change', updateSummary);
            }
        });
    }
    
    /**
     * Set up expert mode toggle
     */
    function setupExpertModeToggle() {
        const toggle = document.getElementById('expertModeToggle');
        const expertPanel = document.getElementById('expertPanel');
        const expertHoodPanel = document.getElementById('expertHoodPanel');
        
        if (!toggle) return;
        
        // Load expert mode state
        const savedMode = localStorage.getItem('kfss_expert_mode');
        expertMode = savedMode === 'true';
        toggle.checked = expertMode;
        
        // Set initial state
        updateExpertModeDisplay();
        
        // Add event listener
        toggle.addEventListener('change', function() {
            expertMode = this.checked;
            localStorage.setItem('kfss_expert_mode', expertMode);
            updateExpertModeDisplay();
            updateSummary();
        });
        
        function updateExpertModeDisplay() {
            if (expertPanel) {
                if (expertMode) {
                    expertPanel.classList.add('expanded');
                } else {
                    expertPanel.classList.remove('expanded');
                }
            }
            
            if (expertHoodPanel) {
                if (expertMode) {
                    expertHoodPanel.classList.add('expanded');
                } else {
                    expertHoodPanel.classList.remove('expanded');
                }
            }
        }
    }
    
    /**
     * Update the summary panel with current values
     */
    function updateSummary() {
        // Get form values
        const hoodLength = parseFloat(document.getElementById('hoodLength')?.value) || 3.0;
        const hoodDepth = parseFloat(document.getElementById('hoodDepth')?.value) || 1.2;
        const plenumSections = parseInt(document.getElementById('plenumSections')?.value) || 2;
        const ductSections = parseInt(document.getElementById('ductSections')?.value) || 1;
        const currency = document.getElementById('currency')?.value || 'USD';
        
        // Calculate hood area
        const hoodArea = hoodLength * hoodDepth;
        
        // Calculate selected appliances
        const selectedAppliances = document.querySelectorAll('.appliance-item.selected');
        let applianceNozzles = 0;
        let applianceCost = 0;
        
        selectedAppliances.forEach(item => {
            applianceNozzles += parseInt(item.dataset.nozzles) || 1;
            applianceCost += parseFloat(item.dataset.price) || 0;
        });
        
        // Calculate totals
        const totalNozzles = plenumSections + ductSections + applianceNozzles;
        const cylindersRequired = Math.ceil(totalNozzles / 6); // 6 nozzles per cylinder max
        const agentWeight = cylindersRequired * 5.7; // kg per cylinder
        const pipingLength = (totalNozzles * 2) + 5; // 2m per nozzle + 5m main run
        
        // Calculate cost
        let totalCost = 0;
        totalCost += totalNozzles * pricing.nozzle;
        totalCost += cylindersRequired * (cylindersRequired > 1 ? pricing.cylinder_10kg : pricing.cylinder_5kg);
        totalCost += pipingLength * pricing.piping_per_meter;
        totalCost += pricing.hood_agent_tank;
        totalCost += pricing.manual_release;
        totalCost += pricing.installation_labor;
        totalCost += pricing.commissioning;
        totalCost += applianceCost;
        
        // Apply currency conversion
        const exchangeRate = exchangeRates[currency] || 1;
        totalCost *= exchangeRate;
        
        // Update summary display
        updateElementText('summaryHoodArea', hoodArea.toFixed(1) + ' m²');
        updateElementText('summaryPlenumNozzles', plenumSections);
        updateElementText('summaryDuctNozzles', ductSections);
        updateElementText('summaryApplianceNozzles', applianceNozzles);
        updateElementText('summaryTotalNozzles', totalNozzles);
        updateElementText('summaryCylinders', cylindersRequired);
        updateElementText('summaryAgentWeight', agentWeight.toFixed(1) + ' kg');
        updateElementText('summaryPiping', Math.round(pipingLength) + ' m');
        updateElementText('summaryCurrency', currency);
        
        // Format cost with currency symbol
        const symbol = currencySymbols[currency] || '$';
        const formattedCost = symbol + totalCost.toFixed(2).replace(/\d(?=(\d{3})+\.)/g, '$&,');
        updateElementText('summaryCost', formattedCost);
        
        // Update project info in results nav
        const projectName = document.getElementById('projectName')?.value || 'Project Name';
        const clientName = document.getElementById('clientName')?.value || 'Client Name';
        
        updateElementText('resultProjectName', projectName);
        updateElementText('resultClientName', clientName);
    }
    
    /**
     * Perform the full calculation
     */
    function performCalculation() {
        // Get all form values
        const projectName = document.getElementById('projectName')?.value || 'Unnamed Project';
        const clientName = document.getElementById('clientName')?.value || 'Unnamed Client';
        const projectLocation = document.getElementById('projectLocation')?.value || '';
        const hoodLength = parseFloat(document.getElementById('hoodLength')?.value) || 0;
        const hoodDepth = parseFloat(document.getElementById('hoodDepth')?.value) || 0;
        const plenumSections = parseInt(document.getElementById('plenumSections')?.value) || 0;
        const ductSections = parseInt(document.getElementById('ductSections')?.value) || 0;
        const currency = document.getElementById('currency')?.value || 'USD';
        
        // Expert mode values
        const hoodMaterial = document.getElementById('hoodMaterial')?.value || 'stainless';
        const ductLength = parseFloat(document.getElementById('ductLength')?.value) || 5.0;
        const nozzleType = document.getElementById('nozzleType')?.value || 'standard';
        const pipeMaterial = document.getElementById('pipeMaterial')?.value || 'galvanized';
        const safetyFactor = parseInt(document.getElementById('safetyFactor')?.value) || 10;
        const pressureRating = parseInt(document.getElementById('pressureRating')?.value) || 100;
        const additionalNotes = document.getElementById('additionalNotes')?.value || '';
        
        // Validate required fields
        if (!projectName.trim() || !clientName.trim()) {
            alert('Please fill in Project Name and Client Name');
            return;
        }
        
        if (hoodLength <= 0 || hoodDepth <= 0) {
            alert('Please enter valid hood dimensions');
            return;
        }
        
        // Get selected appliances
        const selectedAppliances = [];
        const selectedApplianceItems = document.querySelectorAll('.appliance-item.selected');
        
        selectedApplianceItems.forEach(item => {
            const applianceId = item.dataset.id;
            const appliance = standardAppliances.find(a => a.id === applianceId);
            if (appliance) {
                selectedAppliances.push({
                    id: appliance.id,
                    name: appliance.name,
                    nozzles: appliance.nozzles,
                    price: appliance.price
                });
            }
        });
        
        // Calculate everything
        const hoodArea = hoodLength * hoodDepth;
        const applianceNozzles = selectedAppliances.reduce((sum, app) => sum + app.nozzles, 0);
        const totalNozzles = plenumSections + ductSections + applianceNozzles;
        const cylindersRequired = Math.ceil(totalNozzles / 6);
        const agentWeight = cylindersRequired * 5.7;
        const pipingLength = (totalNozzles * 2) + 5 + (expertMode ? ductLength : 0);
        
        // Calculate costs
        let subtotals = {
            nozzles: totalNozzles * pricing.nozzle,
            cylinders: cylindersRequired * (cylindersRequired > 1 ? pricing.cylinder_10kg : pricing.cylinder_5kg),
            piping: pipingLength * pricing.piping_per_meter,
            hoodAgentTank: pricing.hood_agent_tank,
            manualRelease: pricing.manual_release,
            installationLabor: pricing.installation_labor,
            commissioning: pricing.commissioning,
            appliances: selectedAppliances.reduce((sum, app) => sum + app.price, 0)
        };
        
        // Apply safety factor
        const safetyMultiplier = 1 + (safetyFactor / 100);
        Object.keys(subtotals).forEach(key => {
            subtotals[key] *= safetyMultiplier;
        });
        
        // Calculate total
        let totalCost = Object.values(subtotals).reduce((sum, val) => sum + val, 0);
        
        // Apply currency conversion
        const exchangeRate = exchangeRates[currency] || 1;
        totalCost *= exchangeRate;
        
        // Create calculation object
        currentCalculation = {
            id: Date.now(),
            timestamp: new Date().toISOString(),
            project: {
                name: projectName,
                client: clientName,
                location: projectLocation,
                currency: currency
            },
            configuration: {
                hood: {
                    length: hoodLength,
                    depth: hoodDepth,
                    area: hoodArea,
                    material: hoodMaterial,
                    plenumSections: plenumSections,
                    ductSections: ductSections,
                    ductLength: ductLength
                },
                appliances: selectedAppliances,
                system: {
                    nozzleType: nozzleType,
                    pipeMaterial: pipeMaterial,
                    safetyFactor: safetyFactor,
                    pressureRating: pressureRating,
                    additionalNotes: additionalNotes
                }
            },
            results: {
                nozzles: {
                    plenum: plenumSections,
                    duct: ductSections,
                    appliances: applianceNozzles,
                    total: totalNozzles
                },
                cylinders: cylindersRequired,
                agentWeight: agentWeight,
                pipingLength: pipingLength,
                subtotals: subtotals,
                totalCost: totalCost,
                exchangeRate: exchangeRate
            }
        };
        
        // Save to localStorage
        localStorage.setItem('kfss_last_calculation', JSON.stringify(currentCalculation));
        
        // Add to recent calculations
        addToRecentCalculations(currentCalculation);
        
        // Update UI
        updateRecentCalculationsDisplay();
        
        // Redirect to results page
        window.location.href = 'results.html';
    }
    
    /**
     * Add custom appliance
     */
    function addCustomAppliance() {
        const nameInput = document.getElementById('customAppliance');
        const nozzlesInput = document.getElementById('customNozzles');
        const applianceList = document.getElementById('applianceList');
        
        const name = nameInput.value.trim();
        const nozzles = parseInt(nozzlesInput.value) || 1;
        
        if (!name) {
            alert('Please enter appliance name');
            return;
        }
        
        if (nozzles < 1 || nozzles > 5) {
            alert('Please enter nozzle count between 1-5');
            return;
        }
        
        // Create custom appliance item
        const item = document.createElement('div');
        item.className = 'appliance-item selected';
        item.dataset.id = 'custom-' + Date.now();
        item.dataset.nozzles = nozzles;
        item.dataset.price = nozzles * 600; // Estimate price
        
        item.innerHTML = `
            <div class="appliance-name">${name} (Custom)</div>
            <div class="appliance-nozzles">${nozzles} nozzle${nozzles > 1 ? 's' : ''}</div>
        `;
        
        item.addEventListener('click', function() {
            this.classList.toggle('selected');
            updateSummary();
        });
        
        applianceList.appendChild(item);
        
        // Clear inputs
        nameInput.value = '';
        nozzlesInput.value = '1';
        
        // Update summary
        updateSummary();
    }
    
    /**
     * Reset calculator to default values
     */
    function resetCalculator() {
        if (!confirm('Are you sure you want to reset all inputs to default values?')) {
            return;
        }
        
        // Reset form inputs
        document.getElementById('projectName').value = 'Commercial Kitchen Design';
        document.getElementById('clientName').value = 'Restaurant Corporation';
        document.getElementById('projectLocation').value = '';
        document.getElementById('hoodLength').value = '3.0';
        document.getElementById('hoodDepth').value = '1.2';
        document.getElementById('plenumSections').value = '2';
        document.getElementById('ductSections').value = '1';
        document.getElementById('currency').value = 'USD';
        
        // Reset expert fields
        document.getElementById('hoodMaterial').value = 'stainless';
        document.getElementById('ductLength').value = '5.0';
        document.getElementById('nozzleType').value = 'standard';
        document.getElementById('pipeMaterial').value = 'galvanized';
        document.getElementById('safetyFactor').value = '10';
        document.getElementById('pressureRating').value = '100';
        document.getElementById('additionalNotes').value = '';
        
        // Deselect all appliances
        document.querySelectorAll('.appliance-item.selected').forEach(item => {
            item.classList.remove('selected');
        });
        
        // Clear custom appliances
        const customAppliances = document.querySelectorAll('.appliance-item[data-id^="custom-"]');
        customAppliances.forEach(item => item.remove());
        
        // Clear current calculation
        currentCalculation = null;
        localStorage.removeItem('kfss_last_calculation');
        
        // Update UI
        updateSummary();
        updateRecentCalculationsDisplay();
    }
    
    /**
     * Update form from saved calculation
     */
    function updateFormFromCalculation() {
        if (!currentCalculation) return;
        
        const calc = currentCalculation;
        
        // Update project info
        document.getElementById('projectName').value = calc.project.name;
        document.getElementById('clientName').value = calc.project.client;
        document.getElementById('projectLocation').value = calc.project.location || '';
        document.getElementById('currency').value = calc.project.currency;
        
        // Update hood configuration
        document.getElementById('hoodLength').value = calc.configuration.hood.length;
        document.getElementById('hoodDepth').value = calc.configuration.hood.depth;
        document.getElementById('plenumSections').value = calc.configuration.hood.plenumSections;
        document.getElementById('ductSections').value = calc.configuration.hood.ductSections;
        
        // Update expert fields if available
        if (calc.configuration.hood.material) {
            document.getElementById('hoodMaterial').value = calc.configuration.hood.material;
        }
        if (calc.configuration.hood.ductLength) {
            document.getElementById('ductLength').value = calc.configuration.hood.ductLength;
        }
        if (calc.configuration.system.nozzleType) {
            document.getElementById('nozzleType').value = calc.configuration.system.nozzleType;
        }
        if (calc.configuration.system.pipeMaterial) {
            document.getElementById('pipeMaterial').value = calc.configuration.system.pipeMaterial;
        }
        if (calc.configuration.system.safetyFactor) {
            document.getElementById('safetyFactor').value = calc.configuration.system.safetyFactor;
        }
        if (calc.configuration.system.pressureRating) {
            document.getElementById('pressureRating').value = calc.configuration.system.pressureRating;
        }
        if (calc.configuration.system.additionalNotes) {
            document.getElementById('additionalNotes').value = calc.configuration.system.additionalNotes;
        }
        
        // Update appliances (simplified - would need more complex logic for full restoration)
        // For now, just update the summary
        
        updateSummary();
    }
    
    /**
     * Add calculation to recent list
     */
    function addToRecentCalculations(calculation) {
        // Add to beginning of array
        recentCalculations.unshift(calculation);
        
        // Keep only last 5
        if (recentCalculations.length > 5) {
            recentCalculations = recentCalculations.slice(0, 5);
        }
        
        // Save to localStorage
        localStorage.setItem('kfss_recent_calculations', JSON.stringify(recentCalculations));
    }
    
    /**
     * Load recent calculations from localStorage
     */
    function loadRecentCalculations() {
        try {
            const saved = localStorage.getItem('kfss_recent_calculations');
            if (saved) {
                recentCalculations = JSON.parse(saved);
            }
        } catch (e) {
            console.error('Failed to load recent calculations:', e);
            recentCalculations = [];
        }
        
        updateRecentCalculationsDisplay();
    }
    
    /**
     * Update recent calculations display
     */
    function updateRecentCalculationsDisplay() {
        const container = document.getElementById('recentCalculations');
        if (!container) return;
        
        if (recentCalculations.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-clock"></i>
                    <p>No recent calculations</p>
                    <small>Your calculations will appear here</small>
                </div>
            `;
            return;
        }
        
        let html = '<div class="recent-list">';
        
        recentCalculations.forEach((calc, index) => {
            const date = new Date(calc.timestamp);
            const formattedDate = date.toLocaleDateString();
            const formattedTime = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
            
            const symbol = currencySymbols[calc.project.currency] || '$';
            const formattedCost = symbol + calc.results.totalCost.toFixed(0);
            
            html += `
                <div class="recent-item" data-id="${calc.id}">
                    <div class="recent-project">${calc.project.name}</div>
                    <div class="recent-details">
                        <span>${calc.results.nozzles.total} nozzles</span>
                        <span>•</span>
                        <span>${formattedCost}</span>
                        <span>•</span>
                        <span>${formattedDate}</span>
                    </div>
                    <button class="btn-recent-load" data-id="${calc.id}">
                        <i class="fas fa-undo"></i> Load
                    </button>
                </div>
            `;
        });
        
        html += '</div>';
        
        container.innerHTML = html;
        
        // Add event listeners to load buttons
        container.querySelectorAll('.btn-recent-load').forEach(button => {
            button.addEventListener('click', function() {
                const id = parseInt(this.dataset.id);
                loadRecentCalculation(id);
            });
        });
    }
    
    /**
     * Load a recent calculation
     */
    function loadRecentCalculation(id) {
        const calculation = recentCalculations.find(calc => calc.id === id);
        if (!calculation) return;
        
        currentCalculation = calculation;
        localStorage.setItem('kfss_last_calculation', JSON.stringify(calculation));
        updateFormFromCalculation();
        
        alert(`Loaded calculation: ${calculation.project.name}`);
    }
    
    /**
     * Display results on results.html
     */
    function displayResults() {
        const container = document.getElementById('resultsContent');
        const loading = document.getElementById('loadingResults');
        const noResults = document.getElementById('noResults');
        
        if (!container) return;
        
        // Try to load calculation
        try {
            const saved = localStorage.getItem('kfss_last_calculation');
            if (!saved) {
                if (loading) loading.style.display = 'none';
                if (noResults) noResults.style.display = 'block';
                return;
            }
            
            currentCalculation = JSON.parse(saved);
            
            // Hide loading, show results
            if (loading) loading.style.display = 'none';
            
            // Generate results HTML
            const resultsHTML = generateResultsHTML(currentCalculation);
            container.insertAdjacentHTML('beforeend', resultsHTML);
            
        } catch (error) {
            console.error('Error loading results:', error);
            if (loading) loading.style.display = 'none';
            if (noResults) noResults.style.display = 'block';
        }
    }
    
    /**
     * Generate HTML for results display
     */
    function generateResultsHTML(calculation) {
        const calc = calculation;
        const symbol = currencySymbols[calc.project.currency] || '$';
        const exchangeRate = calc.results.exchangeRate || 1;
        
        // Format costs
        const formatCost = (amount) => {
            return symbol + (amount * exchangeRate).toFixed(2);
        };
        
        // Generate appliance list
        let applianceListHTML = '';
        if (calc.configuration.appliances && calc.configuration.appliances.length > 0) {
            calc.configuration.appliances.forEach(appliance => {
                applianceListHTML += `
                    <div class="appliance-result-item">
                        <span>${appliance.name}</span>
                        <span>${appliance.nozzles} nozzle${appliance.nozzles > 1 ? 's' : ''}</span>
                        <span>${formatCost(appliance.price)}</span>
                    </div>
                `;
            });
        } else {
            applianceListHTML = '<p class="no-data-text">No appliances selected</p>';
        }
        
        // Generate cost breakdown
        let costBreakdownHTML = '';
        const subtotals = calc.results.subtotals;
        Object.keys(subtotals).forEach(key => {
            const label = key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase());
            costBreakdownHTML += `
                <div class="cost-item">
                    <span>${label}</span>
                    <span>${formatCost(subtotals[key])}</span>
                </div>
            `;
        });
        
        return `
            <div class="results-container">
                <!-- Project Info -->
                <div class="card">
                    <h3 class="card-title"><i class="fas fa-info-circle"></i> Project Information</h3>
                    <div class="project-details-grid">
                        <div class="detail-item">
                            <strong>Project:</strong> ${calc.project.name}
                        </div>
                        <div class="detail-item">
                            <strong>Client:</strong> ${calc.project.client}
                        </div>
                        <div class="detail-item">
                            <strong>Location:</strong> ${calc.project.location || 'Not specified'}
                        </div>
                        <div class="detail-item">
                            <strong>Currency:</strong> ${calc.project.currency} (${symbol})
                        </div>
                        <div class="detail-item">
                            <strong>Calculation Date:</strong> ${new Date(calc.timestamp).toLocaleString()}
                        </div>
                    </div>
                </div>
                
                <!-- System Configuration -->
                <div class="card">
                    <h3 class="card-title"><i class="fas fa-cogs"></i> System Configuration</h3>
                    <div class="configuration-grid">
                        <div class="config-section">
                            <h4><i class="fas fa-warehouse"></i> Hood & Duct</h4>
                            <div class="config-details">
                                <p>Length: ${calc.configuration.hood.length} m</p>
                                <p>Depth: ${calc.configuration.hood.depth} m</p>
                                <p>Area: ${calc.configuration.hood.area.toFixed(1)} m²</p>
                                <p>Plenum Sections: ${calc.configuration.hood.plenumSections}</p>
                                <p>Duct Openings: ${calc.configuration.hood.ductSections}</p>
                                ${calc.configuration.hood.material ? `<p>Material: ${calc.configuration.hood.material}</p>` : ''}
                            </div>
                        </div>
                        
                        <div class="config-section">
                            <h4><i class="fas fa-utensils"></i> Appliances</h4>
                            <div class="appliance-results">
                                ${applianceListHTML}
                            </div>
                        </div>
                    </div>
                </div>
                
                <!-- Bill of Quantities -->
                <div class="card">
                    <h3 class="card-title"><i class="fas fa-list-ol"></i> Bill of Quantities</h3>
                    <div class="boq-grid">
                        <div class="boq-item">
                            <div class="boq-label">Total Nozzles Required</div>
                            <div class="boq-value">${calc.results.nozzles.total}</div>
                            <div class="boq-details">
                                <small>Plenum: ${calc.results.nozzles.plenum} • Duct: ${calc.results.nozzles.duct} • Appliances: ${calc.results.nozzles.appliances}</small>
                            </div>
                        </div>
                        
                        <div class="boq-item">
                            <div class="boq-label">Cylinders Required</div>
                            <div class="boq-value">${calc.results.cylinders}</div>
                            <div class="boq-details">
                                <small>${calc.results.cylinders > 1 ? '10kg cylinders' : '5kg cylinder'}</small>
                            </div>
                        </div>
                        
                        <div class="boq-item">
                            <div class="boq-label">Wet Chemical Agent</div>
                            <div class="boq-value">${calc.results.agentWeight.toFixed(1)} kg</div>
                        </div>
                        
                        <div class="boq-item">
                            <div class="boq-label">Piping Length</div>
                            <div class="boq-value">${Math.round(calc.results.pipingLength)} m</div>
                            <div class="boq-details">
                                <small>${calc.configuration.system.pipeMaterial || 'Galvanized'} pipe</small>
                            </div>
                        </div>
                    </div>
                </div>
                
                <!-- Cost Breakdown -->
                <div class="card">
                    <h3 class="card-title"><i class="fas fa-money-bill-wave"></i> Cost Breakdown</h3>
                    <div class="cost-breakdown">
                        ${costBreakdownHTML}
                        
                        <div class="cost-total">
                            <strong>Total System Cost</strong>
                            <strong>${formatCost(calc.results.totalCost)}</strong>
                        </div>
                    </div>
                    
                    <div class="action-buttons" style="margin-top: 25px;">
                        <button onclick="window.print()" class="btn btn-primary">
                            <i class="fas fa-print"></i> Print Results
                        </button>
                        <a href="quotation.html" class="btn btn-secondary">
                            <i class="fas fa-file-invoice-dollar"></i> Generate Quotation
                        </a>
                    </div>
                </div>
            </div>
        `;
    }
    
    /**
     * Display quotation on quotation.html
     */
    function displayQuotation() {
        const container = document.getElementById('quotationContent');
        const loading = document.getElementById('loadingQuotation');
        const noQuotation = document.getElementById('noQuotation');
        
        if (!container) return;
        
        // Try to load calculation
        try {
            const saved = localStorage.getItem('kfss_last_calculation');
            if (!saved) {
                if (loading) loading.style.display = 'none';
                if (noQuotation) noQuotation.style.display = 'block';
                return;
            }
            
            currentCalculation = JSON.parse(saved);
            
            // Hide loading, show quotation
            if (loading) loading.style.display = 'none';
            
            // Generate quotation HTML
            const quotationHTML = generateQuotationHTML(currentCalculation);
            container.insertAdjacentHTML('beforeend', quotationHTML);
            
        } catch (error) {
            console.error('Error loading quotation:', error);
            if (loading) loading.style.display = 'none';
            if (noQuotation) noQuotation.style.display = 'block';
        }
    }
    
    /**
     * Generate HTML for quotation
     */
    function generateQuotationHTML(calculation) {
        const calc = calculation;
        const symbol = currencySymbols[calc.project.currency] || '$';
        const exchangeRate = calc.results.exchangeRate || 1;
        
        // Format costs
        const formatCost = (amount) => {
            return symbol + (amount * exchangeRate).toFixed(2);
        };
        
        // Quotation number (generated from timestamp)
        const quoteNumber = 'Q-' + new Date(calc.timestamp).getFullYear() + '-' + 
                           String(new Date(calc.timestamp).getMonth() + 1).padStart(2, '0') + '-' + 
                           String(calc.id).slice(-6);
        
        // Validity date (30 days from now)
        const validityDate = new Date();
        validityDate.setDate(validityDate.getDate() + 30);
        const formattedValidityDate = validityDate.toLocaleDateString();
        
        return `
            <div class="quotation-container">
                <!-- Quotation Header -->
                <div class="card quotation-header-card">
                    <div class="quotation-header-content">
                        <div class="quotation-title">
                            <h1>QUOTATION</h1>
                            <p class="quote-number">Quote No: ${quoteNumber}</p>
                        </div>
                        
                        <div class="quotation-company">
                            <h3>Fire Safety Solutions</h3>
                            <p>123 Safety Street</p>
                            <p>Fire City, FC 12345</p>
                            <p>Phone: (555) 123-4567</p>
                            <p>Email: info@firesafetysolutions.com</p>
                            <p>Website: www.firesafetysolutions.com</p>
                        </div>
                    </div>
                    
                    <div class="quotation-details">
                        <div class="detail-section">
                            <h4>Quotation For:</h4>
                            <p><strong>${calc.project.client}</strong></p>
                            <p>${calc.project.location || 'Address not specified'}</p>
                            <p>Project: ${calc.project.name}</p>
                        </div>
                        
                        <div class="detail-section">
                            <h4>Quotation Details:</h4>
                            <p>Date: ${new Date(calc.timestamp).toLocaleDateString()}</p>
                            <p>Valid Until: ${formattedValidityDate}</p>
                            <p>Currency: ${calc.project.currency}</p>
                            <p>Prepared By: KFSS Calculator</p>
                        </div>
                    </div>
                </div>
                
                <!-- Scope of Work -->
                <div class="card">
                    <h3 class="card-title"><i class="fas fa-clipboard-list"></i> Scope of Work</h3>
                    <p>Supply, installation, and commissioning of a complete wet chemical kitchen fire suppression system including:</p>
                    <ul class="scope-list">
                        <li>Wet chemical suppression system with ${calc.results.cylinders} cylinder${calc.results.cylinders > 1 ? 's' : ''}</li>
                        <li>${calc.results.nozzles.total} discharge nozzles (plenum, duct, and appliance protection)</li>
                        <li>Approximately ${Math.round(calc.results.pipingLength)} meters of piping</li>
                        <li>Manual release station and automatic detection system</li>
                        <li>Professional installation and commissioning</li>
                        <li>System testing and certification</li>
                        <li>Operator training on system use</li>
                    </ul>
                </div>
                
                <!-- Quotation Items -->
                <div class="card">
                    <h3 class="card-title"><i class="fas fa-receipt"></i> Quotation Items</h3>
                    
                    <div class="quotation-table">
                        <div class="table-header">
                            <div class="col-item">Item Description</div>
                            <div class="col-qty">Qty</div>
                            <div class="col-unit">Unit Price</div>
                            <div class="col-total">Total</div>
                        </div>
                        
                        <div class="table-row">
                            <div class="col-item">Wet Chemical Cylinder System (${calc.results.cylinders > 1 ? '10kg' : '5kg})</div>
                            <div class="col-qty">${calc.results.cylinders}</div>
                            <div class="col-unit">${formatCost(calc.results.cylinders > 1 ? 1900 : 1200)}</div>
                            <div class="col-total">${formatCost(calc.results.subtotals.cylinders)}</div>
                        </div>
                        
                        <div class="table-row">
                            <div class="col-item">Discharge Nozzles (various types)</div>
                            <div class="col-qty">${calc.results.nozzles.total}</div>
                            <div class="col-unit">${formatCost(85)}</div>
                            <div class="col-total">${formatCost(calc.results.subtotals.nozzles)}</div>
                        </div>
                        
                        <div class="table-row">
                            <div class="col-item">Piping & Fittings (${calc.configuration.system.pipeMaterial || 'Galvanized'})</div>
                            <div class="col-qty">${Math.round(calc.results.pipingLength)} m</div>
                            <div class="col-unit">${formatCost(35)}/m</div>
                            <div class="col-total">${formatCost(calc.results.subtotals.piping)}</div>
                        </div>
                        
                        <div class="table-row">
                            <div class="col-item">Hood & Agent Tank Assembly</div>
                            <div class="col-qty">1</div>
                            <div class="col-unit">${formatCost(1800)}</div>
                            <div class="col-total">${formatCost(calc.results.subtotals.hoodAgentTank)}</div>
                        </div>
                        
                        <div class="table-row">
                            <div class="col-item">Manual Release Station</div>
                            <div class="col-qty">1</div>
                            <div class="col-unit">${formatCost(250)}</div>
                            <div class="col-total">${formatCost(calc.results.subtotals.manualRelease)}</div>
                        </div>
                        
                        <div class="table-row">
                            <div class="col-item">Professional Installation</div>
                            <div class="col-qty">1</div>
                            <div class="col-unit">${formatCost(850)}</div>
                            <div class="col-total">${formatCost(calc.results.subtotals.installationLabor)}</div>
                        </div>
                        
                        <div class="table-row">
                            <div class="col-item">System Commissioning & Testing</div>
                            <div class="col-qty">1</div>
                            <div class="col-unit">${formatCost(400)}</div>
                            <div class="col-total">${formatCost(calc.results.subtotals.commissioning)}</div>
                        </div>
                        
                        ${calc.configuration.appliances && calc.configuration.appliances.length > 0 ? `
                        <div class="table-row category-header">
                            <div class="col-item">Appliance Protection</div>
                            <div class="col-qty"></div>
                            <div class="col-unit"></div>
                            <div class="col-total"></div>
                        </div>
                        ${calc.configuration.appliances.map(appliance => `
                            <div class="table-row">
                                <div class="col-item">${appliance.name} Protection</div>
                                <div class="col-qty">${appliance.nozzles}</div>
                                <div class="col-unit">${formatCost(appliance.price / appliance.nozzles)}</div>
                                <div class="col-total">${formatCost(appliance.price)}</div>
                            </div>
                        `).join('')}
                        ` : ''}
                        
                        <div class="table-row total-row">
                            <div class="col-item"><strong>SUBTOTAL</strong></div>
                            <div class="col-qty"></div>
                            <div class="col-unit"></div>
                            <div class="col-total"><strong>${formatCost(calc.results.totalCost / 1.1)}</strong></div>
                        </div>
                        
                        <div class="table-row">
                            <div class="col-item">Safety Factor (${calc.configuration.system.safetyFactor || 10}%)</div>
                            <div class="col-qty"></div>
                            <div class="col-unit"></div>
                            <div class="col-total">${formatCost(calc.results.totalCost * 0.1)}</div>
                        </div>
                        
                        <div class="table-row grand-total">
                            <div class="col-item"><strong>TOTAL QUOTATION AMOUNT</strong></div>
                            <div class="col-qty"></div>
                            <div class="col-unit"></div>
                            <div class="col-total"><strong>${formatCost(calc.results.totalCost)}</strong></div>
                        </div>
                    </div>
                </div>
                
                <!-- Terms & Conditions -->
                <div class="card">
                    <h3 class="card-title"><i class="fas fa-file-contract"></i> Terms & Conditions</h3>
                    <div class="terms-content">
                        <ol>
                            <li>This quotation is valid for 30 days from the date issued.</li>
                            <li>Prices are in ${calc.project.currency} and include all standard components.</li>
                            <li>Installation timeline: 2-3 weeks from order confirmation.</li>
                            <li>Payment terms: 50% advance, 50% upon completion.</li>
                            <li>Warranty: 12 months on all parts and labor.</li>
                            <li>Annual maintenance contract available separately.</li>
                            <li>All work complies with NFPA 96 and NFPA 17A standards.</li>
                            <li>Any changes to scope may affect final price and timeline.</li>
                        </ol>
                        
                        <div class="signature-section">
                            <div class="signature-block">
                                <p>For Fire Safety Solutions</p>
                                <div class="signature-line"></div>
                                <p>Authorized Signature</p>
                            </div>
                            
                            <div class="acceptance-block">
                                <p>Accepted By:</p>
                                <div class="signature-line"></div>
                                <p>Client Signature</p>
                            </div>
                        </div>
                    </div>
                    
                    <div class="action-buttons" style="margin-top: 30px;">
                        <button onclick="window.print()" class="btn btn-primary btn-lg">
                            <i class="fas fa-print"></i> Print Quotation
                        </button>
                        <a href="results.html" class="btn btn-outline">
                            <i class="fas fa-arrow-left"></i> Back to Results
                        </a>
                    </div>
                </div>
            </div>
        `;
    }
    
    /**
     * Helper function to update element text
     */
    function updateElementText(id, text) {
        const element = document.getElementById(id);
        if (element) {
            element.textContent = text;
        }
    }
    
    // Public API
    return {
        init: init,
        performCalculation: performCalculation,
        displayResults: displayResults,
        displayQuotation: displayQuotation,
        resetCalculator: resetCalculator,
        updateSummary: updateSummary
    };
})();
