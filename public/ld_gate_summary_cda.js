document.addEventListener('DOMContentLoaded', function () {
    // Display the loading_alarm_mvs indicator
    const loadingIndicatorGageData = document.getElementById('loading_ld_gate_summary');
    loadingIndicatorGageData.style.display = 'block';

    console.log('Loading Version CDA 1');

    // Gage control json file
    let jsonFileURL = null;
    if (cda === "public") {
        jsonFileURL = '../../../php_data_api/public/json/gage_control.json';
    } else if (cda === "internal") {
        jsonFileURL = '../../../php_data_api/public/json/gage_control.json';
    }
    console.log('jsonFileURL: ', jsonFileURL);
    
    // Fetch JSON data from the specified URL
    fetch(jsonFileURL)
        .then(response => {
            // Check if response is OK, if not, throw an error
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            // Parse the response as JSON
            return response.json();
        })
        .then(data => {
            // Log the fetched data
            console.log('data: ', data);

            // Filter and sort the data
            const filteredAndSortedData = data.reduce((accumulator, currentValue) => {
                // Extract the 'gages' array
                const gages = currentValue.gages || [];

                // Filter out gages where ld_gate_summay is true
                const filteredGages = gages.filter(gage => gage.ld_gate_summay === true);

                // Push filtered gages to the accumulator
                accumulator.push(...filteredGages);

                return accumulator;
            }, []);

            // Sort filtered data based on ld_gate_summay_sort_order
            filteredAndSortedData.sort((a, b) => {
                const orderA = a.ld_gate_summay_sort_order || 0; // Use 'ld_gate_summay_sort_order' field, default to 0 if missing
                const orderB = b.ld_gate_summay_sort_order || 0;
                return orderA - orderB; // Sort in ascending ld_gate_summay_sort_order
            });

            // Log the filtered and sorted data
            console.log("filteredAndSortedData = ", filteredAndSortedData);

            // Call the function to create and populate the table
			createTable(filteredAndSortedData);
        })
        .catch(error => {
            // Log any errors that occur during fetching or parsing JSON
            console.error('Error fetching data:', error);
        })
        .finally(() => {
            // Hide the loading_alarm_mvs indicator regardless of success or failure
            loadingIndicatorGageData.style.display = 'none';
        });
});

// Function to get current data time
function subtractHoursFromDate(date, hoursToSubtract) {
    return new Date(date.getTime() - (hoursToSubtract * 60 * 60 * 1000));
}

// Function to get current data time
function plusHoursFromDate(date, hoursToSubtract) {
    return new Date(date.getTime() + (hoursToSubtract * 60 * 60 * 1000));
}

// Function to add days to a given date
function addDaysToDate(date, days) {
    return new Date(date.getTime() + (days * 24 * 60 * 60 * 1000));
}

// Function to create ld summary table
function createTable(filteredAndSortedData) {
    // Append the table to the document or a specific container
    const tableContainer = document.getElementById('table_container_ld_gate_summary');

    // Iterate through the filteredAndSortedData to populate the table
    filteredAndSortedData.forEach((data) => {
        // Create a table element for each location
        const table = document.createElement('table');
        table.setAttribute('id', 'gage_data'); // Set the id to "gage_data"

        // Create a row for the title
        const titleRow = document.createElement('tr');
        const titleCell = document.createElement('th');
        titleCell.textContent = data.location_id;
        titleCell.colSpan = 6; // Set colspan to 6
        titleCell.style.textAlign = 'left'; // Align text to the left
        titleCell.style.height = '50px';
        titleCell.style.backgroundColor = 'darkblue'; // Set background color to dark blue
        titleRow.appendChild(titleCell);

        // Append the title row to the table
        table.appendChild(titleRow);

        // Create a header row
        const headerRow = document.createElement('tr');

        // Create table headers for the desired columns
        const columns = ["Date Time", "Pool", "Tail Water", "Hinge Point", "Tainter", "Roller"];
        columns.forEach((columnName) => {
            const th = document.createElement('th');
            th.textContent = columnName;
            th.style.height = '50px';
            th.style.backgroundColor = 'darkblue'; // Set background color to dark blue
            headerRow.appendChild(th);
        });

        // Append the header row to the table
        table.appendChild(headerRow);

        // Append the table to the document or a specific container
        if (tableContainer) {
            tableContainer.appendChild(table);
        }

        // Fetch and update data for the current table
        fetchAndUpdateData(data.tsid_pool, data.tsid_tw, data.tsid_hinge, data.tsid_taint, data.tsid_roll, table, cda);
    });
}

