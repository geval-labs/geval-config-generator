# Geval config generator

A small **Next.js** web app to create **Geval-compatible** `contract.yaml` and `policy.yaml` files from forms—no manual YAML editing. Runs fully in the browser (no backend).

This project is **independent** of the Geval Rust crate: it only emits YAML that matches the formats Geval parses. After download, validate with the real engine:

```bash
geval validate-contract contract.yaml path/to/other-policy.yaml
geval check --contract contract.yaml --signals signals.json
```

## Develop

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Build

```bash
npm run build
npm start
```

## Deploy on Vercel

1. Push this folder to its own Git repository (or use a monorepo and set the **Root Directory** in Vercel to `geval-config-generator`).
2. [Vercel](https://vercel.com) → **Add New Project** → import the repo.
3. Framework preset: **Next.js**. No environment variables required.
4. Deploy.

Output is static-friendly; the app works as a standard Next.js deployment.

## Schema drift

If Geval’s contract/policy YAML shape changes, update `lib/schemas.ts` and `lib/geval-yaml.ts` here, or adopt a shared JSON Schema published from the Geval repo (see planning notes in your main project).

## License

MIT (same spirit as Geval; adjust as you prefer).
