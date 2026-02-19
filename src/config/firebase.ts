import { configDotenv } from "dotenv";
import "dotenv/config";
import admin from "firebase-admin";

configDotenv();

admin.initializeApp({
  credential: admin.credential.cert({
    projectId: process.env.FIREBASE_PROJECT_ID as string,
    clientEmail: process.env.FIREBASE_CLIENT_EMAIL as string,
    privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(
      /\\n/g,
      "\n",
    ) as string,
  }),
});

export const db = admin.firestore();

// import { configDotenv } from "dotenv";
// import admin from "firebase-admin"

// configDotenv();

// admin.initializeApp({
//   credential: admin.credential.cert({
//     type: process.env.FIREBASE_TYPE,
//     project_id: process.env.FIREBASE_PROJECT_ID,
//     private_key_id: process.env.FIREBASE_PRIVATE_KEY_ID,
//     private_key: process.env.FIRBASE_PRIVATE_KEY,
//     client_email: process.env.FIREBASE_CLIENT_EMAIL,
//     client_id: process.env.FIREBASE_CLIENT_ID,
//     auth_uri: process.env.FIREBASE_AUTH_URL,
//     token_uri: process.env.FIREBASE_TOKEN_URI,
//     auth_provider_x509_cert_url: process.env.FIREBASE_AUTH_PROVIDER,
//     client_x509_cert_url: process.env.FIREBASE_CLIENT,
//     universe_domain: process.env.FIREBASE_UNIVERSE_DOMAIN,
//   }),
// });

// const db = admin.firestore();
