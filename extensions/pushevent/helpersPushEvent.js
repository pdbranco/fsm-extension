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
        setTimeout(() => fetchToken(), (event.expires_in * 500));
    });

    function fetchToken() {
        shellSdk.emit(SHELL_EVENTS.Version1.REQUIRE_AUTHENTICATION, {
            response_type: 'token' // request a user token within the context
        });
    }

    sessionStorage.setItem('token', auth.access_token);
    setTimeout(() => fetchToken(), (auth.expires_in * 500));
}

// BUILD TABLE
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

//GET OBJECT PUSHEVENTS
function getPushEvents(cloudHost, account, company) {

    const headers = {
        'Content-Type': 'application/json',
        'X-Client-ID': 'fsm-extension-pushevent',
        'X-Client-Version': '1.0.0',
        'Authorization': `bearer ${sessionStorage.getItem('token')}`,
    };

    return new Promise(resolve => {

        fetch(`https://${cloudHost}/api/query/v1?&account=${account}&company=${company}&dtos=UdoMeta.10;UdoValue.10`, {
                method: 'POST',
                headers,
                body: JSON.stringify({
                    "query": "select pe.id, pe.udfValues, ud.id from UdoValue pe join UdoMeta ud on ud.id = pe.meta where ud.name = 'PushEvent'"
                }),
            })
            .then(response => response.json())
            .then(function(json) {
                displayDataTable(json.data, cloudHost, account, company);
                resolve();
            });
    });
}

//CREATE TABLE
function displayDataTable(data, cloudHost, account, company) {

    if (sessionStorage.getItem('idMetaPushEvent') == null) {
        getIdCustomObject(cloudHost, account, company, 'PushEvent')
    }

    if (data.length === 0) return;
    if (document.getElementById('itemList')) return;

    data.sort(compareByNamePushEvent);

    sessionStorage.setItem('idMetaPushEvent', data[0].ud.id);

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
            tableRow.addEventListener('click', () => {
                window.location.href = `detailsPushEvent.html?id=${row.id}`;
            });

            table.appendChild(tableRow);
        }
    }
    document.body.appendChild(table);
}

