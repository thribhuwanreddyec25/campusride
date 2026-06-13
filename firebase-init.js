// CampusRide — shared Firebase bootstrap.
// Must load AFTER the firebase-*-compat SDKs and BEFORE auth.js / rides.js.
(function () {
  var FIREBASE_CONFIG = {
    apiKey:            "AIzaSyChLbBhiHASeZhZUeS6z5MVZS-kuz3n_z4",
    authDomain:        "campusride-6fde9.firebaseapp.com",
    databaseURL:       "https://campusride-6fde9-default-rtdb.asia-southeast1.firebasedatabase.app",
    projectId:         "campusride-6fde9",
    storageBucket:     "campusride-6fde9.firebasestorage.app",
    messagingSenderId: "515150635202",
    appId:             "1:515150635202:web:5db627a027ab1219fb9b5b"
  };
  if (!firebase.apps.length) firebase.initializeApp(FIREBASE_CONFIG);
})();
