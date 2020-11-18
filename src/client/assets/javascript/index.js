// PROVIDED CODE BELOW (LINES 1 - 80) DO NOT REMOVE

// The store will hold all information needed globally
const store = {
	track_id: undefined,
	player_id: undefined,
	race_id: undefined,
	race_segments: undefined,
	local_data: undefined
}

// We need our javascript to wait until the DOM is loaded
document.addEventListener("DOMContentLoaded", function() {
	onPageLoad()
	setupClickHandlers()
})

async function onPageLoad() {
	try {
	//We need to wait for local data before getting the real data from api
		 await getLocalData()
			.then(localData => {
				store["local_data"] = localData;
			})

		getTracks()
			.then(tracks => {
				const html = renderTrackCards(tracks)
				renderAt('#tracks', html)
			})

		getRacers()
			.then((racers) => {
				const html = renderRacerCars(racers)
				renderAt('#racers', html)
			})

	} catch(error) {
		console.log("Problem getting tracks and racers ::", error.message)
		console.error(error)
	}
}

function setupClickHandlers() {
	document.addEventListener('click', function(event) {
		const { target } = event

		// Race track form field
		if (target.matches('.card.track')) {
			handleSelectTrack(target)
		}

		// Podracer form field
		if (target.matches('.card.podracer')) {
			handleSelectPodRacer(target)
		}

		// Submit create race form
		if (target.matches('#submit-create-race')) {
			event.preventDefault()
			// start race
			handleCreateRace().catch(error => console.log(error.message))
		}

		// Handle acceleration click
		if (target.matches('#gas-peddle')) {
			handleAccelerate(target)
		}

	}, false)
}

async function delay(ms) {
	try {
		return await new Promise(resolve => setTimeout(resolve, ms));
	} catch(error) {
		console.log("an error shouldn't be possible here")
		console.log(error)
	}
}
// ^ PROVIDED CODE ^ DO NOT REMOVE

// This async function controls the flow of the race, add the logic and error handling
async function handleCreateRace() {
	try {
		if(!store["player_id"] || !store["track_id"]) {
			alert("Please select all options before starting a race!")
			throw new Error("Player Id or Track Id is missing");
		}
		// render starting UI
		const { player_id, track_id } = store;
		const race = await createRace(player_id, track_id);
		renderAt('#race', renderRaceStartView(race["Track"], race["racers"]))
		//Store race segments if possible
		if(race.hasOwnProperty("Track") && race["Track"].hasOwnProperty("segments") && race["Track"]["segments"].length > 0) {
			store["race_segments"] = race["Track"]["segments"].length;
		}
		store["race_id"] = race["ID"] - 1;
		// The race has been created, now start the countdown
		await runCountdown()
		//API creates a race with an id 1 less than the one provided
		await startRace(store["race_id"])
		await runRace(store["race_id"])
	} catch (error) {
		console.log(error)
	}
}

function runRace(raceID) {
	return new Promise(resolve => {
	const raceInfo = {};
	const raceInfoInterval = setInterval(() => {
		getRace(raceID).then(info => {

			Object.keys(info).forEach(k => raceInfo[k] = info[k]);
			if(raceInfo.hasOwnProperty("status") && raceInfo.hasOwnProperty("positions")) {
				if(raceInfo["status"] === "in-progress") {
					renderAt('#leaderBoard', raceProgress(raceInfo["positions"]))
				} else if(raceInfo["status"] === "finished") {
					clearInterval(raceInfoInterval) // to stop the interval from repeating
					renderAt('#race', resultsView(raceInfo["positions"])) // to render the results view
					resolve(raceInfo) // resolve the promise
				}
			}
		})
	},500);

	}) // remember to add error handling for the Promise
	.catch(err => console.log("There was a problem loading the positions of the race::",err));
}

async function runCountdown() {
	try {
		// wait for the DOM to load
		await delay(1000)
		let timer = 3

		return new Promise(resolve => {
			const countDownInterval = setInterval(() => {
				timer -= 1
				if(timer === 0) {
					clearInterval(countDownInterval);
					resolve();
				}
				// run this DOM manipulation to decrement the countdown for the user
				document.getElementById('big-numbers').innerHTML = timer
			},1000);
		})
	} catch(error) {
		console.log(error);
	}
}

function handleSelectPodRacer(target) {
	// remove class selected from all racer options
	const selected = document.querySelector('#racers .selected')
	if(selected) {
		selected.classList.remove('selected')
	}
	// add class selected to current target
	target.classList.add('selected')
	store["player_id"] = parseInt(target["id"])
}

function handleSelectTrack(target) {
	// remove class selected from all track options
	const selected = document.querySelector('#tracks .selected')
	if(selected) {
		selected.classList.remove('selected')
	}
	// add class selected to current target
	target.classList.add('selected')
	store["track_id"] = parseInt(target["id"])
}

