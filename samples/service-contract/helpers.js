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
            body: JSON.stringify({"query":"select pe.id, pe.udfValues from UdoValue pe join UdoMeta ud on ud.id = pe.meta where ud.name = 'PushEvent'"}),
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
	// Create the table element
	const table = document.createElement('table')
	table.setAttribute("id","itemList");
	
	// Loop through data and create table rows
	for (const row of data) {
		const tableRow = document.createElement('tr');
		for (const value in row) {
			const cell = document.createElement('td');
			cell.textContent = row[value].udfValues[0].value;
			tableRow.appendChild(cell);
	}

	// Add click event listener to each row for redirection
    	tableRow.addEventListener('click', () => {
      	window.location.href = `detailsBranco.html?id=${row.pe.id}`; // Replace "id" with your unique identifier
    	});
	
	table.appendChild(tableRow);
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
                options1.forEach(option => {
                    if (option.text === item.value) {
                        option.selected = true;
                    }
                });
                break;
            case 'pushEvent_CrewHQ':
                form.elements['description'].value = item.value;
                break;
            case 'pushEvent_WorkType':
                const options2 = Array.from(form.elements['options2[]'].options);
                options2.forEach(option => {
                    if (option.value === item.value) {
                        option.selected = true;
                    }
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

	return new Promise(resolve => {
		// Patch PushEvent
		fetch(`https://${cloudHost}/api/data/v4/UdoValue/${id}?dtos=UdoValue.10&account=${account}&company=${company}&forceUpdate=true`, {
			method: 'PATCH',
			headers,
			body: JSON.stringify({
				"udfValues": [
					{"meta": {"externalId": "pushEvent_Name"}, "value": `${name}`},
					{"meta": {"externalId": "pushEvent_StartTime"}, "value": `${startDateTime}`},
					{"meta": {"externalId": "pushEvent_EndTime"}, "value": `${endDateTime}`},
					{"meta": {"externalId": "pushEvent_PushInterval"}, "value": `${quantity}`},
					{"meta": {"externalId": "pushEvent_Status"}, "value": `${options1Selected}`},
					{"meta": {"externalId": "pushEvent_CrewHQ"}, "value": `${options2Selected}`},
					{"meta": {"externalId": "pushEvent_WorkType"}, "value": `${description}`},
					{"meta": {"externalId": "pushEvent_MajorStorm"}, "value": `${flagMajor}`},
					{"meta": {"externalId": "pushEvent_Unassign"}, "value": `${flagUnassign}`}
				]
			}),
		})
		.then(response => response.json())
		.then(function(json) {
			alert("Form submitted successfully!"); 
			resolve();
		});
	});
}

function submitPushEventBranco2(cloudHost, account, company, id, document) {
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

    const data = {
        "udfValues": [
            {"meta": {"externalId": "pushEvent_Name"}, "value": `${name}`},
            {"meta": {"externalId": "pushEvent_StartTime"}, "value": `${startDateTime}`},
            {"meta": {"externalId": "pushEvent_EndTime"}, "value": `${endDateTime}`},
            {"meta": {"externalId": "pushEvent_PushInterval"}, "value": `${quantity}`},
            {"meta": {"externalId": "pushEvent_Status"}, "value": `${options1Selected}`},
            {"meta": {"externalId": "pushEvent_CrewHQ"}, "value": `${options2Selected}`},
            {"meta": {"externalId": "pushEvent_WorkType"}, "value": `${description}`},
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
        })
        .catch(error => {
            console.error(`Error ${id === 'new' ? 'submitting' : 'updating'} form:`, error);
            reject(error); // Reject the promise with the error
        });
    });
}
