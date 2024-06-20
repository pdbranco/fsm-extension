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
    setTimeout(() => fetchToken(), (event.expires_in * 1000) - 5000);
  });

  function fetchToken() {
    shellSdk.emit(SHELL_EVENTS.Version1.REQUIRE_AUTHENTICATION, {
      response_type: 'token'  // request a user token within the context
    });
  }

  sessionStorage.setItem('token', auth.access_token);
  setTimeout(() => fetchToken(), (auth.expires_in * 1000) - 5000);
}

// 
// Request context with activity ID to return serviceContract assigned
//
function getServiceContract(cloudHost, account, company, activity_id) {
  
  const headers = {
    'Content-Type': 'application/json',
    'X-Client-ID': 'fsm-extension-sample',
    'X-Client-Version': '1.0.0',
    'Authorization': `bearer ${sessionStorage.getItem('token')}`,
  };

  return new Promise(resolve => {

    fetch(`https://${cloudHost}/api/data/v4/Activity/${activity_id}?dtos=Activity.37&account=${account}&company=${company}`, {
      headers
      })
        .then(response => response.json())
        .then(function(json) {

          const activity = json.data[0].activity;
          // Fetch all ServiceContractEquipment
          fetch(`https://${cloudHost}/api/data/v4/Equipment?dtos=Equipment.22&account=${account}&company=${company}`, {
            headers
            })
              .then(response => response.json())
              .then(function(json) {
                    //resolve(json.data[0].equipment);

                    // Assuming you have your data in an array named 'myData'
                    displayDataTable(json.data);
                    resolve();
              });

        });

  });
}

// GET ALL EQUIPMENTS
function getEquipments(cloudHost, account, company) {
  
  const headers = {
    'Content-Type': 'application/json',
    'X-Client-ID': 'fsm-extension-sample',
    'X-Client-Version': '1.0.0',
    'Authorization': `bearer ${sessionStorage.getItem('token')}`,
  };

  return new Promise(resolve => {

    // Fetch Equipments object
   
  
          // Fetch all ServiceContractEquipment
          fetch(`https://${cloudHost}/api/data/v4/Equipment?dtos=Equipment.22&account=${account}&company=${company}`, {
            headers
            })
              .then(response => response.json())
              .then(function(json) {
                    // Assuming you have your data in an array named 'myData'
                    displayDataTable(json.data);
                    resolve();



              });

        });

  
}


// GET EQUIPMENT DETAILS
function getEquipmentDetails(cloudHost, account, company, id) {
  
  const headers = {
    'Content-Type': 'application/json',
    'X-Client-ID': 'fsm-extension-sample',
    'X-Client-Version': '1.0.0',
    'Authorization': `bearer ${sessionStorage.getItem('token')}`,
  };

  return new Promise(resolve => {

          // Fetch all ServiceContractEquipment
          fetch(`https://${cloudHost}/api/data/v4/Equipment/externalId/${id}?dtos=Equipment.22&account=${account}&company=${company}`, {
            headers
            })
              .then(response => response.json())
              .then(function(json) {
                    updateUI(json.data[0].equipment.name);
                    
                    resolve();

              });

        });

  
}

//FAZER PATCH
function submitPushEvent(cloudHost, account, company) {
  
  const headers = {
    'Content-Type': 'application/json',
    'X-Client-ID': 'fsm-extension-sample',
    'X-Client-Version': '1.0.0',
    'Authorization': `bearer ${sessionStorage.getItem('token')}`,
  };

  return new Promise(resolve => {

          // Patch PushEvent
          fetch(`https://${cloudHost}/api/data/v4/Item/1895331C49C6448B860E2FB316122BF2?dtos=Item.24&account=${account}&company=${company}&forceUpdate=true`, {
            method: 'PATCH',
            headers,
            body: JSON.stringify({ name: 'agorafoi' }),
            })
              .then(response => response.json())
              .then(function(json) {
                    console.log(`ya`); 
                    resolve();

              });

        });

  
}

