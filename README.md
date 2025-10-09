# Tiny Tripper

## Concept

Recommend the BEST activity to do at a given point in time - in Melbourne

## Audience

Parents in Melbourne

## Time Spent

50 hrs ++++++

## TODO

- [ ] Try importing a set of activities from Mama Knows North.
- [ ] PUSH TO PEOPLE
- [ ] Filters [Home or away] [indoor or outdoor].
- [ ] better search
- [ ] add image generation for activities
- [ ] ask your location to give distance
- [ ] hide activities
- [ ] kid table with nap
- [ ] BACKEND - hook in "what's on page" to constantly scrape information
- [ ] ping the weather to better recommend
- [ ] cleverly suggest tags when creating a activity
- [ ] comes with option tailored to your preferences

## Tech

full-stack app using:

- [Convex](https://convex.dev/) as your backend (database, server logic)
- [React](https://react.dev/) as your frontend (web page interactivity)
- [Next.js](https://nextjs.org/) for optimized web hosting and page routing
- [Tailwind](https://tailwindcss.com/) for building great looking accessible UI
- [Clerk](https://clerk.com/) for authentication

## What's on websites

- https://melbournewithsiri.com.au/events-whats-on-in-melbourne/
- mamaKnows

## Scraping

### Use cases

#### Bulk import

- suppose to run once
- heavy handed

#### Change Tracking

Track specific page for the latest up to date information

- firecrawl - changeTracking

#### Instagram

- apify?

### Scraper

- [FIRECRAWL](https://www.firecrawl.dev/pricing) - can pay as you go or monthly - TBD 200activities might be $14
- [ScraperAPI](https://www.scraperapi.com/pricing/) - $49/month
- [apify](https://apify.com/store/categories?sortBy=popularity) for insta + other stuff
