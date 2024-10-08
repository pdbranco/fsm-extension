//
// Update html dom with provided string value
//
const updateUI = (text) =>
    (document.querySelectorAll('#info')[0].innerText = text);

//
// Loop before a token expire to fetch a new one
//
function initializeRefreshTokenStrategy(shellSdk, auth) {

    shellSdk.on(SHELL_EVENTS.Version1.REQUIRE_AUTHENTICATION, (event) => {
        sessionStorage.setItem('tokenPwa', event.access_token);
        setTimeout(() => fetchTokenPWA(), (event.expires_in * 500));
    });

    function fetchTokenPWA() {
        shellSdk.emit(SHELL_EVENTS.Version1.REQUIRE_AUTHENTICATION, {
            response_type: 'token' // request a user token within the context
        });
    }

    sessionStorage.setItem('tokenPwa', auth.access_token);
    setTimeout(() => fetchTokenPWA(), (auth.expires_in * 500));
}

//GET OBJECT PWAS
function getPWAs(cloudHost, account, company, shellSdk) {	
	const headers = {
	    'Content-Type': 'application/json',
	    'X-Client-ID': 'fsm-extension-pwa',
	    'X-Client-Version': '1.0.0',
	    'Authorization': `bearer ${sessionStorage.getItem('tokenPwa')}`,
	};
	return new Promise((resolve, reject) => {
	    fetch(`https://${cloudHost}/api/query/v1?&account=${account}&company=${company}&dtos=UdoMeta.10;UdoValue.10`, {
		    method: 'POST',
		    headers,
		    body: JSON.stringify({
			"query": "select pwa.id, pwa.udfValues, ud.id from UdoValue pwa join UdoMeta ud on ud.id = pwa.meta where ud.name = 'PWA'"
		    }),
		})
		.then(response => {
		    if (!response.ok) {
			throw new Error(`Error: ${response.status}`);
		    }
		    return response.json();
		})
		.then(function(json) {
		    displayDataTable(json.data, cloudHost, account, company);
		    resolve();
		})
		.catch(error => {
		    console.error('Error:', error);
		    reject(error);
		});
	});
}

async function getGroupPolicy(cloudHost, account, company, shellSdk, user) {
    try {
        const headers = {
            'Content-Type': 'application/json',
            'X-Client-ID': 'fsm-extension-pwa',
            'X-Client-Version': '1.0',
            'Authorization': `bearer ${sessionStorage.getItem('tokenPwa')}`,
        };

        const response = await fetch(`https://${cloudHost}/api/query/v1?&account=${account}&company=${company}&dtos=UnifiedPerson.13`, {
            method: 'POST',
            headers,
            body: JSON.stringify({"query": `SELECT up.udf.UnifiedPerson_PolicyGroup FROM UnifiedPerson up WHERE up.userName = '${user}'`}),
        });

        if (!response.ok) {
		if (response.status === 401) {
		    updateMsgErrorToken('The token has expired, please refresh the page to access it again');
		    return;
		}
		throw new Error(`Error: ${response.status}`);
        }

        const data = await response.json();

        if (data.data && data.data.length > 0 && data.data[0].up && data.data[0].up.udfValues && data.data[0].up.udfValues.length > 0) {
            return data.data[0].up.udfValues[0].value;
        } else {
            throw new Error('Policy Group not found in the response');
        }
    } catch (error) {
        console.error('Error:', error);
        throw error;
    }
}

// GET URL PARAMETERS
function getParameters() {
    const queryString = window.location.search;
    const urlParams = new URLSearchParams(queryString);
    const id = urlParams.get('id')
    return (id)
}

// Function to filter table rows based on search term
function filterTable() {

    const tableBody = document.getElementById('itemList');
    const searchInput = document.getElementById('searchInput');

    const searchTerm = searchInput.value.toLowerCase();
    const tableRows = tableBody.querySelectorAll('tr');
    for (const row of tableRows) {
        const nameCell = row.textContent.toLowerCase();
        const shouldShowRow = nameCell.includes(searchTerm);
        row.style.display = shouldShowRow ? '' : 'none';
    }
}

