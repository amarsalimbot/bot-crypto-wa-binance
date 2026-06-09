FROM node:20

WORKDIR /app

COPY package.json package-lock.json ./

RUN npm ci --omit=dev

COPY . .

# Membuka port yang diwajibkan oleh Hugging Face
EXPOSE 7860

CMD ["node", "wa.js"]
