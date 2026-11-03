export const locationCatalog = [
  { value: "", label: "Select an area", disabled: true },
  { value: "Koramangala", label: "Koramangala", lat: 12.9352, lng: 77.6245 },
  { value: "Indiranagar", label: "Indiranagar", lat: 12.9784, lng: 77.6408 },
  { value: "MG Road", label: "MG Road", lat: 12.9758, lng: 77.6047 },
  { value: "Whitefield", label: "Whitefield", lat: 12.9698, lng: 77.75 },
  { value: "Electronic City", label: "Electronic City", lat: 12.8399, lng: 77.677 },
  { value: "Marathahalli", label: "Marathahalli", lat: 12.9591, lng: 77.6974 }
];

export function getLocationByName(name) {
  return locationCatalog.find((location) => location.value === name);
}