//CREATE TABLE
function displayDataTable(data, cloudHost, account, company) {

    if (sessionStorage.getItem('idMetaPWA') == null) {
        getIdCustomObject(cloudHost, account, company, 'PWA')
    }

    if (data.length === 0) return;
    if (document.getElementById('itemList')) return;

    data.sort(compareByPWAName);

    sessionStorage.setItem('idMetaPWA', data[0].ud.id);

    // Create the table element
    const table = document.createElement('table');
    table.setAttribute("id", "itemList");

    // Loop through data and create table rows
    for (const item of data) {
        const row = item.pwa; // Accessing 'pwa' object from each item in 'data'
        const tableRow = document.createElement('tr');

        // Find the udfValue with name 'PWA_Name'
        const udfNameValue = row.udfValues.find(value => value.name === 'pwa_Name');

        if (udfNameValue) {
            // Create cell for 'pwa_Name' value
            const cell = document.createElement('td');
            cell.textContent = udfNameValue.value;
            tableRow.appendChild(cell);

            // Add click event listener to each row for redirection
            tableRow.addEventListener('click', () => {
                window.location.href = `detailsPWA.html?id=${row.id}`;
            });

            table.appendChild(tableRow);
        }
    }
    document.body.appendChild(table);
}

// GET PWA DETAILS ASSYNC
async function getPWADetails(cloudHost, account, company, id) {

    const headers = {
        'Content-Type': 'application/json',
        'X-Client-ID': 'fsm-extension-pwa',
        'X-Client-Version': '1.0.0',
        'Authorization': `bearer ${sessionStorage.getItem('tokenPwa')}`,
    };

    try {
        const response = await fetch(`https://${cloudHost}/api/query/v1?&account=${account}&company=${company}&dtos=UdoValue.10`, {
            method: 'POST',
            headers,
            body: JSON.stringify({
                "query": `select pwa.id, pwa.udfValues from UdoValue pwa where pwa.id = '${id}'`
            })
        });

        if (!response.ok) {
            throw new Error(`Error: ${response.status} ${response.statusText}`);
        }

        const json = await response.json();
        // CALL THE FUNCTION TO FILL IN THE FORM
        prefillForm(json);

    } catch (error) {
        console.error('Failed to fetch pwa details:', error);
    }
}

// FUNCTION TO PRE-FILL THE FORM
function prefillForm(data) {
    const form = document.getElementById('myForm');
    const values = data.data[0].pwa.udfValues;

    values.forEach(item => {
        switch (item.name) {
            case 'pwa_Name':
                form.elements['name'].value = item.value;
                break;
            case 'pwa_PWAIdEAM':
                form.elements['pwaIdEAM'].value = item.value;
                break;
            case 'pwa_PWAPolygons':
                const ListPolygons = Array.from(form.elements['listPolygons[]'].options);
                const selectedValues = item.value.split(',');
                selectedValues.forEach(selectedValue => {
                    ListPolygons.forEach(option => {
                        if (option.value.trim() === selectedValue.trim()) {
                            option.selected = true;
                        }
                    });
                });
                break;
        }
    });
}

