# ArogyaRakshak 2.0

Welcome to the ArogyaRakshak 2.0 project! This guide will help you set up and run the application locally on your machine.

## Prerequisites

Before you begin, ensure you have the following installed:
- [Node.js](https://nodejs.org/) (which comes with `npm`)
- [Git](https://git-scm.com/)

## Getting Started

Follow these steps to get a local copy up and running.

### 1. Clone the repository

Open your terminal or command prompt and run the following command to clone the repository to your local machine:

```bash
git clone https://github.com/HemarubiniAnandan/arogyarakshak2.0.git
cd arogyarakshak2.0
```

### 2. Set up the Server (Backend)

Open a new terminal window or tab, navigate to the `server` directory, install the dependencies, and start the development server:

```bash
cd server
npm install
npm run dev
```

The server should now be running locally. 

### 3. Set up the Client (Frontend)

Open a new terminal window or tab, navigate to the `client` directory, install the dependencies, and start the application:

```bash
cd client
npm install
npm run dev
```

The client application will typically provide a local URL (e.g., `http://localhost:5173/` or `http://localhost:3000/`) in the console. Open that URL in your browser to view the application!

## Typical Development Workflow

Whenever you want to run the project locally for development, make sure to spin up both the client and server concurrently in two separate terminal tabs using `npm run dev` within their respective folders.
