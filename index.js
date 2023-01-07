let filters = {
	ultimate_syllable: "",
	penultimate_syllable: "",
	antepenultimate_syllable: "",
	stress_from_end: ""
};

let currentlyAppliedFilters = {};

const getSearchWordData = async e => {
	// Step 1: get a reference to the index that contains our word data.
	const index = searchClient.initIndex('rhyme-dictionary');

	// Step 2: search whatever is in the input box through our index and pull the first hit out into a variable called `result`.
	const result = (await index.search(e.target.value)).hits[0];

	// Step 3: get the element where we'll put the definitions of the inputted word
	const ul = document.getElementById("definitions");

	// Step 4: if we got a result from the search at all, and that first result matches exactly the word the user typed in, then they typed in a legitimate query, so...
	if (!!result && result.word == e.target.value) {
		// list out all of its definitions...
		ul.innerHTML = "<li>" + result.definitions.join("</li><li>") + "</li>";

		// fill the `filters` object with the applicable facet data...
		[
			"ultimate_syllable",
			"penultimate_syllable",
			"antepenultimate_syllable",
			"stress_from_end"
		].forEach(key => {
			filters[key] = result[key].toString();
		});

		// refresh InstantSearch...
		search.refresh();

		// and make sure the results of the new search aren't hidden
		document.getElementById("hits").classList.remove("hidden");
	} else {
		// The user didn't enter a legitimate query, so just empty the definitions unordered list to avoid confusion.
		ul.innerHTML = "";
		document.getElementById("hits").classList.add("hidden");
	}
};

const renderMenu = (renderOptions, isFirstRender) => {
	// Step 1: break down our inputs
	const {
		items, // this is an array of filter options, with the activated ones at the top
		refine, // this is a function that, when called, toggles refinement on whatever filter option you pass it
		widgetParams // this is the object we passed into this in the widgets array
	} = renderOptions;

	// Step 2: if we're rendering this component for the first time and we have a query selector telling us where to stick our refresh event, stick the refresh event there
	if (
		isFirstRender
		&& !!widgetParams.eventListenerTargetQuerySelector
	) {
		document.querySelector(
			widgetParams.eventListenerTargetQuerySelector
		).addEventListener(
			widgetParams.eventListenerType ?? "click",
			e => {
				// as an exception, we won't refresh the search if we've put this event on a select and the user made that select not affect this particular filter. another instance of this component for that other filter will take care of that.
				if (
					widgetParams.eventListenerType == "change"
					&& e.target.value != widgetParams.attribute
				) return;
				search.refresh();
			}
		)
	}

	// Step 3: if the user just just switched this filter off, then delete it from our record of currently applied filters and toggle the refinement off. if the filter was just switched on, and it is definitely switch-on-able, then add it to that record and toggle the refinement on
	if (
		!widgetParams.on()
		&& !!currentlyAppliedFilters[widgetParams.attribute]
	) {
		console.log(`Removing refinement on ${widgetParams.attribute}`);
		delete currentlyAppliedFilters[widgetParams.attribute];
		refine(filters[widgetParams.attribute]); // toggles refinement off here
	} else if (
		widgetParams.on()
		&& currentlyAppliedFilters[widgetParams.attribute] != filters[widgetParams.attribute]
		&& !!filters[widgetParams.attribute]
		&& items.filter(x => x.value == filters[widgetParams.attribute]).every(x => !x.isRefined)
	) {
		console.log(`Refining ${widgetParams.attribute} to ${filters[widgetParams.attribute]}`);
		refine(filters[widgetParams.attribute]); // toggles refinement on here
		currentlyAppliedFilters[widgetParams.attribute] = filters[widgetParams.attribute];
	}
};

const widgets = [
	instantsearch.connectors.connectMenu(renderMenu)({
		attribute: "ultimate_syllable",
		on: () => true, // we always want to match at least the final syllable
		eventListenerTargetQuerySelector: "#syllable-match-count",
		eventListenerType: "change"
	}),
	instantsearch.connectors.connectMenu(renderMenu)({
		attribute: "penultimate_syllable",
		on: () => document.getElementById("syllable-match-count").value != "ultimate_syllable",
		eventListenerTargetQuerySelector: "#syllable-match-count",
		eventListenerType: "change"
	}),
	instantsearch.connectors.connectMenu(renderMenu)({
		attribute: "antepenultimate_syllable",
		on: () => document.getElementById("syllable-match-count").value == "antepenultimate_syllable",
		eventListenerTargetQuerySelector: "#syllable-match-count",
		eventListenerType: "change"
	}),
	instantsearch.connectors.connectMenu(renderMenu)({
		attribute: "stress_from_end",
		on: () => !!document.getElementById("stress-checkbox").checked,
		eventListenerTargetQuerySelector: "#stress-checkbox"
	}),
	instantsearch.widgets.searchBox({
		container: '#searchbox'
	}),
	instantsearch.widgets.hits({
		container: '#hits',
		templates: {
			item: hit => `
				<div class="hit" onclick="hitClicked('${hit.word}')" id="word-${hit.word}">
					<span class="result-word">${hit.word}</span>
					<div class="result-definitions-container")">
						<div class="result-definitions" onclick="event.stopPropagation()">
							<h3>${hit.word} (pronounced ${hit.pronunciation})</h3>
							<ul>${
								hit
									.definitions
									.map(definition => `<li>${definition}</li>`)
									.join("")
							}</ul>
						</div>
					</div>
				</div>
			`,
		}
	}),
	instantsearch.widgets.pagination({
		container: '#pagination'
	})
];

const onload = () => {
	window.searchClient = algoliasearch('3HQRD5FDNO', 'e1ceb9c8c9e6e287d14eb1ba8bc433d1');
	window.search = instantsearch({
		indexName: 'rhyme-dictionary',
		searchClient
	});
	search.addWidgets(widgets);
	search.start();
};

const hitClicked = word => {
	document.getElementById(`word-${word}`).classList.toggle("activated");
};

window.addEventListener("load", onload);
document.getElementById("rhymes-with").addEventListener("input", getSearchWordData);
