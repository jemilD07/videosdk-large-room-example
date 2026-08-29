# VideoSDK Large Room Example (React)

A large-room video conferencing demo built on the
[official VideoSDK React example](https://github.com/videosdk-live/videosdk-rtc-react-sdk-example),
extended to implement every recommendation in VideoSDK's
[Handle Large Rooms](https://docs.videosdk.live/react/guide/best-practices/handle-large-rooms) guide.

## What's added

- **Pagination** with a per-breakpoint page cap — 4 tiles on mobile, 6 on tablet, 9 on desktop
- **Active-speaker priority** so whoever is talking is always on the visible page
- **Grid, spotlight and sidebar** layouts
- **Per-tile quality tiers** via `setQuality`
- **Stream pause/resume** for participants scrolled off the current page

All of it lives in [`src/largeRoom/`](src/largeRoom). Everything else — joining screen,
bottom bar, chat, screen share — is the stock example, unmodified.

See **[LARGE_ROOM.md](LARGE_ROOM.md)** for a recommendation-by-recommendation map of
what the guide asks for and where each piece is implemented.

## Setup

Requires a [VideoSDK account](https://app.videosdk.live/signup) (free tier includes $20 credit).

```bash
git clone https://github.com/jemilD07/videosdk-large-room-example.git
cd videosdk-large-room-example
npm install
```

Copy the env template and add your credentials:

```bash
cp .env.example .env
```

Set **either** a static token or an auth server URL in `.env`:

```
REACT_APP_VIDEOSDK_TOKEN = "your-token-here"
# or
REACT_APP_AUTH_URL = "https://your-auth-server"
```

Generate a temporary token from the [VideoSDK dashboard](https://app.videosdk.live/api-keys).
For production, use an authentication server rather than a static token.

## Run

```bash
npm start
```

Opens on [http://localhost:3000](http://localhost:3000). Join the same meeting ID from
several tabs or devices to see pagination and active-speaker priority in action.

## Build

```bash
npm run build
```

## Stack

React 19, `@videosdk.live/react-sdk` 1.1.1, Create React App, Tailwind CSS.
