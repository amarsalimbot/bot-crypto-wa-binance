FROM node:20

WORKDIR /app

COPY package.json package-lock.json ./

RUN npm ci --omit=dev

COPY . .

# Membuka port untuk Railway/Hugging Face keep-alive
EXPOSE 7860

CMD ["node", "wa.js"]