function handleAccelerate() {
	accelerate(store["race_id"]).catch(error => console.log(error));
}

// HTML VIEWS ------------------------------------------------
// Provided code - do not remove

function renderRacerCars(racers) {
	if (!racers.length) {
		return `
			<h4>Loading Racers...</h4>
		`
	}

	const results = racers.map(renderRacerCard).join('')

	return `
		<ul id="racers">
			${results}
		</ul>
	`
}

/**
 * Checks if local data is present to customize the racer cards
 * and includes a bar style for the metrics to make them more appealing.
 * If no local data is present show a default image for the racer cards
 * @param {Object} racer
 * @return {string} racerCard HTML
 */
function renderRacerCard(racer) {
	const { id, driver_name, top_speed, acceleration, handling } = racer
	let localRacer =  getLocal(id, "cars");
	const racerName = localRacer ? localRacer["driver_name"] : "unknown";
	const imgUrl = renderRacer(racerName);
	return `
		<li class="card podracer" id="${id}">
			<h3>${localRacer ? localRacer["driver_name"] : driver_name}</h3>
			<div id=${"racer-profile-"+id}>
				<img id="racer-image" src=${imgUrl} alt=${racerName}>
			</div>
			<div class="racer-stats">
				<p>top speed: ${top_speed}</p>
				<div class="racer-bar">
					<div class="racer-filled-bar" style="width:  ${getStatsPercentage(top_speed, 1000)}%; background-color: blue"></div>
				</div>
			</div>
			<div class="racer-stats">
				<p>acceleration: ${acceleration}</p>
				<div class="racer-bar">
					<div class="racer-filled-bar" style="width:  ${getStatsPercentage(acceleration, 10)}%; background-color: red"></div>
				</div>
			</div>
			<div class="racer-stats">
				<p>handling: ${handling}</p>
				<div class="racer-bar">
					<div class="racer-filled-bar" style="width:  ${getStatsPercentage(handling, 10)}%; background-color: green"></div>
				</div>
			</div>
		</li>
	`
}

//Builds the image url for the racer card
function renderRacer(racerName) {
	return `http://localhost:3000/assets/images/${racerName}.png`;
}

/**
 * Calculates the percentage as a number of the metric for the racer using maxLimit as the 100%
 * @param {number} stat
 * @param {number} maxLimit
 * @return {number}
 */
function getStatsPercentage(stat, maxLimit) {
	return (stat/maxLimit)*100;
}

function renderTrackCards(tracks) {
	if (!tracks.length) {
		return `
			<h4>Loading Tracks...</h4>
		`
	}

	const results = tracks.map(renderTrackCard).join('')

	return `
		<ul id="tracks">
			${results}
		</ul>
	`
}

/**
 Checks if local data is present to customize the tracks
 * If no local data is present show the api name for the track
 * @param {string} track
 * @return {string} trackCardCard HTML
 */
function renderTrackCard(track) {
	const { id, name } = track
	const localTrack = getLocal(id,"tracks");
	return `
		<li id="${id}" class="card track">
			<h3 style="text-align: center">${localTrack ? localTrack["name"] : name}</h3>
		</li>
	`
}

/**
 * Returns the local object that matches the id provided, if no match is found
 * returns undefined
 * @param {string} id
 * @param {string} property
 * @return {Object | undefined}
 */
function getLocal(id, property) {
	if(store["local_data"] && store["local_data"].hasOwnProperty(property)) {
		return store["local_data"][property].find(obj => obj["id"] === id);
	}
	return undefined;
}

function renderCountdown(count) {
	return `
		<h2>Race Starts In...</h2>
		<p id="big-numbers">${count}</p>
	`
}

function renderRaceStartView(track, racers) {
	const localTrack = getLocal(track["id"],"tracks");
	return `
		<header>
			<h1>Track: ${localTrack ? localTrack["name"] : track.name}</h1>
		</header>
		<main id="two-columns">
			<section id="leaderBoard">
				${renderCountdown(3)}
			</section>

			<section id="accelerate">
				<h2>Directions</h2>
				<p>Click the button as fast as you can to make your racer go faster!</p>
				<button id="gas-peddle">Click Me To Win!</button>
			</section>
		</main>
		<footer></footer>
	`
}

function resultsView(positions) {
	positions.sort((a, b) => (a["final_position"] > b["final_position"]) ? 1 : -1)
	return `
		<header>
			<h1>Race Results</h1>
		</header>
		<main>
			${raceProgress(positions, true)}
			<a href="/race" class="button">Start a new race</a>
		</main>
	`
}

