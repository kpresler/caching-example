# Caching Demo

This project offers a simple demo of caching using Redis.  Based on some much older work, so don't use this as an example of good JS development practices ;)


## To Run:
- Clone this repository (`git clone $URL`)
- All must be manually installed is NodeJS.  Download and install [from here](https://nodejs.org/en/)
- Use Node to install the necessary dependencies.  After cloning the project, `cd` into the folder and run `npm i`
- Run the code: `node main.js`


## What can I do?
- Look up cat facts: `localhost:3000/catfact/{X}` from your web browser
- Enable to disable the cache: `localhost:3000/cacheStatus/toggle` (toggles the cache from whatever status it was in, to the opposite; note: normally you'd want this to be a POST request, this is done to make it easier for testing)
- Check the cache status: `localhost:3000/cacheStatus`
- Create self-destructing messages: `localhost:3000/set`
- Check the self-destructing message: `localhost:3000/get` (note; this is only valid after the above call)


Main takeaways:
- Redis, and similar tools like memcached, can be used to temporarily cache things
- Generally you'll set a maximum lifetime on the cached items, saying they are only valid for a certain period of time.  This is because caching is useful for *temporarily* storing information, but you need to go check occasionally to make sure that the thing that it's caching hasn't changed.  This is the self-destructing message.
- Caching can be used to save slow & expensive actions.  In practice, reading in the text file here is about as fast as making the request to Redis on my system upstairs, we I've added a bit of artificial delay to the non-cached version.  But, imagine a more expensive calculation, and caching can save you from doing this regularly.