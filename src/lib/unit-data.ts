export const UNIT_CATEGORIES = [
  {
    id: 'length',
    name: 'Length',
    units: [
      { id: 'meter', name: 'Meter' }, { id: 'kilometer', name: 'Kilometer' }, { id: 'centimeter', name: 'Centimeter' },
      { id: 'millimeter', name: 'Millimeter' }, { id: 'micrometer', name: 'Micrometer' }, { id: 'nanometer', name: 'Nanometer' },
      { id: 'picometer', name: 'Picometer' }, { id: 'fentometer', name: 'Femtometer' }, { id: 'angstrom', name: 'Angstrom' },
      { id: 'inch', name: 'Inch' }, { id: 'foot', name: 'Foot' }, { id: 'yard', name: 'Yard' }, { id: 'mile', name: 'Mile' },
      { id: 'nautical_mile', name: 'Nautical Mile' }, { id: 'lightyear', name: 'Light Year' }, { id: 'parsec', name: 'Parsec' },
      { id: 'au', name: 'Astronomical Unit' }, { id: 'furlong', name: 'Furlong' }, { id: 'chain', name: 'Chain' },
      { id: 'rod', name: 'Rod' }, { id: 'hand', name: 'Hand' }, { id: 'span', name: 'Span' }, { id: 'league', name: 'League' },
      { id: 'micron', name: 'Micron' }, { id: 'smoot', name: 'Smoot' }, { id: 'thou', name: 'Thou' }, { id: 'caliper', name: 'Caliper' },
      { id: 'link', name: 'Link' }, { id: 'pica', name: 'Pica' }, { id: 'point', name: 'Point' }, { id: 'plank_length', name: 'Plank Length' },
      { id: 'ell', name: 'Ell' }
    ]
  },
  {
    id: 'weight',
    name: 'Weight / Mass',
    units: [
      { id: 'kilogram', name: 'Kilogram' }, { id: 'gram', name: 'Gram' }, { id: 'milligram', name: 'Milligram' },
      { id: 'microgram', name: 'Microgram' }, { id: 'metric_ton', name: 'Metric Ton' }, { id: 'quintal', name: 'Quintal' },
      { id: 'pound', name: 'Pound (lb)' }, { id: 'ounce', name: 'Ounce (oz)' }, { id: 'stone', name: 'Stone' },
      { id: 'carat', name: 'Carat' }, { id: 'grain', name: 'Grain' }, { id: 'slug', name: 'Slug' },
      { id: 'troy_ounce', name: 'Troy Ounce' }, { id: 'troy_pound', name: 'Troy Pound' }, { id: 'pennyweight', name: 'Pennyweight' },
      { id: 'amu', name: 'Atomic Mass Unit' }, { id: 'solar_mass', name: 'Solar Mass' }, { id: 'dram', name: 'Dram' },
      { id: 'quarter', name: 'Quarter' }, { id: 'hundredweight_us', name: 'Hundredweight (US)' }, { id: 'hundredweight_uk', name: 'Hundredweight (UK)' }
    ]
  },
  {
    id: 'area',
    name: 'Area',
    units: [
      { id: 'square_meter', name: 'Square Meter' }, { id: 'square_kilometer', name: 'Square Kilometer' },
      { id: 'square_centimeter', name: 'Square Centimeter' }, { id: 'square_millimeter', name: 'Square Millimeter' },
      { id: 'hectare', name: 'Hectare' }, { id: 'acre', name: 'Acre' }, { id: 'square_mile', name: 'Square Mile' },
      { id: 'square_yard', name: 'Square Yard' }, { id: 'square_foot', name: 'Square Foot' }, { id: 'square_inch', name: 'Square Inch' },
      { id: 'killa', name: 'Killa' }, { id: 'kanal', name: 'Kanal' }, { id: 'marla', name: 'Marla' }, { id: 'bigha', name: 'Bigha' },
      { id: 'kaccha_bigha', name: 'Kaccha Bigha' }, { id: 'biswa', name: 'Biswa' }, { id: 'biswansi', name: 'Biswansi' },
      { id: 'sq_karam', name: 'Sq Karam' }, { id: 'guntha', name: 'Guntha' }, { id: 'ground', name: 'Ground' },
      { id: 'cent', name: 'Cent' }, { id: 'are', name: 'Are' }, { id: 'chatak', name: 'Chatak' }, { id: 'cottah', name: 'Cottah' },
      { id: 'decimal', name: 'Decimal' }, { id: 'rood', name: 'Rood' }, { id: 'perch', name: 'Perch' }, { id: 'section', name: 'Section' }
    ]
  },
  {
    id: 'volume',
    name: 'Volume',
    units: [
      { id: 'liter', name: 'Liter' }, { id: 'milliliter', name: 'Milliliter' }, { id: 'cubic_meter', name: 'Cubic Meter' },
      { id: 'cubic_centimeter', name: 'Cubic Centimeter' }, { id: 'cubic_millimeter', name: 'Cubic Millimeter' },
      { id: 'us_gallon', name: 'US Gallon' }, { id: 'us_quart', name: 'US Quart' }, { id: 'us_pint', name: 'US Pint' },
      { id: 'us_cup', name: 'US Cup' }, { id: 'us_fluid_ounce', name: 'US Fluid Ounce' }, { id: 'us_tablespoon', name: 'US Tablespoon' },
      { id: 'us_teaspoon', name: 'US Teaspoon' }, { id: 'imp_gallon', name: 'Imp Gallon' }, { id: 'imp_quart', name: 'Imp Quart' },
      { id: 'imp_pint', name: 'Imp Pint' }, { id: 'imp_cup', name: 'Imp Cup' }, { id: 'imp_fluid_ounce', name: 'Imp Fluid Ounce' },
      { id: 'imp_tablespoon', name: 'Imp Tablespoon' }, { id: 'imp_teaspoon', name: 'Imp Teaspoon' }, { id: 'barrel_oil', name: 'Barrel (Oil)' },
      { id: 'hogshead', name: 'Hogshead' }, { id: 'bushel_us', name: 'Bushel (US)' }, { id: 'peck_us', name: 'Peck (US)' },
      { id: 'gill_us', name: 'Gill (US)' }, { id: 'dash', name: 'Dash' }, { id: 'pinch', name: 'Pinch' },
      { id: 'drop', name: 'Drop' }, { id: 'minim', name: 'Minim' }, { id: 'board_foot', name: 'Board Foot' }
    ]
  },
  {
    id: 'time',
    name: 'Time',
    units: [
      { id: 'second', name: 'Second' }, { id: 'millisecond', name: 'Millisecond' }, { id: 'microsecond', name: 'Microsecond' },
      { id: 'nanosecond', name: 'Nanosecond' }, { id: 'picosecond', name: 'Picosecond' }, { id: 'minute', name: 'Minute' },
      { id: 'hour', name: 'Hour' }, { id: 'day', name: 'Day' }, { id: 'week', name: 'Week' }, { id: 'fortnight', name: 'Fortnight' },
      { id: 'month_avg', name: 'Month (Avg)' }, { id: 'year_julian', name: 'Year (Julian)' }, { id: 'decade', name: 'Decade' },
      { id: 'century', name: 'Century' }, { id: 'millennium', name: 'Millennium' }
    ]
  },
  {
    id: 'speed',
    name: 'Speed',
    units: [
      { id: 'mps', name: 'm/s' }, { id: 'kmph', name: 'km/h' }, { id: 'mph', name: 'mph' }, { id: 'knot', name: 'Knot' },
      { id: 'mach', name: 'Mach' }, { id: 'light', name: 'Speed of Light' }, { id: 'fps', name: 'fps' }
    ]
  },
  {
    id: 'temperature',
    name: 'Temperature',
    units: [
      { id: 'celsius', name: 'Celsius' }, { id: 'fahrenheit', name: 'Fahrenheit' }, { id: 'kelvin', name: 'Kelvin' }
    ]
  },
  {
    id: 'data',
    name: 'Digital Data',
    units: [
      { id: 'bit', name: 'Bit (b)' }, { id: 'byte', name: 'Byte (B)' }, { id: 'kilobit', name: 'Kilobit (Kb)' },
      { id: 'kilobyte', name: 'Kilobyte (KB)' }, { id: 'megabit', name: 'Megabit (Mb)' }, { id: 'megabyte', name: 'Megabyte (MB)' },
      { id: 'gigabit', name: 'Gigabit (Gb)' }, { id: 'gigabyte', name: 'Gigabyte (GB)' }, { id: 'terabit', name: 'Terabit (Tb)' },
      { id: 'terabyte', name: 'Terabyte (TB)' }, { id: 'petabit', name: 'Petabit (Pb)' }, { id: 'petabyte', name: 'Petabyte (PB)' },
      { id: 'kibibyte', name: 'Kibibyte (KiB)' }, { id: 'mebibyte', name: 'Mebibyte (MiB)' }, { id: 'gibibyte', name: 'Gibibyte (GiB)' },
      { id: 'tebibyte', name: 'Tebibyte (TiB)' }
    ]
  },
  {
    id: 'energy',
    name: 'Energy',
    units: [
      { id: 'joule', name: 'Joule' }, { id: 'kilojoule', name: 'Kilojoule' }, { id: 'calorie', name: 'Calorie' },
      { id: 'kilocalorie', name: 'KiloCalorie' }, { id: 'watt_hour', name: 'Watt Hour' }, { id: 'kilowatt_hour', name: 'Kilowatt Hour' },
      { id: 'btu', name: 'BTU' }, { id: 'electronvolt', name: 'Electronvolt' }, { id: 'foot_pound', name: 'Foot Pound' }
    ]
  },
  {
    id: 'power',
    name: 'Power',
    units: [
      { id: 'watt', name: 'Watt' }, { id: 'kilowatt', name: 'Kilowatt' }, { id: 'megawatt', name: 'Megawatt' },
      { id: 'horsepower', name: 'Horsepower' }, { id: 'btu_hr', name: 'BTU/hr' }
    ]
  },
  {
    id: 'pressure',
    name: 'Pressure',
    units: [
      { id: 'pascal', name: 'Pascal' }, { id: 'bar', name: 'Bar' }, { id: 'psi', name: 'PSI' },
      { id: 'atmosphere', name: 'Atmosphere' }, { id: 'torr', name: 'Torr' }, { id: 'kpa', name: 'kPa' },
      { id: 'mpa', name: 'MPa' }, { id: 'inhg', name: 'inHg' }
    ]
  },
  {
    id: 'force',
    name: 'Force',
    units: [
      { id: 'newton', name: 'Newton' }, { id: 'kilonewton', name: 'Kilonewton' }, { id: 'dyne', name: 'Dyne' },
      { id: 'lbf', name: 'Pound Force' }
    ]
  },
  {
    id: 'angle',
    name: 'Angle',
    units: [
      { id: 'degree', name: 'Degree' }, { id: 'radian', name: 'Radian' }, { id: 'gradian', name: 'Gradian' },
      { id: 'arcminute', name: 'Arcminute' }, { id: 'arcsecond', name: 'Arcsecond' }, { id: 'revolution', name: 'Revolution' }
    ]
  },
  {
    id: 'data_transfer',
    name: 'Data Transfer',
    units: [
      { id: 'bps', name: 'bps' }, { id: 'kbps', name: 'kbps' }, { id: 'mbps', name: 'Mbps' },
      { id: 'gbps', name: 'Gbps' }, { id: 'tbps', name: 'Tbps' }, { id: 'b_s', name: 'B/s' },
      { id: 'kb_s', name: 'KB/s' }, { id: 'mb_s', name: 'MB/s' }, { id: 'gb_s', name: 'GB/s' },
      { id: 'tb_s', name: 'TB/s' }
    ]
  },
  {
    id: 'cooking',
    name: 'Cooking',
    units: [
      { id: 'us_tablespoon', name: 'US Tablespoon' }, { id: 'us_teaspoon', name: 'US Teaspoon' },
      { id: 'us_cup', name: 'US Cup' }, { id: 'us_fluid_ounce', name: 'US Fluid Ounce' },
      { id: 'imp_tablespoon', name: 'Imp Tablespoon' }, { id: 'imp_teaspoon', name: 'Imp Teaspoon' },
      { id: 'imp_cup', name: 'Imp Cup' }, { id: 'imp_fluid_ounce', name: 'Imp Fluid Ounce' },
      { id: 'dash', name: 'Dash' }, { id: 'pinch', name: 'Pinch' }, { id: 'drop', name: 'Drop' },
      { id: 'minim', name: 'Minim' }, { id: 'smidgen', name: 'Smidgen' }, { id: 'tad', name: 'Tad' }
    ]
  },
  {
    id: 'fuel',
    name: 'Fuel Consumption',
    units: [
      { id: 'kml', name: 'km/L' }, { id: 'l100km', name: 'L/100km' }, { id: 'mpgu', name: 'MPG (US)' },
      { id: 'mpgk', name: 'MPG (UK)' }, { id: 'mpl', name: 'Miles/Liter' }
    ]
  },
  {
    id: 'torque',
    name: 'Torque',
    units: [
      { id: 'nm', name: 'Newton Meter' }, { id: 'lbf_ft', name: 'Pound Foot' },
      { id: 'lbf_in', name: 'Pound Inch' }, { id: 'kgf_m', name: 'Kilogram Meter' },
      { id: 'ozf_in', name: 'Ounce Inch' }
    ]
  },
  {
    id: 'illuminance',
    name: 'Illuminance',
    units: [
      { id: 'lux', name: 'Lux' }, { id: 'foot_candle', name: 'Foot Candle' },
      { id: 'phot', name: 'Phot' }, { id: 'nox', name: 'Nox' }, { id: 'candlepower', name: 'Candlepower' }
    ]
  }
];