// GET PUSHEVENT DETAILS ASSYNC
async function getPushEventDetails(cloudHost, account, company, id) {

    const headers = {
        'Content-Type': 'application/json',
        'X-Client-ID': 'fsm-extension-pushevent',
        'X-Client-Version': '1.0.0',
        'Authorization': `bearer ${sessionStorage.getItem('token')}`,
    };

    try {
        const response = await fetch(`https://${cloudHost}/api/query/v1?&account=${account}&company=${company}&dtos=UdoValue.10`, {
            method: 'POST',
            headers,
            body: JSON.stringify({
                "query": `select pe.id, pe.udfValues from UdoValue pe where pe.id = '${id}'`
            })
        });

        if (!response.ok) {
            throw new Error(`Error: ${response.status} ${response.statusText}`);
        }

        const json = await response.json();
        // CALL THE FUNCTION TO FILL IN THE FORM
        prefillForm(json);

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

async function submitPushEventAsync(cloudHost, account, company, id, document) {
    const headers = {
        'Content-Type': 'application/json',
        'X-Client-ID': 'fsm-extension-pushevent',
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
    const validationError = validateForm(name, startDateTime, endDateTime, description);
    if (validationError) {
        updateMsgError(validationError);
        return; // Prevents form submission
    }

    const data = {
        "meta": `${sessionStorage.getItem('idMetaPushEvent')}`,
        "externalId": `${name}`,
        "udfValues": [{
            "meta": {
                "externalId": "pushEvent_Name"
            },
            "value": `${name}`
        }, {
            "meta": {
                "externalId": "pushEvent_StartTime"
            },
            "value": `${startDateTime}`
        }, {
            "meta": {
                "externalId": "pushEvent_EndTime"
            },
            "value": `${endDateTime}`
        }, {
            "meta": {
                "externalId": "pushEvent_PushInterval"
            },
            "value": `${quantity}`
        }, {
            "meta": {
                "externalId": "pushEvent_Status"
            },
            "value": `${options1Selected}`
        }, {
            "meta": {
                "externalId": "pushEvent_WorkType"
            },
            "value": `${options2Selected}`
        }, {
            "meta": {
                "externalId": "pushEvent_CrewHQ"
            },
            "value": `${description}`
        }, {
            "meta": {
                "externalId": "pushEvent_MajorStorm"
            },
            "value": `${flagMajor}`
        }, {
            "meta": {
                "externalId": "pushEvent_Unassign"
            },
            "value": `${flagUnassign}`
        }]
    };

    try {
        const response = await fetch(url, {
            method,
            headers,
            body: JSON.stringify(data),
        });

        if (!response.ok) {
            const errorData = await response.json();
            let errorMessage = `Error: ${response.status} ${response.statusText}`;
            let errorScreen = 'Error: ';
            let specificError;

            if (errorData && errorData.children && errorData.children.length > 0) {
                specificError = errorData.children[0].message;
                if (specificError) {
                    errorMessage += ` - ${specificError}`;
                    errorScreen += `${specificError}`;
                }
            } else if (errorData && errorData.message){
                specificError = errorData.message;
                if (specificError) {
                    errorMessage += ` - ${specificError}`;
                    errorScreen += `${specificError}`;
                }
            }
            
            console.error('Error: ', errorMessage);
            throw new Error(errorScreen);
        }

        // Displays success message and redirects to main page after 2 seconds
        updateMsgError("");
        updateMsgSuccess(`Form ${id === 'new' ? 'submitted' : 'updated'} successfully!`);
        setTimeout(() => history.back(), 2000);

    } catch (error) {
        updateMsgError(error.message);
    }
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

        if (externalId === 'pushEvent_Status') {
            populateSelect('options1', selectionKeyValues);
        } else if (externalId === 'pushEvent_WorkType') {
            populateSelect('options2', selectionKeyValues);
        }
    });
}

// GET OPTIONS MATCODE AND ACTIVITY STATUS ASSYNC
async function getOptionMatCodeAndStatus(cloudHost, account, company, id) {

    const headers = {
        'Content-Type': 'application/json',
        'X-Client-ID': 'fsm-extension-pushevent',
        'X-Client-Version': '1.0.0',
        'Authorization': `bearer ${sessionStorage.getItem('token')}`,
    };

    try {
        const response = await fetch(`https://${cloudHost}/api/query/v1?&account=${account}&company=${company}&dtos=UdfMeta.20`, {
            method: 'POST',
            headers,
            body: JSON.stringify({
                "query": "select meta.externalId, meta.selectionKeyValues from UdfMeta meta where meta.externalId in ('pushEvent_Status','pushEvent_WorkType')"
            })
        });

        if (!response.ok) {
            throw new Error(`Error: ${response.status} ${response.statusText}`);
        }

        const json = await response.json();
        // CALL THE FUNCTION TO FILL IN THE COMBOBOX
        populateComboBox(json);
        getPushEventDetails(cloudHost, account, company, id);

    } catch (error) {
        console.error('Failed to fetch push event details:', error);
    }
}

// VALIDATION OF MANDATORY FIELDS
function validateForm(name, startDateTime, endDateTime, description) {
    if (!name)
        return '* Name is mandatory';
    if (!startDateTime)
        return '* Start Date & Time is mandatory';
    if (!endDateTime)
        return '+ End Date & Time is mandatory';
    if (!description)
        return '* CrewHQ Affected is mandatory';
    if (new Date(endDateTime) <= new Date(startDateTime))
        return '* The end date must be greater than the start date';
    return null;
}

// DELETE PUSHEVENT ASSYNC
async function deletePushEvent(cloudHost, account, company, id) {

    const headers = {
        'Content-Type': 'application/json',
        'X-Client-ID': 'fsm-extension-pushevent',
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
        console.error('Failed to fetch push event details:', error);
    }
}

const updateMsgError = (text) =>
    (document.querySelectorAll('#infoError')[0].innerText = text);

const updateMsgSuccess = (text) =>
    (document.querySelectorAll('#infoSuccess')[0].innerText = text);

// GET ID CUSTOMOBJECT
function getIdCustomObject(cloudHost, account, company, nameObject) {

    const headers = {
        'Content-Type': 'application/json',
        'X-Client-ID': 'fsm-extension-pushevent',
        'X-Client-Version': '1.0.0',
        'Authorization': `bearer ${sessionStorage.getItem('token')}`,
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
                sessionStorage.setItem('idMetaPushEvent', json.data[0].ud.id);
                resolve();
            });
    });
}

document.addEventListener('DOMContentLoaded', function() {
    const form = document.getElementById('myForm');
    const buttonSubmit = document.getElementById('createOrUpdatePushEvent');

    if (form && buttonSubmit) {
        let formChanged = false;

        function checkChange() {
            formChanged = true;
            buttonSubmit.disabled = false;
        }

        const fields = form.querySelectorAll('input, select, textarea');
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

function compareByNamePushEvent(a, b) {
    const nomeA = a.pe.udfValues.find(udf => udf.name === "pushEvent_Name").value.toLowerCase();
    const nomeB = b.pe.udfValues.find(udf => udf.name === "pushEvent_Name").value.toLowerCase();

    return nomeA.localeCompare(nomeB, undefined, {
        numeric: true,
        sensitivity: 'base'
    });
}