// Function to manipulate data
function fetchAndUpdateData(tsid_pool, tsid_tw, tsid_hinge, tsid_taint, tsid_roll, table, cda) {
    const currentDateTime = new Date();
    const currentDateTimeMinus30Hours = subtractHoursFromDate(currentDateTime, 24);
    console.log("tsid_roll = ", tsid_roll);

    const fetchPool = fetchTimeSeriesData(tsid_pool, currentDateTimeMinus30Hours, currentDateTime, cda);
    const fetchTailWater = fetchTimeSeriesData(tsid_tw, currentDateTimeMinus30Hours, currentDateTime, cda);
    const fetchHinge = fetchTimeSeriesData(tsid_hinge, currentDateTimeMinus30Hours, currentDateTime, cda);
    const fetchTaint = fetchTimeSeriesData(tsid_taint, currentDateTimeMinus30Hours, currentDateTime, cda);
    console.log("fetchTaint = ", fetchTaint);
    // Fetch tsid_roll only if it's not null
    const fetchRoll = tsid_roll ? fetchTimeSeriesData(tsid_roll, currentDateTimeMinus30Hours, currentDateTime, cda) : Promise.resolve(null);
    // const fetchRoll = fetchTimeSeriesData(tsid_roll, currentDateTimeMinus30Hours, currentDateTime)
    console.log("fetchRoll = ", fetchRoll);

    // Process the data when all requests are fulfilled
    Promise.all([fetchPool, fetchTailWater, fetchHinge, fetchTaint, fetchRoll])
        .then(responses => Promise.all(responses.map(response => response ? response.json() : null)))
        .then(data => {
            const poolData = data[0];
            console.log("poolData = ", poolData);
            const tailWaterData = data[1];
            console.log("tailWaterData = ", tailWaterData);
            const hingeData = data[2];
            console.log("hingeData = ", hingeData);
            const taintData = data[3];
            console.log("taintData = ", taintData);
            const rollData = data[4];
            console.log("rollData = ", rollData);

            // Combine all data conditionally based on whether rollData is not null
            let combinedAllData;
            if (rollData) {
                combinedAllData = combineAllData(poolData, tailWaterData, hingeData, taintData, rollData);
            } else {
                combinedAllData = combineAllData(poolData, tailWaterData, hingeData, taintData);
            }
            console.log("combinedAllData = ", combinedAllData);

            combinedAllData.forEach(entry => {
                // Create a new row for each entry
                const row = table.insertRow();

                // Populate data into cells
                const dateTimeCell = row.insertCell();
                const poolCell = row.insertCell();
                const tailwaterCell = row.insertCell();
                const hingeCell = row.insertCell();
                const taintCell = row.insertCell();
                const rollCell = row.insertCell();

                dateTimeCell.innerHTML = new Date(entry.timestamp).toLocaleString();
                poolCell.innerHTML = entry.pool;
                tailwaterCell.innerHTML = entry.tailwater;
                hingeCell.innerHTML = entry.hinge;
                taintCell.innerHTML = entry.taint;
                if (entry.roll) {
                    rollCell.innerHTML = entry.roll;
                }
            });
        })
        .catch(error => {
            console.error('Error fetching or processing data:', error);
        });
}

