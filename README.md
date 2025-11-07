# Welcome to your Lovable project

## Project info

**URL**: https://lovable.dev/projects/21040d9b-b4ab-438c-974f-ace33b343cd0

## How can I edit this code?

There are several ways of editing your application.

**Use Lovable**

Simply visit the [Lovable Project](https://lovable.dev/projects/21040d9b-b4ab-438c-974f-ace33b343cd0) and start prompting.

Changes made via Lovable will be committed automatically to this repo.

**Use your preferred IDE**

If you want to work locally using your own IDE, you can clone this repo and push changes. Pushed changes will also be reflected in Lovable.

The only requirement is having Node.js & npm installed - [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating)

Follow these steps:

```sh
# Step 1: Clone the repository using the project's Git URL.
git clone <YOUR_GIT_URL>

# Step 2: Navigate to the project directory.
cd <YOUR_PROJECT_NAME>

# Step 3: Install the necessary dependencies.
npm i

# Step 4: Start the development server with auto-reloading and an instant preview.
npm run dev
```

**Edit a file directly in GitHub**

- Navigate to the desired file(s).
- Click the "Edit" button (pencil icon) at the top right of the file view.
- Make your changes and commit the changes.

**Use GitHub Codespaces**

- Navigate to the main page of your repository.
- Click on the "Code" button (green button) near the top right.
- Select the "Codespaces" tab.
- Click on "New codespace" to launch a new Codespace environment.
- Edit files directly within the Codespace and commit and push your changes once you're done.

## What technologies are used for this project?

This project is built with:

- Vite
- TypeScript
- React
- shadcn-ui
- Tailwind CSS

## Weather map layers (OpenWeather)

To enable meteorological layers (wind, precipitation, clouds) on the interactive map:

- Obtain an API key from OpenWeatherMap (`https://openweathermap.org/api`).
- Set the key in `.env` as `VITE_OPENWEATHERMAP_API_KEY="YOUR_KEY_HERE"`.
- Restart the dev server if it is running.

In the Dashboard's map, use the in-map controls to toggle between:

- `Vento`: shows wind overlay.
- `Chuva`: shows precipitation overlay.
- `Sol`: uses cloud cover as a proxy for sun exposure.

If no key is configured, the base map will render but layers remain disabled with a notification.

## How can I deploy this project?

Simply open [Lovable](https://lovable.dev/projects/21040d9b-b4ab-438c-974f-ace33b343cd0) and click on Share -> Publish.

## Can I connect a custom domain to my Lovable project?

Yes, you can!

To connect a domain, navigate to Project > Settings > Domains and click Connect Domain.

Read more here: [Setting up a custom domain](https://docs.lovable.dev/features/custom-domain#custom-domain)