function submitPWAAsync(cloudHost, account, company, id, document, shellSdk) {
    
    shellSdk.emit(SHELL_EVENTS.Version1.REQUIRE_AUTHENTICATION, {
        response_type: 'token'
    });
	
    shellSdk.on(SHELL_EVENTS.Version1.REQUIRE_AUTHENTICATION, (event) => {

        sessionStorage.setItem('tokenPwa', event.access_token);
		const headers = {
			'Content-Type': 'application/json',
			'X-Client-ID': 'fsm-extension-pwa',
			'X-Client-Version': '1.0.0',
			'Authorization': `bearer ${sessionStorage.getItem('tokenPwa')}`,
		};
		const url = id === 'new' ?
			`https://${cloudHost}/api/data/v4/UdoValue?dtos=UdoValue.10&account=${account}&company=${company}` :
			`https://${cloudHost}/api/data/v4/UdoValue/${id}?dtos=UdoValue.10&account=${account}&company=${company}&forceUpdate=true`;
		const method = id === 'new' ? 'POST' : 'PATCH';
		const name = document.getElementById('name').value;
		const pwaIdEAM = document.getElementById('pwaIdEAM').value;
		const listPolygons = Array.from(document.getElementById('listPolygons').selectedOptions).map(option => option.value);

		// Execute validation of mandatory fields
		const validationError = validateForm(name, pwaIdEAM, listPolygons);
		if (validationError) {
			updateMsgError(validationError);
			return Promise.reject(new Error(validationError)); // Prevents form submission
		}

		const data = {
			"meta": `${sessionStorage.getItem('idMetaPWA')}`,
			"externalId": `${pwaIdEAM}`,
			"udfValues": [{
					"meta": {
						"externalId": "pwa_Name"
					},
					"value": `${name}`
				},
				{
					"meta": {
						"externalId": "pwa_PWAIdEAM"
					},
					"value": `${pwaIdEAM}`
				},
				{
					"meta": {
						"externalId": "pwa_PWAPolygons"
					},
					"value": `${listPolygons}`
				}
			]
		};

		return fetch(url, {
			method,
			headers,
			body: JSON.stringify(data),
		})
		.then(response => {
			if (!response.ok) {
				return response.json().then(errorData => {
					let errorMessage = `Error: ${response.status} ${response.statusText}`;
					let errorScreen = 'Error: ';
					let specificError;
					if (errorData && errorData.children && errorData.children.length > 0) {
						specificError = errorData.children[0].message;
						if (specificError) {
							errorMessage += ` - ${specificError}`;
							errorScreen += `${specificError}`;
						}
					} else if (errorData && errorData.message) {
						specificError = errorData.message;
						if (specificError) {
							errorMessage += ` - ${specificError}`;
							errorScreen += `${specificError}`;
						}
					} else if (response.status === 401){
						errorScreen += 'The token has expired, please refresh the page to access it again';
					}
					
					console.error('Error: ', errorMessage);
					throw new Error(errorScreen);
				});
			}
			// Displays success message and redirects to main page after 2 seconds
			updateMsgError("");
			updateMsgSuccess(`Form ${id === 'new' ? 'submitted' : 'updated'} successfully!`);
			setTimeout(() => history.back(), 2000);
		})
		.catch(error => {
			updateMsgError(error.message);
			throw error; // Re-throw the error to be handled by the caller if needed
		});
	});
}

function populateSelect(selectId, options) {
    const selectElement = document.getElementById(selectId);
    selectElement.innerHTML = '';

    function sortAlphanumeric(a, b) {
        return a.localeCompare(b, undefined, {
            numeric: true,
            sensitivity: 'base'
        });
    }

    const sortedKeys = Object.keys(options).sort(sortAlphanumeric);

    sortedKeys.forEach(key => {
        const option = document.createElement('option');
        option.value = key;
        option.text = options[key];
        selectElement.appendChild(option);
    });
}

function populateComboBox(response) {
    const data = response.data;
    data.forEach(item => {
        const {
            selectionKeyValues,
            externalId
        } = item.meta;

        populateSelect('listPolygons', selectionKeyValues);

    });
}

// GET OPTIONS POLYGONS ASSYNC
function getOptionPolygons(cloudHost, account, company, id, shellSdk) {

    shellSdk.emit(SHELL_EVENTS.Version1.REQUIRE_AUTHENTICATION, {
        response_type: 'token'
    });

    shellSdk.on(SHELL_EVENTS.Version1.REQUIRE_AUTHENTICATION, (event) => {

        sessionStorage.setItem('tokenPwa', event.access_token);
        const headers = {
            'Content-Type': 'application/json',
            'X-Client-ID': 'fsm-extension-pwa',
            'X-Client-Version': '1.0.0',
            'Authorization': `bearer ${sessionStorage.getItem('tokenPwa')}`,
        };

        return new Promise((resolve, reject) => {

            fetch(`https://${cloudHost}/api/query/v1?&account=${account}&company=${company}&dtos=UdfMeta.20`, {
                    method: 'POST',
                    headers,
                    body: JSON.stringify({
                        "query": "select meta.externalId, meta.selectionKeyValues from UdfMeta meta where meta.externalId = 'pwa_PWAPolygons'"
                    })
                })
                .then(response => {
			if (!response.ok) {
				if (response.status === 401) {
				    updateMsgError('The token has expired, please refresh the page to access it again'); 
				    return;
				}
				throw new Error(`Error: ${response.status}`);
			}
			return response.json();
		})
                .then(function(json) {
                    populateComboBox(json);
                    if (id != 'new') {
                        getPWADetails(cloudHost, account, company, id);
                    }
                    resolve();
                })
		.catch(error => {
			console.error('Error:', error);
			reject(error);
		});
        });
    });
}


