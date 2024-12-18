export const fetchCoordsByName = async (countryName: string, cityName: string) => {
  const res = await fetch(`http://api.geonames.org/searchJSON?q=${countryName}%20f${cityName}&maxRows=1&username=demo`)
  const data = await res.json()
  console.log(data)
  return data
}