export const environment = {
  production: false,
  // firebase: {
  //   apiKey: "AIzaSyB5R-JcuT9hIGtYDlpYj6YQctBhBMp45MU",
  //   authDomain: "reviewsnewfirebase-d8586.firebaseapp.com",
  //   projectId: "reviewsnewfirebase-d8586",
  //   storageBucket: "reviewsnewfirebase-d8586.firebasestorage.app",
  //   messagingSenderId: "429359893911",
  //   appId: "1:429359893911:web:ba7ad7ffb14e896a0e48d2"
  // },
  firebase: {
    apiKey: "AIzaSyDmLAAv9DKXv7z0luA__xr0pJA8N50B5UM",
    authDomain: "reviewsfirebase-13fac.firebaseapp.com",
    projectId: "reviewsfirebase-13fac",
    storageBucket: "reviewsfirebase-13fac.appspot.com",
    messagingSenderId: "331059573942",
    appId: "1:331059573942:web:0482595644f7b71783a217"
  },
  // Solo estos correos pueden iniciar sesión con Google
  correosAutorizados: [
    'sergiogallardo2697@gmail.com'
  ] as string[]
};
