export interface CountryInfo {
  postalLabel: string;
  postalPlaceholder: string;
}

export const countryLabels: { [key: string]: CountryInfo } = {
  'United States': {
    postalLabel: 'Zip Code',
    postalPlaceholder: 'Enter zip code'
  },
  'Canada': {
    postalLabel: 'Postal Code',
    postalPlaceholder: 'Enter postal code (e.g., M5H 2N2)'
  },
  'United Kingdom': {
    postalLabel: 'Postal Code',
    postalPlaceholder: 'Enter postal code (e.g., SW1A 1AA)'
  },
  'Australia': {
    postalLabel: 'Postal Code',
    postalPlaceholder: 'Enter postal code'
  },
  'Germany': {
    postalLabel: 'Postal Code',
    postalPlaceholder: 'Enter postal code'
  },
  'France': {
    postalLabel: 'Postal Code',
    postalPlaceholder: 'Enter postal code'
  }
};

// Comprehensive country-city-postal code mapping
export const countryData: { [key: string]: { [key: string]: string } } = {
  'United States': {
    'New York': '10001',
    'Los Angeles': '90210',
    'Chicago': '60601',
    'Houston': '77001',
    'Phoenix': '85001',
    'Philadelphia': '19101',
    'San Antonio': '78201',
    'San Diego': '92101',
    'Dallas': '75201',
    'San Jose': '95101',
    'Miami': '33101',
    'Boston': '02101',
    'Seattle': '98101',
    'Denver': '80201',
    'Atlanta': '30301'
  },
  'Canada': {
    'Toronto': 'M5H 2N2',
    'Vancouver': 'V6B 1A1',
    'Montreal': 'H3A 0G4',
    'Calgary': 'T2P 0A1',
    'Ottawa': 'K1P 1J1',
    'Edmonton': 'T5J 0K1',
    'Winnipeg': 'R3C 0V8',
    'Quebec City': 'G1R 2L3',
    'Halifax': 'B3J 1S9',
    'Victoria': 'V8W 1P6'
  },
  'United Kingdom': {
    'London': 'SW1A 1AA',
    'Manchester': 'M1 1AA',
    'Birmingham': 'B1 1AA',
    'Glasgow': 'G1 1AA',
    'Liverpool': 'L1 8JQ',
    'Bristol': 'BS1 4DJ',
    'Leeds': 'LS1 4AP',
    'Sheffield': 'S1 2HE',
    'Edinburgh': 'EH1 1YZ',
    'Cardiff': 'CF10 3AT'
  },
  'Australia': {
    'Sydney': '2000',
    'Melbourne': '3000',
    'Brisbane': '4000',
    'Perth': '6000',
    'Adelaide': '5000',
    'Gold Coast': '4217',
    'Newcastle': '2300',
    'Canberra': '2600',
    'Sunshine Coast': '4558',
    'Wollongong': '2500'
  },
  'Germany': {
    'Berlin': '10115',
    'Munich': '80331',
    'Hamburg': '20095',
    'Cologne': '50667',
    'Frankfurt': '60311',
    'Stuttgart': '70173',
    'Düsseldorf': '40213',
    'Dortmund': '44135',
    'Essen': '45127',
    'Leipzig': '04109'
  },
  'France': {
    'Paris': '75001',
    'Marseille': '13001',
    'Lyon': '69001',
    'Toulouse': '31000',
    'Nice': '06000',
    'Nantes': '44000',
    'Strasbourg': '67000',
    'Montpellier': '34000',
    'Bordeaux': '33000',
    'Lille': '59000'
  }
};

export const countries = Object.keys(countryData);

export const getAvailableCities = (country: string) => {
  if (!country) return [];
  return Object.keys(countryData[country] || {});
};

export const getPostalLabel = (country: string): string => {
  return countryLabels[country]?.postalLabel || 'Postal Code';
};

export const getPostalPlaceholder = (country: string): string => {
  return countryLabels[country]?.postalPlaceholder || 'Enter postal code';
};