// VALIDATION OF MANDATORY FIELDS
function validateForm(name, pwaIdEAM, listPolygons) {
    if (!name) return '* Name is mandatory';
    if (!pwaIdEAM) return '* EAM ID is mandatory';
    if (listPolygons.length === 0) return '* At least one of the polygons must be selected';

    return null;
}

// DELETE PWA
function deletePWA(cloudHost, account, company, id, shellSdk) {
    
	shellSdk.emit(SHELL_EVENTS.Version1.REQUIRE_AUTHENTICATION, {
        response_type: 'token'
    });
	
    shellSdk.on(SHELL_EVENTS.Version1.REQUIRE_AUTHENTICATION, (event) => {

		sessionStorage.setItem('tokenPwa', event.access_token);
		const headers = {
			'Content-Type': 'application/json',
			'X-Client-ID': 'fsm-extension-pwa',
			'X-Client-Version': '1.0.0',
			'Authorization': `bearer ${sessionStorage.getItem('tokenPwa')}`,
		};

		return new Promise((resolve, reject) => {
			fetch(`https://${cloudHost}/api/data/v4/UdoValue/${id}?forceDelete=true&account=${account}&company=${company}`, {
				method: 'DELETE',
				headers,
				body: ''
			})
			.then(response => {
				if (!response.ok) {
					if (response.status === 401) {
						updateMsgError('The token has expired, please refresh the page to access it again');
					} else {
						updateMsgError(`Error: ${response.status} ${response.statusText}`);
					}
					throw new Error(`Error: ${response.status} ${response.statusText}`);
				}
				history.back();
				resolve();
			})
			.catch(error => {
				console.error('Error:', error);
				reject(error);
			});
		});
	});
}

const updateMsgErrorToken = (text) =>
    (document.querySelectorAll('#infoErrorToken')[0].innerText = text);

const updateMsgError = (text) =>
    (document.querySelectorAll('#infoError')[0].innerText = text);

const updateMsgSuccess = (text) =>
    (document.querySelectorAll('#infoSuccess')[0].innerText = text);

// GET ID CUSTOMOBJECT
function getIdCustomObject(cloudHost, account, company, nameObject) {

    const headers = {
        'Content-Type': 'application/json',
        'X-Client-ID': 'fsm-extension-pwa',
        'X-Client-Version': '1.0.0',
        'Authorization': `bearer ${sessionStorage.getItem('tokenPwa')}`,
    };

    return new Promise(resolve => {

        fetch(`https://${cloudHost}/api/query/v1?&account=${account}&company=${company}&dtos=UdoMeta.10`, {
                method: 'POST',
                headers,
                body: JSON.stringify({
                    "query": `select ud.id from UdoMeta ud where ud.name = '${nameObject}'`
                }),
            })
            .then(response => response.json())
            .then(function(json) {
                sessionStorage.setItem('idMetaPWA', json.data[0].ud.id);
                resolve();
            });
    });
}

document.addEventListener('DOMContentLoaded', function() {
    const form = document.getElementById('myForm');
    const buttonSubmit = document.getElementById('createOrUpdatePWA');

    if (form && buttonSubmit) {
        let formChanged = false;

        function checkChange() {
            formChanged = true;
            buttonSubmit.disabled = false;
        }

        const fields = form.querySelectorAll('select, textarea');
        fields.forEach(field => {
            field.addEventListener('change', checkChange);
            field.addEventListener('input', checkChange);
        });

        form.addEventListener('submit', function() {
            formChanged = false;
            buttonSubmit.disabled = true;
        });
    }
});

function compareByPWAName(a, b) {
    const nomeA = a.pwa.udfValues.find(udf => udf.name === "pwa_Name").value.toLowerCase();
    const nomeB = b.pwa.udfValues.find(udf => udf.name === "pwa_Name").value.toLowerCase();

    return nomeA.localeCompare(nomeB, undefined, {
        numeric: true,
        sensitivity: 'base'
    });
}