// Function to fetch time series data
function fetchTimeSeriesData(tsid, begin, end, cda) {
    let url = null;
    if (cda === "internal") {
        url = `https://coe-mvsuwa04mvs.mvs.usace.army.mil:8243/mvs-data/timeseries?name=${tsid}&begin=${begin.toISOString()}&end=${end.toISOString()}&office=MVS`;
    } else if (cda === "public") {
        url = `https://cwms-data.usace.army.mil/cwms-data/timeseries?name=${tsid}&begin=${begin.toISOString()}&end=${end.toISOString()}&office=MVS`;
    } else {

    }

    
    console.log('url:', url);

    return fetch(url, {
        method: 'GET',
        headers: {
            'Accept': 'application/json;version=2'
        }
    });
}

// Function to get current data time
function subtractHoursFromDate(date, hoursToSubtract) {
    return new Date(date.getTime() - (hoursToSubtract * 60 * 60 * 1000));
}

// Function to combine all data
function combineAllData(pool, tailwater, hinge, taint, roll) {
    // Merge all timestamps into a single array and sort them
    const allTimestamps = [
        ...new Set([
            ...pool && pool.values ? pool.values.map(data => data[0]) : [],
            ...tailwater && tailwater.values ? tailwater.values.map(data => data[0]) : [],
            ...hinge && hinge.values ? hinge.values.map(data => data[0]) : [],
            ...taint && taint.values ? taint.values.map(data => data[0]) : [],
            ...roll && roll.values ? roll.values.map(data => data[0]) : []


        ])
    ].sort((a, b) => a - b);

    // Filter timestamps to include only the top of the hour
    const topOfHourTimestamps = allTimestamps.filter(timestamp => new Date(timestamp).getMinutes() === 0);

    // Combine data points for each top of the hour timestamp
    const combinedData = topOfHourTimestamps.map(timestamp => {
        // Find the index of the matching data point in each dataset
        const poolIndex = pool && pool.values ? pool.values.findIndex(data => data[0] === timestamp) : -1;
        const tailwaterIndex = tailwater && tailwater.values ? tailwater.values.findIndex(data => data[0] === timestamp) : -1;
        const hingeIndex = hinge && hinge.values ? hinge.values.findIndex(data => data[0] === timestamp) : -1;
        const taintIndex = taint && taint.values ? taint.values.findIndex(data => data[0] === timestamp) : -1;
        const rollIndex = roll && roll.values ? roll.values.findIndex(data => data[0] === timestamp) : -1;


        // Combine the data from the matching data points into a single object
        return {
            timestamp,
            pool: poolIndex !== -1 
                ? (Number(pool.values[poolIndex][1]).toFixed(2) === 0
                    ? ""
                    : "<span title='" + pool.name + "'>" + Number(pool.values[poolIndex][1]).toFixed(2) + "</span>")
                : null,
            tailwater: tailwaterIndex !== -1 
                ? (Number(tailwater.values[tailwaterIndex][1]).toFixed(2) === 0
                    ? ""
                    : "<span title='" + tailwater.name + "'>" + Number(tailwater.values[tailwaterIndex][1]).toFixed(2) + "</span>")
                : null,
            hinge: hingeIndex !== -1 
                ? (Number(hinge.values[hingeIndex][1]).toFixed(2) === 0
                    ? ""
                    : "<span title='" + hinge.name + "'>" + Number(hinge.values[hingeIndex][1]).toFixed(2) + "</span>") 
                : null,
            taint: taintIndex !== -1 
                ? (Number(taint.values[taintIndex][1]).toFixed(2) > 900 
                    ? "Open River" 
                    : "<span title='" + taint.name + "'>" + Number(taint.values[taintIndex][1]).toFixed(2) + "</span>") 
                : null,
            roll: rollIndex !== -1 
                ? (Number(roll.values[rollIndex][1]).toFixed(2) > 900 
                    ? "Open River" 
                    : "<span title='" + roll.name + "'>" + Number(roll.values[rollIndex][1]).toFixed(2) + "</span>") 
                : null,
            poolName: pool.name, // Add name for pool
            tailwaterName: tailwater.name, // Add name for tailwater
            hingeName: hinge.name, // Add name for hinge
            taintName: taint ? taint.name : null, // Add name for taint
            rollName: roll ? roll.name : null // Add name for roll if roll is not null
        };
    });

    return combinedData;
}

