databases:
  - name: vitalis-db
    plan: free
    databaseName: vitalis
    user: vitalis

services:
  - type: web
    name: vitalis-backend
    runtime: node
    plan: free
    rootDir: backend
    buildCommand: npm install
    startCommand: npm start
    healthCheckPath: /health
    envVars:
      - key: NODE_ENV
        value: production
      - key: JWT_SECRET
        generateValue: true
      - key: JWT_EXPIRES_IN
        value: 30d
      - key: DATABASE_URL
        fromDatabase:
          name: vitalis-db
          property: connectionString
      - key: CLIENT_ORIGIN
        value: https://vitalis-frontend.onrender.com

  - type: web
    name: vitalis-frontend
    runtime: static
    rootDir: frontend
    buildCommand: npm install && npm run build
    staticPublishPath: dist
    envVars:
      - key: VITE_API_URL
        value: https://vitalis-backend.onrender.com
    routes:
      - type: rewrite
        source: /*
        destination: /index.html
