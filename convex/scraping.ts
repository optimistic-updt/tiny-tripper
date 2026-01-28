"use node";

import { internalAction } from "./_generated/server";
import { v } from "convex/values";
import { env } from "./env";
import type { Id } from "./_generated/dataModel";
import { internal } from "./_generated/api";

// /**
//  * Extraction prompt for LLM-based activity data extraction from web pages
//  */
// const ACTIVITY_EXTRACTION_PROMPT = `Extract activity information from this page. For each activity found, extract the following fields:

// Required:
// - name (string): The name/title of the activity

// Optional:
// - description (string): Detailed description of the activity
// - location (object):
//   - name (string): Location name
//   - formattedAddress (string): Full address
//   - street_address (string): Street address component
//   - city (string): City
//   - state_province (string): State or province
//   - postal_code (string): Postal/ZIP code
//   - country_code (string): ISO 3166-1 alpha-2 country code
// - startDate (string): Start date in ISO 8601 format
// - endDate (string): End date in ISO 8601 format
// - tags (array of strings): Categories or tags for the activity
// - imageURL (string): URL of the primary image for this activity

// Return an array of activity objects. If no activities are found, return an empty array.`;

export interface RawActivity {
  name: string;
  description?: string;
  location?: {
    name?: string;
    formattedAddress?: string;
    street_address?: string;
    city?: string;
    state_province?: string;
    postal_code?: string;
    country_code?: string;
  };
  startDate?: string;
  endDate?: string;
  tags?: string[];
  imageURL?: string;
}

// const MOCK_ACTIVITIES: RawActivity[] = [
//   {
//     name: "Anthony Beale Reserve, St Helena",
//     description:
//       "Tucked away among the homes in St Helena is a bright, colourful playground with lots of equipment: a large human-sized revolving wheel, a stand-on carousel, small slides, rope-net climbing frame, two stand-on spinners, wooden stump balance trail, bird's nest swing, hammock and a double flying fox (disk seat and harness). There is a wheelchair-accessible sandpit with a creek water feature, hand pump and sluice gates. The reserve also includes a half basketball court and a small junior skate area with ramp. Facilities noted: park benches, picnic tables, pram access, walking/bike tracks, Wi-Fi, BBQ, water tap, wheelchair access and toilets. Suitable for a range of ages and abilities. Tip: bring scooters. Nearby recommendation: Watermarc Greensborough for indoor water play and lessons.",
//     location: {
//       name: "Anthony Beale Reserve",
//       formattedAddress: "277 St Helena Rd, St Helena, Australia",
//       street_address: "277 St Helena Rd",
//       city: "St Helena",
//       state_province: undefined,
//       postal_code: undefined,
//       country_code: "AU",
//     },
//     startDate: "2017-08-22T19:04:36+10:00",
//     endDate: undefined,
//     tags: ["park", "playground", "family", "accessible", "outdoor"],
//     imageURL:
//       "http://static1.squarespace.com/static/58813c79f7e0ab55271bb525/58ecb61820099e78e671de65/599bf2d22994caf792a50a95/1602462506330/anthony+front.jpg?format=1500w",
//   },
//   {
//     name: "ANZAC Memorial Park, Hurstbridge",
//     description:
//       "Nestled amongst greenery and surrounded by cafes, Anzac Memorial Park is a smaller but engaging playground. Features include a medical tent role-play, army tank play, ropes course, word-search/maze activities, picnic tables and nearby cafes. Fenced from the road (no gate). Mamma's tip: grab a coffee from Black Vice Cafe and Roastery.",
//     location: {
//       name: "Anzac Memorial Park, Hurstbridge",
//       formattedAddress:
//         "910 Heidelberg - Kinglake Rd, Hurstbridge VIC 3099, Australia",
//       street_address: "910 Heidelberg - Kinglake Rd",
//       city: "Hurstbridge",
//       state_province: "VIC",
//       postal_code: "3099",
//       country_code: "AU",
//     },
//     startDate: "2024-08-27T20:01:35+10:00",
//     endDate: undefined,
//     tags: ["park", "playground", "family", "outdoors", "picnic"],
//     imageURL:
//       "https://images.squarespace-cdn.com/content/v1/58813c79f7e0ab55271bb525/3c62c1e8-c10c-41b2-8fd1-925aa6bbf489/Copyright+Mamma+Knows+Melbourne+-+ANZAC+Park%2C+Hurstbridge-3754.jpg",
//   },
//   {
//     name: "Aspect's Destination Drive Park, Greenvale",
//     description:
//       "This community playground on Destination Drive in Greenvale features slides, rope climbing frames, swings, see-saw, a rodeo platform and a flying fox. Built for all ages with great views over Greenvale Reservoir and surrounding parklands. Suitable for family picnics and birthday visits; facilities mention pram access, parking, BBQs, shelters, seating, toilets, basketball court and a soccer field. Note: bring snacks. Mamma's special mention lists other nearby Peet parks.",
//     location: {
//       name: "Aspect Park (Destination Drive Park)",
//       formattedAddress: "Destination Dr, Greenvale VIC 3059, AU",
//       street_address: "Destination Dr",
//       city: "Greenvale",
//       state_province: "VIC",
//       postal_code: "3059",
//       country_code: "AU",
//     },
//     startDate: "2017-05-11T20:55:28+1000",
//     endDate: undefined,
//     tags: ["park", "playground", "family", "picnic", "outdoor", "play-equipment"],
//     imageURL:
//       "http://static1.squarespace.com/static/58813c79f7e0ab55271bb525/58ecb61820099e78e671de65/591442f0cd0f68c944f8a32c/1602462643902/Destination+Drive+-+Mamma+Knows+North+%2814+of+14%29.jpg?format=1500w",
//   },
//   {
//     name: "Alistair Knox Park, Eltham",
//     description:
//       "The Alistair Knox Reserve in Eltham is a community hub with a large play area among gum trees. Features include large wooden carvings (platypus, owl, tree-stump seat), metal figures, and a main play structure with a curved slide, walkways, hanging disks, rising step bridge, steering wheel, tunnel, scrambling wall, shop front and monkey bars. Additional equipment: spinning donut, music-making equipment, bird's-nest swing and a family-sized see-saw. Grounds include rocks to jump across and paths along the Diamond Creek. Facilities mentioned: toilets, car park, BBQ, BMX track, walking/bike track, picnic tables and shaded areas. Suitable for families with toddlers and older children. Tip: Grab a bite at Shillinglaw Cafe or visit Eltham Library storytime. More info available on the Nillumbik council page.",
//     location: {
//       name: "Alistair Knox Reserve",
//       formattedAddress: "829 Main Rd, Eltham, Australia",
//       street_address: "829 Main Rd",
//       city: "Eltham",
//       state_province: undefined,
//       postal_code: undefined,
//       country_code: "AU",
//     },
//     startDate: "2017-07-05T10:34:30+1000",
//     endDate: undefined,
//     tags: ["park", "playground", "family", "outdoors", "picnic", "play-equipment"],
//     imageURL:
//       "http://static1.squarespace.com/static/58813c79f7e0ab55271bb525/58ecb61820099e78e671de65/595c338be4fcb506751e8c75/1602462574078/alisterfront.jpg?format=1500w",
//   },
//   {
//     name: "AJ Davis Reserve Playground, Airport West",
//     description:
//       "New playground at AJ Davis Reserve in Airport West. Unique multi-level natural play on a hillside with climbing features, boulders, logs, yellow soft fall, steep fast tube slides, swings, roundabout, dry river bed (BYO diggers) and many paths. Facilities noted: bench seats, undercover picnic tables and carpark; no toilets. Suitable for adventurous children; parental supervision recommended. Nearby food option: Slices (Keilor) a short drive away.",
//     location: {
//       name: "AJ Davis Reserve Playground",
//       formattedAddress: "298 Fullarton Rd, Airport West",
//       street_address: "298 Fullarton Rd",
//       city: "Airport West",
//       state_province: undefined,
//       postal_code: undefined,
//       country_code: "AU",
//     },
//     startDate: "2023-07-26T16:45:27+1000",
//     endDate: undefined,
//     tags: ["park", "playground", "natural play", "family", "outdoor", "slides"],
//     imageURL:
//       "https://static1.squarespace.com/static/58813c79f7e0ab55271bb525/58ecb61820099e78e671de65/64c0a9292ee2932e8d44d3e1/1690353927253/aj+davis+reserve+playground%2C+airport+west+-+copyright+2023+mamma+knows+melbourne.jpg?format=1500w",
//   },
//   {
//     name: "A.H. Capp Reserve, Preston",
//     description:
//       "Mamma thinks you'd be hard-pressed finding a more tranquil, fun and spacious spot for a play with the kids and dog. A.H. Capp Reserve has picnic tables, shade and a playground with elements suited to both younger and older kids (rock-climbing wall, large slide, chain bridge, smaller slide, noughts and crosses), a merri-go-round, swings (including a basket swing), a basketball court, leash-free dog oval and exercise equipment. The reserve is set along the Merri Creek Trail, offering a pretty and peaceful setting. There are undercover picnic tables and toilets at the sports pavilion. Mamma's tip: grab a coffee & pastry from Joe's Market Garden on your way (open Saturdays).",
//     location: {
//       name: "A.H. Capp Reserve",
//       formattedAddress: "13 Halwyn Cres, Preston VIC 3072, AU",
//       street_address: "13 Halwyn Cres",
//       city: "Preston",
//       state_province: "VIC",
//       postal_code: "3072",
//       country_code: "AU",
//     },
//     startDate: "2020-03-01T19:23:03+1100",
//     endDate: undefined,
//     tags: [
//       "park",
//       "playground",
//       "dog-friendly",
//       "picnic",
//       "walking-trail",
//       "playground-equipment",
//       "basketball",
//       "exercise-equipment",
//       "family-friendly",
//     ],
//     imageURL:
//       "https://static1.squarespace.com/static/58813c79f7e0ab55271bb525/58ecb61820099e78e671de65/5e5b70e67a7f3216d6cb4ef3/1631679599393/A.H+Capp+Reserve+excerpt+.jpg?format=1500w",
//   },
//   {
//     name: "All Nations Park, Northcote",
//     description:
//       "All Nations Park in Northcote is a large regional reserve with two playgrounds, a dog park, lake, skate park, rocks and trees to climb, basketball half court, chess boards and a tennis/down ball wall. The 13-hectare park was created on the former Northcote landfill in 2002. The first playground suits little ones (slides, swings, climbing ladders, sandpit). The second playspace is more natural and for bigger kids (long wave slide, long curved tunnel slide, wooden and chain climbing wall, varied obstacles). Facilities noted: park benches, picnic tables, pram access, dogs off-leash, play spaces, public toilets, lots of shade, BBQs and parking. Mamma's special mention: Tinker cafe in Northcote for food.",
//     location: {
//       name: "All Nations Park",
//       formattedAddress: "Separation St, Northcote, Melbourne, Australia",
//       street_address: "Separation St",
//       city: "Northcote",
//       state_province: undefined,
//       postal_code: undefined,
//       country_code: "AU",
//     },
//     startDate: "2023-07-17T14:20:00+10:00",
//     endDate: undefined,
//     tags: ["park", "playground", "family", "dog-friendly", "skate park", "picnic"],
//     imageURL:
//       "https://static1.squarespace.com/static/58813c79f7e0ab55271bb525/58ecb61820099e78e671de65/5ad5d9960e2e72ed9a171b31/1689545184225/all+nations.jpg?format=1500w",
//   },
//   {
//     name: "All Abilities Play Space and Splash Park, Mill Park",
//     description:
//       "Spacious, multi-zone all-abilities playspace with extensive water play (splash pads, mist ring tunnel, basins and troughs, shallow stream), wheelchair-accessible playground towers, sound installations, spiral tunnel slide, wide side-by-side slide, rock climbing wall, large double flying fox with accessible/adult chair, in-ground trampolines (including wheelchair-accessible trampoline), varied swing options, insect sculptures, toddlers' shaded structures, cubby house, chill-out area, dry creek bed, tree stumps and balance logs, native plant landscaping and a labyrinth. Facilities include toilets, picnic tables with cover, water refill station, BBQs, fully fenced areas, carpark and a basketball court. Suitable for all ages and abilities; bring swimmers, towels and snacks for summer water play.",
//     location: {
//       name: "Mill Park Recreation Reserve",
//       formattedAddress:
//         "Mill Park Recreation Reserve, 33 Morang Dr, Mill Park VIC 3082, AU",
//       street_address: "33 Morang Dr",
//       city: "Mill Park",
//       state_province: "VIC",
//       postal_code: "3082",
//       country_code: "AU",
//     },
//     startDate: "2021-02-19T16:42:41+11:00",
//     endDate: undefined,
//     tags: ["park", "playground", "water play", "accessible", "family"],
//     imageURL:
//       "https://images.squarespace-cdn.com/content/v1/58813c79f7e0ab55271bb525/1732151994296-AJ9CBKCSTKY962I2MN70/mill+park+all+abilities+play+space-05.jpg?format=500w",
//   },
//   {
//     name: "Allard Park playground and pump track, Brunswick East",
//     description:
//       "Allard Park in Brunswick East features a playground and a mini gravel pump track suitable for small or new riders. The pump track is a short loop with little hills and rubber tyres; it sits adjacent to the playground so kids can switch between riding and play. The playground includes 2 bike rockers, swings (including a nest swing), rainbow balancing logs, a merry-go-round, and a main play structure with monkey bars, a vertical rope climbing frame, rope tunnel, fireman's pole, shop front and two slides. Suitable for preschool and young primary children; older kids can use the nearby oval. Facilities: benches, picnic tables, drinking tap, toilets (behind the pavilion), and plenty of trees for shade.",
//     location: {
//       name: "Allard Park Pump Track",
//       formattedAddress: "150 Mitchell St, Brunswick East, Melbourne, Australia",
//       street_address: "150 Mitchell St",
//       city: "Brunswick East",
//       state_province: undefined,
//       postal_code: undefined,
//       country_code: "AU",
//     },
//     startDate: "2025-01-20",
//     endDate: undefined,
//     tags: ["park", "playground", "pump track", "bike track", "family", "picnic"],
//     imageURL:
//       "https://static1.squarespace.com/static/58813c79f7e0ab55271bb525/58ecb61820099e78e671de65/678da19d6ff41e1111a3880c/1745374381580/20250120_131813.jpg?format=1500w",
//   },
//   {
//     name: "anderson reserve, coburg",
//     description:
//       "Anderson Reserve is a bright, recently upgraded, fully fenced toddler-friendly playground with a transport theme: simulated train tracks, trucks built from tyres and logs, bike and car rockers, tunnels, a bumpy grass 'road', toddler tower and slide, swings and an upright rainbow wind pipe for making music. There are also monkey bars, a mini rock climbing wall, a larger tower with slide and a balancing spring seesaw for older kids. Set in leafy surrounds with shady picnic spots, a basketball half court and off‑leash dog areas (away from the playground). Mamma's tip: the Post Office Hotel is just down the road for a family-friendly meal. The nitty gritty: fully fenced playground - basketball half court - drinking tap - park benches - grassy areas for picnics - dogs allowed off leash (away from playground) - easy surrounding street parking.",
//     location: {
//       name: "Anderson Reserve",
//       formattedAddress: "44-46 Linda St, Coburg VIC 3058, AU",
//       street_address: "44-46 Linda St",
//       city: "Coburg",
//       state_province: "VIC",
//       postal_code: "3058",
//       country_code: "AU",
//     },
//     startDate: "2020-06-07T13:51:46+1000",
//     endDate: undefined,
//     tags: [
//       "park",
//       "playground",
//       "toddler-playground",
//       "family-friendly",
//       "fully-fenced",
//       "nature-play",
//     ],
//     imageURL:
//       "http://static1.squarespace.com/static/58813c79f7e0ab55271bb525/58ecb61820099e78e671de65/5edc6452c796372e5341478e/1730710090362/excerpt+anderson+reserve.jpg?format=1500w",
//   },
// ];

export const MOCK_ACTIVITIES_2: RawActivity[] = [
  {
    name: "alistair knox park, eltham",
    description:
      "The Alistair Knox Reserve in Eltham is a community hub with varied play spaces among gum trees. Features large wooden carvings (platypus, owl, tree stump seat), metal figures, a main play structure with curved slide, walkways, hanging disks, rising step bridge, steering wheel, tunnel, scrambling wall, shop front and monkey bars. Also a spinning donut, music equipment, birds nest swing, large family see-saw, rocks to jump across and bike/walking edges along the Diamond Creek. Facilities: accessible, toilets, car park, BBQ, BMX track, walking/bike track, picnic tables and shaded areas. Nearby: Shillinglaw Cafe and Eltham Library storytime.",
    location: {
      name: "Alistair Knox Park",
      formattedAddress: "829 Main Rd, Eltham, Australia",
      street_address: "829 Main Rd",
      city: "Eltham",
      country_code: "AU",
    },
    startDate: "2017-07-05T10:34:30+10:00",
    tags: [
      "park",
      "playground",
      "family-friendly",
      "outdoors",
      "picnic",
      "nature",
    ],
    imageURL:
      "https://static1.squarespace.com/static/58813c79f7e0ab55271bb525/58ecb61820099e78e671de65/595c338be4fcb506751e8c75/1602462574078/alisterfront.jpg?format=1500w",
  },
  {
    name: "AJ Davis Reserve Playground, Airport West",
    description:
      "New playground at AJ Davis Reserve in Airport West. A unique multi-level hillside playground with lots of natural play elements. Features steep, fast tube slides, climbing boulders and logs, yellow soft fall, swings, a roundabout, a dry river bed (BYO diggers) and many paths for riding and running. Facilities noted: bench seats, undercover picnic tables and a carpark; no toilets. Suited to adventurous children and families.",
    location: {
      name: "AJ Davis Reserve",
      formattedAddress: "298 Fullarton Rd, Airport West, Melbourne, Australia",
      street_address: "298 Fullarton Rd",
      city: "Airport West",
      country_code: "AU",
    },
    startDate: "2023-07-26T16:45:27+10:00",
    tags: ["park", "playground", "family", "north", "nature-play"],
    imageURL:
      "http://static1.squarespace.com/static/58813c79f7e0ab55271bb525/58ecb61820099e78e671de65/64c0a9292ee2932e8d44d3e1/1690353927253/aj+davis+reserve+playground%2C+airport+west+-+copyright+2023+mamma+knows+melbourne.jpg?format=1500w",
  },
  {
    name: "Anderson Reserve, Coburg",
    description:
      "Anderson Reserve is a bright, recently upgraded, fully fenced toddler-friendly playground with transport-themed play: simulated train tracks, tyre and log trucks, bike and car rockers, tunnels and a bumpy grass 'road'. Features include a toddler tower and slide, swings, an upright rainbow wind pipe, low equipment for little ones plus monkey bars, a mini rock-climbing wall, a taller tower with larger slide and a balancing spring seesaw for older kids. Set in leafy surrounds with shady picnic spots, a basketball half court and dogs allowed off leash away from the playground. Easy on-street parking. Nearby family-friendly meal option: Post Office Hotel.",
    location: {
      name: "Anderson Reserve",
      formattedAddress: "44-46 Linda St, Coburg VIC 3058, Australia",
      street_address: "44-46 Linda St",
      city: "Coburg",
      state_province: "VIC",
      postal_code: "3058",
      country_code: "AU",
    },
    startDate: "2020-06-07T13:51:46+1000",
    tags: ["park", "playground", "toddler", "family", "fully fenced"],
    imageURL:
      "http://static1.squarespace.com/static/58813c79f7e0ab55271bb525/58ecb61820099e78e671de65/5edc6452c796372e5341478e/1730710090362/excerpt+anderson+reserve.jpg?format=1500w",
  },
  {
    name: "All Nations Park, Northcote",
    description:
      "All Nations Park in Northcote is a large 13-hectare regional park with two playgrounds, a dog park, lake, skate park, basketball half court, chess boards, and a tennis/down ball wall. Play spaces include a recently upgraded toddler playground (slides, swings, climbing ladders, sandpit) and a larger natural-structure playground with long wave and tunnel slides, climbing walls and obstacles for older kids. Facilities and accessibility: park benches, picnic tables, pram access, public toilets, lots of shade, BBQs and parking. Suitable for families with toddlers through older children and dog owners. Tip: nearby Tinker in Northcote is recommended for food.",
    location: {
      name: "All Nations Park",
      formattedAddress: "Separation St, Northcote, Melbourne, Australia",
      street_address: "Separation St",
      city: "Northcote",
      country_code: "AU",
    },
    startDate: "2023-07-17T14:20:00+1000",
    tags: ["park", "playground", "dog-friendly", "skatepark", "family"],
    imageURL:
      "http://static1.squarespace.com/static/58813c79f7e0ab55271bb525/58ecb61820099e78e671de65/5ad5d9960e2e72ed9a171b31/1689545184225/all+nations.jpg?format=1500w",
  },
  {
    name: "all abilities play space and splash park, mill park",
    description:
      "Spacious, multi-zone all-abilities playspace with extensive water play (splash pads, mist ring tunnel, basins, pumps and a shallow stream). Wheelchair-accessible playground towers, ramps, accessible trampoline and swing options, sound installations, wide slides, a spiral tunnel slide, rock-climbing wall, large double flying-fox with accessible/adult chair, in-ground trampolines, inclusive equipment and insect sculptures. Toddlers have shaded small structures, slides, a cubby house and a chill-out nature play area with dry creek bed, tree-stump balance logs, native planting and a labyrinth. There is a large shaded sandpit with diggers and a play bench. Facilities noted: toilets, covered picnic tables, water refill station, wheelchair access, BBQs, full fencing, carpark and a basketball court. Tip: pack snacks, swimmers and a towel. Mamma’s special mention: Eden Play (indoor option in Mill Park).",
    location: {
      name: "Mill Park Recreation Reserve",
      formattedAddress: "33 Morang Dr, Mill Park VIC 3082, AU",
      street_address: "33 Morang Dr",
      city: "Mill Park",
      state_province: "VIC",
      postal_code: "3082",
      country_code: "AU",
    },
    startDate: "2021-02-19T16:42:41+11:00",
    tags: [
      "park",
      "playground",
      "water play",
      "splash park",
      "accessible",
      "family",
    ],
    imageURL:
      "http://static1.squarespace.com/static/58813c79f7e0ab55271bb525/58ecb61820099e78e671de65/602f4fd18ead7215feb6474e/1733195180025/20241121_130550.jpg?format=1500w",
  },
  {
    name: "allard park playground and pump track, brunswick east",
    description:
      "Allard Park in Brunswick East has a playground and a mini gravel pump track suitable for small or new riders. The pump track loop is wide with small hills and rubber tyres; it sits next to the playground so kids can move between playing and riding. Playground features include 2 bike rockers, a main play structure with monkey bars, vertical rope climbing frame, rope tunnel, fireman’s pole, shop front and two slides, a swing set, nest swing, rainbow balancing logs and a merry-go-round. Facilities include benches, picnic tables, a drink tap, toilets (behind the pavilion) and a local sports oval. Good for preschool and young primary ages; shade from trees is available.",
    location: {
      name: "Allard Park Pump Track",
      formattedAddress: "150 Mitchell St, Brunswick East, Australia",
      street_address: "150 Mitchell St",
      city: "Brunswick East",
      country_code: "AU",
    },
    startDate: "2025-01-20T13:53:59+11:00",
    tags: ["park", "playground", "pump track", "bike track", "family"],
    imageURL:
      "http://static1.squarespace.com/static/58813c79f7e0ab55271bb525/58ecb61820099e78e671de65/678da19d6ff41e1111a3880c/1745374381580/20250120_131813.jpg?format=1500w",
  },
  {
    name: "Austin Crescent Reserve Playground, Pascoe Vale",
    description:
      "Austin Crescent Reserve Playground in Pascoe Vale is an accessible family-friendly park with a large climbing area (ropes course, rock-climbing wedge, climbing poles, monkey bars and a geometric climbing frame), swings (including two belt swings attached to a clown), a merry-go-round, slide, rope tunnel and a flying fox. There are seesaws, bike paths and walking trails from the train station, plus a car park. Facilities include BBQs, undercover tables and seating, and public toilets (across the road). The playground is mostly fenced with gated access to the car park. Nearby cafe: Jack and Daisy’s for coffee or a feed.",
    location: {
      name: "Austin Crescent Reserve",
      formattedAddress: "22 Austin Crescent, Pascoe Vale, Melbourne, Australia",
      street_address: "22 Austin Crescent",
      city: "Pascoe Vale",
      state_province: "VIC",
      country_code: "AU",
    },
    startDate: "2024-10-29T12:54:04+1100",
    tags: ["park", "playground", "family", "outdoors"],
    imageURL:
      "http://static1.squarespace.com/static/58813c79f7e0ab55271bb525/58ecb61820099e78e671de65/67203b0cc508865daba622d6/1732614394836/austin+crescent+playground+grid.jpg?format=1500w",
  },
  {
    name: "Bain Reserve, Coburg North — mamma knows north",
    description:
      "Bain Reserve in Coburg North is a well-equipped local meeting place with picnic tables, toilets and good seating. The playground suits preschool children and includes a bucket swing, trampoline, merry-go-round, tunnel, cubby house, slides and climbing frames, plus additions such as a height chart, step-on musical bells and a 4-person seesaw. Older children can use a more advanced climbing frame and a large decking area with a table tennis table. The site is easily accessible by train, bus or car (Merlynston Station and a nearby bus stop). The playground is semi-fenced along one side. Facilities noted: picnic table, BBQs, toddler friendly, toilets and a water fountain.",
    location: {
      name: "Bain Reserve",
      formattedAddress: "2 Merlyn St, Coburg North, Melbourne, Australia",
      street_address: "2 Merlyn St",
      city: "Coburg North",
      country_code: "AU",
    },
    startDate: "2023-07-11T10:38:07+1000",
    tags: ["park", "playground", "family", "outdoors", "picnic"],
    imageURL:
      "http://static1.squarespace.com/static/58813c79f7e0ab55271bb525/58ecb61820099e78e671de65/64ac9edd49b6652f49a74533/1730710108010/bain+reserve.jpg?format=1500w",
  },
  {
    name: "anthony beale reserve, st helena",
    description:
      "Tucked away among the homes in St Helena, this bright, colourful playground has fun for all ages. Highlights include a large revolving human ‘hamster wheel’, a big stand-on carousel, small slides, rope net climbing frame, two stand-on spinners, a little wooden stump balance trail, birds nest swing, hammock and a double flying fox (disk seat and harnessed seat). There is a wheelchair-accessible sandpit with a creek water feature, hand pump and sluice gates. The reserve also includes a half basketball court, a small junior skate area with ramp, park benches, picnic tables, pram access, walking/bike tracks, BBQ, water tap and toilets. Mamma notes the site has Wi‑Fi.",
    location: {
      name: "Anthony Beale Reserve",
      formattedAddress: "277 St Helena Rd, St Helena, Melbourne, Australia",
      street_address: "277 St Helena Rd",
      city: "St Helena",
      country_code: "AU",
    },
    startDate: "2017-08-22T09:04:36Z",
    tags: ["park", "playground", "family", "accessible", "outdoors"],
    imageURL:
      "http://static1.squarespace.com/static/58813c79f7e0ab55271bb525/58ecb61820099e78e671de65/599bf2d22994caf792a50a95/1602462506330/anthony+front.jpg?format=1500w",
  },
  {
    name: "Aston's Champion Parade playground (Burt Kur Min Reserve), Craigieburn",
    description:
      "This large treetop-style playground resembles a tree house and is a climber's heaven with rope ladders, walking tunnels, nest-like huts and a little toddler hub with soft landings. The park also includes swings, a slide, a see-saw and a flying fox. Suitable for a range of ages; pram accessible with drinking fountains, shelter, and nearby bike and walking trails.",
    location: {
      name: "Aston's Champion Parade (Burt Kur Min Reserve)",
      formattedAddress: "Champion Parade, Craigieburn VIC 3064, AU",
      street_address: "Champion Parade",
      city: "Craigieburn",
      state_province: "VIC",
      postal_code: "3064",
      country_code: "AU",
    },
    startDate: "2023-08-10T20:46:00+10:00",
    tags: [
      "park",
      "playground",
      "climbing",
      "toddler-friendly",
      "family",
      "accessible",
    ],
    imageURL:
      "http://static1.squarespace.com/static/58813c79f7e0ab55271bb525/58ecb61820099e78e671de65/591440c69f7456878ba910ff/1692595505369/03+Champion+Pde+-+Mamma+Knows+North+%281+of+22%29.jpg?format=1500w",
  },
  {
    name: "Aurora Treetops Park, Wollert",
    description:
      "Ever heard of a park that has 3 in-ground mini trampolines, solar panel ‘trees’ that power an undercover communal barbeque and allow you to plug in to charge your phone or laptop, 2 different sized slides, a spider web rope climbing frame, 3 towers, a suspension bridge and tunnel, swings and lots of smaller spring-based equipment for the little ones? This park is nearly unbelievable! It’s fresh and super modern and has something to suit little and big kids. Mamma intended just a quick stop off but ended up staying an hour with a 1 year old and 11 year old both happy and occupied. Mamma special mention: While you’re in the area, be SURE to check out some of the other incredible parks that Aurora has to offer. Mamma particularly loves Aurora Adventure Playground! Nitty gritty: Undercover picnic tables and barbeque; USB charging stations; Parking is plentiful albeit a little tricky as it’s in a residential area with quite narrow streets; No toilets unfortunately.",
    location: {
      name: "Treetops Park",
      formattedAddress:
        "Cnr Agnes Lane and Werribee Cres, Wollert, VIC, Australia",
      street_address: "Cnr Agnes Lane and Werribee Cres",
      city: "Wollert",
      state_province: "VIC",
      country_code: "AU",
    },
    startDate: "2019-07-07T10:23:37+10:00",
    tags: ["park", "playground", "family", "outdoors"],
    imageURL:
      "https://static1.squarespace.com/static/58813c79f7e0ab55271bb525/58ecb61820099e78e671de65/5d213b90a6c12f00019a9e6c/1602461287360/01+Treetops+-+Mamma+Knows+North+%282+of+7%29.jpg?format=1500w",
  },
  {
    name: "ANZAC Memorial Park, Hurstbridge",
    description:
      "Nestled among greenery and cafes, Anzac Memorial Park is a smaller but feature-packed playground with role-play elements (medical tent), an army tank, a ropes course and word‑search/maze activities. Facilities include a picnic table; the park is fenced from the road but has no gate. Suitable for families and children; nearby cafés (Mamma’s special mention: Black Vice Cafe and Roastery).",
    location: {
      name: "Anzac Memorial Park, Hurstbridge",
      formattedAddress:
        "910 Heidelberg - Kinglake Rd, Hurstbridge VIC 3099, Australia",
      street_address: "910 Heidelberg - Kinglake Rd",
      city: "Hurstbridge",
      state_province: "VIC",
      postal_code: "3099",
      country_code: "AU",
    },
    startDate: "2024-08-27T20:01:35+1000",
    tags: ["park", "playground", "family", "outdoors", "picnic", "cafe-nearby"],
    imageURL:
      "https://images.squarespace-cdn.com/content/v1/58813c79f7e0ab55271bb525/3c62c1e8-c10c-41b2-8fd1-925aa6bbf489/Copyright+Mamma+Knows+Melbourne+-+ANZAC+Park%2C+Hurstbridge-3754.jpg",
  },
  {
    name: "aston fields playground, craigieburn",
    description:
      "Peet has done it again with this awesome park in Craigieburn. The playspace includes a spider-constructed playground with climbing pyramid, bridge and nests. There are slides, swings, tunnels, a rock-climbing wall and a basketball court. The site also features pump water play, three soccer pitches and a cricket field. Aston Fields Reserve is described as ideal for family Sundays with BBQs and large tables. Nitty gritty: Vantage Blvd, Craigieburn — parking, shade, BBQs, waterplay; no toilets. Mamma also highlights nearby Peet playspaces.",
    location: {
      name: "Aston Fields Reserve",
      formattedAddress: "Vantage Blvd, Craigieburn, Melbourne, Australia",
      street_address: "Vantage Blvd",
      city: "Craigieburn",
      country_code: "AU",
    },
    startDate: "2024-01-12T19:31:00+11:00",
    tags: [
      "park",
      "playground",
      "waterplay",
      "sports",
      "family-friendly",
      "bbq",
    ],
    imageURL:
      "https://static1.squarespace.com/static/58813c79f7e0ab55271bb525/58ecb61820099e78e671de65/5bd6c5618165f5a5e92160a6/1706753894926/aston+fields.jpg?format=1500w",
  },
  {
    name: "Aspect's Destination Drive Park, Greenvale",
    description:
      "This community playground features slides, rope climbing frames, swings, a see-saw, a rodeo platform and a flying fox, designed for a range of ages. The playspace offers views over Greenvale Reservoir and surrounding parklands. Facilities include parking, pram access, BBQs, shelters, seating, toilets, a basketball court and a soccer field with goal. Suitable for family visits, birthday picnics and toddlers through older children. Mamma's note: nearby Peet parks are also recommended.",
    location: {
      name: "Aspect Park",
      formattedAddress: "Destination Dr, Greenvale VIC 3059, Australia",
      street_address: "Destination Dr",
      city: "Greenvale",
      state_province: "VIC",
      postal_code: "3059",
      country_code: "AU",
    },
    startDate: "2017-05-11T20:55:28+10:00",
    tags: ["park", "playground", "family", "outdoor", "picnic"],
    imageURL:
      "http://static1.squarespace.com/static/58813c79f7e0ab55271bb525/58ecb61820099e78e671de65/591442f0cd0f68c944f8a32c/1602462643902/Destination+Drive+-+Mamma+Knows+North+%2814+of+14%29.jpg?format=1500w",
  },
  {
    name: "A.H. Capp Reserve, Preston",
    description:
      "Mamma thinks you’d be hard-pressed to find a more tranquil, fun and spacious spot for a play with the kids and dog. A.H. Capp Reserve has picnic tables, shade and a playground with elements suited to both younger and older kids (rock climbing wall, large slide, chain bridge, smaller slide, noughts and crosses). There’s a little merry-go-round and swings (including a basket swing), plus a basketball court, off-leash dog oval and exercise equipment. The reserve sits along the Merri Creek Trail, making it pretty and peaceful. Relaxed dog scene after 5pm on the oval. Mamma's tip: grab a coffee & pastry from Joe’s Market Garden on your way. Facilities: undercover picnic tables, playground, basketball court, exercise equipment, street parking, dogs off leash on oval, toilets at the sports pavilion.",
    location: {
      name: "A.H. Capp Reserve",
      formattedAddress: "13 Halwyn Cres, Preston, 3072, Australia",
      street_address: "13 Halwyn Cres",
      city: "Preston",
      postal_code: "3072",
      country_code: "AU",
    },
    startDate: "2020-03-01T19:23:03+11:00",
    tags: [
      "park",
      "playground",
      "dog-friendly",
      "picnic",
      "walking",
      "family",
      "basketball",
      "exercise-equipment",
    ],
    imageURL:
      "https://images.squarespace-cdn.com/content/v1/58813c79f7e0ab55271bb525/1583051375088-A4P0D27CBRE3ERRM4HS2/AH+Capp+Reserve%2C+Preston-3.jpg",
  },
  {
    name: "Birrarung Marr Playground, Melbourne",
    description:
      "Birrarung Marr Playground is a central city playspace with swings, tunnels, a spider-climb frame, extensive slides and a sandpit. It's a popular festival/event hotspot with park benches and seating, pram access, public toilets and shady areas. Located next to Melbourne's creative space Artplay; suitable for family city outings and young children.",
    location: {
      name: "Birrarung Marr Playground",
      city: "Melbourne",
      country_code: "AU",
    },
    startDate: "2019-02-25",
    tags: ["park", "playground", "family", "outdoor", "adventure"],
    imageURL:
      "https://images.squarespace-cdn.com/content/v1/58813c79f7e0ab55271bb525/1549961291898-P35NDPCO2WL2RY08TUBG/birrarung+marr+playground%2C+melbourne+-+mamma+knows+north-1.jpg",
  },
  {
    name: "bush reserve, coburg",
    description:
      "Using recycled materials from the old depot site, Merri Bek City Council created a sustainable community playground. Features include a tree house with two slides and a rock-climbing wall, musical sculptures, flying fox, swing set, wheelchair-accessible liberty swing, banana lounges, grassed areas, basketball court and ping-pong table. Facilities: BBQ, toilets, undercover tables and parking. Tip: short drive to Blu for fish and chips.",
    location: {
      name: "Coburg Bush Reserve",
      formattedAddress: "227 Bell St, Coburg, Australia",
      street_address: "227 Bell St",
      city: "Coburg",
      country_code: "AU",
    },
    startDate: "2017-05-18T22:03:48+1000",
    tags: ["park", "playground", "family", "accessible", "outdoors"],
    imageURL:
      "http://static1.squarespace.com/static/58813c79f7e0ab55271bb525/58ecb61820099e78e671de65/591d8d645016e1c2af452f43/1737076329880/bush+reserve+front.jpg?format=1500w",
  },
  {
    name: "Cardinal Road Playground, Glenroy",
    description:
      "New playground in Glenroy installed under Moreland Council's 'A Park Close to Home' initiative. Features include fencing, water play, shaded picnic tables, fitness equipment, an in-ground trampoline, a triple swing set and a climbing frame. Suitable for families and young children; popular in summer with nearby gelato options (Siconi, Augustus Pascoe Vale). Mamma’s special mention and photos accompany the review.",
    location: {
      name: "Cardinal Road Playground",
      formattedAddress: "132-134 Cardinal Road, Glenroy, Australia",
      street_address: "132-134 Cardinal Road",
      city: "Glenroy",
      country_code: "AU",
    },
    startDate: "2022-07-25T14:05:16+10:00",
    tags: ["park", "playground", "family", "water play", "picnic", "outdoors"],
    imageURL:
      "https://static1.squarespace.com/static/58813c79f7e0ab55271bb525/58ecb61820099e78e671de65/62de167cd29a5377dcf07ddb/1730710218653/cardinal+road+playground+.jpg?format=1500w",
  },
  {
    name: "Bollygum Park Playground, Kinglake",
    description:
      "A large wooden playspace themed on Garry Fleming's Bollygum story, with character-named sections, a dry river bed, Platypus house, climbing, a roped bird's nest swing and many musical structures. Great for imaginative play and toddlers through older kids. Facilities include BBQs, shaded areas, skate park, public toilets, amphitheatre seating, sandpit, pram access and nearby nature trails. Mamma’s special mention: the Bollygum Community Market is held here on the second Sunday of the month (seasonal), with a popular Christmas market and community carols.",
    location: {
      name: "Bollygum Park Playground",
      formattedAddress: "40 Whittlesea-Kinglake Rd, Kinglake",
      street_address: "40 Whittlesea-Kinglake Rd",
      city: "Kinglake",
      country_code: "AU",
    },
    startDate: "2022-01-28T14:06:00+1100",
    tags: [
      "park",
      "playground",
      "family",
      "outdoors",
      "nature",
      "music",
      "market",
    ],
    imageURL:
      "http://static1.squarespace.com/static/58813c79f7e0ab55271bb525/58ecb61820099e78e671de65/58f710ecf5e2314662f5b6ba/1644377734429/01+Copyright+Mamma+Knows+East+-+Bollygum+Park%2C+Kinglake+%281+of+18%29.jpg?format=1500w",
  },
  {
    name: "binnak park, watsonia north",
    description:
      "What a picturesque spot! Binnak Park playground has a beautiful, lush green backdrop and is popular for barbecues and gatherings. Features areas suitable for all abilities, toddler-friendly swings, ride-on kangaroo structures, a family-sized see-saw, two low slippery slides toddlers can use independently, larger climbing frames, a fort with rope ladder, monkey bars, rock-climbing wall, fire pole and a very tall hammock swing. Facilities include undercover BBQ and picnic tables, toilets, park benches, car park, drinking fountain, pram-friendly paths, nearby walking tracks and dog-friendly areas. Mamma's special mention: Bundoora Park Farm playspace is nearby.",
    location: {
      name: "Binnak Park",
      formattedAddress: "Anderson Parade, Watsonia North, Melbourne, Australia",
      street_address: "Anderson Parade",
      city: "Watsonia North",
      country_code: "AU",
    },
    startDate: "2019-08-25T22:11:41+10:00",
    tags: ["park", "playground", "picnic", "family", "all-abilities"],
    imageURL:
      "https://static1.squarespace.com/static/58813c79f7e0ab55271bb525/58ecb61820099e78e671de65/5d627afd31910c000175a6e1/1602461202874/Untitled.+jpg.jpg?format=1500w",
  },
  {
    name: "Bryant Family Reserve, Oak Park",
    description:
      "A small neighbourhood park set in a lovely bush setting, updated with new equipment including a basket swing, nature play elements (logs, rocks) and water play with a pump and waterway. Suitable for toddlers (low-to-ground elements) and older kids (big slide, basketball half court). Popular local spot for picnics, play and dog walking. Notes: parking further up Vincent Street (observe no-stopping signs) or on Winifred Street and walk to the end of Vincent Street. Nearby facilities mentioned: Oak Park Sports & Aquatic Centre for larger water play and the Francis Winifred cafe for coffee.",
    location: {
      name: "Bryant Family Reserve",
      formattedAddress: "End of Francis Street, Oak Park, Australia",
      street_address: "End of Francis Street",
      city: "Oak Park",
      country_code: "AU",
    },
    startDate: "2019-11-23T20:22:47+11:00",
    tags: [
      "park",
      "playground",
      "water play",
      "nature play",
      "toddler",
      "family",
    ],
    imageURL:
      "http://static1.squarespace.com/static/58813c79f7e0ab55271bb525/58ecb61820099e78e671de65/5dd8fa66c040f62cf124d2f9/1733195114554/bryant+family+reserve+excerpt.jpg?format=1500w",
  },
  {
    name: "Bundoora All Abilities Playspace, Bundoora",
    description:
      "A farm‑themed, inclusive playspace next to Bundoora Park Farm featuring tractors, a water‑tank slide, wobbly sheep and cows, a ground‑level spinning merry‑go‑round, hill‑style slide (good for crawlers), a large sandpit and a water play feature. There’s a maze with a hidden horse and a cafe next door that will bring coffee to tables. Facilities noted: partly shaded, pram friendly, cafe, nearby walking tracks, public toilets, undercover seating, picnic seating, fully fenced. Suitable for families and young children; very inclusive design.",
    location: {
      name: "Bundoora All Abilities Playspace",
      formattedAddress: "Plenty Road, Bundoora, Melbourne, Australia",
      street_address: "Plenty Road",
      city: "Bundoora",
      country_code: "AU",
    },
    startDate: "2017-05-01T18:39:00+10:00",
    tags: [
      "park",
      "playground",
      "inclusive",
      "family",
      "water play",
      "sandpit",
    ],
    imageURL:
      "https://static1.squarespace.com/static/58813c79f7e0ab55271bb525/58ecb61820099e78e671de65/5892fe55f7e0aba7b7225d94/1613372493796/bundoora+playspace2.jpg?format=1500w",
  },
  {
    name: "Bulleke-Bek Park, Brunswick",
    description:
      "A brand new playground in the heart of Brunswick. Trains pass overhead. Features two large fort structures with small and large slides, a see-saw, swings including a basket swing, nature-play elements (tree stumps and rocks) and a manual water pump that feeds a mosaic-adorned stream and dry creek bed. Plenty of green space for picnics, undercover seating and tables with a BBQ. The front section of the park is being prepared for community gardens with composting and a worm farm. Nearby family-friendly cafe (LOBBS) is a short stroll away. Facilities: toilets, covered picnic tables, BBQ facilities, water refill station, bike racks, pram accessible; parking is 2-hour on surrounding streets or two small carparks along Breese St.",
    location: {
      name: "Bulleke-Bek Park",
      formattedAddress: "Cnr West & Breese Streets, Brunswick VIC 3056, AU",
      street_address: "Cnr West & Breese Streets",
      city: "Brunswick",
      state_province: "VIC",
      postal_code: "3056",
      country_code: "AU",
    },
    startDate: "2021-01-22",
    tags: [
      "park",
      "playground",
      "nature-play",
      "water-play",
      "family",
      "picnic",
    ],
    imageURL:
      "https://static1.squarespace.com/static/58813c79f7e0ab55271bb525/58ecb61820099e78e671de65/600a27635e3e3924148808bd/1703894626425/bulleke-bek+excerpt.jpg?format=1500w",
  },
  {
    name: "brimbank park, keilor east",
    description:
      "As soon as you leave the freeway and start to drive down into Brimbank Park you instantly feel more relaxed. Houses and suburbs disappear and are replaced with trees, picnic shelters and bushland — plenty to explore, lots of families and lots of space. The feature playscape is excellent with swings, a giant pea pod, a cow park bench, an alphabet maze, a huge platypus and more. There are trails to follow along the river and around the park. Lumbar & Co Cafe on site is handy for food. Facilities include BBQs and picnic shelters, lots of park benches and seating, pram access, public toilets and shade. Parks Victoria provides an autism-friendly social script for this park (photographs and simple text) to help plan visits and improve accessibility.",
    location: {
      name: "Brimbank Park",
      formattedAddress: "Keilor Park Drive, Keilor East, Melbourne, Australia",
      street_address: "Keilor Park Drive",
      city: "Keilor East",
      country_code: "AU",
    },
    startDate: "2019-02-04T11:57:59+11:00",
    tags: [
      "park",
      "playground",
      "family-friendly",
      "walks",
      "picnic",
      "cafe",
      "accessible",
    ],
    imageURL:
      "http://static1.squarespace.com/static/58813c79f7e0ab55271bb525/58ecb61820099e78e671de65/5c5787a2fa0d6079fea37b11/1652073883130/brimbank+park+excerpt.jpg?format=1500w",
  },
  {
    name: "Bell to Moreland Playgrounds & Public Spaces, Coburg",
    description:
      "New-look Bell and Moreland train stations and the open spaces between them created by the level crossing removal project feature playgrounds at both Coburg and Moreland stations, an enclosed dog park, basketball half courts, outdoor exercise stations, a mini skate park and parkour equipment, table tennis tables and bicycle repair stations, and a mini library. The stretch between stations is about 1.5 km — you can park at one station and scoot or ride along the pedestrian/bike paths. Coburg playground suits slightly younger children and has more green space; the mini skate park is closest to Moreland station. Facilities: toilets and car parks at both stations, pram access, bike and pedestrian paths, BBQs, water stations, seating and picnic green space. Nearby coffee: The Eastern Bloc near Coburg Station.",
    location: {
      name: "Bell to Moreland public spaces (Coburg & Moreland stations)",
      formattedAddress: "Melbourne, Australia",
      city: "Melbourne",
      country_code: "AU",
    },
    startDate: "2021-10-10T13:36:45+1100",
    tags: [
      "park",
      "playground",
      "dog park",
      "skate park",
      "family",
      "outdoors",
      "exercise",
      "picnic",
      "walking",
      "cycling",
    ],
    imageURL:
      "https://images.squarespace-cdn.com/content/v1/58813c79f7e0ab55271bb525/1633833976796-ZQ30BPCSSFWEIK29L3DR/level+crossing+removals.jpg",
  },
  {
    name: "Canning Reserve, Avondale Heights",
    description:
      "Canning Reserve is a riverside park on the banks of the Maribyrnong River with river views, large shady trees and plenty of open space. Key features include a flying fox, great swings, toilets, BBQ facilities, picnic tables and lots of free parking. Suitable for family visits and birthday parties. Accessible from the Maribyrnong River Bike Trail. Nearby cafe recommendation: Hippos Lifestyle Store and Cafe up the hill for a cuppa.",
    location: {
      name: "Canning Reserve",
      formattedAddress: "2A Canning St, Avondale Heights, Australia",
      street_address: "2A Canning St",
      city: "Avondale Heights",
      country_code: "AU",
    },
    startDate: "2018-08-07T13:02:20+10:00",
    tags: ["park", "playground", "family", "picnic", "outdoors"],
    imageURL:
      "http://static1.squarespace.com/static/58813c79f7e0ab55271bb525/58ecb61820099e78e671de65/5b690a2d1ae6cf304f4d3d7b/1602461965646/canning+excerpt.jpg?format=1500w",
  },
  {
    name: "Bushranger Drive Playground, Sunbury",
    description:
      "NEWLY OPENED! Sunbury has a new park located behind Woolworths in the Rosenthal Estate on a hill overlooking Sunbury. The park is large and family-friendly with equipment for all ages: toddler slides and equipment, ropes, musical chimes, seesaws, spinners, water play, large slides for older kids, climbing ropes, swings, tunnels, a flying fox and more. There is a large grassed area and a half basketball court. Tables and chairs sit under a shelter for picnics. No toilets on site. Mamma's special mention: The Court Coffee Bar is a 5 minute drive for great coffee and a kids play area.",
    location: {
      name: "Bushranger Drive Playground",
      formattedAddress:
        "Bushranger Drive, Rosenthal Estate, Sunbury, Australia",
      street_address: "Bushranger Drive",
      city: "Sunbury",
      country_code: "AU",
    },
    startDate: "2024-02-28T12:45:38+11:00",
    tags: ["park", "playground", "family", "water-play"],
    imageURL:
      "http://static1.squarespace.com/static/58813c79f7e0ab55271bb525/58ecb61820099e78e671de65/65de8e8a6dac9734f49c6b40/1709087037600/Bushranger+Drive+Sunbury+Mamma+Knows+West-13.jpg?format=1500w",
  },
  {
    name: "Carlton Gardens Playspaces, Carlton",
    description:
      "Two playgrounds at the northern end of Carlton Gardens beside Melbourne Museum and the Royal Exhibition Building. The main play structure features layered, colourful walls with musical walkways, slides and tunnels connecting sections. A second, more traditional plastic playground offers a cubby, slides, monkey bars, a flying fox and a small swing/surfboard feature. The gardens provide plenty of green space, walking paths and areas for picnics; great for family outings. Facilities noted: walking tracks, a basketball court, limited shade, tennis club nearby, public toilet and paid parking at the museum or some street parking.",
    location: {
      name: "Carlton Gardens",
      formattedAddress: "Carlton Street, Carlton, Melbourne, Australia",
      street_address: "Carlton Street",
      city: "Carlton",
      country_code: "AU",
    },
    startDate: "2018-05-07T20:51:15+1000",
    tags: ["park", "playground", "family", "outdoors", "walking", "picnic"],
    imageURL:
      "https://static1.squarespace.com/static/58813c79f7e0ab55271bb525/58ecb61820099e78e671de65/5aefa10d1ae6cf3823c8ef95/1602462129859/02+Carlton+Gardens+%281+of+14%29.jpg?format=1500w",
  },
  {
    name: "batman park, northcote",
    description:
      "Legend says if you run fast, climb high and slide down every slide in the park, you may just see Batman. You need to be quick because he's fast. Batman Park in Northcote has always been a favourite of Mamma's. It's not only on the way to and from the city - making drives a little easier after a quick play - it's also the home to community events and family gatherings. Batman Park also has a great sized playspace which is completely fenced and includes two play structures, sandpit, swings, nature play and chalkboards. Mamma says bring some chalk when you visit and get creative. Playground one is great for smaller kids and includes two slides, climbing pole and counting equipment. Playground two's wooden structure includes a walking bridge, climbing walls, slide and tunnels. This playground is fully enclosed, making your park visit super relaxing. The park also includes a large gazebo complete with tables, seats and BBQs, perfect for large gatherings and birthday parties. There is also a bike track suitable for little ones to scoot around on.",
    location: {
      name: "Batman Park",
      formattedAddress:
        "St Georges Rd & Arthurton Rd, Northcote, Melbourne, Australia",
      street_address: "St Georges Rd & Arthurton Rd",
      city: "Northcote",
      country_code: "AU",
    },
    startDate: "2018-08-28T21:29:00+1000",
    tags: [
      "park",
      "playground",
      "family",
      "fenced",
      "bbq",
      "nature-play",
      "playspace",
      "bike-track",
    ],
    imageURL:
      "http://static1.squarespace.com/static/58813c79f7e0ab55271bb525/58ecb61820099e78e671de65/5b694c0f8a922d4579ddc534/1647340483095/batman+front.jpg?format=1500w",
  },
  {
    name: "Balfe Park, Brunswick East",
    description:
      "A newly upgraded small playground with a cool dragon sculpture, climbing structure with slides, a double swing set, spinners, rockers and a sandpit with trucks and diggers. The reserve also includes a large off‑lead dog oval, exercise equipment and a toilet block. Good for little play dates and dog walks. Mamma's note: about a 7 minute walk from Messina Gelato.",
    location: {
      name: "Balfe Park",
      formattedAddress: "John Street, Brunswick East, Melbourne, Australia",
      street_address: "John Street",
      city: "Brunswick East",
      country_code: "AU",
    },
    startDate: "2021-03-01T12:58:13+11:00",
    tags: [
      "park",
      "playground",
      "dog-friendly",
      "family",
      "picnic",
      "nature-play",
      "exercise-equipment",
      "sandpit",
      "sculpture",
    ],
    imageURL:
      "https://static1.squarespace.com/static/58813c79f7e0ab55271bb525/58ecb61820099e78e671de65/603c4a3567a1a425dce22d75/1730710007955/balfe+park+excerpt+.jpg?format=1500w",
  },
  {
    name: "Bedford St Pocket Park, North Melbourne",
    description:
      "This brand-new park in North Melbourne is perfect for a day out, with lots of green space for picnics, ball games, or getting away from the city's hustle. The playground isn’t huge but has climbing frames, slides, swings, and areas for water and sand play, making it great for toddlers. There are no high structures, so it's quite safe for younger kids. It’s partially fenced with openings to the park, footpath, and BBQ area. The playground connects to another section with picnic benches and BBQs, making it a great spot for family gatherings or birthday parties. The large lawn area has plenty of shaded seating and new trees and ferns that will offer more shade as they grow. No toilet facilities are available. Pram friendly, wheelchair accessible, ample street parking and allocated parking on site. Mamma's tip: pack a picnic or stop by Queen Victoria Market on the way for treats.",
    location: {
      name: "Bedford St Pocket Park",
      formattedAddress: "2 Bedford St, North Melbourne, Australia",
      street_address: "2 Bedford St",
      city: "North Melbourne",
      country_code: "AU",
    },
    startDate: "2025-01-17T14:21:31+1100",
    tags: [
      "park",
      "playground",
      "bbq",
      "picnic",
      "toddler-friendly",
      "water play",
      "sandpit",
      "family",
      "accessible",
    ],
    imageURL:
      "https://images.squarespace-cdn.com/content/v1/58813c79f7e0ab55271bb525/1737083689662-06NBJL1B5N2V6DVBZULI/Bedford+St+Pocket+Park+Mamma+Knows+North+Copyright-16.jpg",
  },
  {
    name: "Mode Park, Kalkallo",
    description:
      "This isn’t just a playground, it’s an entire adventure. The new Mode Park in Kalkallo caters for all ages and features many different types of play equipment for endless hours of fun.",
    location: {
      name: "Mode Park",
      formattedAddress: "Kalkallo, Australia",
      city: "Kalkallo",
      country_code: "AU",
    },
    startDate: "2025-10-06",
    tags: ["park", "playground", "adventure", "family"],
  },
  {
    name: "Mode Park, Kalkallo",
    description:
      "This isn’t just a playground, it’s an entire adventure! The NEW Mode Park in Kalkallo caters for all ages and features many different types of play equipment for endless hours of fun.",
    location: {
      name: "Mode Park",
      city: "Kalkallo",
      country_code: "AU",
    },
    startDate: "2025-10-06",
    tags: ["park", "playground", "adventure", "family", "all-ages"],
  },
  {
    name: "Mode Park, Kalkallo",
    description:
      "This isn’t just a playground, it’s an entire adventure! The NEW Mode Park in Kalkallo caters for all ages, and features many different types of play equipment for endless hours of fun.",
    location: {
      name: "Mode Park, Kalkallo",
      city: "Kalkallo",
    },
    startDate: "2025-10-06",
    tags: [
      "park",
      "playground",
      "best playground melbourne",
      "north playgrounds",
    ],
  },
  {
    name: "Mode Park, Kalkallo",
    description:
      "This isn’t just a playground, it’s an entire adventure! The NEW Mode Park in Kalkallo caters for all ages, and features many different types of play equipment for endless hours of fun.",
    location: {
      name: "Mode Park",
      city: "Kalkallo",
      country_code: "AU",
    },
    startDate: "2025-10-06",
    tags: ["park", "playground", "north playgrounds"],
  },
  {
    name: "Aston's Debonair Parade Park, Craigieburn",
    description:
      "Community park in the Aston estate (Peet development) featuring a large 'Indiana Jones' style rope bridge leading to a wooden cubby with windows and a slide that encourages imaginative play. Also includes a smaller toddler structure and safer-purpose swings, a walking/scooting/bike trail around the perimeter, some shade, picnic seating and plenty of spots for parents to sit and watch. Pram accessible. No toilets on site. The page also highlights other nearby Peet parks.",
    location: {
      name: "Debonair Pde (Near Craigieburn Road)",
      formattedAddress:
        "Debonair Pde (Near Craigieburn Road), Craigieburn, Australia",
      street_address: "Debonair Pde (Near Craigieburn Road)",
      city: "Craigieburn",
      country_code: "AU",
    },
    startDate: "2024-01-12T10:10:00+1100",
    tags: [
      "park",
      "playground",
      "family-friendly",
      "picnic",
      "walking-trail",
      "swings",
    ],
    imageURL:
      "http://static1.squarespace.com/static/58813c79f7e0ab55271bb525/58ecb61820099e78e671de65/591e71a26a496390edc5e880/1705003684800/debonair.jpg?format=1500w",
  },
  {
    name: "AJ Davis Reserve Playground, Airport West",
    description:
      "There is a new playground at AJ Davis Reserve in Airport West. It’s a unique, multi-level hillside playground with lots of natural play elements and family-friendly features.",
    location: {
      name: "AJ Davis Reserve",
      city: "Airport West",
      country_code: "AU",
    },
    startDate: "2023-07-26",
    tags: ["park", "playground", "family", "nature", "outdoors"],
    imageURL:
      "https://images.squarespace-cdn.com/content/v1/58813c79f7e0ab55271bb525/1690351968874-DPRMX09MCZUIE9FQJSWG/aj+davis+reserve+playground%2C+airport+west+-+copyright+2023+mamma+knows+melbourne.jpg?format=300w",
  },
  {
    name: "De Chene Reserve, Coburg",
    description:
      "De Chene Reserve Playground in Coburg is a castle‑style playground with multiple slides (including a long slide and a very wide slide), towers accessed via stairs, ladders and a chain wall, hiding spots, funhouse mirror, clock and play shop. The site includes a seesaw, two sets of swings, a sandpit with digger, picnic tables and a water fountain. Set among trees with Merri Creek running behind it, there are walking trails nearby and a carpark accessible via Urquhart Street. No toilets are listed on site. Nearby public transport and a kid‑ and dog‑friendly café (The Glass Den) are mentioned.",
    location: {
      name: "De Chene Reserve",
      formattedAddress: "193 Urquhart St, Coburg, Australia",
      street_address: "193 Urquhart St",
      city: "Coburg",
      country_code: "AU",
    },
    startDate: "2023-08-27T17:50:00+1000",
    tags: ["park", "playground", "family", "nature play", "picnic"],
    imageURL:
      "https://static1.squarespace.com/static/58813c79f7e0ab55271bb525/58ecb61820099e78e671de65/5cfdc46030938c00012c32af/1730710118196/de+chene.jpg?format=1500w",
  },
  {
    name: "parks melbourne's north",
    description:
      "Mamma Knows North explores Melbourne's North - it is an amazing place to live with a vibrant community and so many great cafe's, parks and adventures to be had. Check out Mamma Knows Norths adventures and get inspired to EXPLORE!",
    location: {
      name: "Mamma Knows North (site)",
      formattedAddress: "Melbourne, Australia",
      city: "Melbourne",
      country_code: "AU",
    },
    tags: ["park", "playground", "parks & playgrounds", "family"],
    imageURL:
      "https://images.squarespace-cdn.com/content/v1/58813c79f7e0ab55271bb525/b2f2e84e-4829-4119-8286-f9c7da415793/MAMMA-KNOWS-north-LG_CIRCLE.png?format=1500w",
  },
  {
    name: "De Chene Parade Playground, Coburg North",
    description:
      "De Chene Parade play space is a small, family-friendly playground across the bridge from Coburg Lake Reserve. Features include an 'outdoor lounge' with carved magical creatures and toys, a flying fox, a five-way swing, a maze and an outdoor 'Twister' board. Grassy areas are suitable for ball games. No public toilets nearby (Coburg Lake Reserve is a short walk across the bridge). Good for young children and small gatherings; street parking available. Additional facilities noted: outdoor table, outdoor gym, bike/walking track.",
    location: {
      name: "De Chene Parade",
      formattedAddress: "De Chene Parade, Coburg North VIC 3058, AU",
      street_address: "De Chene Parade",
      city: "Coburg North",
      state_province: "VIC",
      postal_code: "3058",
      country_code: "AU",
    },
    startDate: "2017-07-05T12:21:17+10:00",
    tags: ["park", "playground", "outdoor", "family"],
    imageURL:
      "http://static1.squarespace.com/static/58813c79f7e0ab55271bb525/58ecb61820099e78e671de65/595c4c92ccf2107d76bd4868/1602462562937/de+chene+parade+playground+front.jpg?format=1500w",
  },
  {
    name: "Condell Reserve, Fitzroy",
    description:
      "Quiet inner-city playspace across from Fitzroy Town Hall. Small, partly fenced park with swings, slide, climbing ropes and bars, play-shop (Condell Street Grocer), lots of grass for picnics and ball games. Suitable for weekday play or a weekend picnic; partially fenced, tree shade and bench seating. Facilities listed: playground, drinking fountain, public toilet, partially fenced, tree shade, bench seats. Nearby cafés (eg. Kewpie) make it easy to grab food.",
    location: {
      name: "Condell Reserve",
      formattedAddress: "Condell St, Melbourne, VIC, Australia",
      street_address: "Condell St",
      city: "Melbourne",
      state_province: "VIC",
      country_code: "AU",
    },
    startDate: "2023-04-26T06:49:12+1000",
    tags: ["park", "playground", "family", "picnic", "outdoors"],
    imageURL:
      "https://static1.squarespace.com/static/58813c79f7e0ab55271bb525/58ecb61820099e78e671de65/6447bee43c4dea7c968a6105/1682458146801/condell.jpg?format=1500w",
  },
  {
    name: "park melbourne",
    description:
      "Mamma Knows North explores Melbourne's North - it is an amazing place to live with a vibrant community and so many great cafe's, parks and adventures to be had. Check out Mamma Knows Norths adventures and get inspired to EXPLORE!",
    tags: ["park", "playground", "parks and playgrounds", "family", "outdoor"],
    imageURL:
      "https://static1.squarespace.com/static/58813c79f7e0ab55271bb525/t/60a5b77d65ffd53bbd75ec93/1759999710708/",
  },
  {
    name: "Mode Park, Kalkallo",
    description:
      "This isn’t just a playground, it’s an entire adventure! The NEW Mode Park in Kalkallo caters for all ages, and features so many different types of play equipment for endless hours of fun!",
    location: {
      name: "Mode Park",
      formattedAddress: "Kalkallo, Australia",
      city: "Kalkallo",
      country_code: "AU",
    },
    startDate: "2025-10-06",
    tags: ["park", "playground", "adventure", "all-ages"],
  },
  {
    name: "copper butterfly playspace, eltham",
    description:
      "A playspace in Lower Eltham Reserve celebrating the Eltham Copper Butterfly. Inclusive features include an alphabet frieze with AUSLAN signs, braille on signage, butterfly climbing panels, a sensory corner with sandpit and water, a single tunnel slide and a twin flying fox. The site includes intricate art pieces and information boards about the butterfly lifecycle. Popular on Sundays due to the nearby Diamond Valley Railway (coffee van often present). Facilities noted: fully fenced, pram accessible, public toilets, good shade, picnic seating, astro-turf, BBQs, water fountain and sand.",
    location: {
      name: "Lower Eltham Reserve (Eltham Lower Park)",
      formattedAddress: "Main Road, Eltham, VIC, Australia",
      street_address: "Main Road",
      city: "Eltham",
      state_province: "VIC",
      country_code: "AU",
    },
    startDate: "2017-05-01T13:12:12+1000",
    tags: ["park", "playground", "inclusive", "sensory", "family"],
    imageURL:
      "http://static1.squarespace.com/static/58813c79f7e0ab55271bb525/58ecb61820099e78e671de65/58f710d5d2b857107dfb8e78/1602462829435/Butterfly3.jpg?format=1500w",
  },
  {
    name: "Delta Reserve Playground & Bike Education Track, Greensborough",
    description:
      "Upgrade alert! A newly upgraded, unassuming spot with a bike education/traffic park featuring bike and scooter tracks, a roundabout, pedestrian crossing, give way and stop signs and petrol station pumps. Small playground with unique equipment including a cableway, two climbing towers with slides (including a smaller kids tower), a sit-in car rocker, mini rock climbing wall, two swing sets plus a standalone sling swing, balance logs, a half court with basketball and netball hoops, several tables and chairs (one undercover). No toilets at the playground; Diamond Village Shopping Centre (across the road) has an IGA with toilet key. Nearby food: Diamond Village Bakery and Espresso 3094 (about a 9 minute drive).",
    location: {
      name: "Delta Road Reserve (Delta Reserve)",
      formattedAddress: "Delta Road, Greensborough, Melbourne, Australia",
      street_address: "Delta Road",
      city: "Greensborough",
      country_code: "AU",
    },
    startDate: "2021-07-11T15:02:35+10:00",
    tags: [
      "park",
      "playground",
      "traffic park",
      "bike education track",
      "scooter track",
      "family",
      "picnic",
    ],
    imageURL:
      "https://static1.squarespace.com/static/58813c79f7e0ab55271bb525/58ecb61820099e78e671de65/60ea7b6b563c1506a8c401d1/1627285386519/excerpt+delta+reserve.jpg?format=1500w",
  },
  {
    name: "eaglehawk play space, eaglehawk (bendigo)",
    description:
      "This large themed playground at Neangar Lake offers gated toddler play, nature play and active/adventure areas. Highlights include human-sized hamster wheels, a double bicycle pedal spinner, a wide side-by-side slide, flying fox, cable climb, tree-stump forest, multi-level climbing tower, huge basket swing and in-ground trampoline. The fenced toddler area has an audio story station (Mulga Bill), a wooden cubby, sandpit with water play, musical play stations and accessible swings. Good picnic and green space, street parking and pram access. Recommended: bring bikes and try the nearby Mulga Bill Bicycle Trail; also visit the local Discovery Science & Technology Centre.",
    location: {
      name: "Eaglehawk Play Space",
      formattedAddress: "Napier Street, Eaglehawk, Australia",
      street_address: "Napier Street",
      city: "Eaglehawk",
      country_code: "AU",
    },
    startDate: "2021-01-05T10:41:22+11:00",
    tags: [
      "park",
      "playground",
      "nature play",
      "toddler friendly",
      "family",
      "accessible",
      "picnic",
    ],
    imageURL:
      "http://static1.squarespace.com/static/58813c79f7e0ab55271bb525/58ecb61820099e78e671de65/5ff3a7a2c477ea2dc0794a4a/1621751264967/excerpt+bendigo+eaglehawk+play+space.jpg?format=1500w",
  },
  {
    name: "Diamond Creek Regional Playspace",
    description:
      "Large family-friendly playspace themed on the town's gold-panning history. Features a Parkour zone around a replica poppet head, climbing frames, wide open green space, swings, tunnel, cubby houses, slides and a very large sandpit with mining-cart tracks and sorting stations. Central depot includes a water pump and shade. Suitable for both bigger and little kids. There is a restored W Class tram converted into the Tram Cafe (coffee, milkshakes, ice cream) at the back of the playspace. Located along the Diamond Creek Trail and close to other local attractions. Facilities and notes: picnic tables, green space, BBQ, public toilets, shade sails, off-street parking, local tourism kiosk, walking paths, fully fenced dog park nearby, close to public transport. Families should expect an expansive, multi-age play area with extensive sand play and climbing opportunities.",
    location: {
      name: "Diamond Creek Regional Playspace",
      formattedAddress:
        "28 Main Hurstbridge Rd, Diamond Creek VIC 3089, Australia",
      street_address: "28 Main Hurstbridge Rd",
      city: "Diamond Creek",
      state_province: "VIC",
      postal_code: "3089",
      country_code: "AU",
    },
    startDate: "2020-10-31T15:50:30+11:00",
    tags: [
      "park",
      "playground",
      "family",
      "outdoors",
      "sandpit",
      "play",
      "cafe",
    ],
    imageURL:
      "https://static1.squarespace.com/static/58813c79f7e0ab55271bb525/58ecb61820099e78e671de65/5f9cea360e604768dbf5898f/1659841910226/05+Diamond+Creek+Playspace+-+Mamma+Knows+East+%281+of+58%29.jpg?format=1500w",
  },
  {
    name: "Aurora Adventure Park, Wollert",
    description:
      "Aurora Adventure Park in Wollert is a large, futuristic playground with slopes, rope bridges, a mini trampoline, tunnels and kinetic movement play equipment. There are features for older children as well as younger ones. The park offers free WiFi and reportedly 'glows in the dark' at night. Facilities mentioned include park benches, rain shelter, picnic tables, electric BBQ and pram access. Mamma recommends stopping at Waterside Cafe for lunch with a view. For more details the post links to the Aurora Facebook page.",
    location: {
      name: "Aurora Adventure Park",
      formattedAddress:
        "Cnr Craigieburn East Road and Edgars Road, Wollert, Australia",
      street_address: "Cnr Craigieburn East Road and Edgars Road",
      city: "Wollert",
      country_code: "AU",
    },
    startDate: "2017-09-01T14:25:17+1000",
    tags: ["park", "playground", "outdoor", "family", "play"],
    imageURL:
      "http://static1.squarespace.com/static/58813c79f7e0ab55271bb525/58ecb61820099e78e671de65/59a8e03a893fc067169685b3/1562197456237/aurora+front.jpg?format=1500w",
  },
  {
    name: "cb smith reserve, fawkner",
    description:
      "CB Smith Reserve in Fawkner has a large new playground featuring a double climbing tower with multiple climbing options, a huge tunnel slide, a high rope bridge, a shop-front play area, jail rope bars, xylophone, and a built-in line-up-4 game. There is a massive sandpit, toddler and standard swings (including a rope web swing), a floor spinner and musical flowers. Facilities include toilets, undercover tables and chairs, BBQs, drink taps, plentiful shade from trees, nearby car park, a skate park and a footy oval. The playground sits beside Fawkner Library, a refurbished pool and a Maternal & Child Health Centre. Suitable for families with young children; bring sand toys to make the most of the sandpit.",
    location: {
      name: "CB Smith Reserve",
      formattedAddress: "58 Ledger Ave, Fawkner, Australia",
      street_address: "58 Ledger Ave",
      city: "Fawkner",
      country_code: "AU",
    },
    startDate: "2025-03-06T12:21:31+11:00",
    tags: [
      "park",
      "playground",
      "family-friendly",
      "outdoors",
      "sandpit",
      "swings",
    ],
    imageURL:
      "http://static1.squarespace.com/static/58813c79f7e0ab55271bb525/58ecb61820099e78e671de65/67c8ef792a70422b652c519f/1745374252421/CB+Smith+Reserve+Fawkner-3.jpg?format=1500w",
  },
  {
    name: "Castlemaine Botanical Gardens Playground, Castlemaine",
    description:
      "Nestled in the scenic Castlemaine Botanical Gardens, this spacious playground features a huge central acorn tree with natural play equipment radiating from its base. Highlights include a sweet homestead cubby, swings, slides, old-school flying foxes, monkey bars and a small wooden train. There is plentiful seating, picnic tables, toilets, water refill, a large shed/venue with BBQs suitable for parties, and good picnic and wildlife-observation opportunities. Mamma visited in early winter and recommended it as a day-trip destination (about a 90-minute drive from Melbourne).",
    location: {
      name: "Castlemaine Botanical Gardens",
      formattedAddress: "Downes Rd, Castlemaine, Australia",
      street_address: "Downes Rd",
      city: "Castlemaine",
      country_code: "AU",
    },
    startDate: "2023-06-16T23:35:20+10:00",
    tags: ["park", "playground", "picnic", "family", "day trip", "nature"],
    imageURL:
      "https://static1.squarespace.com/static/58813c79f7e0ab55271bb525/58ecb61820099e78e671de65/648c55d91f05b7110b2d0ce0/1687336959594/castlemaine+botanical+gardens+playground%2C+castlemaine+-+copyright+2023+mamma+knows+melbourne-4.jpg?format=1500w",
  },
  {
    name: "Donnybrook Park, Peppercorn Hill, Donnybrook",
    description:
      "Donnybrook Park at Peppercorn Hill is a bright, colourful small playground with lots to offer: three climbing towers of varying heights, elevated mesh tunnels, in-ground trampolines and spinner, balancing logs, a rock-climbing drawbridge, a mega slide, a basketball half court and shaded picnic areas. Suitable for children who enjoy climbing and active play; nearby Gumnut Park has toilets and a cafe. Street parking available; nature play features and sheltered picnic tables noted.",
    location: {
      name: "Donnybrook Park, Peppercorn Hill",
      formattedAddress: "17 Feathertop Cres, Donnybrook, VIC 3064, AU",
      street_address: "17 Feathertop Cres",
      city: "Donnybrook",
      state_province: "VIC",
      postal_code: "3064",
      country_code: "AU",
    },
    startDate: "2022-02-05T13:34:38+11:00",
    tags: ["park", "playground", "nature play", "family", "outdoors"],
    imageURL:
      "https://images.squarespace-cdn.com/content/v1/58813c79f7e0ab55271bb525/7f8ca4f9-a533-4fd8-97fa-4cceacd7e896/donnybrook+park-20.jpg",
  },
  {
    name: "Curtain Square, Carlton North",
    description:
      "Green local park with mature trees, multiple play areas for little tots and bigger kids, extra swings, hoops for netball/basketball, toilets and nearby cafes on Rathdowne St. Notable handcrafted totem poles and other creative features. Carlton Library is directly across the road. Facilities: free parking (2 & 4 hrs), toilets, shade (trees and shade sail), dogs on leads, partly fenced with open gateways.",
    location: {
      name: "Curtain Square",
      formattedAddress: "Rathdowne St, Carlton North, Melbourne, Australia",
      street_address: "Rathdowne St",
      city: "Carlton North",
      country_code: "AU",
    },
    startDate: "2017-05-02T13:11:00+1000",
    tags: ["park", "playground", "family", "trees", "picnic"],
    imageURL:
      "http://static1.squarespace.com/static/58813c79f7e0ab55271bb525/58ecb61820099e78e671de65/58f6d5644402439fb1d20b0c/1602462682450/curtain+square+excerpt.jpg?format=1500w",
  },
  {
    name: "Cloverton Water Playground and Park, Kalkallo",
    description:
      "Huge swirly slide, water play (overhead mist and underfoot jets), flying fox, cafe, swings and many features in one playground. Seed pods with surprises in the floor, grassed areas, rock bench seating and nearby cafe seating. Suitable for families and children; great for hot days because of the water play. Facilities noted on the page: limited opening hours (listed as 10am-5pm), free entry, parking, toilets, cafe with highchairs, enclosed play, water play.",
    location: {
      name: "Cloverton Water Playground and Park",
      formattedAddress:
        "Corner Dwyer Street & Design Way, Kalkallo VIC 3064, AU",
      street_address: "Corner Dwyer Street & Design Way",
      city: "Kalkallo",
      state_province: "VIC",
      postal_code: "3064",
      country_code: "AU",
    },
    startDate: "2024-10-24T13:29:00+11:00",
    tags: ["park", "playground", "water play", "slides", "family", "outdoors"],
    imageURL:
      "http://static1.squarespace.com/static/58813c79f7e0ab55271bb525/58ecb61820099e78e671de65/5c48ff1cbba223630db15e43/1731992333877/livvis+excerpt+2.jpg?format=1500w",
  },
  {
    name: "Diamond Creek Reserve Playground, Diamond Creek",
    description:
      "There is something special about a kids' party in the park. The Diamond Creek playground has a fresh feel with spongy flooring and modern equipment including a hammock, a spinner and a shop counter with a cash register. The playground suits a mix of ages and is supported by a basketball half court, open fields, bike tracks and a table tennis table. Rotary picnic shelter and BBQs are available. Nitty gritty: toilets, BBQs, picnic shelter, table tennis (bat hire from service station over the road), walking trails, semi fenced areas, netball courts, basketball half court. Mamma's tip: for a bite before or after play try Shillinglaw Cafe in Eltham.",
    location: {
      name: "Diamond Creek Reserve Playground",
      formattedAddress: "2 Diamond Street Reserve, Diamond Creek, Australia",
      street_address: "2 Diamond Street Reserve",
      city: "Diamond Creek",
      country_code: "AU",
    },
    startDate: "2018-02-27T14:41:01+1100",
    tags: ["park", "playground", "family", "outdoor", "picnic"],
    imageURL:
      "http://static1.squarespace.com/static/58813c79f7e0ab55271bb525/58ecb61820099e78e671de65/5a8ca6f8ec212d6749c39a51/1602462372013/03+Diamond+Creek+Reserve+Mamma+Knows+North+%281+of+22%29.jpg?format=1500w",
  },
  {
    name: "civic drive playspace, greensborough",
    description:
      "Caution! There is a HUGE snake weaving its way through the Civic Drive Playspace in Greensborough! But never fear - this concrete giant ain't too fast. The scales have been painted by local kiddos and it’s a pretty friendly pal to find in the park. This playground is a brilliant space for the whole gang. There is the epic slide structure reaching into the clouds, a great challenging rock climbing blob and a funky round-shaped basketball half court. There are wheelchair-accessible features including a spinner and a wheel-up sand pit. There are musical elements including shiny drums, classic swings, climbing ropes, a log forest and a flying fox. Mamma's special mention: Around the corner you will find the Diamond Valley Library, a great spot for a quieter moment after the fun of the playground or drop in for storytime. The nitty gritty: sand - bbq - picnic shelter - opposite leisure centre - library nearby - green space for a picnic - half court basketball - limited shade.",
    location: {
      name: "Civic Drive Playspace, Greensborough",
      formattedAddress: "Civic Circuit, Greensborough VIC 3088, AU",
      street_address: "Civic Circuit",
      city: "Greensborough",
      state_province: "VIC",
      postal_code: "3088",
      country_code: "AU",
    },
    startDate: "2019-02-18T21:04:48+1100",
    tags: ["park", "playground", "family", "accessible", "picnic"],
    imageURL:
      "http://static1.squarespace.com/static/58813c79f7e0ab55271bb525/58ecb61820099e78e671de65/5c6a25ab53450ac8afaa9c13/1613274265141/03+Civic+Drive+Playspace%2C+Greensborough+-+Mamma+Knows+North+%281+of+18%29.jpg?format=1500w",
  },
  {
    name: "Cross Keys Reserve, Essendon",
    description:
      "Essendon has a brand new playground offering sensory, natural, imaginative and physical play. Features include a giant busy board, 4-seater seesaw, rope-climbing platform, an ant-hill climb to a trampoline, interactive cubby house, three swings, a large climbing structure with a long twirly slide, a mini arrowed circuit for bikes/scooters with road signs and a pretend petrol pump, a play cafe (scales, table and chairs), a play vet with cash register, carved animal statues, new planting, BBQ facilities, tables and a water fountain. The oval and a new basketball court sit next to the playground. No toilets onsite.",
    location: {
      name: "Cross Keys Reserve",
      formattedAddress: "Woodland St, Strathmore, VIC 3040, Australia",
      street_address: "Woodland St",
      city: "Strathmore",
      state_province: "VIC",
      postal_code: "3040",
      country_code: "AU",
    },
    startDate: "2023-08-21T07:28:57+1000",
    tags: ["park", "playground", "family", "outdoors"],
    imageURL:
      "http://static1.squarespace.com/static/58813c79f7e0ab55271bb525/58ecb61820099e78e671de65/64e0a010709e751e86166f3d/1692650661278/cross+keys.jpg?format=1500w",
  },
  {
    name: "CERES Playspace: Terra Wonder, Brunswick East",
    description:
      "This unique, soil-themed nature playspace at CERES features recycled industrial play equipment including a giant climb-through millipede, multilevel sandpit, mud cubby, tyre tree house with pulleys, steep rocky banks and many nature-play elements. No plastic play equipment; great for imaginative play and exploring bugs and natural materials. Facilities nearby include seating, toilets and cafes. Admission is free (donations accepted). Park and grounds open during daylight hours. Dogs allowed on leashes. Merri Cafe (on-site) is open Thursday–Sunday 9:00–15:00; the organic grocer and cafe operates 9:00–17:00 (cafe closes ~15:30) and is open seven days. Link to CERES for more info is provided on the page.",
    location: {
      name: "CERES Community Environment Park (Terra Wonder playspace)",
      formattedAddress:
        "Stewart St & Roberts St, Brunswick East, Melbourne, Australia",
      street_address: "Stewart St & Roberts St",
      city: "Brunswick East",
      country_code: "AU",
    },
    startDate: "2021-01-26T13:22:55+1100",
    tags: [
      "park",
      "playground",
      "nature play",
      "family",
      "outdoors",
      "sandpit",
      "community",
      "recycled materials",
      "play space",
    ],
    imageURL:
      "http://static1.squarespace.com/static/58813c79f7e0ab55271bb525/58ecb61820099e78e671de65/600f7cffec993c3d7c0a3317/1730709933572/terra+wonder+excerpt.jpg?format=1500w",
  },
  {
    name: "Coronet Park, Flemington",
    description:
      "Coronet Park is a small suburban park tucked beside the Stables Community Cafe and residential streets in Flemington. The park features a climbing frame, a cubby, a nest swing and other play equipment, and is largely fenced which helps contain children. Facilities and practical notes: lots of on-street parking, pram access, toilets nearby (in the Stables Community Cafe), some shade, BBQ and plenty of seating. Good for families with toddlers and young children; cafe nearby makes it convenient for refreshments and longer visits.",
    location: {
      name: "Coronet Park",
      formattedAddress: "Coronet St, Flemington VIC 3031, AU",
      street_address: "Coronet St",
      city: "Flemington",
      state_province: "VIC",
      postal_code: "3031",
      country_code: "AU",
    },
    startDate: "2017-04-19T16:40:03+10:00",
    tags: ["park", "playground", "family", "outdoors", "cafe"],
    imageURL:
      "https://static1.squarespace.com/static/58813c79f7e0ab55271bb525/58ecb61820099e78e671de65/58f70649d2b857107dfb3da9/1602462955695/Screen+Shot+2017-05-01+at+6.35.05+am.png?format=1500w",
  },
  {
    name: "Darebin Creek Parklands Playground, Epping",
    description:
      "The Darebin Creek Parklands playground in Epping has been transformed with nature-play elements and new equipment including unique climbing structures, a cubby house, rockers, spinners, an arched seesaw and an exercise station. There is a covered picnic area, pedestrian and bike paths and a bushy setting with trees, logs and shrubs. Facilities noted: sheltered picnic tables, bike paths and street parking. Suitable for family visits and a range of ages; nearby playgrounds are linked in the article.",
    location: {
      name: "Darebin Creek Reserve",
      formattedAddress: "Dalton Road / Park St, Epping VIC 3076, AU",
      street_address: "Dalton Road / Park St",
      city: "Epping",
      state_province: "VIC",
      postal_code: "3076",
      country_code: "AU",
    },
    startDate: "2021-11-17T11:31:07+11:00",
    tags: [
      "park",
      "playground",
      "nature play",
      "picnic",
      "bike paths",
      "outdoors",
      "family",
    ],
    imageURL:
      "http://static1.squarespace.com/static/58813c79f7e0ab55271bb525/58ecb61820099e78e671de65/61944d4b38513f0ebbbbcd39/1642057791656/darebin+creek+parklands%2C+epping.jpg?format=1500w",
  },
  {
    name: "craigieburn road east playspace 2, wollert",
    description:
      "Craigieburn Road East Playspace is the sister playground to the nearby Craigieburn Road East Adventure Park, located just across the road. The playspace focuses on climbing and slides, ideal for children who enjoy climbing. Suggested as a morning outing with friends, and you can combine it with a visit to the nearby Craigieburn Road East Adventure Park. Mamma recommends Two Beans and a Farm Restaurant in the area (open for breakfast, lunch and dinner) — call to book. Nitty gritty: pram access, climbing structures, coffee hub nearby, parking. Location given as the corner of Craigieburn East Road and Edgars Road, Wollert. See the article for photos and a Google Maps link.",
    location: {
      name: "Craigieburn Road East Playspace 2",
      formattedAddress:
        "Cnr Craigieburn East Road and Edgars Road, Wollert, Australia",
      street_address: "Cnr Craigieburn East Road and Edgars Road",
      city: "Wollert",
      country_code: "AU",
    },
    startDate: "2017-09-26T15:04:10+10:00",
    tags: ["park", "playground", "climbing", "slides", "family", "outdoor"],
    imageURL:
      "https://static1.squarespace.com/static/58813c79f7e0ab55271bb525/58ecb61820099e78e671de65/59c9dec32994cacd93de7f2e/1602462467307/aurorafront.jpg?format=1500w",
  },
  {
    name: "Clarinda Park Playspace, Essendon",
    description:
      "Clarinda Park Playspace in Essendon is a small but mighty play space offering a huge range of equipment and nature play. Features include a swing set, slide, ladder, trak ride, 4-way animal themed springer, high rope climb, bright coloured cluster climbers, a large sand pit, an obstacle trail of rocks and timber logs, balance beams, shade sail coverage and plenty of benches. Facilities noted: drinking fountain, undercover areas, seating and street parking. No toilets. Mamma's tip: grab a sandwich from 3 Salamis on the way.",
    location: {
      name: "Clarinda Park Playspace",
      formattedAddress: "38 Clarinda Road, Essendon, Australia",
      street_address: "38 Clarinda Road",
      city: "Essendon",
      country_code: "AU",
    },
    startDate: "2025-07-19T20:02:51+1000",
    tags: [
      "park",
      "playground",
      "nature play",
      "play space",
      "family friendly",
      "sand pit",
    ],
    imageURL:
      "https://images.squarespace-cdn.com/content/v1/58813c79f7e0ab55271bb525/1f4705d4-9287-4af9-8741-9a10f348a2a1/Clarinda+Park+Playspace+Essendon+Copyright+Mamma+Knows-5.jpg",
  },
  {
    name: "Coburg Lake Reserve, Coburg North",
    description:
      "Wow! Wow! Wow! If it's fun, exciting and all about adventure you are looking for, then this place is for you. Coburg Lake Reserve is perfect for the whole family. This place has it all - bike/walking tracks, lake, BBQ area and loads of seating. There is onsite parking and tonnes of space. The playspace is huge: a rocket ship playground with two large slides, swings, a mini space playground for little ones and a climbing gym. After a play you can watch the local ducks by the lake. The reserve hosts regular festivals and events (see Moreland City Council). Mamma's special mention: Paninoteca is just up the road with delicious home-made rolls, perfect for lunch in the park. Facilities listed: onsite free parking, toilets, seating, lake, bike/walk trail, outdoor gym, BBQ, picnic tables, occasional coffee and jaffle van.",
    location: {
      name: "Coburg Lake Reserve",
      formattedAddress: "2A Gaffney Street, Coburg North, Australia",
      street_address: "2A Gaffney Street",
      city: "Coburg North",
      country_code: "AU",
    },
    startDate: "2023-08-02T20:41:00+10:00",
    tags: ["park", "playground", "family-friendly", "outdoors", "lake"],
    imageURL:
      "https://static1.squarespace.com/static/58813c79f7e0ab55271bb525/58ecb61820099e78e671de65/593291dd9f745683985685ef/1730710066180/coburg+lake+reserve%2C+coburg+north+-+copyright+2023+mamma+knows+melbourne-9.jpg?format=1500w",
  },
  {
    name: "Derby St Reserve, Tullamarine",
    description:
      "New playground alert at Derby St Reserve in Tullamarine. The reserve features a large BMX track, tennis courts, a multi-purpose basketball/netball/futsal court, a separate basketball hoop, an outdoor gym, slides, climbing equipment, swings, a flying fox and monkey bars. Facilities include on-site public toilets, a dedicated carpark, undercover seating with BBQ and a drinking fountain. Suitable for a wide range of ages; nearby Ninth Avenue cafe is recommended for food.",
    location: {
      name: "Derby St Reserve",
      formattedAddress: "26 Derby St, Tullamarine VIC 3043, AU",
      street_address: "26 Derby St",
      city: "Tullamarine",
      state_province: "VIC",
      postal_code: "3043",
      country_code: "AU",
    },
    startDate: "2025-06-05T12:39:01+10:00",
    tags: [
      "park",
      "playground",
      "bmx",
      "tennis",
      "basketball",
      "outdoor gym",
      "picnic",
      "family",
    ],
    imageURL:
      "https://images.squarespace-cdn.com/content/v1/58813c79f7e0ab55271bb525/1749092240164-9IRMCGND8HIR3556STJB/Derby+St+Reserve+Tullamarine+Copyright+Mamma+Knows+North-3.jpg",
  },
  {
    name: "Gumnut Park and Adventure Playground, Donnybrook",
    description:
      "This epic adventure playground is inspired by May Gibbs’ Gumnut Babies (Snugglepot & Cuddlepie) and set among red gum trees. Three large towers lead to gum‑nut shaped climbing pods connected by mesh tunnels and finished with two mega slides. Features include two flying foxes, a low toddler area with a slippery dip over a sandpit, in‑ground trampolines, extensive wooden climbing and balance equipment, a gum nut cubby, basketball half court, skate/BMX ramps, a large undercover picnic area with barbeques, toilets and a cafe (Shared Cup) overlooking the toddler area. Pram friendly and suitable for a wide range of ages; lots of nature‑play elements to discover.",
    location: {
      name: "Gumnut Park and Adventure Playground",
      formattedAddress: "1025 Donnybrook Rd, Donnybrook VIC 3064, AU",
      street_address: "1025 Donnybrook Rd",
      city: "Donnybrook",
      state_province: "VIC",
      postal_code: "3064",
      country_code: "AU",
    },
    startDate: "2024-10-15T15:06:00+11:00",
    tags: [
      "park",
      "playground",
      "adventure play",
      "nature play",
      "family",
      "toddlers",
      "cafe",
    ],
    imageURL:
      "http://static1.squarespace.com/static/58813c79f7e0ab55271bb525/58ecb61820099e78e671de65/5ee701df945e9b489ae4ad14/1732064773397/Gumnut+Adventure+Park+Donnybrook-9.jpg?format=1500w",
  },
  {
    name: "laurimar drainage reserve, doreen",
    description:
      "Recently upgraded small playground with slides, swings, climbing stones, monkey bars and a timber play frame. The reserve sits just off busy Hazel Glen Drive but includes a hidden pocket of trees and a shallow creek for nature play. Facilities mentioned: BBQ, wheelchair-accessible entrance, walking trail and pram-friendly paths. No toilets. Limited allocated parking but ample street parking. Suitable for family outings and young explorers; may get muddy around the creek (bring gumboots). Tip: after visiting, stroll along the trail toward Jo Jayz Café.",
    location: {
      name: "Laurimar Drainage Reserve",
      formattedAddress: "9 Hazel Glen Drive, Doreen VIC 3754, AU",
      street_address: "9 Hazel Glen Drive",
      city: "Doreen",
      state_province: "VIC",
      postal_code: "3754",
      country_code: "AU",
    },
    startDate: "2025-01-15T11:26:06+11:00",
    tags: [
      "park",
      "playground",
      "nature play",
      "family friendly",
      "walking trail",
    ],
    imageURL:
      "http://static1.squarespace.com/static/58813c79f7e0ab55271bb525/58ecb61820099e78e671de65/67862dfefb61a67f4639d46d/1738901885900/Laurimar+Drainage+Reserve++Mamma+Knows+North+Copyright-2.jpg?format=1500w",
  },
  {
    name: "Jack Roper, Broadmeadows",
    description:
      "This playspace at Jack Roper Reserve has been recently upgraded and suits all ages and abilities. Features include a flying fox, cubbies, mini trampolines, balancing beams, rock-climbing walls, slides and a wheelchair swing, plus a large grassy area for games, a lake and walking track. The site is family-friendly and accessible, with shade, public toilets, parking and BBQs. Mamma recommends nearby Pane e' Pizza by North Street Bakery for takeaway pizza before or after play. For official details see the Hume Council link on the page.",
    location: {
      name: "Jack Roper Reserve",
      formattedAddress: "217 Camp Rd, Broadmeadows, VIC, Australia",
      street_address: "217 Camp Rd",
      city: "Broadmeadows",
      state_province: "VIC",
      country_code: "AU",
    },
    startDate: "2018-05-29T20:08:36+10:00",
    tags: ["park", "playground", "family", "accessible", "outdoors"],
    imageURL:
      "http://static1.squarespace.com/static/58813c79f7e0ab55271bb525/58ecb61820099e78e671de65/5afa44790e2e72b3186009c2/1602462055146/jack+roper%2C+broadmeadows+front.jpg?format=1500w",
  },
  {
    name: "golden sun moth park, craigieburn",
    description:
      "Golden Sun Moth Park is an outdoor adventure playground in Craigieburn with two distinct play spaces. Play space one is shaped/structured to resemble the Golden Sun Moth and includes rope climbing frames and a tunnel slide with interpretive moth facts. Play space two features a wooden-frame climbing wall, ladders, slides, spinning disks, a speak-and-listen system, swings and bug sculptures for climbing. The wider park also has pyramid climbing structures, disk spinners, additional swings and seating around play areas, making it suitable for smaller children and family visits. The park is good for a quick play or a whole day out. Nitty gritty: street parking, shade, BBQs and toilets are mentioned.",
    location: {
      name: "Golden Sun Moth Park",
      formattedAddress:
        "Grand Boulevard / Packington Ct, Craigieburn, Australia",
      street_address: "Grand Boulevard / Packington Ct",
      city: "Craigieburn",
      country_code: "AU",
    },
    startDate: "2018-12-15T19:36:21+1100",
    tags: ["park", "playground", "family-friendly", "outdoor", "nature"],
    imageURL:
      "http://static1.squarespace.com/static/58813c79f7e0ab55271bb525/58ecb61820099e78e671de65/5c0da911cd8366f04fd4761c/1602461619536/MOTH+FRONT.jpg?format=1500w",
  },
  {
    name: "Edinburgh Gardens and Playground, North Fitzroy",
    description:
      "Edinburgh Gardens is a large, family-friendly park with multiple playgrounds, an off-leash dog area, basketball half court, volleyball and tennis courts, BBQ facilities, lawn bowls, bike paths and skate ramps. Plenty of shaded lawn for picnics and general recreation; playground near St Georges Road offers climbing ropes, swings and a sandpit suitable for toddlers and preschoolers. Often hosts local DJs and ice-cream vendors. Tip: grab a DIY picnic pack from Just Falafs across the street.",
    location: {
      name: "Edinburgh Gardens",
      formattedAddress: "Alfred Cres, Fitzroy North, VIC, Australia",
      street_address: "Alfred Cres",
      city: "Fitzroy North",
      state_province: "VIC",
      country_code: "AU",
    },
    startDate: "2023-03-02T11:59:30+11:00",
    tags: ["park", "playground", "family", "picnic", "skate", "dog-friendly"],
    imageURL:
      "http://static1.squarespace.com/static/58813c79f7e0ab55271bb525/58ecb61820099e78e671de65/63fec686597f963daac498ff/1682457159356/edinburgh.jpg?format=1500w",
  },
  {
    name: "Fanny Street Reserve, Moonee Ponds",
    description:
      "Fanny Street Reserve offers a large open park with a wooden boat-shaped playground, climbing structures, slides, monkey bars, multilevel sandpit, flying fox, rowboat, see-saw and basket swing. The park includes seating, picnic tables and a BBQ, a patched path suitable for prams and wheelchairs, a dirt BMX/bike track and adjacent car parking. It sits along the Moonee Ponds Creek Trail (good for riding) and is family-friendly. Nearby eating option: Brother Hen is a short walk away.",
    location: {
      name: "Fanny Street Reserve",
      formattedAddress: "18 Fanny St, Moonee Ponds VIC 3039, AU",
      street_address: "18 Fanny St",
      city: "Moonee Ponds",
      state_province: "VIC",
      postal_code: "3039",
      country_code: "AU",
    },
    startDate: "2023-07-04T09:55:36+10:00",
    tags: [
      "park",
      "playground",
      "family",
      "bmx",
      "picnic",
      "bbq",
      "accessible",
      "bike-track",
      "sandpit",
    ],
    imageURL:
      "http://static1.squarespace.com/static/58813c79f7e0ab55271bb525/58ecb61820099e78e671de65/64a35a5f80ab2d7d7c261145/1689034461441/fanny+street.jpg?format=1500w",
  },
  {
    name: "Laurimar Drainage Reserve, Doreen",
    description:
      "Small playspace with climbing equipment, a walking bridge and a spiral slide. Walking tracks run along the creek to the nearby shops. Good picnic space for small groups or a quick play. Facilities mentioned: BBQ, wooden tables and benches, free street parking. Nearby eatery: Slices (short walk).",
    location: {
      name: "Laurimar Drainage Reserve",
      formattedAddress: "Hazel Glen Drive, Doreen, Australia",
      street_address: "Hazel Glen Drive",
      city: "Doreen",
      country_code: "AU",
    },
    startDate: "2018-08-06T14:41:47+1000",
    tags: ["park", "playground", "picnic", "walking-tracks", "family-friendly"],
    imageURL:
      "http://static1.squarespace.com/static/58813c79f7e0ab55271bb525/58ecb61820099e78e671de65/5b5af53af950b7bb8065b398/1602462005544/laurimar+front.jpg?format=1500w",
  },
  {
    name: "Kelvin Thomson Park playground, Pascoe Vale South",
    description:
      "Small but feature-rich neighbourhood park with two side-by-side flying foxes, playground equipment (climbing options, rope bridge, double slides, cubby), three swings, tire hopscotch, monkey bars, a basketball court and large grassy open spaces. Park runs alongside a fenced train track — good for train spotting. Plenty of nature-play elements (logs, rocks, trees), benches and a picnic table (including a kids log table). Facilities noted: picnic table, playground, basketball court, drinking fountain, parking via Cleve Road; no toilets.",
    location: {
      name: "Kelvin Thomson Park",
      formattedAddress: "Cleve Rd, Pascoe Vale South, Australia",
      street_address: "Cleve Rd",
      city: "Pascoe Vale South",
      country_code: "AU",
    },
    startDate: "2023-07-14T16:50:16+1000",
    tags: [
      "park",
      "playground",
      "family",
      "nature-play",
      "train-spotting",
      "basketball",
    ],
    imageURL:
      "http://static1.squarespace.com/static/58813c79f7e0ab55271bb525/58ecb61820099e78e671de65/64b0e7223ee7e56f425c7202/1730710227748/kelvin.jpg?format=1500w",
  },
  {
    name: "Kingsford Smith Ulm Reserve, Glenroy",
    description:
      "Kingsford Smith Ulm Reserve is a hillside park in Glenroy with a quality play space (including nature play elements like wooden owls and frogs), swings with a view, grassy picnic areas, tables and shelter, bike and walking trails, and ongoing works for a new dog park and car park. Suitable for families and a range of ages; notable for views over the heritage-listed Albion viaduct (rail bridge).",
    location: {
      name: "Kingsford Smith Ulm Reserve",
      formattedAddress: "81 Loongana Ave, Glenroy, Melbourne, Australia",
      street_address: "81 Loongana Ave",
      city: "Glenroy",
      country_code: "AU",
    },
    startDate: "2023-08-14T11:03:00+1000",
    tags: [
      "park",
      "playground",
      "family",
      "picnic",
      "nature play",
      "walking trails",
      "views",
    ],
    imageURL:
      "http://static1.squarespace.com/static/58813c79f7e0ab55271bb525/58ecb61820099e78e671de65/58fc357f6b8f5b0fe3aa1559/1692442640614/kingsford.jpg?format=1500w",
  },
  {
    name: "Lincoln Square Playground, Carlton",
    description:
      "A nature-focused playground set among existing 150-year-old Moreton Bay Fig trees, giving a fairy-garden feel. Features large climbing structures connected by a mesh tunnel, swings, metal standing chimes, speaker tubes, a small slide and a mega slide, a wobble bridge, wooden cubby, hollowed trunk tunnel, balance logs, BBQ area and many seating spots. Suitable for children and families; site was designed by the same team behind Royal Park Nature Play Space. Facilities: street parking, BBQ area, shade, public toilet, benches and seating.",
    location: {
      name: "Lincoln Square Playground",
      formattedAddress:
        "Cnr Lincoln Square & Bouverie St, Carlton, Melbourne, Australia",
      street_address: "Cnr Lincoln Square & Bouverie St",
      city: "Carlton",
      country_code: "AU",
    },
    startDate: "2023-06-21T14:03:00+1000",
    tags: ["park", "playground", "nature play", "family", "outdoors"],
    imageURL:
      "https://static1.squarespace.com/static/58813c79f7e0ab55271bb525/58ecb61820099e78e671de65/613d7c1eb6a38148d0a46b8b/1688362260559/lincoln+park%2C+carlton+-+mamma+knows+north+-+copyright-14.jpg?format=1500w",
  },
  {
    name: "Fortress Park, Doreen",
    description:
      "Fortress Park in Doreen is a large outdoor playground centred on a great wooden structure that complements the natural surroundings and trees. The playground includes a flying fox, swings, a climbing web, slides for all ages, a walking bridge, a fireman's pole and a rock climbing wall. There are bike tracks suitable for beginners, a basketball court, a tennis wall and exercise equipment. Grassy grounds with soccer goal posts are available. Notes: BBQ, free street parking, no toilets. Nearby option for food: Slices restaurant a short drive away.",
    location: {
      name: "Fortress Park",
      formattedAddress: "Fortress Rd, Doreen, Melbourne, Australia",
      street_address: "Fortress Rd",
      city: "Doreen",
      country_code: "AU",
    },
    startDate: "2018-08-06T12:27:30+10:00",
    tags: ["park", "playground", "family", "outdoors", "nature"],
    imageURL:
      "https://images.squarespace-cdn.com/content/v1/58813c79f7e0ab55271bb525/1532686235817-YWC0H24AKMCL5RP09ORF/fortress+park%2C+doreen-2.jpg",
  },
  {
    name: "JJ Holland Park, Kensington",
    description:
      "A bright climbing tower with speedy twisty slides stands as the main feature, but that’s only where the fun begins. Monkey bars, spinning nets, a rope-climbing pyramid, flying foxes, sandpit, in-floor trampolines, slides and swings (and a half court on the way) are all spread out with natural features like rocks and trees between play areas. The playground attracts big kids, parents and carers joining in the fun. There is ample seating, grassy spots, BBQs, picnic tables and toilets, making it great for family visits and birthday parties. Facilities noted: bench seats, limited car parking, toilets, BBQ area, plenty of grassy spaces, nearby soccer/football oval and South Kensington train station.",
    location: {
      name: "JJ Holland Park, Kensington",
      formattedAddress: "Altona St, Kensington, Melbourne, Australia",
      street_address: "Altona St",
      city: "Kensington",
      country_code: "AU",
    },
    startDate: "2021-06-29T19:14:48+10:00",
    tags: ["park", "playground", "family", "outdoors", "picnic"],
    imageURL:
      "http://static1.squarespace.com/static/58813c79f7e0ab55271bb525/58ecb61820099e78e671de65/60dae48825c1c4249c4cad45/1749677942148/jj+holland+park%2C+kensington+-+copyright+mamma+knows+melbourne+cover+3.jpg?format=1500w",
  },
  {
    name: "Livvi's Place Anzac Park Play Space, Craigieburn",
    description:
      "This playspace in Craigieburn has a huge range of equipment for a fun day out: merry-go-round, cubby house, talking tubes, four swings, rock-climbing moulds and ropes to reach a large mound, three slides, a tunnel, musical steps and other musical play elements, a ropes course and balancing beams for older kids. There is a sandpit with a digger and a water pump feeding a dry creek bed, plus a separate fenced splash park activated by buttons. The park offers benches, undercover seating and tables, two BBQs, large grassed areas, toilets and change-table facilities. Suitable for families with children of various ages.",
    location: {
      name: "Anzac Park / Livvi's Place",
      formattedAddress:
        "Central Park Avenue & Aitken Blvd, Craigieburn, Australia",
      street_address: "Central Park Avenue & Aitken Blvd",
      city: "Craigieburn",
      country_code: "AU",
    },
    tags: [
      "park",
      "playground",
      "water play",
      "family-friendly",
      "play equipment",
      "bbq",
    ],
    imageURL:
      "http://static1.squarespace.com/static/58813c79f7e0ab55271bb525/58ecb61820099e78e671de65/66286e2a6461f13016032076/1722244325453/livvis+place.jpg?format=1500w",
  },
  {
    name: "Galaxyland Playspace, Sunbury",
    description:
      "Galaxyland Playspace is a large upgraded playground with extensive play areas for all ages. Features include pathways for scooters, swings, a giant slide tower, seesaws, nest swings, climbing pyramids, in-ground trampolines, a basketball half court, a large lizard sculpture, nature play elements (rocks and wooden stumps), flying foxes and rock-climbing walls. Facilities include ample seating and picnic areas, two undercover BBQ areas, toilets with baby change, carpark, pram-friendly access, a water fountain and rubbish bins. The playground connects to the Jacksons Park circuit trail. Recommended for family visits; nearby The Ball Court Hotel is a local dining mention.",
    location: {
      name: "Galaxyland Playspace",
      formattedAddress:
        "Cnr Belleview Drive & Betula Terrace, Sunbury, VIC, Australia",
      street_address: "Cnr Belleview Drive & Betula Terrace",
      city: "Sunbury",
      state_province: "VIC",
      country_code: "AU",
    },
    startDate: "2024-02-28T13:18:25+11:00",
    tags: ["park", "playground", "family", "nature-play", "picnic", "scooters"],
    imageURL:
      "https://static1.squarespace.com/static/58813c79f7e0ab55271bb525/58ecb61820099e78e671de65/65de948402c219394fa5bcba/1709603723035/galaxy+land+excerpt.jpg?format=1500w",
  },
  {
    name: "H Swain Reserve, Preston",
    description:
      "This play space was a surprise for Mamma and her little one. It’s quiet, big and away from all the hustle. H Swain Reserve in Preston is a delight for any sort of play. The wooden structured playground includes a wave slide, tunnels, rock climbing wall, monkey bars and blackboard. There is a little shop front for role play and a train structure for train-obsessed children. Facilities include a half basketball court, sandpit, sit-on spinning carousel, large pyramid rope climbing frame, nest swing and an upside-down U-shaped seesaw. There are two unshaded tables and seats plus a good sized grassy area. Nearby eatery (Merri Clan) is a short walk and recommended. Nitty gritty: street parking, shade, BBQs, dog park, no toilets.",
    location: {
      name: "H Swain Reserve",
      formattedAddress: "Oakover Road, Preston VIC 3072, AU",
      street_address: "Oakover Road",
      city: "Preston",
      state_province: "VIC",
      postal_code: "3072",
      country_code: "AU",
    },
    startDate: "2018-12-15T20:05:27+1100",
    tags: ["park", "playground", "outdoor", "family"],
    imageURL:
      "http://static1.squarespace.com/static/58813c79f7e0ab55271bb525/58ecb61820099e78e671de65/5bbee9cdeef1a1350e60b0fc/1602461610765/h+swain+reserve+front.jpg?format=1500w",
  },
  {
    name: "Lynnwood Reserve, Templestowe Lower",
    description:
      "It’s so cute! A little playground for a pitstop and a run around. Lynnwood Reserve in Templestowe Lower has had a refresh and it is pretty perfect - especially for the kinder kids. Here you will find a double play structure with slides, climbing walls and ladders. Little carved buddies are dotted around the zones too. There’s a community swing circle (believed to be the first in Manningham). There’s a decorative snake feature and a bird nest swing, plus an older boat lookout feature. Mamma's special mention: Coffee hit before exploring the playgrounds? Drop in to Salted Caramel for your takeaway fix. The nitty gritty: water fountain - no toilets - walking trail nearby.",
    location: {
      name: "Lynnwood Reserve",
      formattedAddress: "44 Lynnwood Parade, Templestowe Lower VIC 3107, AU",
      street_address: "44 Lynnwood Parade",
      city: "Templestowe Lower",
      state_province: "VIC",
      postal_code: "3107",
      country_code: "AU",
    },
    startDate: "2020-06-21T08:32:46+1000",
    tags: [
      "park",
      "playground",
      "family-friendly",
      "outdoors",
      "walking trails",
    ],
    imageURL:
      "http://static1.squarespace.com/static/58813c79f7e0ab55271bb525/58ecb61820099e78e671de65/5eee8d330a6da31edac0723c/1602460764695/Lynnwood+Reserve+-+Mamma+Knows+East+%2810+of+11%29.jpg?format=1500w",
  },
  {
    name: "Malahang Reserve, Heidelberg West",
    description:
      "This all-abilities, all-ages playground is huge with slides, swings, a flying fox, pyramid climbing frame, tunnels, spinning cups and standing spinners. There is a toddler play space with smaller versions of the main equipment, plus a sailing boat structure and spinning wheel for imaginary play. The reserve also includes a basketball court, a skate park and BMX jumps. Play spaces are visible to parents, making the park more enjoyable. Nearby cafe Sweet By Nature is recommended for a treat before or after play.",
    location: {
      name: "Malahang Reserve, Heidelberg West",
      formattedAddress: "Oriel Rd, Heidelberg West, Melbourne, Australia",
      street_address: "Oriel Rd",
      city: "Heidelberg West",
      country_code: "AU",
    },
    startDate: "2018-12-12T09:56:14+1100",
    tags: [
      "park",
      "playground",
      "family-friendly",
      "skatepark",
      "bmx",
      "toddlers",
    ],
    imageURL:
      "http://static1.squarespace.com/static/58813c79f7e0ab55271bb525/58ecb61820099e78e671de65/5c103b894ae237f9d612cc86/1602461670882/malang+reserve+front.jpg?format=1500w",
  },
  {
    name: "Hilltop Playground and Splash Park, Doreen",
    description:
      "Hilltop Playground is a new gem that caters for all ages with slides, swings, climbing frames, a trampoline and nature play elements such as logs, boulders and a stick teepee. The water play area already has interactive features and will include a splash pad with jets, misters and water channels. There’s plenty of parking, undercover picnic tables and BBQs, plus well kept grounds making it a great spot for a family day out. Mamma's Special Mention: Turners Bakehouse in nearby Mernda is recommended for brunch.",
    location: {
      name: "Hilltop Playground",
      formattedAddress: "20 Landano Way, Doreen, Australia",
      street_address: "20 Landano Way",
      city: "Doreen",
      country_code: "AU",
    },
    startDate: "2025-09-17T11:34:31+10:00",
    tags: ["park", "playground", "splash pad", "water play", "family"],
    imageURL:
      "https://images.squarespace-cdn.com/content/v1/58813c79f7e0ab55271bb525/1758073735801-QOPQ0P5SJQHDKP4HSTAK/Hilltop+Playground+and+Splash+Park%2C+Doreen%2C+Copyright+Mamma+Knows+North-11.jpg?format=500w",
  },
  {
    name: "lehmann's farm park, epping",
    description:
      "This has to be one of the most unique play spaces we have been to. Set on the site of an old dairy farm, the playground’s elements are all relevant to its dairy theme. There are cheese-shaped sculptures, a milk barrel slide, a veggie patch, a farmer and working dog statue, a windmill, cow bell, milk urn instruments and lots of other little tidbits to discover. There are fact sheets around the place about the original farm and the family who owned it in the 1920s. The playground’s bush setting is fun to explore with smooth paths for scooters and bikes, a bridge overlooking Edgar’s Creek, picnic tables (covered and uncovered) and many natural elements to play in. The equipment suits little ones particularly well, though older kids will enjoy discovering the hidden treasures scattered around the site. Mamma’s special mention: For another unique playground nearby, check out Aurora Adventure Park! Facilities/notes: street parking, pram friendly, nature play, drinking fountain, exercise equipment, picnic tables (covered).",
    location: {
      name: "Lehmann's Farm Park",
      formattedAddress: "19W Amareth Cct, Epping, VIC, Australia",
      street_address: "19W Amareth Cct",
      city: "Epping",
      state_province: "VIC",
      country_code: "AU",
    },
    startDate: "2020-10-25T15:27:22+1100",
    tags: ["park", "playground", "nature play", "picnic", "family"],
    imageURL:
      "http://static1.squarespace.com/static/58813c79f7e0ab55271bb525/58ecb61820099e78e671de65/5f94feaa586eae39613713a9/1604119094915/excerpt+lehmann%27s+farm.jpg?format=1500w",
  },
  {
    name: "Lyndarum North Community Park, Wollert",
    description:
      "WOW - is pretty much all you will say when you get your first look at this fresh, new Northside playground! The epic triple tower, complete with two winding slides, sits in the middle of a huge circuit set on colourful, padded soft fall. There are additional slides, tunnels, a pipe xylophone, in-ground trampolines, rock climbing and pulley sections and nature play elements. Some lower-to-the-ground areas suit smaller children while the climbing towers are designed for older kids. Around the tower are several swings, a metal spinner, a table tennis table, an undercover picnic table area and a separate basketball half court. This is a bright and engaging spot for a picnic and a play during the school holidays. Mamma’s special mention: this area has several cool playgrounds close by—include Aurora Adventure Park, Aurora Tree Tops Park and the Playspace at Craigieburn Rd on a whistle-stop tour.",
    location: {
      name: "Lyndarum North Community Park",
      formattedAddress: "Cnr Edgars & Kendon Drive, Wollert",
      street_address: "Cnr Edgars & Kendon Drive",
      city: "Wollert",
      state_province: "VIC",
      postal_code: "3750",
      country_code: "AU",
    },
    startDate: "2020-12-04T17:03:24+11:00",
    tags: ["park", "playground", "family", "outdoors", "picnic", "greenspace"],
    imageURL:
      "http://static1.squarespace.com/static/58813c79f7e0ab55271bb525/58ecb61820099e78e671de65/5fc9d12cee6dcf7e36338227/1609803725900/excerpt+lyndarum+north.jpg?format=1500w",
  },
  {
    name: "Heathcote Play Space at Barrack Reserve, Heathcote",
    description:
      "Winery-themed, fully fenced play space with giant grapes to climb, wine-barrel water play and balancing steps, vine prints and a central giant wine barrel with slides and climbing frames. Features include a flying fox, trampoline, self-spinning merry-go-round, seesaws, swinging hammock and a play “Heathcote Market” with a cash register and scales. BBQs available outside the fenced area, several eating options and a cellar door nearby, and public toilets a short walk away.",
    location: {
      name: "Heathcote Play Space",
      formattedAddress: "126 High St, Heathcote",
      street_address: "126 High St",
      city: "Heathcote",
      country_code: "AU",
    },
    startDate: "2024-09-23T17:09:30+10:00",
    tags: ["park", "playground", "winery", "vineyard", "family"],
    imageURL:
      "http://static1.squarespace.com/static/58813c79f7e0ab55271bb525/58ecb61820099e78e671de65/66f10c575328181fff8d5cae/1727233421732/heathcote%2Bplay%2Bspace%2B-9.jpg?format=1500w",
  },
  {
    name: "Kyneton Community Park and Water Play, Kyneton",
    description:
      "Located within Kyneton Botanic Gardens, this leafy park is ideal for picnics, family gatherings and casual play. Facilities include barbecues, covered and uncovered benches and tables, public toilets and plenty of shady spots. Play equipment is varied and distinctive: several sandpits (one with a wooden maze), colourful tractors, climbing frames, three rocket towers, a giant swing, balancing logs, cubbies and a table tennis table. The highlight is an extensive water play splash pad (seasonal), making it especially good on hot days. The park is family-friendly, not usually overcrowded, and offers lots of on-street parking in surrounding streets. Notes: splash pad operates seasonally (stated as December 1 – March 9, 9:30am–8pm on the page). Nearby family-friendly venues mentioned include Ruby Cafe, Squishy Minnie bookstore and Major Tom’s restaurant.",
    location: {
      name: "Kyneton Botanic Gardens",
      formattedAddress:
        "Kyneton Botanic Gardens, Mollison Street, Kyneton, Australia",
      street_address: "Mollison Street",
      city: "Kyneton",
      country_code: "AU",
    },
    tags: [
      "park",
      "playground",
      "water play",
      "family",
      "picnic",
      "nature play",
    ],
    imageURL:
      "http://static1.squarespace.com/static/58813c79f7e0ab55271bb525/58ecb61820099e78e671de65/5e0863ea31a7876caf54fa23/1733195002698/kyneton+community+park+excerpt.jpg?format=1500w",
  },
  {
    name: "John McMahon Reserve, Sunbury",
    description:
      "This upgraded playground has something to offer everyone: rope climbing towers, big and little slides, nature play, a scooter run, flying foxes (including an adult/access seat), several swings, outdoor gym equipment and in-ground trampolines. There are undercover picnic tables, a drinking fountain and a barbecue. The site is partially fenced. Suitable for toddlers through older kids; pram friendly with toilets nearby. Mamma’s note: Sunbury has many great playgrounds — consider also Galaxyland Play Space or Toms Park.",
    location: {
      name: "John McMahon Reserve",
      formattedAddress:
        "John McMahon Reserve, Lancefield Road, Sunbury, Australia",
      street_address: "Lancefield Road",
      city: "Sunbury",
      country_code: "AU",
    },
    startDate: "2020-06-26T15:20:29+10:00",
    tags: [
      "park",
      "playground",
      "family",
      "nature play",
      "scooter track",
      "flying fox",
      "trampolines",
      "picnic",
    ],
    imageURL:
      "http://static1.squarespace.com/static/58813c79f7e0ab55271bb525/58ecb61820099e78e671de65/5ef5859de2d6737ff9e2a8d7/1640431451743/excerpt+john+mcmahon+reserve.jpg?format=1500w",
  },
  {
    name: "Foundation Park, Mickleham",
    description:
      "Have you ever seen a piece of play equipment like the centrepiece at this park? You’ll spot this unique tumble slide structure from a mile off and have lots of fun climbing and rolling down once you arrive! There are also in-ground trampolines, a bridge tower with slides, swings, a smaller toddler area, nature play including Australian animal sculptures, a full basketball court, picnic tables covered and uncovered (including a kids-sized table set) and toilets. Mamma’s special mention: a coffee cart is sometimes parked across the road on weekends. The nitty gritty: toilets, picnic tables, pram accessible, basketball court. Cnr Balmain & St Georges Blvd, Mickleham.",
    location: {
      name: "Foundation Park",
      formattedAddress:
        "Cnr Balmain & St Georges Blvd, Mickleham, Melbourne, Australia",
      street_address: "Cnr Balmain & St Georges Blvd",
      city: "Mickleham",
      country_code: "AU",
    },
    startDate: "2021-03-08T19:50:38+11:00",
    tags: [
      "park",
      "playground",
      "nature play",
      "family",
      "picnic",
      "trampoline",
      "basketball",
      "accessible",
    ],
    imageURL:
      "https://static1.squarespace.com/static/58813c79f7e0ab55271bb525/58ecb61820099e78e671de65/6045e55e1bee6050c1e50efc/1622280479540/foundation+park+mickleham.jpg?format=1500w",
  },
  {
    name: "Kalparrin Gardens, Greensborough",
    description:
      "Kalparrin Gardens is a leafy park featuring a lake with ducks and geese, walking tracks and a fully fenced playground suitable for families. Facilities include toilets and pram-friendly paths, picnic spots, nearby skatepark and BMX jumps, and easy on-street parking plus a small carpark at the corner of Pinehills Dr & Kempston St. Note: the lake is a stormwater harvesting wetland attracting birdlife — do not feed birds human food. Close to Greensborough Plaza; nearby cafe recommendation: Espresso 3094 in Montmorency.",
    location: {
      name: "Kalparrin Gardens",
      formattedAddress:
        "Cnr Kempston St and Pinehills Dr, Greensborough, Australia",
      street_address: "Cnr Kempston St and Pinehills Dr",
      city: "Greensborough",
      country_code: "AU",
    },
    startDate: "2020-06-14T16:12:48+1000",
    tags: [
      "park",
      "playground",
      "family",
      "picnic",
      "walking",
      "skatepark",
      "bmx",
      "birdwatching",
    ],
    imageURL:
      "http://static1.squarespace.com/static/58813c79f7e0ab55271bb525/58ecb61820099e78e671de65/5ee5bfdfdd4fcc494805d0ea/1602460855732/excerpt+kalparrin+gardens+greensborough.jpg?format=1500w",
  },
  {
    name: "Eltham Lower Park Playground, Eltham",
    description:
      "A fresh addition to Eltham Lower Park, this upgraded playspace is a great option for an easy park pit stop or for a party or family BBQ. There are multiple picnic tables, covered rotundas and several BBQs, making it family friendly and ideal for gatherings. The playground suits both little ones and bigger kids; the main climbing structure is more challenging (better suited to ages 5+), with plenty of options for younger children. The park sits next to the Diamond Valley Railway (great on Sundays when the ice cream truck is often present). Directly across the road is an oval for ball games. Nearby Copper Butterfly Playspace is a short walk away. Facilities noted: drinking fountains, undercover seating, BBQ facilities and off-street parking.",
    location: {
      name: "Eltham Lower Park",
      formattedAddress: "Hohnes Rd, Eltham VIC, Australia",
      street_address: "Hohnes Rd",
      city: "Eltham",
      state_province: "VIC",
      country_code: "AU",
    },
    startDate: "2025-08-08T11:05:47+10:00",
    tags: ["park", "playground", "family", "picnic", "bbq", "outdoors"],
    imageURL:
      "https://static1.squarespace.com/static/58813c79f7e0ab55271bb525/58ecb61820099e78e671de65/68954d6b648bef3170772a35/1757122246876/Copyright%2BMamma%2BKnows%2BNorth%2B-%2BLower%2BEltham%2BPark-4621.jpg?format=1500w",
  },
  {
    name: "Lavender Rain Park, Donnybrook",
    description:
      "Funky new playground featuring a 4-level enclosed play tower with a giant slide (best for older kids), plus a small slide and swings for younger children. Other facilities include a basketball court and hit-up wall. The park includes lavender-themed touches (bee statues, purple accents). Amenities listed: drinking fountain, undercover seating, rubbish bins and street parking. Nearby: Shared Cup Cafe a short walk away.",
    location: {
      name: "Lavender Rain Park",
      formattedAddress: "90 English St, Donnybrook, Australia",
      street_address: "90 English St",
      city: "Donnybrook",
      country_code: "AU",
    },
    startDate: "2025-06-12T14:29:47+10:00",
    tags: [
      "park",
      "playground",
      "play-tower",
      "family",
      "outdoors",
      "basketball",
    ],
    imageURL:
      "https://static1.squarespace.com/static/58813c79f7e0ab55271bb525/684a57ba29e7691134dc1fdf/684a646e6451373f512dad8e/1752919372015/Lavender+Rain+Park+Donnybrook+Copyright+Mamma+Knows+North-2.jpg?format=1500w",
  },
  {
    name: "Community Bank Adventure Playground, Wallan",
    description:
      "If your little one loves a good park, this playground has it all. The eye-catching treehouse tower has three slides accessed by varying levels of climbing routes plus cubby spaces, sand play, rock climbing, a 25m flying fox and a family-size seesaw, interactive tractor play, swings and a spinning carousel. A water splash park beside the playground includes water play tables with pumps, water channels, a three-ring water tunnel with squirting jets, a tipping bucket and a padded 'creek' area for little feet. The site also offers sheltered grassy areas, scattered tables, shaded BBQ, water taps and toilets with a change room. Mamma notes it’s great year-round but plan for a full day in summer; pack towels and togs. Nearby bakery: Pretty Sally. Facilities: BBQ facilities, large shelters, picnic tables, public toilet, free parking, pram and wheelchair accessible. Water feature operates December–March, 10:00–18:00 (smaller pumps may run outside these months).",
    location: {
      name: "Community Bank Adventure Playground (Hadfield Water Park)",
      formattedAddress: "66-80 High St, Wallan VIC 3756, Australia",
      street_address: "66-80 High St",
      city: "Wallan",
      state_province: "VIC",
      postal_code: "3756",
      country_code: "AU",
    },
    startDate: "2022-12-27T18:09:31+11:00",
    tags: ["park", "playground", "water play", "family-friendly", "accessible"],
    imageURL:
      "http://static1.squarespace.com/static/58813c79f7e0ab55271bb525/58ecb61820099e78e671de65/58c1f445d1758ed40671ccb9/1733195106777/01+Copyright+Mamma+Knows+North+-+community+bank+adventure+playground%2C+wallan+2022-2.jpg?format=1500w",
  },
  {
    name: "Hudson Park, Kilmore",
    description:
      "Mamma visits Hudson Park in Kilmore — a family-friendly country park with a fully enclosed playground featuring a basket swing, stepping stones, slides, climbing net, sand play and a pebble stream. Facilities include walking tracks, exercise equipment, skate ramps, park benches, picnic tables, pram access, public toilets, lots of shade and BBQs. Surrounded by greenery. Nearby eatery: Kilmore Bakery and Cafe (recommended).",
    location: {
      name: "Hudson Park",
      formattedAddress: "10 Sydney St, Kilmore, Australia",
      street_address: "10 Sydney St",
      city: "Kilmore",
      country_code: "AU",
    },
    startDate: "2024-01-08T06:56:51+11:00",
    tags: ["park", "playground", "family", "outdoor"],
    imageURL:
      "http://static1.squarespace.com/static/58813c79f7e0ab55271bb525/58ecb61820099e78e671de65/5a9e75c724a6940b3d527ae1/1704660279534/hudson+park%2C+kilmore-+mamma+knows+north+-+copyright-18.jpg?format=1500w",
  },
  {
    name: "McCubbin Drive Playground, Taylors Lakes",
    description:
      "A family-friendly park in Taylors Lakes featuring a large BBQ area with stone benchtops, seating and tables, a bocce court and a soccer field. Play equipment includes a large slide over a tunnel structure with climbing footholds, swings, climbing ropes and tunnels. Plenty of green space for ball games, some shade, park benches and limited parking nearby. No toilets on site. Recommended for families and children; planting and paths create pleasant picnic areas.",
    location: {
      name: "McCubbin Drive Playground",
      formattedAddress:
        "18—24 Robertsons Road & 16a Robertsons Road, Taylors Lakes, Australia",
      street_address: "18—24 Robertsons Road & 16a Robertsons Road",
      city: "Taylors Lakes",
      country_code: "AU",
    },
    startDate: "2022-11-21T15:34:20+1100",
    tags: [
      "park",
      "playground",
      "bbq",
      "bocce",
      "family",
      "outdoor",
      "play-equipment",
    ],
    imageURL:
      "https://images.squarespace-cdn.com/content/v1/58813c79f7e0ab55271bb525/c4911c4d-2432-475e-9254-2dd9ff33807b/Taylors+Lakes+-++Messra+Park-140228.jpg",
  },
  {
    name: "Green Gully Reserve, Keilor Downs",
    description:
      "Spacious reserve with a well-equipped playground and nature-play elements. Facilities include toilets, a large undercover picnic area with barbecue, plenty of parking and nearby off‑lead dog area. Playground features a tower, tunnel, balancing/climbing posts, two slides, swings and fitness stations; there are native bird sculptures and garden beds. Free entry. (Mamma recommends also visiting nearby Brimbank Park.)",
    location: {
      name: "Green Gully Reserve",
      formattedAddress: "151C Green Gully Rd, Keilor Downs VIC 3038, AU",
      street_address: "151C Green Gully Rd",
      city: "Keilor Downs",
      state_province: "VIC",
      postal_code: "3038",
      country_code: "AU",
    },
    startDate: "2019-07-08T10:29:43+10:00",
    tags: ["park", "playground", "nature play", "picnic", "family"],
    imageURL:
      "http://static1.squarespace.com/static/58813c79f7e0ab55271bb525/58ecb61820099e78e671de65/5d217734e56ef70001e631b9/1602461264455/green+gully+exerpt.jpg?format=1500w",
  },
  {
    name: "Main Street Recreation Reserve playground, Thomastown",
    description:
      "Mamma loves this large play space with a giant climbing web and a massive slide plus three other slides (including a double slide and a fort with shop front, telescope and fireman's pole). Equipment includes swings (one all-abilities seat), a nest swing, four-person seesaw, mini trampoline, spinner disk, wobble bridge and a double flying fox with both an all-abilities seat and a disc seat. Natural elements include giant rocks and tree stumps and a golden sun moth sundial. Paths run throughout for pram access and it is accessible from the Edgars Creek walking/biking trail or from Gardenia Rd by car. Facilities nearby: two sheltered tables with seating, a drinking fountain, a BBQ and public toilets a short walk across the oval.",
    location: {
      name: "Main Street Recreation Reserve Playground",
      formattedAddress: "74 Main St, Thomastown",
      street_address: "74 Main St",
      city: "Thomastown",
      country_code: "AU",
    },
    startDate: "2025-01-16T18:05:19+11:00",
    tags: ["park", "playground", "family", "accessible", "outdoor"],
    imageURL:
      "http://static1.squarespace.com/static/58813c79f7e0ab55271bb525/58ecb61820099e78e671de65/67883243b5037a28257b7735/1737196748091/20250116_190857.jpg?format=1500w",
  },
  {
    name: "galaxyland play space, sunbury",
    description:
      "You’ll be in another world when you launch into Galaxyland Playspace! This upgraded playground boasts vast play areas for all ages, pathways for scooters, swings, a giant slide tower, see-saws, nest swings, climbing pyramids, in-ground trampolines, a basketball half court, a giant lizard, plenty of nature play with rocks and wooden stumps, flying foxes and rock climbing walls. There is ample seating for resting and picnicking and two undercover BBQ areas. The Jacksons Park circuit trail connects to the playground for a stroll, scoot or ride. Mamma’s tip: if you’re on a Sunbury playground hop, stop off at Tom’s Park as well. Nitty gritty: toilet & baby change, carpark, pram friendly, 448 bus stop, undercover seating & BBQs, water fountain, rubbish bins.",
    location: {
      name: "Galaxy Land Jackson Park",
      formattedAddress:
        "Cnr Belleview Drive & Betula Terrace, Sunbury, Australia",
      street_address: "Cnr Belleview Drive & Betula Terrace",
      city: "Sunbury",
      country_code: "AU",
    },
    startDate: "2020-06-09T15:14:15+10:00",
    tags: [
      "park",
      "playground",
      "family",
      "outdoor",
      "nature-play",
      "adventure",
    ],
    imageURL:
      "http://static1.squarespace.com/static/58813c79f7e0ab55271bb525/58ecb61820099e78e671de65/5edf1aa61040b27751c15eb8/1602460874165/galaxy+land+excerpt.jpg?format=1500w",
  },
  {
    name: "Fitzroy Adventure Playground, Fitzroy",
    description:
      "Fitzroy Adventure Playground (locally known as Cubbies) offers a supervised community playspace for inner-city children. Features include slides, cubbies, a veggie patch, ball-play area and activity programs run by Save the Children Australia. The site has 25 solar panels (7.6kW peak). During opening hours the playground is supervised by three staff (male and female). Note: this is a community playground only open five days a week; all families must be registered and children under 5 must be with an adult. Opening example times reported: Monday, Tuesday, Thursday and Friday 3:30PM–5:30PM; Saturday 12:30PM–5:30PM. For more info see the Cubbies site linked on the page.",
    location: {
      name: "Fitzroy Adventure Playground (Cubbies)",
      formattedAddress:
        "Cnr Condell and Young St, Fitzroy North, VIC, Australia",
      street_address: "Cnr Condell and Young St",
      city: "Fitzroy North",
      state_province: "VIC",
      country_code: "AU",
    },
    tags: ["park", "playground", "community", "family", "outdoor"],
    imageURL:
      "https://static1.squarespace.com/static/58813c79f7e0ab55271bb525/58ecb61820099e78e671de65/593b776e1b631b4d311d59e7/1602462592622/fitzroy+front.jpg?format=1500w",
  },
  {
    name: "Link Reserve, Kingsbury",
    description:
      "Link Reserve is a recently refurbished all-ages street park located across from Red Door Cafe. Features include a wooden climbing structure with stairs and rope climb, a nest swing, sandpit, table tennis (pink pong) table, sound play, painted cockatoos, open green space and pram access. Suitable for all ages and abilities. Notes: pram access, parking, water tap, pet friendly, limited shelter. Mamma's tip: pop into Red Door Cafe across the road.",
    location: {
      name: "Link Reserve",
      formattedAddress: "Link Street, Kingsbury VIC 3083, AU",
      street_address: "Link Street",
      city: "Kingsbury",
      state_province: "VIC",
      postal_code: "3083",
      country_code: "AU",
    },
    tags: ["park", "playground", "family-friendly", "all-ages", "accessible"],
    imageURL:
      "http://static1.squarespace.com/static/58813c79f7e0ab55271bb525/58ecb61820099e78e671de65/59db5a3d59cc6866434d949c/1602462439568/link+front.jpg?format=1500w",
  },
  {
    name: "Gardiner Reserve, North Melbourne",
    description:
      "Mamma says this park is super cute even though it has lots of spiders — playful, sculptural ones. Gardiner Reserve received a major makeover with new play equipment designed for 2–12 year olds and a large park expansion. There is lots of greenery, native planting, space to run and picnic, and predominantly wooden play equipment giving an organic feel. Play features include rope 'spidey' legs, climbing webs, swings, a sand pit and a small cubby house. Mamma's special mention: the park is located opposite North Melbourne Pool. The nitty gritty: good shade; no toilets; barbeque; benches; street parking; open green space.",
    location: {
      name: "Gardiner Reserve",
      formattedAddress: "287-315 Dryburgh St, North Melbourne VIC 3051, AU",
      street_address: "287-315 Dryburgh St",
      city: "North Melbourne",
      state_province: "VIC",
      postal_code: "3051",
      country_code: "AU",
    },
    startDate: "2019-04-12T11:49:19+10:00",
    tags: ["park", "playground", "family"],
    imageURL:
      "https://images.squarespace-cdn.com/content/v1/58813c79f7e0ab55271bb525/1555033059642-EGACGUEFZW0Z682B1JK6/Gardiner+Reserve+North+Melbourne+-+Mamma+Knows+North+%2816+of+17%29.jpg",
  },
  {
    name: "ge robinson park, preston",
    description:
      "This playspace takes Mamma back to when she was a little girl. The equipment has everything kids need — swings, slides, climbing equipment and an egg-shaped cubby. Little ones enjoy playing house together. The park includes a large grassed area for picnics, cricket or relaxing under trees. Mamma recommends a short walk to Hi Henry for fresh fruit smoothies. The nitty gritty: pram access - climb - easy parking - trees - pet friendly - seating - limited shade.",
    location: {
      name: "G E Robinson Park",
      formattedAddress:
        "Cnr Garden Street & High Street, Reservoir VIC 3073, AU",
      street_address: "Cnr Garden Street & High Street",
      city: "Reservoir",
      state_province: "VIC",
      postal_code: "3073",
      country_code: "AU",
    },
    startDate: "2017-10-23T15:24:22+11:00",
    tags: ["park", "playground", "family", "outdoors", "picnic"],
    imageURL:
      "http://static1.squarespace.com/static/58813c79f7e0ab55271bb525/58ecb61820099e78e671de65/59ed6dc9fe54ef255de04868/1602462416764/ge+front.jpg?format=1500w",
  },
  {
    name: "Long Gully Splash Park, Long Gully",
    description:
      "Splash parks are a small, interactive water play area with a Gold Rush theme. Treated water is solar heated and most sprays run on touch-pad 4-minute timers; some ground sprays are permanently on. Interactive elements include a mist tunnel, above-head buckets, swivelling horse-head sprays, a tall water tank and many smaller spouts. There is a separate dry playground area with slide and climbing structures and a basketball half court. Mamma’s note: nearby Eaglehawk Play Space and the Discovery Science & Technology Centre are worth visiting. Facilities: spacious toilets with change tables; separate dry playground; shade sails; several covered picnic tables; BBQs; basketball half court; partially fenced; onsite car park; pram accessible. Address shown on page: 21 Cunneen Street, Long Gully.",
    location: {
      name: "Long Gully Splash Park",
      formattedAddress: "21 Cunneen Street, Long Gully, Australia",
      street_address: "21 Cunneen Street",
      city: "Long Gully",
      country_code: "AU",
    },
    startDate: "2021-01-09T16:23:11+11:00",
    tags: [
      "park",
      "playground",
      "splash park",
      "water play",
      "family",
      "picnic",
      "bbq",
    ],
    imageURL:
      "https://static1.squarespace.com/static/58813c79f7e0ab55271bb525/58ecb61820099e78e671de65/5ff93dbfffea7f059fa088c5/1733195205972/long+gully+splash+park+excerpt.jpg?format=1500w",
  },
  {
    name: "Jacobs Reserve, Brunswick West",
    description:
      "Upgraded playground alert! This leafy, serene reserve has a new timber playground complementing lush green surrounds. Great for picnics with benches and shade. Features nature-play elements including a large sandpit, rocks and logs, a swing set, small slippery dip, small seesaw, netted climbing frames, a flying fox, monkey bars and a larger seesaw structure. Mamma's special mention: Lady Melville’s Cafe is just a hop, skip and a jump away. Nitty gritty: sandpit, nature play, drinking taps, street parking, plenty of room for picnics, shade, park benches, dogs on lead only.",
    location: {
      name: "Jacobs Reserve",
      formattedAddress:
        "180E Melville Road, Brunswick West VIC 3055, Australia",
      street_address: "180E Melville Road",
      city: "Brunswick West",
      state_province: "VIC",
      postal_code: "3055",
      country_code: "AU",
    },
    startDate: "2019-07-30T14:38:39+10:00",
    tags: ["park", "playground", "nature play", "family", "picnic"],
    imageURL:
      "http://static1.squarespace.com/static/58813c79f7e0ab55271bb525/58ecb61820099e78e671de65/5d3fb73e9c62f000010b792e/1602461223597/Jacobs+Reserve+brunswick+west+mknjacobs+Reserve+mkn.jpg?format=1500w",
  },
  {
    name: "Howitt Park Playground, Bright",
    description:
      "Playgrounds don’t get much more stunning than this. This largely timber adventure playground sits on the banks of the Ovens River and is surrounded by grand old trees. The playground has slides, bridges, swings and plenty of nooks and crannies to keep children entertained and can hold lots of kids without feeling busy. It sits within Centenary Park with bench seating and picnic tables dotted around; wander over the bridge and explore the wider park. There is a splash park for cooling off in summer and an older slide that goes down toward the river. Facilities noted: toilets, BBQs and river nearby. Mamma’s tip: Bright Brewery overlooks the playground for a bite and a brew.",
    location: {
      name: "Centenary Park",
      formattedAddress: "Riverside Avenue, Bright, Australia",
      street_address: "Riverside Avenue",
      city: "Bright",
      country_code: "AU",
    },
    startDate: "2021-05-31T13:17:05+1000",
    tags: [
      "park",
      "playground",
      "adventure",
      "splash park",
      "family",
      "picnic",
    ],
    imageURL:
      "https://static1.squarespace.com/static/58813c79f7e0ab55271bb525/58ecb61820099e78e671de65/60aaf5e5028eea0f43c90587/1745318202110/Centenary+Park+Bright++2021+Copyright+Mamma+Knows+Melbourne+%2837+of+37%29.jpg?format=1500w",
  },
  {
    name: "Jones Park, Brunswick East",
    description:
      "City parks and open spaces are rare in Melbourne’s inner north but when you find them they are something to shout about and share. Jones Reserve in Brunswick East ticks every box for nature, city and adventure. The playground is packed with fun - a slide, swings and rock climbing wall; there is a sandpit with diggers and musical mushrooms. Jones Reserve also has a basketball ring, frog swamp, oval and a giant hill perfect for tumbling down. There are sheltered picnic tables and gas BBQs overlooking the playground making this perfect for weekend picnics or weekday catch ups. Bring the dog and your bike and make the most of the tracks too. It’s also a great spot for city views and to catch special event fireworks. The nitty gritty: 9-23 Albion Street, Brunswick East — street parking, shade, BBQs, dog park, toilets. Mamma's special mention: Ceres Environmental Park is only a 5 minute walk away.",
    location: {
      name: "Jones Park / Jones Reserve",
      formattedAddress:
        "9-23 Albion Street, Brunswick East, Melbourne, Australia",
      street_address: "9-23 Albion Street",
      city: "Brunswick East",
      country_code: "AU",
    },
    startDate: "2024-09-29T20:14:00+10:00",
    tags: [
      "park",
      "playground",
      "family",
      "outdoors",
      "picnic",
      "dog-friendly",
    ],
    imageURL:
      "https://images.squarespace-cdn.com/content/v1/58813c79f7e0ab55271bb525/1727569855653-4E74O91MO6L0ZMVGST0S/jones+park%2C+east+brunswick+-+mamma+knows+melbourne+-+copyright-13.jpg",
  },
  {
    name: "Ford Park, Bellfield (Ivanhoe)",
    description:
      "This park is filled with fun for all. There are slides for some slippery action and spider webs and ropes to climb, turrets to tower over the land, stepping logs and did we mention the sandpit!? Mamma loves the musical instruments and rocks dotted around the park giving little explorers a little surprise every now and then and for those who prefer a ball game, there is also an oval nearby. Bring the push bike and check out the little bike ramps and scooter trails made especially for the little ones. It’s small and perfect! This would have to be Mamma’s first look at an expression swing in the north. And the verdict - AMAZING! Such a delight seeing your little one smile as you both swing together. Ford Park also includes BBQs and shelter making this place perfect for your next family gathering. Mamma's special mention: The Train Yard is a 6 minute drive away and serve up some delicious food. The kids menu is on point and the staff always have a smile. Worth a visit! The nitty gritty: good shade - toilets - barbeque - benches - street parking - open green space.",
    location: {
      name: "Ford Park",
      formattedAddress:
        "247A Banksia St, Bellfield/Ivanhoe, Melbourne, Australia",
      street_address: "247A Banksia St",
      city: "Bellfield/Ivanhoe",
      country_code: "AU",
    },
    startDate: "2019-04-23T10:04:17+10:00",
    tags: ["park", "playground", "family", "outdoors", "bbq"],
    imageURL:
      "http://static1.squarespace.com/static/58813c79f7e0ab55271bb525/58ecb61820099e78e671de65/5cbe51589b747a71ce1f16da/1602461405510/ford+park+front.jpg?format=1500w",
  },
  {
    name: "Macleod Village Playground, Macleod",
    description:
      "Freshly upgraded playground opposite the Macleod Village shopping strip. Repurposed train structure beside the fenced train line, Village Book Exchange mini library, lots of green space for picnics, and social distancing circles. Features include two climbing structures with slides (one smaller), flower spinner, several swings, nature play elements (dry creek bed, mini bridge, stepping stones, balance logs), musical elements (bongo drums, metal flowers) and an internet‑connected Yalp Memo interactive play station (eight bollards, 56 games; best suited to ages 4+). Amenities: picnic tables with cover, BBQ, public toilets directly across the road near tennis courts, shade sails, street parking and close to public transport. Tip: great coffee and babycinos across the road at Touchstone Cafe.",
    location: {
      name: "Macleod Village Playground",
      formattedAddress: "Cnr Erskine & Aberdeen Rds, Macleod, VIC, Australia",
      street_address: "Cnr Erskine & Aberdeen Rds",
      city: "Macleod",
      state_province: "VIC",
      country_code: "AU",
    },
    startDate: "2020-11-07T13:51:19+1100",
    tags: [
      "park",
      "playground",
      "family",
      "nature-play",
      "interactive-play",
      "picnic",
    ],
    imageURL:
      "https://static1.squarespace.com/static/58813c79f7e0ab55271bb525/58ecb61820099e78e671de65/5fa60ba7ef83d42c479287c5/1613272377201/macleod+village+green+playground+excerpt.jpg?format=1500w",
  },
  {
    name: "KidsTown Adventure Playground, Shepparton",
    description:
      "Large adventure playground offering extensive wooden structures, bridges, treehouses, cubby houses and themed features. Described as possibly the biggest adventure playground in Australia, highlights include a cow-themed maze, large slides, a giant nest swing, obstacle courses, diggers and sandpits, swings, a disc golf course and a small onsite café with picnic area. Suitable for a wide range of ages with dedicated toddler and teen play areas. Note: the small onsite train is currently out of action. Gold coin donation suggested for entry. Check the venue's events page for holiday activities.",
    location: {
      name: "KidsTown Adventure Playground",
      formattedAddress: "7287 Midland Highway, Mooroopna VIC 3630, AU",
      street_address: "7287 Midland Highway",
      city: "Mooroopna",
      state_province: "VIC",
      postal_code: "3630",
      country_code: "AU",
    },
    tags: ["park", "playground", "family", "outdoor", "adventure"],
    imageURL:
      "https://images.squarespace-cdn.com/content/v1/58813c79f7e0ab55271bb525/1681247993796-TSEJIOE5IDEWWLDRX8LZ/KidsTown+Adventure+Park++-+Mamma+Knows+Melbourne+Copyright+2023-0936.jpg",
  },
  {
    name: "Mernda Adventure Park, Mernda",
    description:
      "This fenced play space in Mernda is a multi-level playground with ladders, steps and slides, hidden treasure maps and 'farm find' animal counting challenges. The giant tractor is next to a popular sandpit with a digger. The area includes climbing rocks, plants and greenery. Facilities and notes: shaded picnic area, BBQ, public toilets, pram access and a small amount of onsite parking. There is a walking trail and lake nearby. Mamma's special mention: Turners Bakehouse is just down the road for brunch.",
    location: {
      name: "Mernda Adventure Park",
      formattedAddress: "Mernda Village Drive, Mernda, Australia",
      street_address: "Mernda Village Drive",
      city: "Mernda",
      country_code: "AU",
    },
    startDate: "2025-08-22T14:43:00+1000",
    tags: ["park", "playground", "family", "outdoors"],
    imageURL:
      "https://images.squarespace-cdn.com/content/v1/58813c79f7e0ab55271bb525/1755835347014-3QWL5RBFFPQV165INQ40/Mernda+Adventure+Playground+Copyright+Mamma+Knows+North-9.jpg",
  },
  {
    name: "Hopwood Gardens Playground, Echuca",
    description:
      "A small central Echuca playground themed as a paddle steamer, close to the Murray River and the Port of Echuca Discovery Centre. Main attraction is a chimney ladder leading to the paddle steamer’s steering wheel on the top deck. Other features include climbing walls forming the bow, old-school cargo boxes to balance across, a turtle feature, a cubby house, spinners, slides and a water pump creating a little river trail. Nitty gritty: water play, little shade, picnic benches, close to town, BBQ, limited parking at peak times. Special mention: visit the Port Echuca Discovery Centre for local history.",
    location: {
      name: "Hopwood Gardens Playground",
      formattedAddress: "Hopwood Place, Echuca, Australia",
      street_address: "Hopwood Place",
      city: "Echuca",
      country_code: "AU",
    },
    startDate: "2021-05-23T14:43:21+10:00",
    tags: ["park", "playground", "water play", "picnic", "family", "climbing"],
    imageURL:
      "https://static1.squarespace.com/static/58813c79f7e0ab55271bb525/58ecb61820099e78e671de65/608654e4676f4665433b5698/1703893558728/01+Hopwood+Gardens+Echuca+-+Copyright+Mamma+Knows+North+%281+of+27%29.jpg?format=1500w",
  },
  {
    name: "Harmony Park, Coburg",
    description:
      "Harmony Park is a revamped family-friendly neighbourhood park in Coburg with equipment for toddlers and older children. Remaining favourites include swings, a seesaw, boat, musical play tires, hammock and a large sandpit with sand digger and conveyor belt. Newer equipment includes climbing structures with different-sized slides, rope bridges, connect 4, monkey bars, a basket swing and balance beams. Upgraded undercover picnic areas, bike path and a skate park make it suitable for a wide range of ages and abilities. Facilities mentioned onsite: free parking, toilets, shaded seating, BBQ and picnic tables; ice cream van most weekends. Local tip: nearby Paninoteca is recommended for a bite to eat.",
    location: {
      name: "Harmony Park",
      formattedAddress: "187-195 Gaffney St, Coburg, Australia",
      street_address: "187-195 Gaffney St",
      city: "Coburg",
      country_code: "AU",
    },
    startDate: "2023-01-19T13:59:00+11:00",
    tags: [
      "park",
      "playground",
      "family",
      "accessible",
      "picnic",
      "skatepark",
      "sandpit",
    ],
    imageURL:
      "https://static1.squarespace.com/static/58813c79f7e0ab55271bb525/58ecb61820099e78e671de65/58afa18fb3db2b50981e1055/1730710082180/HARMONY.jpg?format=1500w",
  },
  {
    name: "Edwardes Lake Park, Reservoir",
    description:
      "If you grew up in the north, you would have definitely heard of Edwards's Lake Park and most would have either played, picnicked or attended a sports or community festival there. Edwardes Lake Park has been a part of Reservoir for as long as this Mamma can remember. With a flying fox, a massive slide, 2 rope climbing stations, sandpit and music play, this park is perfect for any adventurer. Not to mention excellent facilities, BBQs, gazebos and easy parking. Most weekends you'll find the Mr Whippy van out front serving up your favourite treats. Edwards's Lakes park is the host to cultural festivals, scouts and school activities, but mostly a popular venue for young families to play on the swings, and young athletes to train on the track. Perfect for all age groups, even the BIG kids. Mamma's special mention: Enjoy a play and then head over to Off The Boat for a take away pizza or to dine in. Facilities: old train to climb; most of playground is fully fenced; good shade; BBQs; flying foxes; public toilets; picnic shelter; walking trails; sporting fields; fitness equipment. Address shown on page: Edwardes St & Griffiths St, Reservoir.",
    location: {
      name: "Edwardes Lake Park",
      formattedAddress:
        "Edwardes St & Griffiths St, Reservoir, Melbourne, Australia",
      street_address: "Edwardes St & Griffiths St",
      city: "Reservoir",
      country_code: "AU",
    },
    startDate: "2017-05-02T12:56:00+1000",
    tags: ["park", "playground", "family", "outdoors"],
    imageURL:
      "http://static1.squarespace.com/static/58813c79f7e0ab55271bb525/58ecb61820099e78e671de65/58f82341b3db2b6374b831fc/1602462713304/edwards+lake+park+169.jpg?format=1500w",
  },
  {
    name: "Frontier Park, Rockbank",
    description:
      "Mamma revisited this fantastic park — trees provide plenty of shade and there are towers, rope bridges, a dizzy wizzy, sand pit, water play, swings, slides, rocks and tree trunks. Plenty for big kids and daredevils; slides and rope tunnel are notable. The rainbow-coloured soft fall complements nature-inspired climbing. Facilities include a mini skateboard ramp, basketball court, soccer net, large undercover areas, bench seats, undercover BBQs, lots of free parking and toilets. Tip: bring a towel for kids as there is water play.",
    location: {
      name: "Frontier Park",
      formattedAddress:
        "At the end Woodlea Blvd at Frontier Avenue (Off Leakes Road), Rockbank",
      street_address: "Woodlea Blvd at Frontier Avenue (Off Leakes Road)",
      city: "Rockbank",
      country_code: "AU",
    },
    startDate: "2023-07-21T19:24:00+1000",
    tags: [
      "park",
      "playground",
      "water play",
      "family",
      "slides",
      "swings",
      "skateboard",
      "basketball",
    ],
    imageURL:
      "http://static1.squarespace.com/static/58813c79f7e0ab55271bb525/58ecb61820099e78e671de65/5dd4f837e71f5a10612e50f3/1690347817253/frontier+park%2C+rockbank+-+copyright+2023+mamma+knows+melbourne-15.jpg?format=1500w",
  },
  {
    name: "Fisher Reserve, Brunswick East",
    description:
      "Fisher Reserve in Brunswick East has been upgraded and is fully fenced, with a main playground scaled for younger children: an enclosed tube slide (with a twist), a low rope bridge, a short fireman’s pole, shop/cafe-front play features, letter and alphabet boards, and an interactive clock and weather station. Additional equipment includes swings, two seesaws, a spinning climbing frame and a tunnel climbing frame. The rear of the park offers balancing logs, stepping stones and nature-play elements (including a small wooden lizard). There’s plenty of open space for older kids, a ping-pong table (BYO rackets/ball), many benches and a picnic table. Two entry points: Noel St or Glenlyon Rd. Facilities noted on the page: drink taps; playground; no toilets.",
    location: {
      name: "Fisher Reserve",
      formattedAddress: "8 Noel Street, Brunswick East VIC 3057, AU",
      street_address: "8 Noel Street",
      city: "Brunswick East",
      state_province: "VIC",
      postal_code: "3057",
      country_code: "AU",
    },
    startDate: "2024-08-07T11:38:04+10:00",
    tags: ["park", "playground", "toddler", "family", "nature-play"],
    imageURL:
      "https://images.squarespace-cdn.com/content/v1/58813c79f7e0ab55271bb525/1722911331695-233W6Q48J1DDKMCP4ZG5/fisher+reserve+brunswick-09.jpg",
  },
  {
    name: "Mitchell Avenue Splash Park, Wangaratta",
    description:
      "Mitchell Avenue Splash Park (Wangaratta) is a fully fenced water-play area popular with families. Features include spraying arches, mushroom fountains for toddlers, a water channel, water shooters, a dragonfly-shaped shower, a tipping bucket, a rocky hill with a water slide and tunnel, and family-friendly water play equipment suitable for a range of ages. There is a large grassed area for picnics, shaded tables, benches, a shaded rotunda with tables and BBQs, toilets, showers and baby change facilities. When water play is closed (outside operating months) a separate fully fenced playground, flying fox, basketball court and BBQ facilities remain available. Open seasonally (noted as November–March, 9am–9pm daily). Good stop-off when driving to Victoria’s High Country.",
    location: {
      name: "Mitchell Avenue Splash Park",
      formattedAddress: "26 Mitchell Ave, Wangaratta, Australia",
      street_address: "26 Mitchell Ave",
      city: "Wangaratta",
      country_code: "AU",
    },
    startDate: "2025-01-28",
    tags: ["park", "playground", "splash park", "water play", "family", "bbq"],
    imageURL:
      "http://static1.squarespace.com/static/58813c79f7e0ab55271bb525/58ecb61820099e78e671de65/679826d152c29c5b5318c636/1745374364114/mitchell+avenue+water+play+park+wangaratta-1.jpg?format=1500w",
  },
  {
    name: "Rubie Thomson Reserve, Northcote",
    description:
      "Small park with a large, varied playground and nature-play features. Good for picnics and play with plenty of room to kick a ball, shady trees, a large sandpit with a metal scooper, two wooden climbing structures, two slides, swings, a climbing wall and rope frame, bridge, tunnel, noughts-and-crosses, see-saw, stand-on spinner, monkey bars and a fireman pole. Suitable for toddlers through older children (up to about 10). Note: very close to Fairfield Library — combine a Story or Rhyme Time visit. Parking on Hillside Ave & Main Street with limited spots on Separation Street.",
    location: {
      name: "Rubie Thomson Reserve",
      formattedAddress: "356 Separation St, Northcote VIC 3070, AU",
      street_address: "356 Separation St",
      city: "Northcote",
      state_province: "VIC",
      postal_code: "3070",
      country_code: "AU",
    },
    startDate: "2019-09-10",
    tags: ["park", "playground", "nature play", "family"],
    imageURL:
      "https://static1.squarespace.com/static/58813c79f7e0ab55271bb525/58ecb61820099e78e671de65/5d772c8ededac027d8fbaf36/1602461177995/rubie+thomson+reserve+mkn.jpg?format=1500w",
  },
  {
    name: "Richards Reserve Pump Track, Coburg",
    description:
      "The Richards Reserve pump track in Coburg is two connected loops (figure-8) suitable for kids riding bikes and balance bikes. The site has benches, tables and BBQs, and public toilets are available nearby at the Coburg velodrome. A sign lists rules and expectations; suitable for toddlers to older children depending on skill. Helmets recommended. Mamma notes it's quieter during school hours; Back Alley Bakes is a short walk away for food.",
    location: {
      name: "Richards Reserve Pump Track",
      formattedAddress: "30-34 Charles St, Coburg, Australia",
      street_address: "30-34 Charles St",
      city: "Coburg",
      country_code: "AU",
    },
    startDate: "2024-09-24T11:59:31+1000",
    tags: ["park", "playground", "pump track", "bike track", "bbq"],
    imageURL:
      "http://static1.squarespace.com/static/58813c79f7e0ab55271bb525/58ecb61820099e78e671de65/66f217f5e2ea465a37d2d432/1727233453248/Richards%2Breserve%2Bpump%2Btrack%2Bcoburg-8.jpg?format=1500w",
  },
  {
    name: "princes park playground, carlton north",
    description:
      "Mamma LOVES this great little playground. It has something for everyone and continues to challenge our 5 year old. The main play structure is a climbing frame, cubby house and ladder in one; confident kids can quickly reach the slide. Beyond the main hub is a sandpit play area with tools to scoop, sift and build. There are a bunch of little huts, some with tunnels and slides, and plenty of seating for supervising adults. The surrounding Princes Park area is active with ovals hosting soccer matches and a running track nearby. Mamma's special mention: Brunetti’s is a nice stop for a treat or coffee, and the Carlton Farmers Market runs on the 1st & 3rd Saturday of the month. The nitty gritty: sandpit, nature play, drinking taps, walking trails nearby, ovals nearby, public toilets, BBQ, street parking.",
    location: {
      name: "Princes Park",
      formattedAddress: "Princes Park Drive, Carlton North VIC 3054, Australia",
      street_address: "Princes Park Drive",
      city: "Carlton North",
      state_province: "VIC",
      postal_code: "3054",
      country_code: "AU",
    },
    startDate: "2019-07-03",
    tags: ["park", "playground", "family", "nature play", "sandpit"],
    imageURL:
      "https://static1.squarespace.com/static/58813c79f7e0ab55271bb525/58ecb61820099e78e671de65/5d1c17df429273000149d7f3/1602461310701/Princes%2BPark%2BPlayground%2BCarlton%2B-%2BMamma%2BKnows%2BNorth%2B%252810%2Bof%2B14%2529.jpg?format=1500w",
  },
  {
    name: "Mode Park, Kalkallo",
    description:
      "Mode Park is a large, well-equipped outdoor playground suitable for all ages. Highlights include two giant connected climbing structures with three slides, a bouldering wall, music play area, flying fox, four-person seesaw, in-ground mini trampolines, exercise equipment, slides and swings. The site features wide paths ideal for scooters and rollerblading, multiple undercover areas, BBQs, large grassy picnic areas, sheltered celebration areas and a bike repair station. Great for families and longer visits.",
    location: {
      name: "Mode Park",
      formattedAddress: "55 Cilantro St, Kalkallo VIC 3064, AU",
      street_address: "55 Cilantro St",
      city: "Kalkallo",
      state_province: "VIC",
      postal_code: "3064",
      country_code: "AU",
    },
    startDate: "2025-10-06T17:46:23+11:00",
    tags: ["park", "playground", "family", "outdoor", "picnic"],
    imageURL:
      "https://static1.squarespace.com/static/58813c79f7e0ab55271bb525/68e35c2c39fab50a2cb6866e/68e361f2614b84091d5a4f5c/1759732320368/Mode+Park+Kalkallo%2C+Copyright+Mamma+Knows+North-18.jpg?format=1500w",
  },
  {
    name: "Pinnacle Park, Mickleham",
    description:
      "A large adventure playground with a separate toddler area and bigger, challenging equipment for older kids. Features big climbing towers with mega slides, long elevated mesh tunnels, an extensive double flying-fox, monkey bars, a mini rock-climbing wall, musical pipe station and a green area for picnics. The lower section for little kids includes a 4-person see-saw, swings and a small climbing frame with slide; shaded picnic tables overlook this area. Mamma’s special mention: visit nearby Foundation Park (just down the road) which has toilets. Nitty gritty: covered picnic tables, pram accessible, flying fox, adventure play, nature play, toddler area. Approximate location shown as Faraday St, Mickleham.",
    location: {
      name: "Pinnacle Park",
      formattedAddress: "Faraday St, Mickleham, Melbourne, Australia",
      street_address: "Faraday St",
      city: "Mickleham",
      country_code: "AU",
    },
    startDate: "2021-03-09T13:29:20+11:00",
    tags: [
      "park",
      "playground",
      "family",
      "nature",
      "adventure",
      "toddler-friendly",
      "picnic",
    ],
    imageURL:
      "http://static1.squarespace.com/static/58813c79f7e0ab55271bb525/58ecb61820099e78e671de65/6046dd80d1af077bab59e484/1622280551732/pinnacle+park+excerpt.jpg?format=1500w",
  },
  {
    name: "montgomery (pirate shipwreck) park, essendon",
    description:
      "NEWS JUST IN! The Swift Parrot Pirate Ship has been found shipwrecked in Essendon, leaving a mast, crow's nest and tattered flags for kids to explore. The park includes a swing set, see-saw, spinning climbing frame and hammock. Large grassy areas with tables, seating, shelter and BBQs. Facilities noted: toilets, BBQ, shelter, free parking and shade. Essendon Traffic School is located next door, offering extra nearby family fun.",
    location: {
      name: "Montgomery Reserve Playground",
      formattedAddress: "21 Hilda St, Essendon, Australia",
      street_address: "21 Hilda St",
      city: "Essendon",
      country_code: "AU",
    },
    startDate: "2025-03-07T14:22:00+1100",
    tags: ["park", "playground", "family", "outdoors", "bbq"],
    imageURL:
      "http://static1.squarespace.com/static/58813c79f7e0ab55271bb525/58ecb61820099e78e671de65/5b0e2a22f950b73551da75bb/1745374229303/front.jpg?format=1500w",
  },
  {
    name: "Symon Crescent Playground, Thomastown",
    description:
      "Symon Crescent playground in Thomastown is a tucked-away, leafy park beside Edgar’s Creek with a flying fox and climbing frame attached to a fort (slide, fireman’s pole, shop-front underneath), a double slide, octopus rocker, swing set, merry-go-round, rock steps and balancing logs. There are benches and a picnic table, and a council bike repair station. Accessible from Symon Crescent, the Edgar’s Creek Trail and the M80 trail. Recommended for family outings and bike rides. Mamma’s tip: while riding Edgar’s Creek you can also visit nearby Main Street Recreation Reserve.",
    location: {
      name: "Symon Crescent Playground",
      formattedAddress: "27W Symon Cres, Thomastown, Australia",
      street_address: "27W Symon Cres",
      city: "Thomastown",
      country_code: "AU",
    },
    startDate: "2025-01-19T07:16:47+1100",
    tags: ["park", "playground", "family", "outdoor", "bike"],
    imageURL:
      "http://static1.squarespace.com/static/58813c79f7e0ab55271bb525/58ecb61820099e78e671de65/678b43481880ab257ce3844f/1737335197692/20250118_213145.jpg?format=1500w",
  },
  {
    name: "River Red Gum Avenue Playground, Bundoora",
    description:
      "Just off Plenty Road in Bundoora Park, this playground is surrounded by lush trees, picnic shelters, BBQs, tables and chairs, and four other playgrounds within walking distance. The playground boasts a double seesaw, flying fox and merry-go-round. There are steps to a smaller slide and harder climbing frames to reach a longer slide, plus a curvy bridge, a pole to slide down, monkey bars and a shop-front play area underneath. A highlight is a spinning swing and several wooden poles with carved details. Nearby Aia’s Meadow (an elevated daisy-chain art installation) is a lovely spot to sit and reflect. Facilities listed: toilets, baby change, water taps, tables and chairs, shelter and BBQs. Mamma's special mention: nearby Sammich for a toastie.",
    location: {
      name: "River Red Gum Avenue Playground",
      formattedAddress: "River Red Gum Av and Playground Drive, Bundoora",
      street_address: "River Red Gum Av and Playground Drive",
      city: "Bundoora",
      country_code: "AU",
    },
    startDate: "2024-02-22T12:38:48+1100",
    tags: ["park", "playground", "family", "outdoor", "nature", "play"],
    imageURL:
      "https://static1.squarespace.com/static/58813c79f7e0ab55271bb525/58ecb61820099e78e671de65/65d66d950923a1682c051fed/1709084298394/rivergum+drive.jpg?format=1500w",
  },
  {
    name: "Mt Aitken Reserve & Playground, Greenvale",
    description:
      "Mt Aitken Reserve is a great spot for a mini hike and play. A walking loop through the reserve offers chances to spot native wildlife and a lookout with 360-degree views across Melbourne's North and the city skyline. The lookout is undercover with seating. The playground features numerous slides, four swings, musical instruments (drums and xylophone), a large climbing frame with multiple entry points leading to a long tube slide, listening tubes, hopscotch and undercover picnic areas. Accessible via Topographical Crescent for the quickest playground access (also reachable via Fairways Boulevard, Craigieburn for a longer scenic hike). No toilets; walking tracks; picnic tables. Mamma's special mention: nearby Forget Me Not cafe offers a good breakfast.",
    location: {
      name: "Mt Aitken Reserve & Playground",
      formattedAddress: "22 A Topographical Cres, Greenvale, Australia",
      street_address: "22 A Topographical Cres",
      city: "Greenvale",
      country_code: "AU",
    },
    tags: ["park", "playground", "walking", "picnic", "family"],
    imageURL:
      "https://static1.squarespace.com/static/58813c79f7e0ab55271bb525/58ecb61820099e78e671de65/66a75ce5642ee50bcf13cc9b/1722910717855/mt+aitken+reserve+%26+playground%2C+greenvale+-+mamma+knows+melbourne+-+copyright-9.jpg?format=1500w",
  },
  {
    name: "Moomba Park Reserve, Fawkner",
    description:
      "Recently upgraded playground: cute and colourful with climbing towers, swings, rockers, garden beds, trees, balancing rocks and logs. Educational features include a little shop front, movable clock hands and find-a-words. Also has a basketball half court, picnic tables with shade, leash-less dog oval nearby, walking/bike paths and a staircase to the Merri Creek for creek walks and wildlife spotting. Mamma's note: nearby takeaway pizza options mentioned.",
    location: {
      name: "Moomba Park Reserve",
      formattedAddress: "26A Somerlayton Crescent, Fawkner, Australia",
      street_address: "26A Somerlayton Crescent",
      city: "Fawkner",
      country_code: "AU",
    },
    startDate: "2021-08-13T13:27:31+10:00",
    tags: [
      "park",
      "playground",
      "nature-play",
      "family-friendly",
      "basketball",
    ],
    imageURL:
      "http://static1.squarespace.com/static/58813c79f7e0ab55271bb525/58ecb61820099e78e671de65/6115e6a358faf3163ff53669/1730710147170/moomba+park+excerpt.jpg?format=1500w",
  },
  {
    name: "Rosanna Parklands and Playground, Rosanna",
    description:
      "Free family-friendly park and playground featuring a large slide, flying fox, climbing bars and webs, open grass areas for picnics and ball games, walking and bike tracks, park benches and off-lead dog walking in parts. Good for wildlife spotting (lizards, kookaburras, possums, lorikeets and occasionally yellow-tailed black cockatoos). Nearby cafe recommendation: Baketico by Wonder Pies for coffee and pastries before/after a park visit.",
    location: {
      name: "Rosanna Parklands",
      formattedAddress:
        "Ruthven Street & Lower Plenty Road, 10 Ferrier Ct, Rosanna",
      street_address: "Ruthven Street & Lower Plenty Road, 10 Ferrier Ct",
      city: "Rosanna",
      country_code: "AU",
    },
    startDate: "2023-05-07T23:19:48+1000",
    tags: ["park", "playground", "family", "wildlife", "picnic", "walking"],
    imageURL:
      "http://static1.squarespace.com/static/58813c79f7e0ab55271bb525/58ecb61820099e78e671de65/64579b3a03f76e680035f6c8/1687336989426/rosanna+parklands.jpg?format=1500w",
  },
  {
    name: "Sycamore Bicycle Track, Mill Park",
    description:
      "The brand new upgraded bicycle/BMX track at Sycamore Reserve is an all-weather track with a starter gate and track lighting. The upgrade included demolition and replacement of the pavilion and resurfacing. The track is large enough for beginners and experienced riders; active supervision is required. The track is shared with The Northern BMX Club, so public access is only at listed times. Facilities noted: toilets including accessible toilets and an onsite carpark. Nearby: Mill Park All Abilities Play Space is a short drive away.",
    location: {
      name: "Sycamore Recreation Reserve",
      city: "Mill Park",
      country_code: "AU",
    },
    startDate: "2021-08-01T13:17:32+1000",
    tags: [
      "park",
      "playground",
      "bmx",
      "bike track",
      "outdoor",
      "family-friendly",
    ],
    imageURL:
      "https://images.squarespace-cdn.com/content/v1/58813c79f7e0ab55271bb525/1627789273135-72P4DV6RQL7F25TEXGFK/sycamore+bicycle+track+mill+park.jpg",
  },
  {
    name: "eltham north adventure playground, eltham north",
    description:
      "The Eltham North Adventure Playground was rebuilt by the local community after a 2017 fire. The main wooden playshed features multiple staircases, climbing challenges and walkways. Other highlights include a double flying fox, sandpit, spinners, swings, dry creek bed, water play trough and a collection of colourful cubbies (general store, post office, ice-cream shop). The site includes accessible features like picnic tables, shade, parking, toilets and BBQs. Edendale Farm is within walking distance for a combined outing.",
    location: {
      name: "Eltham North Reserve",
      formattedAddress: "Wattletree Road, Eltham North, VIC, Australia",
      street_address: "Wattletree Road",
      city: "Eltham North",
      state_province: "VIC",
      country_code: "AU",
    },
    startDate: "2018-12-19T21:23:50+11:00",
    tags: ["park", "playground", "family", "water play", "outdoor"],
    imageURL:
      "http://static1.squarespace.com/static/58813c79f7e0ab55271bb525/58ecb61820099e78e671de65/5c10e2b121c67cf3cf1abffa/1602461596120/Eltham+North+Adventure+Playground+2018+-+Mamma+Knows+East+%281+of+34%29.jpg?format=1500w",
  },
  {
    name: "Sanger Reserve nature playspace, Coburg North",
    description:
      "Here’s a cute little spot to stop by on a nice day. It’s clearly a well loved and well kept park where locals have lined up their diggers for the sandpit and scooters and ride-on cars for the path. As well as the sandpit there’s an undercover picnic and barbeque area, a low accessible slide, swings including a basket swing, and a parkour obstacle course. It’s set in a shady, leafy park with room for picnics or ball play. A great spot for toddlers; older kids will enjoy the obstacle course and basketball hoop. Mamma's special mention: Selvatica (plants & coffee) and Forty Flips takeaway are nearby. The nitty gritty: undercover picnic tables, barbecues, drinking fountain, basketball hoop, sandpit, obstacle course, street parking, dogs on leash.",
    location: {
      name: "Sanger Reserve",
      formattedAddress: "14 Warner St, Coburg North VIC 3058, AU",
      street_address: "14 Warner St",
      city: "Coburg North",
      state_province: "VIC",
      postal_code: "3058",
      country_code: "AU",
    },
    startDate: "2020-03-08T18:58:14+1100",
    tags: [
      "park",
      "playground",
      "nature play",
      "family",
      "toddlers",
      "outdoor",
    ],
    imageURL:
      "http://static1.squarespace.com/static/58813c79f7e0ab55271bb525/58ecb61820099e78e671de65/5e64a596190266288c4b69da/1622280155620/excerpt+sanger+reserve+mkn.jpg?format=1500w",
  },
  {
    name: "Partington’s Flat Reserve Playground, Greensborough",
    description:
      "The new and improved Partington’s Flat Reserve Playground in the heart of Greensborough features multiple swings and slides for different ages, a vertical rock wall, climbing net and adventurous equipment. There is a soccer field and generous grass space, picnic tables and nearby bike/scooter access via the Plenty River Trail. Signage is limited and a short road crossing can flood in wet months (look for Diamond Valley United Soccer Club on Kalparrin Ave). Nearby family-friendly cafe: Mable Jones (approx. 5-minute drive). Facilities noted: picnic tables, toilets, soccer field, bike track, car park.",
    location: {
      name: "Partington's Flat Reserve Playground",
      formattedAddress: "Kalparrin Ave, Greensborough, Melbourne, Australia",
      street_address: "Kalparrin Ave",
      city: "Greensborough",
      country_code: "AU",
    },
    startDate: "2023-07-03T17:06:31+10:00",
    tags: [
      "park",
      "playground",
      "nature play",
      "family",
      "outdoors",
      "new playgrounds",
    ],
    imageURL:
      "https://static1.squarespace.com/static/58813c79f7e0ab55271bb525/58ecb61820099e78e671de65/64a26b3fdf04412c40b220b1/1688427103928/Partingtons+Flat+Reserve.jpg?format=1500w",
  },
  {
    name: "Norris Bank Reserve, Bundoora",
    description:
      "Large, modern playground and reserve with something for everyone: a scooter loop, skate ramp, in-ground trampoline, multiple swings (including a liberty swing and basket swing), two flying foxes (one accessible and adult-sized), and a 6-metre climbing tower with multiple slides. There is a separate nature/quiet play area with a sandpit, a running water play area with manual foot pumps, wooden sculptures and a mini theatre stage. New plantings, good shade, several undercover picnic and barbecue areas, accessible toilets with change facilities, benches and street parking. Suitable for families and includes accessible/all-abilities features.",
    location: {
      name: "Norris Bank Reserve",
      formattedAddress: "135 McLeans Rd, Bundoora VIC 3083, AU",
      street_address: "135 McLeans Rd",
      city: "Bundoora",
      state_province: "VIC",
      postal_code: "3083",
      country_code: "AU",
    },
    startDate: "2019-10-30T17:12:23+11:00",
    tags: [
      "park",
      "playground",
      "all abilities playspace",
      "water play",
      "nature play",
      "picnic",
      "family",
    ],
    imageURL:
      "https://static1.squarespace.com/static/58813c79f7e0ab55271bb525/58ecb61820099e78e671de65/5db929c6ae69931bf8da0d51/1613367583663/norris+bank+excerpt.jpg?format=1500w",
  },
  {
    name: "Seabrook Reserve Playground, Broadmeadows",
    description:
      "Brand-new, spacious and interactive playground with multiple play zones connected by paths and embankments. Features high slides, a large nest swing, ropes and net obstacle courses, balance beams and stilts, in-ground trampolines, swings, spinning carousel, sand and water play, flying foxes, picnic tables and four electric BBQs, basketball ring and adult exercise stations. Paths are suitable for scooters and bikes. Facilities include public toilets, baby change, taps/soap and a water fountain — good for family outings and parties.",
    location: {
      name: "Seabrook Reserve Playground",
      formattedAddress: "Goulburn St, Broadmeadows, Australia",
      street_address: "Goulburn St",
      city: "Broadmeadows",
      country_code: "AU",
    },
    startDate: "2023-05-05T17:13:14+1000",
    tags: ["park", "playground", "family", "outdoors", "bbq", "sand-and-water"],
    imageURL:
      "http://static1.squarespace.com/static/58813c79f7e0ab55271bb525/58ecb61820099e78e671de65/6454a207d83cfa67505dbbb5/1683503592401/seabrook+reserve+playground%2C+broadmeadows+-+cover%2C+copyright+2023+mamma+knows+melbourne-2.jpg?format=1500w",
  },
  {
    name: "Penders Park, Thornbury",
    description:
      "Penders Park has been upgraded with a new all-abilities play space in addition to an existing native-themed play area and a fully fenced toddler playground. Features include in-ground trampolines, flying foxes, wood and rope climbing structures, spinners, more tables and chairs, BBQs, grassy off-leash areas for sports and picnics, shaded picnic tables and benches, and toilets. Suitable for families, picnics and small parties. Note: Preston Market is nearby for groceries.",
    location: {
      name: "Penders Park",
      formattedAddress: "Pender St, St David St, Thornbury, 3071",
      street_address: "Pender St, St David St",
      city: "Thornbury",
      postal_code: "3071",
      country_code: "AU",
    },
    startDate: "2022-01-13T18:00:33+11:00",
    tags: [
      "park",
      "playground",
      "nature-play",
      "family",
      "new-playgrounds",
      "all-abilities",
    ],
    imageURL:
      "https://images.squarespace-cdn.com/content/v1/58813c79f7e0ab55271bb525/1a937ed9-9e0e-4896-a4fc-4b872417452c/penders+park+upgrade+thornbury-9.jpg",
  },
  {
    name: "Porto Kallo Playground, Donnybrook",
    description:
      "Donnybrook’s newly built Porto Kallo Playground offers a large, engaging play space with a ropes course, balancing towers, musical chimes, trampoline, butterfly rocker, giant hamster wheel, rolling tube slide and a spinning seesaw. A colourful pump track (mini rolling hills) is ideal for little bikes and scooters. The main climbing structure has rope ladders, webs, a bridge and two slides (a curvy open slide and a tunnel slide). Bench seating is scattered around and two undercover tables provide shaded seating. Nearby waterplay at Cloverton Water Playground is noted as a close option. Facilities called out: pump track, drink tap and undercover seating.",
    location: {
      name: "Porto Kallo Playground",
      formattedAddress: "1W Creek Esplanade, Donnybrook, Australia",
      street_address: "1W Creek Esplanade",
      city: "Donnybrook",
      country_code: "AU",
    },
    startDate: "2024-11-26T21:16:37+1100",
    tags: ["park", "playground", "pump track", "family", "climbing", "slides"],
    imageURL:
      "http://static1.squarespace.com/static/58813c79f7e0ab55271bb525/58ecb61820099e78e671de65/674598faf889da198211089f/1736846846123/20241126_210500.jpg?format=1500w",
  },
  {
    name: "Overland Park, Doreen",
    description:
      "There is a little adventure in every corner of Doreen. Overland Park offers walking and bike tracks, BBQs and shelter, a playground with slides, climbing wall, bridge and number game. Suitable for younger children; older kids can use the open grass for ball games (footy, cricket). Street parking and shade available. Mamma's special mention: nearby eatery Slices in Doreen is family friendly and does takeaway.",
    location: {
      name: "Overland Park",
      formattedAddress: "9W Mondadale Drive, Doreen, Australia",
      street_address: "9W Mondadale Drive",
      city: "Doreen",
      country_code: "AU",
    },
    startDate: "2018-09-24T14:39:38+1000",
    tags: [
      "park",
      "playground",
      "family",
      "walking",
      "bbq",
      "cycling",
      "open space",
    ],
    imageURL:
      "http://static1.squarespace.com/static/58813c79f7e0ab55271bb525/58ecb61820099e78e671de65/5b75549e6d2a73417a192ec2/1602461731607/overland+front.jpg?format=1500w",
  },
  {
    name: "Raeburn Reserve playground, Pascoe Vale",
    description:
      "We were so glad to discover a freshly upgraded playground at this pretty and leafy spot. The perfect place for a picnic on a sunny day. The unique insect-themed sculptures are a real hit with toddlers and are low to the ground, perfect for little ones to explore. There’s a climbing structure with small and larger slides, a seesaw, nature play including balance logs and a sandpit further afield. The flying fox will be a hit with older kids and there’s lots of space for ball play. The reserve includes exercise equipment, toilets and lots of shady trees. Mamma’s special mention: conveniently located near St. Derby (pick up a babycino and check their decorations). The nitty gritty: street parking, toilets, sport oval, nature play, drinking fountains, exercise equipment, picnic tables, shady picnic spots, dogs allowed off leash (away from playground).",
    location: {
      name: "Raeburn Reserve, Pascoe Vale",
      formattedAddress: "8-42 Landells Road, Pascoe Vale, Melbourne, Australia",
      street_address: "8-42 Landells Road",
      city: "Pascoe Vale",
      country_code: "AU",
    },
    startDate: "2020-10-16T13:54:45+1100",
    tags: ["park", "playground", "nature play", "picnic", "family", "outdoors"],
    imageURL:
      "http://static1.squarespace.com/static/58813c79f7e0ab55271bb525/58ecb61820099e78e671de65/5f890b741b9c17670e1950dc/1730710242329/Raeburn+Reserve+excerpt.jpg?format=1500w",
  },
  {
    name: "Playground Drive Playground, Bundoora Park",
    description:
      "This modern playground in Bundoora Park offers a wide variety of play equipment for different ages. You can park along Playground Drive or walk from other nearby playgrounds. Features include many different swings (a wobble snake, a wobble boat), a trampoline, seesaws (including a spinning seesaw), and a climbing circuit for older children with balance beams, ropes, rock-climbing elements, a wobbly ladder, a slide and a netted tunnel. There is also a smaller climbing frame with a slide for younger kids. The playground is mostly unshaded, though some tables and chairs are near large trees for shaded breaks. Facilities noted: toilets, baby change area, tables and chairs. Mamma's special mention: nearby Bundoora Farm is interactive and allows children to feed guinea pigs.",
    location: {
      name: "Playground Drive Playground, Bundoora Park",
      formattedAddress: "1069 Plenty Road, Bundoora, Australia",
      street_address: "1069 Plenty Road",
      city: "Bundoora",
      country_code: "AU",
    },
    startDate: "2024-02-21T14:33:09+11:00",
    tags: ["park", "playground", "family", "climbing", "swings"],
    imageURL:
      "https://images.squarespace-cdn.com/content/v1/58813c79f7e0ab55271bb525/1708486022912-YN1PWIH11RXXCY175ZX5/playground+drive+playground%2C+bundoora+park-++mamma+knows+melbourne+-+copyright-7.jpg",
  },
  {
    name: "redleap reserve, mill park",
    description:
      "Redleap Reserve in Mill Park offers two playspaces with swings, slides, climbing frames, a net swing and monkey bars. The reserve is filled with large trees providing shade, picnic shelters, BBQs, seating and public toilets. A lake takes around 10–15 minutes to walk around with feeding platforms for ducks. There are wooden bird sculptures, climbable trees, an oval for ball games and a bushy area for kids to explore and climb. Suitable for family outings, picnics and playground play; pram access and walking/bike tracks present.",
    location: {
      name: "Redleap Reserve",
      formattedAddress: "Redleap Ave, Mill Park, Melbourne, Australia",
      street_address: "Redleap Ave",
      city: "Mill Park",
      country_code: "AU",
    },
    startDate: "2018-05-07T15:09:37+10:00",
    tags: ["park", "playground", "family", "outdoor", "picnic"],
    imageURL:
      "http://static1.squarespace.com/static/58813c79f7e0ab55271bb525/58ecb61820099e78e671de65/5977e817f14aa1ed17679cbd/1602462168581/redleapfront.jpg?format=1500w",
  },
  {
    name: "Methven Park, Brunswick East",
    description:
      "There’s something magical about this small heritage park, especially in autumn when leaves fall. A simple wooden playground with swings, climbing frame with slide, monkey bars and a spinner. Facilities include barbeques, toilets and lots of green space for picnics and gatherings. Dogs are allowed off lead. Mamma’s special mention: Rusty’s Sandwich Parlour for sandwiches and coffee nearby.",
    location: {
      name: "Methven Park",
      formattedAddress: "7 Methven St, Brunswick East VIC 3057, AU",
      street_address: "7 Methven St",
      city: "Brunswick East",
      state_province: "VIC",
      postal_code: "3057",
      country_code: "AU",
    },
    startDate: "2021-04-26T15:51:55+10:00",
    tags: [
      "park",
      "playground",
      "picnic",
      "family",
      "dogs",
      "barbecue",
      "playdate",
    ],
    imageURL:
      "https://images.squarespace-cdn.com/content/v1/58813c79f7e0ab55271bb525/1619416421113-P7FULWJJIJH98R5ADTN1/methven+park+brunswick+east.jpg",
  },
  {
    name: "Orchard Road Playground, Doreen",
    description:
      "Mamma and her little one can not get enough of the new playgrounds built for families out here in the north. This gorgeous little playground in the Riverstone Estate in Doreen is set amongst River Red Gum trees and was built with a sensory focus, making it adaptable for all ages and abilities. The park includes climbing frames, a nest swing, a giant slide, swings and percussion play. There is also a wooden structured playground for smaller children and a flying fox. There are BBQs, picnic tables and open grass space for a game of footy. Unfortunately there are no toilets nearby. Mamma's special mention: Slices in Doreen offers family dining and takeaway.",
    location: {
      name: "Orchard Road Playground",
      formattedAddress:
        "Corner of Sunstone Boulevard and Orchard Road, Doreen VIC 3754, Australia",
      street_address: "Corner of Sunstone Boulevard and Orchard Road",
      city: "Doreen",
      state_province: "VIC",
      postal_code: "3754",
      country_code: "AU",
    },
    startDate: "2018-10-10T11:36:11+11:00",
    tags: ["park", "playground", "family", "sensory-play", "outdoor", "bbq"],
    imageURL:
      "http://static1.squarespace.com/static/58813c79f7e0ab55271bb525/58ecb61820099e78e671de65/5b8387f3c2241ba18121d49e/1602461740548/riverstone+front.jpg?format=1500w",
  },
  {
    name: "Pentridge Playground and Waterplay, Coburg",
    description:
      "Mamma loves a family-friendly play space that boasts curiosity and fun. This simple wooden playground gives little ones the confidence to challenge themselves with ropes courses, bridges and climbing ropes surrounded by grassy spots for picnics. The play space also includes a water play area — push the giant button and dodge the water spurts. The playground sits among the bluestone brick buildings of the old Pentridge prison. Nearby attractions include Palace cinema and cafés/restaurants. Facilities mentioned: picnic tables, pram and wheelchair accessible, free undercover parking for the first 3 hours.",
    location: {
      name: "Pentridge Playground and Waterplay",
      formattedAddress: "Champ St, Coburg, Australia",
      street_address: "Champ St",
      city: "Coburg",
      country_code: "AU",
    },
    startDate: "2022-12-31T16:31:12+11:00",
    tags: ["park", "playground", "waterplay", "family", "outdoor"],
    imageURL:
      "http://static1.squarespace.com/static/58813c79f7e0ab55271bb525/58ecb61820099e78e671de65/63afc3035871774403597f3f/1708910339604/pentridge.jpg?format=1500w",
  },
  {
    name: "riverside - pirate ship - park, aberfeldie",
    description:
      "Both little ones and bigger kiddos will love exploring the life-sized pirate ship at Riverside Park. Attention to detail includes a crow's nest, treasure map, captain's quarters, bells, telescopes, sunken treasure and a wooden ship's wheel. The Black Sapphire structure has slides, climbing ropes, tunnels and a 'plank' and sits in a large sandpit (buckets and spades recommended). The park is on the banks of the Maribyrnong River and is popular with families for picnics. Facilities mentioned: BBQs, park benches, lots of free parking, picnic tables, pram access, public toilets, lots of shade and shelters. Mamma's tip: Ascot Food Store is an 8 minute drive for coffee.",
    location: {
      name: "Riverside - Pirate Ship Park",
      formattedAddress: "118 The Boulevard, Aberfeldie VIC 3040, AU",
      street_address: "118 The Boulevard",
      city: "Aberfeldie",
      state_province: "VIC",
      postal_code: "3040",
      country_code: "AU",
    },
    startDate: "2017-12-04T15:55:04+11:00",
    tags: ["park", "playground", "pirate ship", "family-friendly", "sandpit"],
    imageURL:
      "http://static1.squarespace.com/static/58813c79f7e0ab55271bb525/58ecb61820099e78e671de65/5a24d3be71c10b3508f1a1d5/1602462401688/riverside+excerpt.jpg?format=1500w",
  },
  {
    name: "merrilands reserve playground, reservoir",
    description:
      "Merrilands Reserve playground is a hidden gem in Reservoir featuring a large wooden play structure with rock-climbing walls, a rope ladder, fireman’s pole and three connected towers. The tallest tower has a large enclosed slide and a smaller tower has an open slide. Scattered around are swings (including a nest swing), a frog rocker and flower stools for spinning. There is a sandpit tucked behind trees, two unshaded picnic tables, a BBQ, a drink tap and a small grassy area for relaxing. A free tennis court is also available in the reserve. Suitable for families and young children.",
    location: {
      name: "Merrilands Reserve Playground",
      formattedAddress: "7 Asquith St, Reservoir, Melbourne, Australia",
      street_address: "7 Asquith St",
      city: "Reservoir",
      country_code: "AU",
    },
    startDate: "2025-01-29T12:52:45+11:00",
    tags: [
      "park",
      "playground",
      "family",
      "swings",
      "sandpit",
      "bbq",
      "tennis",
      "picnic",
    ],
    imageURL:
      "https://static1.squarespace.com/static/58813c79f7e0ab55271bb525/58ecb61820099e78e671de65/679986010e6eb26857bfa789/1745374345632/merrilands+reserve+reservoir-3.jpg?format=1500w",
  },
  {
    name: "Rosehill Park Playground, Keilor East",
    description:
      "Rosehill Park Playground in Keilor East is a thoughtfully designed family park with play equipment for all ages. Highlights include water play with pumps and water tracks, a frog sculpture and pond, a younger-kids area with a small slide, trampoline and large sand pit, plus a large climbing structure with a fast slide, ladders, ropes, flying fox, swings and more. The site also offers shaded seating, barbecue facilities, drinking fountains, toilets, multiple basketball courts, a skate area and extensive grassed space suitable for family sports and picnics. Good for families with toddlers through older children; parking and amenities are available on site.",
    location: {
      name: "Rosehill Park Playground",
      formattedAddress: "35 Rachelle Road, Keilor East",
      street_address: "35 Rachelle Road",
      city: "Keilor East",
      country_code: "AU",
    },
    tags: [
      "park",
      "playground",
      "family",
      "water play",
      "bbq",
      "skate park",
      "sports",
    ],
    imageURL:
      "https://images.squarespace-cdn.com/content/v1/58813c79f7e0ab55271bb525/1754440946968-DRLJRR2T5P64VK8XOTJW/Rosehill+Park+Playground+Keilor+East+Mamma+Knows+Melbourne-5.jpg",
  },
  {
    name: "Merri Park playground & wetland, Northcote",
    description:
      "A riverside nature spot with an adventurous playground, large sandpit and swings for little ones. The play area overlooks an oval (shared with a local high school during term times). Wetlands are fenced and entered via a gate; strictly no dogs to protect native wildlife (birds, bugs and frogs). Paths are generally pram-friendly though surfaces in the wetland are rough. Activities include bird watching, walking trails, creek exploration, balancing on logs and nature spotting. Nearby: CERES Environment Park for coffee and fresh produce. Take rubbish with you to keep the area clean.",
    location: {
      name: "Merri Park",
      formattedAddress: "Sumner Ave, Northcote, Melbourne, Australia",
      street_address: "Sumner Ave",
      city: "Northcote",
      country_code: "AU",
    },
    startDate: "2020-06-30T12:13:50+1000",
    tags: [
      "park",
      "playground",
      "wetland",
      "nature",
      "family",
      "birdwatching",
      "walking trails",
    ],
    imageURL:
      "https://images.squarespace-cdn.com/content/v1/58813c79f7e0ab55271bb525/1593497292217-ZG3AMV7KDG1PI2FWAVQF/Merri+Park%2C+Northcote+mkn-6.jpg?format=500w",
  },
  {
    name: "Rodger Court Playground, Bundoora",
    description:
      "A tucked-away neighbourhood playground in Bundoora offering a varied play layout for children: swings, a rocking frog, a long twirly tunnel slide, a fireman's pole, an F1 racing game, a double slide on a hill with climbing footholds and rope, and a multi-level climbing set-up with ropes, ladders, nets and a rock wall. The reserve also features natural play elements such as balancing logs and a dry creek bed, walking paths to the playground from multiple streets, and a table and seats for carers. No toilets are available on site. Nearby recommendation: Sammich in Greensborough for a bite to eat.",
    location: {
      name: "Rodger Court Playground",
      formattedAddress: "9W Rodger Ct, Bundoora, Australia",
      street_address: "9W Rodger Ct",
      city: "Bundoora",
      country_code: "AU",
    },
    startDate: "2024-02-06T14:38:43+11:00",
    tags: ["park", "playground", "family", "outdoors", "nature"],
    imageURL:
      "https://images.squarespace-cdn.com/content/v1/58813c79f7e0ab55271bb525/1707190382453-B6ZM7NZOKJ84NWM5FT6B/rodger+court+playground%2C+bundoora+-++mamma+knows+melbourne+-+copyright-10.jpg",
  },
  {
    name: "moreland city playgrounds",
    description:
      "Moreland City has some lovely parks and playgrounds to offer, with leafy picnic spots and room to move. This roundup highlights top picks across Moreland including Kingsford Smith Ulm Reserve (Glenroy), Coburg Lake Reserve (Coburg North), Harmony Park (Coburg), Balfe Park (Brunswick East) and other family-friendly playgrounds with a mix of nature play, upgraded equipment, water play and fenced toddler areas. Suitable for families, picnics and varied age groups; limited location-specific accessibility and parking details are provided on the page.",
    location: {
      name: "Moreland City",
      formattedAddress: "Melbourne, Australia",
      city: "Melbourne",
      country_code: "AU",
    },
    startDate: "2020-10-12T11:36:23+11:00",
    tags: ["park", "playground", "family", "nature", "picnic"],
    imageURL:
      "http://static1.squarespace.com/static/58813c79f7e0ab55271bb525/58ecb61820099e78e671de65/5f83a50e27466f23a4fe060f/1622779993073/moreland+playgrounds+excerpt+copy.jpg?format=1500w",
  },
  {
    name: "Queens Park, Moonee Ponds",
    description:
      "This gorgeous park is seriously fit for... well, a Queen! With a cafe and two playgrounds, huge shady trees, grassed areas and of course the Queens Park Lake - this is not just a place you can just pop to for a short play. Mamma loves the island rotunda and the wooden playground was a firm fave with the kiddos so put aside a good couple of hours to explore here and guaranteed you'll want to come back to do it all over again. The nitty gritty: Cnr The Strand and Mt Alexander Rd, Moonee Ponds. Facilities and notes: park benches, lots of free parking, picnic tables, pram access, public toilets nearby, lots of shade, shelter, water fountain. Hot day? Queens Park Pool is here too.",
    location: {
      name: "Queens Park",
      formattedAddress:
        "Cnr The Strand and Mt Alexander Rd, Moonee Ponds, Australia",
      street_address: "Cnr The Strand and Mt Alexander Rd",
      city: "Moonee Ponds",
      country_code: "AU",
    },
    startDate: "2023-01-20T12:57:00+11:00",
    tags: ["park", "playground", "family", "pool"],
    imageURL:
      "https://static1.squarespace.com/static/58813c79f7e0ab55271bb525/58ecb61820099e78e671de65/596d7878893fc08e6d41bc64/1683268103917/queens+park+playground%2C+ascot+vale+-+copyright+2023+mamma+knows+melbourne.jpg?format=1500w",
  },
  {
    name: "Ninja Training Playground, Albion",
    description:
      "Attention Ninja Warriors! This training ground has all the obstacles needed to train up the little and not-so-little ninja superstars. Kids can balance across rope, wire and ladder tightropes, swing through the spinny circle monkey bars and run-and-jump up the wall. There are lots of courses to run through in this brand new playground — even adults will be tempted to test their skills. Mamma's special mention: Keep adventuring at Brimbank Park! The nitty gritty: Selwyn Street, Albion — bench seats, car park, toilets at Selwyn Park, plenty of grassy spaces, soccer and football oval nearby, Albion train station.",
    location: {
      name: "Selwyn Street, Albion",
      formattedAddress: "Selwyn Street, Albion, Melbourne, Australia",
      street_address: "Selwyn Street",
      city: "Albion",
      country_code: "AU",
    },
    startDate: "2021-07-26T17:43:06+10:00",
    tags: ["park", "playground", "family", "outdoor", "adventure", "ninja"],
    imageURL:
      "http://static1.squarespace.com/static/58813c79f7e0ab55271bb525/58ecb61820099e78e671de65/60fe678a8847821b568c6bc3/1627787852438/ninja+training+playground%2C+albion+-+copyright+mamma+knows+melbourne+cover.jpg?format=1500w",
  },
  {
    name: "Quarries Park Adventure Playground, Clifton Hill",
    description:
      "If you love a classic wooden, adventure style playground, that is EXACTLY what you will find at Quarries Park in Clifton Hill. Located just off the city end of the Eastern Freeway, this treasure is anything but little. A maze of boardwalks, plenty of swings, sand everywhere and one massive slippery dip! The park is great for a family bbq catch up, has heaps of green space to explore - although mindful of the snake warning signs - and some epic views of the city. The skate park is in walking distance too. A whole family winner of a park! Mamma's special mention: Pack the hats and the sunscreen! There is very limited shady parts, unless of course if you are choosing to play in the cave like alcoves under the boardwalks.",
    location: {
      name: "Quarries Park Adventure Playground",
      formattedAddress: "Ramsden Street, Clifton Hill, Melbourne, Australia",
      street_address: "Ramsden Street",
      city: "Clifton Hill",
      country_code: "AU",
    },
    startDate: "2018-12-13T09:20:35+1100",
    tags: ["park", "playground", "family", "outdoors", "skate-park"],
    imageURL:
      "http://static1.squarespace.com/static/58813c79f7e0ab55271bb525/58ecb61820099e78e671de65/5c1187b121c67c7a9647769a/1602461649501/quarrie+park3.jpg?format=1500w",
  },
  {
    name: "Preston to Bell Playground & Public Spaces, Preston",
    description:
      "A recently renovated stretch beside the train tracks linking Preston and Bell with a large new playground near Preston Oval. Features a giant three-level climbing structure, a large green slide plus two smaller slides, flying fox, swings, bridges, rock-climbing elements, musical play (xylophone and steel tap drum), and a basketball half-court. The area includes public exercise equipment, running tracks and a long jump area, ample space for picnics, tables and chairs, drink taps and BBQs, and a bike track/Darebin bike path. Trains pass overhead, adding to the experience. Nearby food option: Arepa Days a short walk away.",
    location: {
      name: "Preston to Bell Playgrounds & Public Spaces",
      formattedAddress: "Preston, Melbourne, VIC, Australia",
      city: "Preston",
      state_province: "VIC",
      country_code: "AU",
    },
    startDate: "2024-01-02T15:50:55+11:00",
    tags: ["park", "playground", "outdoor", "family", "exercise", "bike path"],
    imageURL:
      "https://static1.squarespace.com/static/58813c79f7e0ab55271bb525/58ecb61820099e78e671de65/65937913eadb821bf5e33f84/1704172793369/preston+to+bell+.jpg?format=1500w",
  },
  {
    name: "Service Street Playground, Coburg",
    description:
      "A brand-new, inclusive playground in Coburg with a large central play tower (slides, tunnels, ropes, poles), interactive games (Find the Pairs, Noughts & Crosses, Let’s Fly, Three in a Row, Musical Bells), a shop front and car window with moving steering wheel, wooden spiral climbing frame, talking tubes, spinner features, water pump for water play, basket swing, parent/baby swing, spinning carousel and a toddler play area. The park includes a huge undercover seating area, lush grass with a hill for rolling, raised garden beds for community gardening and a produce share table at the entry. Facilities noted: tables and chairs, drink taps, mini community book library; no toilets. Tip: nearby food option mentioned (Hey’Burg in Coburg).",
    location: {
      name: "Service Street Playground",
      formattedAddress: "41 Service St, Coburg, Australia",
      street_address: "41 Service St",
      city: "Coburg",
      country_code: "AU",
    },
    startDate: "2023-11-22T13:43:14+11:00",
    tags: [
      "park",
      "playground",
      "inclusive-play",
      "waterplay",
      "community-garden",
      "family-friendly",
    ],
    imageURL:
      "https://images.squarespace-cdn.com/content/v1/58813c79f7e0ab55271bb525/1700620271651-UCNMCB9SWM1LF69I0JWR/service+st+playground%2C+coburg+-+mamma+knows+melbourne+-+copyright-2.jpg",
  },
  {
    name: "Petrie Park, Montmorency",
    description:
      "Petrie Park in Montmorency is a small local park and play space ideal for children who love trains. Located next to the Hurstbridge railway line, kids can watch trains and play on a miniature play train. The playground includes multiple swings and slides, a sliding pole, a climbing net and a wall. There is an undercover picnic and BBQ area suitable for group catch-ups or playground birthday parties. Nearby is A Stone's Throw cafe on Were Street and an oval adjacent to the playground for extra play.",
    location: {
      name: "Petrie Park",
      formattedAddress: "12-28 Mountain View Road, Montmorency",
      street_address: "12-28 Mountain View Road",
      city: "Montmorency",
      country_code: "AU",
    },
    startDate: "2023-07-03T16:22:25+10:00",
    tags: [
      "park",
      "playground",
      "family",
      "nature play",
      "picnic",
      "bbq",
      "trains",
    ],
    imageURL:
      "https://static1.squarespace.com/static/58813c79f7e0ab55271bb525/58ecb61820099e78e671de65/64a25d14df04412c40b0fd93/1688379814517/petrie.jpg?format=1500w",
  },
  {
    name: "Shore Reserve Playground (south-side playground), Pascoe Vale South",
    description:
      "Small, semi‑fenced playground at the south side of Shore Reserve ideal for parents who want to sit back and watch children play. Features climbing frames leading to a slide, a curvy bridge, binoculars, steering wheel, monkey bars, a wobble bike, four‑seater cross seesaw, noughts-and-crosses and a find‑the‑word game. Site includes a basketball court, undercover BBQ with table and chairs, seating and an oval with walking track. Best access is via Woodlands Ave where a car park is available (may be busy on local footy days). A path around the oval leads to another playground on the north side.",
    location: {
      name: "Shore Reserve Playground (South)",
      formattedAddress: "12 Woodlands Ave, Pascoe Vale South",
      street_address: "12 Woodlands Ave",
      city: "Pascoe Vale South",
      country_code: "AU",
    },
    startDate: "2023-08-21T07:56:17+10:00",
    tags: ["park", "playground", "outdoor", "family", "picnic", "basketball"],
    imageURL:
      "http://static1.squarespace.com/static/58813c79f7e0ab55271bb525/58ecb61820099e78e671de65/64e28612398b362f228ef5f2/1730710250001/shore+reserve+south.jpg?format=1500w",
  },
  {
    name: "Norris Bank Playground, Bundoora",
    description:
      "Mamma thinks she might have found a playground that has it all. Norris Bank Play Space in Bundoora is a climber's paradise with ropes, nets, foot stumps, monkey bars and four slides. There are many swing options including a wheelchair-friendly liberty swing and two flying foxes (one with a belted bucket seat). The site also offers a pump track, large grass oval, nearby basketball court, log seating and a stage area, sensory wall, sandpit and nature-play elements (sticks, leaves, logs and frames). A large water-play setup was present but not operating at the visit. Most seating and tables are undercover; some areas have barbecues and water taps nearby. Toilet facilities include a change area.",
    location: {
      name: "Norris Bank Playground",
      formattedAddress: "135 McLeans Rd, Bundoora, Australia",
      street_address: "135 McLeans Rd",
      city: "Bundoora",
      country_code: "AU",
    },
    startDate: "2024-02-01T14:00:26+11:00",
    tags: ["park", "playground", "family", "nature-play", "accessible"],
    imageURL:
      "https://images.squarespace-cdn.com/content/v1/58813c79f7e0ab55271bb525/1706754237209-KC5SAJIWN9HVQT8K2QHE/norris+bank+playground%2C+bundoora+-++mamma+knows+melbourne+-+copyright-8.jpg",
  },
  {
    name: "Ruthven Reserve, Reservoir",
    description:
      "A recently updated nature-play playground at Ruthven Reserve featuring natural play elements (wood, rope, loose sticks, balancing stumps), new paths, garden beds and plants. There is a challenging rope-climbing structure for older children and a junior play area with a small slide and spinner for younger kids. An informal nature-play area with pods, mounds and loose elements encourages open-ended play and there are sturdy cubbies. A formal name for the spot is still being decided. Edwardes Lake Park is nearby. Links on the page point to a Google Maps location and a local consultation page for more information.",
    location: {
      name: "Ruthven Reserve",
      formattedAddress: "74-76 Glasgow Ave, Reservoir 3073, AU",
      street_address: "74-76 Glasgow Ave",
      city: "Reservoir",
      postal_code: "3073",
      country_code: "AU",
    },
    startDate: "2022-08-15T13:49:42+10:00",
    tags: ["park", "playground", "nature-play", "family", "outdoors"],
    imageURL:
      "https://images.squarespace-cdn.com/content/v1/58813c79f7e0ab55271bb525/1660535540423-WMIC98BB1P2UWAXHY7M0/Ruthven+Reserve%2C+Reservoir-22.jpg?format=500w",
  },
  {
    name: "Rathdowne Central Park, Wollert",
    description:
      "Here’s another cool and unique spot to add to your playground list for the local area! The design is bright and colourful with a tumble slide, swings (including basket and baby swings), in-ground trampolines, slides, spinners, see-saw, rope climbing structures and more. There is an undercover picnic area. Mamma’s special mention: Keep the playground hop going — you’re 4 minutes from Lyndarum North Community Park. The nitty gritty: covered picnic tables, pram accessible, active play, street parking.",
    location: {
      name: "Rathdowne Central Park, Wollert",
      formattedAddress: "1 Broad Wy, Wollert VIC 3750, Australia",
      street_address: "1 Broad Wy",
      city: "Wollert",
      state_province: "VIC",
      postal_code: "3750",
      country_code: "AU",
    },
    startDate: "2021-04-19T14:11:23+1000",
    tags: ["park", "playground", "family", "picnic", "outdoors"],
    imageURL:
      "https://static1.squarespace.com/static/58813c79f7e0ab55271bb525/58ecb61820099e78e671de65/607d02eb413fdc79e8c31e19/1703893600871/Rathdowne+Central+Park%2C+Wollert-3.jpg?format=1500w",
  },
  {
    name: "Serle Wetland Park, Doreen",
    description:
      "Serle Wetland Park in Doreen is a tucked-away, peaceful wetland reserve ideal for birdwatching and gentle strolls along a boardwalk. The site features a fenced playground with two gates (useful for small children), two playground areas (timber climbing for younger children and a climbing tower for older kids), undercover picnic tables and BBQ facilities. The area is pram friendly but has no toilet facilities. Ample street parking is available. Mamma’s special mention: after exploring the wetlands, head along the boardwalk trail towards Orchard Rd and visit Magnolia on Orchard for breakfast or lunch.",
    location: {
      name: "Serle Wetland Park",
      formattedAddress: "41W Serle St, Doreen VIC 3754, Australia",
      street_address: "41W Serle St",
      city: "Doreen",
      state_province: "VIC",
      postal_code: "3754",
      country_code: "AU",
    },
    tags: [
      "park",
      "playground",
      "wetlands",
      "birdwatching",
      "family",
      "bbq",
      "pram-friendly",
    ],
    imageURL:
      "https://images.squarespace-cdn.com/content/v1/58813c79f7e0ab55271bb525/ae185314-6c8b-4257-95b1-88a643605308/Serle+Wetlands+Doreen+Copyright+Mamma+Knows+North.jpg",
  },
  {
    name: "Montgomery Park playground and pop up pump track, Essendon",
    description:
      "Grab your bikes or scooters and head to Montgomery Park to ride the pop-up pump track before it moves. It’s challenging for confident kids on BMX with a range of hills and turns, yet small enough for new riders to build confidence. The pop-up modular track is scheduled to be moved in 2025 as part of a rotating project while the council assesses usage for a possible permanent facility. The park also features a huge slide, large climbing frame, nest swing, tractor rocker and a swinging seesaw (the seesaw swings side-to-side and won’t complete a full 360°). There are tables and chairs near the playground. Nearby family attraction: Essendon Traffic School. Facilities noted: street parking, onsite toilets, dogs allowed.",
    location: {
      name: "Montgomery Park",
      formattedAddress: "43A Lawson St, Essendon VIC 3040, AU",
      street_address: "43A Lawson St",
      city: "Essendon",
      state_province: "VIC",
      postal_code: "3040",
      country_code: "AU",
    },
    startDate: "2025-01-29T21:17:00+1100",
    tags: ["park", "playground", "pump track", "family", "outdoors", "cycling"],
    imageURL:
      "http://static1.squarespace.com/static/58813c79f7e0ab55271bb525/58ecb61820099e78e671de65/62ca3e620e5d6a4f92d924f9/1745374322367/montgomery+pump+track+essendon.jpg?format=1500w",
  },
  {
    name: "Shore Reserve, Pascoe Vale South",
    description:
      "There’s so much room to move at Shore Reserve. A great spot for a combo of space to play sports, a playground, a barbeque, toilets and off-leash dog areas. It’s popular for gatherings and picnics but there’s room for everyone. The playground (Reynard St end) has a huge sandpit with a digger, a slide, monkey bars, a wobble bridge and a large climbing pyramid. There’s a retro seesaw swing, wooden circus figures and some nature-play elements. An oval is attached (good for throwing the ball to the dog) and another playground can be found on the Woodlands Road side. Mamma's special mention: you’re a short stroll from Miinot Gelato. The nitty gritty: toilets, sandpit, nature play, drinking tap, plenty of room for picnics, shade, park benches, dogs permitted, some parking on Reynard and Woodlands Streets.",
    location: {
      name: "Shore Reserve",
      formattedAddress:
        "223 Reynard St (cnr Reynard & Melville Rds), Pascoe Vale South VIC 3044, AU",
      street_address: "223 Reynard St (cnr Reynard & Melville Rds)",
      city: "Pascoe Vale South",
      state_province: "VIC",
      postal_code: "3044",
      country_code: "AU",
    },
    startDate: "2020-02-09T16:39:23+1100",
    tags: [
      "park",
      "playground",
      "sandpit",
      "nature play",
      "dog-friendly",
      "picnic",
      "bbq",
      "family",
    ],
    imageURL:
      "https://static1.squarespace.com/static/58813c79f7e0ab55271bb525/58ecb61820099e78e671de65/5e3f9b0abab6ba3cfa2d7a2a/1730710203527/collage+shore+reserve+pascoe+vale+south.jpg?format=1500w",
  },
  {
    name: "Shore Reserve Playground (north-side playground), Pascoe Vale South",
    description:
      "Shore Reserve Playground (North) features a well-known spinning clown swing, ringmaster and acrobat sculptures, coloured steps for imaginative play, a climbing pyramid, mini parkour obstacle course, merry-go-rounds, ride-on wobble dinosaur and giraffe, wobble bridge to a slide, and a very large sandpit with a ride-on digger. Facilities include tables and chairs, public toilets, BBQ and a water fountain. There is plenty of open grass and an oval nearby for ball games. Multiple entry points exist; the most direct parking for the North Playground is along Reynard St. Suitable for toddlers through older children; good for picnics and family visits.",
    location: {
      name: "Shore Reserve Playground (north-side playground)",
      formattedAddress: "326 Reynard St, Pascoe Vale South, Australia",
      street_address: "326 Reynard St",
      city: "Pascoe Vale South",
      country_code: "AU",
    },
    startDate: "2023-08-21T17:31:29+1000",
    tags: ["park", "playground", "family", "picnic", "play-equipment"],
    imageURL:
      "https://static1.squarespace.com/static/58813c79f7e0ab55271bb525/58ecb61820099e78e671de65/64e2ab2bddb7932eb7025238/1730710268946/shore+reserve+north.jpg?format=1500w",
  },
  {
    name: "Splendour Circuit Playground, Diggers Rest",
    description:
      "This fresh new playground is half play, half work out! There is a fun area for kids to hang and climb, plus a track around the park and grassy areas perfect for scooters and bikes. While the children play, adults can use the outdoor workout equipment (kettlebells, exercise bike, rings and more). Mamma’s special mentions: Grab a bite at Fifteen Bar and Cafe up the road. The nitty gritty: off street parking, BBQ, shelter; no toilets (use Fifteen Bar Cafe).",
    location: {
      name: "Splendour Circuit, Diggers Rest",
      city: "Diggers Rest",
      country_code: "AU",
    },
    startDate: "2019-06-24T17:24:50+1000",
    tags: ["park", "playground", "outdoors", "family", "exercise-equipment"],
    imageURL:
      "https://images.squarespace-cdn.com/content/v1/58813c79f7e0ab55271bb525/1561360601715-9OWHZEI5T19Q7YOWVQY9/Splendour+Circuit%2C+Diggers+Rest+Mamma+Knows+Melbourne+%2813+of+26%29.jpg",
  },
  {
    name: "Royal Park Natureplay Playground, Parkville",
    description:
      "Nature play at its best: timber climbing structures, slides of all sizes, two water play areas (one connecting to a sandpit), hills with city views and plenty of shady trees. Large water play at the top is great for cooling off—pack towels and bathers. Features climbing forest, water play zones, rocky structures, swings and timber equipment; suitable for babies, toddlers and older children. Facilities and nearby notes: public toilets at the entrance, BBQs, shaded picnic areas, drinking fountains and obstacle-course style play. Located next to the Royal Children’s Hospital; Trin Warren Tam-boore wetlands and Melbourne Zoo are nearby for extended visits.",
    location: {
      name: "Royal Park Natureplay Playground",
      formattedAddress: "28 Gatehouse St, Parkville, VIC, Australia",
      street_address: "28 Gatehouse St",
      city: "Parkville",
      state_province: "VIC",
      country_code: "AU",
    },
    startDate: "2025-01-17T13:42:45+1100",
    tags: [
      "park",
      "playground",
      "nature play",
      "water play",
      "family friendly",
    ],
    imageURL:
      "https://images.squarespace-cdn.com/content/v1/58813c79f7e0ab55271bb525/1737074599326-RPRL7KW0GZA62IF8B31P/Royal+Park+Parkville+Mamma+Knows+North+Copyright-22.jpg?format=500w",
  },
  {
    name: "Romsey Ecotherapy Park",
    description:
      "Community-built nature play park located on the outdoor area of an old primary school. Features a flying fox, basket swing, hammock, a wooden fort with a wide slide integrated around an old oak tree, and two tall rope-and-wood climbing structures. Play area is surrounded by tree shade, rocks, wooden planks and stumps with plenty of space for ball play and picnics. Friendly local vibe encourages imaginative play. Future planned additions mentioned include an arts/culture space, a woodland ramble, a sensory therapeutic space and a billabong. Practical notes: small carpark on site; public toilets across the road at Lions Park; nearby additional playground further down Main St.",
    location: {
      name: "Romsey Ecotherapy Park",
      formattedAddress: "140 Main St, Romsey VIC 3434, AU",
      street_address: "140 Main St",
      city: "Romsey",
      state_province: "VIC",
      postal_code: "3434",
      country_code: "AU",
    },
    startDate: "2020-03-01T17:02:57+11:00",
    tags: ["park", "playground", "nature", "family-friendly", "outdoors"],
    imageURL:
      "https://static1.squarespace.com/static/58813c79f7e0ab55271bb525/58ecb61820099e78e671de65/5e4d0f637b1c6c0311ac5fad/1621751313162/romsey+ecotherapy+excerpt.jpg?format=1500w",
  },
  {
    name: "2017 top ten parks",
    tags: ["park", "playground", "2017 top ten parks", "parks and playgrounds"],
  },
  {
    name: "bbq — parks and playgrounds",
    description:
      'Tag page listing parks and playgrounds posts tagged "bbq" on Mamma Knows North. The page contains multiple articles (for example: Merrilands Reserve playground, Mitchell Avenue splash park, Bedford St Pocket Park) with short summaries, images and links to full posts.',
    tags: ["bbq", "park", "playground"],
    imageURL:
      "https://images.squarespace-cdn.com/content/v1/58813c79f7e0ab55271bb525/b2f2e84e-4829-4119-8286-f9c7da415793/MAMMA-KNOWS-north-LG_CIRCLE.png",
  },
  {
    name: "CB Smith Reserve, Fawkner",
    description:
      "CB Smith Reserve in Fawkner has had a glow up and Mamma is impressed. Features a brand new double climbing tower, a massive sandpit, a set of four swings plus a rope web swing, a floor spinner and musical flowers.",
    location: {
      name: "CB Smith Reserve",
      city: "Fawkner",
      country_code: "AU",
    },
    startDate: "2025-03-06",
    tags: ["park", "playground", "family", "outdoors", "new playground"],
    imageURL:
      "https://images.squarespace-cdn.com/content/v1/58813c79f7e0ab55271bb525/1741222534232-B2NV9JBKKK3C6ANGK6I8/CB+Smith+Reserve+Fawkner-3.jpg?format=300w",
  },
  {
    name: "Whittelsea playgrounds",
    description:
      "Tag page on Mamma Knows North collecting reviews and guides for playgrounds in the Whittlesea area. Mamma Knows North explores Melbourne's North — a resource for parks, playgrounds, family adventures and local tips.",
    tags: ["park", "playground", "family", "outdoors", "adventure"],
    imageURL:
      "https://images.squarespace-cdn.com/content/v1/58813c79f7e0ab55271bb525/1732064701949-13328L3TY11JYRZDLI4F/Gumnut+Adventure+Park+Donnybrook-9.jpg?format=500w",
  },
  {
    name: "CB Smith Reserve, Fawkner",
    description:
      "CB Smith Reserve in Fawkner has had a glow up. Features include a brand new double climbing tower, a massive sandpit, a set of four swings, a rope web swing, a floor spinner and musical flowers. Article notes family-friendly playground improvements. Read more at the original article.",
    location: {
      name: "CB Smith Reserve",
      formattedAddress: "Fawkner, Australia",
      city: "Fawkner",
      country_code: "AU",
    },
    startDate: "2025-03-06",
    tags: [
      "park",
      "playground",
      "new playgrounds",
      "family adventures",
      "melbourne playgrounds",
    ],
    imageURL:
      "https://images.squarespace-cdn.com/content/v1/58813c79f7e0ab55271bb525/1741222534232-B2NV9JBKKK3C6ANGK6I8/CB+Smith+Reserve+Fawkner-3.jpg?format=300w",
  },
  {
    name: "Moomba Park Reserve, Fawkner",
    description:
      "Recently upgraded playground that is cute and colourful. It sits between a leash-free dog oval and walking/bike paths, and a nearby staircase leads down to the Merri Creek Trail. Good for families and young children; features play equipment, nearby walking and cycling access.",
    location: {
      name: "Moomba Park Reserve",
      city: "Fawkner",
      country_code: "AU",
    },
    startDate: "2021-08-13",
    tags: [
      "park",
      "playground",
      "family",
      "outdoor",
      "walking",
      "bike track",
      "dog friendly",
      "nature trail",
      "new playgrounds",
    ],
    imageURL:
      "https://images.squarespace-cdn.com/content/v1/58813c79f7e0ab55271bb525/1628826249537-KM1455PHOTSOO9J2JG02/moomba+park+excerpt.jpg?format=300w",
  },
  {
    name: "Gumnut Park and Adventure Playground, Donnybrook",
    description:
      "Adventure play with a dedicated toddler section, BBQ/picnic area and an on-site cafe. Inspired by May Gibbs’ Gumnut Babies, set among a natural backdrop with red gum trees. Family-friendly adventure playground with varied play equipment and picnic facilities.",
    location: {
      name: "Gumnut Park and Adventure Playground",
      city: "Donnybrook",
      country_code: "AU",
    },
    startDate: "2024-10-15",
    tags: ["park", "playground", "adventure", "family", "cafe", "toddler"],
    imageURL:
      "https://images.squarespace-cdn.com/content/v1/58813c79f7e0ab55271bb525/1732064701949-13328L3TY11JYRZDLI4F/Gumnut+Adventure+Park+Donnybrook-9.jpg?format=300w",
  },
  {
    name: "Bain Reserve, Coburg North",
    description:
      "The perfect toddler and family retreat. The playground includes a bucket swing, trampoline, merry-go-round, tunnel, cubby house, slides and climbing frames. Facilities mention toilets and BBQ. Suitable for toddlers and young children.",
    location: {
      name: "Bain Reserve, Coburg North",
      city: "Coburg North",
      country_code: "AU",
    },
    startDate: "2023-07-11",
    tags: [
      "park",
      "playground",
      "family",
      "toddler-friendly",
      "trampoline",
      "bucket-swing",
      "merry-go-round",
      "slides",
      "climbing-frame",
      "bbq",
      "toilets",
      "outdoors",
      "new-playgrounds",
      "playgrounds",
    ],
    imageURL:
      "https://images.squarespace-cdn.com/content/v1/58813c79f7e0ab55271bb525/1689034627198-WQDOQOBY0X419H3ALV95/bain+reserve.jpg?format=300w",
  },
  {
    name: "Queens Park, Moonee Ponds",
    description:
      "This gorgeous park is fit for a queen. Weddings, parties, picnics, walks and play happen here. Features a lake, large grassy areas, towering trees and playgrounds.",
    location: {
      name: "Queens Park",
      city: "Moonee Ponds",
      country_code: "AU",
    },
    startDate: "2023-01-20",
    tags: ["park", "playground", "picnic", "family"],
    imageURL:
      "https://images.squarespace-cdn.com/content/v1/58813c79f7e0ab55271bb525/1676891463080-LX64HWC014KXXNSRLPV9/queens+park+playground%2C+ascot+vale+-+copyright+2023+mamma+knows+melbourne.jpg?format=300w",
  },
  {
    name: "Aston's Debonair Parade Park, Craigieburn",
    description:
      "The playspace includes lots of fun for the kids with the main attraction being a large rope bridge and a cool wooden cubby structure. Suitable for families and children; photo and full article available on the source page.",
    location: {
      name: "Debonair Parade Park",
      city: "Craigieburn",
      country_code: "AU",
    },
    startDate: "2024-01-12",
    tags: ["park", "playground", "play space", "family-friendly"],
    imageURL:
      "https://images.squarespace-cdn.com/content/v1/58813c79f7e0ab55271bb525/1704871369585-390NT3PH4U6NIRF41IGT/debonair.jpg?format=300w",
  },
  {
    name: "Cloverton Water Playground and Park, Kalkallo",
    description:
      "Huge swirly slide, water play, flying fox, cafe, swings and lots more in the one fantastic spot. This lovely space has been created for the local new development estate but all are welcome to enjoy it.",
    location: {
      name: "Cloverton Water Playground and Park",
      city: "Kalkallo",
      country_code: "AU",
    },
    startDate: "2024-10-24",
    tags: ["park", "playground", "water play", "family friendly", "outdoor"],
    imageURL:
      "https://images.squarespace-cdn.com/content/v1/58813c79f7e0ab55271bb525/1548295830742-8N8SGBTKNKES0CI66OQD/livvis+excerpt+2.jpg?format=300w",
  },
  {
    name: "All Nations Park, Northcote",
    description:
      "Two playgrounds, a dog park and additional facilities. Short listing on Mamma Knows North summarising park features and play areas.",
    location: {
      name: "All Nations Park",
      formattedAddress: "Northcote, Melbourne, Australia",
      city: "Northcote",
      country_code: "AU",
    },
    startDate: "2023-07-17",
    tags: ["park", "playground", "dog park"],
    imageURL:
      "https://images.squarespace-cdn.com/content/v1/58813c79f7e0ab55271bb525/1689545055956-4XPXG5XF3PR53APNVW3Q/all+nations.jpg?format=300w",
  },
  {
    name: "AJ Davis Reserve Playground, Airport West",
    description:
      "There is a new playground at AJ Davis Reserve in Airport West with lots of natural play elements set over multiple levels on a hillside.",
    location: {
      name: "AJ Davis Reserve Playground, Airport West",
      city: "Airport West",
    },
    startDate: "2023-07-26",
    tags: ["park", "playground", "natural play", "awesome playgrounds"],
    imageURL:
      "https://images.squarespace-cdn.com/content/v1/58813c79f7e0ab55271bb525/1690351968874-DPRMX09MCZUIE9FQJSWG/aj+davis+reserve+playground%2C+airport+west+-+copyright+2023+mamma+knows+melbourne.jpg?format=300w",
  },
  {
    name: "Balfe Park, Brunswick East",
    description:
      "A cute little newly upgraded playground with an off-lead dog oval.",
    location: {
      name: "Balfe Park",
      city: "Brunswick East",
      state_province: "VIC",
      country_code: "AU",
    },
    startDate: "2021-03-01",
    tags: ["park", "playground", "dog-friendly", "family"],
    imageURL:
      "https://images.squarespace-cdn.com/content/v1/58813c79f7e0ab55271bb525/1614568327255-ZB36COWSOA10OCNLN10V/balfe+park+excerpt+.jpg?format=300w",
  },
  {
    name: "ANZAC Memorial Park, Hurstbridge",
    description:
      "Nestled in amongst greenery and surrounded by cafes, Anzac Memorial Park is a great spot. Despite being a smaller playground, it packs a punch with options to role play being a medic in the medical tent, driving an army tank, taking on a challenge on the ropes course or doing mind games with a word search or maze.",
    location: {
      name: "ANZAC Memorial Park, Hurstbridge",
      city: "Hurstbridge",
      country_code: "AU",
    },
    startDate: "2024-08-27",
    tags: ["park", "playground", "nillumbik"],
    imageURL:
      "https://images.squarespace-cdn.com/content/v1/58813c79f7e0ab55271bb525/1724753679326-3K0IIT6NBLNMN6SZYAN0/Copyright%2BMamma%2BKnows%2BMelbourne%2B-%2BANZAC%2BPark%252C%2BHurstbridge-3754.jpg?format=300w",
  },
  {
    name: "Moomba Park Reserve, Fawkner",
    description:
      "Recently upgraded playground with cute, colourful equipment. Located between a leash‑free dog oval and walking/bike paths; a nearby staircase leads down to the Merri Creek Trail. Good for family visits and bike/walk access.",
    location: {
      name: "Moomba Park Reserve, Fawkner",
      city: "Fawkner",
      country_code: "AU",
    },
    startDate: "2021-08-13",
    tags: [
      "park",
      "playground",
      "family",
      "outdoors",
      "bike track",
      "walking trail",
      "new playground",
    ],
    imageURL:
      "https://images.squarespace-cdn.com/content/v1/58813c79f7e0ab55271bb525/1628826249537-KM1455PHOTSOO9J2JG02/moomba+park+excerpt.jpg?format=300w",
  },
  {
    name: "Aston Treetop Park",
    description:
      'Tag page listing posts related to Aston Treetop Park on Mamma Knows North. The page links to posts (for example: "Aston\'s Champion Parade playground (Burt-Kur-Min Reserve), Craigieburn") but contains no standalone park details or address.',
    location: {},
    tags: [
      "park",
      "playground",
      "aston treetop park",
      "parks and playgrounds",
      "family",
      "outdoors",
    ],
  },
  {
    name: "Wonguim Wilam Playspace, Warrandyte",
    description:
      "Brand new playspace in Warrandyte featured on Mamma Knows North. Locals have a new playground to explore with adventurous play equipment. Article published September 18, 2022; suitable for families and children.",
    location: {
      name: "Wonguim Wilam Playspace, Warrandyte",
      city: "Warrandyte",
      country_code: "AU",
    },
    startDate: "2022-09-18",
    tags: [
      "park",
      "playground",
      "playgrounds",
      "north playgrounds",
      "best playground",
    ],
    imageURL:
      "https://images.squarespace-cdn.com/content/v1/58813c79f7e0ab55271bb525/1663486335617-1BZ1ORLJ4BEBNL1OHUX7/01+Copyright+Mamma+Knows+East+-+wonguim+wilam%2C+warrandyte-0741.jpg?format=300w",
  },
  {
    name: "AJ Davis Reserve Playground, Airport West",
    description:
      "There is a new playground at AJ Davis Reserve in Airport West and it’s a really unique and fun playground with lots of natural play elements set over multiple levels (it’s on a hillside)!",
    location: {
      name: "AJ Davis Reserve",
      formattedAddress: "AJ Davis Reserve, Airport West, Melbourne, Australia",
      city: "Airport West",
      country_code: "AU",
    },
    startDate: "2023-07-26",
    tags: ["park", "playground", "nature play", "outdoors"],
    imageURL:
      "https://images.squarespace-cdn.com/content/v1/58813c79f7e0ab55271bb525/1690351968874-DPRMX09MCZUIE9FQJSWG/aj+davis+reserve+playground%2C+airport+west+-+copyright+2023+mamma+knows+melbourne.jpg?format=300w",
  },
  {
    name: "2018 top ten parks",
    description:
      "Tag page listing posts about parks and playgrounds selected as '2018 top ten parks' on Mamma Knows North. The page contains multiple park reviews (titles, dates, images, short excerpts) rather than a single activity entry.",
    tags: ["park", "playground", "2018 top ten parks", "parks and playgrounds"],
    imageURL:
      "https://images.squarespace-cdn.com/content/v1/58813c79f7e0ab55271bb525/b2f2e84e-4829-4119-8286-f9c7da415793/MAMMA-KNOWS-north-LG_CIRCLE.png",
  },
  {
    name: "Derby St Reserve, Tullamarine",
    description:
      "Derby St Reserve in Tullamarine is so much more than a playground! This spot also has a large BMX track, tennis and basketball/netball/futsal courts, and even an outdoor gym for adults to enjoy a workout.",
    location: {
      name: "Derby St Reserve",
      city: "Tullamarine",
      country_code: "AU",
    },
    startDate: "2025-06-05",
    tags: [
      "park",
      "playground",
      "bmx",
      "bike track",
      "tennis",
      "basketball",
      "futsal",
      "outdoor gym",
    ],
    imageURL:
      "https://images.squarespace-cdn.com/content/v1/58813c79f7e0ab55271bb525/1749446649542-FKWVOMAW07TF75DA38HO/Untitled+design+%286%29.jpg?format=300w",
  },
  {
    name: "Castlemaine Botanical Gardens Playground, Castlemaine",
    description:
      "Nestled in the gorgeous surrounds of Castlemaine Botanical Gardens is a beautiful and spacious playground. An enormous acorn tree is the centrepiece with lots of unique and natural play equipment circling out from the base, plenty of picnic tables and some BBQs.",
    location: {
      name: "Castlemaine Botanical Gardens",
      city: "Castlemaine",
      country_code: "AU",
    },
    startDate: "2023-06-16",
    tags: ["park", "playground", "botanical gardens", "road trip", "outdoors"],
    imageURL:
      "https://images.squarespace-cdn.com/content/v1/58813c79f7e0ab55271bb525/1686922397796-E8E5G5B7J9K70SVWP6O4/castlemaine+botanical+gardens+playground%2C+castlemaine+-+copyright+2023+mamma+knows+melbourne-4.jpg?format=300w",
  },
  {
    name: "Aspect's Destination Drive Park, Greenvale",
    description:
      "Aspect's park has everything you could ever want in a community park and more.",
    location: {
      name: "Aspect's Destination Drive Park, Greenvale",
      city: "Greenvale",
      country_code: "AU",
    },
    startDate: "2017-05-11",
    tags: ["park", "playground", "community"],
    imageURL:
      "https://images.squarespace-cdn.com/content/v1/58813c79f7e0ab55271bb525/1556145420324-ZFJJ2ZA30EWSXC5NGFE5/Destination+Drive+-+Mamma+Knows+North+%2814+of+14%29.jpg?format=300w",
  },
  {
    name: "Melbourne picnics — parks and playgrounds",
    description:
      "Mamma Knows North explores Melbourne's North - it is an amazing place to live with a vibrant community and so many great cafe's, parks and adventures to be had. Check out Mamma Knows Norths adventures and get inspired to EXPLORE!",
    location: {
      name: "Mamma Knows North",
      formattedAddress: "Melbourne, Australia",
      city: "Melbourne",
      country_code: "AU",
    },
    tags: ["park", "playground", "melbourne picnics", "the great outdoors"],
    imageURL:
      "https://images.squarespace-cdn.com/content/v1/58813c79f7e0ab55271bb525/b2f2e84e-4829-4119-8286-f9c7da415793/MAMMA-KNOWS-north-LG_CIRCLE.png?format=1500w",
  },
  {
    name: "Lynnwood Reserve, Templestowe Lower",
    description:
      "It’s so cute! A little playground for a pitstop and a run around. Lynnwood Reserve in Templestowe Lower has had a refresh and is especially great for kinder-aged children. Small play equipment, open space and suitable for short visits.",
    location: {
      name: "Lynnwood Reserve",
      city: "Templestowe Lower",
      country_code: "AU",
    },
    startDate: "2020-06-21",
    tags: [
      "park",
      "playground",
      "local playgrounds",
      "melbourne with kids",
      "the great outdoors",
      "Manningham Playgrounds",
    ],
    imageURL:
      "https://images.squarespace-cdn.com/content/v1/58813c79f7e0ab55271bb525/1592692085629-6MKSPBFUFK2RGF1GRXW1/Lynnwood+Reserve+-+Mamma+Knows+East+%2810+of+11%29.jpg?format=300w",
  },
  {
    name: "Melbourne nature play",
    description:
      "Mamma Knows North explores Melbourne's North - it is an amazing place to live with a vibrant community and so many great cafe's, parks and adventures to be had. Check out Mamma Knows Norths adventures and get inspired to EXPLORE!",
    tags: ["park", "playground", "nature play", "melbourne", "family"],
    imageURL:
      "https://images.squarespace-cdn.com/content/v1/58813c79f7e0ab55271bb525/b2f2e84e-4829-4119-8286-f9c7da415793/MAMMA-KNOWS-north-LG_CIRCLE.png",
  },
  {
    name: "Bedford St Pocket Park, North Melbourne",
    description:
      "This brand-new park in North Melbourne is perfect for a day out, with lots of green space for picnics, ball games, or just getting away from the city's hustle.",
    location: {
      name: "Bedford St Pocket Park",
      city: "North Melbourne",
      country_code: "AU",
    },
    startDate: "2025-01-17",
    tags: ["park", "playground", "bbq", "picnic"],
    imageURL:
      "https://images.squarespace-cdn.com/content/v1/58813c79f7e0ab55271bb525/846b3d1b-ac74-4784-bc53-0a3c0e52e8c8/Bedford+St+Pocket+Park+Mamma+Knows+North+Copyright.jpg?format=300w",
  },
  {
    name: "Austin Crescent Reserve Playground, Pascoe Vale",
    description:
      "Looking for a playground for your next catch up with friends? Mamma’s got you covered with Austin Crescent Reserve Playground. There’s a car park, walking trails from the train station and bike paths all leading to this great playground in Pascoe Vale, it’s easy access for all. And the kids are going to love it!",
    location: {
      name: "Austin Crescent Reserve",
      city: "Pascoe Vale",
      country_code: "AU",
    },
    startDate: "2024-10-29",
    tags: ["park", "playground", "family", "outdoors"],
    imageURL:
      "https://images.squarespace-cdn.com/content/v1/58813c79f7e0ab55271bb525/1730166642745-VM3GWJBSRC5731LRL0DI/austin+crescent+playground+grid.jpg?format=300w",
  },
  {
    name: "Anderson Reserve, Coburg",
    description:
      "Bright, recently upgraded toddler playground that is fully fenced. Suitable for toddlers and young children; fresh equipment and a secure fenced area. (Excerpt from the site: “Here’s one of those perfect toddler playgrounds! It’s bright, fresh, recently upgraded and it’s fully FENCED!”)",
    location: {
      name: "Anderson Reserve",
      city: "Coburg",
      country_code: "AU",
    },
    startDate: "2020-06-07",
    tags: [
      "park",
      "playground",
      "toddler playground",
      "fenced playground",
      "nature play",
      "local playgrounds",
    ],
    imageURL:
      "https://images.squarespace-cdn.com/content/v1/58813c79f7e0ab55271bb525/1591506944725-MFEN4FWJLEBCNZ0NE7DI/excerpt+anderson+reserve.jpg?format=300w",
  },
  {
    name: "Moomba Park Reserve, Fawkner",
    description:
      "This recently upgraded playground is cute and colourful. The best part is that it’s set between a leash-less dog oval and walking/bike paths, and a nearby staircase leads down to the Merri Creek Trail.",
    location: {
      name: "Moomba Park Reserve",
      city: "Fawkner",
    },
    startDate: "2021-08-13",
    tags: [
      "park",
      "playground",
      "great outdoors",
      "family adventures",
      "bike track",
      "merri creek trail",
      "new playgrounds",
    ],
    imageURL:
      "https://images.squarespace-cdn.com/content/v1/58813c79f7e0ab55271bb525/1628826249537-KM1455PHOTSOO9J2JG02/moomba+park+excerpt.jpg?format=300w",
  },
  {
    name: "Anderson Reserve, Coburg",
    description:
      "Here’s one of those perfect toddler playgrounds! It’s bright, fresh, recently upgraded and it’s fully fenced.",
    location: {
      name: "Anderson Reserve",
      city: "Coburg",
      country_code: "AU",
    },
    startDate: "2020-06-07",
    tags: [
      "park",
      "playground",
      "toddler playground",
      "fenced playground",
      "nature play",
      "local playgrounds",
    ],
    imageURL:
      "https://images.squarespace-cdn.com/content/v1/58813c79f7e0ab55271bb525/1591506944725-MFEN4FWJLEBCNZ0NE7DI/excerpt+anderson+reserve.jpg?format=300w",
  },
  {
    name: "Ceres Playspace: Terra Wonder, Brunswick East",
    description:
      "This awesome and incredibly unique play space re-opened late last year with a very cool new addition — a ginormous millipede. Family-friendly nature play at CERES with community and food elements noted in tags.",
    location: {
      name: "CERES Playspace (Terra Wonder)",
      city: "Brunswick East",
      country_code: "AU",
    },
    startDate: "2021-01-26",
    tags: [
      "park",
      "playground",
      "nature play",
      "family",
      "sustainable food",
      "support local",
      "melbourne",
    ],
    imageURL:
      "https://images.squarespace-cdn.com/content/v1/58813c79f7e0ab55271bb525/1611630712355-T85MC7LIXX3V5TTMOLMN/terra+wonder+excerpt.jpg?format=300w",
  },
  {
    name: "Balfe Park, Brunswick East",
    description:
      "A cute little newly upgraded playground with an off-lead dog oval.",
    location: {
      name: "Balfe Park",
      city: "Brunswick East",
      country_code: "AU",
    },
    startDate: "2021-03-01",
    tags: [
      "park",
      "playground",
      "melbourne with kids",
      "the great outdoors",
      "melbourne playgrounds",
      "melbourne picnics",
    ],
    imageURL:
      "https://images.squarespace-cdn.com/content/v1/58813c79f7e0ab55271bb525/1614568327255-ZB36COWSOA10OCNLN10V/balfe+park+excerpt+.jpg?format=300w",
  },
  {
    name: "Birrarung Marr Playground, Melbourne",
    description:
      "City adventures could not be any more fun! Birrarung Marr Playground is situated in the heart of the city. Article excerpt describes it as a family-friendly city playground; see full post for details.",
    location: {
      name: "Birrarung Marr Playground",
      formattedAddress: "Melbourne, Australia",
      city: "Melbourne",
      country_code: "AU",
    },
    startDate: "2019-02-25",
    tags: ["park", "playground", "family", "outdoors"],
    imageURL:
      "https://images.squarespace-cdn.com/content/v1/58813c79f7e0ab55271bb525/1549961694557-BZT0M9C63CL8M7HAJTD4/birrarung+front.jpg?format=300w",
  },
  {
    name: "Lavender Rain Park, Donnybrook",
    description:
      "How cool is this?! With a 4-level climbing tower, giant slide, basketball court and other fun equipment, the Lavender Rain Park in Donnybrook is a playground to visit.",
    location: {
      name: "Lavender Rain Park",
      city: "Donnybrook",
      country_code: "AU",
    },
    startDate: "2025-06-12",
    tags: ["park", "playground", "basketball courts", "playgrounds"],
  },
  {
    name: "AJ Davis Reserve playground, Airport West",
    description:
      "There is a new playground at AJ Davis Reserve in Airport West. A unique, multi-level hillside playground with lots of natural play elements. Suitable for families and children; features natural play, climbing and varied levels.",
    location: {
      name: "AJ Davis Reserve",
      city: "Airport West",
      country_code: "AU",
    },
    startDate: "2023-07-26",
    tags: [
      "park",
      "playground",
      "natural play",
      "family",
      "awesome playgrounds",
      "melbourne with kids",
    ],
    imageURL:
      "https://images.squarespace-cdn.com/content/v1/58813c79f7e0ab55271bb525/1690351968874-DPRMX09MCZUIE9FQJSWG/aj+davis+reserve+playground%2C+airport+west+-+copyright+2023+mamma+knows+melbourne.jpg?format=300w",
  },
  {
    name: "Banyule Playgrounds",
    tags: ["park", "playground", "family", "outdoors"],
    imageURL:
      "https://images.squarespace-cdn.com/content/v1/58813c79f7e0ab55271bb525/b2f2e84e-4829-4119-8286-f9c7da415793/MAMMA-KNOWS-north-LG_CIRCLE.png?format=1500w",
  },
  {
    name: "Coburg Lake Reserve, Coburg North",
    description:
      "Wow! Wow! Wow! If it's fun, exciting and all about adventure you are looking for, then this place is for you. Coburg Lake Reserve is perfect for the WHOLE family.",
    location: {
      name: "Coburg Lake Reserve",
      city: "Coburg North",
      country_code: "AU",
    },
    startDate: "2023-08-02",
    tags: ["park", "playground", "family", "adventure", "australia day 2019"],
    imageURL:
      "https://images.squarespace-cdn.com/content/v1/58813c79f7e0ab55271bb525/1691039180872-TEU0SC4GBOY1XRJJROLI/coburg+lake+reserve%2C+coburg+north+-+copyright+2023+mamma+knows+melbourne-9.jpg?format=300w",
  },
  {
    name: "Coburg Lake Reserve Coburg North",
    description:
      "Coburg Lake Reserve in Coburg North is described as a fun, exciting and adventure-filled lakeside reserve suitable for the whole family. The article highlights the park as a great place for family outings and adventurous play.",
    location: {
      name: "Coburg Lake Reserve",
      formattedAddress: "Melbourne, Australia",
      city: "Melbourne",
      country_code: "AU",
    },
    startDate: "2023-08-02",
    tags: ["park", "playground", "family", "lake", "outdoors", "adventure"],
    imageURL:
      "https://images.squarespace-cdn.com/content/v1/58813c79f7e0ab55271bb525/1691039180872-TEU0SC4GBOY1XRJJROLI/coburg+lake+reserve%2C+coburg+north+-+copyright+2023+mamma+knows+melbourne-9.jpg?format=300w",
  },
  {
    name: "Alistair Knox Park, Eltham",
    description:
      "The Alistair Knox Reserve in Eltham is a hub for community life.",
    location: {
      name: "Alistair Knox Reserve",
      city: "Eltham",
      country_code: "AU",
    },
    startDate: "2017-07-05",
    tags: ["park", "playground", "parks and playgrounds", "north playgrounds"],
    imageURL:
      "https://images.squarespace-cdn.com/content/v1/58813c79f7e0ab55271bb525/1499214796334-ZTYMYJXVQG1TN6B14AD3/alisterfront.jpg?format=300w",
  },
  {
    name: "CB Smith Reserve, Fawkner",
    description:
      "CB Smith Reserve in Fawkner has had a glow up. New double climbing tower, massive sandpit, a set of four swings plus a rope web swing, floor spinner and musical flowers. Family-friendly playground with equipment for a range of ages.",
    location: {
      name: "CB Smith Reserve",
      formattedAddress: "Fawkner, Melbourne, Australia",
      city: "Fawkner",
      country_code: "AU",
    },
    startDate: "2025-03-06",
    tags: [
      "park",
      "playground",
      "family",
      "outdoors",
      "wetlands",
      "new-playgrounds",
    ],
    imageURL:
      "https://images.squarespace-cdn.com/content/v1/58813c79f7e0ab55271bb525/1741222534232-B2NV9JBKKK3C6ANGK6I8/CB+Smith+Reserve+Fawkner-3.jpg?format=300w",
  },
  {
    name: "Bollygum Park Playground, Kinglake",
    description:
      "This Mamma’s eyes almost popped out as we passed this magnificent playspace in the heart of Kinglake. Short article excerpt from Mamma Knows North describing the notable playspace. Published January 28, 2022 by Mandy Couzens.",
    location: {
      name: "Bollygum Park",
      city: "Kinglake",
      country_code: "AU",
    },
    startDate: "2022-01-28",
    tags: ["park", "playground", "bollygum", "family", "road trip"],
    imageURL:
      "https://images.squarespace-cdn.com/content/v1/58813c79f7e0ab55271bb525/1644377630829-3K6SP0RT5JQO591AEW57/01+Copyright+Mamma+Knows+East+-+Bollygum+Park%2C+Kinglake+%281+of+18%29.jpg?format=300w",
  },
  {
    name: "Sycamore Bicycle Track, Mill Park",
    description:
      "The brand new upgraded bicycle track at Sycamore Reserve is a large, all‑weather track suitable for a range of skill levels from beginners to experienced BMX riders. Upgrades include a replaced pavilion, resurfacing, a starter gate and track lighting. The track is shared with The Northern BMX Club and has allocated usage times; public access is only at listed times. Little riders can use separate areas but active supervision is required. Public open times listed on the page: Mon, Wed & Fri 7am–4pm; Tue 7am–6pm; Sat 1pm–6pm; Sun 7am–6pm.",
    location: {
      name: "Sycamore Recreation Reserve, Mill Park",
      formattedAddress:
        "Sycamore Recreation Reserve, Mill Park, Melbourne, Australia",
      city: "Mill Park",
      country_code: "AU",
    },
    startDate: "2021-08-01",
    tags: [
      "park",
      "playground",
      "bike education track",
      "traffic park",
      "bmx track",
      "scooter track",
      "bike track",
      "bicycle track",
      "outdoors",
      "family",
    ],
    imageURL:
      "https://images.squarespace-cdn.com/content/v1/58813c79f7e0ab55271bb525/1627788334599-F28FKNO1723U9W1UWI96/sycamore+reserve+bicycle+track+mill+park-2.jpg",
  },
  {
    name: "Howitt Park Playground, Bright",
    description:
      "Playgrounds don’t get much more stunning than this. This largely timber adventure playground sits on the banks of the Ovens River and is surrounded by the grand old trees that Bright is famous for, changing their glorious colours as the seasons pass.",
    location: {
      name: "Howitt Park Playground",
      formattedAddress: "Bright, Australia",
      city: "Bright",
      country_code: "AU",
    },
    startDate: "2021-05-31",
    tags: [
      "park",
      "playground",
      "outdoors",
      "family",
      "picnic",
      "new-playground",
    ],
    imageURL:
      "https://images.squarespace-cdn.com/content/v1/58813c79f7e0ab55271bb525/1621821579894-UUBL9I1XEOVS9T9OUVM6/Centenary+Park+Bright++2021+Copyright+Mamma+Knows+Melbourne+%2837+of+37%29.jpg?format=300w",
  },
  {
    name: "Norris Bank Playground, Bundoora",
    description:
      "Mamma thinks she might have found a playground that has it all! Read the full article: https://mammaknowsnorth.com.au/parks-and-playgrounds/norris-bank-playground-bundoora",
    location: {
      name: "Norris Bank Playground",
      formattedAddress: "Bundoora, Melbourne, Australia",
      city: "Bundoora",
      country_code: "AU",
    },
    startDate: "2024-02-01",
    tags: ["park", "playground", "outdoors", "family"],
    imageURL:
      "https://images.squarespace-cdn.com/content/v1/58813c79f7e0ab55271bb525/1706755800479-Q86ZSTW7JWUYELH94ARU/norris+bank+reserve.jpg?format=300w",
  },
  {
    name: "Romsey Ecotherapy Park",
    description:
      "A very sweet nature space for all ages! (excerpt from Mamma Knows North). Page tags include playgrounds, melbourne with kids, romsey community and road trip.",
    location: {
      name: "Romsey Ecotherapy Park",
      city: "Romsey",
      country_code: "AU",
    },
    startDate: "2020-03-01",
    tags: [
      "park",
      "playground",
      "nature",
      "family",
      "road-trip",
      "melbourne-with-kids",
    ],
    imageURL:
      "https://images.squarespace-cdn.com/content/v1/58813c79f7e0ab55271bb525/1583046319616-X7X6ZNBO57JGBWG88F4G/romsey+ecotherapy+excerpt.jpg?format=300w",
  },
  {
    name: "Derby St Reserve, Tullamarine",
    description:
      "Derby St Reserve in Tullamarine features a playground plus a large BMX/bike track, tennis courts, basketball/netball/futsal courts and an outdoor gym. Suitable for a range of ages; active supervision required. Article notes multiple facilities and invites readers to 'Read More'.",
    location: {
      name: "Derby St Reserve, Tullamarine",
      city: "Tullamarine",
      country_code: "AU",
    },
    startDate: "2025-06-05",
    tags: [
      "park",
      "playground",
      "bmx",
      "bicycle track",
      "tennis",
      "basketball",
      "futsal",
      "outdoor gym",
    ],
    imageURL:
      "https://images.squarespace-cdn.com/content/v1/58813c79f7e0ab55271bb525/1749446649542-FKWVOMAW07TF75DA38HO/Untitled+design+%286%29.jpg?format=300w",
  },
  {
    name: "Anderson Reserve, Coburg",
    description:
      "One of those perfect toddler playgrounds — bright, fresh, recently upgraded and fully fenced. Family-friendly, suitable for toddlers; includes fenced play areas and toddler equipment.",
    location: {
      name: "Anderson Reserve",
      city: "Coburg",
      country_code: "AU",
    },
    startDate: "2020-06-07",
    tags: ["park", "playground", "toddler", "fenced", "nature play", "local"],
    imageURL:
      "https://images.squarespace-cdn.com/content/v1/58813c79f7e0ab55271bb525/1591506944725-MFEN4FWJLEBCNZ0NE7DI/excerpt+anderson+reserve.jpg?format=300w",
  },
  {
    name: "Aston Fields Playground, Craigieburn",
    description:
      "Peet has done it again with this little beauty in Craigieburn! Read More",
    location: {
      name: "Aston Fields Playground",
      city: "Craigieburn",
      state_province: "VIC",
      country_code: "AU",
    },
    startDate: "2024-01-12",
    tags: ["park", "playground", "top ten parks", "family", "outdoor"],
    imageURL:
      "https://images.squarespace-cdn.com/content/v1/58813c79f7e0ab55271bb525/1704867013551-5IIE6A0US7W8DNMQSZ7Q/aston+fields.jpg?format=300w",
  },
  {
    name: "Sycamore bicycle track, Mill Park",
    description:
      "The brand new upgraded bicycle track at Sycamore Reserve offers an all‑weather surface, a starter gate and track lighting after pavilion replacement. The track suits a range of abilities — from BMX riders to less experienced cyclists — and is large enough for beginners to use without disrupting more skilled riders; active supervision is recommended. The track is shared with the Northern BMX Club which has allocated usage times; it is open to the public at other listed times. Mamma's special mention: Mill Park All Abilities Play Space is nearby. Facilities: toilets (including accessible toilets) and on-site car parking. Track to be used during daylight hours only. Public open times: Mon, Wed & Fri 7am-4pm; Tue 7am-6pm; Sat 1pm-6pm; Sun 7am-6pm.",
    location: {
      name: "Sycamore Recreation Reserve, Mill Park",
      formattedAddress:
        "Sycamore Recreation Reserve, Mill Park, Melbourne, Australia",
      city: "Mill Park",
      country_code: "AU",
    },
    startDate: "2021-08-01",
    tags: [
      "park",
      "playground",
      "bmx",
      "bike track",
      "bicycle track",
      "scooter track",
      "outdoors",
      "family",
    ],
    imageURL:
      "https://images.squarespace-cdn.com/content/v1/58813c79f7e0ab55271bb525/1627788334599-F28FKNO1723U9W1UWI96/sycamore+reserve+bicycle+track+mill+park-2.jpg?format=750w",
  },
  {
    name: "fenced playgrounds",
    description:
      "Tag page listing fenced playgrounds on Mamma Knows North. Includes short posts/excerpts for fenced, family-friendly playgrounds such as Wylie Reserve Playground (Brunswick West) and Anderson Reserve (Coburg), highlighting upgrades, toddler suitability and that the sites are fully fenced.",
    tags: ["park", "playground", "fenced playgrounds"],
    imageURL:
      "https://images.squarespace-cdn.com/content/v1/58813c79f7e0ab55271bb525/1693131735551-Z8UE90WLZWM8NKYHP9C0/wylie+reserve+playground%2C+brunswick+west+-+mamma+knows+north+-+copyright-5.jpg?format=300w",
  },
  {
    name: "richards reserve pump track, coburg",
    description:
      "Pump tracks are great for when the kids want to go for a bike ride but mamma does not! The pump track here at Richards Reserve in Coburg is made up of 2 connected loops, like the number 8, meaning the kids can change up their route and makes for easy overtaking.",
    location: {
      name: "Richards Reserve",
      city: "Coburg",
      country_code: "AU",
    },
    startDate: "2024-09-24",
    tags: [
      "park",
      "playground",
      "pump track",
      "bike track",
      "bbq",
      "merri bek council",
    ],
    imageURL:
      "https://images.squarespace-cdn.com/content/v1/58813c79f7e0ab55271bb525/1727142926454-LDN73T2WPRRBX9YM11KS/Richards%2Breserve%2Bpump%2Btrack%2Bcoburg-8.jpg?format=300w",
  },
  {
    name: "Coburg Lake Reserve",
    description:
      "Wow! If it's fun, exciting and all about adventure you are looking for, then this place is for you. Coburg Lake Reserve is perfect for the whole family. (Excerpt from Mamma Knows North; see full article for details.)",
    location: {
      name: "Coburg Lake Reserve",
      city: "Coburg North",
      country_code: "AU",
    },
    startDate: "2023-08-02",
    tags: ["park", "playground", "family", "nature", "lake", "adventure"],
    imageURL:
      "https://images.squarespace-cdn.com/content/v1/58813c79f7e0ab55271bb525/1691039180872-TEU0SC4GBOY1XRJJROLI/coburg+lake+reserve%2C+coburg+north+-+copyright+2023+mamma+knows+melbourne-9.jpg?format=300w",
  },
  {
    name: "cross keys reserve, essendon",
    description:
      "Essendon has a brand new playground with equipment encouraging sensory, natural, imaginative and physical play. A family-friendly park offering varied play opportunities for children; see full article for more details.",
    location: {
      name: "Cross Keys Reserve",
      city: "Essendon",
      country_code: "AU",
    },
    startDate: "2023-08-21",
    tags: [
      "park",
      "playground",
      "sensory play",
      "natural play",
      "imaginative play",
      "family",
    ],
    imageURL:
      "https://images.squarespace-cdn.com/content/v1/58813c79f7e0ab55271bb525/1692524868181-UCNL9W7604UK3AND6SSE/cross+keys.jpg?format=300w",
  },
  {
    name: "Eltham Lower Park Playground, Eltham",
    description:
      "A fresh addition to Eltham Lower Park, this upgraded playspace is a great option for an easy park pit stop or the perfect place to set up for a party or family BBQ.",
    location: {
      name: "Eltham Lower Park Playground",
      formattedAddress: "Eltham, Melbourne, Australia",
      city: "Eltham",
      country_code: "AU",
    },
    startDate: "2025-08-08",
    tags: ["park", "playground", "family", "picnic", "playground upgrade"],
    imageURL:
      "https://images.squarespace-cdn.com/content/v1/58813c79f7e0ab55271bb525/1754616287717-24SYA9LUH23QWTQLFOB9/Copyright%2BMamma%2BKnows%2BNorth%2B-%2BLower%2BEltham%2BPark-4621.jpg?format=300w",
  },
  {
    name: "River Red Gum Avenue Playground, Bundoora",
    description:
      'Located in Bundoora Park this playground is a hidden treasure! Excerpt from page: "Located in Bundoora Park this playground is a hidden treasure!" Read more at the original article link.',
    location: {
      name: "Bundoora Park",
      city: "Bundoora",
      country_code: "AU",
    },
    startDate: "2024-02-22",
    tags: ["park", "playground"],
    imageURL:
      "https://images.squarespace-cdn.com/content/v1/58813c79f7e0ab55271bb525/1708565831127-8JI2VKSZ0EUJGAEO1F15/rivergum+drive.jpg?format=300w",
  },
  {
    name: "CB Smith Reserve, Fawkner",
    description:
      "CB Smith Reserve in Fawkner has recently been upgraded. Features include a new double climbing tower, a large sandpit, four swings, a rope-web swing, a floor spinner and musical play elements. Family-friendly playground suitable for a range of ages. No specific parking or accessibility details provided on the page.",
    location: {
      name: "CB Smith Reserve",
      formattedAddress: "Fawkner, VIC, Australia",
      city: "Fawkner",
      state_province: "VIC",
      country_code: "AU",
    },
    startDate: "2025-03-06",
    tags: [
      "park",
      "playground",
      "swings",
      "play equipment",
      "new playgrounds",
      "public spaces",
      "family adventures",
      "outdoors",
      "skate park",
      "wetlands",
      "shade",
    ],
    imageURL:
      "https://images.squarespace-cdn.com/content/v1/58813c79f7e0ab55271bb525/1741222534232-B2NV9JBKKK3C6ANGK6I8/CB+Smith+Reserve+Fawkner-3.jpg?format=300w",
  },
  {
    name: "Castlemaine Botanical Gardens Playground, Castlemaine",
    description:
      "Nestled in the gorgeous surrounds of Castlemaine Botanical Gardens is a beautiful and spacious playground. An enormous acorn tree is the centrepiece with lots of unique and natural play equipment circling out from the base, with plenty of picnic tables and some BBQs.",
    location: {
      name: "Castlemaine Botanical Gardens Playground",
      city: "Castlemaine",
    },
    startDate: "2023-06-16",
    tags: ["park", "playground", "botanical gardens", "road trip"],
    imageURL:
      "https://images.squarespace-cdn.com/content/v1/58813c79f7e0ab55271bb525/1686922397796-E8E5G5B7J9K70SVWP6O4/castlemaine+botanical+gardens+playground%2C+castlemaine+-+copyright+2023+mamma+knows+melbourne-4.jpg?format=300w",
  },
  {
    name: "Preston to Bell Playground & Public Spaces, Preston",
    description:
      "The playground and playspace between Preston and Bell Station is the latest within the Darebin Council area. Located between Bell Station and Preston Station the 3 storey climbing structure is a great way to spend the afternoon with family and friends.",
    location: {
      name: "Preston to Bell Playground & Public Spaces, Preston",
      formattedAddress: "Preston, Melbourne, Australia",
      city: "Preston",
      country_code: "AU",
    },
    startDate: "2024-01-02",
    tags: ["park", "playground", "playspace", "family"],
    imageURL:
      "https://images.squarespace-cdn.com/content/v1/58813c79f7e0ab55271bb525/1704166188723-A4QP34NR0EXBCMV2MZZC/preston+to+bell+.jpg?format=300w",
  },
  {
    name: "Darebin playgrounds (tag)",
    description:
      "Tag page listing parks and playground reviews around Darebin (Melbourne). The page aggregates multiple article excerpts (e.g., Preston, Northcote, Bundoora) with dates, authors, images and links to full posts about local playgrounds and park features.",
    location: {
      name: "Darebin / Melbourne area",
      formattedAddress: "Melbourne, Australia",
      city: "Melbourne",
      country_code: "AU",
    },
    tags: ["park", "playground", "family", "outdoors", "kids"],
    imageURL:
      "https://images.squarespace-cdn.com/content/v1/58813c79f7e0ab55271bb525/1704166188723-A4QP34NR0EXBCMV2MZZC/preston+to+bell+.jpg?format=300w",
  },
  {
    name: "Preston to Bell playground & public spaces, Preston",
    description:
      "The playground and playspace between Preston and Bell Station is the latest within the Darebin Council area. Located between Bell Station and Preston Station the three-storey climbing structure is a great way to spend the afternoon with family and friends.",
    location: {
      name: "Preston to Bell playground & public spaces, Preston",
      city: "Preston",
      country_code: "AU",
    },
    startDate: "2024-01-02",
    tags: ["park", "playground", "nature play", "climbing structure", "family"],
    imageURL:
      "https://images.squarespace-cdn.com/content/v1/58813c79f7e0ab55271bb525/1704166188723-A4QP34NR0EXBCMV2MZZC/preston+to+bell+.jpg?format=300w",
  },
  {
    name: "Edgar's Creek Trail",
    tags: ["park", "playground", "trail", "edgars creek"],
  },
  {
    name: "CB Smith Reserve, Fawkner",
    description:
      "CB Smith Reserve in Fawkner has had a glow up. Featured are a brand new double climbing tower, a massive sandpit, a set of four swings plus a rope web swing, floor spinner and musical flowers. Suitable as a family-friendly playground space with varied equipment for different ages.",
    location: {
      name: "CB Smith Reserve",
      city: "Fawkner",
      country_code: "AU",
    },
    startDate: "2025-03-06",
    tags: [
      "park",
      "playground",
      "wetlands",
      "outdoors",
      "family",
      "public spaces",
      "playgrounds",
    ],
    imageURL:
      "https://images.squarespace-cdn.com/content/v1/58813c79f7e0ab55271bb525/1741222534232-B2NV9JBKKK3C6ANGK6I8/CB+Smith+Reserve+Fawkner-3.jpg?format=300w",
  },
  {
    name: "Howitt Park Playground, Bright",
    description:
      "Playgrounds don’t get much more stunning than this. This largely timber adventure playground sits on the banks of the Ovens River and is surrounded by the grand old trees that Bright is famous for - changing their glorious colours as the seasons pass.",
    location: {
      name: "Howitt Park Playground, Bright",
    },
    startDate: "2021-05-31",
    tags: [
      "park",
      "playground",
      "family",
      "outdoors",
      "picnic",
      "road-trip",
      "new-playgrounds",
      "high-country",
    ],
    imageURL:
      "https://images.squarespace-cdn.com/content/v1/58813c79f7e0ab55271bb525/1621821579894-UUBL9I1XEOVS9T9OUVM6/Centenary+Park+Bright++2021+Copyright+Mamma+Knows+Melbourne+%2837+of+37%29.jpg?format=300w",
  },
  {
    name: "CB Smith Reserve, Fawkner",
    description:
      "CB Smith Reserve in Fawkner has been recently upgraded with a new double climbing tower, a large sandpit, four swings plus a rope-web swing, a floor spinner and musical flowers. Family-friendly playground with varied play equipment suitable for young children; amenities and parking details not listed on the page.",
    location: {
      name: "CB Smith Reserve",
      city: "Fawkner",
      country_code: "AU",
    },
    startDate: "2025-03-06",
    tags: [
      "park",
      "playground",
      "family",
      "outdoors",
      "new playground",
      "skate park",
      "public space",
    ],
    imageURL:
      "https://images.squarespace-cdn.com/content/v1/58813c79f7e0ab55271bb525/1741222534232-B2NV9JBKKK3C6ANGK6I8/CB+Smith+Reserve+Fawkner-3.jpg?format=300w",
  },
  {
    name: "ceres playspace: terra wonder, brunswick east",
    description:
      "This awesome and incredibly unique play space re-opened late last year with a very cool new addition - a GINORMOUS millipede! Located in Brunswick East. (Excerpt from Mamma Knows North article.)",
    location: {
      name: "CERES Community Environment Park (Ceres Playspace)",
      city: "Brunswick East",
      country_code: "AU",
    },
    startDate: "2021-01-26",
    tags: [
      "park",
      "playground",
      "nature play",
      "terra wonder",
      "millipede",
      "family",
      "outdoor",
    ],
    imageURL:
      "https://images.squarespace-cdn.com/content/v1/58813c79f7e0ab55271bb525/1611630712355-T85MC7LIXX3V5TTMOLMN/terra+wonder+excerpt.jpg?format=300w",
  },
  {
    name: "Cardinal Road Playground, Glenroy",
    description:
      "Fenced playground featuring water play, shaded picnic tables, fitness equipment, an in-ground trampoline, a triple swing set and a climbing frame. Family-friendly outdoor play space suitable for young children.",
    location: {
      name: "Cardinal Road Playground",
      city: "Glenroy",
      country_code: "AU",
    },
    startDate: "2022-07-25",
    tags: [
      "park",
      "playground",
      "water play",
      "family-friendly",
      "outdoor",
      "nature play",
    ],
    imageURL:
      "https://images.squarespace-cdn.com/content/v1/58813c79f7e0ab55271bb525/1658723781533-3DWNE5C1E98QYR9CQDHB/cardinal+road+playground+.jpg?format=300w",
  },
  {
    name: "Symon Crescent Playground, Thomastown",
    description:
      "Well isn’t this just a gorgeous little place to play! There’s a flying fox and climbing frame attached to a fort that includes a slide, fireman's pole and a shop front underneath. There’s also a double slide, octopus rocker, a swing set and a merry go round. The rock steps and balancing logs are fun to climb as well.",
    location: {
      name: "Symon Crescent Playground",
      city: "Thomastown",
      state_province: "VIC",
      country_code: "AU",
    },
    startDate: "2025-01-19",
    tags: ["park", "playground", "bike track", "trail", "family-friendly"],
    imageURL:
      "https://images.squarespace-cdn.com/content/v1/58813c79f7e0ab55271bb525/1737196428014-5WPOSZ7E1HY5B8XWKID3/20250118_213145.jpg?format=300w",
  },
  {
    name: "Howitt Park playground, Bright",
    description:
      "Playgrounds don’t get much more stunning than this. This largely timber adventure playground sits on the banks of the Ovens River and is surrounded by the grand old trees that Bright is famous for, changing their glorious colours as the seasons pass.",
    location: {
      name: "Howitt Park playground, Bright",
      city: "Bright",
      country_code: "AU",
    },
    startDate: "2021-05-31",
    tags: [
      "park",
      "playground",
      "the great outdoors",
      "family",
      "picnic",
      "road trip",
      "bright",
      "howitt park",
      "centenary park",
      "high country",
      "melbourne",
    ],
    imageURL:
      "https://images.squarespace-cdn.com/content/v1/58813c79f7e0ab55271bb525/1621821579894-UUBL9I1XEOVS9T9OUVM6/Centenary+Park+Bright++2021+Copyright+Mamma+Knows+Melbourne+%2837+of+37%29.jpg?format=300w",
  },
  {
    name: "Balfe Park, Brunswick East",
    description:
      "A cute little newly upgraded playground with an off-lead dog oval.",
    location: {
      name: "Balfe Park, Brunswick East",
      city: "Brunswick East",
      country_code: "AU",
    },
    startDate: "2021-03-01",
    tags: [
      "park",
      "playground",
      "dragon sculpture",
      "family",
      "dog-friendly",
      "picnic",
    ],
    imageURL:
      "https://images.squarespace-cdn.com/content/v1/58813c79f7e0ab55271bb525/1614568327255-ZB36COWSOA10OCNLN10V/balfe+park+excerpt+.jpg?format=300w",
  },
  {
    name: "delta reserve playground & bike education track, greensborough",
    description:
      "We love this newly upgraded, unassuming little spot! The bike education track/traffic park section is heaps of fun with bike and scooter tracks, a roundabout, pedestrian crossing, give way and stop signs and petrol station pumps. It’s educational and fun!",
    location: {
      name: "Delta Reserve Playground & Bike Education Track, Greensborough",
      city: "Greensborough",
      country_code: "AU",
    },
    startDate: "2021-07-11",
    tags: [
      "park",
      "playground",
      "bike education track",
      "traffic park",
      "scooter track",
      "bike track",
      "outdoors",
      "family",
      "picnics",
    ],
    imageURL:
      "https://images.squarespace-cdn.com/content/v1/58813c79f7e0ab55271bb525/1625982430868-5YBWYWQFF6KQQU31B334/excerpt+delta+reserve.jpg?format=300w",
  },
  {
    name: "Anderson Reserve, Coburg",
    description:
      "Here’s one of those perfect toddler playgrounds! It’s bright, fresh, recently upgraded and it’s fully fenced. Suitable for toddlers and families. (Excerpt from Mamma Knows North article.)",
    location: {
      name: "Anderson Reserve, Coburg",
      city: "Coburg",
    },
    startDate: "2020-06-07",
    tags: [
      "park",
      "playground",
      "toddler playground",
      "fenced playground",
      "nature play",
      "local playgrounds",
    ],
    imageURL:
      "https://images.squarespace-cdn.com/content/v1/58813c79f7e0ab55271bb525/1591506944725-MFEN4FWJLEBCNZ0NE7DI/excerpt+anderson+reserve.jpg?format=300w",
  },
  {
    name: "castlemaine botanical gardens playground, castlemaine",
    description:
      "Nestled in the gorgeous surrounds of Castlemaine Botanical Gardens is a beautiful, spacious playground. An enormous acorn tree is the centrepiece with lots of unique natural play equipment, plenty of picnic tables and BBQs. Suitable for family visits and short road trips.",
    location: {
      name: "Castlemaine Botanical Gardens",
      city: "Castlemaine",
      country_code: "AU",
    },
    startDate: "2023-06-16",
    tags: ["park", "playground", "botanical gardens", "family", "road trip"],
    imageURL:
      "https://images.squarespace-cdn.com/content/v1/58813c79f7e0ab55271bb525/1686922397796-E8E5G5B7J9K70SVWP6O4/castlemaine+botanical+gardens+playground%2C+castlemaine+-+copyright+2023+mamma+knows+melbourne-4.jpg?format=300w",
  },
  {
    name: "Bushranger Drive Playground, Sunbury",
    description:
      'Excerpt from page: "Located in Bundoora Park this playground is a hidden treasure!" Full article available at the linked page for more details.',
    location: {
      name: "Bushranger Drive Playground",
      city: "Sunbury",
    },
    startDate: "2024-02-28",
    tags: ["park", "playground", "playgrounds", "hume", "outdoors", "kids"],
    imageURL:
      "https://images.squarespace-cdn.com/content/v1/58813c79f7e0ab55271bb525/1709084551869-QDUT6YWUDJDE0IXBM9XY/Bushranger+Drive+Sunbury+Mamma+Knows+West-13.jpg?format=300w",
  },
  {
    name: "Ceres playspace: Terra Wonder, Brunswick East",
    description:
      "This unique play space re-opened recently with a very large millipede feature. The excerpt highlights a distinctive nature-play area suitable for children and families; follow the article link for full details.",
    location: {
      name: "CERES Community Environment Park",
      formattedAddress: "Melbourne, Australia",
      city: "Melbourne",
      country_code: "AU",
    },
    startDate: "2021-01-26",
    tags: ["park", "playground", "nature play", "family", "millipede"],
    imageURL:
      "https://images.squarespace-cdn.com/content/v1/58813c79f7e0ab55271bb525/1611630712355-T85MC7LIXX3V5TTMOLMN/terra+wonder+excerpt.jpg?format=300w",
  },
  {
    name: "easter 19 — parks and playgrounds — mamma knows north",
    description:
      "Mamma Knows North explores Melbourne's North - it is an amazing place to live with a vibrant community and so many great cafe's, parks and adventures to be had. Check out Mamma Knows Norths adventures and get inspired to EXPLORE!",
    tags: ["park", "playground", "easter 19", "parks and playgrounds"],
    imageURL:
      "https://images.squarespace-cdn.com/content/v1/58813c79f7e0ab55271bb525/b2f2e84e-4829-4119-8286-f9c7da415793/MAMMA-KNOWS-north-LG_CIRCLE.png?format=1500w",
  },
  {
    name: "CERES playspace: Terra Wonder, Brunswick East",
    description:
      "A unique play space at CERES (Terra Wonder) that re-opened with a large new millipede feature. Family-friendly nature play area suitable for children; noted for imaginative play and outdoors exploration.",
    location: {
      name: "CERES playspace (Terra Wonder)",
      city: "Brunswick East",
      country_code: "AU",
    },
    startDate: "2021-01-26",
    tags: [
      "park",
      "playground",
      "nature play",
      "millipede",
      "sustainable food",
      "support local",
      "family",
    ],
    imageURL:
      "https://images.squarespace-cdn.com/content/v1/58813c79f7e0ab55271bb525/1611630712355-T85MC7LIXX3V5TTMOLMN/terra+wonder+excerpt.jpg?format=300w",
  },
  {
    name: "CB Smith Reserve, Fawkner",
    description:
      "CB Smith Reserve in Fawkner has had a glow up and now features a brand new double climbing tower, massive sandpit, a set of four swings plus a rope web swing, floor spinner and musical flowers. Suitable for families and young children.",
    location: {
      name: "CB Smith Reserve",
      city: "Fawkner",
      country_code: "AU",
    },
    startDate: "2025-03-06",
    tags: [
      "park",
      "playground",
      "great outdoors",
      "family adventures",
      "new playgrounds",
      "public spaces",
      "wetlands",
      "skate park",
      "shade",
      "sandpit",
      "swings",
      "play equipment",
    ],
    imageURL:
      "https://images.squarespace-cdn.com/content/v1/58813c79f7e0ab55271bb525/1741222534232-B2NV9JBKKK3C6ANGK6I8/CB+Smith+Reserve+Fawkner-3.jpg?format=300w",
  },
  {
    name: "Splendour Circuit Playground, Diggers Rest",
    description:
      "There is a fun area for the kids to hang and climb, plus a great little track around the outside of the park and grassy areas, which is perfect for scooters and bikes. So while the kiddies are off doing that, YOU can have a play on all the workout equipment.",
    location: {
      name: "Splendour Circuit Playground",
      city: "Diggers Rest",
      country_code: "AU",
    },
    startDate: "2019-06-24",
    tags: ["park", "playground", "playgrounds", "splendour circuit"],
    imageURL:
      "https://images.squarespace-cdn.com/content/v1/58813c79f7e0ab55271bb525/1561360453416-3EHIYU8GX0M8OPBAP8PH/splendour+excerpt.jpg?format=300w",
  },
  {
    name: "Clarinda Park Playspace, Essendon",
    description:
      "Well folks, the cutest little play space in Essendon has expanded, and Mamma sure isn’t mad about it! Clarinda Park Playspace is small, but mighty - mighty fun for your little ones! The space sparks fun and adventure through a huge range of equipment and nature play, including a 4-way animal themed springer, high rope climb, bright coloured cluster climbers, and a humongous sand pit - so fun!",
    location: {
      name: "Clarinda Park Playspace",
      city: "Essendon",
      country_code: "AU",
    },
    startDate: "2025-07-19",
    tags: ["park", "playground", "nature play", "sand pit"],
    imageURL:
      "https://images.squarespace-cdn.com/content/v1/58813c79f7e0ab55271bb525/1753233986836-P71NC9LZALAILHQIKRYO/Clarinda+Park+Playspace+Essendon+Copyright+Mamma+Knows-5.jpg?format=300w",
  },
  {
    name: "Eltham North Adventure Playground, Eltham North",
    description:
      "Yes it’s back! Back again! Eltham North Adventure Playground has returned and, as expected, it’s bigger and better than ever. (Source: Mamma Knows North article summary.)",
    location: {
      name: "Eltham North Adventure Playground",
      formattedAddress: "Eltham North, Melbourne, Australia",
      city: "Eltham North",
      country_code: "AU",
    },
    startDate: "2018-12-19",
    tags: ["park", "playground", "outdoors", "family"],
    imageURL:
      "https://images.squarespace-cdn.com/content/v1/58813c79f7e0ab55271bb525/1545214994364-WGTRJNAIA7WPMU2OTFME/Eltham+North+Adventure+Playground+2018+-+Mamma+Knows+East+%281+of+34%29.jpg?format=300w",
  },
  {
    name: "Livvi's Place Anzac Park Play Space, Craigieburn",
    description:
      "Anzac Park in Craigieburn: Where endless fun meets family-friendly amenities for a perfect day out!",
    location: {
      name: "Anzac Park",
      formattedAddress: "Anzac Park, Craigieburn, Melbourne, Australia",
      city: "Craigieburn",
      country_code: "AU",
    },
    startDate: "2024-04-24",
    tags: ["park", "playground", "play space", "family-friendly"],
    imageURL:
      "https://images.squarespace-cdn.com/content/v1/58813c79f7e0ab55271bb525/1713927326541-7H1YIIEB5Q9X5OVGRY0Q/livvis+place.jpg?format=300w",
  },
  {
    name: "ceres playspace: terra wonder, brunswick east",
    description:
      "This awesome and incredibly unique play space re-opened late last year with a very cool new addition - a GINORMOUS millipede! Nature-play focused space suitable for children and families.",
    location: {
      name: "Ceres Playspace: Terra Wonder, Brunswick East",
      city: "Brunswick East",
      country_code: "AU",
    },
    startDate: "2021-01-26",
    tags: [
      "park",
      "playground",
      "nature play",
      "family",
      "sustainable food",
      "support local",
    ],
    imageURL:
      "https://images.squarespace-cdn.com/content/v1/58813c79f7e0ab55271bb525/1611630712355-T85MC7LIXX3V5TTMOLMN/terra+wonder+excerpt.jpg?format=300w",
  },
  {
    name: "Lavender Rain Park, Donnybrook",
    description:
      "How cool is this?! With a 4-level climbing tower, giant slide, basketball court and other fun equipment, the Lavender Rain Park in Donnybrook is a playground to visit.",
    location: {
      name: "Lavender Rain Park",
      city: "Donnybrook",
      country_code: "AU",
    },
    startDate: "2025-06-12",
    tags: ["park", "playground", "basketball courts"],
  },
  {
    name: "Brimbank Park, Keilor East",
    description:
      "The feature 'playscape' area is excellent - with swings, a giant pea pod, cow park bench, an alphabet maze, a HUGE platypus and so much more. There are trees to clamber and climb for nature lovers. This playground and parkland is beautifully integrated into nature with highlights dotted throughout to uncover and surprise you and the kids. Recommended to take your time here — somewhere to spend a good couple of hours.",
    location: {
      name: "Brimbank Park",
      formattedAddress: "Brimbank Park, Keilor East, Melbourne, Australia",
      city: "Keilor East",
      country_code: "AU",
    },
    startDate: "2019-02-04",
    tags: ["park", "playground", "playscape", "nature", "family-friendly"],
    imageURL:
      "https://images.squarespace-cdn.com/content/v1/58813c79f7e0ab55271bb525/1652073869816-PHAPBDOTL17MN6CVWTSU/brimbank+park+excerpt.jpg?format=300w",
  },
  {
    name: "Allard Park playground and pump track, Brunswick East",
    description:
      "Allard Park in Brunswick East has a playground and a mini pump track to enjoy. Features include a playground area and a small pump/bike track suitable for children. Read more on the original page for directions and details.",
    location: {
      name: "Allard Park",
      city: "Brunswick East",
      country_code: "AU",
    },
    startDate: "2025-01-20",
    tags: ["park", "playground", "pump track", "bike track"],
    imageURL:
      "https://images.squarespace-cdn.com/content/v1/58813c79f7e0ab55271bb525/1737339640486-F0RJUDJ7LGZU8C5006PG/20250120_131813.jpg?format=300w",
  },
  {
    name: "Lincoln Square Playground, Carlton",
    description:
      "This is a very special new playground - set on the site of what was formerly Melbourne’s oldest playground.",
    location: {
      name: "Lincoln Square Playground",
      city: "Carlton",
      country_code: "AU",
    },
    startDate: "2023-06-21",
    tags: [
      "park",
      "playground",
      "nature play",
      "new playgrounds",
      "melbourne playgrounds",
      "great outdoors",
      "family adventures",
    ],
    imageURL:
      "https://images.squarespace-cdn.com/content/v1/58813c79f7e0ab55271bb525/1687336594724-4SP7F95GML1O4CKTRB38/lincoln+park%2C+carlton+-+mamma+knows+north+-+copyright-14.jpg?format=300w",
  },
  {
    name: "Seabrook Reserve Playground, Broadmeadows",
    description:
      "NEW PLAYGROUND! At Seabrook Reserve Playground you can enjoy some serious slide action, the highest-flying nest swing you’ve ever seen, and time and energy consuming obstacle courses - one space has a series of rope and net structures to climb and navigate through, another with balance beams and poles with stilts to scramble across! Plus more!",
    location: {
      name: "Seabrook Reserve Playground, Broadmeadows",
      country_code: "AU",
    },
    startDate: "2023-05-05",
    tags: ["park", "playground", "parks and playgrounds"],
    imageURL:
      "https://images.squarespace-cdn.com/content/v1/58813c79f7e0ab55271bb525/1683270666180-8Y7A7KF06NOM1RPJA5YM/seabrook+reserve+playground%2C+broadmeadows+-+cover%2C+copyright+2023+mamma+knows+melbourne-2.jpg?format=300w",
  },
  {
    name: "De Chene Reserve, Coburg",
    description:
      "Who doesn’t love a wooden hidden gem? Parks like this bring Mamma right back to her own childhood of running up and down the boardwalks and playing tiggy with friends. Read more: https://mammaknowsnorth.com.au/parks-and-playgrounds/de-chene-reserve-coburg",
    location: {
      name: "De Chene Reserve",
      city: "Coburg",
    },
    startDate: "2023-08-27",
    tags: ["park", "playground", "outdoors", "family-friendly"],
    imageURL:
      "https://images.squarespace-cdn.com/content/v1/58813c79f7e0ab55271bb525/1693133526936-9CPDS2WF3PN0HMF7GOJM/de+chene.jpg?format=300w",
  },
  {
    name: "Civic Drive Playspace, Greensborough",
    description:
      "Civic Drive Playspace in Greensborough features a large concrete snake sculpture winding through the playspace. Family-friendly outdoor playground; caution note about the large concrete snake. Article link: https://mammaknowsnorth.com.au/parks-and-playgrounds/civic-drive-playspace-greensborough",
    location: {
      name: "Civic Drive Playspace, Greensborough",
      city: "Greensborough",
      country_code: "AU",
    },
    startDate: "2019-02-18",
    tags: ["park", "playground", "sculpture", "family", "outdoor"],
    imageURL:
      "https://images.squarespace-cdn.com/content/v1/58813c79f7e0ab55271bb525/1550482895296-OYOKTGMPBU0XP4K186XH/03+Civic+Drive+Playspace%2C+Greensborough+-+Mamma+Knows+North+%281+of+18%29.jpg?format=300w",
  },
  {
    name: "Gumnut Park and Adventure Playground, Donnybrook",
    description:
      "Adventure play with a toddler section, BBQ/picnic area and an on-site cafe. Inspired by May Gibbs’ Gumnut Babies (Snugglepot & Cuddlepie) and set among native red gum trees. Large nature-backed adventure playground suitable for families and young children.",
    location: {
      name: "Gumnut Park and Adventure Playground",
      city: "Donnybrook",
      country_code: "AU",
    },
    startDate: "2024-10-15",
    tags: [
      "park",
      "playground",
      "adventure-playground",
      "toddler-friendly",
      "picnic",
      "cafe",
      "family",
      "outdoors",
    ],
    imageURL:
      "https://images.squarespace-cdn.com/content/v1/58813c79f7e0ab55271bb525/1732064701949-13328L3TY11JYRZDLI4F/Gumnut+Adventure+Park+Donnybrook-9.jpg?format=300w",
  },
  {
    name: "green gully reserve, keilor downs",
    description:
      "Officially opening later in the year, the upgraded playground at Green Gully Reserve is a real treat. The whole area is very spacious with plenty of room for picnics, ball games and to just generally spread your wings!",
    location: {
      name: "Green Gully Reserve",
      city: "Keilor Downs",
    },
    startDate: "2019-07-08",
    tags: [
      "park",
      "playground",
      "brimbank playgrounds",
      "treetops park",
      "aurora",
      "wollert",
    ],
    imageURL:
      "https://images.squarespace-cdn.com/content/v1/58813c79f7e0ab55271bb525/1562475106455-NQG4HA911PE3LFE3LFIV/green+gully+exerpt.jpg?format=300w",
  },
  {
    name: "Curtain Square, Carlton North",
    description:
      "With green open space, gorgeous mature trees, a variety of places to play - This park ticks all of Mamma's playground fun boxes!",
    location: {
      name: "Curtain Square, Carlton North",
      city: "Carlton North",
      country_code: "AU",
    },
    startDate: "2017-05-02",
    tags: [
      "park",
      "playground",
      "parks and playgrounds",
      "curtain square",
      "carlton",
    ],
    imageURL:
      "https://images.squarespace-cdn.com/content/v1/58813c79f7e0ab55271bb525/1492571956668-D4MA2VQJCICO4XJOGJ3D/curtain+square+excerpt.jpg?format=300w",
  },
  {
    name: "Wylie Reserve Playground, Brunswick West",
    description:
      "Wylie Reserve Playground in Brunswick West has had a recent upgrade. It is fully fenced and family-friendly, offering playground equipment and safe enclosed play. The playground sits within the Merri-Bek Council area and is suitable for young children and families.",
    location: {
      name: "Wylie Reserve Playground",
      city: "Brunswick West",
      country_code: "AU",
    },
    startDate: "2023-08-27",
    tags: ["park", "playground", "fenced playgrounds", "north playgrounds"],
    imageURL:
      "https://images.squarespace-cdn.com/content/v1/58813c79f7e0ab55271bb525/1693131735551-Z8UE90WLZWM8NKYHP9C0/wylie+reserve+playground%2C+brunswick+west+-+mamma+knows+north+-+copyright-5.jpg?format=300w",
  },
  {
    name: "Carlton Gardens playspaces, Carlton",
    description:
      "A play day at the museum deserves another treat - a play at the playground! Article on Mamma Knows North highlighting the Carlton Gardens playspace; page provides limited facility/address details.",
    location: {
      name: "Carlton Gardens",
      city: "Carlton",
      country_code: "AU",
    },
    startDate: "2018-05-07",
    tags: ["park", "playground", "playspace", "family"],
    imageURL:
      "https://images.squarespace-cdn.com/content/v1/58813c79f7e0ab55271bb525/1525654090059-DUN16NHUUHYDLKAGX0K5/02+Carlton+Gardens+%281+of+14%29.jpg?format=300w",
  },
  {
    name: "Fisher Reserve, Brunswick East",
    description:
      "Fisher Reserve in Brunswick East has had an upgrade and looks fantastic. Large fully fenced play space with plenty for toddlers and little ones to enjoy. Suitable for families with toddlers; big open grassy areas and new playground equipment. Read more on the original article.",
    location: {
      name: "Fisher Reserve",
      city: "Brunswick East",
      country_code: "AU",
    },
    startDate: "2024-08-07",
    tags: [
      "park",
      "playground",
      "toddler playground",
      "family-friendly",
      "fenced",
      "upgraded",
    ],
    imageURL:
      "https://images.squarespace-cdn.com/content/v1/58813c79f7e0ab55271bb525/1722926845310-5ENCKXFGZ1R0NOJO5JZ7/fisher+reserve+brunswick-09.jpg?format=300w",
  },
  {
    name: "Copper Butterfly Playspace, Eltham",
    description:
      "A playspace with a message - the significance of the Eltham Copper Butterfly. Article published May 01, 2017 by Mandy Couzens. Read more on the site for full details.",
    location: {
      name: "Copper Butterfly Playspace",
      city: "Eltham",
      country_code: "AU",
    },
    startDate: "2017-05-01",
    tags: ["park", "playground", "butterfly", "nillumbik"],
    imageURL:
      "https://images.squarespace-cdn.com/content/v1/58813c79f7e0ab55271bb525/1493608290231-AHNRW73N2CFB3O8AQJGF/Butterfly3.jpg?format=300w",
  },
  {
    name: "Bundoora All Abilities Playspace, Bundoora",
    description:
      "The All Abilities Playspace right next door to Bundoora Park Farm is a farm themed adventure. The article includes photos and a short write-up about the playspace.",
    location: {
      name: "Bundoora All Abilities Playspace",
      city: "Bundoora",
      country_code: "AU",
    },
    startDate: "2017-05-01",
    tags: ["park", "playground", "all abilities", "farm", "family"],
    imageURL:
      "https://images.squarespace-cdn.com/content/v1/58813c79f7e0ab55271bb525/1486029175555-GGHZDKPQH0YDHC7ZYL84/bundoora+playspace2.jpg?format=300w",
  },
  {
    name: "Coronet Park, Flemington",
    description:
      "Coronet Park is a very sweet little suburban park nestled between the Stables Community Cafe and neighbouring homes. Article published April 19, 2017 by Mandy Couzens. Limited details on facilities provided on page.",
    location: {
      name: "Coronet Park",
      city: "Flemington",
      country_code: "AU",
    },
    startDate: "2017-04-19",
    tags: ["park", "playground", "parks and playgrounds"],
    imageURL:
      "https://images.squarespace-cdn.com/content/v1/58813c79f7e0ab55271bb525/1493584552575-SSEZXDSI0D5W9C8GT6L9/Screen+Shot+2017-05-01+at+6.35.05+am.png?format=300w",
  },
  {
    name: "seabrook reserve playground, broadmeadows",
    description:
      "NEW PLAYGROUND! At Seabrook Reserve Playground you can enjoy some serious slide action, the highest-flying nest swing you've ever seen, and time and energy consuming obstacle courses - one space has a series of rope and net structures to climb and navigate through, another with balance beams and poles with stilts to scramble across! Plus more!",
    location: {
      name: "Seabrook Reserve Playground",
      city: "Broadmeadows",
      country_code: "AU",
    },
    startDate: "2023-05-05",
    tags: ["park", "playground", "children", "slides", "swings"],
    imageURL:
      "https://images.squarespace-cdn.com/content/v1/58813c79f7e0ab55271bb525/1683270666180-8Y7A7KF06NOM1RPJA5YM/seabrook+reserve+playground%2C+broadmeadows+-+cover%2C+copyright+2023+mamma+knows+melbourne-2.jpg?format=300w",
  },
  {
    name: "Gumnut Park and Adventure Playground, Donnybrook",
    description:
      "Adventure play with a toddler section, BBQ/picnic area and a cafe. Inspired by May Gibbs’ Gumnut Babies and set among native red gum trees, this large nature-based adventure playground is visually impressive and family friendly.",
    location: {
      name: "Gumnut Park and Adventure Playground",
      city: "Donnybrook",
      country_code: "AU",
    },
    startDate: "2024-10-15",
    tags: [
      "park",
      "playground",
      "adventure play",
      "family",
      "cafe",
      "toddler-friendly",
      "picnic",
      "nature",
    ],
    imageURL:
      "https://images.squarespace-cdn.com/content/v1/58813c79f7e0ab55271bb525/1732064701949-13328L3TY11JYRZDLI4F/Gumnut+Adventure+Park+Donnybrook-9.jpg?format=300w",
  },
  {
    name: "Kelvin Thomson Park playground, Pascoe Vale South",
    description:
      "Two side-by-side flying foxes, a playground, a basketball court and large open spaces can be found at Kelvin Thomson Park. Short family-friendly park with play equipment and open grassed areas.",
    location: {
      name: "Kelvin Thomson Park",
      city: "Pascoe Vale South",
      country_code: "AU",
    },
    startDate: "2023-07-14",
    tags: [
      "park",
      "playground",
      "flying fox",
      "basketball",
      "open space",
      "bbq",
    ],
    imageURL:
      "https://images.squarespace-cdn.com/content/v1/58813c79f7e0ab55271bb525/1689316620939-3EOJO8G18GBPMK97BKO1/kelvin.jpg?format=300w",
  },
  {
    name: "Harmony Park, Coburg",
    description:
      "Harmony Park is one of Mamma's most favourite places to visit in the Summer time.....and Winter and Spring and now when I think about it, Autumn too.... ! Read More: https://mammaknowsnorth.com.au/parks-and-playgrounds/harmony-park-pascoe-vale",
    location: {
      name: "Harmony Park",
      city: "Coburg",
      country_code: "AU",
    },
    startDate: "2023-01-19",
    tags: ["park", "playground", "parks and playgrounds", "family", "outdoors"],
    imageURL:
      "https://images.squarespace-cdn.com/content/v1/58813c79f7e0ab55271bb525/1674101045485-OIKAWUG4XTA37SDSS05L/HARMONY.jpg?format=300w",
  },
  {
    name: "JJ Holland Park, Kensington",
    description:
      "Mamma knows from experience that the number one sign that a playground is top quality is when the big kids, parents and carers are joining in on the fun and games! Read More",
    location: {
      name: "JJ Holland Park",
      city: "Kensington",
      country_code: "AU",
    },
    startDate: "2021-06-29",
    tags: [
      "park",
      "playground",
      "the great outdoors",
      "melbourne family adventures",
      "playgrounds",
      "melbourne picnics",
      "melbourne playgrounds",
      "new playgrounds",
      "melbourne mum",
    ],
    imageURL:
      "https://images.squarespace-cdn.com/content/v1/58813c79f7e0ab55271bb525/1624961493171-I0ITJLYSEXTCZ60YVQ47/jj+holland+park%2C+kensington+-+copyright+mamma+knows+melbourne+cover+3.jpg?format=300w",
  },
  {
    name: "level crossing removal — parks and playgrounds",
    description:
      "Tag page listing parks and playgrounds created or upgraded as part of level crossing removal projects in Melbourne North. Contains multiple posts (Donnybrook Park, Penders Park, Darebin Creek Parklands, Bell to Moreland public spaces) describing new or upgraded playgrounds, nature play elements, all-abilities equipment, fenced toddler areas, dog park, basketball courts, outdoor exercise stations, mini skate and parkour equipment, table tennis and bike repair stations. Useful for families seeking upgraded local play spaces and outdoor facilities; articles include photos and short summaries with links to full posts.",
    tags: [
      "park",
      "playground",
      "nature play",
      "family",
      "level crossing removal",
      "outdoors",
      "playgrounds",
      "accessibility",
    ],
    imageURL:
      "https://images.squarespace-cdn.com/content/v1/58813c79f7e0ab55271bb525/1644031356667-PP36QC1J91PIZDURYCO2/donnybrook+park-20.jpg?format=300w",
  },
  {
    name: "Laurimar Drainage Reserve, Doreen",
    description:
      "Hidden pockets of trees and a small creek make this reserve a peaceful, family-friendly spot. The playground is small and cute — good for a quick play or a calm visit in a busy area of Doreen.",
    location: {
      name: "Laurimar Drainage Reserve",
      city: "Doreen",
      country_code: "AU",
    },
    tags: ["park", "playground", "reserve", "family", "nature", "creek"],
    imageURL:
      "https://images.squarespace-cdn.com/content/v1/58813c79f7e0ab55271bb525/1736900853249-Z8BEID7E7Q0MVCJGO7PY/Laurimar+Drainage+Reserve++Mamma+Knows+North+Copyright-2.jpg?format=300w",
  },
  {
    name: "Mt Aitken Reserve & Playground, Greenvale",
    description:
      "This place is a great place to take the kids for a mini hike and play.",
    location: {
      name: "Mt Aitken Reserve & Playground",
      formattedAddress: "Greenvale, Australia",
      city: "Greenvale",
      country_code: "AU",
    },
    startDate: "2024-07-29",
    tags: ["park", "playground", "family-friendly", "nature-walks"],
    imageURL:
      "https://images.squarespace-cdn.com/content/v1/58813c79f7e0ab55271bb525/1722245362533-K76SNQD5ON78PQL9N7RX/mt+aitken+reserve+%26+playground%2C+greenvale+-+mamma+knows+melbourne+-+copyright-9.jpg?format=300w",
  },
  {
    name: "Mitchell Avenue Splash Park, Wangaratta",
    description:
      "When heading up to Victoria’s High Country in the warmer months, Mamma’s crew loves a stop off at Mitchell Avenue Splash Park in Wangaratta. Scattered along the ground are spraying arches to run through, mushroom shaped fountains that toddlers will love, a water channel, water shooters and a dragonfly shaped shower.",
    location: {
      name: "Mitchell Avenue Splash Park",
      street_address: "Mitchell Avenue",
      city: "Wangaratta",
      country_code: "AU",
    },
    startDate: "2025-01-28",
    tags: ["park", "playground", "splash park", "water play", "family"],
    imageURL:
      "https://images.squarespace-cdn.com/content/v1/58813c79f7e0ab55271bb525/1738026322232-8X4W0XJZ7IIQSS0PHGG7/mitchell+avenue+water+play+park+wangaratta-1.jpg?format=300w",
  },
  {
    name: "Eaglehawk Play Space, Eaglehawk (Bendigo)",
    description:
      "This themed play space is about as wonderful as playgrounds can possibly get! Read more on the original post for full details and directions.",
    location: {
      name: "Eaglehawk Play Space",
      city: "Eaglehawk",
      country_code: "AU",
    },
    startDate: "2021-01-05",
    tags: [
      "park",
      "playground",
      "greenspace",
      "the great outdoors",
      "melbourne with kids",
    ],
    imageURL:
      "https://images.squarespace-cdn.com/content/v1/58813c79f7e0ab55271bb525/1609806925486-H5FJ8BZBLP385RRGFB6V/excerpt+bendigo+eaglehawk+play+space.jpg?format=300w",
  },
  {
    name: "Galaxyland Playspace, Sunbury",
    description:
      "You’ll be in another world when you launch into Galaxyland Playspace! (Excerpt from Mamma Knows North article.)",
    location: {
      name: "Galaxyland Playspace",
      city: "Sunbury",
      country_code: "AU",
    },
    startDate: "2024-02-28",
    tags: ["playground", "play space", "park", "family", "outdoor"],
    imageURL:
      "https://images.squarespace-cdn.com/content/v1/58813c79f7e0ab55271bb525/1709086416715-MHUKVWCMJQM70Z18UDUS/galaxy+land+excerpt.jpg?format=300w",
  },
  {
    name: "Greensborough — Parks and Playgrounds",
    description:
      "Collection of park and playground reviews and listings for Greensborough, Melbourne. The page aggregates multiple articles with photos, dates, authors and short summaries about local parks, playgrounds and outdoor family activities.",
    location: {
      name: "Greensborough",
      city: "Melbourne",
      country_code: "AU",
    },
    tags: ["park", "playground", "family", "outdoors"],
    imageURL:
      "https://images.squarespace-cdn.com/content/v1/58813c79f7e0ab55271bb525/b2f2e84e-4829-4119-8286-f9c7da415793/MAMMA-KNOWS-north-LG_CIRCLE.png?format=1500w",
  },
  {
    name: "Rosehill Park Playground, Keilor East",
    description:
      "Rosehill Park Playground in Keilor East has play equipment for all ages, amenities and lots of space for family sports. Features a large climbing structure with a fast slide, ladders, ropes, flying foxes, swings, a sand pit and more. Suitable for family play and children of varied ages.",
    location: {
      name: "Rosehill Park Playground",
      city: "Keilor East",
      country_code: "AU",
    },
    startDate: "2025-08-05",
    tags: ["park", "playground", "swings", "sandpit", "family-friendly"],
  },
  {
    name: "Gumnut Park and Adventure Playground, Donnybrook",
    description:
      "Large adventure playground inspired by May Gibbs’ Gumnut Babies with an adventure play area, separate toddler section, BBQ/picnic facilities and an on-site cafe. Set among native red gum trees with nature-style landscaping; family- and kid-friendly (toddlers upward).",
    location: {
      name: "Gumnut Park and Adventure Playground",
      city: "Donnybrook",
      country_code: "AU",
    },
    startDate: "2024-10-15",
    tags: [
      "park",
      "playground",
      "adventure play",
      "toddler friendly",
      "family",
      "cafe",
      "picnic",
      "bbq",
      "nature",
    ],
    imageURL:
      "https://images.squarespace-cdn.com/content/v1/58813c79f7e0ab55271bb525/1732064701949-13328L3TY11JYRZDLI4F/Gumnut+Adventure+Park+Donnybrook-9.jpg?format=300w",
  },
  {
    name: "Coburg Lake Reserve Coburg North",
    description:
      "Wow! Wow! Wow! If it's fun, exciting and all about adventure you are looking for, then this place is for you. Coburg Lake Reserve is perfect for the WHOLE family.",
    location: {
      name: "Coburg Lake Reserve",
      city: "Coburg North",
      country_code: "AU",
    },
    startDate: "2023-08-02",
    tags: ["park", "playground", "lake", "family", "outdoors"],
    imageURL:
      "https://images.squarespace-cdn.com/content/v1/58813c79f7e0ab55271bb525/1691039180872-TEU0SC4GBOY1XRJJROLI/coburg+lake+reserve%2C+coburg+north+-+copyright+2023+mamma+knows+melbourne-9.jpg?format=300w",
  },
  {
    name: "Hudson Park, Kilmore",
    description:
      "Hudson Park in Kilmore is described as a great space to fill your weekend days. The article (Jan 08, 2024) includes a photo and recommends the park as a family-friendly outdoor visit.",
    location: {
      name: "Hudson Park, Kilmore",
      city: "Kilmore",
      country_code: "AU",
    },
    startDate: "2024-01-08",
    tags: ["park", "playground", "family-friendly", "outdoor"],
    imageURL:
      "https://images.squarespace-cdn.com/content/v1/58813c79f7e0ab55271bb525/1704350593377-MJMPDXTGAI1SJ83KDP9N/hudson+park%2C+kilmore-+mamma+knows+north+-+copyright-18.jpg?format=300w",
  },
  {
    name: "Brimbank Park, Keilor East",
    description:
      "The feature 'playscape' area is excellent - with swings, a giant pea pod, cow park bench, an alphabet maze, a HUGE platypus and many treasures scattered throughout. A few climbable trees and nature-integrated parkland make it great for nature-loving kids. Suitable for a long visit; recommend spending a couple of hours. Full article: https://mammaknowsnorth.com.au/parks-and-playgrounds/brimbankpark",
    location: {
      name: "Brimbank Park, Keilor East",
      city: "Keilor East",
      country_code: "AU",
    },
    startDate: "2019-02-04",
    tags: ["park", "playground", "parks and playgrounds", "family"],
    imageURL:
      "https://images.squarespace-cdn.com/content/v1/58813c79f7e0ab55271bb525/1652073869816-PHAPBDOTL17MN6CVWTSU/brimbank+park+excerpt.jpg?format=300w",
  },
  {
    name: "Coronet Park, Flemington",
    description:
      "Coronet Park is a very sweet little suburban park nestled between the lovely Stables Community Cafe and neighbouring homes. Read More: https://mammaknowsnorth.com.au/parks-and-playgrounds/coronet-park-flemington",
    location: {
      name: "Coronet Park",
      formattedAddress: "Flemington, Melbourne, Australia",
      city: "Flemington",
      country_code: "AU",
    },
    startDate: "2017-04-19",
    tags: ["park", "playground", "parks and playgrounds"],
    imageURL:
      "https://images.squarespace-cdn.com/content/v1/58813c79f7e0ab55271bb525/1493584552575-SSEZXDSI0D5W9C8GT6L9/Screen+Shot+2017-05-01+at+6.35.05+am.png?format=300w",
  },
  {
    name: "All Abilities Play Space and Splash Park, Mill Park",
    description:
      "This incredible northside playground and splash park has been so thoughtfully designed, with careful consultation from local kids and community groups. It’s wonderfully spacious and spread out into zones with play options to suit all ages and abilities.",
    location: {
      name: "All Abilities Play Space and Splash Park, Mill Park",
      city: "Mill Park",
      country_code: "AU",
    },
    startDate: "2021-02-19",
    tags: [
      "park",
      "playground",
      "splash park",
      "water play",
      "family",
      "accessible",
      "outdoors",
      "interesting playgrounds",
    ],
    imageURL:
      "https://images.squarespace-cdn.com/content/v1/58813c79f7e0ab55271bb525/1732154820932-JKTZ6KF37QGN7R9GQAQ8/20241121_130550.jpg?format=300w",
  },
  {
    name: "Gumnut Park and Adventure Playground, Donnybrook",
    description:
      "Adventure play, toddler section, bbq/picnic area and a cafe. This epic adventure playground is inspired by May Gibbs’ Gumnut Babies and set amongst a nature backdrop with red gum trees; highly recommended for families and toddlers.",
    location: {
      name: "Gumnut Park and Adventure Playground",
      city: "Donnybrook",
      country_code: "AU",
    },
    startDate: "2024-10-15",
    tags: [
      "park",
      "playground",
      "cafe",
      "family",
      "toddler-friendly",
      "adventure-playground",
      "picnic-area",
    ],
    imageURL:
      "https://images.squarespace-cdn.com/content/v1/58813c79f7e0ab55271bb525/1732064701949-13328L3TY11JYRZDLI4F/Gumnut+Adventure+Park+Donnybrook-9.jpg?format=300w",
  },
  {
    name: "Anderson Reserve, Coburg",
    description:
      "Bright, fresh, recently upgraded toddler playground at Anderson Reserve, Coburg. Fully fenced and suitable for toddlers and preschoolers. Posted June 07, 2020 by Rebekah Beare.",
    location: {
      name: "Anderson Reserve",
      city: "Coburg",
      country_code: "AU",
    },
    startDate: "2020-06-07",
    tags: [
      "park",
      "playground",
      "toddler",
      "fully fenced",
      "nature play",
      "local",
    ],
    imageURL:
      "https://images.squarespace-cdn.com/content/v1/58813c79f7e0ab55271bb525/1591506944725-MFEN4FWJLEBCNZ0NE7DI/excerpt+anderson+reserve.jpg?format=300w",
  },
  {
    name: "Gardiner Reserve, North Melbourne",
    description:
      "Mamma says this park is super cute even though it has lots of spiders! But at least they’re the playful and sculptural kind - phew! Short review excerpt from the article (author: Mamma Erin, April 12, 2019).",
    location: {
      name: "Gardiner Reserve, North Melbourne",
      city: "North Melbourne",
      country_code: "AU",
    },
    startDate: "2019-04-12",
    tags: ["park", "playground", "family", "outdoors", "easter"],
    imageURL:
      "https://images.squarespace-cdn.com/content/v1/58813c79f7e0ab55271bb525/1555033357513-V3QV5RQCDG5HKY8TNTDB/3+Gardiner+Reserve+North+Melbourne+-+Mamma+Knows+North+%281+of+17%29.jpg?format=300w",
  },
  {
    name: "Kingsford Smith Ulm Reserve, Glenroy",
    description:
      "Kingsford Smith has a new play space offering nature play and play equipment catering for a broad range of ages and abilities. Suitable for families, the reserve features mixed nature-play elements and standard playground equipment.",
    location: {
      name: "Kingsford Smith Ulm Reserve",
      city: "Glenroy",
      country_code: "AU",
    },
    startDate: "2023-08-14",
    tags: ["park", "playground", "nature play", "family-friendly"],
    imageURL:
      "https://images.squarespace-cdn.com/content/v1/58813c79f7e0ab55271bb525/1691973522334-4PND33Q9ZT6T7BVC1ZR6/kingsford.jpg?format=300w",
  },
  {
    name: "Kingsford Smith Ulm Reserve, Glenroy",
    description:
      "Kingsford Smith has a new play space offering nature play and play equipment catering for a broad range of ages and abilities. Suitable for families seeking varied play experiences. Read the full article: https://mammaknowsnorth.com.au/parks-and-playgrounds/kingsford-smith-ulm-reserve-glenroy",
    location: {
      name: "Kingsford Smith Ulm Reserve, Glenroy",
      city: "Glenroy",
      country_code: "AU",
    },
    startDate: "2023-08-14",
    tags: ["park", "playground", "nature play", "family", "inclusive"],
    imageURL:
      "https://images.squarespace-cdn.com/content/v1/58813c79f7e0ab55271bb525/1691973522334-4PND33Q9ZT6T7BVC1ZR6/kingsford.jpg?format=300w",
  },
  {
    name: "CB Smith Reserve, Fawkner",
    description:
      "CB Smith Reserve in Fawkner has had a glow up and Mamma is so impressed. A brand new double climbing tower, massive sandpit, a set of 4 swings plus a rope web swing, floor spinner and musical flowers.",
    location: {
      name: "CB Smith Reserve",
      city: "Fawkner",
      country_code: "AU",
    },
    startDate: "2025-03-06",
    tags: [
      "park",
      "playground",
      "great outdoors",
      "melbourne family adventures",
      "new playgrounds",
      "public spaces",
    ],
    imageURL:
      "https://images.squarespace-cdn.com/content/v1/58813c79f7e0ab55271bb525/1741222534232-B2NV9JBKKK3C6ANGK6I8/CB+Smith+Reserve+Fawkner-3.jpg?format=300w",
  },
  {
    name: "Galaxyland Playspace, Sunbury",
    description:
      "You’ll be in another world when you launch into Galaxyland Playspace! This upgraded playground boasts lots of vast play areas for all age groups, with plenty of pathways to dash around on a scooter.",
    location: {
      name: "Galaxyland Playspace",
      formattedAddress: "Sunbury, Australia",
      city: "Sunbury",
      country_code: "AU",
    },
    startDate: "2024-02-28",
    tags: ["park", "playground", "adventure", "family"],
    imageURL:
      "https://images.squarespace-cdn.com/content/v1/58813c79f7e0ab55271bb525/1709086416715-MHUKVWCMJQM70Z18UDUS/galaxy+land+excerpt.jpg?format=300w",
  },
  {
    name: "Gumnut Park and Adventure Playground, Donnybrook",
    description:
      "Adventure play, toddler section, bbq/picnic area and a cafe. Inspired by May Gibbs’ Gumnut Babies Snugglepot & Cuddlepie and set amongst a nature backdrop including red gum trees. Read More",
    location: {
      name: "Gumnut Park and Adventure Playground",
      city: "Donnybrook",
      country_code: "AU",
    },
    startDate: "2024-10-15",
    tags: [
      "park",
      "playground",
      "cafe",
      "kid friendly cafes",
      "playground with cafe",
      "family",
      "adventure",
      "toddler-friendly",
    ],
    imageURL:
      "https://images.squarespace-cdn.com/content/v1/58813c79f7e0ab55271bb525/1732064701949-13328L3TY11JYRZDLI4F/Gumnut+Adventure+Park+Donnybrook-9.jpg?format=300w",
  },
  {
    name: "Heathcote Play Space at Barrack Reserve, Heathcote",
    description:
      "Winery-themed playground located at Barrack Reserve in the Heathcote wine region. The article notes it will delight wine-loving parents and highlights the playground's winery theme.",
    location: {
      name: "Barrack Reserve, Heathcote",
      formattedAddress: "Barrack Reserve, Heathcote, Australia",
      city: "Heathcote",
      country_code: "AU",
    },
    startDate: "2024-09-23",
    tags: ["park", "playground", "winery", "vineyard"],
    imageURL:
      "https://images.squarespace-cdn.com/content/v1/58813c79f7e0ab55271bb525/1727075242455-NBIMIWARATMDI3EDKFT2/heathcote%2Bplay%2Bspace%2B-9.jpg?format=300w",
  },
  {
    name: "Ford Park, Bellfield (Ivanhoe)",
    description:
      "This playground in Ivanhoe has it ALL! Short listing with photo and link to the full article. Page includes tags such as playgrounds and banyule playgrounds.",
    location: {
      name: "Ford Park, Bellfield (Ivanhoe)",
      city: "Bellfield (Ivanhoe)",
      country_code: "AU",
    },
    startDate: "2019-04-23",
    tags: ["park", "playground"],
    imageURL:
      "https://images.squarespace-cdn.com/content/v1/58813c79f7e0ab55271bb525/1555976921612-2V88X0ZXHWP8GJK57Q8P/ford+park+front.jpg?format=300w",
  },
  {
    name: "Hopwood Gardens Playground, Echuca",
    description:
      "Every road trip means a new playground to explore, including the paddle steamer park in Echuca. This wonderful and petite playground is found in the centre of town, close to the Murray River and historical port.",
    location: {
      name: "Hopwood Gardens Playground",
      city: "Echuca",
      country_code: "AU",
    },
    startDate: "2021-05-23",
    tags: [
      "park",
      "playground",
      "road trip",
      "family",
      "picnic",
      "outdoors",
      "melbourne",
    ],
    imageURL:
      "https://images.squarespace-cdn.com/content/v1/58813c79f7e0ab55271bb525/1621744023353-2QXTLUSPPQE07VXP9R42/01+Hopwood+Gardens+Echuca+-+Copyright+Mamma+Knows+North+%281+of+27%29.jpg?format=300w",
  },
  {
    name: "Hudson Park, Kilmore",
    description:
      "Hudson Park in Kilmore is a great space to fill your weekend days.",
    location: {
      name: "Hudson Park",
      formattedAddress: "Kilmore, Australia",
      city: "Kilmore",
      country_code: "AU",
    },
    startDate: "2024-01-08",
    tags: ["park", "playground", "outdoor", "family"],
    imageURL:
      "https://images.squarespace-cdn.com/content/v1/58813c79f7e0ab55271bb525/1704350593377-MJMPDXTGAI1SJ83KDP9N/hudson+park%2C+kilmore-+mamma+knows+north+-+copyright-18.jpg?format=300w",
  },
  {
    name: "JJ Holland Park, Kensington",
    description:
      "Article about JJ Holland Park in Kensington. Notes that a top playground is one where older kids, parents and carers join in the fun. Recommended for families; includes a photo and tags.",
    location: {
      name: "JJ Holland Park",
      city: "Kensington",
      country_code: "AU",
    },
    startDate: "2021-06-29",
    tags: ["park", "playground", "family", "outdoors", "picnic"],
    imageURL:
      "https://images.squarespace-cdn.com/content/v1/58813c79f7e0ab55271bb525/1624961493171-I0ITJLYSEXTCZ60YVQ47/jj+holland+park%2C+kensington+-+copyright+mamma+knows+melbourne+cover+3.jpg?format=500w",
  },
  {
    name: "howitt park playground, bright",
    description:
      "Playgrounds don’t get much more stunning than this. This largely timber adventure playground sits on the banks of the Ovens River and is surrounded by the grand old trees that Bright is famous for, changing colours with the seasons.",
    location: {
      name: "Howitt Park Playground",
      city: "Bright",
      country_code: "AU",
    },
    startDate: "2021-05-31",
    tags: [
      "park",
      "playground",
      "the great outdoors",
      "family adventures",
      "picnic",
      "road trip",
      "new playgrounds",
    ],
    imageURL:
      "https://images.squarespace-cdn.com/content/v1/58813c79f7e0ab55271bb525/1621821579894-UUBL9I1XEOVS9T9OUVM6/Centenary+Park+Bright++2021+Copyright+Mamma+Knows+Melbourne+%2837+of+37%29.jpg?format=300w",
  },
  {
    name: "level crossing — parks and playgrounds",
    description:
      'Tag page on Mamma Knows North listing parks & playgrounds posts tagged "level crossing." The page contains multiple article excerpts (titles, dates, authors, thumbnails), site navigation, social links, subscription prompt and adverts. Useful for finding playground/park posts related to level crossing projects and nearby public spaces.',
    tags: [
      "park",
      "playground",
      "level crossing",
      "nature play",
      "the great outdoors",
      "melbourne playgrounds",
      "new playgrounds",
      "public spaces",
      "family adventures",
    ],
    imageURL:
      "https://images.squarespace-cdn.com/content/v1/58813c79f7e0ab55271bb525/b2f2e84e-4829-4119-8286-f9c7da415793/MAMMA-KNOWS-north-LG_CIRCLE.png?format=1500w",
  },
  {
    name: "Porto Kallo Playground, Donnybrook",
    description:
      "Porto Kallo Playground has many features for kids: a ropes course, balancing towers, musical chimes, trampoline, butterfly rocker, giant hamster wheel and a rolling tube slide. Also includes slides, swings, a spinning seesaw and a pump track. Suitable for a range of ages; the site highlights many play elements to keep children entertained.",
    location: {
      name: "Porto Kallo Playground",
      city: "Donnybrook",
      country_code: "AU",
    },
    startDate: "2024-11-26",
    tags: [
      "park",
      "playground",
      "pump track",
      "ropes course",
      "swings",
      "slides",
    ],
    imageURL:
      "https://images.squarespace-cdn.com/content/v1/58813c79f7e0ab55271bb525/1732615980142-GJP9W85I4DHQWEKMER6A/20241126_210500.jpg?format=300w",
  },
  {
    name: "Jones Park, Brunswick East",
    description:
      "An inner north city park with all the outer city perks! Read More",
    location: {
      name: "Jones Park",
      city: "Brunswick East",
      country_code: "AU",
    },
    startDate: "2024-09-29",
    tags: ["park", "playground"],
    imageURL:
      "https://images.squarespace-cdn.com/content/v1/58813c79f7e0ab55271bb525/1727570272529-HO10HVAWVZ6FR4E4J6KQ/jones.jpg?format=300w",
  },
  {
    name: "Derby St Reserve, Tullamarine",
    description:
      "Derby St Reserve in Tullamarine is more than a playground: the reserve features a large BMX track, tennis courts, basketball/netball/futsal courts and an outdoor gym for adults. Suitable for families and children; multiple sporting facilities available onsite.",
    location: {
      name: "Derby St Reserve",
      city: "Tullamarine",
    },
    startDate: "2025-06-05",
    tags: [
      "park",
      "playground",
      "futsal court",
      "bmx track",
      "tennis courts",
      "basketball courts",
      "outdoor gym",
    ],
    imageURL:
      "https://images.squarespace-cdn.com/content/v1/58813c79f7e0ab55271bb525/1749446649542-FKWVOMAW07TF75DA38HO/Untitled+design+%286%29.jpg?format=300w",
  },
  {
    name: "Mitchell Avenue Splash Park, Wangaratta",
    description:
      "When heading up to Victoria’s High Country in the warmer months, Mamma’s crew loves a stop off at Mitchell Avenue Splash Park in Wangaratta. Scattered along the ground are spraying arches to run through, mushroom-shaped fountains toddlers will love, a water channel, water shooters and a dragonfly-shaped shower. Facilities mentioned include water play features and nearby BBQs; suitable for young children and families.",
    location: {
      name: "Mitchell Avenue Splash Park",
      city: "Wangaratta",
      state_province: "VIC",
      country_code: "AU",
    },
    startDate: "2025-01-28",
    tags: [
      "park",
      "playground",
      "splash park",
      "water play",
      "water slide",
      "bbq",
      "flying fox",
      "road trips",
    ],
    imageURL:
      "https://images.squarespace-cdn.com/content/v1/58813c79f7e0ab55271bb525/1738026322232-8X4W0XJZ7IIQSS0PHGG7/mitchell+avenue+water+play+park+wangaratta-1.jpg?format=300w",
  },
];

interface FetchFoxResponse {
  job_id: string;
  results: {
    items: Array<{
      name: string;
      description?: string;
      location?: {
        name?: string;
        formattedAddress?: string;
        street_address?: string;
        city?: string;
        state_province?: string;
        postal_code?: string;
        country_code?: string;
      };
      startDate?: string;
      endDate?: string;
      tags?: string[];
      imageURL?: string;
      _url?: string;
      _htmlUrl?: string;
    }>;
  };
  metrics?: Record<string, unknown>;
  artifacts?: unknown[];
}

const MAX_PAGES = 150;
const MAX_DEPTH = 99;

/**
 * Scrape a website using FetchFox's /scrape endpoint
 */
async function scrapeFetchFox(
  url: string,
  maxPages: number,
  maxDepth: number,
  maxExtractions: number,
  tagsHint?: string[],
): Promise<RawActivity[]> {
  try {
    // Validate URL format
    const urlObj = new URL(url);
    // Create a pattern for FetchFox - use ** wildcard to match all subpaths
    const pattern = `${urlObj.href}/**`;

    console.log(`[FetchFox] Starting scrape for pattern: ${pattern}`);

    // Build template matching RawActivity structure
    const template = {
      name: "The name or title of the activity",
      description: "Detailed description of the activity",
      location: {
        name: "Location name",
        formattedAddress: "Full address",
        street_address: "Street address component",
        city: "City",
        state_province: "State or province",
        postal_code: "Postal or ZIP code",
        country_code: "ISO 3166-1 alpha-2 country code (e.g., US, CA, GB)",
      },
      startDate: "Start date in ISO 8601 format",
      endDate: "End date in ISO 8601 format",
      tags: [
        `Categories or tags for the activity, don't include anything related to the address. keep me more theme oriented. ${tagsHint ? `make sure you include these if suited: ${tagsHint.join(", ")}` : ""}`,
      ],
      imageURL: "URL of the primary image for this activity",
    };

    const response = await fetch("https://api.fetchfox.ai/api/scrape", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${env.FETCHFOX_API_KEY}`,
      },
      body: JSON.stringify({
        pattern,
        start_urls: [urlObj.origin],
        template,
        max_visits: maxPages,
        max_depth: maxDepth,
        max_extracts: maxExtractions,
        content_transform: "slim_html",
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`FetchFox API error (${response.status}): ${errorText}`);
    }

    const data = (await response.json()) as FetchFoxResponse;

    if (!data.results?.items) {
      console.log("[FetchFox] No items found in response");
      return [];
    }

    // Map FetchFox items to RawActivity format
    const activities: RawActivity[] = data.results.items.map((item) => ({
      name: item.name,
      description: item.description,
      location: item.location,
      startDate: item.startDate,
      endDate: item.endDate,
      tags: item.tags,
      imageURL: item.imageURL,
    }));

    console.log(`[FetchFox] Extracted ${activities.length} activities`);
    console.table(data.metrics);

    return activities;
  } catch (error) {
    console.error("[FetchFox] Scraping failed:", error);
    if (error instanceof Error) {
      throw new Error(`FetchFox scraping failed: ${error.message}`);
    }
    throw new Error("FetchFox scraping failed with unknown error");
  }
}

/**
 * Scrape a website and extract activity data using Firecrawl
 */
export const scrapeWebsite = internalAction({
  args: {
    url: v.string(),
    maxDepth: v.optional(v.number()),
    maxPages: v.optional(v.number()),
    maxExtractions: v.optional(v.number()),
    tagsHint: v.optional(v.array(v.string())),
    useMockScrape: v.optional(v.boolean()),
  },
  handler: async (_ctx, args): Promise<RawActivity[]> => {
    // If mock scrape is enabled, return the mock activities constant
    if (args.useMockScrape) {
      console.log(
        `[Mock] Using mock scrape data (${MOCK_ACTIVITIES_2.length} activities)`,
      );
      return MOCK_ACTIVITIES_2;
    }

    // Validate URL format
    try {
      new URL(args.url);
    } catch {
      throw new Error(`Invalid URL format: ${args.url}`);
    }

    const maxDepth = args.maxDepth || MAX_DEPTH;
    const maxPages = args.maxPages || MAX_PAGES;
    const maxExtractions = args.maxExtractions || MAX_PAGES;
    console.log(`Starting scrape for URL: ${args.url}`);
    console.table({ args });

    const results = await Promise.allSettled([
      scrapeFetchFox(
        args.url,
        maxPages,
        maxDepth,
        maxExtractions,
        args.tagsHint,
      ),
      // runFirecrawl(args.url, maxPages),
    ]);

    // Extract results
    const fetchfoxResult = results[0];

    // Return FetchFox results (as requested)
    if (fetchfoxResult.status === "fulfilled") {
      return fetchfoxResult.value;
    } else {
      // If FetchFox failed, throw the error
      throw new Error(
        `FetchFox scraping failed: ${fetchfoxResult.reason instanceof Error ? fetchfoxResult.reason.message : "Unknown error"}`,
      );
    }
  },
});

/**
 * Scrape a website and store the raw activities in storage
 * Returns the storage ID
 */
export const scrapeWebsiteAndStore = internalAction({
  args: {
    url: v.string(),
    maxDepth: v.optional(v.number()),
    maxPages: v.optional(v.number()),
    maxExtractions: v.optional(v.number()),
    tagsHint: v.optional(v.array(v.string())),
    useMockScrape: v.optional(v.boolean()),
    workflowId: v.string(),
  },
  handler: async (ctx, args): Promise<Id<"_storage">> => {
    // Scrape the website
    const rawActivities = await ctx.runAction(internal.scraping.scrapeWebsite, {
      url: args.url,
      maxDepth: args.maxDepth,
      maxPages: args.maxPages,
      maxExtractions: args.maxExtractions,
      tagsHint: args.tagsHint,
      useMockScrape: args.useMockScrape,
    });

    // Store the raw activities in storage
    const storageId = await ctx.runAction(internal.storageHelpers.storeJsonData, {
      data: rawActivities,
      filename: `workflow-${args.workflowId}-raw-activities.json`,
    });

    return storageId;
  },
});