//Modified race to show final place when it finishes
function raceProgress(positions, isFinished = false) {
	let userPlayer = positions.find(e => e.id === store["player_id"])
	userPlayer.driver_name += " (you)"

	positions = positions.sort((a, b) => (a["segment"] > b["segment"]) ? -1 : 1)
	let count = 1

	const results = positions.map(p => {
	const localRacer = getLocal(p.id,"cars");
	const racerName = localRacer ? localRacer["driver_name"] : p.driver_name;
	const positionImage = `http://localhost:3000/assets/images/positions/${count}.png`;
	const { lap, completion } = getLapAndRaceCompletion(p["segment"]);
	const imgUrl = renderRacer(racerName);
	count++;
		return `
			<tr>
				<td>
					<!--Renders racer cards with an icon to mark the position of the racer -->
					<div style="display: inline-block; position: relative">
						<h4>${racerName} ${p.id === store["player_id"] ? " (You)" : ""}</h4>
						<!--In case the race segments could not be obtained it do not show any information -->
						<p class="race-info">LAP: ${lap > 0 ? lap : ""}</p>
						<p class="race-info">COMPLETION: ${completion > 0 ? completion.toFixed(2)+"%" : ""}</p>
						<!--Only when race finishes it shows the position icons -->
						${
							isFinished ?
							`<img src=${positionImage} alt=${`position ${count}`} width="32px" height="32px" style="position: absolute; bottom: 10px; left: 10px">` :
							""
						}
						<img id="racer-image" src=${imgUrl} alt=${racerName}>
					</div>
				</td>
			</tr>
		`
	}).join("")

	return `
		<main>
			<h3>Leaderboard</h3>
			<section id="leaderBoard">
				${results}
				 <div style="margin-top: 20px">Icons made by <a href="https://www.flaticon.com/authors/freepik" title="Freepik">Freepik</a> from <a href="https://www.flaticon.com/" title="Flaticon">www.flaticon.com</a></div>
			</section>
		</main>
	`
}

/**
 * If race segments exist returns the lap the racer is in and the race completion
 * in percentage of the racer.
 * @param {number} racerSegment
 * @return {{completion: number, lap: number}}
 */
function getLapAndRaceCompletion(racerSegment) {
	return store["race_segments"] ? {
		lap: Math.floor(((racerSegment/store["race_segments"])/(1/4))+1),
		completion: (racerSegment*100) / store["race_segments"]
	} : {
		lap: -1,
		completion: -1
	}
}

function renderAt(element, html) {
	const node = document.querySelector(element)

	node.innerHTML = html
}

// ^ Provided code ^ do not remove


// API CALLS ------------------------------------------------

const SERVER = 'http://localhost:8000'

function defaultFetchOpts() {
	return {
		mode: 'cors',
		headers: {
			'Content-Type': 'application/json',
			'Access-Control-Allow-Origin' : SERVER,
		},
	}
}

function getTracks() {
	return fetch(`${SERVER}/api/tracks`)
	.then(res => res.json())
	.catch(err => console.log("Could not get track::",err))
}

function getRacers() {
	return fetch(`${SERVER}/api/cars`)
	.then(res => res.json())
	.catch(err => console.log("Could not get racers::",err))
}

function createRace(player_id, track_id) {
	player_id = parseInt(player_id)
	track_id = parseInt(track_id)
	const body = { player_id, track_id }
	
	return fetch(`${SERVER}/api/races`, {
		method: 'POST',
		...defaultFetchOpts(),
		dataType: 'jsonp',
		body: JSON.stringify(body)
	})
	.then(res => res.json())
	.catch(err => console.log("Problem with createRace request::", err))
}

function getRace(id) {
	return fetch(`${SERVER}/api/races/${id}`)
		.then(res => res.json())
		.catch(err => console.log("Could not get race info for race::",err));
}

function startRace(id) {
	return fetch(`${SERVER}/api/races/${id}/start`, {
		method: 'POST',
		...defaultFetchOpts(),
		dataType: 'jsonp',
		body: JSON.stringify({})
	})
	.then(() => console.log("START RACE!!!"))
	.catch(err => console.log("Problem with start race request::", err))
}

function accelerate(id) {
	return fetch(`${SERVER}/api/races/${id}/accelerate`,{
		method: "POST",
		...defaultFetchOpts()
	})
	.catch(err => console.log("Problem accelerating the racer::",err))
	// options parameter provided as defaultFetchOpts
	// no body or datatype needed for this request
}

// LOCAL DATA FETCH
/**
 * This functions gets a local data dictionary json
 * to make the game have a customizable theme with racers
 * and tracks
 * @return {Promise<Response | void>}
 */
function getLocalData() {
	return fetch("http://localhost:3000/assets/data/data_dict.json")
		.then(res => res.json())
		.catch(err => console.log("Problem loading local game data::",err));
}
