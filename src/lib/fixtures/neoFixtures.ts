/**
 * Realistic-density NeoWs-shaped mock records (D-05, D-11).
 *
 * These records are shaped and typed exactly like a real `/neo/rest/v1/feed`
 * response, with real-looking numeric density rather than lorem text or
 * empty skeletons — that density is the point: it is what makes VT323's
 * legibility in dense numeric tables judgeable by eye during this phase
 * rather than after Phase 4 has been built on top of it.
 *
 * Phase 3's fetch layer reuses this exact module to exercise its loading,
 * rate-limited, unavailable and empty states — do not delete it once real
 * fetching exists.
 */

import type { NeoObject } from "@/types/neows";

export const NEO_FIXTURES: NeoObject[] = [
  {
    id: "54016849",
    neo_reference_id: "54016849",
    name: "(2025 XJ3)",
    nasa_jpl_url:
      "https://ssd.jpl.nasa.gov/tools/sbdb_lookup.html#/?sstr=54016849",
    absolute_magnitude_h: 22.4,
    estimated_diameter: {
      kilometers: { estimated_diameter_min: 0.021, estimated_diameter_max: 0.047 },
      meters: { estimated_diameter_min: 21, estimated_diameter_max: 47 },
      miles: { estimated_diameter_min: 0.013049, estimated_diameter_max: 0.029204 },
      feet: { estimated_diameter_min: 68.8976, estimated_diameter_max: 154.1995 },
    },
    is_potentially_hazardous_asteroid: true,
    is_sentry_object: true,
    close_approach_data: [
      {
        close_approach_date: "2026-11-03",
        close_approach_date_full: "2026-Nov-03 03:00",
        epoch_date_close_approach: 1793674800000,
        relative_velocity: {
          kilometers_per_second: "19.8700",
          kilometers_per_hour: "71532.0000",
          miles_per_hour: "44447.9104",
        },
        miss_distance: {
          astronomical: "0.00719475",
          lunar: "2.8000",
          kilometers: "1076320.000",
          miles: "668794.035",
        },
        orbiting_body: "Earth",
      },
      {
        close_approach_date: "2029-06-17",
        close_approach_date_full: "2029-Jun-17 14:22",
        epoch_date_close_approach: 1876400520000,
        relative_velocity: {
          kilometers_per_second: "21.0200",
          kilometers_per_hour: "75672.0000",
          miles_per_hour: "47020.3863",
        },
        miss_distance: {
          astronomical: "0.02415382",
          lunar: "9.4000",
          kilometers: "3613360.000",
          miles: "2245237.117",
        },
        orbiting_body: "Earth",
      },
    ],
  },
  {
    id: "20154029",
    neo_reference_id: "20154029",
    name: "(2024 PT5)",
    nasa_jpl_url:
      "https://ssd.jpl.nasa.gov/tools/sbdb_lookup.html#/?sstr=20154029",
    absolute_magnitude_h: 19.1,
    estimated_diameter: {
      kilometers: { estimated_diameter_min: 0.29, estimated_diameter_max: 0.66 },
      meters: { estimated_diameter_min: 290, estimated_diameter_max: 660 },
      miles: { estimated_diameter_min: 0.180198, estimated_diameter_max: 0.410105 },
      feet: { estimated_diameter_min: 951.4436, estimated_diameter_max: 2165.3544 },
    },
    is_potentially_hazardous_asteroid: false,
    is_sentry_object: false,
    close_approach_data: [
      {
        close_approach_date: "2027-02-19",
        close_approach_date_full: "2027-Feb-19 09:47",
        epoch_date_close_approach: 1803030420000,
        relative_velocity: {
          kilometers_per_second: "13.4400",
          kilometers_per_hour: "48384.0000",
          miles_per_hour: "30064.4145",
        },
        miss_distance: {
          astronomical: "0.08119795",
          lunar: "31.6000",
          kilometers: "12147040.000",
          miles: "7547818.392",
        },
        orbiting_body: "Earth",
      },
    ],
  },
  {
    id: "20301946",
    neo_reference_id: "20301946",
    name: "(2023 DW)",
    nasa_jpl_url:
      "https://ssd.jpl.nasa.gov/tools/sbdb_lookup.html#/?sstr=20301946",
    absolute_magnitude_h: 24.8,
    estimated_diameter: {
      kilometers: { estimated_diameter_min: 0.011, estimated_diameter_max: 0.024 },
      meters: { estimated_diameter_min: 11, estimated_diameter_max: 24 },
      miles: { estimated_diameter_min: 0.006835, estimated_diameter_max: 0.014913 },
      feet: { estimated_diameter_min: 36.0892, estimated_diameter_max: 78.7402 },
    },
    is_potentially_hazardous_asteroid: false,
    is_sentry_object: false,
    close_approach_data: [
      {
        close_approach_date: "2028-08-05",
        close_approach_date_full: "2028-Aug-05 21:03",
        epoch_date_close_approach: 1849122180000,
        relative_velocity: {
          kilometers_per_second: "9.0200",
          kilometers_per_hour: "32472.0000",
          miles_per_hour: "20177.1591",
        },
        miss_distance: {
          astronomical: "0.14980507",
          lunar: "58.3000",
          kilometers: "22410520.000",
          miles: "13925247.223",
        },
        orbiting_body: "Earth",
      },
    ],
  },
  {
    id: "20412873",
    neo_reference_id: "20412873",
    name: "(2027 KA2)",
    nasa_jpl_url:
      "https://ssd.jpl.nasa.gov/tools/sbdb_lookup.html#/?sstr=20412873",
    absolute_magnitude_h: 17.6,
    estimated_diameter: {
      kilometers: { estimated_diameter_min: 0.71, estimated_diameter_max: 1.59 },
      meters: { estimated_diameter_min: 710, estimated_diameter_max: 1590 },
      miles: { estimated_diameter_min: 0.441173, estimated_diameter_max: 0.98798 },
      feet: { estimated_diameter_min: 2329.3964, estimated_diameter_max: 5216.5356 },
    },
    is_potentially_hazardous_asteroid: true,
    is_sentry_object: false,
    close_approach_data: [
      {
        close_approach_date: "2026-04-22",
        close_approach_date_full: "2026-Apr-22 06:15",
        epoch_date_close_approach: 1776838500000,
        relative_velocity: {
          kilometers_per_second: "24.9100",
          kilometers_per_hour: "89676.0000",
          miles_per_hour: "55722.0658",
        },
        miss_distance: {
          astronomical: "0.01310473",
          lunar: "5.1000",
          kilometers: "1960440.000",
          miles: "1218160.563",
        },
        orbiting_body: "Earth",
      },
      {
        close_approach_date: "2033-09-30",
        close_approach_date_full: "2033-Sep-30 18:38",
        epoch_date_close_approach: 2011718280000,
        relative_velocity: {
          kilometers_per_second: "26.7700",
          kilometers_per_hour: "96372.0000",
          miles_per_hour: "59882.7660",
        },
        miss_distance: {
          astronomical: "0.03648769",
          lunar: "14.2000",
          kilometers: "5458480.000",
          miles: "3391741.176",
        },
        orbiting_body: "Earth",
      },
    ],
  },
  {
    id: "20528310",
    neo_reference_id: "20528310",
    name: "(2019 OK)",
    nasa_jpl_url:
      "https://ssd.jpl.nasa.gov/tools/sbdb_lookup.html#/?sstr=20528310",
    absolute_magnitude_h: 23.5,
    estimated_diameter: {
      kilometers: { estimated_diameter_min: 0.016, estimated_diameter_max: 0.036 },
      meters: { estimated_diameter_min: 16, estimated_diameter_max: 36 },
      miles: { estimated_diameter_min: 0.009942, estimated_diameter_max: 0.022369 },
      feet: { estimated_diameter_min: 52.4934, estimated_diameter_max: 118.1102 },
    },
    is_potentially_hazardous_asteroid: false,
    is_sentry_object: false,
    close_approach_data: [
      {
        close_approach_date: "2026-07-25",
        close_approach_date_full: "2026-Jul-25 11:52",
        epoch_date_close_approach: 1784980320000,
        relative_velocity: {
          kilometers_per_second: "24.5500",
          kilometers_per_hour: "88380.0000",
          miles_per_hour: "54916.7690",
        },
        miss_distance: {
          astronomical: "0.00048822",
          lunar: "0.1900",
          kilometers: "73036.000",
          miles: "45382.452",
        },
        orbiting_body: "Earth",
      },
    ],
  },
  {
    id: "20601187",
    neo_reference_id: "20601187",
    name: "(2031 QW9)",
    nasa_jpl_url:
      "https://ssd.jpl.nasa.gov/tools/sbdb_lookup.html#/?sstr=20601187",
    absolute_magnitude_h: 16.2,
    estimated_diameter: {
      kilometers: { estimated_diameter_min: 1.34, estimated_diameter_max: 3.02 },
      meters: { estimated_diameter_min: 1340, estimated_diameter_max: 3020 },
      miles: { estimated_diameter_min: 0.832637, estimated_diameter_max: 1.87654 },
      feet: { estimated_diameter_min: 4396.3256, estimated_diameter_max: 9908.1368 },
    },
    is_potentially_hazardous_asteroid: true,
    is_sentry_object: true,
    close_approach_data: [
      {
        close_approach_date: "2030-01-11",
        close_approach_date_full: "2030-Jan-11 00:29",
        epoch_date_close_approach: 1894321740000,
        relative_velocity: {
          kilometers_per_second: "31.2900",
          kilometers_per_hour: "112644.0000",
          miles_per_hour: "69993.7149",
        },
        miss_distance: {
          astronomical: "0.05832891",
          lunar: "22.7000",
          kilometers: "8725880.000",
          miles: "5422008.781",
        },
        orbiting_body: "Earth",
      },
    ],
  },
];
