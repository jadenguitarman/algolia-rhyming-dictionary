const client = algoliasearch('3HQRD5FDNO', 'e1ceb9c8c9e6e287d14eb1ba8bc433d1');

const index = client.initIndex('rhyme-dictionary')''

index.searchForFacetValues('category', 'phone', {
	filters: 'brand:apple'
}).then(({ facetHits }) => {
	console.log(facetHits);
});
