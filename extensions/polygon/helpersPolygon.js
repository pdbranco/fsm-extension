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
    sessionStorage.setItem('token', event.access_token);
    setTimeout(() => fetchTokenPolygon(), (event.expires_in * 1000) - 5000);
  });

  function fetchTokenPolygon() {
    shellSdk.emit(SHELL_EVENTS.Version1.REQUIRE_AUTHENTICATION, {
      response_type: 'token'  // request a user token within the context
    });
  }

  sessionStorage.setItem('token', auth.access_token);
  setTimeout(() => fetchTokenPolygon(), (auth.expires_in * 1000) - 5000);
}

//GET OBJECT POLYGONS
function getPolygons(cloudHost, account, company) {
  
  const headers = {
    'Content-Type': 'application/json',
    'X-Client-ID': 'fsm-extension-sample',
    'X-Client-Version': '1.0.0',
    'Authorization': `bearer ${sessionStorage.getItem('token')}`,
  };

  return new Promise(resolve => {

          fetch(`https://${cloudHost}/api/query/v1?&account=${account}&company=${company}&dtos=UdoMeta.10;UdoValue.10`, {
            method: 'POST',
            headers,
            body: JSON.stringify({"query":"select polygon.id, polygon.udfValues, ud.id from UdoValue polygon join UdoMeta ud on ud.id = polygon.meta where ud.name = 'Polygon'"}),
            })
              .then(response => response.json())
              .then(function(json) {
                    displayDataTable(json.data, cloudHost, account, company);
                    resolve();
              });
        });
}

// GET URL PARAMETERS
function getParameters() {
  const queryString = window.location.search;
  const urlParams = new URLSearchParams(queryString);
  const id = urlParams.get('id')
  return(id)
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
    
    if(sessionStorage.getItem('idMetaPolygon') == null) {
	    getIdCustomObject(cloudHost, account, company, 'Polygon')
    }
	
    if (data.length === 0) return;
	
    sessionStorage.setItem('idMetaPolygon', data[0].ud.id);

    // Create the table element
    const table = document.createElement('table');
    table.setAttribute("id", "itemList");

    // Loop through data and create table rows
    for (const item of data) {
        const row = item.polygon; // Accessing 'polygon' object from each item in 'data'
        const tableRow = document.createElement('tr');

	// Find the udfValue with name 'polygon_Name'
        const udfNameValue = row.udfValues.find(value => value.name === 'polygon_Name');

        if (udfNameValue) {
            // Create cell for 'polygon_Name' value
            const cell = document.createElement('td');
            cell.textContent = udfNameValue.value;
            tableRow.appendChild(cell);

            // Add click event listener to each row for redirection
            tableRow.addEventListener('click', () => {window.location.href = `detailsPolygon.html?id=${row.id}`;});

            table.appendChild(tableRow);
        }
    }
    document.body.appendChild(table);
}

// GET polygon DETAILS ASSYNC
async function getPolygonDetails(cloudHost, account, company, id) {
  
  const headers = {
    'Content-Type': 'application/json',
    'X-Client-ID': 'fsm-extension-sample',
    'X-Client-Version': '1.0.0',
    'Authorization': `bearer ${sessionStorage.getItem('token')}`,
  };

  try {
    const response = await fetch(`https://${cloudHost}/api/query/v1?&account=${account}&company=${company}&dtos=UdoValue.10`, {
      method: 'POST',
      headers,
      body: JSON.stringify({"query": `select polygon.id, polygon.udfValues from UdoValue polygon where polygon.id = '${id}'`})
    });

    if (!response.ok) {
      throw new Error(`Error: ${response.status} ${response.statusText}`);
    }

    const json = await response.json();
    // CALL THE FUNCTION TO FILL IN THE FORM
    prefillForm(json);
	
  } catch (error) {
    console.error('Failed to fetch polygon details:', error);
  }
}

// FUNCTION TO PRE-FILL THE FORM
function prefillForm(data) {
    const form = document.getElementById('myForm');
    const values = data.data[0].polygon.udfValues;

    values.forEach(item => {
        switch (item.name) {
            case 'polygon_Name':
                form.elements['name'].value = item.value;
                break;
            case 'polygon_PolygonIdEam':
                form.elements['polygonIdEAM'].value = item.value;
                break;
            case 'polygon_Description':
                form.elements['polygondescription'].value = item.value;
                break;
        }
    });
}

