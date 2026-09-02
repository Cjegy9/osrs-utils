import { initializeApp } from 'firebase/app'
import { getDatabase } from 'firebase/database'

// Firebase web config is a public client identifier, not a secret — access
// control is enforced by the Realtime Database security rules, not by
// hiding these values.
const firebaseConfig = {
  apiKey: 'AIzaSyDuJwmRMyr1qamZB09OEva9Ntt7wCtg1vc',
  authDomain: 'osrs-utilities.firebaseapp.com',
  databaseURL: 'https://osrs-utilities-default-rtdb.firebaseio.com',
  projectId: 'osrs-utilities',
  storageBucket: 'osrs-utilities.firebasestorage.app',
  messagingSenderId: '543934798095',
  appId: '1:543934798095:web:5e607c35587c02ad37867a',
}

const app = initializeApp(firebaseConfig)
export const db = getDatabase(app)
