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

Crie um serviço **Web Service** usando o `Dockerfile` deste repositório. Configure as variáveis de ambiente com a URL pública da API e a chave do Google Maps:

```env
VITE_API_URL=https://fit-academia-api.onrender.com/api/v1
GOOGLE_MAPS_API_KEY=sua_chave_do_google_maps
```

As variáveis são injetadas quando o container inicia, portanto podem ser alteradas sem recompilar o frontend. Cadastre a chave como segredo no painel do Render; ela não deve ser enviada ao Git.