async function submitPolygonAsync(cloudHost, account, company, id, document) {
    const headers = {
        'Content-Type': 'application/json',
        'X-Client-ID': 'fsm-extension-sample',
        'X-Client-Version': '1.0.0',
        'Authorization': `bearer ${sessionStorage.getItem('token')}`,
    };
	
	const url = id === 'new' ? 
	`https://${cloudHost}/api/data/v4/UdoValue?dtos=UdoValue.10&account=${account}&company=${company}` : 
	`https://${cloudHost}/api/data/v4/UdoValue/${id}?dtos=UdoValue.10&account=${account}&company=${company}&forceUpdate=true`;
	
	const method = id === 'new' ? 'POST' : 'PATCH';

    const name = document.getElementById('name').value;
    const polygonIdEAM = document.getElementById('polygonIdEAM').value;
    const polygon_Description = document.getElementById('polygondescription').value;

    // Execute validation of mandatory fields
    const validationError = validateForm(name, polygonIdEAM);
    if (validationError) {
	    	updateMsgError(validationError);
		return; // Prevents form submission
    }

    const data = {
		"meta": `${sessionStorage.getItem('idMetaPolygon')}`,
        "udfValues": [
        {"meta": {"externalId": "polygon_Name"}, "value": `${name}`},
	    {"meta": {"externalId": "polygon_PolygonIdEam"}, "value": `${polygonIdEAM}`},
	    {"meta": {"externalId": "polygon_Description"}, "value": `${polygon_Description}`}
        ]
    };

	try {
	    const response = await fetch(url, {
	        method,
	        headers,
	        body: JSON.stringify(data),
	    });
	
	    if (!response.ok) {
	        throw new Error(`Error ${id === 'new' ? 'submitting' : 'updating'} form: ${response.statusText}`);
	    }
	
	    // Displays success message and redirects to main page after 2 seconds
	    updateMsgError("");
	    updateMsgSuccess(`Form ${id === 'new' ? 'submitted' : 'updated'} successfully!`);
	    setTimeout(() => history.back(), 2000);
	
	} catch (error) {
	    console.error('Failed to fetch polygon details:', error);
	}
}

function populateSelect(selectId, options) {
    const selectElement = document.getElementById(selectId);
    selectElement.innerHTML = ''; // Clear any existing options
	
    for (const key in options) {
        if (options.hasOwnProperty(key)) {
            const option = document.createElement('option');
            option.value = key;
            option.text = options[key];
            selectElement.appendChild(option);
        }
    }
}

function populateComboBox(response) {
    const data = response.data;
    data.forEach(item => {
        const { selectionKeyValues, externalId } = item.meta;

        populateSelect('listPolygons', selectionKeyValues);

    });
}

// VALIDATION OF MANDATORY FIELDS
function validateForm(name, polygonIdEAM) {
    if (!name) return '* Name is mandatory';
    if (!polygonIdEAM) return '* EAM ID is mandatory';

    return null;
}

// DELETE polygon ASSYNC
async function deletePolygon(cloudHost, account, company, id) {
  
  const headers = {
    'Content-Type': 'application/json',
    'X-Client-ID': 'fsm-extension-sample',
    'X-Client-Version': '1.0.0',
    'Authorization': `bearer ${sessionStorage.getItem('token')}`,
  };

  try {
    const response = await fetch(`https://${cloudHost}/api/data/v4/UdoValue/${id}?forceDelete=true&account=${account}&company=${company}`, {
      method: 'DELETE',
      headers,
      body: ''
    });

    if (!response.ok) {
      throw new Error(`Error: ${response.status} ${response.statusText}`);
    }
    
    history.back();
	
  } catch (error) {
    console.error('Failed to fetch polygon details:', error);
  }
}

const updateMsgError = (text) =>
  (document.querySelectorAll('#infoError')[0].innerText = text);

const updateMsgSuccess = (text) =>
  (document.querySelectorAll('#infoSuccess')[0].innerText = text);

// GET ID CUSTOMOBJECT ASSYNC
async function getIdCustomObject(cloudHost, account, company, nameObject) {
  
  const headers = {
    'Content-Type': 'application/json',
    'X-Client-ID': 'fsm-extension',
    'X-Client-Version': '1.0.0',
    'Authorization': `bearer ${sessionStorage.getItem('token')}`,
  };

  try {
    const response = await fetch(`https://${cloudHost}/api/query/v1?&account=${account}&company=${company}&dtos=UdoMeta.10`, {
      method: 'POST',
      headers,
      body: JSON.stringify({"query": `select ud.id from UdoMeta ud where ud.name = '${nameObject}'`})
    });

    if (!response.ok) {
      throw new Error(`Error: ${response.status} ${response.statusText}`);
    }

  } catch (error) {
    console.error('Failure to obtain the Id:', error);
  }
}