// BUILD TABLE 
function displayDataTable(data) {
                      // Create the table element
                      const table = document.createElement('table')
                      table.setAttribute("id","itemList");
                      
                      // Create table header row
                      /*const headerRow = document.createElement('tr');
                      for (const key in data[0]) {
                        const headerCell = document.createElement('th');
                        headerCell.textContent = key;
                        headerRow.appendChild(headerCell);
                      }
                      table.appendChild(headerRow);*/
                    
                      // Loop through data and create table rows
                      for (const row of data) {
                        const tableRow = document.createElement('tr');
                        for (const value in row) {
                          const cell = document.createElement('td');
                          cell.textContent = row[value].name;
                          tableRow.appendChild(cell);
                        }
                        
                        // Add click event listener to each row for redirection
                        tableRow.addEventListener('click', () => {
                          window.location.href = `details.html?id=${row.equipment.externalId}`; // Replace "id" with your unique identifier
                        });
                        
                        table.appendChild(tableRow);
                      }
                      
                      // Add the table to the document body
                      document.body.appendChild(table);
}


// GET URL PARAMETERS
function getParameters() {
  const queryString = window.location.search;
  const urlParams = new URLSearchParams(queryString);
  const id = urlParams.get('id')
  return(id)
}

// POPULATE DROPDOWN
function populateDropdown() {

  const crewHQS = ['Apple', 'Banana', 'Orange', 'Mango'];

  for (const crewHQ of crewHQS) {
      const option = document.createElement('option');
      option.value = crewHQ; // Set value for the option
      option.textContent = crewHQ; // Set text displayed for the user
      crewHQDropdown.appendChild(option);
  }
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

//GET OBJECT PUSHEVENTS
function getPushEvents(cloudHost, account, company) {
  
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
            body: JSON.stringify({"query":"select pe.id, pe.udfValues, ud.id from UdoValue pe join UdoMeta ud on ud.id = pe.meta where ud.name = 'PushEvent'"}),
            })
              .then(response => response.json())
              .then(function(json) {
                    displayDataTableBranco(json.data);
                    resolve();
              });
        });
}

//CREATE TABLE
function displayDataTableBranco(data) {
    if (data.length === 0) return;
	
    sessionStorage.setItem('idMeta', data[0].ud.id);

    // Create the table element
    const table = document.createElement('table');
    table.setAttribute("id", "itemList");

    // Loop through data and create table rows
    for (const item of data) {
        const row = item.pe; // Accessing 'pe' object from each item in 'data'
        const tableRow = document.createElement('tr');

	// Find the udfValue with name 'pushEvent_Name'
        const udfNameValue = row.udfValues.find(value => value.name === 'pushEvent_Name');

        if (udfNameValue) {
            // Create cell for 'pushEvent_Name' value
            const cell = document.createElement('td');
            cell.textContent = udfNameValue.value;
            tableRow.appendChild(cell);

            // Add click event listener to each row for redirection
            tableRow.addEventListener('click', () => {window.location.href = `detailsBranco.html?id=${row.id}`;});

            table.appendChild(tableRow);
        }
    }
    document.body.appendChild(table);
}

// GET PUSHEVENT DETAILS
function getPushEventDetails(cloudHost, account, company, id) {
  
  const headers = {
    'Content-Type': 'application/json',
    'X-Client-ID': 'fsm-extension-sample',
    'X-Client-Version': '1.0.0',
    'Authorization': `bearer ${sessionStorage.getItem('token')}`,
  };

  return new Promise(resolve => {

          // Fetch the Push Event entry
          fetch(`https://${cloudHost}/api/query/v1?&account=${account}&company=${company}&dtos=UdoValue.10`, {
            method: 'POST',
            headers,
            body: JSON.stringify({"query":`select pe.id, pe.udfValues from UdoValue pe where pe.id = '${id}'`})
            })
              .then(response => response.json())
              .then(function(json) {
                    updateUI(json.data[0].pe.udfValues[0].value);
                    
                    resolve();
              });
        });
}

// GET PUSHEVENT DETAILS ASSYNC
async function getPushEventDetails2(cloudHost, account, company, id) {
  
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
      body: JSON.stringify({"query": `select pe.id, pe.udfValues from UdoValue pe where pe.id = '${id}'`})
    });

    if (!response.ok) {
      throw new Error(`Error: ${response.status} ${response.statusText}`);
    }

    const json = await response.json();
    // CALL THE FUNCTION TO FILL IN THE FORM
    prefillForm(json);
    //updateUI(json.data[0].pe.udfValues[0].value);
	
  } catch (error) {
    console.error('Failed to fetch push event details:', error);
  }
}

