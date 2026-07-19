# Fit Academia Web

Frontend independente da plataforma Fit Academia, desenvolvido com React e Vite.

## Desenvolvimento local

```bash
cp .env.example .env.local
npm install
npm run dev
```

Defina `VITE_API_URL` com a URL completa da API, incluindo `/api/v1`.

```env
VITE_API_URL=http://localhost:8000/api/v1
```

## Deploy no Render

Crie um serviço **Web Service** usando o `Dockerfile` deste repositório. Configure a variável de ambiente `VITE_API_URL` com a URL pública da API, por exemplo:

```env
VITE_API_URL=https://fit-academia-api.onrender.com/api/v1
```

A URL é injetada quando o container inicia, portanto pode ser alterada sem recompilar o frontend.
