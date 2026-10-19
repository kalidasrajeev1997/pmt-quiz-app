# Quiz App

# Development Setup

- start dev server: `npm run dev`
- run test cases with coverage: `npm run test:coverage`
- node version: 23.x
- build command: `npm run build`

# Seed Data

- The seed data is kept as json in the src/data.
- The seed data is initialized into the indexedDB if data is not available in the indexedDB.
- The seed data can be reset by going to the setting tab in the app.

# Architectural Decisions

state management:

- `useState`: All the states that can be kept close to the component is handled through useState in the app.
- `useContext`: Instead using redux or zustand. Which would make the app bloated for just a small app, i have lean towards context api to manage all the states that is needed throughout the app.
- `tanstack/query`: All queries and data mutations are handled through tanstack. This make the code structured and give us caching, loading and error states. It also structures the code to invalidate any query based on our conditions.

styling:

- I have used `tailwindcss` to style all the html elements and animations in the app.
- Since `@shadcn/ui` goes every well with tailwind, I have used shadcn. Its open source as well. It also performs well if we want SSR. And all the components are very clean and has good hierarchy of design. Also, we can add only the components we need from the registry.

routing:

- `@tanstack/router`: Chosen for typesafe navigation, this gives us the error during runtime itself. It also provides us with built-in param validation, navigation blocking and route level loading. I have used code level routing rather than file level. tanstack router provides both conventions.

forms:

- `React Hook Form + Zod`: Used React Hook Form to manage forms and Zod for validation. They work well together, and React Hook Form integrates well with shadcn/ui. Formik was also an option, but I chose React Hook Form because it fits well with the existing stack.

# Data Services

indexed DB with queries and mutations

- I have structured the services to only fetch the data from the queries of the indexed DB. There is small changes in the mentioned functions:
  - getQuizzes(userId, country?) --> getQuizzes(page ,pageSize, userId, country status). I have added pagination and status level filtering.
  - getQuiz(quizId) --> getQuiz(quizId, userId, now). This would give the quiz session of the user of a particular quiz.
  - All the other services are same with the time parameter passed.

# Assumptions, Limitations and Improvements

Assumptions: If the admin edits the quiz, the user is not allowed continue. This is the follow we have currently setup.

Limitations: Mainly limitations are the data mocking, all the data operations are served and stored through the client itself. Due to this there can raise conditions across multiple tabs.
User cannot go back or attempt any question for the second time.

Improvements: I have bring review mode before user submits the quiz.

# AI usage

- `Google stitch`: The wiring framing and design brainstorming was mainly done in google stitch.
- `Antigravity`: Test cases, accessibility tags all were done through antigravity with gemini 3.8.
- `Github copilot`: Boilerplate codes of the components were made using copilot with mostly using gpt-sol. As well as most of the indexedDB queries and mutations were made with copilot.
- All the folder structuring, file structuring were made without ai.

# Bonus points

- I have done
  - dark mode
  - options reording
  - code splitting
  - demo link