// FUNCTION TO PRE-FILL THE FORM
function prefillForm(data) {
    const form = document.getElementById('myForm');
    const values = data.data[0].pe.udfValues;

    values.forEach(item => {
        switch (item.name) {
            case 'pushEvent_Name':
                form.elements['name'].value = item.value;
                break;
            case 'pushEvent_StartTime':
                form.elements['start_datetime'].value = item.value.substring(0, 16); // Remove the 'Z' for compatibility
                break;
            case 'pushEvent_EndTime':
                form.elements['end_datetime'].value = item.value.substring(0, 16); // Remove the 'Z' for compatibility
                break;
            case 'pushEvent_PushInterval':
                form.elements['quantity'].value = item.value;
                break;
            case 'pushEvent_Status':
                const options1 = Array.from(form.elements['options1[]'].options);
		const selectedValues = item.value.split(',');
		selectedValues.forEach(selectedValue => {	
	                options1.forEach(option => {
	                    if (option.text.trim() === selectedValue.trim()) {
	                        option.selected = true;
	                    }
	                });
		});
                break;
            case 'pushEvent_CrewHQ':
                form.elements['description'].value = item.value;
                break;
            case 'pushEvent_WorkType':
                const options2 = Array.from(form.elements['options2[]'].options);
		const selectedValues2 = item.value.split(',');
		selectedValues2.forEach(selectedValue => {
	                options2.forEach(option => {
	                    if (option.text.trim() === selectedValue.trim()) {
	                        option.selected = true;
	                    }
	                });
		});
                break;
            case 'pushEvent_MajorStorm':
                form.elements['MajorFlag'].checked = item.value === 'true';
                break;
            case 'pushEvent_Unassign':
                form.elements['UnassignFlag'].checked = item.value === 'true';
                break;
        }
    });
}

function submitPushEventBranco(cloudHost, account, company, id, document) {
    const headers = {
        'Content-Type': 'application/json',
        'X-Client-ID': 'fsm-extension-sample',
        'X-Client-Version': '1.0.0',
        'Authorization': `bearer ${sessionStorage.getItem('token')}`,
    };

    const name = document.getElementById('name').value;
    const startDateTime = document.getElementById('start_datetime').value;
    const endDateTime = document.getElementById('end_datetime').value;
    const quantity = document.getElementById('quantity').value;
    const options1Selected = Array.from(document.getElementById('options1').selectedOptions).map(option => option.value);
    const options2Selected = Array.from(document.getElementById('options2').selectedOptions).map(option => option.value);
    const description = document.getElementById('description').value;
    const flagMajor = document.getElementById('MajorFlag').checked;
    const flagUnassign = document.getElementById('UnassignFlag').checked;

    // EXECUTE VALIDATION OF MANDATORY FIELDS
    const validationError = validateForm(name, startDateTime, endDateTime, quantity, options1Selected, options2Selected, description);
    if (validationError) {
	alert(validationError); // Displays the error message
	return; // Prevents form submission
    }

    const data = {
	"meta": `${sessionStorage.getItem('idMeta')}`,
        "udfValues": [
            {"meta": {"externalId": "pushEvent_Name"}, "value": `${name}`},
            {"meta": {"externalId": "pushEvent_StartTime"}, "value": `${startDateTime}`},
            {"meta": {"externalId": "pushEvent_EndTime"}, "value": `${endDateTime}`},
            {"meta": {"externalId": "pushEvent_PushInterval"}, "value": `${quantity}`},
            {"meta": {"externalId": "pushEvent_Status"}, "value": `${options1Selected}`},
            {"meta": {"externalId": "pushEvent_WorkType"}, "value": `${options2Selected}`},
	    {"meta": {"externalId": "pushEvent_CrewHQ"}, "value": `${description}`},
            {"meta": {"externalId": "pushEvent_MajorStorm"}, "value": `${flagMajor}`},
            {"meta": {"externalId": "pushEvent_Unassign"}, "value": `${flagUnassign}`}
        ]
    };

    return new Promise((resolve, reject) => {
        const url = id === 'new' ? 
            `https://${cloudHost}/api/data/v4/UdoValue?dtos=UdoValue.10&account=${account}&company=${company}` : 
            `https://${cloudHost}/api/data/v4/UdoValue/${id}?dtos=UdoValue.10&account=${account}&company=${company}&forceUpdate=true`;
        const method = id === 'new' ? 'POST' : 'PATCH';

        fetch(url, {
            method,
            headers,
            body: JSON.stringify(data),
        })
        .then(response => response.json())
        .then(json => {
            alert(`Form ${id === 'new' ? 'submitted' : 'updated'} successfully!`);
            resolve(json); // Resolve the promise with the server response
	    history.back();
        })
        .catch(error => {
            console.error(`Error ${id === 'new' ? 'submitting' : 'updating'} form:`, error);
            reject(error); // Reject the promise with the error
        });
    });
}

