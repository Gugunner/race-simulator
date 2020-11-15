// PROVIDED CODE BELOW (LINES 1 - 80) DO NOT REMOVE

// The store will hold all information needed globally
var store = {
	track_id: undefined,
	player_id: undefined,
	race_id: undefined,
	local_data: undefined
}

// We need our javascript to wait until the DOM is loaded
document.addEventListener("DOMContentLoaded", function() {
	onPageLoad()
	setupClickHandlers()
})

async function onPageLoad() {
	try {

		 getLocalData()
			.then(localData => {
				console.log("LOCAL DATA", localData)
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
			handleCreateRace()
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
	if(!store["player_id"] || !store["track_id"]) {
		alert("Please select all options before starting a race!")
		return;
	}
	// render starting UI
	// TODO - Get player_id and track_id from the store
	const { player_id, track_id } = store;
	//TODO - invoke the API call to create the race, then save the result
	const race = await createRace(player_id, track_id)
	console.log("RACE",race);
	renderAt('#race', renderRaceStartView(race["Track"], race["racers"]))
	// TODO - update the store with the race id
	store["race_id"] = race["ID"];
	// The race has been created, now start the countdown
	// TODO - call the async function runCountdown
	await runCountdown()
	// TODO - call the async function startRace
	const raceId = store["race_id"] > 1 ? store["race_id"]-1 : store["race_id"];
	await startRace(raceId)
	// TODO - call the async function runRace
	await runRace(raceId)
}

function runRace(raceID) {
	return new Promise(resolve => {
	// TODO - use Javascript's built in setInterval method to get race info every 500ms
	const raceInfo = {};
	const raceInfoInterval = setInterval(() => {
		getRace(raceID).then(info => {

			Object.keys(info).forEach(k => raceInfo[k] = info[k]);
			if(raceInfo.hasOwnProperty("status") && raceInfo.hasOwnProperty("positions")) {
				/*
                    TODO - if the race info status property is "in-progress", update the leaderboard by calling:
                */
				if(raceInfo["status"] === "in-progress") {
					console.log("RACE IN PROGRESS");
					renderAt('#leaderBoard', raceProgress(raceInfo["positions"]))
				} else if(raceInfo["status"] === "finished") {
					/*
                        TODO - if the race info status property is "finished", run the following:
                    */
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
			// TODO - use Javascript's built in setInterval method to count down once per second
			const countDownInterval = setInterval(() => {
				timer -= 1
				// TODO - if the countdown is done, clear the interval, resolve the promise, and return
				if(timer === 0) {
					console.log("Times up!",timer)
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
	console.log("selected a pod", target.id)

	// remove class selected from all racer options
	const selected = document.querySelector('#racers .selected')
	if(selected) {
		selected.classList.remove('selected')
	}

	// add class selected to current target
	target.classList.add('selected')

	// TODO - save the selected racer to the store
	store["player_id"] = parseInt(target["id"])
}

function handleSelectTrack(target) {
	console.log("selected a track", target.id)

	// remove class selected from all track options
	const selected = document.querySelector('#tracks .selected')
	if(selected) {
		selected.classList.remove('selected')
	}

	// add class selected to current target
	target.classList.add('selected')

	// TODO - save the selected track id to the store
	store["track_id"] = parseInt(target["id"])
	
}

function handleAccelerate() {
	console.log("accelerate button clicked")
	// TODO - Invoke the API call to accelerate
	const raceId = store["race_id"] > 1 ? store["race_id"]-1 : store["race_id"];
	accelerate(raceId);
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

function renderRacerCard(racer) {
	const { id, driver_name, top_speed, acceleration, handling } = racer
	let localRacer =  getLocalRacer(id);
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

function getLocalRacer(racerId) {
	console.log("STORE",store)
	if(store["local_data"] && store["local_data"].hasOwnProperty("cars")) {
		return store["local_data"]["cars"].find(racer => racer["id"] === racerId);
	}
	return undefined;
}

function renderRacer(racerName) {
	return `http://localhost:3000/assets/images/${racerName}.png`;
}

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

function renderTrackCard(track) {
	const { id, name } = track

	return `
		<li id="${id}" class="card track">
			<h3>${name}</h3>
		</li>
	`
}

function renderCountdown(count) {
	return `
		<h2>Race Starts In...</h2>
		<p id="big-numbers">${count}</p>
	`
}

function renderRaceStartView(track, racers) {
	return `
		<header>
			<h1>Race: ${track.name}</h1>
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
			${raceProgress(positions)}
			<a href="/race">Start a new race</a>
		</main>
	`
}

function raceProgress(positions) {
	let userPlayer = positions.find(e => e.id === store["player_id"])
	userPlayer.driver_name += " (you)"

	positions = positions.sort((a, b) => (a["segment"] > b["segment"]) ? -1 : 1)
	let count = 1

	const results = positions.map(p => {
	const localRacer = getLocalRacer(p.id);
	const racerName = localRacer ? localRacer["driver_name"] : p.driver_name;
	const positionImage = `http://localhost:3000/assets/images/positions/png/${count}.png`;
	const imgUrl = renderRacer(racerName);
	count++;
		return `
			<tr>
				<td>
					<div style="display: inline-block; position: relative">
						<h3>${racerName}</h3>
						<img src=${positionImage} alt=${`position ${count}`} width="32px" height="32px" style="position: absolute; bottom: 10px; left: 10px">
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
			</section>
		</main>
	`
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

// TODO - Make a fetch call (with error handling!) to each of the following API endpoints 

function getTracks() {
	// GET request to `${SERVER}/api/tracks`
	return fetch(`${SERVER}/api/tracks`)
	.then(res => res.json())
	.catch(err => console.log("Could not get track::",err))
}

function getRacers() {
	// GET request to `${SERVER}/api/cars`
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
	// GET request to `${SERVER}/api/races/${id}`
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
	// POST request to `${SERVER}/api/races/${id}/accelerate`
	return fetch(`${SERVER}/api/races/${id}/accelerate`,{
		method: "POST",
		...defaultFetchOpts()
	})
	.then(() => console.log("ACCELERATED!!!"))
	.catch(err => console.log("Problem accelerating the racer::",err))
	// options parameter provided as defaultFetchOpts
	// no body or datatype needed for this request
}

// LOCAL DATA FETCH

function getLocalData() {
	return fetch("http://localhost:3000/assets/data/data_dict.json")
		.then(res => res.json())
		.catch(err => console.log("Problem loading local game data::",err));
}
