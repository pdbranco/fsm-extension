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
            body: JSON.stringify({"query":"select pe.id, pe.udfValues from UdoValue pe where pe.id = '${id}'"}),
            })
              .then(response => response.json())
              .then(function(json) {
                    updateUI("TesteBranco");
                    
                    resolve();
              });
        });
}