async function submitPushEventBrancoAsync(cloudHost, account, company, id, document) {
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
    const startDateTime = document.getElementById('start_datetime').value;
    const endDateTime = document.getElementById('end_datetime').value;
    const quantity = document.getElementById('quantity').value;
    const options1Selected = Array.from(document.getElementById('options1').selectedOptions).map(option => option.value);
    const options2Selected = Array.from(document.getElementById('options2').selectedOptions).map(option => option.value);
    const description = document.getElementById('description').value;
    const flagMajor = document.getElementById('MajorFlag').checked;
    const flagUnassign = document.getElementById('UnassignFlag').checked;

    // Execute validation of mandatory fields
    const validationError = validateForm(name, startDateTime, endDateTime, quantity, options1Selected, options2Selected, description);
    if (validationError) {
		alert(validationError); // Displays the error message
		return; // Prevents form submission
    }

    const data = {
		"meta": `${sessionStorage.getItem('idMeta')}`,
        "udfValues": [
            {"meta": {"externalId": "pushEvent_Name"}, "value": `${name}`},
            {"meta": {"externalId": "pushEvent_StartTime"}, "value": `${startDateTime}`},
            {"meta": {"externalId": "pushEvent_EndTime"}, "value": `${endDateTime}`},
            {"meta": {"externalId": "pushEvent_PushInterval"}, "value": `${quantity}`},
            {"meta": {"externalId": "pushEvent_Status"}, "value": `${options1Selected}`},
            {"meta": {"externalId": "pushEvent_WorkType"}, "value": `${options2Selected}`},
			{"meta": {"externalId": "pushEvent_CrewHQ"}, "value": `${description}`},
            {"meta": {"externalId": "pushEvent_MajorStorm"}, "value": `${flagMajor}`},
            {"meta": {"externalId": "pushEvent_Unassign"}, "value": `${flagUnassign}`}
        ]
    };

	try {
		const response = await fetch(url, {
            method,
            headers,
            body: JSON.stringify(data),
        });

		if (!response.ok) {
		  throw new Error(`Error ${id === 'new' ? 'submitting' : 'updating'} form:`, error);
		}

		const json = await response.json();
		alert(`Form ${id === 'new' ? 'submitted' : 'updated'} successfully!`);
		history.back();

	  } catch (error) {
		console.error('Failed to fetch push event details:', error);
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

        if (externalId === 'pushEvent_Status') {
            populateSelect('options1', selectionKeyValues);
        } else if (externalId === 'pushEvent_WorkType') {
            populateSelect('options2', selectionKeyValues);
        }
    });
}

// GET OPTIONS MATCODE AND ACTIVITY STATUS ASSYNC
async function getOptionMatCodeAndStatus(cloudHost, account, company) {
  
  const headers = {
    'Content-Type': 'application/json',
    'X-Client-ID': 'fsm-extension-sample',
    'X-Client-Version': '1.0.0',
    'Authorization': `bearer ${sessionStorage.getItem('token')}`,
  };

  try {
    const response = await fetch(`https://${cloudHost}/api/query/v1?&account=${account}&company=${company}&dtos=UdfMeta.20`, {
      method: 'POST',
      headers,
      body: JSON.stringify({"query":"select meta.externalId, meta.selectionKeyValues from UdfMeta meta where meta.externalId in ('pushEvent_Status','pushEvent_WorkType')"})
    });

    if (!response.ok) {
      throw new Error(`Error: ${response.status} ${response.statusText}`);
    }

    const json = await response.json();
    // CALL THE FUNCTION TO FILL IN THE COMBOBOX
    populateComboBox(json);
	
  } catch (error) {
    console.error('Failed to fetch push event details:', error);
  }
}

// VALIDATION OF MANDATORY FIELDS
function validateForm(name, startDateTime, endDateTime, quantity, options1Selected, options2Selected, description) {
    if (!name) return 'Name is mandatory';
    if (!startDateTime) return 'Start Date & Time is mandatory';
    if (!endDateTime) return 'End Date & Time is mandatory';
    if (!quantity) return 'Days to Push Work Forward is mandatory';
    if (options1Selected.length === 0) return 'At least one option must be selected under Activity Status Affected';
    if (options2Selected.length === 0) return 'At least one option must be selected under MAT Code(s) Affected';
    if (!description) return 'CrewHQ Affected is mandatory';
    return null;
}
